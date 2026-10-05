import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Wand2,
  HelpCircle,
  ArrowRight,
  Info,
  Bug,
  Sparkles,
} from 'lucide-react';
import {
  PythonLintError,
  LintResult,
  translatePythonErrorToVietnamese,
} from '../services/pythonLinter';

interface StudentCodeDiagnosticPanelProps {
  lintResult: LintResult;
  executionError: string | null;
  onAutoFix?: () => void;
  onSelectLine?: (line: number) => void;
}

export const StudentCodeDiagnosticPanel: React.FC<StudentCodeDiagnosticPanelProps> = ({
  lintResult,
  executionError,
  onAutoFix,
  onSelectLine,
}) => {
  const { errors, warnings, infos, isValid, canAutoFix } = lintResult;

  // Nếu có lỗi lúc chạy (Runtime Error)
  const runtimeDiagnostic = executionError
    ? translatePythonErrorToVietnamese(executionError)
    : null;

  const totalIssues = errors.length + warnings.length + (runtimeDiagnostic ? 1 : 0);

  // Nếu không có lỗi nào và cũng không có lỗi runtime
  if (totalIssues === 0) {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">
            Cú pháp chuẩn xác! Bạn có thể nhấn <strong>"Chạy & Trực Quan Hóa"</strong> bên dưới.
          </span>
        </div>
        <span className="text-[10px] text-emerald-400/80 font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          0 Lỗi
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-rose-500/40 rounded-xl overflow-hidden shadow-xl flex flex-col gap-2.5 p-3 text-xs">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 text-rose-400 font-bold flex-wrap">
          <div className="p-1 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-400">
            <Bug className="w-4 h-4" />
          </div>
          <span>Phát hiện {totalIssues} vấn đề:</span>

          {/* Breakdown tags */}
          <div className="flex items-center gap-1.5 text-[10px]">
            {lintResult.stats?.symbolErrors > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {lintResult.stats.symbolErrors} thiếu dấu
              </span>
            )}
            {lintResult.stats?.keywordErrors > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                {lintResult.stats.keywordErrors} từ khóa
              </span>
            )}
            {lintResult.stats?.syntaxErrors > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {lintResult.stats.syntaxErrors} cú pháp
              </span>
            )}
            {lintResult.stats?.semanticErrors > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                {lintResult.stats.semanticErrors} ngữ nghĩa
              </span>
            )}
          </div>
        </div>

        {canAutoFix && onAutoFix && (
          <button
            onClick={onAutoFix}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            title="Tự động sửa các dấu hai chấm, dấu ngoặc và thụt lề cho bạn"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>⚡ Tự động sửa lỗi nhanh</span>
          </button>
        )}
      </div>

      {/* Runtime Execution Error if occurred */}
      {runtimeDiagnostic && (
        <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/50 space-y-1.5">
          <div className="flex items-center justify-between text-rose-200 font-bold">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              {runtimeDiagnostic.title}
            </span>
            {runtimeDiagnostic.line && (
              <span
                onClick={() => onSelectLine && onSelectLine(runtimeDiagnostic.line!)}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 cursor-pointer hover:bg-rose-500/40"
              >
                Tại Dòng {runtimeDiagnostic.line}
              </span>
            )}
          </div>
          <p className="text-slate-200 leading-relaxed font-sans text-xs">
            {runtimeDiagnostic.vietnameseExplanation}
          </p>
          <div className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-500/20 flex items-start gap-1.5">
            <span className="font-bold shrink-0">👉 Hướng dẫn sửa:</span>
            <span>{runtimeDiagnostic.suggestion}</span>
          </div>
        </div>
      )}

      {/* Syntax Errors List */}
      <div className="space-y-2">
        {errors.map((err) => (
          <div
            key={err.id}
            className="p-2.5 rounded-lg bg-slate-950/90 border border-rose-500/30 flex items-start justify-between gap-2.5"
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  onClick={() => onSelectLine && onSelectLine(err.line)}
                  className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 cursor-pointer hover:bg-rose-500/30"
                  title="Nhấn để nhảy tới dòng này"
                >
                  Dòng {err.line}
                </span>

                {err.category === 'symbol' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                    Thiếu dấu
                  </span>
                )}
                {err.category === 'keyword' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 font-medium">
                    Từ khóa & Chính tả
                  </span>
                )}
                {err.category === 'syntax' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                    Cú pháp
                  </span>
                )}
                {err.category === 'semantics' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 font-medium">
                    Ngữ nghĩa & Logic
                  </span>
                )}
                <span className="font-semibold text-rose-200 text-xs">{err.message}</span>
              </div>
              {err.suggestion && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-mono bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20">
                  <span className="text-emerald-400 font-bold shrink-0">👉 Cách sửa:</span>
                  <span className="break-all">{err.suggestion}</span>
                </div>
              )}
            </div>

            {err.fixable && onAutoFix && (
              <button
                onClick={onAutoFix}
                className="shrink-0 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-medium border border-amber-500/30 cursor-pointer"
                title="Sửa lỗi này"
              >
                Sửa ngay
              </button>
            )}
          </div>
        ))}

        {/* Warnings List (e.g. Uncalled function) */}
        {warnings.map((warn) => (
          <div
            key={warn.id}
            className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-start justify-between gap-2.5"
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Lưu ý
                </span>
                <span className="font-semibold text-amber-200 text-xs">{warn.message}</span>
              </div>
              {warn.suggestion && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-mono bg-slate-900/60 px-2 py-1 rounded border border-amber-500/20">
                  <span className="text-amber-400 font-bold shrink-0">👉 Gợi ý:</span>
                  <span>{warn.suggestion}</span>
                </div>
              )}
            </div>

            {warn.fixable && onAutoFix && (
              <button
                onClick={onAutoFix}
                className="shrink-0 px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-medium border border-amber-500/40 cursor-pointer"
              >
                Thêm gọi hàm
              </button>
            )}
          </div>
        ))}

        {/* Infos List (e.g. missing print) */}
        {infos.map((inf) => (
          <div
            key={inf.id}
            className="p-2 rounded-lg bg-sky-950/30 border border-sky-500/20 flex items-center gap-2 text-sky-300 text-[11px]"
          >
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>{inf.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
