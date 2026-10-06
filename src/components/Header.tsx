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
}

export const Header: React.FC<HeaderProps> = ({
  onSelectPreset,
  selectedPresetId,
  onRunCode,
  isRunning,
  engine,
  onChangeEngine,
  pyodideReady,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-30 px-4 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 shadow-md text-white font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base md:text-lg text-slate-100 tracking-tight font-mono">
                LAB_PYTHON
              </h1>
              <span className="text-[11px] font-medium text-emerald-400 hidden sm:inline">
                · Dành cho học sinh THPT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              Quan sát máy tính chạy từng dòng lệnh và thay đổi giá trị các biến
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
              className="pl-9 pr-8 py-2 text-xs font-semibold bg-slate-800 text-slate-100 border border-slate-700 rounded-lg hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer shadow-sm"
            >
              <option value="" disabled>-- Chọn bài học mẫu --</option>
              {Array.from(new Set(PRESETS.map((p) => p.category))).map((cat) => (
                <optgroup key={cat} label={`── ${cat} ──`} className="bg-slate-900 text-emerald-400 font-bold">
                  {PRESETS.filter((p) => p.category === cat).map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-800 text-slate-200 font-normal">
                      {p.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Right Actions: Large Run Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRunCode}
            disabled={isRunning}
            title="Chạy code và xem từng bước máy tính hoạt động (Ctrl + Enter)"
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer ring-1 ring-emerald-400"
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
        </div>
      </div>
    </header>
  );
};
