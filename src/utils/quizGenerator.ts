export type AlgorithmType =
  | 'bubble-sort'
  | 'selection-sort'
  | 'insertion-sort'
  | 'quick-sort'
  | 'merge-sort';

export interface QuizOption {
  key: 'A' | 'B' | 'C' | 'D';
  array: number[];
  label: string;
  isCorrect: boolean;
  explanationNote: string;
}

export interface QuizQuestion {
  id: string;
  algorithmType: AlgorithmType;
  algorithmName: string;
  originalArray: number[];
  passNumber: number; // lượt k (1-indexed)
  level: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng';
  questionText: string;
  options: QuizOption[];
  correctOptionKey: 'A' | 'B' | 'C' | 'D';
  correctArray: number[];
  allPassesHistory: { pass: number; array: number[] }[];
  fullExplanation: string;
}

// 1. Thuật toán Bubble Sort: lưu trạng thái sau mỗi lượt lặp i ngoài cùng
export function simulateBubbleSortPasses(arr: number[]): number[][] {
  const a = [...arr];
  const n = a.length;
  const history: number[][] = [];

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (a[j] > a[j + 1]) {
        const temp = a[j];
        a[j] = a[j + 1];
        a[j + 1] = temp;
        swapped = true;
      }
    }
    history.push([...a]);
    if (!swapped) {
      while (history.length < n - 1) {
        history.push([...a]);
      }
      break;
    }
  }

  return history;
}

// 2. Thuật toán Selection Sort: lưu trạng thái sau mỗi lượt lặp i ngoài cùng
export function simulateSelectionSortPasses(arr: number[]): number[][] {
  const a = [...arr];
  const n = a.length;
  const history: number[][] = [];

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (a[j] < a[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      const temp = a[i];
      a[i] = a[minIdx];
      a[minIdx] = temp;
    }
    history.push([...a]);
  }

  return history;
}

// 3. Thuật toán Insertion Sort: lưu trạng thái sau mỗi lượt lặp i ngoài cùng
export function simulateInsertionSortPasses(arr: number[]): number[][] {
  const a = [...arr];
  const n = a.length;
  const history: number[][] = [];

  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
    history.push([...a]);
  }

  return history;
}

// 4. Thuật toán Quick Sort: lưu trạng thái sau mỗi lượt phân hoạch (Lomuto Partition)
export function simulateQuickSortPasses(arr: number[]): number[][] {
  const a = [...arr];
  const history: number[][] = [];

  function partition(low: number, high: number): number {
    const pivot = a[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
      if (a[j] <= pivot) {
        i++;
        const temp = a[i];
        a[i] = a[j];
        a[j] = temp;
      }
    }
    const temp = a[i + 1];
    a[i + 1] = a[high];
    a[high] = temp;
    history.push([...a]);
    return i + 1;
  }

  // Duyệt các đoạn phân hoạch theo thứ tự hàng đợi
  const queue: [number, number][] = [[0, a.length - 1]];
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;
    const [low, high] = item;
    if (low < high) {
      const pi = partition(low, high);
      queue.push([low, pi - 1]);
      queue.push([pi + 1, high]);
    }
  }

  return history;
}

// 5. Thuật toán Merge Sort: lưu trạng thái sau mỗi tầng trộn (Bottom-up passes)
export function simulateMergeSortPasses(arr: number[]): number[][] {
  let a = [...arr];
  const n = a.length;
  const history: number[][] = [];

  for (let width = 1; width < n; width *= 2) {
    const nextA = [...a];
    for (let i = 0; i < n; i += 2 * width) {
      const left = i;
      const mid = Math.min(i + width, n);
      const right = Math.min(i + 2 * width, n);
      let l = left;
      let r = mid;
      let k = left;

      while (l < mid && r < right) {
        if (a[l] <= a[r]) {
          nextA[k++] = a[l++];
        } else {
          nextA[k++] = a[r++];
        }
      }
      while (l < mid) {
        nextA[k++] = a[l++];
      }
      while (r < right) {
        nextA[k++] = a[r++];
      }
    }
    a = nextA;
    history.push([...a]);
  }

  return history;
}

// Helper: Sinh mảng ngẫu nhiên từ 6 đến 12 số
export function generateRandomArray(minLen = 6, maxLen = 12): number[] {
  const len = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
  const result: number[] = [];

  // Để tạo mảng thú vị như trong đề tt.pdf: các số từ 1 đến 15 hoặc 1 đến 25, có thể có 1-2 số trùng lặp
  const useSmallNumbers = Math.random() > 0.3;
  const maxVal = useSmallNumbers ? 12 : 30;

  for (let i = 0; i < len; i++) {
    result.push(Math.floor(Math.random() * maxVal) + 1);
  }

  // Đảm bảo mảng chưa sắp xếp sẵn
  const isAlreadySorted = result.every((v, i, arr) => i === 0 || arr[i - 1] <= v);
  if (isAlreadySorted) {
    result.reverse();
  }

  return result;
}

