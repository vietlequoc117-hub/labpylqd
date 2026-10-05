import type { ComplexityReport } from './types.ts';

export const PRESET_COMPLEXITY_MAP: Record<string, ComplexityReport> = {
  'bubble-sort': {
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    auxiliaryStackSpace: 'O(1) (Không dùng đệ quy, chỉ 1 stack frame)',
    heapAllocation: 'O(1) bộ nhớ phụ (Sắp xếp tại chỗ inplace)',
    recurrenceRelation: 'N/A (Thuật toán lặp 2 vòng lặp lồng nhau)',
    timeExplanation:
      'Vòng lặp ngoài chạy n lần, vòng lặp trong chạy (n - i - 1) lần. Tổng số phép so sánh ở Worst/Average-case xấp xỉ n*(n-1)/2, dẫn tới độ phức tạp thời gian O(n²). Với cờ swapped, mảng đã sắp xếp sẵn đạt Best-case O(n).',
    spaceExplanation:
      'Chỉ sử dụng các biến đếm nguyên (i, j, n, swapped), trực tiếp hoán đổi trên mảng ban đầu nên độ phức tạp không gian phụ là O(1) Auxiliary Space.',
    keyOperationsCount: 'n * (n - 1) / 2 phép so sánh ở trường hợp xấu nhất',
    optimizationTips: [
      'Đã sử dụng cờ swapped để dừng sớm khi mảng đã sắp xếp (Best-case O(n)).',
      'Có thể chuyển sang Quick Sort hoặc Merge Sort O(n log n) cho tập dữ liệu lớn.',
      'Tránh dùng Bubble Sort trong các ứng dụng thực tế với số phần tử n > 1000.',
    ],
  },
  'selection-sort': {
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    auxiliaryStackSpace: 'O(1) (Chỉ 1 stack frame)',
    heapAllocation: 'O(1) inplace',
    recurrenceRelation: 'N/A',
    timeExplanation:
      'Tại mỗi bước thứ i, thuật toán duyệt qua tất cả phần tử từ i+1 đến n-1 để tìm min_idx. Bất kể mảng ban đầu có thứ tự hay không, thuật toán luôn thực hiện n*(n-1)/2 phép so sánh, do đó luôn là O(n²) trong mọi trường hợp (Worst/Average/Best case).',
    spaceExplanation:
      'Chỉ tốn O(1) không gian nhớ phụ để lưu min_idx, i, j và thực hiện hoán đổi tại chỗ.',
    keyOperationsCount: 'n * (n - 1) / 2 phép so sánh và tối đa n - 1 lần hoán đổi',
    optimizationTips: [
      'Selection Sort có ưu điểm là số lần hoán đổi (swaps) tối đa chỉ là O(n), hữu ích khi chi phí ghi bộ nhớ đắt đỏ.',
      'Có thể cải tiến thành Heap Sort để giảm thời gian tìm min từ O(n) xuống O(log n), đạt tổng O(n log n).',
    ],
  },
  'insertion-sort': {
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    auxiliaryStackSpace: 'O(1) (Chỉ 1 stack frame)',
    heapAllocation: 'O(1) inplace',
    recurrenceRelation: 'N/A',
    timeExplanation:
      'Trường hợp xấu nhất (mảng giảm dần): mỗi phần tử thứ i phải dời i phần tử phía trước, tổng cộng n*(n-1)/2 phép dời -> O(n²). Trường hợp tốt nhất (mảng đã tăng dần): vòng while dừng ngay lập tức -> O(n).',
    spaceExplanation:
      'Sắp xếp tại chỗ inplace, chỉ cần 1 biến tạm key và con trỏ j -> O(1) Auxiliary Space.',
    keyOperationsCount: 'Tối đa n * (n - 1) / 2 phép so sánh và dời ô',
    optimizationTips: [
      'Rất hiệu quả cho mảng nhỏ (n < 50) hoặc mảng gần như đã sắp xếp (Nearly sorted).',
      'Được dùng làm thuật toán con trong Timsort (thuật toán sắp xếp mặc định của Python).',
    ],
  },
  'quick-sort': {
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(log n)',
    auxiliaryStackSpace: 'O(log n) (Chiều sâu ngăn xếp đệ quy ở trường hợp trung bình)',
    heapAllocation: 'O(1) (Sắp xếp tại chỗ inplace qua hàm phân hoạch partition)',
    recurrenceRelation: 'T(n) = 2T(n/2) + O(n) (Best/Average case)',
    timeExplanation:
      'Mỗi lượt phân hoạch chọn phần tử chốt (pivot), gom các phần tử nhỏ hơn sang trái và lớn hơn sang phải trong O(n). Trường hợp tốt nhất và trung bình cây đệ quy chia đôi mảng có độ sâu log₂(n) -> O(n log n). Trường hợp xấu nhất (pivot luôn là max hoặc min) suy biến thành O(n²).',
    spaceExplanation:
      'Sắp xếp tại chỗ inplace trên cùng mảng ban đầu, không cấp phát thêm mảng phụ. Bộ nhớ phụ chỉ tốn cho Call Stack với chiều sâu O(log n) ở trường hợp tốt/trung bình (tối đa O(n) ở trường hợp xấu nhất).',
    keyOperationsCount: 'Xấp xỉ n * log₂(n) phép so sánh và hoán đổi',
    optimizationTips: [
      'Chọn pivot ngẫu nhiên (Randomized Quick Sort) hoặc lấy trung vị 3 phần tử (Median-of-three) để tránh trường hợp xấu nhất O(n²).',
      'Chuyển sang Insertion Sort khi kích thước mảng con nhỏ (n < 16) để tăng tốc độ thực thi.',
      'Sử dụng đệ quy đuôi (Tail Call Optimization) cho nửa mảng con lớn hơn để đảm bảo không gian ngăn xếp luôn là O(log n).',
    ],
  },
  'merge-sort': {
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    auxiliaryStackSpace: 'O(log n) (Chiều sâu cây đệ quy phân đôi)',
    heapAllocation: 'O(n) (Cần tạo các mảng con left_half và right_half khi chia nhỏ)',
    recurrenceRelation: 'T(n) = 2T(n/2) + O(n) (Mọi trường hợp)',
    timeExplanation:
      'Áp dụng chiến lược Chia để trị (Divide and Conquer): chia đôi mảng thành 2 nửa cho đến khi độ dài bằng 1 (mất log₂(n) tầng), sau đó trộn (merge) 2 nửa đã sắp xếp lại trong O(n). Thuật toán đạt O(n log n) ổn định trong MỌI trường hợp (Best, Average, Worst).',
    spaceExplanation:
      'Quá trình trộn cần cấp phát các mảng con phụ để lưu trữ dữ liệu tạm thời -> Tốn O(n) Auxiliary Heap Space. Ngăn xếp Call Stack tốn O(log n) frames.',
    keyOperationsCount: 'Chính xác xấp xỉ n * log₂(n) phép so sánh',
    optimizationTips: [
      'Merge Sort có tính chất Ổn định (Stable Sort), giữ nguyên thứ tự tương đối của các phần tử có cùng giá trị.',
      'Rất phù hợp cho sắp xếp dữ liệu ngoài (External Sorting) hoặc danh sách liên kết (Linked List) vì không đòi hỏi truy cập ngẫu nhiên theo chỉ số.',
    ],
  },
  'complexity-comparison': {
    timeComplexity: 'Tổng hợp Big-O',
    spaceComplexity: 'So sánh 5 Thuật toán',
    auxiliaryStackSpace: 'O(1) đến O(n)',
    heapAllocation: 'In-place vs Phụ bộ nhớ',
    recurrenceRelation: 'T(n) tổng quan',
    timeExplanation:
      'Bảng tổng hợp so sánh hiệu năng: Bubble Sort, Selection Sort, Insertion Sort có độ phức tạp thời gian O(n²); Quick Sort và Merge Sort vượt trội với O(n log n). Quick Sort chạy nhanh nhất trong thực tế nhờ bộ đệm cache CPU.',
    spaceExplanation:
      'Bubble, Selection, Insertion Sort và Quick Sort hoạt động tại chỗ (In-place). Merge Sort cần thêm O(n) bộ nhớ phụ cho các mảng con.',
    keyOperationsCount: 'So sánh trực quan số phép tính theo n',
    optimizationTips: [
      'Chọn Insertion Sort cho mảng nhỏ (n < 30) hoặc mảng gần như đã sắp xếp.',
      'Chọn Quick Sort làm thuật toán sắp xếp thông dụng đa mục đích.',
      'Chọn Merge Sort khi yêu cầu tính ổn định (Stable) hoặc sắp xếp danh sách liên kết.',
    ],
  },
  'linked-tuple': {
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    auxiliaryStackSpace: 'O(n) (Do gọi đệ quy n lần, tạo n stack frames đồng thời trên Call Stack)',
    heapAllocation: 'O(n) để lưu trữ chuỗi tuple lồng nhau (1, (2, (3, None)))',
    recurrenceRelation: 'T(n) = T(n - 1) + O(1)',
    timeExplanation:
      'Hàm list_sum được gọi một lần cho mỗi tuple trong chuỗi danh sách liên kết. Với danh sách độ dài n, có chính xác n + 1 lần gọi hàm, mỗi lần thực hiện phép cộng O(1) -> O(n).',
    spaceExplanation:
      'Chiều sâu đệ quy tối đa đạt n stack frames. Mỗi stack frame lưu biến head và tail -> O(n) Auxiliary Stack Space.',
    keyOperationsCount: 'n phép cộng và n + 1 lần gọi hàm',
    optimizationTips: [
      'Chuyển sang đệ quy đuôi (Tail Recursion) hoặc dùng vòng lặp while để giảm Auxiliary Space từ O(n) về O(1).',
      'Với danh sách liên kết lớn, đệ quy sâu có thể gây RecursionError (Stack Overflow) trong Python.',
    ],
  },
  'factorial-recursion': {
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    auxiliaryStackSpace: 'O(n) stack frames đệ quy đồng thời',
    heapAllocation: 'O(1)',
    recurrenceRelation: 'T(n) = T(n - 1) + O(1)',
    timeExplanation:
      'factorial(n) gọi factorial(n-1), tiếp diễn cho tới base case n <= 1. Tổng cộng có n lần gọi hàm đệ quy -> O(n).',
    spaceExplanation:
      'Ngăn xếp Call Stack phải giữ n frames từ factorial(n) đến factorial(1) để chờ giá trị nhân ngược trở lại -> O(n) Auxiliary Stack Space.',
    keyOperationsCount: 'n - 1 phép nhân số nguyên',
    optimizationTips: [
      'Sử dụng vòng lặp (iterative) hoặc math.factorial() để đạt O(1) không gian nhớ.',
      'Áp dụng đệ quy đuôi (Tail Recursion) kết hợp tham số tích lũy accumulator.',
    ],
  },
  'fibonacci-recursion': {
    timeComplexity: 'O(2^n)',
    spaceComplexity: 'O(n)',
    auxiliaryStackSpace: 'O(n) (Chiều cao lớn nhất của cây đệ quy)',
    heapAllocation: 'O(1)',
    recurrenceRelation: 'T(n) = T(n - 1) + T(n - 2) + O(1)',
    timeExplanation:
      'Mỗi lời gọi hàm lại phân nhánh thành 2 lời gọi hàm con. Cây đệ quy có độ sâu n, tạo ra xấp xỉ 2^n lời gọi hàm với nhiều bài toán con bị tính lặp lại liên tục -> O(2^n) hàm mũ.',
    spaceExplanation:
      'Tại mỗi thời điểm, Call Stack chỉ lưu một nhánh từ gốc đến lá, chiều sâu tối đa là n -> O(n) Stack Space.',
    keyOperationsCount: 'Xấp xỉ 1.618^n phép tính (Tỉ lệ vàng Fibonacci)',
    optimizationTips: [
      'Áp dụng Quy hoạch động (Dynamic Programming) hoặc Memoization (@lru_cache) để giảm độ phức tạp thời gian từ O(2^n) xuống O(n).',
      'Dùng 2 biến lặp a, b để đạt O(n) thời gian và O(1) không gian nhớ.',
    ],
  },
  'binary-search': {
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    auxiliaryStackSpace: 'O(1) (Không dùng đệ quy)',
    heapAllocation: 'O(1)',
    recurrenceRelation: 'T(n) = T(n/2) + O(1)',
    timeExplanation:
      'Sau mỗi bước lặp, không gian tìm kiếm (khoảng cách giữa left và right) giảm đi một nửa. Số bước lặp tối đa là ⌊log₂ n⌋ + 1 -> O(log n).',
    spaceExplanation:
      'Chỉ sử dụng 3 biến chỉ số nguyên: left, right, mid -> O(1) Auxiliary Space.',
    keyOperationsCount: 'log₂(n) phép so sánh',
    optimizationTips: [
      'Đảm bảo mảng đầu vào luôn được sắp xếp trước khi tìm kiếm.',
      'Cách tính mid = (left + right) // 2 có thể viết mid = left + (right - left) // 2 để tránh tràn số trong các ngôn ngữ tĩnh.',
    ],
  },
  'pointers-aliasing': {
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    auxiliaryStackSpace: 'O(1)',
    heapAllocation: 'O(n) cho việc tạo bản sao nông list(a)',
    recurrenceRelation: 'N/A',
    timeExplanation:
      'Phép gán b = a chỉ gán con trỏ O(1). Phép sao chép c = list(a) duyệt qua toàn bộ n phần tử để tạo mảng mới trên Heap -> O(n). Phép append() vào cuối danh sách có thời gian khấu hao O(1).',
    spaceExplanation:
      'Biến a và b cùng trỏ vào 1 mảng gốc trên Heap. Biến c được cấp phát một mảng riêng biệt có kích thước n -> O(n) Heap Space.',
    keyOperationsCount: 'n phép sao chép phần tử và các phép thêm O(1)',
    optimizationTips: [
      'Hiểu rõ sự khác biệt giữa gán tham chiếu (b = a) và sao chép đối tượng (c = a.copy() hoặc copy.deepcopy()).',
    ],
  },
  'linked-list-class': {
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    auxiliaryStackSpace: 'O(1) (Duyệt bằng vòng lặp while)',
    heapAllocation: 'O(n) cho n đối tượng Node liên kết bằng con trỏ .next',
    recurrenceRelation: 'N/A',
    timeExplanation:
      'Khởi tạo n node mất O(n) thời gian. Vòng lặp while curr duyệt qua từng node cho tới khi gặp None mất n bước -> Tổng O(n).',
    spaceExplanation:
      'Mỗi node lưu trữ thuộc tính val và con trỏ next, tổng cộng n đối tượng trên Heap -> O(n) Heap Space. Auxiliary stack space là O(1) do không dùng đệ quy.',
    keyOperationsCount: 'n phép gán con trỏ và n phép cộng',
    optimizationTips: [
      'Danh sách liên kết có ưu thế chèn/xóa ở đầu mảng trong O(1), nhưng truy cập theo chỉ mục ngẫu nhiên mất O(n).',
    ],
  },
};

