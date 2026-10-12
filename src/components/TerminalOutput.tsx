import React from 'react';
import { Terminal, Check, Copy, FastForward } from 'lucide-react';

interface TerminalOutputProps {
  stdout: string;
  finalStdout?: string;
  onJumpToEnd?: () => void;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({
  stdout,
  finalStdout,
  onJumpToEnd,
}) => {
  const [copied, setCopied] = React.useState(false);

  const displayOutput = stdout || '';
  const hasFutureOutput = !stdout && finalStdout && finalStdout.trim().length > 0;

  const handleCopy = () => {
    const textToCopy = stdout || finalStdout || '';
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50/90 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold text-slate-800">Terminal (stdout)</span>
        </div>

        <div className="flex items-center gap-2">
          {hasFutureOutput && onJumpToEnd && (
            <button
              onClick={onJumpToEnd}
              className="flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 cursor-pointer transition-colors font-medium"
              title="Nhảy đến bước in kết quả cuối cùng"
            >
              <FastForward className="w-3 h-3" />
              <span>Xem kết quả in ({finalStdout.trim()})</span>
            </button>
          )}

          {(stdout || finalStdout) && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-3 bg-slate-950/90 font-mono text-xs text-emerald-400 min-h-[60px] max-h-[120px] overflow-y-auto whitespace-pre-wrap selection:bg-emerald-500/30">
        {displayOutput ? (
          displayOutput
        ) : hasFutureOutput ? (
          <div className="flex flex-col gap-1 text-slate-400 font-sans">
            <span className="text-[11px] text-slate-500 italic">
              (Chưa in ở bước hiện tại. Bấm "Next ▶" hoặc "Play" để xem từng bước xuất kết quả)
            </span>
            <div className="flex items-center gap-2 font-mono text-emerald-400 text-xs bg-emerald-950/30 p-1.5 rounded border border-emerald-900/40">
              <span className="text-slate-400 font-sans text-[11px]">Kết quả cuối cùng:</span>
              <span className="font-bold text-emerald-300">{finalStdout?.trim()}</span>
            </div>
          </div>
        ) : (
          <span className="text-slate-600 italic font-sans">(Chưa có dữ liệu in ra màn hình)</span>
        )}
      </div>
    </div>
  );
};
