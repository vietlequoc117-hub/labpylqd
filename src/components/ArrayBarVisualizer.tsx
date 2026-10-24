import React, { useState, useMemo } from 'react';
import {
  BarChart2,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  RotateCcw,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sliders,
  CheckCircle2,
  ListOrdered,
  Type,
  Binary,
} from 'lucide-react';
import { TraceStep, StackFrame, HeapObject } from '../types';

export type VisualItemValue = number | string;

// Trích xuất danh sách giá trị (số hoặc chuỗi/kí tự) của mảng từ bất kỳ TraceStep nào
const extractArrayFromStep = (step?: TraceStep, code?: string): VisualItemValue[] | null => {
  if (!step?.heap_objects) return null;
  const activeFrame =
    step.stack_frames?.find((f) => f.is_active) ||
    step.stack_frames?.[step.stack_frames.length - 1] ||
    step.stack_frames?.[0];
  const vars = activeFrame?.variables || {};

  const preferredNames = [
    'arr',
    'numbers',
    'user_data',
    'a',
    'nums',
    'data',
    'list',
    'words',
    'chars',
    'characters',
    'string_arr',
    's',
    'text',
  ];

  for (const name of preferredNames) {
    const varVal = vars[name];
    if (varVal && varVal.ref_id) {
      const heapObj = step.heap_objects[varVal.ref_id];
      if (heapObj && (heapObj.type === 'list' || heapObj.type === 'tuple') && Array.isArray(heapObj.elements)) {
        const items = heapObj.elements
          .map((el) => {
            if (typeof el.value === 'number') return el.value;
            if (typeof el.value === 'string') {
              if (el.type === 'str') return el.value;
              const n = parseFloat(el.value);
              return !isNaN(n) ? n : el.value;
            }
            return null;
          })
          .filter((v): v is VisualItemValue => v !== null);
        if (items.length > 0) return items;
      }
    }
  }

  const ignoredTempListIds = new Set<string>();
  if (vars['parts']?.ref_id) {
    ignoredTempListIds.add(vars['parts'].ref_id);
  }

  for (const [heapId, heapObj] of Object.entries(step.heap_objects)) {
    if (ignoredTempListIds.has(heapId)) continue;
    if (heapObj && (heapObj.type === 'list' || heapObj.type === 'tuple') && Array.isArray(heapObj.elements)) {
      const items = heapObj.elements
        .map((el) => {
          if (typeof el.value === 'number') return el.value;
          if (typeof el.value === 'string') {
            if (el.type === 'str') return el.value;
            const n = parseFloat(el.value);
            return !isNaN(n) ? n : el.value;
          }
          return null;
        })
        .filter((v): v is VisualItemValue => v !== null);
      if (items.length > 0) return items;
    }
  }

  if (code && (/\bdef\s+[a-zA-Z_]\w*\s*\(/.test(code) || code.includes('.split('))) {
    return null;
  }

  // Nếu không có list trong heap nhưng có biến xâu kí tự nguyên thủy (ví dụ s = "abcdefg", t = s[::2])
  const stringNames = [...preferredNames, 't', 'xau', 'chuoi', 'st', 'res', 'result', 'ans', 'kq'];
  for (const name of stringNames) {
    const varVal = vars[name];
    if (varVal && varVal.type === 'str') {
      const rawStr = String(varVal.value).replace(/^['"]|['"]$/g, '');
      if (rawStr.length >= 1 && !rawStr.startsWith('[') && !rawStr.startsWith('{')) {
        return rawStr.split('');
      }
    }
  }

  for (const [k, varVal] of Object.entries(vars)) {
    if (k.startsWith('_') || k === 'raw' || k === 'k_raw') continue;
    if (varVal && varVal.type === 'str') {
      const rawStr = String(varVal.value).replace(/^['"]|['"]$/g, '');
      if (rawStr.length >= 1) {
        return rawStr.split('');
      }
    }
  }

  return null;
};

// Trích xuất giá trị i và j từ TraceStep
const extractIndicesFromStep = (step?: TraceStep): { i?: number; j?: number } => {
  if (!step) return {};
  const activeFrame =
    step.stack_frames?.find((f) => f.is_active) ||
    step.stack_frames?.[step.stack_frames.length - 1] ||
    step.stack_frames?.[0];
  const vars = activeFrame?.variables || {};

  let iVal: number | undefined = undefined;
  let jVal: number | undefined = undefined;

  if (vars['i'] !== undefined) iVal = parseInt(vars['i'].value, 10);
  if (vars['j'] !== undefined) jVal = parseInt(vars['j'].value, 10);

  if (iVal === undefined || jVal === undefined) {
    for (const frame of step.stack_frames || []) {
      if (iVal === undefined && frame.variables['i'] !== undefined) {
        iVal = parseInt(frame.variables['i'].value, 10);
      }
      if (jVal === undefined && frame.variables['j'] !== undefined) {
        jVal = parseInt(frame.variables['j'].value, 10);
      }
    }
  }

  return {
    i: isNaN(iVal as number) ? undefined : iVal,
    j: isNaN(jVal as number) ? undefined : jVal,
  };
};

interface ArrayBarVisualizerProps {
  currentStep?: TraceStep;
  prevStep?: TraceStep;
  currentStepIndex: number;
  totalSteps: number;
  allSteps?: TraceStep[];
  onGoToStep?: (index: number) => void;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  code: string;
  hasRun?: boolean;
  onRunCode?: () => void;
  isWaitingAlgorithmInput?: boolean;
  readyForAutoPlay?: boolean;
  isSearchMode?: boolean;
  stdinInput?: string;
  onStdinChange?: (val: string) => void;
  onConfirmAlgorithmInput?: () => void;
}

export const ArrayBarVisualizer: React.FC<ArrayBarVisualizerProps> = ({
  currentStep,
  prevStep,
  currentStepIndex,
  totalSteps,
  allSteps,
  onGoToStep,
  onNextStep,
  onPrevStep,
  isPlaying,
  onTogglePlay,
  code,
  hasRun = false,
  onRunCode,
  isWaitingAlgorithmInput = false,
  readyForAutoPlay = false,
  isSearchMode = false,
  stdinInput = '',
  onStdinChange,
  onConfirmAlgorithmInput,
}) => {
  // Theme toggle: 'light' (chuẩn như ảnh người dùng gửi) hoặc 'dark' (đồng bộ app)
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const { searchLine1, searchLine2 } = useMemo(() => {
    const rawLines = (stdinInput || '').split(/\r?\n/);
    const line1 = rawLines[0] ?? '';
    const line2 = rawLines.length > 1 ? rawLines.slice(1).join(' ').trim() : '';
    return { searchLine1: line1, searchLine2: line2 };
  }, [stdinInput]);

  const handleUpdateSearchLines = (newLine1: string, newLine2: string) => {
    if (!onStdinChange) return;
    if (newLine1.includes('\n')) {
      const split = newLine1.split(/\r?\n/);
      onStdinChange(`${split[0]}\n${split[1] ?? newLine2}`);
      return;
    }
    onStdinChange(`${newLine1}\n${newLine2}`);
  };

  // 1. Trích xuất mảng (số hoặc xâu kí tự) từ currentStep hoặc mã code
  const activeFrame =
    currentStep?.stack_frames?.find((f) => f.is_active) ||
    currentStep?.stack_frames?.[currentStep.stack_frames.length - 1] ||
    currentStep?.stack_frames?.[0];

  const currentVars = activeFrame?.variables || {};

  // Tìm biến mảng (list) trong các biến hiện hành
  const arrayData = useMemo(() => {
    if (!currentStep?.heap_objects) return null;

    const preferredNames = [
      'arr',
      'numbers',
      'user_data',
      'a',
      'nums',
      'data',
      'list',
      'words',
      'chars',
      'characters',
      'string_arr',
      's',
      'text',
    ];

    for (const name of preferredNames) {
      const varVal = currentVars[name];
      if (varVal && varVal.ref_id) {
        const heapObj = currentStep.heap_objects[varVal.ref_id];
        if (heapObj && (heapObj.type === 'list' || heapObj.type === 'tuple') && Array.isArray(heapObj.elements)) {
          const items: VisualItemValue[] = heapObj.elements
            .map((el) => {
              if (typeof el.value === 'number') return el.value;
              if (typeof el.value === 'string') {
                if (el.type === 'str') return el.value;
                const n = parseFloat(el.value);
                return !isNaN(n) ? n : el.value;
              }
              return null;
            })
            .filter((v): v is VisualItemValue => v !== null);
          if (items.length > 0) {
            return { name, values: items, elements: heapObj.elements };
          }
        }
      }
    }

    // Nếu không tìm thấy theo tên ưu tiên, tìm bất kỳ list nào trong heap_objects (bỏ qua parts trung gian)
    const ignoredTempListIds = new Set<string>();
    if (currentVars['parts']?.ref_id) {
      ignoredTempListIds.add(currentVars['parts'].ref_id);
    }

    for (const [id, heapObj] of Object.entries(currentStep.heap_objects)) {
      if (ignoredTempListIds.has(id)) continue;
      if (heapObj && (heapObj.type === 'list' || heapObj.type === 'tuple') && Array.isArray(heapObj.elements)) {
        const items: VisualItemValue[] = heapObj.elements
          .map((el) => {
            if (typeof el.value === 'number') return el.value;
            if (typeof el.value === 'string') {
              if (el.type === 'str') return el.value;
              const n = parseFloat(el.value);
              return !isNaN(n) ? n : el.value;
            }
            return null;
          })
          .filter((v): v is VisualItemValue => v !== null);
        if (items.length > 0) {
          const varEntry = Object.entries(currentVars).find(([_, v]) => v.ref_id === id);
          return { name: varEntry ? varEntry[0] : 'arr', values: items, elements: heapObj.elements };
        }
      }
    }

    if (!/\bdef\s+[a-zA-Z_]\w*\s*\(/.test(code) && !code.includes('.split(')) {
      // Fallback nếu có xâu kí tự nguyên thủy (s, t, xau, chuoi...)
      const stringNames = [...preferredNames, 't', 'xau', 'chuoi', 'st', 'res', 'result', 'ans', 'kq'];
      for (const name of stringNames) {
        const varVal = currentVars[name];
        if (varVal && varVal.type === 'str') {
          const rawStr = String(varVal.value).replace(/^['"]|['"]$/g, '');
          if (rawStr.length >= 1 && !rawStr.startsWith('[') && !rawStr.startsWith('{')) {
            return { name, values: rawStr.split(''), elements: [] };
          }
        }
      }

      for (const [varName, varVal] of Object.entries(currentVars)) {
        if (varName.startsWith('_') || varName === 'raw' || varName === 'k_raw') continue;
        if (varVal && varVal.type === 'str') {
          const rawStr = String(varVal.value).replace(/^['"]|['"]$/g, '');
          if (rawStr.length >= 1) {
            return { name: varName, values: rawStr.split(''), elements: [], customLabels: undefined, isScalarMode: false };
          }
        }
      }
    }

    // Fallback cho bài tập cơ bản chỉ có các biến đơn (ví dụ: n = 5, m = 10, a = n * m = 50)
    const scalarEntries: { name: string; val: VisualItemValue }[] = [];
    const sourceVars =
      Object.keys(currentVars).length > 0
        ? currentVars
        : allSteps && allSteps.length > 0
        ? (
            allSteps[allSteps.length - 1].stack_frames?.find((f) => f.is_active) ||
            allSteps[allSteps.length - 1].stack_frames?.[0]
          )?.variables || {}
        : {};

    for (const [varName, varVal] of Object.entries(sourceVars)) {
      if (varName.startsWith('_')) continue;
      if (varVal && (varVal.type === 'int' || varVal.type === 'float' || typeof varVal.value === 'number')) {
        const num = Number(varVal.value);
        if (!isNaN(num)) {
          scalarEntries.push({ name: varName, val: num });
        }
      }
    }

    if (scalarEntries.length > 0 || (!/\bdef\s+[a-zA-Z_]\w*\s*\(/.test(code) && allSteps && allSteps.length > 0)) {
      return {
        name: 'Biến số',
        values: scalarEntries.map((e) => e.val),
        elements: [],
        customLabels: scalarEntries.map((e) => e.name),
        isScalarMode: true,
      };
    }

    return null;
  }, [currentStep, currentVars, allSteps, code]);

  // Danh sách các biến Xâu kí tự (chỉ kích hoạt cho bài tập xâu tự gõ không có mảng/hàm thuật toán)
  const allStringVars = useMemo(() => {
    // Không hiển thị phần này đối với các bài thuật toán (có định nghĩa hàm def hoặc có danh sách mảng trong heap)
    if (/\bdef\s+[a-zA-Z_]\w*\s*\(/.test(code)) return [];
    const hasHeapList = Object.values(currentStep?.heap_objects || {}).some(
      (obj) => obj && (obj.type === 'list' || obj.type === 'tuple')
    );
    if (hasHeapList) return [];

    const list: { name: string; strValue: string; chars: string[] }[] = [];
    for (const [k, v] of Object.entries(currentVars)) {
      if (k.startsWith('_') || k === 'raw' || k === 'k_raw') continue;
      if (v && v.type === 'str') {
        const raw = String(v.value).replace(/^['"]|['"]$/g, '');
        if (raw.length >= 1) {
          list.push({ name: k, strValue: raw, chars: raw.split('') });
        }
      }
    }
    return list;
  }, [currentVars, currentStep, code]);

  const [selectedStrVarName, setSelectedStrVarName] = useState<string | null>(null);

  // Trích xuất i, j tại bước hiện tại
  const currentIndices = extractIndicesFromStep(currentStep);

  // Tổng hợp danh sách chốt kết quả dãy số/xâu sau mỗi lượt chạy của vòng lặp i
  const iPassSnapshots = useMemo(() => {
    if (!allSteps || allSteps.length === 0) return [];

    interface PassSnapshot {
      label: string;
      iVal: number;
      stepIndex: number;
      array: VisualItemValue[];
      isFinal?: boolean;
    }

    const snapshots: PassSnapshot[] = [];
    let lastI: number | undefined = undefined;
    let lastCandidate: PassSnapshot | null = null;

    allSteps.forEach((st, idx) => {
      const { i } = extractIndicesFromStep(st);
      const arr = extractArrayFromStep(st);

      if (i !== undefined && arr && arr.length > 0) {
        if (lastI !== undefined && i !== lastI && lastCandidate) {
          snapshots.push({ ...lastCandidate });
        }
        lastI = i;
        lastCandidate = {
          label: `Lượt i = ${i}`,
          iVal: i,
          stepIndex: idx,
          array: [...arr],
        };
      }
    });

    if (lastCandidate) {
      snapshots.push(lastCandidate);
    }

    // Kết quả chốt hoàn chỉnh ở bước cuối cùng
    const finalStep = allSteps[allSteps.length - 1];
    const finalArr = extractArrayFromStep(finalStep);
    if (finalArr && finalArr.length > 0) {
      const prev = snapshots[snapshots.length - 1];
      if (!prev || JSON.stringify(prev.array) !== JSON.stringify(finalArr)) {
        snapshots.push({
          label: 'Chốt xong',
          iVal: 999,
          stepIndex: allSteps.length - 1,
          array: [...finalArr],
          isFinal: true,
        });
      }
    }

    return snapshots;
  }, [allSteps]);

  // Dữ liệu mảng hoặc xâu thực tế từ quá trình chạy mã Python
  const activeStringOverride = useMemo(() => {
    if (!selectedStrVarName) return null;
    return allStringVars.find((sv) => sv.name === selectedStrVarName) || null;
  }, [selectedStrVarName, allStringVars]);

  const values: VisualItemValue[] = activeStringOverride
    ? activeStringOverride.chars
    : arrayData?.values || [];
  const arrayName = activeStringOverride ? activeStringOverride.name : arrayData?.name || 'arr';
  const customBarLabels: string[] | undefined = activeStringOverride
    ? undefined
    : (arrayData as any)?.customLabels;
  const isScalarMode: boolean = !activeStringOverride && Boolean((arrayData as any)?.isScalarMode);
  const hasArrayData = values.length > 0;

  // Kiểm tra kiểu dữ liệu: mảng số hay xâu kí tự
  const isStringData = useMemo(() => {
    return values.some((v) => typeof v === 'string');
  }, [values]);

  const isSearchAlgorithm = useMemo(() => {
    return (
      code.includes('linear_search') ||
      code.includes('binary_search') ||
      currentVars['target'] !== undefined ||
      currentVars['can_tim'] !== undefined ||
      currentVars['vi_tri'] !== undefined
    );
  }, [code, currentVars]);

  // 2. Trích xuất các biến con trỏ chỉ số (i, j, min_idx, key, pivot, mid, left, right...)
  const pointers = useMemo(() => {
    const map: Record<string, number> = {};
    const pointerNames = isSearchAlgorithm
      ? ['i', 'j', 'min_idx', 'pivot', 'key', 'mid', 'left', 'right']
      : ['i', 'j', 'k', 'min_idx', 'pivot', 'key', 'mid', 'left', 'right'];
    for (const p of pointerNames) {
      if (currentVars[p] !== undefined) {
        const val = parseInt(currentVars[p].value, 10);
        if (!isNaN(val) && val >= 0 && val < values.length) {
          map[p] = val;
        }
      }
    }
    return map;
  }, [currentVars, values.length, isSearchAlgorithm]);

  // Trích xuất giá trị mục tiêu tìm kiếm (k / target / can_tim) nếu có
  const searchTargetInfo = useMemo(() => {
    const globalVars = currentStep?.stack_frames?.[0]?.variables || {};
    const targetVar =
      currentVars['target'] ||
      currentVars['can_tim'] ||
      (isSearchAlgorithm ? currentVars['k'] || globalVars['k'] : undefined) ||
      globalVars['target'] ||
      globalVars['can_tim'];
    if (!targetVar) return null;
    let rawVal = targetVar.value;
    if (typeof rawVal === 'string') {
      rawVal = rawVal.replace(/^['"]|['"]$/g, '');
    }
    const name =
      currentVars['k'] || (isSearchAlgorithm && globalVars['k'])
        ? 'k'
        : currentVars['target'] || globalVars['target']
        ? 'target'
        : 'can_tim';
    return {
      name,
      value: rawVal,
    };
  }, [currentVars, currentStep, isSearchAlgorithm]);

  // 3. Chuẩn hóa giá trị các cột để tính toán chiều cao tối ưu cho cả Số và Xâu kí tự
  const barItems = useMemo(() => {
    const rawItems = values.map((val) => {
      let display = String(val);
      let numericVal = 0;
      let ascii: number | undefined = undefined;

      if (typeof val === 'number') {
        numericVal = val;
      } else {
        // Xâu hoặc kí tự đơn
        if (val.length === 1) {
          ascii = val.charCodeAt(0);
          numericVal = ascii;
        } else {
          // Từ vựng: dùng mã chữ cái đầu làm trọng số chính + chữ cái thứ 2
          ascii = val.charCodeAt(0);
          numericVal = val.charCodeAt(0) * 1000 + (val.charCodeAt(1) ? val.charCodeAt(1) : 0);
        }
      }
      return { raw: val, display, numericVal, ascii };
    });

    const numericVals = rawItems.map((r) => r.numericVal);
    const minNum = Math.min(...numericVals);
    const maxNum = Math.max(...numericVals);

    return rawItems.map((item) => {
      let heightPercent = 20;

      if (isStringData) {
        // Tối ưu biểu diễn Xâu kí tự: kéo giãn khoảng cách chiều cao từ 18% đến 92%
        // để tạo độ dốc bậc thang cực kỳ rõ ràng giữa các chữ cái (A -> Z)!
        if (maxNum === minNum) {
          heightPercent = 55;
        } else {
          heightPercent = Math.round(18 + ((item.numericVal - minNum) / (maxNum - minNum)) * 74);
        }
      } else {
        // Dữ liệu số nguyên: theo tỉ lệ phần trăm giá trị lớn nhất
        const maxVal = Math.max(maxNum, 1);
        heightPercent = Math.max(14, Math.round((item.numericVal / maxVal) * 100));
      }

      return {
        ...item,
        heightPercent,
      };
    });
  }, [values, isStringData]);

  // 4. Xác định màu sắc từng cột theo thuật toán:
  // - Màu Cam (Orange #f59e0b): Vùng đã sắp xếp / Đã xử lý
  // - Màu Đỏ (Crimson #e11d48): Phần tử đang được chọn / đang so sánh (Active)
  // - Màu Xanh Nhạt (Sky Blue #7dd3fc): Vùng chưa sắp xếp / còn lại
  // - Màu Xanh Lá (Emerald #10b981): Khi mảng hoàn thành sắp xếp hoặc tìm thấy mục tiêu
  const getBarColorType = (index: number): 'orange' | 'red' | 'blue' | 'green' => {
    // Nếu tìm kiếm nhị phân hoặc tuần tự tìm thấy mục tiêu:
    const item = values[index];
    const foundIdxVal =
      currentVars['vi_tri'] !== undefined ? parseInt(currentVars['vi_tri'].value, 10) : undefined;
    const isTargetMatch =
      searchTargetInfo &&
      (String(item) === String(searchTargetInfo.value) ||
        (typeof item === 'number' && Number(searchTargetInfo.value) === item)) &&
      (pointers['mid'] === index || pointers['i'] === index || foundIdxVal === index);

    if (isTargetMatch) {
      return 'green';
    }

    // Con trỏ đang xét (i hoặc j hoặc key hoặc min_idx hoặc mid)
    const isRedHighlight =
      pointers['i'] === index ||
      pointers['min_idx'] === index ||
      pointers['mid'] === index;

    if (isRedHighlight) {
      return 'red';
    }

    if (pointers['j'] === index) {
      return 'red';
    }

    // Kiểm tra vùng đã sắp xếp:
    const iVal = pointers['i'];
    if (iVal !== undefined) {
      if (code.includes('insertion_sort') && index < iVal) {
        return 'orange';
      }
      if (code.includes('selection_sort') && index < iVal) {
        return 'orange';
      }
      if (code.includes('bubble_sort') && index >= values.length - iVal) {
        return 'orange';
      }
    }

    // Kiểm tra xem toàn bộ mảng đã sắp xếp hoàn tất chưa (chỉ áp dụng cho thuật toán Sắp xếp)
    const isSorted = values.every((v, idx) => idx === 0 || v >= values[idx - 1]);
    if (!isSearchAlgorithm && isSorted && currentStepIndex === totalSteps - 1) {
      return 'green';
    }

    // Mặc định: Màu xanh nhạt (chưa sắp xếp)
    return 'blue';
  };

  return (
    <div
      className={`rounded-xl border transition-all duration-300 shadow-xs overflow-hidden flex flex-col ${
        theme === 'light'
          ? 'bg-white border-slate-200/90 text-slate-800'
          : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}
    >
      {/* Header bar */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between border-b text-xs flex-wrap gap-2 ${
          theme === 'light'
            ? 'bg-slate-50/80 border-slate-200 text-slate-800'
            : 'bg-slate-950/80 border-slate-800 text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1 rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-400">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Biểu Đồ Cột Trực Quan (Array Bar Chart)</span>
              {!hasArrayData ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  Đang để trống (Chờ chạy)
                </span>
              ) : isStringData ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Type className="w-3 h-3" />
                  <span>Xâu Kí Tự / Bảng mã ASCII</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/40 flex items-center gap-1">
                  <Binary className="w-3 h-3" />
                  <span>Mảng Số Nguyên</span>
                </span>
              )}
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              {hasArrayData
                ? `${arrayName}[0..${values.length - 1}] (${values.length} phần tử)${
                    isStringData ? ' • Sắp xếp chuẩn theo thứ tự từ điển & ASCII' : ''
                  }`
                : 'Nhấn Chạy Chương Trình để bắt đầu mô phỏng'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge mục tiêu tìm kiếm (nếu có) */}
          {searchTargetInfo && hasArrayData && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
              <span className="font-semibold">Mục tiêu {searchTargetInfo.name}:</span>
              <strong className="px-1.5 py-0.2 rounded bg-emerald-500 text-white font-bold">
                {String(searchTargetInfo.value)}
              </strong>
            </div>
          )}

          {/* Nút Chạy tự động trực tiếp trên Biểu Đồ Cột khi học sinh đã nhập dữ liệu xong */}
          {hasRun && hasArrayData && totalSteps > 0 && !isWaitingAlgorithmInput && onTogglePlay && (
            <button
              type="button"
              onClick={onTogglePlay}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : readyForAutoPlay
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white ring-2 ring-indigo-400 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
              title={isPlaying ? 'Tạm dừng mô phỏng' : 'Chạy tự động từng bước mô phỏng thuật toán'}
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
          )}

          {/* Nút đổi giao diện Sáng / Tối */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title={theme === 'light' ? 'Chuyển sang giao diện Tối' : 'Chuyển sang giao diện Sáng'}
          >
            {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isWaitingAlgorithmInput ? (
        <div
          className={`p-6 md:p-8 flex flex-col justify-center items-center relative min-h-[320px] ${
            theme === 'light' ? 'bg-gradient-to-b from-amber-50/40 to-slate-100/90' : 'bg-[#0b1120]'
          }`}
        >
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-2 border-amber-400 rounded-2xl p-5 shadow-md flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Bước 1: Học sinh tự nhập dữ liệu đầu vào (input)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nhập dữ liệu bên dưới rồi nhấn <strong>Nhập xong (Enter)</strong>, sau đó ấn nút <strong>Chạy tự động</strong> để xem mô phỏng!
                </p>
              </div>
            </div>

            {isSearchMode ? (
              <div className="flex flex-col gap-2.5 text-left">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300">
                    Dòng 1: Mảng số hoặc xâu kí tự (s = input(...)):
                  </label>
                  <input
                    type="text"
                    value={searchLine1}
                    onChange={(e) => handleUpdateSearchLines(e.target.value, searchLine2)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onConfirmAlgorithmInput?.();
                      }
                    }}
                    placeholder="Ví dụ: 12 45 7 23 56 89 hoặc P Y T H O N..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    Dòng 2: Số k hoặc kí tự cần tìm (k = int(input(...))):
                  </label>
                  <input
                    type="text"
                    value={searchLine2}
                    onChange={(e) => handleUpdateSearchLines(searchLine1, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onConfirmAlgorithmInput?.();
                      }
                    }}
                    placeholder="Ví dụ: 23 hoặc T..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300">
                  Nhập mảng số hoặc xâu kí tự cách nhau bởi dấu cách (s = input(...)):
                </label>
                <input
                  type="text"
                  value={stdinInput}
                  onChange={(e) => onStdinChange?.(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onConfirmAlgorithmInput?.();
                    }
                  }}
                  placeholder="Ví dụ: 5 2 8 1 3 hoặc P Y T H O N..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => onConfirmAlgorithmInput?.()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>✔ Nhập xong (Enter) — Chuyển sang Chạy tự động</span>
              </button>
            </div>
          </div>
        </div>
      ) : (!hasRun || !hasArrayData || totalSteps === 0) ? (
        <div
          className={`p-10 md:p-14 flex flex-col justify-center items-center text-center relative min-h-[320px] select-none ${
            theme === 'light' ? 'bg-gradient-to-b from-slate-50/70 to-slate-100/90' : 'bg-[#0b1120]'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
            <BarChart2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Biểu Đồ Cột Đang Để Trống
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-4">
            Bấm nút <strong>Chạy Chương Trình</strong> để tự nhập dữ liệu đầu vào, sau đó bấm <strong>Chạy tự động</strong> để xem mô phỏng từng bước!
          </p>
          {onRunCode && (
            <button
              type="button"
              onClick={onRunCode}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Chạy Chương Trình &amp; Nhập Dữ Liệu</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Chú thích màu sắc (Legend) */}
          <div
            className={`px-4 py-1.5 flex items-center justify-between text-[11px] border-b flex-wrap gap-2 ${
              theme === 'light'
                ? 'bg-slate-100/60 border-slate-200 text-slate-600'
                : 'bg-slate-950/40 border-slate-800 text-slate-400'
            }`}
          >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#f59e0b] shadow-sm"></span>
            <span className="font-medium">Đã sắp xếp / Vùng an toàn</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#e11d48] shadow-sm"></span>
            <span className="font-medium">Đang xét / So sánh (Active)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#7dd3fc] border border-sky-400/40 shadow-sm"></span>
            <span className="font-medium">Chưa sắp xếp / Còn lại</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#10b981] shadow-sm"></span>
            <span className="font-medium">Tìm thấy / Hoàn thành</span>
          </div>
        </div>

        {/* Thông tin bước hiện tại */}
        <div className="font-mono text-[10px] text-slate-500">
          Bước {currentStepIndex + 1}/{Math.max(1, totalSteps)}
        </div>
      </div>

      {/* BẢNG TRỰC QUAN CÁC BIẾN XÂU KÍ TỰ (s, t = s[::2]...) */}
      {allStringVars.length > 0 && (
        <div
          className={`px-4 py-2.5 border-b flex flex-col gap-2 ${
            theme === 'light'
              ? 'bg-amber-50/60 border-amber-200/80 text-slate-800'
              : 'bg-amber-950/20 border-amber-900/40 text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Type className="w-3.5 h-3.5" />
              <span>Trạng thái Xâu Kí Tự & Chỉ số Index (0 .. len-1):</span>
            </div>
            {allStringVars.length > 1 && (
              <span className="text-[10px] text-amber-700 dark:text-amber-400">
                Nhấp vào tên biến xâu để chuyển đổi biểu đồ cột bên dưới
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {allStringVars.map((sv) => {
              const isSelected = arrayName === sv.name;
              return (
                <div
                  key={sv.name}
                  onClick={() => setSelectedStrVarName(sv.name)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-amber-500 ring-1 ring-amber-400 shadow-xs'
                      : 'bg-white/70 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 hover:border-amber-400'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-xs text-indigo-600 dark:text-indigo-400">
                        {sv.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">=</span>
                      <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        "{sv.strValue}"
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        (len={sv.chars.length})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {sv.chars.map((ch, cIdx) => {
                      const isEvenIdx = cIdx % 2 === 0;
                      return (
                        <div
                          key={cIdx}
                          className={`flex flex-col items-center min-w-[24px] px-1 py-0.5 rounded border text-center font-mono ${
                            isEvenIdx && code.includes('[::2]')
                              ? 'bg-amber-500/15 border-amber-400 text-amber-900 dark:text-amber-200 font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                          }`}
                          title={`${sv.name}[${cIdx}] = '${ch}'`}
                        >
                          <span className="text-xs font-bold leading-tight">{ch}</span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-none border-t border-slate-200 dark:border-slate-700 w-full pt-0.5 mt-0.5">
                            {cIdx}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BẢNG MÔ PHỎNG TỪNG DÒNG LỆNH & BIẾN SỐ CHO BÀI TẬP CƠ BẢN (n, m, a = n * m...) */}
      {isScalarMode && allSteps && allSteps.length > 0 && (
        <div
          className={`px-4 py-3 border-b flex flex-col gap-2.5 ${
            theme === 'light'
              ? 'bg-emerald-50/50 border-emerald-200/80 text-slate-800'
              : 'bg-emerald-950/20 border-emerald-900/40 text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Giải Thích Trực Quan Từng Bước Chạy & Giá Trị Biến:</span>
            </div>
            {currentStep?.stdout && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 text-white font-mono text-xs font-bold shadow-xs">
                <span>Kết quả in ra (Output):</span>
                <span className="underline">{currentStep.stdout.trim()}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {code
              .split('\n')
              .map((lineText, idx) => ({ lineText: lineText.trim(), lineNum: idx + 1 }))
              .filter((l) => l.lineText && !l.lineText.startsWith('#'))
              .map((lineObj) => {
                // Tìm bước thực thi sau khi dòng này hoàn tất (hoặc bước cuối cùng)
                const matchingStepIdx = allSteps.findIndex(
                  (st, sIdx) =>
                    sIdx > 0 && allSteps[sIdx - 1]?.line_number === lineObj.lineNum
                );
                const targetStepIdx =
                  matchingStepIdx !== -1 ? matchingStepIdx : allSteps.length - 1;
                const stepSnap = allSteps[targetStepIdx];
                const frameVars =
                  (
                    stepSnap?.stack_frames?.find((f) => f.is_active) ||
                    stepSnap?.stack_frames?.[0]
                  )?.variables || {};

                const lhsMatch = lineObj.lineText.match(/^([a-zA-Z_]\w*)\s*=/);
                const lhsVar = lhsMatch ? lhsMatch[1] : null;
                const lhsVal = lhsVar && frameVars[lhsVar] ? frameVars[lhsVar].value : undefined;
                const isPrintLine = lineObj.lineText.startsWith('print(');
                const isCurrentLine = currentStep?.line_number === lineObj.lineNum;

                return (
                  <div
                    key={lineObj.lineNum}
                    onClick={() => onGoToStep?.(targetStepIdx)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                      isCurrentLine
                        ? 'bg-white dark:bg-slate-900 border-emerald-500 ring-1 ring-emerald-400 shadow-xs'
                        : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold shrink-0">
                        Dòng {lineObj.lineNum}
                      </span>
                      <span className="truncate font-bold text-slate-800 dark:text-slate-200">
                        {lineObj.lineText}
                      </span>
                    </div>
                    <div className="shrink-0">
                      {lhsVar && lhsVal !== undefined ? (
                        <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-bold">
                          {lhsVar} = {String(lhsVal)}
                        </span>
                      ) : isCurrentLine && lineObj.lineText.includes('input(') ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400 font-bold animate-pulse">
                          ⏳ Nhập trong Shell...
                        </span>
                      ) : isPrintLine && stepSnap?.stdout && currentStepIndex >= targetStepIdx ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold">
                          In ra: {stepSnap.stdout.trim().split('\n').pop()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* KHU VỰC VẼ BIỂU ĐỒ CỘT (CHÍNH XÁC & TỐI ƯU CẢ CHO SỐ VÀ XÂU KÍ TỰ) */}
      <div
        className={`p-6 md:p-8 flex flex-col justify-end items-center relative overflow-x-auto min-h-[310px] select-none ${
          theme === 'light' ? 'bg-gradient-to-b from-slate-50/70 to-slate-100/90' : 'bg-[#0b1120]'
        }`}
      >
        {/* Container chứa tất cả các cột mảng */}
        <div className="flex items-end justify-center gap-1.5 sm:gap-2.5 w-full max-w-3xl h-[230px] pb-2 border-b-2 border-slate-400/50 dark:border-slate-700">
          {barItems.map((item, idx) => {
            const colorType = getBarColorType(idx);
            const heightPercent = item.heightPercent;

            // Màu sắc cột
            let barBg = '#7dd3fc'; // Xanh nhạt
            let textColor = '#0f172a'; // Chữ đen đậm
            let borderColor = 'transparent';

            if (colorType === 'orange') {
              barBg = '#f59e0b'; // Cam
              textColor = '#451a03';
            } else if (colorType === 'red') {
              barBg = '#e11d48'; // Đỏ nổi bật
              textColor = '#ffffff';
              borderColor = '#9f1239';
            } else if (colorType === 'green') {
              barBg = '#10b981'; // Xanh lá
              textColor = '#ffffff';
              borderColor = '#047857';
            }

            // Có con trỏ trỏ vào cột này không?
            const activePointersAtIdx = Object.entries(pointers)
              .filter(([_, pos]) => pos === idx)
              .map(([name]) => name);

            const isRedSelected = colorType === 'red';
            const isGreenSuccess = colorType === 'green';

            return (
              <div
                key={idx}
                className="flex-1 max-w-[56px] min-w-[34px] h-full flex flex-col justify-end items-center relative group"
              >
                {/* 1. Nhãn giá trị: Nằm trên đỉnh cột nếu cột thấp */}
                {heightPercent < 24 && (
                  <div className="flex flex-col items-center mb-1 transition-all">
                    <span className="font-sans font-bold text-sm md:text-base tracking-tight text-slate-800 dark:text-slate-100">
                      {item.display}
                    </span>
                    {item.ascii !== undefined && (
                      <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 font-medium leading-none">
                        #{item.ascii}
                      </span>
                    )}
                  </div>
                )}

                {/* 2. Thanh Cột Hình Chữ Nhật (Bar) */}
                <div
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: barBg,
                    borderColor: borderColor,
                  }}
                  className={`w-full rounded-t-sm flex flex-col items-center justify-center transition-all duration-300 shadow-sm relative ${
                    isRedSelected ? 'ring-2 ring-rose-400 shadow-lg scale-[1.02]' : ''
                  } ${isGreenSuccess ? 'ring-2 ring-emerald-400 shadow-lg scale-[1.02]' : ''}`}
                >
                  {/* Nếu cột đủ cao, in giá trị bên trong cột */}
                  {heightPercent >= 24 && (
                    <div className="flex flex-col items-center select-none py-1 leading-tight">
                      <span
                        style={{ color: textColor }}
                        className="font-sans font-bold text-sm md:text-base tracking-tight"
                      >
                        {item.display}
                      </span>
                      {item.ascii !== undefined && (
                        <span
                          style={{ color: textColor, opacity: 0.75 }}
                          className="text-[9px] font-mono font-bold leading-none mt-0.5"
                          title={`Mã ASCII: ${item.ascii}`}
                        >
                          #{item.ascii}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Chỉ số mảng (Index) hoặc Tên biến (n, m, a) ở chân cột */}
                <div className="mt-2 text-center">
                  <span className="font-mono text-sm md:text-base font-bold text-slate-800 dark:text-slate-200">
                    {customBarLabels && customBarLabels[idx] !== undefined ? customBarLabels[idx] : idx}
                  </span>
                </div>

                {/* 4. Con trỏ chỉ số (Pointers): i, j, mid, min_idx... */}
                {activePointersAtIdx.length > 0 && (
                  <div className="absolute -bottom-7 flex flex-col items-center animate-bounce z-10">
                    <span
                      className={`text-[10px] font-bold ${
                        isGreenSuccess ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      ▲
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded text-white shadow-sm whitespace-nowrap ${
                        isGreenSuccess ? 'bg-emerald-600' : 'bg-rose-500'
                      }`}
                    >
                      {activePointersAtIdx.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trạng thái Con trỏ & Chốt kết quả dãy số sau mỗi bước */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between border-t text-xs flex-wrap gap-2 ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}
      >

        {/* Chốt kết quả dãy số sau mỗi lượt chạy của i, j */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Badge lượt chạy của i, j */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            {currentIndices.i !== undefined && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 font-bold shadow-xs">
                i = {currentIndices.i}
              </span>
            )}
            {currentIndices.j !== undefined && (
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/40 font-bold shadow-xs">
                j = {currentIndices.j}
              </span>
            )}
          </div>

          {/* Khối chốt kết quả dãy số / xâu */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {currentStepIndex === totalSteps - 1
                ? '✅ Chốt kết quả cuối cùng:'
                : currentIndices.i !== undefined
                ? `🎯 Chốt dãy sau lượt (${
                    currentIndices.i !== undefined ? `i=${currentIndices.i}` : ''
                  }${currentIndices.j !== undefined ? `, j=${currentIndices.j}` : ''}):`
                : '🎯 Chốt dữ liệu hiện tại:'}
            </span>
            <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 tracking-wide">
              [{values.map((v) => (typeof v === 'string' ? `'${v}'` : v)).join(', ')}]
            </span>
          </div>
        </div>
      </div>

      {/* Bảng chốt kết quả dãy số sau mỗi lượt chạy của i (Interactive Timeline) */}
      {iPassSnapshots.length > 0 && (
        <div
          className={`px-4 py-2 border-t text-xs flex flex-col gap-1.5 ${
            theme === 'light' ? 'bg-slate-100/70 border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-1">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
              <ListOrdered className="w-3.5 h-3.5 text-indigo-500" />
              <span>Chốt kết quả dữ liệu sau mỗi lượt chạy của i:</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline">
              Nhấp vào từng lượt để chuyển nhanh đến bước chốt mảng
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {iPassSnapshots.map((snap, idx) => {
              const isCurrentPass =
                currentIndices.i === snap.iVal ||
                (snap.isFinal && currentStepIndex === totalSteps - 1);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onGoToStep?.(snap.stepIndex)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer whitespace-nowrap border ${
                    isCurrentPass
                      ? 'bg-indigo-600 text-white border-indigo-400 font-bold shadow-sm ring-1 ring-indigo-400'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                  title={`Nhấp để chuyển đến bước này (bước ${snap.stepIndex + 1})`}
                >
                  <span
                    className={
                      isCurrentPass
                        ? 'text-amber-200 font-bold'
                        : 'text-amber-600 dark:text-amber-400 font-semibold'
                    }
                  >
                    {snap.label}:
                  </span>
                  <span className="font-extrabold">
                    [{snap.array.map((v) => (typeof v === 'string' ? `'${v}'` : v)).join(', ')}]
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  )}
</div>
  );
};