/**
 * Heuristic algorithmic complexity analyzer used as fallback when Gemini API
 * encounters rate-limits (429 quota exhaustion) or network unavailability.
 */
export function analyzeComplexityHeuristically(code: string): ComplexityReport {
  const cleanCode = code.replace(/#.*$/gm, ''); // remove comments
  const lines = cleanCode.split('\n');

  // Check for recursion
  let funcName: string | null = null;
  const defMatch = cleanCode.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
  if (defMatch) {
    funcName = defMatch[1];
  }

  let isRecursive = false;
  let recursiveCallsCount = 0;
  if (funcName) {
    const callRegex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
    const matches = cleanCode.match(callRegex);
    // 1 definition + N calls
    if (matches && matches.length > 1) {
      isRecursive = true;
      recursiveCallsCount = matches.length - 1;
    }
  }

  // Check for nested loops
  let maxLoopDepth = 0;
  let currentLoopDepth = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('for ') || trimmed.startsWith('while ')) {
      currentLoopDepth++;
      if (currentLoopDepth > maxLoopDepth) {
        maxLoopDepth = currentLoopDepth;
      }
    } else if (trimmed === '' || trimmed.startsWith('def ')) {
      currentLoopDepth = 0;
    }
  }

  // Check for divide and conquer / binary search (// 2 or >> 1)
  const isDividing = cleanCode.includes('// 2') || cleanCode.includes('>> 1') || cleanCode.includes('/ 2');

  // Multi-branch recursion (e.g. fibonacci)
  if (isRecursive && recursiveCallsCount >= 2) {
    return {
      timeComplexity: 'O(2^n)',
      spaceComplexity: 'O(n)',
      auxiliaryStackSpace: 'O(n) (Chiều sâu tối đa của ngăn xếp đệ quy)',
      heapAllocation: 'O(1)',
      recurrenceRelation: 'T(n) = 2T(n - 1) + O(1) hoặc tương đương',
      timeExplanation:
        'Hàm có nhiều hơn 1 lời gọi đệ quy trong thân hàm, tạo thành cây gọi hàm phân nhánh. Chiều cao cây đệ quy là n, dẫn tới tổng số bước tính toán tăng theo cấp số nhân O(2^n).',
      spaceExplanation:
        'Tại mỗi thời điểm, Call Stack chỉ lưu giữ một nhánh từ đỉnh cây đệ quy xuống lá, do đó chiều sâu ngăn xếp là O(n).',
      keyOperationsCount: 'Xấp xỉ 2^n phép tính',
      optimizationTips: [
        'Áp dụng Memoization (@lru_cache) hoặc Quy hoạch động (Dynamic Programming) để giảm thời gian từ O(2^n) xuống O(n).',
      ],
    };
  }

  // Single-branch recursion (e.g. factorial, list_sum)
  if (isRecursive) {
    return {
      timeComplexity: isDividing ? 'O(log n)' : 'O(n)',
      spaceComplexity: isDividing ? 'O(log n)' : 'O(n)',
      auxiliaryStackSpace: isDividing ? 'O(log n) stack frames' : 'O(n) stack frames',
      heapAllocation: 'O(1) - O(n)',
      recurrenceRelation: isDividing ? 'T(n) = T(n/2) + O(1)' : 'T(n) = T(n - 1) + O(1)',
      timeExplanation: isDividing
        ? 'Mỗi bước đệ quy giảm bài toán đi một nửa, số lần gọi hàm là log₂(n) -> O(log n).'
        : 'Hàm gọi đệ quy tuyến tính giảm dần kích thước dữ liệu n, thực hiện n lần gọi hàm -> O(n).',
      spaceExplanation: isDividing
        ? 'Call Stack lưu trữ tối đa log₂(n) khung hàm -> O(log n) Auxiliary Stack Space.'
        : 'Call Stack lưu trữ tối đa n khung hàm trước khi hồi quy trả về giá trị -> O(n) Auxiliary Stack Space.',
      keyOperationsCount: isDividing ? 'log₂(n) phép tính' : 'n phép tính',
      optimizationTips: [
        'Có thể chuyển đệ quy sang vòng lặp while/for để đạt O(1) không gian nhớ.',
      ],
    };
  }

  // Binary search / Halving loops
  if (maxLoopDepth === 1 && isDividing) {
    return {
      timeComplexity: 'O(log n)',
      spaceComplexity: 'O(1)',
      auxiliaryStackSpace: 'O(1)',
      heapAllocation: 'O(1)',
      recurrenceRelation: 'N/A',
      timeExplanation:
        'Vòng lặp chia đôi không gian dữ liệu sau mỗi bước (như tìm kiếm nhị phân). Số bước lặp tối đa là log₂(n) -> O(log n).',
      spaceExplanation:
        'Chỉ dùng các biến chỉ số nguyên, không tốn thêm bộ nhớ -> O(1) Auxiliary Space.',
      keyOperationsCount: 'log₂(n) phép so sánh',
      optimizationTips: [
        'Thuật toán chia đôi đạt hiệu suất tối ưu cho tìm kiếm trên tập dữ liệu đã sắp xếp.',
      ],
    };
  }

  // Nested loops
  if (maxLoopDepth >= 2) {
    const exp = maxLoopDepth === 2 ? 'O(n²)' : `O(n^${maxLoopDepth})`;
    return {
      timeComplexity: exp,
      spaceComplexity: 'O(1)',
      auxiliaryStackSpace: 'O(1)',
      heapAllocation: 'O(1) hoặc phụ thuộc cấu trúc mảng',
      recurrenceRelation: 'N/A',
      timeExplanation: `Chương trình có ${maxLoopDepth} vòng lặp lồng nhau duyệt qua dữ liệu. Tổng số phép tính tăng theo luỹ thừa bậc ${maxLoopDepth} -> ${exp}.`,
      spaceExplanation:
        'Sử dụng các biến đếm nguyên của vòng lặp, sắp xếp tại chỗ -> O(1) Auxiliary Space.',
      keyOperationsCount: maxLoopDepth === 2 ? 'n * (n - 1) / 2 phép tính' : `n^${maxLoopDepth} phép tính`,
      optimizationTips: [
        'Cân nhắc dùng bảng băm (Hash Map / Set) hoặc các thuật toán chia để trị để giảm độ phức tạp xuống O(n) hoặc O(n log n).',
      ],
    };
  }

  // Single loop
  if (maxLoopDepth === 1) {
    return {
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      auxiliaryStackSpace: 'O(1)',
      heapAllocation: 'O(1)',
      recurrenceRelation: 'N/A',
      timeExplanation:
        'Chương trình có 1 vòng lặp duyệt qua n phần tử. Mỗi phần tử thực hiện các thao tác cơ bản O(1) -> Tổng thời gian là O(n).',
      spaceExplanation:
        'Chỉ sử dụng biến đếm và biến tích lũy, không cấp phát thêm bộ nhớ tỉ lệ với n -> O(1) Auxiliary Space.',
      keyOperationsCount: 'n phép tính',
      optimizationTips: [
        'Độ phức tạp O(n) là tuyến tính và tối ưu cho hầu hết các tác vụ duyệt qua toàn bộ dữ liệu.',
      ],
    };
  }

  // Constant time
  return {
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    auxiliaryStackSpace: 'O(1)',
    heapAllocation: 'O(1)',
    recurrenceRelation: 'N/A',
    timeExplanation:
      'Chương trình chỉ thực hiện các câu lệnh gán, tính toán hoặc truy xuất cơ bản không phụ thuộc vào kích thước dữ liệu n -> O(1) thời gian không đổi.',
    spaceExplanation:
      'Bộ nhớ cố định cho các biến nguyên thủy -> O(1) không gian nhớ.',
    keyOperationsCount: 'Số phép tính cố định',
    optimizationTips: [
      'Thuật toán có độ phức tạp hằng số O(1), đạt tốc độ tối đa.',
    ],
  };
}
