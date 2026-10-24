import React, { useEffect } from 'react';
import {
  SkipBack,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Play,
  Pause,
  Gauge,
  CornerDownLeft,
  CornerDownRight,
  Sparkles,
} from 'lucide-react';
import { TraceStep } from '../types';

interface ControlsProps {
  currentStepIndex: number;
  totalSteps: number;
  onGoToStep: (step: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  currentStep?: TraceStep;
  stepMode?: 'algorithmic' | 'all';
  onToggleStepMode?: () => void;
  rawStepsCount?: number;
  algorithmicStepsCount?: number;
  readyForAutoPlay?: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  currentStepIndex,
  totalSteps,
  onGoToStep,
  isPlaying,
  onTogglePlay,
  speed,
  onChangeSpeed,
  currentStep,
  stepMode = 'algorithmic',
  onToggleStepMode,
  rawStepsCount,
  algorithmicStepsCount,
  readyForAutoPlay = false,
}) => {
  const isFirst = currentStepIndex <= 0;
  const isLast = currentStepIndex >= totalSteps - 1;

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'F8') {
        e.preventDefault();
        if (!isLast) onGoToStep(currentStepIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!isFirst) onGoToStep(currentStepIndex - 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.key === 'Home') {
        onGoToStep(0);
      } else if (e.key === 'End') {
        onGoToStep(totalSteps - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStepIndex, totalSteps, isFirst, isLast, onGoToStep, onTogglePlay]);

  const progressPercent = totalSteps > 1 ? (currentStepIndex / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex flex-col gap-2.5">
      {readyForAutoPlay && !isPlaying && totalSteps > 0 && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 animate-pulse" />
            <span>
              <strong>Bước 2:</strong> Đã nhận dữ liệu bạn vừa nhập! Bây giờ hãy ấn nút{' '}
              <strong className="text-indigo-700 underline">Chạy tự động</strong> bên dưới để xem mô phỏng thuật toán nhé.
            </span>
          </div>
          <button
            type="button"
            onClick={onTogglePlay}
            className="flex items-center gap-1 px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer shrink-0 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Chạy tự động ngay</span>
          </button>
        </div>
      )}

      {/* Top Row: Progress Bar & Current Status & Step Mode Toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-xs text-slate-700">
            Tiến trình chạy từng bước:
          </span>
          <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shadow-xs">
            Bước {totalSteps > 0 ? currentStepIndex + 1 : 0} / {totalSteps}
          </span>

          {/* Nút chuyển đổi chế độ Thuật toán (~20 bước) vs Chi tiết (~60 dòng) */}
          {onToggleStepMode && rawStepsCount !== undefined && algorithmicStepsCount !== undefined && rawStepsCount > algorithmicStepsCount && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] ml-1">
              <button
                type="button"
                onClick={stepMode === 'algorithmic' ? undefined : onToggleStepMode}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                  stepMode === 'algorithmic'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chế độ Thuật toán: Chỉ duyệt các bước có ý nghĩa (so sánh, hoán đổi, chốt mốc) - khoảng 15-25 bước"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Thuật toán ({algorithmicStepsCount} bước)</span>
              </button>
              <button
                type="button"
                onClick={stepMode === 'all' ? undefined : onToggleStepMode}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                  stepMode === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chế độ Chi tiết: Hiển thị từng dòng lệnh Python riêng lẻ (cờ swapped, loop header)"
              >
                <span>Tất cả ({rawStepsCount} dòng)</span>
              </button>
            </div>
          )}
        </div>

        {/* Action text */}
        {currentStep && (
          <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
            {currentStep.event === 'call' && (
              <span className="text-sky-700 flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                <CornerDownLeft className="w-3.5 h-3.5 text-sky-600" />
                Vào hàm {currentStep.stack_frames?.[currentStep.stack_frames.length - 1]?.name}()
              </span>
            )}
            {currentStep.event === 'return' && (
              <span className="text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CornerDownRight className="w-3.5 h-3.5 text-emerald-600" />
                Trả về: {currentStep.return_value?.value || 'None'}
              </span>
            )}
            {currentStep.event === 'line' && (
              <span className="text-slate-600">
                Đang ở dòng <strong className="text-indigo-600 font-mono font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">{currentStep.line_number}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Interactive Range Slider */}
      <div className="relative flex items-center w-full group">
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
          <div
            className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={currentStepIndex}
          onChange={(e) => onGoToStep(Number(e.target.value))}
          disabled={totalSteps <= 1}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          title="Kéo thanh trượt để di chuyển đến bước bất kỳ"
        />
      </div>

      {/* Bottom Controls Bar: Large, Accessible, Clear Buttons */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 flex-wrap">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onGoToStep(0)}
            disabled={isFirst || totalSteps === 0}
            title="Quay về bước đầu tiên (Home)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer border border-slate-200"
          >
            <SkipBack className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Về đầu</span>
          </button>

          <button
            onClick={() => onGoToStep(currentStepIndex - 1)}
            disabled={isFirst || totalSteps === 0}
            title="Lùi lại 1 dòng (Phím mũi tên Trái)"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-slate-800 text-xs font-medium transition-colors cursor-pointer border border-slate-200"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Lùi 1 bước</span>
          </button>

          {/* PRIMARY NEXT STEP BUTTON */}
          <button
            onClick={() => onGoToStep(currentStepIndex + 1)}
            disabled={isLast || totalSteps === 0}
            title="Chạy dòng lệnh tiếp theo (Phím mũi tên Phải hoặc F8)"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer ring-1 ring-emerald-500/20"
          >
            <span>Bước tiếp theo</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* PLAY / PAUSE BUTTON */}
          <button
            onClick={onTogglePlay}
            disabled={totalSteps === 0}
            title={isPlaying ? 'Tạm dừng (Phím Space)' : 'Chạy tự động liên tục (Phím Space)'}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : readyForAutoPlay
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white ring-2 ring-indigo-400 ring-offset-1 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Chạy tự động</span>
              </>
            )}
          </button>

          <button
            onClick={() => onGoToStep(totalSteps - 1)}
            disabled={isLast || totalSteps === 0}
            title="Đến bước cuối cùng (End)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer border border-slate-200"
          >
            <span className="hidden sm:inline">Về cuối</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed & Keyboard Hint */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="hidden lg:inline text-[11px] text-slate-500">
            (Bấm phím <kbd className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono shadow-2xs">←</kbd> <kbd className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono shadow-2xs">→</kbd> trên bàn phím)
          </span>

          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline text-xs font-medium">Tốc độ:</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {[0.5, 1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeSpeed(s)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    speed === s
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
