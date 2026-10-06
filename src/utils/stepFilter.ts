import { TraceStep } from '../types';

/**
 * Trích xuất danh sách giá trị mảng số từ 1 TraceStep bất kỳ
 */
export function getArraySnapshot(step?: TraceStep): number[] | null {
  if (!step?.heap_objects) return null;
  const activeFrame =
    step.stack_frames?.find((f) => f.is_active) ||
    step.stack_frames?.[step.stack_frames.length - 1] ||
    step.stack_frames?.[0];
  const vars = activeFrame?.variables || {};

  const preferredNames = ['arr', 'numbers', 'user_data', 'a', 'nums', 'data', 'list'];
  for (const name of preferredNames) {
    const varVal = vars[name];
    if (varVal && varVal.ref_id) {
      const heapObj = step.heap_objects[varVal.ref_id];
      if (heapObj && heapObj.type === 'list' && Array.isArray(heapObj.elements)) {
        const nums = heapObj.elements
          .map((el) => (typeof el.value === 'number' ? el.value : parseFloat(el.value)))
          .filter((n) => !isNaN(n));
        if (nums.length > 0) return nums;
      }
    }
  }

  for (const [_, heapObj] of Object.entries(step.heap_objects)) {
    if (heapObj && heapObj.type === 'list' && Array.isArray(heapObj.elements)) {
      const nums = heapObj.elements
        .map((el) => (typeof el.value === 'number' ? el.value : parseFloat(el.value)))
        .filter((n) => !isNaN(n));
      if (nums.length > 0) return nums;
    }
  }
  return null;
}

/**
 * Lấy các biến điều khiển thuật toán (i, j, k, key, min_idx, pivot, mid, left, right)
 */
export function getLoopIndices(step?: TraceStep): Record<string, number> {
  const result: Record<string, number> = {};
  if (!step?.stack_frames) return result;

  const activeFrame =
    step.stack_frames.find((f) => f.is_active) ||
    step.stack_frames[step.stack_frames.length - 1];
  const vars = activeFrame?.variables || {};

  const keys = ['i', 'j', 'k', 'key', 'min_idx', 'pivot', 'mid', 'left', 'right'];
  for (const k of keys) {
    if (vars[k] !== undefined) {
      const val = parseInt(vars[k].value, 10);
      if (!isNaN(val)) {
        result[k] = val;
      }
    }
  }
  return result;
}

export interface FilterResult {
  steps: TraceStep[];
  // rawIndexMap[filteredIndex] = rawIndex
  rawIndexMap: number[];
  // filteredIndexMap[rawIndex] = filteredIndex
  filteredIndexMap: number[];
}

/**
 * Bộ lọc Bước Thuật Toán Thông Minh (Smart Algorithmic Step Filter)
 * Lọc bỏ các micro-steps như:
 * - list comprehension reading stdin
 * - swapped = False, swapped = True
 * - loop range evaluation lặp lại
 * - if not swapped: break
 * Chỉ giữ lại các bước có ý nghĩa thuật toán:
 * 1. Khởi tạo mảng ban đầu
 * 2. Phép so sánh cặp phần tử (arr[j] > arr[j+1], v.v.)
 * 3. Phép hoán đổi / dời ô (mảng thay đổi trên Heap)
 * 4. Chốt mốc vòng lặp ngoài i
 * 5. Kết thúc thuật toán
 */
