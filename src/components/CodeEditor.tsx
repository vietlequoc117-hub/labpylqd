import React, { useRef, useEffect, useState, useMemo } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import {
  Code2,
  AlertTriangle,
  Terminal,
  Bug,
  CheckCircle2,
  Wand2,
  Play,
  SkipForward,
  Square,
} from 'lucide-react';
import {
  lintPythonCode,
  autoFixPythonCode,
  LintResult,
} from '../services/pythonLinter';
import { StudentCodeDiagnosticPanel } from './StudentCodeDiagnosticPanel';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  justExecutedLine?: number;
  nextExecutingLine?: number;
  onReset: () => void;
  onNewCode?: () => void;
  error?: string | null;
  stdinInput: string;
  onStdinChange: (value: string) => void;
  onRunCode?: () => void;
  uncalledFunctionHint?: string | null;
  onCallFunction?: (fnName: string) => void;
  isThonnyMode?: boolean;
  waitingInputLine?: number;
  onStepNext?: () => void;
  canStepNext?: boolean;
  onStopThonny?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  justExecutedLine,
  nextExecutingLine,
  onReset,
  onNewCode,
  error,
  stdinInput,
  onStdinChange,
  onRunCode,
  uncalledFunctionHint,
  onCallFunction,
  isThonnyMode = false,
  waitingInputLine,
  onStepNext,
  canStepNext = false,
  onStopThonny,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  // Phân tích lỗi cú pháp thời gian thực ngay khi học sinh gõ
  const lintResult: LintResult = useMemo(() => lintPythonCode(code), [code]);

  const hasInputCall =
    code.includes('input(') || code.includes('sys.stdin') || code.includes('stdin.read');

  // Mặc định luôn mở Dữ liệu đầu vào chuẩn nếu code có input() (chỉ áp dụng ở chế độ Thuật toán)
  const [showStdin, setShowStdin] = useState<boolean>(true);

  // Tự động bóc tách danh sách các câu lệnh input() trong code của học sinh
  const detectedInputs = useMemo(() => {
    const lines = code.split('\n');
    const items: { varName: string; line: number; dataType: 'int' | 'float' | 'list' | 'str'; promptText?: string }[] = [];
    lines.forEach((rawLine, idx) => {
      const clean = rawLine.replace(/#.*$/, '').trim();
      if (!clean || !clean.includes('input(')) return;

      const lhsMatch = clean.match(/^([a-zA-Z_]\w*)\s*=/);
      const varName = lhsMatch ? lhsMatch[1] : `input_${items.length + 1}`;
      const promptMatch = clean.match(/input\s*\(\s*["']([^"']*)["']\s*\)/);
      const promptText = promptMatch ? promptMatch[1] : undefined;

      let dataType: 'int' | 'float' | 'list' | 'str' = 'str';
      if (clean.includes('.split(') || clean.includes('list(')) {
        dataType = 'list';
      } else if (/int\s*\(\s*input/.test(clean)) {
        dataType = 'int';
      } else if (/float\s*\(\s*input/.test(clean)) {
        dataType = 'float';
      }

      items.push({ varName, line: idx + 1, dataType, promptText });
    });
    return items;
  }, [code]);

  // Tách các giá trị hiện tại trong stdinInput tương ứng với từng biến input()
  const perVariableValues = useMemo(() => {
    const raw = (stdinInput || '').trim();
    const lines = raw ? raw.split(/\r?\n/) : [];
    const tokens = raw ? raw.replace(/,/g, ' ').split(/\s+/).filter(Boolean) : [];
    const defaults = ['5', '10', '3', '8', '2', '7'];

    return detectedInputs.map((item, idx) => {
      if (item.dataType === 'list') {
        return lines[idx] !== undefined ? lines[idx] : raw || '5 2 8 1 3';
      }
      if (lines.length >= detectedInputs.length && lines[idx] !== undefined) {
        return lines[idx].trim();
      }
      if (tokens[idx] !== undefined) {
        return tokens[idx];
      }
      return item.dataType === 'int' || item.dataType === 'float'
        ? defaults[idx % defaults.length]
        : 'abcdefg';
    });
  }, [stdinInput, detectedInputs]);

  const handleUpdateSingleInputVar = (index: number, newVal: string) => {
    const nextVals = [...perVariableValues];
    nextVals[index] = newVal;
    onStdinChange(nextVals.join('\n'));
  };

  // Phân tích dữ liệu từ chuỗi stdin (mảng số, xâu kí tự, hoặc danh sách từ) để hiển thị preview
  const parsedDataPreview = useMemo(() => {
    if (!stdinInput || !stdinInput.trim()) return null;
    const cleanStr = stdinInput.trim();
    const parts = cleanStr.replace(/,/g, ' ').split(/\s+/).map((x) => x.trim()).filter(Boolean);
    if (parts.length === 0) return null;

    if (detectedInputs.length > 1 && detectedInputs.every((d) => d.dataType !== 'list')) {
      const pairs = detectedInputs.map((d, i) => `${d.varName} = ${perVariableValues[i] ?? ''}`);
      return {
        type: 'numbers' as const,
        label: `Biến đầu vào: ${pairs.join(', ')}`,
        preview: pairs.join(', '),
      };
    }

    const isAllNumbers = parts.every((p) => !isNaN(Number(p)));
    if (isAllNumbers) {
      return {
        type: 'numbers' as const,
        label: parts.length === 1 ? `Giá trị số: ${parts[0]}` : `Dữ liệu số: [${parts.join(', ')}] (${parts.length} số)`,
        preview: parts.join(', '),
      };
    }

    if (parts.length > 1) {
      return {
        type: 'strings' as const,
        label: `Mảng kí tự / từ: [${parts.map((p) => `'${p}'`).join(', ')}] (${parts.length} phần tử)`,
        preview: parts.map((p) => `'${p}'`).join(', '),
      };
    }

    const chars = cleanStr.split('');
    return {
      type: 'chars' as const,
      label: `Xâu kí tự: "${cleanStr}" (${chars.length} kí tự)`,
      preview: chars.map((c) => `'${c}'`).join(', '),
    };
  }, [stdinInput, detectedInputs, perVariableValues]);

  // Auto-open stdin panel if code calls input()
  useEffect(() => {
    if (hasInputCall && !showStdin) {
      setShowStdin(true);
    }
  }, [hasInputCall, showStdin]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme('pyviz-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '7c3aed', fontStyle: 'bold' },
        { token: 'identifier', foreground: '1e293b' },
        { token: 'string', foreground: '059669' },
        { token: 'number', foreground: '0284c7' },
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'delimiter', foreground: '475569' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#0f172a',
        'editorCursor.foreground': '#2563eb',
        'editor.lineHighlightBackground': '#f8fafc',
        'editorLineNumber.foreground': '#94a3b8',
        'editorLineNumber.activeForeground': '#2563eb',
        'editorGutter.background': '#ffffff',
      },
    });

    // Giao diện Thonny chuẩn (cột số thứ tự dòng màu xám #e0e0e0, nền trắng tinh khiết)
    monaco.editor.defineTheme('thonny-classic', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '7c3aed', fontStyle: 'bold' },
        { token: 'identifier', foreground: '111827' },
        { token: 'string', foreground: '047857' },
        { token: 'number', foreground: '0369a1' },
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'delimiter', foreground: '374151' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#111827',
        'editorCursor.foreground': '#000000',
        'editor.lineHighlightBackground': '#f9fafb',
        'editorLineNumber.foreground': '#666666',
        'editorLineNumber.activeForeground': '#111111',
        'editorGutter.background': '#e0e0e0',
      },
    });

    monaco.editor.setTheme(isThonnyMode ? 'thonny-classic' : 'pyviz-light');
  };

  // Đổi theme Monaco khi chuyển qua lại giữa chế độ Thonny (Tự do nhập code) và chế độ Thuật toán
  useEffect(() => {
    if (!monacoRef.current) return;
    monacoRef.current.editor.setTheme(isThonnyMode ? 'thonny-classic' : 'pyviz-light');
  }, [isThonnyMode]);

  // Cập nhật gạch chân lượn sóng báo lỗi đỏ (Monaco markers) trực tiếp trong trình soạn thảo
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    if (!model) return;

    const markers: any[] = [];
    for (const err of lintResult.errors) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: `${err.message} ${err.suggestion ? `(👉 ${err.suggestion})` : ''}`,
        startLineNumber: err.line,
        startColumn: err.column || 1,
        endLineNumber: err.line,
        endColumn: err.endColumn || model.getLineMaxColumn(err.line),
      });
    }

    for (const warn of lintResult.warnings) {
      markers.push({
        severity: monaco.MarkerSeverity.Warning,
        message: `${warn.message} ${warn.suggestion ? `(👉 ${warn.suggestion})` : ''}`,
        startLineNumber: warn.line,
        startColumn: warn.column || 1,
        endLineNumber: warn.line,
        endColumn: warn.endColumn || model.getLineMaxColumn(warn.line),
      });
    }

    monaco.editor.setModelMarkers(model, 'python-linter', markers);
  }, [code, lintResult]);

  // Highlight dòng đang thực thi (Xanh/Vàng hoặc dòng đang chờ nhập input() trong Thonny)
  useEffect(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const newDecorations: any[] = [];

    if (isThonnyMode && waitingInputLine && waitingInputLine > 0) {
      newDecorations.push({
        range: {
          startLineNumber: waitingInputLine,
          startColumn: 1,
          endLineNumber: waitingInputLine,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: 'bg-amber-100/90 border-l-4 border-indigo-600',
          glyphMarginClassName: 'text-indigo-600 font-bold',
        },
      });
    } else {
      if (justExecutedLine && justExecutedLine > 0) {
        newDecorations.push({
          range: {
            startLineNumber: justExecutedLine,
            startColumn: 1,
            endLineNumber: justExecutedLine,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: 'bg-emerald-100/80 border-l-4 border-emerald-500',
            glyphMarginClassName: 'text-emerald-600 font-bold',
          },
        });
      }

      if (nextExecutingLine && nextExecutingLine > 0) {
        newDecorations.push({
          range: {
            startLineNumber: nextExecutingLine,
            startColumn: 1,
            endLineNumber: nextExecutingLine,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: 'bg-amber-100/80 border-l-4 border-amber-500',
            glyphMarginClassName: 'text-amber-600 font-bold',
          },
        });
      }
    }

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);

    const activeLine = waitingInputLine || nextExecutingLine || justExecutedLine;
    if (activeLine && activeLine > 0) {
      editor.revealLineInCenterIfOutsideViewport(activeLine);
    }
  }, [justExecutedLine, nextExecutingLine, waitingInputLine, isThonnyMode]);

  // Tự động sửa lỗi
  const handleAutoFix = () => {
    const { fixedCode } = autoFixPythonCode(code);
    onChange(fixedCode);
  };

  // Nhảy tới dòng lỗi khi học sinh nhấn vào
  const handleSelectLine = (line: number) => {
    if (!editorRef.current) return;
    editorRef.current.revealLineInCenter(line);
    editorRef.current.setPosition({ lineNumber: line, column: 1 });
    editorRef.current.focus();
  };

  const hasDiagnostics =
    lintResult.errors.length > 0 || lintResult.warnings.length > 0 || Boolean(error);

  return (
    <div
      className={`flex flex-col h-full bg-white overflow-hidden shadow-xs gap-0 ${
        isThonnyMode
          ? 'border border-[#c8c8c8] rounded-none'
          : 'border border-slate-200/90 rounded-xl'
      }`}
    >
      {/* Editor Header Bar */}
      <div
        className={`flex items-center justify-between px-2.5 py-1.5 border-b text-xs flex-wrap gap-2 ${
          isThonnyMode
            ? 'bg-[#ececec] border-[#c8c8c8]'
            : 'bg-slate-50/80 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {isThonnyMode ? (
            <>
              {/* Thonny File Tab + Toolbar Buttons */}
              <div className="bg-white border border-[#bcbcbc] px-2.5 py-0.5 text-[12px] font-sans text-slate-800 font-medium shadow-2xs">
                main.py
              </div>

              <button
                type="button"
                onClick={() => onRunCode?.()}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                title="Chạy chương trình từng câu lệnh từ đầu"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Chạy</span>
              </button>

              {canStepNext && onStepNext && (
                <button
                  type="button"
                  onClick={onStepNext}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                  title="Chạy câu lệnh kế tiếp"
                >
                  <SkipForward className="w-3 h-3" />
                  <span>Câu lệnh tiếp</span>
                </button>
              )}

              {onStopThonny && (
                <button
                  type="button"
                  onClick={onStopThonny}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                  title="Dừng và đặt lại Shell"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>Dừng</span>
                </button>
              )}
            </>
          ) : (
            <>
              <Code2 className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-slate-800">Trình soạn thảo Python</span>
            </>
          )}

          {/* Linter Status Badge */}
          {lintResult.errors.length > 0 ? (
            <span
              className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 font-bold animate-pulse"
              title="Có lỗi cú pháp trong code"
            >
              <Bug className="w-3 h-3 text-rose-600" /> {lintResult.errors.length} lỗi cần sửa
            </span>
          ) : lintResult.warnings.length > 0 ? (
            <span
              className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 font-medium"
              title="Có cảnh báo trong code"
            >
              <AlertTriangle className="w-3 h-3 text-amber-600" /> {lintResult.warnings.length} lưu ý
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-mono font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Cú pháp đúng
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick Templates for Students */}
          <button
            type="button"
            onClick={() => {
              onChange(`n = int(input())\nm = int(input())\na = n * m\nprint(a)\n`);
              onStdinChange('5\n10');
              onStopThonny?.();
            }}
            className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold transition-colors cursor-pointer"
            title="Mẫu bài tập nhập 2 số nguyên n, m và tính toán"
          >
            Mẫu: Nhập n, m
          </button>
          <button
            type="button"
            onClick={() => {
              onChange(`s = "abcdefg"\nfor i in range(0, len(s), 2):\n    s = s[1:] + s[0]\nt = s[::2]\nprint(t)\n`);
              onStdinChange('abcdefg');
              onStopThonny?.();
            }}
            className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-semibold transition-colors cursor-pointer"
            title="Mẫu bài tập xử lý và cắt xâu kí tự"
          >
            Mẫu: Xâu kí tự
          </button>
          <button
            type="button"
            onClick={() => {
              onChange('');
              onStopThonny?.();
              if (editorRef.current) editorRef.current.focus();
            }}
            className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
            title="Xóa trắng trình soạn thảo để tự gõ code từ đầu"
          >
            Xóa trắng tự gõ
          </button>

          {/* Quick Auto-Fix Button in Header */}
          {lintResult.canAutoFix && (
            <button
              onClick={handleAutoFix}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] border border-amber-300 shadow-xs transition-all cursor-pointer"
              title="Tự động thêm dấu hai chấm, dấu ngoặc và thụt lề"
            >
              <Wand2 className="w-3 h-3 text-amber-700" />
              <span>⚡ Sửa lỗi nhanh</span>
            </button>
          )}
        </div>
      </div>

      {/* Stdin Drawer Panel: CHỈ HIỂN THỊ ở chế độ Thuật toán Sắp xếp & Thuật toán Tìm kiếm (không hiển thị ở chế độ Thonny tự do nhập code) */}
      {!isThonnyMode && showStdin && (
        <div className="bg-sky-50/50 border-b border-sky-100 p-3 transition-all text-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-sky-100 text-sky-700 border border-sky-200">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sky-900 font-bold text-xs">
                  Dữ liệu đầu vào cho lệnh <code className="bg-sky-100 px-1 py-0.5 rounded text-sky-800">input()</code>:
                </span>
                <span className="text-[11px] text-slate-500 ml-1.5">
                  (Nhập mỗi giá trị trên 1 dòng hoặc cách nhau bởi dấu cách)
                </span>
              </div>
            </div>

            {parsedDataPreview && (
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 shadow-xs flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{parsedDataPreview.label}</span>
              </span>
            )}
          </div>

          {detectedInputs.length > 0 && detectedInputs.length <= 6 && detectedInputs.every((d) => d.dataType !== 'list') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-sky-200/80 shadow-2xs">
              {detectedInputs.map((inp, idx) => (
                <div key={`${inp.varName}-${idx}`} className="flex items-center gap-2">
                  <label className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200 whitespace-nowrap">
                    Dòng {inp.line}: {inp.varName} =
                  </label>
                  <input
                    type="text"
                    value={perVariableValues[idx] ?? ''}
                    onChange={(e) => handleUpdateSingleInputVar(idx, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onRunCode?.();
                      }
                    }}
                    placeholder={inp.dataType === 'int' ? 'Nhập số nguyên (vd: 5)' : 'Nhập giá trị...'}
                    className="flex-1 min-w-0 bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2">
            <textarea
              rows={detectedInputs.length > 1 ? Math.min(3, detectedInputs.length) : 1}
              value={stdinInput}
              onChange={(e) => onStdinChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || detectedInputs.length <= 1)) {
                  e.preventDefault();
                  onRunCode?.();
                }
              }}
              placeholder="Nhập dữ liệu đầu vào (ví dụ: 5 10 hoặc mỗi dòng 1 số, hoặc mảng 5 2 8 1 3)..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-xs resize-y"
            />
            <button
              type="button"
              onClick={() => onRunCode?.()}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs whitespace-nowrap shadow-xs transition-all cursor-pointer shrink-0"
              title="Chạy chương trình với dữ liệu đầu vào này"
            >
              ▶ Chạy ngay
            </button>
          </div>
        </div>
      )}

      {/* Monaco Editor Container */}
      <div className="flex-1 min-h-[280px] relative bg-white">
        <Editor
          height="100%"
          defaultLanguage="python"
          value={code}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorDidMount}
          theme={isThonnyMode ? 'thonny-classic' : 'pyviz-light'}
          options={{
            fontFamily: "Consolas, 'Fira Code', 'JetBrains Mono', Menlo, monospace",
            fontSize: 13.5,
            lineHeight: 21,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            renderLineHighlight: 'all',
            glyphMargin: !isThonnyMode,
            lineNumbersMinChars: isThonnyMode ? 3 : 3,
            padding: { top: 10, bottom: 10 },
            folding: !isThonnyMode,
            smoothScrolling: true,
          }}
        />
      </div>

      {/* Student Code Diagnostic & Error Guidance Panel (Trong chế độ Thonny chỉ hiện khi có lỗi/cảnh báo để giữ giao diện Thonny gọn sạch) */}
      {(!isThonnyMode || hasDiagnostics) && (
        <div className="border-t border-slate-200 p-2 bg-slate-50/70">
          <StudentCodeDiagnosticPanel
            lintResult={lintResult}
            executionError={error || null}
            onAutoFix={handleAutoFix}
            onSelectLine={handleSelectLine}
          />
        </div>
      )}
    </div>
  );
};


