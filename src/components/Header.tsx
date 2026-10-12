import React from 'react';
import { BookOpen, Play, RefreshCw, Sparkles, CheckCircle2, GraduationCap } from 'lucide-react';
import { PRESETS } from '../presets';

interface HeaderProps {
  onSelectPreset: (presetId: string) => void;
  selectedPresetId: string;
  onRunCode: () => void;
  isRunning: boolean;
  engine: 'auto' | 'pyodide' | 'backend';
  onChangeEngine: (engine: 'auto' | 'pyodide' | 'backend') => void;
  pyodideReady: boolean;
  onOpenAiTutor?: () => void;
  isAiTutorActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectPreset,
  selectedPresetId,
  onRunCode,
  isRunning,
  engine,
  onChangeEngine,
  pyodideReady,
  onOpenAiTutor,
  isAiTutorActive,
}) => {
  return (
    <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-30 px-4 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 shadow-xs text-white font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base md:text-lg text-slate-900 tracking-tight font-mono">
                LQD_PYTHON_LAB
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block">
              Phòng thực hành ảo Python &amp; Giải thích Thuật toán
            </p>
          </div>
        </div>

        {/* Center: Presets Selector + Quick Custom Code button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex items-center">
            <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={selectedPresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="pl-9 pr-8 py-2 text-xs font-semibold bg-slate-50 text-slate-800 border border-slate-200 rounded-lg hover:border-slate-300 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer shadow-xs"
            >
              <option value="" disabled>-- Chọn bài học mẫu --</option>
              {Array.from(new Set(PRESETS.map((p) => p.category))).map((cat) => (
                <optgroup key={cat} label={`── ${cat} ──`} className="bg-slate-100 text-emerald-800 font-bold">
                  {PRESETS.filter((p) => p.category === cat).map((p) => (
                    <option key={p.id} value={p.id} className="bg-white text-slate-800 font-normal">
                      {p.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Right Actions: Large Run Button & AI Tutor Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRunCode}
            disabled={isRunning}
            title="Chạy code và xem từng bước máy tính hoạt động (Ctrl + Enter)"
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer ring-1 ring-emerald-500/20"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Chạy Chương Trình</span>
              </>
            )}
          </button>

          {/* Nút Trợ Lí AI (THPT) ngay đằng sau nút Chạy Chương Trình */}
          {onOpenAiTutor && (
            <button
              onClick={onOpenAiTutor}
              title="Mở Trợ Lí AI chuyên biệt giải thích thuật toán cho học sinh cấp THPT (Tích hợp sẵn 100%, không cần cài đặt API)"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isAiTutorActive
                  ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-300'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Trợ Lí AI (THPT)</span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded hidden sm:inline">
                Sẵn sàng
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
