import React, { useState, useRef, useEffect } from 'react';
import { CornerDownLeft, RotateCcw, Play } from 'lucide-react';
import { ShellSegment, VariableValue } from '../types';

interface ThonnyShellProps {
  hasRun: boolean;
  isStepping: boolean;
  isWaitingInput: boolean;
  waitingLine?: number;
  waitingPrompt?: string;
  waitingVar?: string;
  currentLine?: number;
  shellSegments: ShellSegment[];
  error?: string | null;
  currentVariables?: Record<string, VariableValue>;
  onSubmitInput: (value: string) => void;
  onClearShell: () => void;
  onRunCode: () => void;
}

interface ReplEntry {
  command: string;
  output: string;
  isError?: boolean;
}

export const ThonnyShell: React.FC<ThonnyShellProps> = ({
  hasRun,
  isStepping,
  isWaitingInput,
  waitingLine,
  waitingVar,
  currentLine,
  shellSegments,
  error,
  currentVariables = {},
  onSubmitInput,
  onClearShell,
  onRunCode,
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [replInput, setReplInput] = useState<string>('');
  const [replHistory, setReplHistory] = useState<ReplEntry[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const replInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Tự động focus vào ô nhập dữ liệu của Shell mỗi khi chương trình dừng ở lệnh input()
  useEffect(() => {
    if (isWaitingInput && !isStepping) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isWaitingInput, isStepping, waitingLine, shellSegments.length]);

  // Tự động cuộn xuống cuối Shell khi có nội dung mới
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [hasRun, shellSegments, isWaitingInput, isStepping, error, replHistory]);

  // Xóa lịch sử REPL phụ khi chạy lại chương trình mới
  useEffect(() => {
    if (hasRun && shellSegments.length === 0 && isWaitingInput) {
      setReplHistory([]);
    }
  }, [hasRun, shellSegments.length, isWaitingInput]);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWaitingInput || isStepping) return;
    const valToSubmit = inputValue;
    setInputValue('');
    onSubmitInput(valToSubmit);
  };

  // Cho phép học sinh gõ biểu thức kiểm tra nhanh tại dấu nhắc >>> (giống Thonny thực tế)
  const handleReplSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = replInput.trim();
    if (!cmd) return;
    setReplInput('');

    if (cmd === '%Run' || cmd === '%Run main.py' || cmd === 'run') {
      onRunCode();
      return;
    }
    if (cmd === 'clear' || cmd === 'cls') {
      setReplHistory([]);
      onClearShell();
      return;
    }

    // Kiểm tra nếu học sinh gõ tên biến đang có trong bộ nhớ (ví dụ: n, m, a, s, t)
    if (currentVariables[cmd] !== undefined) {
      const v = currentVariables[cmd];
      const formatted = v.type === 'str' ? `'${v.value}'` : String(v.value);
      setReplHistory((prev) => [...prev, { command: cmd, output: formatted }]);
      return;
    }

    // Kiểm tra lệnh print(biến) đơn giản tại >>>
    const printMatch = cmd.match(/^print\s*\(\s*([a-zA-Z_]\w*)\s*\)$/);
    if (printMatch && currentVariables[printMatch[1]] !== undefined) {
      const v = currentVariables[printMatch[1]];
      setReplHistory((prev) => [...prev, { command: cmd, output: String(v.value) }]);
      return;
    }

    setReplHistory((prev) => [
      ...prev,
      {
        command: cmd,
        output: `Gợi ý: Hãy gõ code ở khung soạn thảo phía trên rồi bấm "Chạy Chương Trình" để chạy từng câu lệnh nhé!`,
      },
    ]);
  };

  const hasFinished = hasRun && !isWaitingInput && !isStepping;

  return (
    <div className="flex flex-col shadow-xs select-text">
      {/* Thonny Shell Tab Bar (Giống hệt giao diện phần mềm Thonny) */}
      <div className="flex items-center justify-between bg-[#e8e8e8] border-t border-x border-[#c8c8c8] px-1.5 pt-1 text-xs">
        <div className="flex items-center">
          <div className="bg-white border-t border-x border-[#bcbcbc] px-3 py-1 text-[12px] font-sans text-slate-800 flex items-center gap-2.5 -mb-px z-10">
            <span className="font-medium">Shell</span>
            <button
              type="button"
              onClick={() => {
                setReplHistory([]);
                setInputValue('');
                onClearShell();
              }}
              className="text-slate-400 hover:text-slate-700 text-xs leading-none cursor-pointer"
              title="Làm mới cửa sổ Shell"
            >
              ×
            </button>
          </div>
        </div>

        {/* Trạng thái chạy từng câu lệnh trong Thonny */}
        <div className="flex items-center gap-2 pr-2 pb-1">
          {isWaitingInput && !isStepping && (
            <span className="text-[11px] font-sans font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1.5 animate-pulse">
              <span>⏳ Dòng {waitingLine}: Nhập dữ liệu{waitingVar ? ` cho biến "${waitingVar}"` : ''} ở dưới rồi nhấn Enter ↵</span>
            </span>
          )}
          {isStepping && (
            <span className="text-[11px] font-sans font-semibold text-sky-800 bg-sky-100 border border-sky-200 px-2 py-0.5 rounded flex items-center gap-1">
              <span>▶ Đang chạy câu lệnh dòng {currentLine || 1}...</span>
            </span>
          )}
          {hasFinished && !error && (
            <span className="text-[11px] font-sans font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              ✔ Đã chạy xong từng câu lệnh
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setReplHistory([]);
              setInputValue('');
              onClearShell();
            }}
            className="flex items-center gap-1 text-[11px] font-sans text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white px-2 py-0.5 rounded border border-slate-300 cursor-pointer transition-colors"
            title="Xóa màn hình Shell"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Xóa Shell</span>
          </button>
        </div>
      </div>

      {/* Thonny Shell Content Area */}
      <div
        ref={scrollContainerRef}
        onClick={() => {
          if (isWaitingInput && !isStepping) {
            inputRef.current?.focus();
          }
        }}
        className="bg-white border border-[#c8c8c8] p-3 font-mono text-[13px] leading-relaxed text-slate-900 min-h-[185px] max-h-[260px] overflow-y-auto cursor-text"
      >
        {/* Khi chưa bấm Chạy Chương Trình */}
        {!hasRun && (
          <div>
            {replHistory.map((item, idx) => (
              <div key={idx} className="whitespace-pre-wrap">
                <div>
                  <span className="text-[#800080] font-bold select-none">{'>>> '}</span>
                  <span>{item.command}</span>
                </div>
                {item.output && (
                  <div className={item.isError ? 'text-red-600' : 'text-slate-800'}>
                    {item.output}
                  </div>
                )}
              </div>
            ))}

            <form onSubmit={handleReplSubmit} className="flex items-center gap-1">
              <span className="text-[#800080] font-bold select-none shrink-0">{'>>> '}</span>
              <input
                ref={replInputRef}
                type="text"
                value={replInput}
                onChange={(e) => setReplInput(e.target.value)}
                placeholder='Bấm "Chạy Chương Trình" để chạy từng câu lệnh...'
                className="flex-1 min-w-0 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none font-mono text-[13px]"
              />
              <button
                type="button"
                onClick={onRunCode}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-[11px] shadow-2xs cursor-pointer transition-colors shrink-0"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Chạy</span>
              </button>
            </form>
          </div>
        )}

        {/* Khi đang chạy hoặc đã chạy chương trình (%Run main.py) */}
        {hasRun && (
          <div className="whitespace-pre-wrap break-words">
            <div>
              <span className="text-[#800080] font-bold select-none">{'>>> '}</span>
              <span className="text-slate-900">%Run main.py</span>
            </div>

            {/* Hiển thị lần lượt các kết quả in (stdout) và các giá trị học sinh đã nhập (input) */}
            <span>
              {shellSegments.map((seg, idx) => (
                <span
                  key={idx}
                  className={
                    seg.type === 'input'
                      ? 'text-sky-700 italic font-semibold'
                      : 'text-slate-900'
                  }
                >
                  {seg.text}
                </span>
              ))}
            </span>

            {/* Ô nhập dữ liệu trực tiếp trong Shell khi gặp câu lệnh input() */}
            {isWaitingInput && !isStepping && (
              <form
                onSubmit={handleInputSubmit}
                className="inline-flex items-center gap-2 align-baseline min-w-[260px] max-w-full my-0.5"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    waitingVar
                      ? `Nhập giá trị cho ${waitingVar} (dòng ${waitingLine})...`
                      : `Nhập dữ liệu cho dòng ${waitingLine}...`
                  }
                  className="bg-amber-50/90 border-b-2 border-indigo-600 px-1.5 py-0.5 text-[13px] font-mono font-bold text-sky-800 placeholder-slate-400 focus:outline-none focus:bg-sky-50 min-w-[210px]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-[11px] shadow-2xs cursor-pointer transition-colors shrink-0"
                  title="Nhấn Enter để nhập và chạy tiếp câu lệnh tiếp theo"
                >
                  <span>Nhập & Chạy tiếp</span>
                  <CornerDownLeft className="w-3 h-3" />
                </button>
              </form>
            )}

            {/* Hiển thị lỗi nếu có */}
            {error && !isStepping && (
              <div className="text-red-600 font-medium mt-1 whitespace-pre-wrap">
                {error}
              </div>
            )}

            {/* Khi đã chạy xong tất cả câu lệnh: hiển thị lại dấu nhắc >>> của Thonny */}
            {hasFinished && (
              <div className="mt-0.5">
                {replHistory.map((item, idx) => (
                  <div key={idx} className="whitespace-pre-wrap">
                    <div>
                      <span className="text-[#800080] font-bold select-none">{'>>> '}</span>
                      <span>{item.command}</span>
                    </div>
                    {item.output && (
                      <div className={item.isError ? 'text-red-600' : 'text-slate-800'}>
                        {item.output}
                      </div>
                    )}
                  </div>
                ))}

                <form onSubmit={handleReplSubmit} className="flex items-center gap-1">
                  <span className="text-[#800080] font-bold select-none shrink-0">{'>>> '}</span>
                  <input
                    type="text"
                    value={replInput}
                    onChange={(e) => setReplInput(e.target.value)}
                    placeholder="Gõ tên biến (vd: a, n, m) để kiểm tra hoặc bấm Chạy Chương Trình để chạy lại..."
                    className="flex-1 min-w-0 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none font-mono text-[13px]"
                  />
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