// Helper xáo trộn mảng
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Hàm sinh 1 câu hỏi trắc nghiệm theo đúng cấu trúc file tt.pdf
 */
export function generateQuizQuestion(
  algoType: AlgorithmType = 'bubble-sort',
  customArray?: number[],
  customPass?: number
): QuizQuestion {
  // 1. Dữ liệu đầu vào ngẫu nhiên từ 6 - 12 số
  const originalArray = customArray || generateRandomArray(6, 12);
  const n = originalArray.length;

  // Lấy lịch sử các lượt của thuật toán chính và thuật toán đối chứng
  let passes: number[][] = [];
  let otherPasses: number[][] = [];
  let algoNameVN = '';
  let otherAlgoNameVN = '';
  let questionSubjectText = '';

  if (algoType === 'bubble-sort') {
    passes = simulateBubbleSortPasses(originalArray);
    otherPasses = simulateSelectionSortPasses(originalArray);
    algoNameVN = 'sắp xếp nổi bọt (Bubble Sort)';
    otherAlgoNameVN = 'thuật toán sắp xếp chọn';
    questionSubjectText = 'của vòng lặp ngoài (for i)';
  } else if (algoType === 'selection-sort') {
    passes = simulateSelectionSortPasses(originalArray);
    otherPasses = simulateBubbleSortPasses(originalArray);
    algoNameVN = 'sắp xếp chọn (Selection Sort)';
    otherAlgoNameVN = 'thuật toán sắp xếp nổi bọt';
    questionSubjectText = 'của vòng lặp ngoài (for i)';
  } else if (algoType === 'insertion-sort') {
    passes = simulateInsertionSortPasses(originalArray);
    otherPasses = simulateSelectionSortPasses(originalArray);
    algoNameVN = 'sắp xếp chèn (Insertion Sort)';
    otherAlgoNameVN = 'thuật toán sắp xếp chọn';
    questionSubjectText = 'của vòng lặp ngoài (for i)';
  } else if (algoType === 'quick-sort') {
    passes = simulateQuickSortPasses(originalArray);
    otherPasses = simulateMergeSortPasses(originalArray);
    algoNameVN = 'sắp xếp nhanh (Quick Sort)';
    otherAlgoNameVN = 'thuật toán sắp xếp trộn (Merge Sort)';
    questionSubjectText = 'phân hoạch (partition chọn chốt pivot là phần tử cuối)';
  } else {
    // merge-sort
    passes = simulateMergeSortPasses(originalArray);
    otherPasses = simulateQuickSortPasses(originalArray);
    algoNameVN = 'sắp xếp trộn (Merge Sort)';
    otherAlgoNameVN = 'thuật toán sắp xếp nhanh (Quick Sort)';
    questionSubjectText = 'trộn (merge)';
  }

  // 2. Lần lặp ngẫu nhiên
  const maxPossiblePass = Math.max(1, Math.min(passes.length, 4));
  const passNumber = customPass || Math.floor(Math.random() * maxPossiblePass) + 1;

  // Đáp án đúng: lượt thứ passNumber (index passNumber - 1)
  const passIndex = passNumber - 1;
  const correctArray = passes[passIndex] || passes[passes.length - 1];

  // Các phương án gây nhiễu (distractors) chuẩn như file tt.pdf:
  // 1. Distractor 1: Kết quả của thuật toán khác sau lượt k
  const otherAlgoArray = otherPasses[passIndex] || otherPasses[0] || originalArray;

  // 2. Distractor 2: Dãy ban đầu (nếu passNumber = 1) hoặc dãy sau lượt k - 1
  const prevPassArray = passNumber === 1 ? originalArray : passes[passIndex - 1];

  // 3. Distractor 3: Dãy sau lượt k + 1 (hoặc k + 2 nếu có)
  const nextPassArray =
    passes[passIndex + 1] ||
    (passes.length > passIndex + 2 ? passes[passIndex + 2] : originalArray);

  // Fallback distractor nếu có phương án bị trùng
  const candidatePool: { array: number[]; note: string }[] = [
    { array: correctArray, note: 'Đáp án đúng' },
    { array: otherAlgoArray, note: `kết quả của ${otherAlgoNameVN} sau lượt ${passNumber}` },
    {
      array: prevPassArray,
      note: passNumber === 1 ? 'dãy ban đầu' : `dãy sau lượt ${passNumber - 1}`,
    },
    {
      array: nextPassArray,
      note: `dãy sau lượt ${passNumber + 1}`,
    },
  ];

  // Đảm bảo không có phương án nào trùng mảng với phương án khác
  const uniqueCandidates: { array: number[]; note: string }[] = [];
  const seenStr = new Set<string>();

  for (const item of candidatePool) {
    const key = JSON.stringify(item.array);
    if (!seenStr.has(key)) {
      seenStr.add(key);
      uniqueCandidates.push(item);
    }
  }

  // Nếu bị trùng, bổ sung các lượt khác
  let fallbackPass = 1;
  while (uniqueCandidates.length < 4 && fallbackPass <= passes.length) {
    const arrCandidate = passes[fallbackPass - 1];
    const key = JSON.stringify(arrCandidate);
    if (!seenStr.has(key)) {
      seenStr.add(key);
      uniqueCandidates.push({ array: arrCandidate, note: `dãy sau lượt ${fallbackPass}` });
    }
    fallbackPass++;
  }

  // Nếu vẫn chưa đủ 4, bổ sung hoán đổi nhẹ
  while (uniqueCandidates.length < 4) {
    const modified = [...correctArray];
    if (modified.length > 2) {
      const idx = Math.floor(Math.random() * (modified.length - 1));
      [modified[idx], modified[idx + 1]] = [modified[idx + 1], modified[idx]];
      const key = JSON.stringify(modified);
      if (!seenStr.has(key)) {
        seenStr.add(key);
        uniqueCandidates.push({ array: modified, note: `dãy hoán đổi ngẫu nhiên` });
      }
    }
  }

  // Lấy đúng 4 phương án
  const finalFour = uniqueCandidates.slice(0, 4);

  // Xáo trộn 4 phương án A, B, C, D
  const shuffled = shuffle(finalFour);
  const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

  let correctKey: 'A' | 'B' | 'C' | 'D' = 'A';
  const options: QuizOption[] = shuffled.map((item, idx) => {
    const key = keys[idx];
    const isCorrect = JSON.stringify(item.array) === JSON.stringify(correctArray);
    if (isCorrect) {
      correctKey = key;
    }
    return {
      key,
      array: item.array,
      label: `[${item.array.join(', ')}]`,
      isCorrect,
      explanationNote: item.note,
    };
  });

  // Xác định mức độ nhận thức đúng như tt.pdf
  let level: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' = 'Thông hiểu';
  if (passNumber === 1 && n <= 8) {
    level = 'Nhận biết';
  } else if (passNumber >= 3 || n >= 10 || algoType === 'quick-sort' || algoType === 'merge-sort') {
    level = 'Vận dụng';
  }

  // Tạo lịch sử các lượt để phục vụ giải thích
  const historyList: { pass: number; array: number[] }[] = [];
  for (let p = 0; p < Math.min(passes.length, passNumber + 1); p++) {
    historyList.push({ pass: p + 1, array: passes[p] });
  }

  // Xây dựng phần Giải thích đúng 100% cấu trúc của tt.pdf:
  const stepsExplanationText = historyList
    .map((h) => `sau lượt ${h.pass}: [${h.array.join(', ')}]`)
    .join('; ');

  const distractorNotesText = options
    .filter((o) => !o.isCorrect)
    .map((o) => `[${o.array.join(', ')}] là ${o.explanationNote}`)
    .join('. ');

  const fullExplanation = `Giải thích (${level}): Chạy thử với a = [${originalArray.join(
    ', '
  )}]: ${stepsExplanationText}. Đáp án đúng là [${correctArray.join(
    ', '
  )}]. ${distractorNotesText}.`;

  // Câu hỏi theo chuẩn từng thuật toán
  let questionText = '';
  if (algoType === 'quick-sort') {
    questionText = `Cho a = [${originalArray.join(
      ', '
    )}]. Sau lượt phân hoạch (partition) thứ ${passNumber} của thuật toán Quick Sort (chọn phần tử cuối làm chốt), danh sách a là:`;
  } else if (algoType === 'merge-sort') {
    const subLen = Math.pow(2, passNumber);
    questionText = `Cho a = [${originalArray.join(
      ', '
    )}]. Sau lượt trộn (merge) thứ ${passNumber} của thuật toán Merge Sort (trộn các mảng con kích thước ${subLen}), danh sách a là:`;
  } else {
    questionText = `Cho a = [${originalArray.join(
      ', '
    )}]. Sau lượt lặp thứ ${passNumber} của vòng lặp ngoài (for i), danh sách a là:`;
  }

  return {
    id: `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    algorithmType: algoType,
    algorithmName: algoNameVN,
    originalArray,
    passNumber,
    level,
    questionText,
    options,
    correctOptionKey: correctKey,
    correctArray,
    allPassesHistory: historyList,
    fullExplanation,
  };
}
