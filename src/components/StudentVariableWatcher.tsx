import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Variable,
  Terminal,
  ChevronRight,
  ListFilter,
  Hash,
  Type,
  Layers,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { TraceStep, StackFrame, HeapObject, VariableValue } from '../types';

interface StudentVariableWatcherProps {
  currentStep?: TraceStep;
  prevStep?: TraceStep;
  currentStepIndex: number;
  totalSteps: number;
  code: string;
  onNextStep?: () => void;
  onPrevStep?: () => void;
}

export const StudentVariableWatcher: React.FC<StudentVariableWatcherProps> = ({
  currentStep,
  prevStep,
  currentStepIndex,
  totalSteps,
  code,
  onNextStep,
  onPrevStep,
}) => {
  if (!currentStep) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <Sparkles className="w-8 h-8 mx-auto mb-2 text-indigo-400 opacity-60" />
        <p className="font-medium text-slate-300">Chưa bắt đầu chạy chương trình</p>
        <p className="text-xs text-slate-500 mt-1">
          Bấm nút "▶ Chạy Chương Trình" ở góc trên để quan sát máy tính từng bước tính toán các biến nhé!
        </p>
      </div>
    );
  }

  // 1. Extract current line of code
  const codeLines = code.split('\n');
  const currentLineIndex = (currentStep.line_number || 1) - 1;
  const currentLineText = codeLines[currentLineIndex]?.trim() || '';

  // 2. Identify active stack frame (the topmost executing function or Global frame)
  const activeFrame =
    currentStep.stack_frames?.find((f) => f.is_active) ||
    currentStep.stack_frames?.[currentStep.stack_frames.length - 1] ||
    currentStep.stack_frames?.[0];

  const prevActiveFrame =
    prevStep?.stack_frames?.find((f) => f.name === activeFrame?.name) ||
    prevStep?.stack_frames?.[prevStep.stack_frames.length - 1];

  const currentVars = activeFrame?.variables || {};
  const prevVars = prevActiveFrame?.variables || {};

  // 3. Find which variable just changed in this step
  let changedVarName: string | null = null;
  let changedVarVal: string | null = null;

  for (const [key, val] of Object.entries(currentVars)) {
    const prevVal = prevVars[key];
    const currStr = JSON.stringify(val);
    const prevStr = prevVal ? JSON.stringify(prevVal) : null;
    if (currStr !== prevStr) {
      changedVarName = key;
      changedVarVal = val.value;
      break;
    }
  }

  // 4. Generate high-school-friendly natural language explanation
  const getFriendlyExplanation = () => {
    if (currentStep.event === 'call') {
      const fnName = activeFrame?.name === 'Global frame' ? 'toàn cục' : `hàm ${activeFrame?.name}()`;
      return `Bắt đầu bước vào ${fnName}.`;
    }
    if (currentStep.event === 'return') {
      return `Hàm ${activeFrame?.name || ''} đã chạy xong và trả về kết quả: ${
        currentStep.return_value?.value || 'None'
      }.`;
    }
    if (changedVarName) {
      return `Cập nhật biến "${changedVarName}" với giá trị mới: ${changedVarVal || ''}`;
    }
    if (currentLineText.startsWith('for ') || currentLineText.includes(' in ')) {
      return `Đang thực hiện vòng lặp để duyệt dữ liệu: ${currentLineText}`;
    }
    if (currentLineText.startsWith('if ') || currentLineText.startsWith('elif ')) {
      return `Đang kiểm tra điều kiện rẽ nhánh: ${currentLineText}`;
    }
    if (currentLineText.startsWith('print(')) {
      return `Đang xuất dữ liệu ra màn hình: ${currentLineText}`;
    }
    if (currentLineText.includes('input(') || currentLineText.includes('sys.stdin')) {
      return `Đọc dữ liệu người dùng nhập vào từ bàn phím (stdin).`;
    }
    return `Đang thực thi dòng lệnh: ${currentLineText}`;
  };

  // Helper to translate python types to high-school friendly terms
  const getFriendlyType = (val: VariableValue): { label: string; icon: any; color: string } => {
    switch (val.type) {
      case 'int':
        return { label: 'Số nguyên', icon: Hash, color: 'text-sky-400 bg-sky-950/50 border-sky-800/60' };
      case 'float':
        return { label: 'Số thực', icon: Hash, color: 'text-cyan-400 bg-cyan-950/50 border-cyan-800/60' };
      case 'str':
        return { label: 'Chuỗi chữ', icon: Type, color: 'text-emerald-400 bg-emerald-950/50 border-emerald-800/60' };
      case 'bool':
        return { label: 'Đúng / Sai', icon: CheckCircle2, color: 'text-amber-400 bg-amber-950/50 border-amber-800/60' };
      case 'list':
        return { label: 'Danh sách mảng', icon: ListFilter, color: 'text-indigo-400 bg-indigo-950/50 border-indigo-800/60' };
      case 'dict':
        return { label: 'Từ điển (Key-Value)', icon: Layers, color: 'text-purple-400 bg-purple-950/50 border-purple-800/60' };
      default:
        return { label: val.type, icon: Variable, color: 'text-slate-400 bg-slate-800/50 border-slate-700' };
    }
  };

  const varEntries = Object.entries(currentVars);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* 1. Header Bar: What Computer is Doing */}
      <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
            Máy tính đang làm gì?
          </span>
          <span className="text-[11px] text-slate-400">
            (Dòng {currentStep.line_number})
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Bước {currentStepIndex + 1} / {totalSteps}
          </span>
        </div>
      </div>

      {/* 2. Natural language explanation banner */}
      <div className="p-3 bg-indigo-950/30 border-b border-indigo-900/30 flex items-start gap-2.5 text-xs text-indigo-200">
        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="flex-1 leading-relaxed">
          <p className="font-medium text-indigo-100">{getFriendlyExplanation()}</p>
          {currentLineText && (
            <code className="inline-block mt-1 font-mono text-[11px] text-emerald-300 bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-900/40">
              {currentLineText}
            </code>
          )}
        </div>
      </div>

      {/* 3. Variables Table */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
          <div className="flex items-center gap-1.5">
            <Variable className="w-3.5 h-3.5 text-indigo-400" />
            <span>Bảng theo dõi các biến (Variables)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-normal">
            Phạm vi: {activeFrame?.name === 'Global frame' ? 'Toàn cục' : `Hàm ${activeFrame?.name}()`}
          </span>
        </div>

        {varEntries.length === 0 ? (
          <div className="p-6 bg-slate-950/50 border border-slate-800/80 rounded-xl text-center text-xs text-slate-500">
            <Variable className="w-6 h-6 mx-auto mb-2 text-slate-600" />
            <p>Chưa có biến nào được tạo ở bước này.</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Hãy bấm nút "Bước tiếp theo ▶" để máy tính gán và tạo biến nhé!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {varEntries.map(([name, val]) => {
              const isJustChanged = name === changedVarName;
              const typeInfo = getFriendlyType(val);
              const Icon = typeInfo.icon;

              // If it points to a Heap Object (like list, dict)
              const heapObj = val.ref_id ? currentStep.heap_objects?.[val.ref_id] : null;

              return (
                <div
                  key={name}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isJustChanged
                      ? 'bg-emerald-950/30 border-emerald-500/80 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                      : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    {/* Variable Name and Status */}
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-100">
                        {name}
                      </span>
                      {isJustChanged && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                          ✨ Vừa thay đổi
                        </span>
                      )}
                    </div>

                    {/* Type badge */}
                    <div
                      className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${typeInfo.color}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{typeInfo.label}</span>
                    </div>
                  </div>

                  {/* Variable Value Display */}
                  <div className="mt-1">
                    {/* Render List / Array elements nicely */}
                    {heapObj && heapObj.type === 'list' && Array.isArray(heapObj.elements) ? (
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                        <span className="text-xs text-slate-500 font-mono">[</span>
                        {heapObj.elements.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col items-center bg-slate-900 border border-slate-700/80 rounded px-2 py-0.5 text-xs font-mono"
                          >
                            <span className="text-[9px] text-slate-500 font-sans">
                              vị trí {item.index ?? idx}
                            </span>
                            <span className="text-emerald-300 font-semibold">
                              {JSON.stringify(item.value).replace(/^"|"$/g, '')}
                            </span>
                          </div>
                        ))}
                        <span className="text-xs text-slate-500 font-mono">]</span>
                      </div>
                    ) : heapObj && heapObj.type === 'dict' && Array.isArray(heapObj.elements) ? (
                      /* Render Dict / Map Key-Values nicely */
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 py-1">
                        {heapObj.elements.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs font-mono"
                          >
                            <span className="text-purple-300 font-medium">{item.key}:</span>
                            <span className="text-amber-300 font-bold ml-1">
                              {JSON.stringify(item.value).replace(/^"|"$/g, '')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Primitive values (int, str, bool, float) */
                      <div className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-xs text-emerald-300 break-all">
                        {val.value}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Quick Action Button at Bottom */}
      <div className="p-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={onPrevStep}
          disabled={currentStepIndex <= 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 text-xs font-medium cursor-pointer transition-colors"
        >
          <span>◀ Lùi 1 bước</span>
        </button>

        <button
          onClick={onNextStep}
          disabled={currentStepIndex >= totalSteps - 1}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold shadow-md shadow-emerald-600/30 cursor-pointer transition-all"
        >
          <span>Bước tiếp theo</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
