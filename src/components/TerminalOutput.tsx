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

  const handleCopy = () => {
    const textToCopy = stdout || '';
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
          <span className="font-semibold text-slate-800">Kết Quả Đầu Ra (Terminal / print)</span>
        </div>

        <div className="flex items-center gap-2">
          {displayOutput && (
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
        ) : (
          <span className="text-slate-500 italic font-sans">
            (Chưa có dữ liệu in ra màn hình ở câu lệnh hiện tại)
          </span>
        )}
      </div>
    </div>
  );
};
