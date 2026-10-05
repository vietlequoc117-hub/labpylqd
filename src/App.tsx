import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layers,
  TrendingUp,
  Sparkles,
  Terminal as TerminalIcon,
  HelpCircle,
  Code2,
  Maximize2,
  Minimize2,
  PlayCircle,
  Cpu,
  FileCode,
  Variable,
  BookOpen,
  BarChart2,
} from 'lucide-react';

import { Header } from './components/Header';
import { CodeEditor } from './components/CodeEditor';
import { Controls } from './components/Controls';
import { StudentVariableWatcher } from './components/StudentVariableWatcher';
import { VietnameseAlgorithmExplainer } from './components/VietnameseAlgorithmExplainer';
import { ComplexityDashboard } from './components/ComplexityDashboard';
import { TerminalOutput } from './components/TerminalOutput';
import { ComplexityMatrixTable } from './components/ComplexityMatrixTable';
import { ArrayBarVisualizer } from './components/ArrayBarVisualizer';

import { PRESETS } from './presets';
import { TraceStep, TraceResult, ComplexityReport } from './types';
import { executeTrace, getPyodide } from './services/traceService';
import { lintPythonCode } from './services/pythonLinter';

export default function App() {
  // Preset & Code state
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESETS[0].id);
  const [code, setCode] = useState<string>(PRESETS[0].code);

  // Execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const playTimerRef = useRef<any>(null);

  // Complexity & AI state
  const [complexityReport, setComplexityReport] = useState<ComplexityReport | null>(null);
  const [isLoadingComplexity, setIsLoadingComplexity] = useState<boolean>(false);
  const complexityCacheRef = useRef<Map<string, ComplexityReport>>(new Map());

  // Pyodide readiness
  const [pyodideReady, setPyodideReady] = useState<boolean>(false);
  const [engine, setEngine] = useState<'auto' | 'pyodide' | 'backend'>('auto');

  // Standard input (stdin) for user code using input()
  const [stdinInput, setStdinInput] = useState<string>(PRESETS[0].defaultStdin || '');
  const [uncalledFunctionHint, setUncalledFunctionHint] = useState<string | null>(null);
  const [finalStdout, setFinalStdout] = useState<string>('');

  // UI state: defaults to Array Bar Chart matching user request!
  const [activeTab, setActiveTab] = useState<'barchart' | 'variables' | 'algorithm' | 'complexity'>('barchart');

  const currentPreset = PRESETS.find((p) => p.id === selectedPresetId);

  // Pre-load Pyodide WebAssembly in the background
  useEffect(() => {
    getPyodide().then((p) => {
      if (p) setPyodideReady(true);
    });
  }, []);

  // Run Trace & Analysis
  const handleRunCode = useCallback(async (codeToRun?: string, presetIdOverride?: string, customStdin?: string) => {
    let targetCode = codeToRun || code;
    const targetPresetId = presetIdOverride || selectedPresetId;
    const targetStdin = customStdin !== undefined ? customStdin : stdinInput;

    // Smart Auto-Invocation: If user defines a 0-argument function without calling it at the top-level, auto-append call
    const fn0ParamMatch = targetCode.match(/^\s*def\s+([a-zA-Z0-9_]+)\s*\(\s*\)\s*:/m);
    if (fn0ParamMatch) {
      const fnName = fn0ParamMatch[1];
      const lines = targetCode.split('\n');
      const hasTopLevelCall = lines.some((l) => {
        const trimmed = l.trim();
        return (
          !trimmed.startsWith('#') &&
          !l.startsWith(' ') &&
          !l.startsWith('\t') &&
          (trimmed === `${fnName}()` || trimmed.startsWith(`${fnName}(`))
        );
      });
      if (!hasTopLevelCall) {
        targetCode = targetCode.trimEnd() + `\n\n# Tự động gọi hàm để chạy chương trình:\n${fnName}()\n`;
        setCode(targetCode);
      }
    }

    setIsRunning(true);
    setExecutionError(null);
    setIsPlaying(false);

    // Kiểm tra cú pháp thời gian thực trước khi gửi cho Python runner
    const lintRes = lintPythonCode(targetCode);
    if (!lintRes.isValid) {
      const firstErr = lintRes.errors[0];
      setExecutionError(firstErr.message + (firstErr.suggestion ? ` (👉 ${firstErr.suggestion})` : ''));
      setSteps([]);
      setCurrentStepIndex(0);
      setIsRunning(false);
      return;
    }

    try {
      // 1. Run Python execution tracer with code and stdin
      const result: TraceResult = await executeTrace(targetCode, engine, targetStdin);

      if (result.error && (!result.steps || result.steps.length === 0)) {
        setExecutionError(result.error);
        setSteps([]);
        setCurrentStepIndex(0);
        setIsRunning(false);
        return;
      }

      setSteps(result.steps || []);
      setCurrentStepIndex(0);
      setFinalStdout(result.stdout || '');

      // Check if user defined a function but forgot to call it at the bottom
      if (
        result.steps &&
        result.steps.length <= 2 &&
        /def\s+([a-zA-Z0-9_]+)\s*\(/.test(targetCode)
      ) {
        const fnMatch = targetCode.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
        const fnName = fnMatch ? fnMatch[1] : '';
        const bodyWithoutDef = targetCode.replace(/def\s+[a-zA-Z0-9_]+\s*\(.*?\)\s*:/, '');
        if (fnName && !new RegExp(`(^|\\s)${fnName}\\s*\\(`, 'm').test(bodyWithoutDef)) {
          setUncalledFunctionHint(fnName);
        } else {
          setUncalledFunctionHint(null);
        }
      } else {
        setUncalledFunctionHint(null);
      }

      // 2. Fetch Gemini Complexity analysis (Check client cache first to save quota)
      const cacheKey = `${targetPresetId}:${targetCode.trim()}`;
      if (complexityCacheRef.current.has(cacheKey)) {
        setComplexityReport(complexityCacheRef.current.get(cacheKey)!);
      } else {
        setIsLoadingComplexity(true);
        fetch('/api/gemini/complexity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: targetCode, presetId: targetPresetId }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data && !data.error) {
              complexityCacheRef.current.set(cacheKey, data);
              setComplexityReport(data);
            }
          })
          .catch((err) => console.error('Gemini complexity fetch error:', err))
          .finally(() => setIsLoadingComplexity(false));
      }
    } catch (err: any) {
      setExecutionError(err.message || 'Lỗi không xác định khi thực thi code.');
      setSteps([]);
    } finally {
      setIsRunning(false);
    }
  }, [code, engine, selectedPresetId, stdinInput]);

  // Initial auto-run on first load
  useEffect(() => {
    handleRunCode(PRESETS[0].code, PRESETS[0].id);
  }, []);

  // Switch preset
  const handleSelectPreset = (presetId: string) => {
    const found = PRESETS.find((p) => p.id === presetId);
    if (found) {
      setSelectedPresetId(presetId);
      setCode(found.code);
      const targetStdin = found.defaultStdin || '';
      setStdinInput(targetStdin);
      if (presetId === 'complexity-comparison') {
        setActiveTab('complexity');
      }
      handleRunCode(found.code, presetId, targetStdin);
    }
  };

  // Reset code to current preset default
  const handleResetCode = () => {
    const found = PRESETS.find((p) => p.id === selectedPresetId);
    if (found) {
      setCode(found.code);
      handleRunCode(found.code, selectedPresetId);
    }
  };

  // Helper to append function call to code and run
  const handleAppendFunctionCall = (fnName: string) => {
    const updated = code.trimEnd() + `\n\n${fnName}()\n`;
    setCode(updated);
    setUncalledFunctionHint(null);
    handleRunCode(updated, selectedPresetId);
  };

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, steps.length, speed]);

  const currentStep: TraceStep | undefined = steps[currentStepIndex];
  const prevStep: TraceStep | undefined = currentStepIndex > 0 ? steps[currentStepIndex - 1] : undefined;

  // Dual-line highlighting calculations
  const justExecutedLine = currentStep?.line_number;
  const nextExecutingLine =
    currentStepIndex < steps.length - 1
      ? steps[currentStepIndex + 1]?.line_number
      : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation Bar */}
      <Header
        onSelectPreset={handleSelectPreset}
        selectedPresetId={selectedPresetId}
        onRunCode={() => handleRunCode()}
        isRunning={isRunning}
        engine={engine}
        onChangeEngine={setEngine}
        pyodideReady={pyodideReady}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-5 flex flex-col gap-4">
        {/* 2-Column Split: Left = Code & Output; Right = Controls, Variables & Visualizer Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-stretch">
          {/* LEFT COLUMN: Code Editor & Terminal (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="flex-1 min-h-[380px] lg:min-h-[500px]">
              <CodeEditor
                code={code}
                onChange={setCode}
                justExecutedLine={justExecutedLine}
                nextExecutingLine={nextExecutingLine}
                onReset={handleResetCode}
                onNewCode={() => handleSelectPreset('custom-code')}
                error={executionError}
                stdinInput={stdinInput}
                onStdinChange={setStdinInput}
                onRunCode={() => handleRunCode(undefined, undefined, stdinInput)}
                uncalledFunctionHint={uncalledFunctionHint}
                onCallFunction={handleAppendFunctionCall}
              />
            </div>

            {/* Terminal Output */}
            <TerminalOutput
              stdout={currentStep?.stdout || ''}
              finalStdout={finalStdout}
              onJumpToEnd={() => setCurrentStepIndex(Math.max(0, steps.length - 1))}
            />
          </div>

          {/* RIGHT COLUMN: Controls + Interactive Tabs (Variables / Memory / Pseudocode / Complexity / Tutor) (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-md overflow-x-auto">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('barchart')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'barchart'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 ring-1 ring-sky-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Biểu Đồ Cột (Như Hình)</span>
                  <span className="text-[10px] font-normal opacity-85 hidden sm:inline">(Trực quan)</span>
                </button>

                <button
                  onClick={() => setActiveTab('variables')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'variables'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-1 ring-emerald-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Variable className="w-3.5 h-3.5" />
                  <span>Theo Dõi Biến</span>
                  <span className="text-[10px] font-normal opacity-85 hidden sm:inline">(Dễ hiểu)</span>
                </button>

                <button
                  onClick={() => setActiveTab('algorithm')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'algorithm'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 ring-1 ring-amber-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Giải Thích Thuật Toán</span>
                  <span className="text-[10px] font-normal opacity-85 hidden sm:inline">(Tiếng Việt)</span>
                </button>

                <button
                  onClick={() => setActiveTab('complexity')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'complexity'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                  <span>Độ phức tạp</span>
                  {complexityReport && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono">
                      {complexityReport.timeComplexity}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Step Navigation & Controls Bar: Docked directly above the Variable Watcher */}
            <div className="sticky top-16 z-20 shadow-md">
              <Controls
                currentStepIndex={currentStepIndex}
                totalSteps={steps.length}
                onGoToStep={setCurrentStepIndex}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                speed={speed}
                onChangeSpeed={setSpeed}
                currentStep={currentStep}
              />
            </div>

            {/* Tab Views Content */}
            <div className="flex-1 flex flex-col">
              {activeTab === 'barchart' && (
                <ArrayBarVisualizer
                  currentStep={currentStep}
                  prevStep={prevStep}
                  currentStepIndex={currentStepIndex}
                  totalSteps={steps.length}
                  allSteps={steps}
                  onGoToStep={setCurrentStepIndex}
                  onNextStep={() => setCurrentStepIndex((c) => Math.min(steps.length - 1, c + 1))}
                  onPrevStep={() => setCurrentStepIndex((c) => Math.max(0, c - 1))}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  code={code}
                />
              )}

              {activeTab === 'variables' && (
                <StudentVariableWatcher
                  currentStep={currentStep}
                  prevStep={prevStep}
                  currentStepIndex={currentStepIndex}
                  totalSteps={steps.length}
                  code={code}
                  onNextStep={() => setCurrentStepIndex((c) => Math.min(steps.length - 1, c + 1))}
                  onPrevStep={() => setCurrentStepIndex((c) => Math.max(0, c - 1))}
                />
              )}

              {activeTab === 'algorithm' && (
                <VietnameseAlgorithmExplainer
                  algorithmId={selectedPresetId}
                  algorithmTitle={selectedPresetId === 'custom-code' ? 'Bài toán tự nhập của bạn' : currentPreset?.title}
                  algorithmCategory={selectedPresetId === 'custom-code' ? 'Tự do sáng tạo' : currentPreset?.category}
                  customCode={code}
                  presetPseudocode={selectedPresetId === 'custom-code' ? undefined : currentPreset?.pseudocode}
                  activePythonLine={justExecutedLine || nextExecutingLine}
                />
              )}

              {activeTab === 'complexity' && (
                <div className="flex flex-col gap-4">
                  {selectedPresetId === 'complexity-comparison' && (
                    <ComplexityMatrixTable />
                  )}
                  <ComplexityDashboard
                    complexityReport={complexityReport}
                    isLoading={isLoadingComplexity}
                    onRefresh={() => {
                      setIsLoadingComplexity(true);
                      fetch('/api/gemini/complexity', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code, presetId: selectedPresetId }),
                      })
                        .then((r) => r.json())
                        .then((data) => setComplexityReport(data))
                        .finally(() => setIsLoadingComplexity(false));
                    }}
                    steps={steps}
                    currentStepIndex={currentStepIndex}
                  />
                  {selectedPresetId !== 'complexity-comparison' && (
                    <ComplexityMatrixTable />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>PyViz Lab &bull; Trực quan hóa thuật toán và theo dõi biến Python cho học sinh</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Theo dõi biến</span>
            <span>&bull;</span>
            <span>Thuật toán Tiếng Việt</span>
            <span>&bull;</span>
            <span>Độ phức tạp Big-O</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
