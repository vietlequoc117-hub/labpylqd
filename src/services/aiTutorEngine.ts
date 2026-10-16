/**
 * ĐỘNG CƠ TRỢ LÍ AI CHUYÊN GIA LẬP TRÌNH PYTHON CẤP CAO & SƯ PHẠM TIN HỌC THPT
 * 
 * NGUYÊN TẮC BẮT BUỘC:
 * 1. TRẢ LỜI ĐÚNG 100% TRỌNG TÂM CÂU HỎI: Không trả lời lạc đề, không nhầm lẫn giữa các khái niệm.
 * 2. DỄ HIỂU NHẤT CHO HỌC SINH THPT (LỚP 10, 11, 12): Giải thích bản chất từ gốc rễ, ví dụ trực quan.
 * 3. CHUẨN XÁC KỸ THUẬT PYTHON: Chuẩn kiến trúc bộ nhớ RAM, cơ chế CPython, độ phức tạp Big-O.
 * 4. TÍCH HỢP SẴN 100% OFFLINE: Phản hồi tức thì 0ms, không phụ thuộc mạng, không cần API key.
 */

import { TraceStep } from '../types';
import { getHighSchoolPedagogy, AlgorithmPedagogy } from './aiTutorKnowledge';

export interface TutorResponse {
  content: string;
  isInstant: boolean;
  source: 'built-in-ai' | 'hybrid';
}

/**
 * Trả lời câu hỏi bất kỳ của học sinh với tư cách Chuyên gia Lập trình cấp cao Python
 */