export function filterAlgorithmicSteps(rawSteps: TraceStep[], code: string): FilterResult {
  if (!rawSteps || rawSteps.length <= 4) {
    const ids = rawSteps.map((_, i) => i);
    return { steps: rawSteps, rawIndexMap: ids, filteredIndexMap: ids };
  }

  const selectedRawIndices: number[] = [];
  let prevArrayStr: string | null = null;
  let prevI: number | undefined = undefined;
  let prevJ: number | undefined = undefined;

  // Lấy các dòng code để nhận diện dòng so sánh
  const codeLines = code.split('\n');

  // 1. Tìm bước khởi tạo mảng đầu tiên
  let initialStepFound = false;
  for (let idx = 0; idx < rawSteps.length; idx++) {
    const arr = getArraySnapshot(rawSteps[idx]);
    if (arr && arr.length > 0) {
      selectedRawIndices.push(idx);
      prevArrayStr = JSON.stringify(arr);
      initialStepFound = true;
      break;
    }
  }

  if (!initialStepFound && rawSteps.length > 0) {
    selectedRawIndices.push(0);
  }

  const startSearchFrom = selectedRawIndices.length > 0 ? selectedRawIndices[0] + 1 : 0;

  for (let idx = startSearchFrom; idx < rawSteps.length; idx++) {
    const step = rawSteps[idx];
    const isLast = idx === rawSteps.length - 1;

    // Bước cuối cùng luôn được giữ
    if (isLast) {
      if (!selectedRawIndices.includes(idx)) {
        selectedRawIndices.push(idx);
      }
      break;
    }

    const currentArr = getArraySnapshot(step);
    const currentArrStr = currentArr ? JSON.stringify(currentArr) : null;
    const indices = getLoopIndices(step);
    const lineContent = codeLines[step.line_number - 1]?.trim() || '';

    // A. Mảng bị biến đổi (Hoán đổi Swap / Gán / Dời phần tử)
    const isArrayMutated =
      currentArrStr !== null &&
      prevArrayStr !== null &&
      currentArrStr !== prevArrayStr;

    if (isArrayMutated) {
      selectedRawIndices.push(idx);
      prevArrayStr = currentArrStr;
      prevI = indices.i;
      prevJ = indices.j;
      continue;
    }

    // B. Dòng So Sánh Thuật Toán (Comparison)
    // Ví dụ: `if arr[j] > arr[j + 1]:`, `while j >= 0 and arr[j] > key:`, `if arr[j] < arr[min_idx]:`
    const isComparisonLine =
      (lineContent.startsWith('if ') || lineContent.startsWith('while ') || lineContent.startsWith('elif ')) &&
      (lineContent.includes('arr[') ||
        lineContent.includes('numbers[') ||
        lineContent.includes('key') ||
        lineContent.includes('min_idx') ||
        lineContent.includes('pivot') ||
        lineContent.includes('target') ||
        lineContent.includes('>') ||
        lineContent.includes('<') ||
        lineContent.includes('=='));

    // Bỏ qua dòng kiểm tra cờ phụ: `if not swapped:`, `if swapped:`
    const isFlagCheck = lineContent.includes('swapped') && !lineContent.includes('arr[');

    if (isComparisonLine && !isFlagCheck) {
      // Chỉ ghi nhận khi con trỏ so sánh (j hoặc key) thực sự ở vị trí mới hoặc dòng so sánh vừa được kích hoạt
      const isNewComparison =
        indices.j !== undefined &&
        (indices.j !== prevJ || indices.i !== prevI);

      // Nếu là so sánh mảng, ghi nhận bước này
      selectedRawIndices.push(idx);
      prevI = indices.i;
      prevJ = indices.j;
      if (currentArrStr) prevArrayStr = currentArrStr;
      continue;
    }

    // C. Mốc chốt vòng lặp ngoài i
    if (indices.i !== undefined && prevI !== undefined && indices.i !== prevI) {
      // Khi i chuyển sang lượt mới, bước trước đó là bước chốt lượt cũ
      const stepBefore = idx - 1;
      if (stepBefore >= 0 && !selectedRawIndices.includes(stepBefore)) {
        selectedRawIndices.push(stepBefore);
      }
      prevI = indices.i;
      prevJ = indices.j;
    }
  }

  // Đảm bảo không trùng và sắp xếp tăng dần
  const uniqueRawIndices = Array.from(new Set(selectedRawIndices)).sort((a, b) => a - b);

  // Nếu bộ lọc cho ra quá ít bước (< 2) do code người dùng không phải sort, giữ lại các bước có ý nghĩa
  if (uniqueRawIndices.length <= 2 && rawSteps.length > 2) {
    const fallbackIds = rawSteps
      .map((_, i) => i)
      .filter((i) => {
        const st = rawSteps[i];
        return st.event === 'line' || st.event === 'return';
      });
    const finalIds = fallbackIds.length > 0 ? fallbackIds : rawSteps.map((_, i) => i);
    const filteredSteps = finalIds.map((origIdx, newIdx) => ({
      ...rawSteps[origIdx],
      step_index: newIdx,
    }));
    const rawToFiltered: number[] = new Array(rawSteps.length).fill(0);
    finalIds.forEach((rawIdx, fIdx) => {
      rawToFiltered[rawIdx] = fIdx;
    });
    return { steps: filteredSteps, rawIndexMap: finalIds, filteredIndexMap: rawToFiltered };
  }

  const filteredSteps = uniqueRawIndices.map((origIdx, newIdx) => ({
    ...rawSteps[origIdx],
    step_index: newIdx,
  }));

  // Xây dựng bản đồ ánh xạ 2 chiều
  const filteredIndexMap: number[] = new Array(rawSteps.length).fill(0);
  let curFiltered = 0;
  for (let r = 0; r < rawSteps.length; r++) {
    if (curFiltered < uniqueRawIndices.length - 1 && r >= uniqueRawIndices[curFiltered + 1]) {
      curFiltered++;
    }
    filteredIndexMap[r] = curFiltered;
  }

  return {
    steps: filteredSteps,
    rawIndexMap: uniqueRawIndices,
    filteredIndexMap,
  };
}
