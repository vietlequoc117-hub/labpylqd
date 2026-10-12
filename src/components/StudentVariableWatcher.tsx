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
      <div className="bg-white border border-slate-200/90 rounded-xl p-8 text-center text-slate-500 shadow-xs">
        <Sparkles className="w-8 h-8 mx-auto mb-2 text-indigo-500 opacity-60" />
        <p className="font-semibold text-slate-700">Chưa bắt đầu chạy chương trình</p>
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
        return { label: 'Số nguyên', icon: Hash, color: 'text-sky-700 bg-sky-50 border-sky-200' };
      case 'float':
        return { label: 'Số thực', icon: Hash, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' };
      case 'str':
        return { label: 'Chuỗi chữ', icon: Type, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'bool':
        return { label: 'Đúng / Sai', icon: CheckCircle2, color: 'text-amber-800 bg-amber-50 border-amber-200' };
      case 'list':
        return { label: 'Danh sách mảng', icon: ListFilter, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
      case 'dict':
        return { label: 'Từ điển (Key-Value)', icon: Layers, color: 'text-purple-700 bg-purple-50 border-purple-200' };
      default:
        return { label: val.type, icon: Variable, color: 'text-slate-600 bg-slate-100 border-slate-200' };
    }
  };

  const varEntries = Object.entries(currentVars);

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
      {/* 1. Header Bar: What Computer is Doing */}
      <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
            Máy tính đang làm gì?
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            (Dòng {currentStep.line_number})
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
            Bước {currentStepIndex + 1} / {totalSteps}
          </span>
        </div>
      </div>

      {/* 2. Natural language explanation banner */}
      <div className="p-3 bg-indigo-50/70 border-b border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-950">
        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="flex-1 leading-relaxed">
          <p className="font-semibold text-indigo-900">{getFriendlyExplanation()}</p>
          {currentLineText && (
            <code className="inline-block mt-1 font-mono text-[11px] text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
              {currentLineText}
            </code>
          )}
        </div>
      </div>

      {/* 3. Variables Table */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-slate-50/30">
        <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
          <div className="flex items-center gap-1.5">
            <Variable className="w-3.5 h-3.5 text-indigo-600" />
            <span>Bảng theo dõi các biến (Variables)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-normal">
            Phạm vi: {activeFrame?.name === 'Global frame' ? 'Toàn cục' : `Hàm ${activeFrame?.name}()`}
          </span>
        </div>

        {varEntries.length === 0 ? (
          <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
            <Variable className="w-6 h-6 mx-auto mb-2 text-slate-400" />
            <p className="font-medium text-slate-600">Chưa có biến nào được tạo ở bước này.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
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
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-xs ring-1 ring-emerald-400/30'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    {/* Variable Name and Status */}
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {name}
                      </span>
                      {isJustChanged && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
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
                        <span className="text-xs text-slate-400 font-mono">[</span>
                        {heapObj.elements.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs font-mono"
                          >
                            <span className="text-[9px] text-slate-500 font-sans">
                              vị trí {item.index ?? idx}
                            </span>
                            <span className="text-emerald-700 font-bold">
                              {JSON.stringify(item.value).replace(/^"|"$/g, '')}
                            </span>
                          </div>
                        ))}
                        <span className="text-xs text-slate-400 font-mono">]</span>
                      </div>
                    ) : heapObj && heapObj.type === 'dict' && Array.isArray(heapObj.elements) ? (
                      /* Render Dict / Map Key-Values nicely */
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 py-1">
                        {heapObj.elements.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                          >
                            <span className="text-purple-700 font-medium">{item.key}:</span>
                            <span className="text-amber-800 font-bold ml-1">
                              {JSON.stringify(item.value).replace(/^"|"$/g, '')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Primitive values (int, str, bool, float) */
                      <div className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-xs text-emerald-800 font-semibold break-all">
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
      <div className="p-2.5 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between gap-2">
        <button
          onClick={onPrevStep}
          disabled={currentStepIndex <= 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 text-xs font-medium cursor-pointer transition-colors border border-slate-200"
        >
          <span>◀ Lùi 1 bước</span>
        </button>

        <button
          onClick={onNextStep}
          disabled={currentStepIndex >= totalSteps - 1}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
        >
          <span>Bước tiếp theo</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
