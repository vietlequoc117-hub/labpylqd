import { PresetCode } from './types';

export const PRESETS: PresetCode[] = [
  // =========================================================================
  // BÀI TẬP TỰ DO (CUSTOM CODE & USER DATA INPUT)
  // =========================================================================
  {
    id: 'custom-code',
    title: '★ Tự do nhập Code & Dữ liệu của bạn',
    category: 'Tự do sáng tạo',
    description: 'Bạn có thể nhập bất kỳ thuật toán và dữ liệu nào bạn muốn. Hệ thống tự động phân tích bộ nhớ, vẽ đường cong con trỏ Heap, sinh mã giả và tính độ phức tạp Big-O.',
    code: `# ========================================================
# BÀI TOÁN TỰ NHẬP: BẠN CÓ THỂ TÙY Ý THAY ĐỔI CODE & DỮ LIỆU
# ========================================================
# 1. Bạn có thể gán dữ liệu trực tiếp vào biến, hoặc
# 2. Dùng input() và nhập dữ liệu vào ô 'Dữ liệu stdin' bên trên

def process_my_data(arr):
    # Thuật toán tùy ý của bạn:
    result = []
    total = 0
    for x in arr:
        total += x
        result.append(x * 2)
    return total, result

# Thay đổi mảng dữ liệu này theo ý bạn:
user_data = [42, 17, 93, 8, 55, 31]
print("Dữ liệu nhập vào:", user_data)

sum_val, doubled_arr = process_my_data(user_data)
print("Tổng các phần tử:", sum_val)
print("Mảng sau khi xử lý:", doubled_arr)
`,
  },

  // =========================================================================
  // THUẬT TOÁN SẮP XẾP (CHƯƠNG TRÌNH CHUẨN THEO YÊU CẦU)
  // =========================================================================
  {
    id: 'bubble-sort',
    title: '1. Bubble Sort (Sắp Xếp Nổi Bọt)',
    category: 'Thuật toán Sắp xếp',
    defaultStdin: '5 2 8 1 3',
    description: 'So sánh từng cặp phần tử liền kề và đổi chỗ nếu chúng đứng sai thứ tự. Tương thích tối ưu cho cả mảng số và xâu/kí tự (theo bảng mã ASCII).',
    code: `def bubble_sort(arr):
    n = len(arr)
    # Lặp qua tất cả phần tử mảng
    for i in range(n):
        swapped = False
        # Các phần tử cuối đã được đưa về đúng vị trí
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                # Hoán đổi hai phần tử liền kề
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        # Nếu không có hoán đổi nào, mảng đã được sắp xếp
        if not swapped:
            break
    return arr

# Tự động nhận diện dữ liệu: Mảng số hoặc Xâu kí tự
raw = input("Nhập mảng số hoặc xâu kí tự: ")
parts = [x.strip() for x in raw.replace(',', ' ').split() if x.strip()]
if all(p.lstrip('-').isdigit() for p in parts if p):
    arr = [int(x) for x in parts]
elif len(parts) > 1:
    arr = parts
else:
    arr = list(raw.strip())

print("Dữ liệu ban đầu:", arr)
sorted_arr = bubble_sort(arr)
print("Dữ liệu sau khi sắp xếp:", sorted_arr)
`,
    pseudocode: [
      { lineNum: 1, text: 'Thuật toán BubbleSort(A, n):', indent: 0, correspondingPythonLines: [1, 2], explanation: 'Định nghĩa hàm sắp xếp nổi bọt nhận mảng A độ dài n' },
      { lineNum: 2, text: 'Lặp i từ 0 đến n - 1:', indent: 1, correspondingPythonLines: [4], explanation: 'Vòng lặp ngoài kiểm soát số lượt quét qua mảng' },
      { lineNum: 3, text: 'swapped ← False (cờ kiểm tra)', indent: 2, correspondingPythonLines: [5], explanation: 'Đặt cờ theo dõi xem có hoán đổi nào xảy ra trong lượt này không' },
      { lineNum: 4, text: 'Lặp j từ 0 đến n - i - 2:', indent: 2, correspondingPythonLines: [7], explanation: 'Vòng lặp trong duyệt qua đoạn chưa sắp xếp ở đầu' },
      { lineNum: 5, text: 'Nếu A[j] > A[j + 1] thì:', indent: 3, correspondingPythonLines: [8], explanation: 'So sánh 2 phần tử kề nhau xem có ngược thứ tự không' },
      { lineNum: 6, text: 'Hoán đổi A[j] ↔ A[j + 1]', indent: 4, correspondingPythonLines: [10], explanation: 'Đổi chỗ hai phần tử' },
      { lineNum: 7, text: 'swapped ← True', indent: 4, correspondingPythonLines: [11], explanation: 'Đánh dấu có sự xáo trộn xảy ra' },
      { lineNum: 8, text: 'Nếu không swapped thì:', indent: 2, correspondingPythonLines: [13], explanation: 'Nếu cả lượt không có cặp nào bị đổi chỗ' },
      { lineNum: 9, text: 'Dừng thuật toán sớm (break)', indent: 3, correspondingPythonLines: [14], explanation: 'Mảng đã được sắp xếp hoàn toàn, đạt Best-case O(n)' },
      { lineNum: 10, text: 'Trả về mảng A đã sắp xếp', indent: 1, correspondingPythonLines: [15], explanation: 'Kết thúc và trả về danh sách' },
    ],
  },
  {
    id: 'selection-sort',
    title: '2. Selection Sort (Sắp xếp chọn)',
    category: 'Thuật toán Sắp xếp',
    defaultStdin: '64 25 12 22 11',
    description: 'Tại mỗi bước, tìm phần tử nhỏ nhất trong đoạn chưa được sắp xếp và hoán đổi nó về vị trí đầu tiên của đoạn đó. Hỗ trợ mảng số và xâu kí tự.',
    code: `def selection_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        # Giả định phần tử nhỏ nhất hiện tại là i
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        # Đưa phần tử nhỏ nhất về vị trí i
        if min_idx != i:
            arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr

# Tự động nhận diện dữ liệu: Mảng số hoặc Xâu kí tự
raw = input("Nhập mảng số hoặc xâu kí tự: ")
parts = [x.strip() for x in raw.replace(',', ' ').split() if x.strip()]
if all(p.lstrip('-').isdigit() for p in parts if p):
    arr = [int(x) for x in parts]
elif len(parts) > 1:
    arr = parts
else:
    arr = list(raw.strip())

print("Dữ liệu ban đầu:", arr)
selection_sort(arr)
print("Dữ liệu sau khi sắp xếp:", arr)
`,
    pseudocode: [
      { lineNum: 1, text: 'Thuật toán SelectionSort(A, n):', indent: 0, correspondingPythonLines: [1, 2], explanation: 'Định nghĩa thuật toán sắp xếp chọn' },
      { lineNum: 2, text: 'Lặp i từ 0 đến n - 2:', indent: 1, correspondingPythonLines: [3], explanation: 'Từng bước xây dựng phần tử nhỏ thứ i ở vị trí i' },
      { lineNum: 3, text: 'min_idx ← i (giả định vị trí i nhỏ nhất)', indent: 2, correspondingPythonLines: [5], explanation: 'Khởi tạo chỉ số nhỏ nhất là vị trí bắt đầu đoạn chưa sắp xếp' },
      { lineNum: 4, text: 'Lặp j từ i + 1 đến n - 1:', indent: 2, correspondingPythonLines: [6], explanation: 'Tìm kiếm phần tử nhỏ nhất trong phần còn lại của mảng' },
      { lineNum: 5, text: 'Nếu A[j] < A[min_idx] thì:', indent: 3, correspondingPythonLines: [7], explanation: 'Nếu phát hiện phần tử nhỏ hơn' },
      { lineNum: 6, text: 'min_idx ← j (cập nhật chỉ số nhỏ nhất)', indent: 4, correspondingPythonLines: [8], explanation: 'Ghi nhận vị trí mới của phần tử nhỏ nhất' },
      { lineNum: 7, text: 'Nếu min_idx ≠ i thì:', indent: 2, correspondingPythonLines: [10], explanation: 'Nếu tìm thấy phần tử nhỏ hơn vị trí ban đầu' },
      { lineNum: 8, text: 'Hoán đổi A[i] ↔ A[min_idx]', indent: 3, correspondingPythonLines: [11], explanation: 'Đưa giá trị nhỏ nhất về vị trí i (tối đa n-1 lần hoán đổi)' },
      { lineNum: 9, text: 'Trả về mảng A đã sắp xếp', indent: 1, correspondingPythonLines: [12], explanation: 'Kết thúc thuật toán' },
    ],
  },
  {
    id: 'insertion-sort',
    title: '3. Insertion Sort (Sắp Xếp Chèn)',
    category: 'Thuật toán Sắp xếp',
    defaultStdin: '12 11 13 5 6',
    description: 'Xây dựng mảng con đã sắp xếp bằng cách lấy từng phần tử mới và chèn nó vào đúng vị trí trong đoạn đã sắp xếp phía trước.',
    code: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        # Dời các phần tử lớn hơn key sang bên phải một vị trí
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        # Đặt key vào đúng vị trí đã tạo chỗ trống
        arr[j + 1] = key
    return arr

# Tự động nhận diện dữ liệu: Mảng số hoặc Xâu kí tự
raw = input("Nhập mảng số hoặc xâu kí tự: ")
parts = [x.strip() for x in raw.replace(',', ' ').split() if x.strip()]
if all(p.lstrip('-').isdigit() for p in parts if p):
    arr = [int(x) for x in parts]
elif len(parts) > 1:
    arr = parts
else:
    arr = list(raw.strip())

print("Dữ liệu ban đầu:", arr)
insertion_sort(arr)
print("Dữ liệu sau khi chèn:", arr)
`,
    pseudocode: [
      { lineNum: 1, text: 'Thuật toán InsertionSort(A, n):', indent: 0, correspondingPythonLines: [1], explanation: 'Định nghĩa thuật toán sắp xếp chèn' },
      { lineNum: 2, text: 'Lặp i từ 1 đến n - 1:', indent: 1, correspondingPythonLines: [2], explanation: 'Duyệt từng phần tử từ vị trí thứ 2 đến cuối' },
      { lineNum: 3, text: 'key ← A[i] (lưu giá trị cần chèn)', indent: 2, correspondingPythonLines: [3], explanation: 'Lấy phần tử hiện tại ra để tìm vị trí chèn phù hợp' },
      { lineNum: 4, text: 'j ← i - 1 (vị trí phần tử liền trước)', indent: 2, correspondingPythonLines: [4], explanation: 'Bắt đầu so sánh ngược về phía đầu mảng đã sắp xếp' },
      { lineNum: 5, text: 'Trong khi j ≥ 0 và A[j] > key:', indent: 2, correspondingPythonLines: [6], explanation: 'Nếu phần tử phía trước lớn hơn key' },
      { lineNum: 6, text: 'A[j + 1] ← A[j] (dời phần tử sang phải)', indent: 3, correspondingPythonLines: [7], explanation: 'Dịch chuyển phần tử sang phải để chừa chỗ' },
      { lineNum: 7, text: 'j ← j - 1', indent: 3, correspondingPythonLines: [8], explanation: 'Lùi con trỏ j về phía trước' },
      { lineNum: 8, text: 'A[j + 1] ← key (chèn key vào khoảng trống)', indent: 2, correspondingPythonLines: [10], explanation: 'Đặt key vào đúng vị trí theo thứ tự tăng dần' },
      { lineNum: 9, text: 'Trả về mảng A đã sắp xếp', indent: 1, correspondingPythonLines: [11], explanation: 'Kết thúc thuật toán' },
    ],
  },
  {
    id: 'quick-sort',
    title: '4. Quick Sort (Sắp Xếp Nhanh)',
    category: 'Thuật toán Sắp xếp',
    defaultStdin: '10 7 8 9 1 5',
    description: 'Chọn phần tử chốt (pivot) và phân hoạch mảng: các phần tử nhỏ hơn chốt dời sang trái, lớn hơn sang phải, sau đó đệ quy sắp xếp hai nửa.',
    code: `def partition(arr, low, high):
    pivot = arr[high]  # Chọn phần tử cuối làm chốt
    i = low - 1        # Chỉ số của phần tử nhỏ hơn
    
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
            
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

def quick_sort(arr, low, high):
    if low < high:
        # pi là chỉ số phân hoạch sau khi đặt pivot đúng chỗ
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi - 1)
        quick_sort(arr, pi + 1, high)
    return arr

# Tự động nhận diện dữ liệu: Mảng số hoặc Xâu kí tự
raw = input("Nhập mảng số hoặc xâu kí tự: ")
parts = [x.strip() for x in raw.replace(',', ' ').split() if x.strip()]
if all(p.lstrip('-').isdigit() for p in parts if p):
    arr = [int(x) for x in parts]
elif len(parts) > 1:
    arr = parts
else:
    arr = list(raw.strip())

print("Dữ liệu ban đầu:", arr)
quick_sort(arr, 0, len(arr) - 1)
print("Dữ liệu sau Quick Sort:", arr)
`,
    pseudocode: [
      { lineNum: 1, text: 'Thuật toán QuickSort(A, low, high):', indent: 0, correspondingPythonLines: [13], explanation: 'Sắp xếp nhanh đoạn A[low...high] bằng chia để trị' },
      { lineNum: 2, text: 'Nếu low < high thì:', indent: 1, correspondingPythonLines: [14], explanation: 'Điều kiện dừng: đoạn có ít nhất 2 phần tử' },
      { lineNum: 3, text: 'pi ← Partition(A, low, high)', indent: 2, correspondingPythonLines: [16], explanation: 'Phân hoạch mảng quanh pivot, trả về vị trí chuẩn pi của pivot' },
      { lineNum: 4, text: 'QuickSort(A, low, pi - 1)', indent: 2, correspondingPythonLines: [17], explanation: 'Đệ quy sắp xếp nửa bên trái pivot' },
      { lineNum: 5, text: 'QuickSort(A, pi + 1, high)', indent: 2, correspondingPythonLines: [18], explanation: 'Đệ quy sắp xếp nửa bên phải pivot' },
      { lineNum: 6, text: 'Hàm Partition(A, low, high):', indent: 0, correspondingPythonLines: [1], explanation: 'Hàm phân hoạch phân chia mảng' },
      { lineNum: 7, text: 'pivot ← A[high], i ← low - 1', indent: 1, correspondingPythonLines: [2, 3], explanation: 'Chọn phần tử cuối làm chốt' },
      { lineNum: 8, text: 'Lặp j từ low đến high - 1:', indent: 1, correspondingPythonLines: [5], explanation: 'Quét các phần tử để so sánh với pivot' },
      { lineNum: 9, text: 'Nếu A[j] ≤ pivot: i ← i + 1; Hoán đổi A[i] ↔ A[j]', indent: 2, correspondingPythonLines: [6, 7, 8], explanation: 'Gom các phần tử nhỏ hơn hoặc bằng pivot sang bên trái' },
      { lineNum: 10, text: 'Hoán đổi A[i + 1] ↔ A[high]; Trả về i + 1', indent: 1, correspondingPythonLines: [10, 11], explanation: 'Đưa pivot vào đúng vị trí giữa hai phân vùng' },
    ],
  },
  {
    id: 'merge-sort',
    title: '5. Merge Sort (Sắp Xếp Trộn)',
    category: 'Thuật toán Sắp xếp',
    defaultStdin: '38 27 43 3 9',
    description: 'Chia đôi mảng liên tục cho đến khi mỗi đoạn con chỉ có 1 phần tử, sau đó lần lượt trộn (merge) các cặp mảng con đã có thứ tự lại với nhau.',
    code: `def merge_sort(arr):
    if len(arr) > 1:
        mid = len(arr) // 2
        left_half = arr[:mid]
        right_half = arr[mid:]

        # Đệ quy chia đôi
        merge_sort(left_half)
        merge_sort(right_half)

        # Trộn 2 nửa đã sắp xếp
        i = j = k = 0
        while i < len(left_half) and j < len(right_half):
            if left_half[i] <= right_half[j]:
                arr[k] = left_half[i]
                i += 1
            else:
                arr[k] = right_half[j]
                j += 1
            k += 1

        # Gom phần còn lại của left_half
        while i < len(left_half):
            arr[k] = left_half[i]
            i += 1
            k += 1

        # Gom phần còn lại của right_half
        while j < len(right_half):
            arr[k] = right_half[j]
            j += 1
            k += 1
    return arr

# Tự động nhận diện dữ liệu: Mảng số hoặc Xâu kí tự
raw = input("Nhập mảng số hoặc xâu kí tự: ")
parts = [x.strip() for x in raw.replace(',', ' ').split() if x.strip()]
if all(p.lstrip('-').isdigit() for p in parts if p):
    arr = [int(x) for x in parts]
elif len(parts) > 1:
    arr = parts
else:
    arr = list(raw.strip())

print("Dữ liệu ban đầu:", arr)
merge_sort(arr)
print("Dữ liệu sau Merge Sort:", arr)
`,
    pseudocode: [
      { lineNum: 1, text: 'Thuật toán MergeSort(A):', indent: 0, correspondingPythonLines: [1], explanation: 'Sắp xếp trộn áp dụng chiến lược Chia để trị (Divide & Conquer)' },
      { lineNum: 2, text: 'Nếu độ dài A > 1 thì:', indent: 1, correspondingPythonLines: [2], explanation: 'Nếu mảng có từ 2 phần tử trở lên' },
      { lineNum: 3, text: 'mid ← ⌊độ dài A / 2⌋', indent: 2, correspondingPythonLines: [3], explanation: 'Tìm vị trí chính giữa để chia đôi' },
      { lineNum: 4, text: 'L ← A[0...mid-1], R ← A[mid...n-1]', indent: 2, correspondingPythonLines: [4, 5], explanation: 'Tạo hai mảng con nửa trái L và nửa phải R' },
      { lineNum: 5, text: 'MergeSort(L)  (Đệ quy nửa trái)', indent: 2, correspondingPythonLines: [8], explanation: 'Sắp xếp xong nửa trái L' },
      { lineNum: 6, text: 'MergeSort(R)  (Đệ quy nửa phải)', indent: 2, correspondingPythonLines: [9], explanation: 'Sắp xếp xong nửa phải R' },
      { lineNum: 7, text: 'Trộn L và R vào mảng A gốc (Merge):', indent: 2, correspondingPythonLines: [12, 13], explanation: 'Duyệt 2 con trỏ i và j, nhặt phần tử nhỏ hơn vào A[k]' },
      { lineNum: 8, text: 'Sao chép các phần tử còn dư của L và R vào A', indent: 2, correspondingPythonLines: [23, 29], explanation: 'Hoàn tất quá trình trộn, đạt O(n log n) ổn định' },
      { lineNum: 9, text: 'Trả về mảng A đã sắp xếp', indent: 1, correspondingPythonLines: [34], explanation: 'Kết thúc thuật toán' },
    ],
  },
  {
    id: 'complexity-comparison',
    title: '6. Độ phức tạp của các Thuật toán',
    category: 'Thuật toán Sắp xếp',
    description: 'Bảng tổng hợp đối chiếu độ phức tạp thời gian (Best, Average, Worst), bộ nhớ phụ (Auxiliary Space), tính ổn định và sắp xếp tại chỗ của cả 5 thuật toán.',
    code: `# BẢNG SO SÁNH ĐỘ PHỨC TẠP 5 THUẬT TOÁN SẮP XẾP
# ============================================================
# Thuật toán       Best-case    Avg-case     Worst-case   Bộ nhớ    Ổn định
# ------------------------------------------------------------
# Bubble Sort      O(n)         O(n²)        O(n²)        O(1)      Có
# Selection Sort   O(n²)        O(n²)        O(n²)        O(1)      Không
# Insertion Sort   O(n)         O(n²)        O(n²)        O(1)      Có
# Quick Sort       O(n log n)   O(n log n)   O(n²)        O(log n)  Không
# Merge Sort       O(n log n)   O(n log n)   O(n log n)   O(n)      Có
# ============================================================

matrix = [
    {"name": "Bubble Sort", "best": "O(n)", "avg": "O(n²)", "worst": "O(n²)", "space": "O(1)", "stable": True, "inplace": True},
    {"name": "Selection Sort", "best": "O(n²)", "avg": "O(n²)", "worst": "O(n²)", "space": "O(1)", "stable": False, "inplace": True},
    {"name": "Insertion Sort", "best": "O(n)", "avg": "O(n²)", "worst": "O(n²)", "space": "O(1)", "stable": True, "inplace": True},
    {"name": "Quick Sort", "best": "O(n log n)", "avg": "O(n log n)", "worst": "O(n²)", "space": "O(log n)", "stable": False, "inplace": True},
    {"name": "Merge Sort", "best": "O(n log n)", "avg": "O(n log n)", "worst": "O(n log n)", "space": "O(n)", "stable": True, "inplace": False},
]

print("=== SO SÁNH ĐỘ PHỨC TẠP CÁC THUẬT TOÁN ===")
for item in matrix:
    st = "Ổn định" if item['stable'] else "Không ổn định"
    inp = "In-place" if item['inplace'] else "Cần mảng phụ"
    print(f"[{item['name']}]: Thời gian = {item['avg']} | Không gian = {item['space']} | {st} | {inp}")
`,
    pseudocode: [
      { lineNum: 1, text: 'BẢNG ĐỐI CHIẾU ĐỘ PHỨC TẠP CÁC THUẬT TOÁN SẮP XẾP:', indent: 0, explanation: 'Tổng hợp phân tích hiệu năng Big-O' },
      { lineNum: 2, text: '1. Bubble Sort:    T(n) = O(n²) avg, O(n) best  | S(n) = O(1)  | Ổn định | In-place', indent: 1, explanation: 'Đơn giản, thích hợp mảng đã gần sắp xếp' },
      { lineNum: 3, text: '2. Selection Sort: T(n) = O(n²) trong mọi case  | S(n) = O(1)  | Không ổn định | In-place', indent: 1, explanation: 'Tối thiểu hóa số lần hoán đổi (tối đa n - 1 lần)' },
      { lineNum: 4, text: '3. Insertion Sort: T(n) = O(n²) avg, O(n) best  | S(n) = O(1)  | Ổn định | In-place', indent: 1, explanation: 'Rất nhanh với mảng nhỏ (n < 30) hoặc mảng gần có thứ tự' },
      { lineNum: 5, text: '4. Quick Sort:     T(n) = O(n log n) avg, O(n²) worst | S(n) = O(log n) | Không ổn định | In-place', indent: 1, explanation: 'Thuật toán sắp xếp đa mục đích nhanh nhất trong thực tế' },
      { lineNum: 6, text: '5. Merge Sort:     T(n) = O(n log n) mọi case   | S(n) = O(n)  | Ổn định | Cần mảng phụ', indent: 1, explanation: 'Đảm bảo O(n log n) ngay cả ở Worst-case, ổn định cao' },
    ],
  },

  // =========================================================================
  // THUẬT TOÁN TÌM KIẾM (CHUẨN CHƯƠNG TRÌNH TIN HỌC THPT)
  // =========================================================================
  {
    id: 'linear-search',
    title: '7. Tìm kiếm tuần tự (Linear Search) - O(n)',
    category: 'Thuật toán Tìm kiếm',
    defaultStdin: '12 45 7 23 56 89 34',
    description: 'Duyệt tuần tự từng phần tử từ đầu đến cuối mảng cho đến khi tìm thấy phần tử cần tìm hoặc duyệt hết mảng. Áp dụng tối ưu cho cả mảng số và xâu/kí tự.',
    code: `def linear_search(arr, target):
    # Duyệt tuần tự từng phần tử từ đầu đến cuối mảng
    for i in range(len(arr)):
        if arr[i] == target:
            return i  # Tìm thấy tại chỉ số i
    return -1  # Không tìm thấy sau khi duyệt hết mảng

# Tự động nhận diện dữ liệu: Mảng số hoặc Xâu kí tự
raw = input("Nhập mảng số hoặc xâu kí tự: ")
parts = [x.strip() for x in raw.replace(',', ' ').split() if x.strip()]
if all(p.lstrip('-').isdigit() for p in parts if p):
    data = [int(x) for x in parts]
elif len(parts) > 1:
    data = parts
else:
    data = list(raw.strip())

# Chọn mục tiêu cần tìm kiếm (target):
target = data[len(data) // 2] if data else ('A' if data and isinstance(data[0], str) else 0)
print("Dữ liệu cần tìm:", data)
print("Mục tiêu cần tìm:", target)

vi_tri = linear_search(data, target)
if vi_tri != -1:
    print(f"Tìm thấy '{target}' tại vị trí index: {vi_tri}")
else:
    print(f"Không tìm thấy '{target}' trong dữ liệu")
`,
    pseudocode: [
      { lineNum: 1, text: 'Thuật toán LinearSearch(A, target):', indent: 0, correspondingPythonLines: [1], explanation: 'Duyệt tuần tự từng phần tử trong mảng A' },
      { lineNum: 2, text: 'Lặp i từ 0 đến độ dài(A) - 1:', indent: 1, correspondingPythonLines: [3], explanation: 'Kiểm tra lần lượt từng vị trí từ trái sang phải' },
      { lineNum: 3, text: 'Nếu A[i] = target thì:', indent: 2, correspondingPythonLines: [4], explanation: 'So sánh phần tử tại chỉ số i với giá trị cần tìm' },
      { lineNum: 4, text: 'Trả về i (Tìm thấy)', indent: 3, correspondingPythonLines: [5], explanation: 'Dừng ngay và trả về vị trí phần tử' },
      { lineNum: 5, text: 'Trả về -1 (Không tìm thấy)', indent: 1, correspondingPythonLines: [6], explanation: 'Duyệt hết mảng mà không thấy target' },
    ],
  },
  {
    id: 'binary-search',
    title: '8. Tìm kiếm nhị phân (Binary Search) - O(log n)',
    category: 'Thuật toán Tìm kiếm',
    defaultStdin: '2 5 8 12 16 23 38 56 72 91',
    description: 'Chia đôi không gian tìm kiếm trên mảng đã sắp xếp bằng 2 con trỏ left và right để tìm nhanh giá trị trong thời gian O(log n). Áp dụng tối ưu cho cả số và xâu kí tự.',
    code: `def binary_search(arr, target):
    left = 0
    right = len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        mid_val = arr[mid]
        
        if mid_val == target:
            return mid  # Tìm thấy phần tử tại vị trí mid
        elif mid_val < target:
            left = mid + 1  # Bỏ nửa bên trái, tìm ở nửa bên phải
        else:
            right = mid - 1  # Bỏ nửa bên phải, tìm ở nửa bên trái
            
    return -1  # Không tìm thấy

# Tự động nhận diện dữ liệu: Mảng số hoặc Xâu kí tự
raw = input("Nhập mảng số hoặc xâu kí tự: ")
parts = [x.strip() for x in raw.replace(',', ' ').split() if x.strip()]
if all(p.lstrip('-').isdigit() for p in parts if p):
    data = [int(x) for x in parts]
elif len(parts) > 1:
    data = parts
else:
    data = list(raw.strip())

# Đảm bảo dữ liệu đã được sắp xếp để áp dụng tìm kiếm nhị phân:
data.sort()
target = data[len(data) // 2] if data else ('A' if data and isinstance(data[0], str) else 0)
print("Dữ liệu đã sắp xếp:", data)
print("Mục tiêu cần tìm:", target)

vi_tri = binary_search(data, target)
if vi_tri != -1:
    print(f"Tìm thấy '{target}' tại vị trí index: {vi_tri}")
else:
    print(f"Không tìm thấy '{target}' trong dữ liệu")
`,
    pseudocode: [
      { lineNum: 1, text: 'Thuật toán BinarySearch(A, target):', indent: 0, correspondingPythonLines: [1], explanation: 'Tìm kiếm nhị phân trên mảng A đã có thứ tự' },
      { lineNum: 2, text: 'left ← 0, right ← độ dài(A) - 1', indent: 1, correspondingPythonLines: [2, 3], explanation: 'Khởi tạo 2 con trỏ ở hai đầu mảng' },
      { lineNum: 3, text: 'Trong khi left ≤ right:', indent: 1, correspondingPythonLines: [5], explanation: 'Phạm vi tìm kiếm vẫn còn hợp lệ' },
      { lineNum: 4, text: 'mid ← ⌊(left + right) / 2⌋', indent: 2, correspondingPythonLines: [6, 7], explanation: 'Tìm vị trí chính giữa phạm vi tìm kiếm' },
      { lineNum: 5, text: 'Nếu A[mid] = target thì:', indent: 2, correspondingPythonLines: [9], explanation: 'Kiểm tra phần tử ở giữa có đúng số cần tìm không' },
      { lineNum: 6, text: 'Trả về vị trí mid (Tìm thấy)', indent: 3, correspondingPythonLines: [10], explanation: 'Dừng thuật toán ngay khi tìm thấy' },
      { lineNum: 7, text: 'Nếu A[mid] < target thì: left ← mid + 1', indent: 2, correspondingPythonLines: [11, 12], explanation: 'target lớn hơn số ở giữa, thu hẹp sang nửa bên phải' },
      { lineNum: 8, text: 'Ngược lại: right ← mid - 1', indent: 2, correspondingPythonLines: [13, 14], explanation: 'target nhỏ hơn số ở giữa, thu hẹp sang nửa bên trái' },
      { lineNum: 9, text: 'Trả về -1 (Không tìm thấy)', indent: 1, correspondingPythonLines: [16], explanation: 'Duyệt hết mảng mà không có target' },
    ],
  },
  {
    id: 'string-sort',
    title: '9. Sắp xếp Xâu Kí Tự (String / ASCII Sort)',
    category: 'Thuật toán Sắp xếp',
    defaultStdin: 'P Y T H O N',
    description: 'Chuyên đề sắp xếp xâu kí tự và danh sách từ vựng theo bảng mã ASCII / từ điển. Biểu diễn trực quan mã ASCII và chiều cao cột tương ứng cho học sinh THPT.',
    code: `def sort_characters(chars):
    n = len(chars)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            # So sánh 2 kí tự liền kề theo thứ tự bảng mã ASCII (ord(c))
            if chars[j] > chars[j + 1]:
                chars[j], chars[j + 1] = chars[j + 1], chars[j]
                swapped = True
        if not swapped:
            break
    return chars

# Nhập xâu kí tự (ví dụ: P Y T H O N hoặc ALGORITHM hoặc B A N A N A):
raw = input("Nhập xâu kí tự: ")
parts = [x.strip() for x in raw.replace(',', ' ').split() if x.strip()]
chars = parts if len(parts) > 1 else list(raw.strip())

print("Xâu kí tự ban đầu:", chars)
print("Mã ASCII tương ứng:", [ord(c) for c in chars if len(c) == 1])

sorted_chars = sort_characters(chars)
print("Xâu sau khi sắp xếp:", sorted_chars)
print("Ghép lại thành xâu hoàn chỉnh:", "".join(sorted_chars))
`,
    pseudocode: [
      { lineNum: 1, text: 'Thuật toán StringSort(chars, n):', indent: 0, correspondingPythonLines: [1, 2], explanation: 'Định nghĩa thuật toán sắp xếp xâu kí tự nhận danh sách chars' },
      { lineNum: 2, text: 'Lặp i từ 0 đến n - 1:', indent: 1, correspondingPythonLines: [3], explanation: 'Quét các lượt để đưa kí tự có mã ASCII lớn nhất về cuối' },
      { lineNum: 3, text: 'Lặp j từ 0 đến n - i - 2:', indent: 2, correspondingPythonLines: [5], explanation: 'Duyệt qua các cặp kí tự kề nhau' },
      { lineNum: 4, text: 'Nếu chars[j] > chars[j + 1] (theo mã ASCII):', indent: 3, correspondingPythonLines: [7], explanation: 'So sánh 2 chữ cái: ví dụ "Y" (ASCII 89) > "P" (ASCII 80)' },
      { lineNum: 5, text: 'Hoán đổi chars[j] ↔ chars[j + 1]', indent: 4, correspondingPythonLines: [8], explanation: 'Đổi chỗ hai kí tự trong xâu' },
      { lineNum: 6, text: 'Trả về xâu chars đã sắp xếp xong', indent: 1, correspondingPythonLines: [12], explanation: 'Trả về mảng kí tự theo thứ tự bảng chữ cái A-Z' },
    ],
  },
];
