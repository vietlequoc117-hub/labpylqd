import React from 'react';
import {
  TrendingUp,
  Clock,
  HardDrive,
  GitBranch,
  Layers,
  Sparkles,
  RefreshCw,
  Lightbulb,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { ComplexityReport, TraceStep } from '../types';

interface ComplexityDashboardProps {
  complexityReport: ComplexityReport | null;
  isLoading: boolean;
  onRefresh: () => void;
  steps: TraceStep[];
  currentStepIndex: number;
}

export const ComplexityDashboard: React.FC<ComplexityDashboardProps> = ({
  complexityReport,
  isLoading,
  onRefresh,
  steps,
  currentStepIndex,
}) => {
  // Compute call stack depth profile over execution steps
  const stackHeights = steps.map((s) => s.stack_frames?.length || 0);
  const maxStackDepth = stackHeights.length > 0 ? Math.max(...stackHeights) : 0;
  const currentDepth = steps[currentStepIndex]?.stack_frames?.length || 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              Bảng Phân Tích Độ Phức Tạp (Complexity Dashboard)
              <span className="flex items-center gap-1 text-[10px] font-normal px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-sky-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-2.5 h-2.5" /> AI Phân Tích (Tự động 100%)
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Phân tích Big-O thời gian, không gian đệ quy và cấu trúc cấp phát bộ nhớ
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>{isLoading ? 'Đang phân tích...' : 'Phân tích lại'}</span>
        </button>
      </div>

      {isLoading && !complexityReport ? (
        <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <p>Hệ thống AI đang kiểm tra cấu trúc thuật toán và tính toán Big-O...</p>
        </div>
      ) : complexityReport ? (
        <div className="flex flex-col gap-4">
          {/* Big-O Badges Overview: Time and Space */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Time Complexity Card */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-indigo-500/30 shadow-inner flex flex-col justify-between gap-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold text-indigo-300">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" /> Độ phức tạp Thời gian (Time)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Worst Case</span>
              </div>
              <div className="text-2xl font-black font-mono tracking-tight text-indigo-300 mt-1">
                {complexityReport.timeComplexity}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {complexityReport.timeExplanation}
              </p>
            </div>

            {/* Space Complexity Card */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-sky-500/30 shadow-inner flex flex-col justify-between gap-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold text-sky-300">
                  <HardDrive className="w-3.5 h-3.5 text-sky-400" /> Độ phức tạp Không gian (Space)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Bộ nhớ RAM</span>
              </div>
              <div className="text-2xl font-black font-mono tracking-tight text-sky-300 mt-1">
                {complexityReport.spaceComplexity}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {complexityReport.spaceExplanation}
              </p>
            </div>
          </div>

          {/* Real-time Call Stack Recursion Profile Chart */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold text-slate-200">
                  Biểu đồ Chiều sâu Call Stack theo Bước Thực thi
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-slate-400">
                  Hiện tại: <strong className="text-indigo-400">{currentDepth}</strong> frames
                </span>
                <span className="text-slate-400">
                  Đỉnh đệ quy (d_max): <strong className="text-purple-400">{maxStackDepth}</strong>
                </span>
              </div>
            </div>

            {/* Sparkline Bar Chart */}
            <div className="h-16 flex items-end gap-1 overflow-x-auto pt-2 pb-1 px-1 bg-slate-900/60 rounded-lg">
              {steps.map((step, idx) => {
                const height = step.stack_frames?.length || 0;
                const pct = maxStackDepth > 0 ? (height / maxStackDepth) * 100 : 0;
                const isCur = idx === currentStepIndex;

                return (
                  <div
                    key={idx}
                    title={`Bước ${idx + 1}: ${height} frame(s)`}
                    className="flex-1 min-w-[5px] flex flex-col items-center justify-end h-full"
                  >
                    <div
                      style={{ height: `${Math.max(12, pct)}%` }}
                      className={`w-full rounded-t transition-all ${
                        isCur
                          ? 'bg-gradient-to-t from-pink-500 to-indigo-400 shadow-md shadow-pink-500/50'
                          : height === maxStackDepth && maxStackDepth > 1
                          ? 'bg-purple-500/70 hover:bg-purple-400'
                          : 'bg-slate-700 hover:bg-slate-500'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deep Breakdown Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Heap Allocation Breakdown */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <h4 className="font-semibold text-sky-300 flex items-center gap-1.5 mb-1.5">
                <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                Cấp phát Heap Memory
              </h4>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {complexityReport.heapAllocation}
              </p>
            </div>

            {/* Key Operations Count Formula */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <h4 className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                Số phép tính xấp xỉ theo n
              </h4>
              <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                {complexityReport.keyOperationsCount || 'Tùy thuộc vào kích thước dữ liệu đầu vào n.'}
              </p>
            </div>
          </div>

          {/* Optimization Tips */}
          {complexityReport.optimizationTips?.length > 0 && (
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
              <h4 className="font-semibold text-xs text-indigo-300 flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                Lời khuyên Tối ưu hóa Thuật toán từ Gemini:
              </h4>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                {complexityReport.optimizationTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-xs text-slate-400">
          Chưa có phân tích độ phức tạp. Nhấn "Chạy &amp; Trực quan hóa" hoặc "Phân tích lại" để Gemini tính toán.
        </div>
      )}
    </div>
  );
};
