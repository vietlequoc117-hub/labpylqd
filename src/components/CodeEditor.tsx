import React, { useRef, useEffect, useState, useMemo } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import {
  Code2,
  AlertTriangle,
  Terminal,
  HelpCircle,
  Sparkles,
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
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  // Phân tích lỗi cú pháp thời gian thực ngay khi học sinh gõ
  const lintResult: LintResult = useMemo(() => lintPythonCode(code), [code]);

  const hasInputCall =
    code.includes('input(') || code.includes('sys.stdin') || code.includes('stdin.read');

  // Mặc định luôn mở Dữ liệu đầu vào chuẩn nếu code có input() hoặc stdinInput có dữ liệu
  const [showStdin, setShowStdin] = useState<boolean>(true);

  // Phân tích dữ liệu từ chuỗi stdin (mảng số, xâu kí tự, hoặc danh sách từ) để hiển thị preview
  const parsedDataPreview = useMemo(() => {
    if (!stdinInput || !stdinInput.trim()) return null;
    const cleanStr = stdinInput.trim();
    const parts = cleanStr.replace(/,/g, ' ').split(/\s+/).map((x) => x.trim()).filter(Boolean);
    if (parts.length === 0) return null;

    const isAllNumbers = parts.every((p) => !isNaN(Number(p)));
    if (isAllNumbers) {
      return {
        type: 'numbers' as const,
        label: `Mảng số: [${parts.join(', ')}] (${parts.length} số)`,
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

    // Xâu kí tự liền nhau (ví dụ: 'PYTHON', 'ALGORITHM')
    const chars = cleanStr.split('');
    return {
      type: 'chars' as const,
      label: `Xâu kí tự: [${chars.map((c) => `'${c}'`).join(', ')}] (${chars.length} kí tự)`,
      preview: chars.map((c) => `'${c}'`).join(', '),
    };
  }, [stdinInput]);

  // Auto-open stdin panel if code calls input() and stdin is empty
  useEffect(() => {
    if (hasInputCall && !showStdin && !stdinInput) {
      setShowStdin(true);
    }
  }, [hasInputCall]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme('pyviz-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'c084fc', fontStyle: 'bold' },
        { token: 'identifier', foreground: 'e2e8f0' },
        { token: 'string', foreground: '86efac' },
        { token: 'number', foreground: '38bdf8' },
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'delimiter', foreground: '94a3b8' },
      ],
      colors: {
        'editor.background': '#090d16',
        'editor.foreground': '#f1f5f9',
        'editorCursor.foreground': '#38bdf8',
        'editor.lineHighlightBackground': '#1e293b40',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#38bdf8',
        'editorGutter.background': '#090d16',
      },
    });

    monaco.editor.setTheme('pyviz-dark');
  };

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

  // Highlight dòng đang thực thi (Xanh/Vàng)
  useEffect(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const newDecorations: any[] = [];

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
          className: 'bg-emerald-500/20 border-l-4 border-emerald-400',
          glyphMarginClassName: 'text-emerald-400 font-bold',
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
          className: 'bg-amber-500/15 border-l-4 border-amber-400',
          glyphMarginClassName: 'text-amber-400 font-bold',
        },
      });
    }

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);

    const activeLine = nextExecutingLine || justExecutedLine;
    if (activeLine && activeLine > 0) {
      editor.revealLineInCenterIfOutsideViewport(activeLine);
    }
  }, [justExecutedLine, nextExecutingLine]);

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

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg gap-0">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950/80 border-b border-slate-800 text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-slate-200">Trình soạn thảo Python</span>

          {/* Linter Status Badge */}
          {lintResult.errors.length > 0 ? (
            <span
              className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 font-bold animate-pulse"
              title="Có lỗi cú pháp trong code"
            >
              <Bug className="w-3 h-3 text-rose-400" /> {lintResult.errors.length} lỗi cần sửa
            </span>
          ) : lintResult.warnings.length > 0 ? (
            <span
              className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-medium"
              title="Có cảnh báo trong code"
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" /> {lintResult.warnings.length} lưu ý
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Cú pháp đúng
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Auto-Fix Button in Header */}
          {lintResult.canAutoFix && (
            <button
              onClick={handleAutoFix}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-[11px] shadow-sm transition-all cursor-pointer"
              title="Tự động thêm dấu hai chấm, dấu ngoặc và thụt lề"
            >
              <Wand2 className="w-3 h-3" />
              <span>⚡ Sửa lỗi nhanh</span>
            </button>
          )}
        </div>
      </div>

      {/* Stdin Drawer Panel: Dữ liệu đầu vào chuẩn (Hỗ trợ Mảng số, Xâu kí tự & Từ vựng) */}
      {showStdin && (
        <div className="bg-slate-950/95 border-b border-sky-900/50 p-3 transition-all text-xs flex flex-col gap-2.5 shadow-inner">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-sky-500/20 text-sky-400">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sky-300 font-bold text-xs">
                  Dữ liệu đầu vào chuẩn (Standard Input / stdin):
                </span>
              </div>
            </div>

            {parsedDataPreview && (
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-500/40 shadow-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{parsedDataPreview.label}</span>
              </span>
            )}
          </div>

          {/* Input text */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={stdinInput}
              onChange={(e) => onStdinChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onRunCode?.();
                }
              }}
              placeholder="Nhập mảng số (5 2 8 1 3) hoặc xâu kí tự (P Y T H O N hoặc ALGORITHM)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all shadow-inner"
            />
          </div>
        </div>
      )}

      {/* Monaco Editor Container */}
      <div className="flex-1 min-h-[300px] relative">
        <Editor
          height="100%"
          defaultLanguage="python"
          value={code}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontFamily: "'Fira Code', 'JetBrains Mono', Menlo, monospace",
            fontSize: 13,
            lineHeight: 20,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            renderLineHighlight: 'all',
            glyphMargin: true,
            padding: { top: 12, bottom: 12 },
            folding: true,
            smoothScrolling: true,
          }}
        />
      </div>

      {/* Student Code Diagnostic & Error Guidance Panel */}
      <div className="border-t border-slate-800 p-2 bg-slate-950/90">
        <StudentCodeDiagnosticPanel
          lintResult={lintResult}
          executionError={error || null}
          onAutoFix={handleAutoFix}
          onSelectLine={handleSelectLine}
        />
      </div>
    </div>
  );
};

