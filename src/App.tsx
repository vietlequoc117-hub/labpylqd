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
import { ThonnyShell } from './components/ThonnyShell';
import { ComplexityMatrixTable } from './components/ComplexityMatrixTable';
import { ArrayBarVisualizer } from './components/ArrayBarVisualizer';
import { AlgorithmQuiz } from './components/AlgorithmQuiz';
import { HighSchoolAITutor } from './components/HighSchoolAITutor';

import { PRESETS } from './presets';
import { TraceStep, TraceResult, ComplexityReport, ShellSegment } from './types';
import { executeTrace, getPyodide } from './services/traceService';
import { lintPythonCode } from './services/pythonLinter';
import { filterAlgorithmicSteps } from './utils/stepFilter';
import { PRESET_COMPLEXITY_MAP, analyzeComplexityHeuristically } from './complexityData';

const DEFAULT_PRESET = PRESETS.find((p) => p.id === 'custom-code') || PRESETS[0];

export default function App() {
  // Preset & Code state (Mặc định chọn '★ Tự do nhập Code & Dữ liệu của bạn')
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DEFAULT_PRESET.id);
  const [code, setCode] = useState<string>(DEFAULT_PRESET.code);

  const isThonnyMode = selectedPresetId === 'custom-code';

  // Execution state (raw steps & smart algorithmic filtered steps)
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [rawSteps, setRawSteps] = useState<TraceStep[]>([]);
  const [stepMode, setStepMode] = useState<'algorithmic' | 'all'>('algorithmic');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Thonny interactive execution state (chỉ dùng cho chế độ Tự do nhập Code)
  const [interactiveInputs, setInteractiveInputs] = useState<string[]>([]);
  const [waitingInput, setWaitingInput] = useState<boolean>(false);
  const [waitingLine, setWaitingLine] = useState<number | undefined>(undefined);
  const [waitingPrompt, setWaitingPrompt] = useState<string | undefined>(undefined);
  const [waitingVar, setWaitingVar] = useState<string | undefined>(undefined);
  const [latestShellSegments, setLatestShellSegments] = useState<ShellSegment[]>([]);
  const [isThonnyStepping, setIsThonnyStepping] = useState<boolean>(false);
  const thonnyStepTimerRef = useRef<any>(null);

  // Bộ lọc Bước Thuật Toán (Algorithmic Steps: loại bỏ micro-steps rác, giữ đúng nhịp so sánh và hoán đổi)
  const filterResult = React.useMemo(() => {
    return filterAlgorithmicSteps(rawSteps, code);
  }, [rawSteps, code]);

  const steps = React.useMemo(() => {
    if (isThonnyMode) {
      return rawSteps;
    }
    return stepMode === 'algorithmic' ? filterResult.steps : rawSteps;
  }, [isThonnyMode, stepMode, filterResult, rawSteps]);

  // Chuyển đổi mượt mà giữa chế độ Thuật toán (~20 bước) và Chi tiết (~60 dòng)
  const handleToggleStepMode = useCallback(() => {
    setStepMode((prev) => {
      const nextMode = prev === 'algorithmic' ? 'all' : 'algorithmic';
      if (nextMode === 'all') {
        const rawIdx = filterResult.rawIndexMap[currentStepIndex] ?? 0;
        setCurrentStepIndex(rawIdx);
      } else {
        const filtIdx = filterResult.filteredIndexMap[currentStepIndex] ?? 0;
        setCurrentStepIndex(filtIdx);
      }
      return nextMode;
    });
  }, [currentStepIndex, filterResult]);

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
  const [stdinInput, setStdinInput] = useState<string>(DEFAULT_PRESET.defaultStdin || '');
  const [uncalledFunctionHint, setUncalledFunctionHint] = useState<string | null>(null);
  const [finalStdout, setFinalStdout] = useState<string>('');
  const [hasRun, setHasRun] = useState<boolean>(false);

  // UI state: defaults to Array Bar Chart matching user request!
  const [activeTab, setActiveTab] = useState<'barchart' | 'variables' | 'algorithm' | 'quiz' | 'complexity' | 'ai-tutor'>('barchart');

  const currentPreset = PRESETS.find((p) => p.id === selectedPresetId);

  // Pre-load Pyodide WebAssembly in the background
  useEffect(() => {
    getPyodide().then((p) => {
      if (p) setPyodideReady(true);
    });
  }, []);

  // Hàm tiến từng bước câu lệnh trong chế độ Thonny (chạy lần lượt từng câu lệnh, gặp input() thì dừng đợi nhập)
  const animateThonnySteps = useCallback((fromIdx: number, toIdx: number) => {
    if (thonnyStepTimerRef.current) {
      clearInterval(thonnyStepTimerRef.current);
      thonnyStepTimerRef.current = null;
    }

    if (toIdx <= fromIdx) {
      setCurrentStepIndex(Math.max(0, toIdx));
      setIsThonnyStepping(false);
      return;
    }

    setCurrentStepIndex(fromIdx);
    setIsThonnyStepping(true);

    thonnyStepTimerRef.current = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= toIdx) {
          if (thonnyStepTimerRef.current) {
            clearInterval(thonnyStepTimerRef.current);
            thonnyStepTimerRef.current = null;
          }
          setIsThonnyStepping(false);
          return toIdx;
        }
        const next = prev + 1;
        if (next >= toIdx) {
          if (thonnyStepTimerRef.current) {
            clearInterval(thonnyStepTimerRef.current);
            thonnyStepTimerRef.current = null;
          }
          setIsThonnyStepping(false);
        }
        return next;
      });
    }, 320);
  }, []);

  useEffect(() => {
    return () => {
      if (thonnyStepTimerRef.current) clearInterval(thonnyStepTimerRef.current);
    };
  }, []);

  // Dừng hoặc xóa màn hình Thonny Shell
  const handleStopThonny = useCallback(() => {
    if (thonnyStepTimerRef.current) {
      clearInterval(thonnyStepTimerRef.current);
      thonnyStepTimerRef.current = null;
    }
    setIsThonnyStepping(false);
    setWaitingInput(false);
    setWaitingLine(undefined);
    setWaitingPrompt(undefined);
    setWaitingVar(undefined);
    setInteractiveInputs([]);
    setLatestShellSegments([]);
    setRawSteps([]);
    setCurrentStepIndex(0);
    setFinalStdout('');
    setExecutionError(null);
    setHasRun(false);
  }, []);

  // Run Trace & Analysis
  const handleRunCode = useCallback(
    async (
      codeToRun?: string,
      presetIdOverride?: string,
      customStdin?: string,
      providedInteractiveInputs?: string[],
      resumeFromStepIdx?: number
    ) => {
      if (thonnyStepTimerRef.current) {
        clearInterval(thonnyStepTimerRef.current);
        thonnyStepTimerRef.current = null;
      }

      setHasRun(true);
      let targetCode = codeToRun || code;
      const targetPresetId = presetIdOverride || selectedPresetId;
      const targetIsThonny = targetPresetId === 'custom-code';
      const targetStdin = customStdin !== undefined ? customStdin : stdinInput;
      const currentInputsList = providedInteractiveInputs !== undefined ? providedInteractiveInputs : [];

      if (targetIsThonny && providedInteractiveInputs === undefined) {
        setInteractiveInputs([]);
        setWaitingInput(false);
        setWaitingLine(undefined);
        setWaitingPrompt(undefined);
        setWaitingVar(undefined);
        setLatestShellSegments([]);
      }

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
        setRawSteps([]);
        setCurrentStepIndex(0);
        setWaitingInput(false);
        setIsRunning(false);
        return;
      }

      try {
        // 1. Run Python execution tracer
        const result: TraceResult = await executeTrace(targetCode, engine, targetStdin, {
          interactiveMode: targetIsThonny,
          interactiveInputs: currentInputsList,
        });

        if (result.error) {
          setExecutionError(result.error);
          setWaitingInput(false);
          setWaitingLine(undefined);
          if (!result.steps || result.steps.length === 0) {
            setRawSteps([]);
            setCurrentStepIndex(0);
            setIsRunning(false);
            return;
          }
        }

        const traceSteps = result.steps || [];
        setRawSteps(traceSteps);
        setFinalStdout(result.stdout || '');
        setLatestShellSegments(result.shell_segments || []);

        if (targetIsThonny) {
          const isWaiting = Boolean(result.waiting_input);
          setWaitingInput(isWaiting);
          setWaitingLine(result.waiting_line);
          setWaitingPrompt(result.waiting_prompt);
          setWaitingVar(result.waiting_var);

          const targetEndIdx = Math.max(0, traceSteps.length - 1);
          const startIdx =
            resumeFromStepIdx !== undefined
              ? Math.min(resumeFromStepIdx, targetEndIdx)
              : 0;

          // Chạy lần lượt từng câu lệnh từ startIdx đến targetEndIdx (nơi có lệnh input tiếp theo hoặc kết thúc bài)
          animateThonnySteps(startIdx, targetEndIdx);
        } else {
          setWaitingInput(false);
          setWaitingLine(undefined);
          setCurrentStepIndex(0);
        }

        // Check if user defined a function but forgot to call it at the bottom
        if (
          !result.waiting_input &&
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

        // 2. Phân tích độ phức tạp Big-O tức thì 100% bằng thuật toán nội bộ
        const instantReport =
          PRESET_COMPLEXITY_MAP[targetPresetId] || analyzeComplexityHeuristically(targetCode);
        setComplexityReport(instantReport);

        // Cập nhật thêm nếu có kết nối server (tùy chọn)
        const cacheKey = `${targetPresetId}:${targetCode.trim()}`;
        if (!complexityCacheRef.current.has(cacheKey)) {
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
            .catch(() => {});
        }
      } catch (err: any) {
        setExecutionError(err.message || 'Lỗi không xác định khi thực thi code.');
        setRawSteps([]);
        setWaitingInput(false);
      } finally {
        setIsRunning(false);
      }
    },
    [code, engine, selectedPresetId, stdinInput, animateThonnySteps]
  );

  // Khi học sinh nhập dữ liệu vào cửa sổ Thonny Shell và nhấn Enter -> chạy tiếp câu lệnh tiếp theo!
  const handleThonnySubmitInput = useCallback(
    (inputValue: string) => {
      const nextInputs = [...interactiveInputs, inputValue];
      setInteractiveInputs(nextInputs);
      const resumeIdx = Math.max(0, rawSteps.length - 1);
      handleRunCode(code, 'custom-code', stdinInput, nextInputs, resumeIdx);
    },
    [interactiveInputs, rawSteps.length, code, stdinInput, handleRunCode]
  );

  // Switch preset
  const handleSelectPreset = (presetId: string) => {
    const found = PRESETS.find((p) => p.id === presetId);
    if (found) {
      if (thonnyStepTimerRef.current) {
        clearInterval(thonnyStepTimerRef.current);
        thonnyStepTimerRef.current = null;
      }
      setSelectedPresetId(presetId);
      setCode(found.code);
      const targetStdin = found.defaultStdin || '';
      setStdinInput(targetStdin);
      setRawSteps([]);
      setCurrentStepIndex(0);
      setFinalStdout('');
      setExecutionError(null);
      setWaitingInput(false);
      setWaitingLine(undefined);
      setInteractiveInputs([]);
      setLatestShellSegments([]);
      setIsThonnyStepping(false);
      setHasRun(false); // Để trống, khi nào ấn Chạy Chương Trình mới hiển thị
      if (presetId === 'complexity-comparison') {
        setActiveTab('complexity');
      }
    }
  };

  // Reset code to current preset default
  const handleResetCode = () => {
    const found = PRESETS.find((p) => p.id === selectedPresetId);
    if (found) {
      if (thonnyStepTimerRef.current) {
        clearInterval(thonnyStepTimerRef.current);
        thonnyStepTimerRef.current = null;
      }
      setCode(found.code);
      setRawSteps([]);
      setCurrentStepIndex(0);
      setFinalStdout('');
      setExecutionError(null);
      setWaitingInput(false);
      setWaitingLine(undefined);
      setInteractiveInputs([]);
      setLatestShellSegments([]);
      setIsThonnyStepping(false);
      setHasRun(false);
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

  const activeFrameVariables = React.useMemo(() => {
    const frame =
      currentStep?.stack_frames?.find((f) => f.is_active) ||
      currentStep?.stack_frames?.[currentStep.stack_frames.length - 1] ||
      currentStep?.stack_frames?.[0];
    return frame?.variables || {};
  }, [currentStep]);

  // Dual-line highlighting calculations
  const justExecutedLine = currentStep?.line_number;
  const nextExecutingLine =
    currentStepIndex < steps.length - 1
      ? steps[currentStepIndex + 1]?.line_number
      : undefined;

  // Các đoạn text hiển thị trong Thonny Shell tính đến bước câu lệnh hiện tại
  const currentShellSegments: ShellSegment[] = React.useMemo(() => {
    if (currentStep?.shell_segments) {
      return currentStep.shell_segments;
    }
    return latestShellSegments;
  }, [currentStep, latestShellSegments]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-800 font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* Top Navigation Bar */}
      <Header
        onSelectPreset={handleSelectPreset}
        selectedPresetId={selectedPresetId}
        onRunCode={() => handleRunCode()}
        isRunning={isRunning}
        engine={engine}
        onChangeEngine={setEngine}
        pyodideReady={pyodideReady}
        onOpenAiTutor={() => setActiveTab((prev) => (prev === 'ai-tutor' ? 'barchart' : 'ai-tutor'))}
        isAiTutorActive={activeTab === 'ai-tutor'}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-5 flex flex-col gap-4">
        {/* 2-Column Split: Left = Code & Output; Right = Controls, Variables & Visualizer Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-stretch">
          {/* LEFT COLUMN: Code Editor & Thonny Shell / Terminal (5 Cols) */}
          <div className={`lg:col-span-5 flex flex-col ${isThonnyMode ? 'gap-1.5' : 'gap-3'}`}>
            <div className="flex-1 min-h-[340px] lg:min-h-[440px]">
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
                isThonnyMode={isThonnyMode}
                waitingInputLine={waitingInput && !isThonnyStepping ? waitingLine : undefined}
                canStepNext={isThonnyMode && hasRun && currentStepIndex < steps.length - 1}
                onStepNext={() => setCurrentStepIndex((c) => Math.min(steps.length - 1, c + 1))}
                onStopThonny={isThonnyMode ? handleStopThonny : undefined}
              />
            </div>

            {/* Chỉ ở chế độ Tự do nhập Code: Hiển thị cửa sổ Shell giống Thonny chạy từng lệnh & nhập trực tiếp */}
            {isThonnyMode ? (
              <ThonnyShell
                hasRun={hasRun}
                isStepping={isThonnyStepping}
                isWaitingInput={waitingInput}
                waitingLine={waitingLine}
                waitingPrompt={waitingPrompt}
                waitingVar={waitingVar}
                currentLine={justExecutedLine}
                shellSegments={currentShellSegments}
                error={executionError}
                currentVariables={activeFrameVariables}
                onSubmitInput={handleThonnySubmitInput}
                onClearShell={handleStopThonny}
                onRunCode={() => handleRunCode(undefined, undefined, stdinInput)}
              />
            ) : (
              /* Chế độ Thuật toán Sắp xếp & Tìm kiếm: Giữ nguyên TerminalOutput */
              <TerminalOutput
                stdout={currentStep?.stdout || ''}
                finalStdout={finalStdout}
                onJumpToEnd={() => setCurrentStepIndex(Math.max(0, steps.length - 1))}
              />
            )}
          </div>

          {/* RIGHT COLUMN: Controls + Interactive Tabs (Variables / Memory / Pseudocode / Complexity / Tutor) (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-xl p-1 shadow-xs overflow-x-auto">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('barchart')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'barchart'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Biểu Đồ Cột</span>
                  <span className="text-[10px] font-normal opacity-90 hidden sm:inline">(Trực quan)</span>
                </button>

                <button
                  onClick={() => setActiveTab('variables')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'variables'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Variable className="w-3.5 h-3.5" />
                  <span>Theo Dõi Biến</span>
                  <span className="text-[10px] font-normal opacity-90 hidden sm:inline">(Dễ hiểu)</span>
                </button>

                <button
                  onClick={() => setActiveTab('algorithm')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'algorithm'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Giải Thích Thuật Toán</span>
                  <span className="text-[10px] font-normal opacity-90 hidden sm:inline">(Tiếng Việt)</span>
                </button>

                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'quiz'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Trắc Nghiệm</span>
                  <span className="text-[10px] font-normal opacity-90 hidden sm:inline">(Ngẫu nhiên)</span>
                </button>

                <button
                  onClick={() => setActiveTab('complexity')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'complexity'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Độ phức tạp</span>
                  {complexityReport && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                      {complexityReport.timeComplexity}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Step Navigation & Controls Bar: Docked directly above the Variable Watcher */}
            <div className="sticky top-16 z-20 shadow-xs">
              <Controls
                currentStepIndex={currentStepIndex}
                totalSteps={steps.length}
                onGoToStep={setCurrentStepIndex}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                speed={speed}
                onChangeSpeed={setSpeed}
                currentStep={currentStep}
                stepMode={stepMode}
                onToggleStepMode={handleToggleStepMode}
                rawStepsCount={rawSteps.length}
                algorithmicStepsCount={filterResult.steps.length}
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
                  hasRun={hasRun}
                  onRunCode={() => handleRunCode(undefined, undefined, stdinInput)}
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

              {activeTab === 'quiz' && (
                <AlgorithmQuiz
                  currentAlgorithmId={selectedPresetId}
                  onLoadArrayToVisualizer={(arr) => {
                    const arrayStr = arr.join(' ');
                    setStdinInput(arrayStr);
                    setActiveTab('barchart');
                    handleRunCode(undefined, undefined, arrayStr);
                  }}
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
                      const localAnalysis =
                        PRESET_COMPLEXITY_MAP[selectedPresetId] || analyzeComplexityHeuristically(code);
                      setComplexityReport(localAnalysis);
                    }}
                    steps={steps}
                    currentStepIndex={currentStepIndex}
                  />
                  {selectedPresetId !== 'complexity-comparison' && (
                    <ComplexityMatrixTable />
                  )}
                </div>
              )}

              {activeTab === 'ai-tutor' && (
                <HighSchoolAITutor
                  algorithmId={selectedPresetId}
                  algorithmTitle={selectedPresetId === 'custom-code' ? 'Bài toán tự nhập của bạn' : currentPreset?.title}
                  code={code}
                  currentStep={currentStep}
                  currentStepIndex={currentStepIndex}
                  totalSteps={steps.length}
                  stdinInput={stdinInput}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-200 bg-white py-3 px-4 text-center text-xs text-slate-500 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-600 font-medium">LQD_PYTHON_LAB &bull; Phòng thực hành ảo Python &amp; Trợ lí AI Tin học THPT</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Trợ lí AI Sư phạm</span>
            <span>&bull;</span>
            <span>Trực quan hóa thuật toán</span>
            <span>&bull;</span>
            <span>Độ phức tạp Big-O</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
