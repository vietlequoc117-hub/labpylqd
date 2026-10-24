import { TraceStep } from '../types';

export type ArraySnapshotItem = number | string;

/**
 * Trích xuất danh sách giá trị mảng (số hoặc xâu kí tự) từ 1 TraceStep bất kỳ
 */
export function getArraySnapshot(step?: TraceStep, code?: string): ArraySnapshotItem[] | null {
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
        const items: ArraySnapshotItem[] = heapObj.elements
          .map((el) => {
            if (typeof el.value === 'number') return el.value;
            if (typeof el.value === 'string') {
              if (el.type === 'str') return el.value;
              const n = parseFloat(el.value);
              return !isNaN(n) ? n : el.value;
            }
            return null;
          })
          .filter((v): v is ArraySnapshotItem => v !== null);
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
      const items: ArraySnapshotItem[] = heapObj.elements
        .map((el) => {
          if (typeof el.value === 'number') return el.value;
          if (typeof el.value === 'string') {
            if (el.type === 'str') return el.value;
            const n = parseFloat(el.value);
            return !isNaN(n) ? n : el.value;
          }
          return null;
        })
        .filter((v): v is ArraySnapshotItem => v !== null);
      if (items.length > 0) return items;
    }
  }

  // Nếu code là thuật toán có hàm def hoặc có dùng .split(), chỉ lấy mảng list trong heap, không lấy biến xâu tạm `s = input(...)`
  if (code && (/\bdef\s+[a-zA-Z_]\w*\s*\(/.test(code) || code.includes('.split('))) {
    return null;
  }

  // Nếu không có mảng trong heap nhưng có biến xâu kí tự nguyên thủy (ví dụ s = "abcdefg", t = s[::2])
  const stringPreferredNames = [
    ...preferredNames,
    't',
    'xau',
    'chuoi',
    'st',
    'str1',
    'str2',
    'res',
    'result',
    'ans',
    'kq',
    'ket_qua',
  ];

  // Nếu có nhiều biến xâu (như s và t), gộp snapshot để mọi thay đổi trên s hoặc t đều được giữ lại thành bước mô phỏng
  const stringSnapshots: ArraySnapshotItem[] = [];
  for (const name of stringPreferredNames) {
    const varVal = vars[name];
    if (varVal && varVal.type === 'str') {
      const rawStr = String(varVal.value).replace(/^['"]|['"]$/g, '');
      if (rawStr.length >= 1 && !rawStr.startsWith('[') && !rawStr.startsWith('{')) {
        if (stringSnapshots.length === 0) {
          stringSnapshots.push(...rawStr.split(''));
        } else {
          stringSnapshots.push(`|${name}:${rawStr}`);
        }
      }
    }
  }

  // Fallback: bất kỳ biến kiểu 'str' nào khác trong frame hiện tại (bỏ qua biến trung gian 'raw', 'k_raw' của các bài thuật toán)
  if (stringSnapshots.length === 0) {
    for (const [varName, varVal] of Object.entries(vars)) {
      if (varName.startsWith('_') || varName === 'raw' || varName === 'k_raw') continue;
      if (varVal && varVal.type === 'str') {
        const rawStr = String(varVal.value).replace(/^['"]|['"]$/g, '');
        if (rawStr.length >= 1) {
          return rawStr.split('');
        }
      }
    }
  } else {
    return stringSnapshots;
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
  // Đối với các chương trình học sinh tự viết (không có hàm thuật toán def ...),
  // giữ nguyên 100% từng câu lệnh từ đầu đến cuối để học sinh chạy tuần tự từng dòng!
  if (!rawSteps || rawSteps.length <= 4 || !/\bdef\s+[a-zA-Z_]\w*\s*\(/.test(code)) {
    const ids = (rawSteps || []).map((_, i) => i);
    return { steps: rawSteps || [], rawIndexMap: ids, filteredIndexMap: ids };
  }

  const selectedRawIndices: number[] = [];
  let prevArrayStr: string | null = null;
  let prevI: number | undefined = undefined;
  let prevJ: number | undefined = undefined;

  // Lấy các dòng code để nhận diện dòng so sánh
  const codeLines = code.split('\n');
  const isSearchAlgo = code.includes('linear_search') || code.includes('binary_search');

  // 1. Tìm bước khởi tạo mảng đầu tiên (đối với Tìm kiếm, đợi sau khi biến k cũng đã được nhập xong)
  let initialStepFound = false;
  for (let idx = 0; idx < rawSteps.length; idx++) {
    const arr = getArraySnapshot(rawSteps[idx], code);
    if (arr && arr.length > 0) {
      if (isSearchAlgo) {
        const frameVars =
          rawSteps[idx].stack_frames?.find((f) => f.is_active)?.variables ||
          rawSteps[idx].stack_frames?.[0]?.variables ||
          {};
        if (frameVars['k'] === undefined) {
          continue;
        }
      }
      selectedRawIndices.push(idx);
      prevArrayStr = JSON.stringify(arr);
      initialStepFound = true;
      break;
    }
  }

  if (!initialStepFound) {
    for (let idx = 0; idx < rawSteps.length; idx++) {
      const arr = getArraySnapshot(rawSteps[idx], code);
      if (arr && arr.length > 0) {
        selectedRawIndices.push(idx);
        prevArrayStr = JSON.stringify(arr);
        initialStepFound = true;
        break;
      }
    }
  }

  // Nếu chương trình của học sinh là dạng bài tập cơ bản (nhập xuất n, m, tính toán số học, điều kiện...)
  // không có mảng danh sách, giữ nguyên toàn bộ các bước thực thi từng dòng để học sinh hiểu rõ từng lệnh!
  if (!initialStepFound) {
    const allLineIds = rawSteps
      .map((_, i) => i)
      .filter((i) => {
        const st = rawSteps[i];
        return st.event === 'line' || st.event === 'return' || st.event === 'exception';
      });
    const finalIds = allLineIds.length > 0 ? allLineIds : rawSteps.map((_, i) => i);
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

    const currentArr = getArraySnapshot(step, code);
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
        lineContent.includes('data[') ||
        lineContent.includes('chars[') ||
        lineContent.includes('words[') ||
        lineContent.includes('numbers[') ||
        lineContent.includes('key') ||
        lineContent.includes('min_idx') ||
        lineContent.includes('pivot') ||
        lineContent.includes('mid_val') ||
        lineContent.includes('target') ||
        lineContent.includes('can_tim') ||
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