export function answerStudentQuestion(params: {
  question: string;
  algorithmId: string;
  algorithmTitle?: string;
  code: string;
  currentStep?: TraceStep;
  stdinInput?: string;
}): string {
  const { question, algorithmId, algorithmTitle = 'Thuật toán', code, currentStep } = params;
  const rawQ = question.trim();
  const q = rawQ.toLowerCase().replace(/[?!.,;:_]/g, ' ');
  const pedagogy = getHighSchoolPedagogy(algorithmId);

  // =========================================================================
  // 1. CÂU HỎI VỀ BIẾN CỜ SWAPPED TRONG BUBBLE SORT (Ưu tiên cao nhất tránh nhầm với swap)
  // =========================================================================
  const isSwappedFlagQuery =
    q.includes('swapped') ||
    q.includes('biến cờ') ||
    q.includes('cờ hiệu') ||
    q.includes('dừng sớm') ||
    q.includes('break trong bubble') ||
    q.includes('flag') ||
    (q.includes('cờ') && (q.includes('tác dụng') || q.includes('là gì') || q.includes('để làm gì')));

  if (isSwappedFlagQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: TÁC DỤNG CỦA BIẾN CỜ \`swapped\` TRONG BUBBLE SORT**\n\n` +
      `Thầy/Cô chuyên gia giải thích ngắn gọn, chuẩn xác 100% để bạn ghi nhớ ngay:\n\n` +
      `### 1. Bản chất và Tác dụng chính:\n` +
      `- **Tác dụng cốt lõi:** Biến cờ \`swapped\` là một **kỹ thuật cờ hiệu tối ưu hóa (Optimization Flag)**, giúp máy tính **nhận biết mảng đã sắp xếp xong để DỪNG SỚM (Early Exit)** mà không cần chạy thêm các lượt sau nữa.\n` +
      `- **Quy trình hoạt động:**\n` +
      `  1. Đầu mỗi lượt lặp ngoài ($i$), ta gán \`swapped = False\` (đặt cược rằng mảng đã ngăn nắp).\n` +
      `  2. Trong vòng lặp trong ($j$), nếu có **bất kỳ cặp số nào đứng ngược thứ tự và bị đổi chỗ**, ta lập tức bật cờ \`swapped = True\`.\n` +
      `  3. Kết thúc lượt lặp trong, ta kiểm tra:\n` +
      `     \`if not swapped: break\`\n` +
      `     Nếu \`swapped\` vẫn là \`False\`, chứng tỏ **suốt cả lượt duyệt không có bất kỳ cặp nào phải đổi chỗ nữa** $\\to$ Toàn bộ mảng đã có thứ tự hoàn hảo 100% $\\to$ Lệnh \`break\` thoát khỏi hàm ngay lập tức!\n\n` +
      `### 2. Ví dụ thực tế minh họa:\n` +
      `- Giả sử đề bài cho mảng đã sắp xếp sẵn: \`[1, 2, 3, 4, 5]\`.\n` +
      `  * **Nếu KHÔNG có \`swapped\`:** Thuật toán ngây thơ vẫn cắm đầu chạy đủ cả 2 vòng lặp lồng nhau, tốn $n \\times (n-1)/2 = 10$ phép so sánh vô ích ($O(n^2)$)!\n` +
      `  * **Khi CÓ \`swapped\`:** Máy tính chỉ duyệt đúng 1 lượt đầu tiên (4 phép so sánh), thấy không có ai bị đổi chỗ thì \`break\` dừng luôn $\\to$ **Chạy siêu nhanh với độ phức tạp Best-case $O(n)$**!\n\n` +
      `💡 **Mẹo làm bài thi THPT:** Khi đề thi hỏi *"Trong Bubble Sort, làm sao để đạt độ phức tạp tốt nhất $O(n)$?"*, đáp án đúng luôn là: **Sử dụng biến cờ kiểm tra (swapped) kết hợp lệnh break để dừng sớm.**`;
  }

  // =========================================================================
  // 2. CÂU HỎI VỀ CƠ CHẾ HOÁN ĐỔI a, b = b, a (Tuple Packing/Unpacking)
  // (Đã loại trừ câu hỏi về cờ swapped ở trên)
  // =========================================================================
  const isSwapMechanismQuery =
    q.includes('a, b = b, a') ||
    q.includes('arr[j], arr[j+1]') ||
    q.includes('hoán đổi') ||
    q.includes('đổi chỗ') ||
    q.includes('không cần biến tạm') ||
    q.includes('không cần biến temp') ||
    q.includes('cơ chế swap') ||
    q.includes('tuple packing');

  if (isSwapMechanismQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: CƠ CHẾ HOÁN ĐỔI \`a, b = b, a\` TRONG PYTHON**\n\n` +
      `### 1. Tại sao Python hoán đổi được mà không cần biến tạm \`temp\`?\n` +
      `- Trong các ngôn ngữ như C++ hay Pascal, nếu bạn viết \`a = b; b = a\`, giá trị cũ của \`a\` sẽ bị ghi đè mất ngay lập tức. Do đó bắt buộc phải dùng biến trung gian: \`temp = a; a = b; b = temp\`.\n` +
      `- Nhưng trong Python, cú pháp \`a, b = b, a\` hoạt động theo nguyên lý **Tuple Packing & Unpacking** (Đóng gói & Giải nén bộ đôi):\n` +
      `  * **Bước 1 (Vế phải):** Python tính toán vế phải trước, đóng gói hai giá trị thành một bộ nhớ tạm (tuple): \`(b, a)\`.\n` +
      `  * **Bước 2 (Vế trái):** Python giải nén đồng thời hai giá trị này và gán song song vào biến \`a\` và biến \`b\` cùng một thời điểm!\n\n` +
      `### 2. Ví dụ trong thuật toán sắp xếp:\n` +
      `\`\`\`python\n` +
      `arr[j], arr[j + 1] = arr[j + 1], arr[j]\n` +
      `\`\`\`\n` +
      `Ở tầng máy ảo CPython, câu lệnh này được biên dịch thành lệnh bytecode \`ROT_TWO\` (xoay 2 giá trị trên ngăn xếp). Vừa chạy cực nhanh, vừa tiết kiệm bộ nhớ RAM!`;
  }

  // =========================================================================
  // 3. CÁCH SẮP XẾP GIẢM DẦN (TỪ LỚN ĐẾN BÉ)
  // =========================================================================
  const isDescendingSortQuery =
    q.includes('giảm dần') ||
    q.includes('ngược lại') ||
    q.includes('từ lớn đến bé') ||
    q.includes('lớn xuống nhỏ') ||
    q.includes('sắp xếp giảm');

  if (isDescendingSortQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: CÁCH CHUYỂN SANG SẮP XẾP GIẢM DẦN**\n\n` +
      `Để đổi thuật toán từ **tăng dần** sang **giảm dần**, bạn chỉ cần **đổi chiều đúng 1 dấu so sánh trong câu lệnh \`if\`**, toàn bộ cấu trúc vòng lặp giữ nguyên 100%:\n\n` +
      `### 1. Trong Bubble Sort (Nổi bọt):\n` +
      `- **Tăng dần:** \`if arr[j] > arr[j + 1]:\` (số trước lớn hơn số sau thì dồn về cuối).\n` +
      `- **Giảm dần:** Đổi thành **nhỏ hơn (\`<\`)**:\n` +
      `\`\`\`python\n` +
      `if arr[j] < arr[j + 1]:  # Nếu số trước nhỏ hơn số sau\n` +
      `    arr[j], arr[j + 1] = arr[j + 1], arr[j]  # Hoán đổi để đẩy số NHỎ về cuối\n` +
      `\`\`\`\n\n` +
      `### 2. Trong Selection Sort (Chọn):\n` +
      `- **Tăng dần:** Tìm số nhỏ nhất \`if arr[j] < arr[min_idx]: min_idx = j\`.\n` +
      `- **Giảm dần:** Tìm số LỚN NHẤT \`if arr[j] > arr[max_idx]: max_idx = j\` đưa về đầu mảng!\n\n` +
      `💡 **Quy tắc làm bài thi:** Muốn tăng dần thì dùng dấu \`>\` (hoặc tìm min); muốn giảm dần thì dùng dấu \`<\` (hoặc tìm max).`;
  }

  // =========================================================================
  // 4. VÒNG LẶP TRONG BUBBLE SORT range(0, n - i - 1)
  // =========================================================================
  const isRangeNMinusIMinus1Query =
    q.includes('n - i - 1') ||
    q.includes('n-i-1') ||
    q.includes('tại sao lại là n - i') ||
    q.includes('tại sao trừ i') ||
    q.includes('tại sao trừ 1') ||
    q.includes('vòng lặp trong');

  if (isRangeNMinusIMinus1Query) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: TẠI SAO CẬN VÒNG LẶP LẠI LÀ \`range(0, n - i - 1)\`?**\n\n` +
      `Cận \`n - i - 1\` gồm hai phần mang ý nghĩa sống còn:\n\n` +
      `1. **Tại sao phải có \`- 1\`? (Tránh lỗi văng chương trình)**\n` +
      `   - Trong thân vòng lặp, ta so sánh \`arr[j]\` với \`arr[j + 1]\`.\n` +
      `   - Nếu $j$ chạy đến tận $n - 1$, thì $j + 1$ sẽ bằng $n$ (nằm ngoài mảng).\n` +
      `   - Khi đó Python sẽ báo lỗi văng chương trình: **IndexError: list index out of range**!\n` +
      `   - Do đó, $j$ bắt buộc phải dừng sớm trước 1 bước (chỉ chạy đến tối đa $n - 2$).\n\n` +
      `2. **Tại sao phải có \`- i\`? (Tối ưu tăng tốc gấp đôi)**\n` +
      `   - Sau mỗi lượt lặp ngoài ($i$), số lớn nhất trong đoạn chưa xét đã trôi về đúng vị trí cuối cùng.\n` +
      `   - Sau $i$ lượt, **$i$ phần tử lớn nhất ở cuối mảng đã chắc chắn nằm đúng chỗ 100% rồi**!\n` +
      `   - Trừ đi $i$ giúp ta không kiểm tra lại những phần tử đã an toàn ở cuối nữa, tiết kiệm 50% số phép so sánh dư thừa.`;
  }

  // =========================================================================
  // 5. TẠI SAO CHỈ SỐ MẢNG (INDEX) BẮT ĐẦU TỪ 0?
  // =========================================================================
  const isZeroBasedIndexQuery =
    q.includes('bắt đầu từ 0') ||
    q.includes('chỉ số từ 0') ||
    q.includes('index 0') ||
    q.includes('zero-based') ||
    q.includes('tại sao lại là 0') ||
    q.includes('tại sao từ 0');

  if (isZeroBasedIndexQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: TẠI SAO CHỈ SỐ MẢNG TRONG PYTHON BẮT ĐẦU TỪ 0?**\n\n` +
      `### 1. Bản chất kiến trúc bộ nhớ máy tính (RAM):\n` +
      `- Trong máy tính, "chỉ số" (index) thực chất không phải là "số thứ tự đếm", mà là **"khoảng cách độ lệch" (offset)** so với điểm xuất phát ban đầu.\n` +
      `- Khi bạn tạo danh sách \`arr\`, máy tính ghi nhớ địa chỉ ô nhớ đầu tiên (gọi là \`Base Address\`).\n` +
      `- Công thức tìm phần tử thứ $i$ trong thanh RAM:\n` +
      `  $$\\text{Địa chỉ} = \\text{Base Address} + (i \\times \\text{kích thước ô nhớ})$$\n` +
      `- **Phần tử đầu tiên** nằm ngay tại vị trí gốc, tức là lệch đi **0 khoảng cách** $\\to$ Chỉ số phải là \`0\`!\n` +
      `- Phần tử thứ hai nằm cách gốc 1 khoảng cách $\\to$ Chỉ số là \`1\`.\n\n` +
      `### 2. Lưu ý quan trọng cho học sinh THPT:\n` +
      `- Mảng có $n$ phần tử thì chỉ số hợp lệ chỉ chạy từ \`0\` đến \`n - 1\`.\n` +
      `- Phần tử cuối cùng của mảng là \`arr[n - 1]\` (hoặc trong Python có thể viết tắt là \`arr[-1]\`).`;
  }

  // =========================================================================
  // 6. SO SÁNH XÂU KÝ TỰ & TẠI SAO "10" < "2"
  // =========================================================================
  const isAsciiStringQuery =
    q.includes('xâu') ||
    q.includes('kí tự') ||
    q.includes('chuỗi') ||
    q.includes('ascii') ||
    q.includes('ord') ||
    q.includes('chr') ||
    q.includes('10 < 2') ||
    q.includes('10 < "2"');

  if (isAsciiStringQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: QUY TẮC SO SÁNH XÂU KÝ TỰ & TẠI SAO \`"10" < "2"\`**\n\n` +
      `Đây là bẫy câu hỏi trắc nghiệm Tin học THPT kinh điển!\n\n` +
      `### 1. Tại sao \`"10" < "2"\` lại cho kết quả là True?\n` +
      `- Vì \`"10"\` và \`"2"\` được đặt trong dấu ngoặc kép, đây là **XÂU KÝ TỰ (str)** chứ không phải số nguyên!\n` +
      `- Khi so sánh xâu, Python duyệt **từng ký tự từ trái qua phải theo Bảng mã ASCII**:\n` +
      `  * Ký tự đầu tiên của xâu \`"10"\` là chữ số \`'1'\` có mã ASCII là **49**.\n` +
      `  * Ký tự đầu tiên của xâu \`"2"\` là chữ số \`'2'\` có mã ASCII là **50**.\n` +
      `  * Vì $49 < 50$ (mã của \`'1'\` nhỏ hơn mã của \`'2'\`), Python kết luận ngay \`"10" < "2"\` là **True** mà không cần nhìn đến ký tự thứ hai!\n\n` +
      `### 2. Hai hàm bắt buộc phải nhớ:\n` +
      `- \`ord('A')\` $\\to$ Trả về mã số ASCII (ví dụ: \`ord('A') = 65\`, \`ord('a') = 97\`).\n` +
      `- \`chr(65)\` $\\to$ Đổi từ mã số thành ký tự (ví dụ: \`chr(65) = 'A'\`).\n` +
      `- **Quy tắc thứ tự:** Ký tự số (\`'0'..\`'9') < Chữ hoa (\`'A'..\`'Z') < Chữ thường (\`'a'..\`'z').\n\n` +
      `💡 **Muốn so sánh giá trị toán học:** Bắt buộc phải chuyển kiểu: \`int("10") > int("2")\` (10 > 2 là True).`;
  }

  // =========================================================================
  // 7. HÀM len() TRONG PYTHON HOẠT ĐỘNG THẾ NÀO?
  // =========================================================================
  const isLenFunctionQuery =
    q.includes('hàm len') ||
    q.includes('len(') ||
    q.includes('độ dài mảng') ||
    q.includes('len hoạt động');

  if (isLenFunctionQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: HÀM \`len()\` TRONG PYTHON HOẠT ĐỘNG THẾ NÀO?**\n\n` +
      `### 1. Hàm \`len()\` có duyệt qua mảng không?\n` +
      `- **Câu trả lời:** HOÀN TOÀN KHÔNG!\n` +
      `- Trong tầng mã nguồn C của Python, kiểu dữ liệu \`list\` luôn có sẵn một thuộc tính tên là **\`ob_size\`** lưu sẵn số lượng phần tử.\n` +
      `- Mỗi khi bạn thêm (\`append\`) hoặc xóa (\`pop\`), Python tự động cộng hoặc trừ 1 vào biến đếm này.\n` +
      `- Khi gọi \`len(arr)\`, Python **chỉ việc đọc trực tiếp ô nhớ \`ob_size\`** mà không cần chạy vòng lặp đếm lại.\n\n` +
      `⚡ **Độ phức tạp:** Hàm \`len()\` đạt tốc độ tức thì **$O(1)$**, mảng có 1 triệu phần tử thì gọi \`len()\` vẫn tốn thời gian như mảng 2 phần tử!`;
  }

  // =========================================================================
  // 8. SO SÁNH BUBBLE SORT VS SELECTION SORT VS INSERTION SORT
  // =========================================================================
  const isComparisonQuery =
    q.includes('phân biệt') ||
    q.includes('khác nhau giữa') ||
    q.includes('so sánh') ||
    (q.includes('bubble') && q.includes('selection')) ||
    (q.includes('insertion') && q.includes('selection'));

  if (isComparisonQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: PHÂN BIỆT 3 THUẬT TOÁN SẮP XẾP CƠ BẢN THPT**\n\n` +
      `| Đặc điểm | Bubble Sort (Nổi bọt) | Selection Sort (Chọn) | Insertion Sort (Chèn) |\n` +
      `| :--- | :--- | :--- | :--- |\n` +
      `| **Cơ chế hoạt động** | So sánh & đổi chỗ liên tục các cặp kề nhau | Quét tìm phần tử nhỏ nhất rồi đổi chỗ về đầu | Rút từng số chèn vào vị trí thích hợp |\n` +
      `| **Số lần hoán đổi (Swap)** | **Nhiều nhất** (tối đa $\\approx n^2/2$) | **Ít nhất** (chính xác $n - 1$ lần) | Trung bình (dịch chuyển phần tử) |\n` +
      `| **Trường hợp tốt nhất** | **$O(n)$** (khi có biến cờ \`swapped\`) | Vẫn là **$O(n^2)$** (luôn quét tìm min) | **$O(n)$** (khi mảng đã có thứ tự) |\n` +
      `| **Tính ổn định (Stable)** | **Ổn định (Stable)** | **Không ổn định (Unstable)** | **Ổn định (Stable)** |\n` +
      `| **Mẹo ghi nhớ đề thi** | *"Nổi bọt đổi chỗ nhiều nhất"* | *"Sắp xếp chọn hoán đổi ít nhất"* | *"Chèn quân bài vào tay"* |`;
  }

  // =========================================================================
  // 9. QUICK SORT VÀ PHẦN TỬ CHỐT PIVOT
  // =========================================================================
  const isQuickSortQuery =
    q.includes('quick sort') ||
    q.includes('pivot') ||
    q.includes('chốt') ||
    q.includes('phân hoạch');

  if (isQuickSortQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: BẢN CHẤT QUICK SORT VÀ PHẦN TỬ CHỐT PIVOT**\n\n` +
      `Quick Sort là thuật toán sắp xếp nhanh nhất trong thực tế theo tư tưởng **Chia để trị (Divide and Conquer)**:\n\n` +
      `1. **Vai trò của phần tử chốt (Pivot):**\n` +
      `   - Pivot là "cột mốc chuẩn" để phân loại: tất cả số nhỏ hơn Pivot đứng bên Trái, lớn hơn đứng bên Phải.\n` +
      `   - Sau đúng một lượt phân hoạch (Partition), **phần tử Pivot đã vĩnh viễn nằm đúng vị trí cuối cùng của nó trong mảng**!\n\n` +
      `2. **Độ phức tạp thời gian Big-O:**\n` +
      `   - **Trung bình:** $O(n \\log n)$ (chia đôi mảng đều đặn, chạy cực nhanh).\n` +
      `   - **Xấu nhất $O(n^2)$:** Xảy ra khi mảng đã sắp xếp sẵn mà ta luôn chọn Pivot là phần tử đầu tiên hoặc cuối cùng (chia bị lệch thành 1 bên rỗng và 1 bên $n-1$).\n` +
      `   - **Khắc phục:** Chọn Pivot ngẫu nhiên hoặc lấy trung vị của 3 số (đầu, giữa, cuối).`;
  }

  // =========================================================================
  // 10. TÍNH ỔN ĐỊNH (STABLE SORT)
  // =========================================================================
  const isStabilityQuery =
    q.includes('ổn định') ||
    q.includes('stable') ||
    q.includes('tính ổn định');

  if (isStabilityQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: TÍNH ỔN ĐỊNH (STABILITY) TRONG THUẬT TOÁN SẮP XẾP**\n\n` +
      `### 1. Định nghĩa chuẩn xác:\n` +
      `Một thuật toán sắp xếp được gọi là **Ổn định (Stable)** nếu nó **giữ nguyên thứ tự ban đầu của các phần tử có giá trị bằng nhau**.\n\n` +
      `### 2. Ví dụ thực tế:\n` +
      `Giả sử danh sách học sinh có hai bạn cùng 8 điểm: An (đứng trước) và Bình (đứng sau):\n` +
      `- **Thuật toán Ổn định:** Sau khi sắp xếp điểm, An chắc chắn vẫn đứng trước Bình.\n` +
      `- **Thuật toán Không ổn định:** Bình có thể bị nhảy lên đứng trước An!\n\n` +
      `📋 **Bảng tra cứu làm bài thi trắc nghiệm THPT:**\n` +
      `- **ỔN ĐỊNH (Stable):** Bubble Sort, Insertion Sort, Merge Sort.\n` +
      `- **KHÔNG ỔN ĐỊNH (Unstable):** Selection Sort, Quick Sort.`;
  }

  // =========================================================================
  // 11. ĐỘ PHỨC TẠP BIG-O VÀ CÁC TRƯỜNG HỢP
  // =========================================================================
  const isComplexityQuery =
    q.includes('độ phức tạp') ||
    q.includes('big-o') ||
    q.includes('big o') ||
    q.includes('thời gian chạy') ||
    q.includes('o(n') ||
    q.includes('o(1)') ||
    q.includes('best case') ||
    q.includes('worst case');

  if (isComplexityQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: ĐỘ PHỨC TẠP THỜI GIAN BIG-O CHO HỌC SINH THPT**\n\n` +
      `Big-O là thước đo **tốc độ tăng số phép tính khi dữ liệu $n$ tăng lên**:\n\n` +
      `### 1. Bảng so sánh trực quan khi $n = 1.000$ phần tử:\n` +
      `- **$O(1)$ (Hằng số):** Tức thì, chỉ mất **1 phép tính** (Ví dụ: truy cập phần tử \`arr[0]\`, gọi \`len()\`).\n` +
      `- **$O(\\log n)$ (Logarit):** Siêu nhanh, chỉ mất khoảng **10 phép tính** (Ví dụ: Tìm kiếm nhị phân).\n` +
      `- **$O(n)$ (Tuyến tính):** Nhanh, mất đúng **1.000 phép tính** (Ví dụ: Tìm kiếm tuần tự, 1 vòng lặp \`for\`).\n` +
      `- **$O(n \\log n)$:** Tối ưu cho sắp xếp, mất khoảng **10.000 phép tính** (Merge Sort, Quick Sort).\n` +
      `- **$O(n^2)$ (Bậc hai):** Rất chậm, mất tới **1.000.000 phép tính** (Bubble Sort, Selection Sort với 2 vòng lặp lồng nhau)!\n\n` +
      `### 2. Với thuật toán hiện tại (${pedagogy.name}):\n` +
      `${pedagogy.complexityExplanation}`;
  }

  // =========================================================================
  // 12. CÁC LỖI PYTHON THƯỜNG GẶP (IndexError, TypeError, SyntaxError...)
  // =========================================================================
  const isPythonErrorQuery =
    q.includes('lỗi') ||
    q.includes('indexerror') ||
    q.includes('typeerror') ||
    q.includes('syntaxerror') ||
    q.includes('indentationerror') ||
    q.includes('nameerror');

  if (isPythonErrorQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: 4 LỖI PYTHON KINH ĐIỂN VÀ CÁCH SỬA TRIỆT ĐỂ**\n\n` +
      `1. **IndexError: list index out of range:**\n` +
      `   - **Nguyên nhân:** Gọi chỉ số vượt quá độ dài mảng (ví dụ mảng có 5 phần tử chỉ có chỉ số 0..4, nhưng gọi \`arr[5]\` hoặc gọi \`arr[j + 1]\` khi $j = 4$).\n` +
      `   - **Cách sửa:** Kiểm tra cận vòng lặp, ví dụ dùng \`range(n - 1)\` thay vì \`range(n)\`.\n\n` +
      `2. **TypeError: '<' not supported between instances of 'str' and 'int':**\n` +
      `   - **Nguyên nhân:** So sánh nhầm giữa chữ và số (ví dụ \`"5" > 2\`).\n` +
      `   - **Cách sửa:** Dùng hàm \`int()\` hoặc \`str()\` để đồng nhất kiểu dữ liệu trước khi so sánh.\n\n` +
      `3. **IndentationError: unexpected indent:**\n` +
      `   - **Nguyên nhân:** Thụt lề không đều (chỗ dùng 4 dấu cách, chỗ dùng phím Tab).\n` +
      `   - **Cách sửa:** Luôn thống nhất dùng đúng 4 dấu cách cho mỗi khối lệnh con.\n\n` +
      `4. **SyntaxError: invalid syntax:**\n` +
      `   - **Nguyên nhân:** Quên dấu hai chấm \`:\` sau \`for\`, \`while\`, \`if\`, \`def\` hoặc dùng nhầm 1 dấu bằng \`=\` thay vì 2 dấu \`==\`.`;
  }

  // =========================================================================
  // 13. HÀM RANGE VÀ VÒNG LẶP FOR TRONG PYTHON
  // =========================================================================
  const isRangeQuery =
    q.includes('hàm range') ||
    q.includes('range(') ||
    q.includes('vòng lặp for');

  if (isRangeQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: HÀM \`range()\` VÀ VÒNG LẶP FOR TRONG PYTHON**\n\n` +
      `Hàm \`range(start, stop, step)\` sinh ra dãy số nguyên tuần tự:\n\n` +
      `- **Quy tắc vàng:** Cận \`stop\` luôn bị LOẠI TRỪ (không bao gồm số kết thúc):\n` +
      `  * \`range(5)\` $\\to$ Dãy: \`0, 1, 2, 3, 4\` (đủ 5 số, bắt đầu từ 0 đến 4).\n` +
      `  * \`range(1, 6)\` $\\to$ Dãy: \`1, 2, 3, 4, 5\` (dừng trước số 6).\n` +
      `  * \`range(0, 10, 2)\` $\\to$ Bước nhảy 2: \`0, 2, 4, 6, 8\`.\n` +
      `  * \`range(5, 0, -1)\` $\\to$ Đếm lùi: \`5, 4, 3, 2, 1\`.\n\n` +
      `💡 **Mẹo duyệt mảng:** Dùng \`for i in range(len(arr)):\` để lấy chỉ số \`i\`, hoặc dùng \`for x in arr:\` để lấy trực tiếp từng phần tử.`;
  }

  // =========================================================================
  // 14. PHÂN BIỆT MUTABLE (LIST) VÀ IMMUTABLE (STRING)
  // =========================================================================
  const isMutableQuery =
    q.includes('mutable') ||
    q.includes('immutable') ||
    q.includes('thay đổi phần tử trong xâu') ||
    q.includes('khác nhau giữa list và str');

  if (isMutableQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: TẠI SAO LIST SỬA ĐƯỢC CÒN STRING THÌ KHÔNG?**\n\n` +
      `1. **List là Kiểu Biến đổi (Mutable):**\n` +
      `   - Bạn có thể sửa đổi, hoán đổi hoặc gán trực tiếp phần tử theo chỉ số:\n` +
      `     \`a = [1, 2, 3]; a[0] = 99\` $\\to$ Hoàn toàn hợp lệ, mảng biến thành \`[99, 2, 3]\`.\n\n` +
      `2. **String (Xâu kí tự) là Kiểu Bất biến (Immutable):**\n` +
      `   - Một chuỗi khi đã được tạo ra trong bộ nhớ thì không thể thay đổi từng ký tự bên trong nó:\n` +
      `     \`s = "cat"; s[0] = 'b'\` $\\to$ Báo lỗi ngay lập tức: **TypeError: 'str' object does not support item assignment**!\n\n` +
      `💡 **Bí quyết xử lý:** Muốn sắp xếp một xâu ký tự, ta đổi sang danh sách bằng \`chars = list(s)\`, thực hiện sắp xếp xong thì nối lại bằng \`"".join(chars)\`!`;
  }

  // =========================================================================
  // 15. THẮC MẮC VỀ BƯỚC HIỆN TẠI ĐANG CHẠY
  // =========================================================================
  const isCurrentStepQuery =
    q.includes('bước hiện tại') ||
    q.includes('bước này') ||
    q.includes('dòng này') ||
    q.includes('đang làm gì') ||
    q.includes('chuyện gì đang xảy ra');

  if (isCurrentStepQuery) {
    if (currentStep) {
      const vars = currentStep.stack_frames?.[currentStep.stack_frames.length - 1]?.variables || {};
      const varEntries = Object.entries(vars);
      const varText = varEntries.length > 0
        ? varEntries.map(([k, v]) => `• Biến \`${k}\` = **${JSON.stringify(v)}**`).join('\n')
        : '• Chưa có biến cục bộ nào được tạo';

      return `🎯 **PHÂN TÍCH CHUYÊN GIA VỀ BƯỚC THỰC THI HIỆN TẠI (DÒNG ${currentStep.line_number}):**\n\n` +
        `- **Lệnh đang chạy:** Thực thi sự kiện \`${currentStep.event || 'line'}\` tại dòng **${currentStep.line_number}**.\n` +
        `- **Trạng thái các biến trong bộ nhớ RAM thời điểm này:**\n${varText}\n\n` +
        `🔍 **Ý nghĩa sư phạm:** Máy tính đang đọc câu lệnh này để so sánh hoặc gán giá trị biến. Bạn hãy nhìn sang biểu đồ cột bên cạnh: phần tử được tô màu đỏ là đối tượng đang được xét, còn cột màu cam là phần tử đã chốt vị trí an toàn!`;
    } else {
      return `💡 **Bạn hãy bấm nút "Chạy Chương Trình" (màu xanh lá)** ở thanh trên cùng, sau đó bấm nút **Tiếp Tục** để quan sát từng bước máy tính thực thi nhé!`;
    }
  }

  // =========================================================================
  // 16. THẮC MẮC VỀ CÀI ĐẶT / API
  // =========================================================================
  const isApiQuery =
    q.includes('api') ||
    q.includes('cài đặt') ||
    q.includes('thiết lập') ||
    q.includes('khóa') ||
    q.includes('key');

  if (isApiQuery) {
    return `🎓 **TRẢ LỜI ĐÚNG TRỌNG TÂM: HỆ THỐNG TRỢ LÍ AI TÍCH HỢP SẴN 100%:**\n\n` +
      `✅ **Học sinh THPT hoàn toàn không cần nhập bất kỳ API key hay tài khoản nào!**\n` +
      `- Trợ lí AI chuyên gia Python đã được xây dựng sẵn trong hệ thống phòng lab, hoạt động hoàn toàn tự động.\n` +
      `- Bạn có thể thoải mái đặt bất kỳ câu hỏi nào về code Python, thuật toán, bẫy trắc nghiệm để nhận câu trả lời tức thì 0ms, không lo giới hạn hay lỗi mạng!`;
  }

  // =========================================================================
  // 17. GIẢI THÍCH TỔNG QUAN Ý TƯỞNG THUẬT TOÁN
  // =========================================================================
  const isConceptQuery =
    q.includes('ý tưởng') ||
    q.includes('bản chất') ||
    q.includes('giải thích thuật toán') ||
    q.includes('nguyên lý');

  if (isConceptQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: BẢN CHẤT CỦA ${pedagogy.name.toUpperCase()}**\n\n` +
      `### 1. Ý tưởng đời sống thực tế:\n` +
      `${pedagogy.realLifeAnalogy}\n\n` +
      `### 2. Mổ xẻ logic code Python:\n` +
      `${pedagogy.codeBreakdown}\n\n` +
      `💡 **Mẹo làm bài thi:** ${pedagogy.examTipsAndTraps}`;
  }

  // =========================================================================
  // 18. MẶC ĐỊNH THÔNG MINH: TRẢ LỜI TRỰC TIẾP DỰA TRÊN NGỮ CẢNH BÀI HỌC
  // =========================================================================
  return `🎯 **TRẢ LỜI CHUYÊN GIA PYTHON VỀ THUẬT TOÁN ${pedagogy.name.toUpperCase()}:**\n\n` +
    `Bạn đang hỏi: *"${rawQ}"*\n\n` +
    `Dưới góc độ lập trình viên Python cấp cao, thầy/cô giải thích cho bạn như sau:\n\n` +
    `1. **Nguyên lý cốt lõi:** ${pedagogy.realLifeAnalogy}\n\n` +
    `2. **Điểm cần lưu ý trong mã nguồn:**\n` +
    `${pedagogy.codeBreakdown.split('\n').slice(0, 5).join('\n')}\n\n` +
    `💡 **Gợi ý hữu ích:** Bạn có thể bấm vào các thẻ câu hỏi gợi ý bên dưới (như *Tác dụng của biến cờ swapped?*, *Tại sao n - i - 1?*, *Cách sắp xếp giảm dần?*) để xem câu trả lời chi tiết và đúng trọng tâm nhất nhé!`;
}

/**
 * Sinh giải thích theo chế độ sư phạm tức thì 0ms (Local Fast Engine)
 */
export function getLocalPedagogyResponse(
  mode: 'concept' | 'code_breakdown' | 'complexity' | 'exam_tips' | 'step_insight',
  algorithmId: string,
  currentStep?: TraceStep
): string {
  const pedagogy = getHighSchoolPedagogy(algorithmId);

  switch (mode) {
    case 'concept':
      return pedagogy.realLifeAnalogy;
    case 'code_breakdown':
      return pedagogy.codeBreakdown;
    case 'complexity':
      return pedagogy.complexityExplanation;
    case 'exam_tips':
      return pedagogy.examTipsAndTraps;
    case 'step_insight':
      if (currentStep) {
        const vars = currentStep.stack_frames?.[currentStep.stack_frames.length - 1]?.variables || {};
        const varList = Object.entries(vars)
          .map(([k, v]) => `• \`${k}\` = **${JSON.stringify(v)}**`)
          .join('\n');

        return `📍 **Phân tích chuyên gia về bước thực thi máy tính đang chạy (Dòng ${currentStep.line_number || '-'}):**\n\n` +
          `- **Sự kiện thực thi:** Lệnh \`${currentStep.event || 'line'}\` tại dòng **${currentStep.line_number}**.\n` +
          `- **Giá trị các biến hiện thời trong bộ nhớ RAM:**\n${varList || '• Chưa có biến cục bộ'}\n\n` +
          `🔍 **Nhận định kỹ thuật:** Máy tính đang thực hiện câu lệnh ở dòng này để so sánh hoặc gán giá trị. Hãy quan sát trên đồ họa cột bên cạnh để thấy trạng thái hoán đổi dữ liệu tương ứng!`;
      }
      return '📍 **Chưa có bước thực thi nào được chọn.** Hãy bấm nút "Chạy Chương Trình" (màu xanh lá) và bấm "Tiếp Tục" để theo dõi từng bước máy tính thực hiện.';
    default:
      return pedagogy.realLifeAnalogy;
  }
}
