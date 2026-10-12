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
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-col gap-4 text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              Bảng Phân Tích Độ Phức Tạp (Complexity Dashboard)
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" /> AI Phân Tích (Tự động 100%)
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Phân tích Big-O thời gian, không gian đệ quy và cấu trúc cấp phát bộ nhớ
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer border border-slate-200 shadow-2xs"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>{isLoading ? 'Đang phân tích...' : 'Phân tích lại'}</span>
        </button>
      </div>

      {isLoading && !complexityReport ? (
        <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <p>Hệ thống AI đang kiểm tra cấu trúc thuật toán và tính toán Big-O...</p>
        </div>
      ) : complexityReport ? (
        <div className="flex flex-col gap-4">
          {/* Big-O Badges Overview: Time and Space */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Time Complexity Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-indigo-200 shadow-2xs flex flex-col justify-between gap-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-semibold text-indigo-700">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" /> Độ phức tạp Thời gian (Time)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Worst Case</span>
              </div>
              <div className="text-2xl font-black font-mono tracking-tight text-indigo-800 mt-1">
                {complexityReport.timeComplexity}
              </div>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                {complexityReport.timeExplanation}
              </p>
            </div>

            {/* Space Complexity Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-sky-200 shadow-2xs flex flex-col justify-between gap-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-semibold text-sky-700">
                  <HardDrive className="w-3.5 h-3.5 text-sky-600" /> Độ phức tạp Không gian (Space)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Bộ nhớ RAM</span>
              </div>
              <div className="text-2xl font-black font-mono tracking-tight text-sky-800 mt-1">
                {complexityReport.spaceComplexity}
              </div>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                {complexityReport.spaceExplanation}
              </p>
            </div>
          </div>

          {/* Real-time Call Stack Recursion Profile Chart */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-semibold text-slate-800">
                  Biểu đồ Chiều sâu Call Stack theo Bước Thực thi
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-slate-500">
                  Hiện tại: <strong className="text-indigo-700">{currentDepth}</strong> frames
                </span>
                <span className="text-slate-500">
                  Đỉnh đệ quy (d_max): <strong className="text-purple-700">{maxStackDepth}</strong>
                </span>
              </div>
            </div>

            {/* Sparkline Bar Chart */}
            <div className="h-16 flex items-end gap-1 overflow-x-auto pt-2 pb-1 px-1 bg-white rounded-lg border border-slate-200">
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
                          ? 'bg-gradient-to-t from-pink-500 to-indigo-500 shadow-xs'
                          : height === maxStackDepth && maxStackDepth > 1
                          ? 'bg-purple-500 hover:bg-purple-600'
                          : 'bg-slate-300 hover:bg-slate-400'
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
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-semibold text-sky-800 flex items-center gap-1.5 mb-1.5">
                <HardDrive className="w-3.5 h-3.5 text-sky-600" />
                Cấp phát Heap Memory
              </h4>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                {complexityReport.heapAllocation}
              </p>
            </div>

            {/* Key Operations Count Formula */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-semibold text-amber-800 flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                Số phép tính xấp xỉ theo n
              </h4>
              <p className="text-slate-700 font-mono text-[11px] leading-relaxed">
                {complexityReport.keyOperationsCount || 'Tùy thuộc vào kích thước dữ liệu đầu vào n.'}
              </p>
            </div>
          </div>

          {/* Optimization Tips */}
          {complexityReport.optimizationTips?.length > 0 && (
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200">
              <h4 className="font-semibold text-xs text-indigo-900 flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                Lời khuyên Tối ưu hóa Thuật toán từ Trợ lí AI:
              </h4>
              <ul className="space-y-1.5 text-[11px] text-slate-700">
                {complexityReport.optimizationTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
          Chưa có phân tích độ phức tạp. Nhấn "Chạy &amp; Trực quan hóa" hoặc "Phân tích lại" để tính toán.
        </div>
      )}
    </div>
  );
};
