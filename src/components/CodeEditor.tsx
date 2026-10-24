import React, { useRef, useEffect, useState, useMemo } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import {
  Code2,
  AlertTriangle,
  Bug,
  CheckCircle2,
  Wand2,
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
  isSearchMode?: boolean;
  presetId?: string;
  waitingInputLine?: number;
  onStepNext?: () => void;
  canStepNext?: boolean;
  onStopThonny?: () => void;
  isWaitingAlgorithmInput?: boolean;
  onConfirmAlgorithmInput?: () => void;
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
  isSearchMode = false,
  presetId = '',
  waitingInputLine,
  onStepNext,
  canStepNext = false,
  onStopThonny,
  isWaitingAlgorithmInput = false,
  onConfirmAlgorithmInput,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const sortInputRef = useRef<HTMLTextAreaElement>(null);
  const searchLine1Ref = useRef<HTMLInputElement>(null);
  const searchLine2Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isWaitingAlgorithmInput && !isThonnyMode) {
      setShowStdin(true);
      const timer = setTimeout(() => {
        if (isSearchMode) {
          searchLine1Ref.current?.focus();
          searchLine1Ref.current?.select();
        } else {
          sortInputRef.current?.focus();
          sortInputRef.current?.select();
        }
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [isWaitingAlgorithmInput, isThonnyMode, isSearchMode]);

  // Phân tích lỗi cú pháp thời gian thực ngay khi học sinh gõ
  const lintResult: LintResult = useMemo(() => lintPythonCode(code), [code]);

  const hasInputCall =
    code.includes('input(') || code.includes('sys.stdin') || code.includes('stdin.read');

  // Mặc định luôn mở Dữ liệu đầu vào chuẩn nếu code có input() (chỉ áp dụng ở chế độ Thuật toán)
  const [showStdin, setShowStdin] = useState<boolean>(true);

  // Tách riêng Dòng 1 (Mảng số hoặc xâu kí tự) và Dòng 2 (Số k hoặc kí tự cần tìm) cho chế độ Thuật toán Tìm kiếm
  const { searchLine1, searchLine2 } = useMemo(() => {
    const rawLines = (stdinInput || '').split(/\r?\n/);
    const line1 = rawLines[0] ?? '';
    const line2 = rawLines.length > 1 ? rawLines.slice(1).join(' ').trim() : '';
    return { searchLine1: line1, searchLine2: line2 };
  }, [stdinInput]);

  const handleUpdateSearchLines = (newLine1: string, newLine2: string) => {
    if (newLine1.includes('\n')) {
      const split = newLine1.split(/\r?\n/);
      onStdinChange(`${split[0]}\n${split[1] ?? newLine2}`);
      return;
    }
    onStdinChange(`${newLine1}\n${newLine2}`);
  };

  const handleGenerateSearchArray = (mode: 'numbers' | 'string') => {
    const isBinary = presetId === 'binary-search' || code.includes('binary_search');
    if (mode === 'numbers') {
      const count = 8;
      const pool = new Set<number>();
      while (pool.size < count) {
        pool.add(Math.floor(Math.random() * 90) + 5);
      }
      const nums = Array.from(pool);
      if (isBinary) {
        nums.sort((a, b) => a - b);
      }
      const targetIdx = Math.floor(Math.random() * nums.length);
      const kVal = String(nums[targetIdx]);
      onStdinChange(`${nums.join(' ')}\n${kVal}`);
    } else {
      const sampleWords = ['PYTHON', 'ALGORITHM', 'TINHOC', 'BINARY', 'SEARCH', 'CODING'];
      const chosen = sampleWords[Math.floor(Math.random() * sampleWords.length)];
      const chars = chosen.split('');
      if (isBinary) {
        chars.sort();
      }
      const targetIdx = Math.floor(Math.random() * chars.length);
      const kChar = chars[targetIdx];
      onStdinChange(`${chars.join(' ')}\n${kChar}`);
    }
  };

  const handleGenerateSortArray = (mode: 'numbers' | 'string') => {
    if (mode === 'numbers') {
      const count = 6;
      const pool = new Set<number>();
      while (pool.size < count) {
        pool.add(Math.floor(Math.random() * 85) + 5);
      }
      onStdinChange(Array.from(pool).join(' '));
    } else {
      const sampleWords = ['PYTHON', 'TINHOC', 'SORTING', 'HOCSINH', 'BANANA', 'CODING'];
      const chosen = sampleWords[Math.floor(Math.random() * sampleWords.length)];
      onStdinChange(chosen.split('').join(' '));
    }
  };

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

    if (isSearchMode) {
      const l1 = searchLine1.trim();
      const l2 = searchLine2.trim();
      const parts = l1.replace(/,/g, ' ').split(/\s+/).map((x) => x.trim()).filter(Boolean);
      const isNums = parts.length > 0 && parts.every((p) => !isNaN(Number(p)));
      const arrLabel = isNums
        ? `[${parts.join(', ')}]`
        : parts.length > 1
        ? `[${parts.map((p) => `'${p}'`).join(', ')}]`
        : `"${l1}"`;
      return {
        type: isNums ? ('numbers' as const) : ('chars' as const),
        label: `Dòng 1: ${arrLabel} • Dòng 2 (cần tìm k): ${l2 || '(trống)'}`,
        preview: `${arrLabel} | k = ${l2}`,
      };
    }

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
  }, [stdinInput, isSearchMode, searchLine1, searchLine2, detectedInputs, perVariableValues]);

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

    if (waitingInputLine && waitingInputLine > 0) {
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
    <div className="flex flex-col h-full bg-white overflow-hidden shadow-xs gap-0 border border-slate-200/90 rounded-xl">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b text-xs flex-wrap gap-2 bg-slate-50/80 border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          <Code2 className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-slate-800">Trình soạn thảo Python</span>

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
          {/* Quick Templates for Students (Chỉ hiển thị ở chế độ Tự do nhập code / Thonny mode) */}
          {isThonnyMode && (
            <>
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
            </>
          )}

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
        <div
          className={`border-b p-3 transition-all text-xs flex flex-col gap-2.5 ${
            isWaitingAlgorithmInput
              ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/70 shadow-sm'
              : 'bg-sky-50/50 border-sky-100'
          }`}
        >
          {isWaitingAlgorithmInput && (
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold text-xs shadow-xs animate-pulse">
              <span>
                ⏳ Bước 1: Bạn vừa ấn Chạy chương trình — Hãy tự nhập dữ liệu vào ô bên dưới rồi nhấn &quot;Nhập xong (Enter)&quot;, sau đó ấn &quot;Chạy tự động&quot; nhé!
              </span>
            </div>
          )}

          {isSearchMode ? (
            <div className="flex flex-col gap-2 bg-white p-2.5 rounded-lg border border-sky-200/80 shadow-2xs">
              {/* Dòng 1: Tạo 1 Mảng số hoặc xâu kí tự */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded border border-indigo-200 whitespace-nowrap sm:w-64 shrink-0">
                  Dòng 1: Mảng số hoặc xâu kí tự
                </label>
                <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
                  <input
                    ref={searchLine1Ref}
                    type="text"
                    value={searchLine1}
                    onChange={(e) => handleUpdateSearchLines(e.target.value, searchLine2)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (searchLine2Ref.current) {
                          searchLine2Ref.current.focus();
                          searchLine2Ref.current.select();
                        } else {
                          (onConfirmAlgorithmInput || onRunCode)?.();
                        }
                      }
                    }}
                    placeholder="Nhập mảng số (vd: 12 45 7 23 56) hoặc xâu kí tự (vd: P Y T H O N)..."
                    className="flex-1 min-w-[180px] bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerateSearchArray('numbers')}
                    className="px-2.5 py-1.5 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0"
                    title="Tự động tạo 1 mảng số và chọn số k cần tìm"
                  >
                    🎲 Tạo mảng số
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateSearchArray('string')}
                    className="px-2.5 py-1.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0"
                    title="Tự động tạo 1 xâu kí tự và chọn kí tự cần tìm"
                  >
                    🔤 Tạo xâu kí tự
                  </button>
                </div>
              </div>

              {/* Dòng 2: Số k hoặc kí tự cần tìm */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-200 whitespace-nowrap sm:w-64 shrink-0">
                  Dòng 2: Số k hoặc kí tự cần tìm
                </label>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    ref={searchLine2Ref}
                    type="text"
                    value={searchLine2}
                    onChange={(e) => handleUpdateSearchLines(searchLine1, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        (onConfirmAlgorithmInput || onRunCode)?.();
                      }
                    }}
                    placeholder="Nhập số k (vd: 23) hoặc kí tự cần tìm (vd: T)..."
                    className="flex-1 min-w-0 bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => (onConfirmAlgorithmInput || onRunCode)?.()}
                    className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs whitespace-nowrap shadow-xs transition-all cursor-pointer shrink-0"
                    title="Xác nhận dữ liệu Dòng 1 và Dòng 2 để nạp vào biểu đồ"
                  >
                    ✔ Nhập xong (Enter)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 bg-white p-2.5 rounded-lg border border-sky-200/80 shadow-2xs">
              {detectedInputs.length > 0 && detectedInputs.length <= 6 && detectedInputs.every((d) => d.dataType !== 'list') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                            (onConfirmAlgorithmInput || onRunCode)?.();
                          }
                        }}
                        placeholder={inp.dataType === 'int' ? 'Nhập số nguyên (vd: 5)' : 'Nhập giá trị...'}
                        className="flex-1 min-w-0 bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                <textarea
                  ref={sortInputRef}
                  rows={detectedInputs.length > 1 ? Math.min(3, detectedInputs.length) : 1}
                  value={stdinInput}
                  onChange={(e) => onStdinChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || detectedInputs.length <= 1)) {
                      e.preventDefault();
                      (onConfirmAlgorithmInput || onRunCode)?.();
                    }
                  }}
                  placeholder="Nhập mảng số (vd: 5 2 8 1 3) hoặc xâu kí tự (vd: P Y T H O N)..."
                  className="flex-1 min-w-[180px] bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none"
                />
                <button
                  type="button"
                  onClick={() => handleGenerateSortArray('numbers')}
                  className="px-2.5 py-1.5 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0"
                  title="Tự động tạo 1 mảng số ngẫu nhiên"
                >
                  🎲 Tạo mảng số
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateSortArray('string')}
                  className="px-2.5 py-1.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0"
                  title="Tự động tạo 1 xâu kí tự mẫu"
                >
                  🔤 Tạo xâu kí tự
                </button>
                <button
                  type="button"
                  onClick={() => (onConfirmAlgorithmInput || onRunCode)?.()}
                  className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs whitespace-nowrap shadow-xs transition-all cursor-pointer shrink-0"
                  title="Xác nhận dữ liệu đầu vào để sẵn sàng Chạy tự động"
                >
                  ✔ Nhập xong (Enter)
                </button>
              </div>
            </div>
          )}
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


