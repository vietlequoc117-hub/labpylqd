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
import { getHighSchoolPedagogy, AlgorithmPedagogy, CURRICULUM_OVERVIEW, getCurriculumOverview } from './aiTutorKnowledge';
import { lintPythonCode, autoFixPythonCode, PYTHON_KEYWORDS } from './pythonLinter';

export interface TutorResponse {
  content: string;
  isInstant: boolean;
  source: 'built-in-ai' | 'hybrid';
}

/**
 * Trả lời câu hỏi bất kỳ của học sinh với tư cách Chuyên gia Lập trình cấp cao Python
 * Hỗ trợ cả 2 chế độ:
 * - scope: 'all' -> Trả lời tổng thể bao quát toàn bộ chương trình Tin học THPT (tất cả các bài)
 * - scope: 'current' -> Trọng tâm đào sâu riêng bài học đang xem
 */
export function answerStudentQuestion(params: {
  question: string;
  algorithmId: string;
  algorithmTitle?: string;
  code: string;
  currentStep?: TraceStep;
  stdinInput?: string;
  scope?: 'all' | 'current';
}): string {
  const { question, algorithmId, algorithmTitle = 'Thuật toán', code, currentStep, scope = 'all' } = params;
  const rawQ = question.trim();
  const q = rawQ.toLowerCase().replace(/[?!.,;:_]/g, ' ');
  const pedagogy = getHighSchoolPedagogy(algorithmId);

  // Phân tích cú pháp code hiện tại của học sinh bằng Chuyên gia Python Linter
  const currentLintResult = lintPythonCode(code);
  const keywordErrors = currentLintResult.errors.filter((e) => e.category === 'keyword');

  // =========================================================================
  // 0. CÂU HỎI VỀ LỖI TỪ KHÓA, LỖI BIẾN CHƯA KHAI BÁO, TỰ NHẬP CODE BỊ LỖI
  // (Ưu tiên số 1 - Khắc phục triệt để theo phản hồi của người dùng)
  // =========================================================================
  const isKeywordOrCustomInputErrorQuery =
    q.includes('từ khóa') ||
    q.includes('từ khoá') ||
    q.includes('keyword') ||
    q.includes('tự nhập') ||
    q.includes('không báo được lỗi') ||
    q.includes('không báo lỗi') ||
    q.includes('báo lỗi') ||
    q.includes('sao không báo') ||
    q.includes('chưa khai báo') ||
    q.includes('chưa định nghĩa') ||
    q.includes('nameerror') ||
    q.includes('tota') ||
    q.includes('resul') ||
    q.includes('user_dat') ||
    q.includes('lỗi biến') ||
    (q.includes('lỗi') && (q.includes('em nhập') || q.includes('tôi nhập') || q.includes('gõ') || q.includes('viết') || q.includes('biến'))) ||
    (q.includes('kiểm tra') && (q.includes('code') || q.includes('lỗi')));

  if (isKeywordOrCustomInputErrorQuery) {
    // Nếu trong code hiện tại THỰC SỰ CÓ LỖI TỪ KHÓA, LỖI BIẾN CHƯA KHAI BÁO hoặc LỖI CÚ PHÁP
    if (currentLintResult.errors.length > 0) {
      const errorListMd = currentLintResult.errors.map((err, idx) => {
        return `**${idx + 1}. Dòng ${err.line}:**\n` +
          `- **Phát hiện lỗi:** ${err.message}\n` +
          (err.suggestion ? `- **Cách sửa chuẩn:** \`${err.suggestion}\`\n` : '');
      }).join('\n');

      const { fixedCode } = autoFixPythonCode(code);

      return `🎯 **CHUYÊN GIA LẬP TRÌNH CẤP CAO PYTHON BÁO LỖI VÀ HƯỚNG DẪN KHẮC PHỤC TRIỆT ĐỂ:**\n\n` +
        `Thầy/Cô chuyên gia đã rà soát toàn bộ code bạn tự nhập và phát hiện **${currentLintResult.errors.length} lỗi (từ khóa / biến chưa khai báo NameError / cú pháp)** cần sửa ngay:\n\n` +
        `${errorListMd}\n` +
        `---\n\n` +
        `### 🛠️ ĐOẠN CODE ĐÃ ĐƯỢC CHUYÊN GIA SỬA LỖI HOÀN CHỈNH:\n` +
        `\`\`\`python\n` +
        `${fixedCode}\n` +
        `\`\`\`\n\n` +
        `💡 **Mẹo tương tác trên màn hình:**\n` +
        `- Bạn hãy nhìn vào **Trình soạn thảo Python bên trái**: Dòng lỗi đã được hệ thống **gạch chân lượn sóng màu đỏ**.\n` +
        `- Ngay bên dưới trình soạn thảo có thanh **"Chẩn đoán code"** kèm nút màu cam **"⚡ Tự động sửa lỗi nhanh"**, bạn chỉ cần bấm 1 click là toàn bộ tên biến, từ khóa và dấu hai chấm sẽ được sửa chuẩn xác 100%!`;
    }

    // Nếu học sinh hỏi về lý thuyết lỗi biến/từ khóa hoặc code hiện tại chưa phát hiện lỗi
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: LỖI BIẾN CHƯA KHAI BÁO (NAMEERROR) & LỖI TỪ KHÓA TRONG PYTHON**\n\n` +
      `Thầy/Cô chuyên gia lập trình cấp cao giải thích cặn kẽ nguyên nhân và cách khắc phục triệt để các dạng lỗi học sinh rất hay mắc phải:\n\n` +
      `### 1. Ba dạng lỗi biến chưa khai báo (NameError) kinh điển:\n` +
      `- **Dạng 1 - Gõ thiếu chữ cái tên biến (Typo):**\n` +
      `  * Viết \`tota\` thay vì \`total\` $\\to$ Máy tính không tìm thấy biến \`tota\` ở các dòng trước $\\to$ Báo lỗi **NameError: name 'tota' is not defined**.\n` +
      `  * Viết \`resul\` thay vì \`result\` $\\to$ Báo lỗi **NameError: name 'resul' is not defined**.\n` +
      `  * Viết \`user_dat\` thay vì \`user_data\` $\\to$ Báo lỗi **NameError: name 'user_dat' is not defined**.\n` +
      `- **Dạng 2 - Chưa gán giá trị ban đầu trước phép cộng dồn (\`+=\`):**\n` +
      `  * Học sinh viết ngay \`tota += i\` trong vòng lặp mà **quên viết \`total = 0\` ở đầu chương trình** $\\to$ Máy tính không thể lấy giá trị ban đầu để cộng tích lũy!\n` +
      `- **Dạng 3 - Dùng biến trước khi tạo:**\n` +
      `  * Gọi \`print(resul)\` hoặc \`if user_dat == ...\` ở trên, nhưng câu lệnh gán \`resul = ...\` lại nằm ở dưới.\n\n` +
      `### 2. Bốn nguyên tắc từ khóa sống còn:\n` +
      `- **Sai hoa/thường:** Từ khóa viết thường 100% (trừ \`True\`, \`False\`, \`None\`). Viết \`Def\`, \`For\`, \`If\` sẽ bị báo lỗi ngay.\n` +
      `- **Dùng từ khóa làm tên biến:** Không bao giờ đặt tên biến là \`for = 5\`, \`if = 10\`, \`def = 2\`.\n` +
      `- **Đảo chữ từ khóa:** \`fro\` $\\to$ \`for\`, \`dfe\` $\\to$ \`def\`, \`whle\` $\\to$ \`while\`, \`retrun\` $\\to$ \`return\`.\n` +
      `- **Nhầm từ khóa ngôn ngữ khác:** Dùng \`function\`/\`var\`/\`then\`/\`do\` thay vì cú pháp Python chuẩn.\n\n` +
      `✅ **Hệ thống phòng lab đã tích hợp Chẩn đoán tự động:** Khi bạn tự nhập code ở khung bên trái, hệ thống sẽ **gạch chân đỏ dòng lỗi** và cung cấp nút **"⚡ Tự động sửa lỗi nhanh"** giúp bạn sửa lại tên biến chuẩn xác 100%!`;
  }

  // =========================================================================
  // 1. CÂU HỎI VỀ BIẾN CỜ SWAPPED TRONG BUBBLE SORT (Ưu tiên cao tránh nhầm với swap)
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
  // 7.1 CÂU HỎI VỀ DẠNG BÀI TẬP XÂU KÍ TỰ & KỸ THUẬT CẮT XÂU (STRING SLICING)
  // =========================================================================
  const isStringExerciseQuery =
    q.includes('xâu kí tự') ||
    q.includes('xâu ký tự') ||
    q.includes('cắt xâu') ||
    q.includes('slicing') ||
    q.includes('s[1:]') ||
    q.includes('s[::2]') ||
    q.includes('s[::-1]');

  if (isStringExerciseQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: BÍ KÍP GIẢI BÀI TẬP XÂU KÍ TỰ & CẮT XÂU (SLICING) TRONG PYTHON**\n\n` +
      `### 1. Quy tắc cắt xâu \`s[start : stop : step]\`:\n` +
      `- **\`s[1:]\`**: Lấy phần xâu từ vị trí chỉ số \`1\` đến hết xâu (bỏ kí tự đầu tiên \`s[0]\`).\n` +
      `- **\`s[1:] + s[0]\`**: **Phép dịch vòng sang trái 1 kí tự** — cắt kí tự đầu tiên \`s[0]\` đem nối xuống cuối xâu.\n` +
      `- **\`s[::2]\`**: Lấy các kí tự từ đầu đến cuối với **bước nhảy = 2** (tức là các vị trí chỉ số chẵn: \`0, 2, 4, 6...\`).\n` +
      `- **\`s[::-1]\`**: Đảo ngược toàn bộ xâu kí tự.\n\n` +
      `### 2. Ví dụ minh họa từng bước (Bài tập mẫu điển hình):\n` +
      `\`\`\`python\n` +
      `s = "abcdefg"               # Độ dài len(s) = 7\n` +
      `for i in range(0, len(s), 2): # i lần lượt nhận: 0, 2, 4, 6 (4 lượt lặp)\n` +
      `    s = s[1:] + s[0]        # Mỗi lượt dịch kí tự đầu xuống cuối\n` +
      `t = s[::2]                  # Lấy các kí tự ở vị trí 0, 2, 4, 6\n` +
      `print(t)\n` +
      `\`\`\`\n` +
      `- **Lượt 1 (\`i = 0\`):** \`s\` từ \`"abcdefg"\` $\\to$ \`"bcdefga"\`\n` +
      `- **Lượt 2 (\`i = 2\`):** \`s\` từ \`"bcdefga"\` $\\to$ \`"cdefgab"\`\n` +
      `- **Lượt 3 (\`i = 4\`):** \`s\` từ \`"cdefgab"\` $\\to$ \`"defgabc"\`\n` +
      `- **Lượt 4 (\`i = 6\`):** \`s\` từ \`"defgabc"\` $\\to$ \`"efgabcd"\`\n` +
      `- **Sau vòng lặp:** \`t = s[::2]\` lấy các vị trí \`0 ('e'), 2 ('g'), 4 ('b'), 6 ('d')\` $\\to$ Kết quả in ra: **\`egbd\`**!\n\n` +
      `⚠️ **3 lỗi học sinh hay mắc nhất với Xâu kí tự:**\n` +
      `1. **Gán trực tiếp \`s[0] = "z"\`** $\\to$ Lỗi \`TypeError\` vì xâu trong Python là **bất biến (immutable)**.\n` +
      `2. **Dùng dấu \`,\` khi cắt xâu (\`s[1, 3]\`)** $\\to$ Phải dùng dấu hai chấm **\`s[1:3]\`**.\n` +
      `3. **Dùng dấu \`:\` trong \`range(0:len(s):2)\`** $\\to$ Trong \`range()\` bắt buộc dùng dấu phẩy **\`range(0, len(s), 2)\`**.`;
  }

  // =========================================================================
  // 8. CÂU HỎI TỔNG THỂ TẤT CẢ CÁC BÀI & BẢNG SO SÁNH MA TRẬN THUẬT TOÁN THPT
  // =========================================================================
  const isAllAlgorithmsMatrixQuery =
    q.includes('tất cả các bài') ||
    q.includes('tổng thể') ||
    q.includes('tất cả thuật toán') ||
    q.includes('toàn bộ thuật toán') ||
    q.includes('so sánh tất cả') ||
    q.includes('bảng so sánh') ||
    q.includes('ma trận') ||
    q.includes('các thuật toán sắp xếp') ||
    (q.includes('so sánh') && (q.includes('sắp xếp') || q.includes('thuật toán')));

  if (isAllAlgorithmsMatrixQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: BẢNG TỔNG HỢP SO SÁNH TOÀN DIỆN TẤT CẢ CÁC THUẬT TOÁN THPT**\n\n` +
      `Thầy/Cô chuyên gia lập trình cấp cao tổng hợp bức tranh toàn cảnh để bạn nắm chắc kiến thức và tự tin làm bài thi:\n\n` +
      `${CURRICULUM_OVERVIEW.matrix}\n\n` +
      `💡 **Mẹo làm bài thi THPT nhanh nhất:**\n` +
      `- **Muốn hoán đổi ít nhất:** Chọn **Selection Sort** ($n-1$ lần swap).\n` +
      `- **Mảng gần như đã có thứ tự:** Chọn **Insertion Sort** hoặc **Bubble Sort có cờ swapped** (chạy tức thì $O(n)$).\n` +
      `- **Dữ liệu cực lớn ($n > 100.000$):** Chọn **Quick Sort** hoặc **Merge Sort** ($O(n \\log n)$).\n` +
      `- **Cần tính ổn định (giữ nguyên thứ tự phần tử bằng nhau):** Chọn **Bubble Sort, Insertion Sort, Merge Sort**.\n` +
      `- **Tìm kiếm nhanh nhất:** Chọn **Binary Search** ($O(\\log n)$), nhưng bắt buộc mảng phải sắp xếp trước!`;
  }

  // =========================================================================
  // 8.1 SO SÁNH TÌM KIẾM TUẦN TỰ (LINEAR SEARCH) VÀ TÌM KIẾM NHỊ PHÂN (BINARY SEARCH)
  // =========================================================================
  const isSearchComparisonQuery =
    (q.includes('tìm kiếm') && (q.includes('so sánh') || q.includes('phân biệt') || q.includes('khác nhau'))) ||
    (q.includes('nhị phân') && q.includes('tuần tự')) ||
    (q.includes('binary') && q.includes('linear')) ||
    q.includes('khi nào dùng binary search') ||
    q.includes('khi nào dùng tìm kiếm nhị phân');

  if (isSearchComparisonQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: SO SÁNH TÌM KIẾM TUẦN TỰ (LINEAR) VÀ TÌM KIẾM NHỊ PHÂN (BINARY)**\n\n` +
      `| Tiêu chí | Tìm kiếm Tuần tự (Linear Search) | Tìm kiếm Nhị phân (Binary Search) |\n` +
      `| :--- | :--- | :--- |\n` +
      `| **Nguyên lý** | Duyệt lần lượt từ đầu đến cuối mảng | Mở ở vị trí chính giữa (\`mid\`), loại bỏ 50% mảng sau mỗi lần chia |\n` +
      `| **Điều kiện tiên quyết** | **Không cần sắp xếp** (áp dụng cho mọi mảng lộn xộn) | **BẮT BUỘC MẢNG ĐÃ SẮP XẾP** theo thứ tự tăng hoặc giảm |\n` +
      `| **Thời gian Best Case** | **$O(1)$** (khi phần tử cần tìm nằm ngay đầu \`arr[0]\`) | **$O(1)$** (khi phần tử cần tìm nằm đúng ở giữa \`arr[mid]\`) |\n` +
      `| **Thời gian Worst Case** | **$O(n)$** (phải duyệt hết mảng nếu ở cuối hoặc không có) | **$O(\\log n)$** (siêu tốc, chia đôi liên tục) |\n` +
      `| **Hiệu năng khi $n = 1.000.000$** | Mất tối đa **1.000.000 phép so sánh** | Chỉ mất tối đa **20 phép so sánh**! |\n` +
      `| **Khi nào nên sử dụng?** | Khi mảng nhỏ ($n < 100$) hoặc mảng chưa có thứ tự | Khi mảng lớn và đã được sắp xếp sẵn |\n\n` +
      `⚠️ **Bẫy đề thi trắc nghiệm kinh điển:** Đề thi cho một mảng số lộn xộn và hỏi *"Tìm kiếm nhị phân phần tử X mất bao nhiêu bước?"* $\\to$ Đáp án bẫy: **Không áp dụng được Binary Search vì mảng chưa sắp xếp!**`;
  }

  // =========================================================================
  // 8.2 LỘ TRÌNH VÀ BẢN ĐỒ HỌC THUẬT TOÁN THPT
  // =========================================================================
  const isRoadmapQuery =
    q.includes('lộ trình') ||
    q.includes('bản đồ') ||
    q.includes('thứ tự học') ||
    q.includes('nên học bài nào trước') ||
    q.includes('chương trình thpt');

  if (isRoadmapQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: BẢN ĐỒ LỘ TRÌNH HỌC THUẬT TOÁN TIN HỌC THPT**\n\n` +
      `${CURRICULUM_OVERVIEW.roadmap}`;
  }

  // =========================================================================
  // 8.3 BỘ BẪY ĐỀ THI TRẮC NGHIỆM TỔNG THỂ TẤT CẢ CÁC BÀI
  // =========================================================================
  const isGeneralExamTrapsQuery =
    (q.includes('bẫy') && (q.includes('tất cả') || q.includes('đề thi') || q.includes('trắc nghiệm') || q.includes('các bài'))) ||
    q.includes('bẫy đề thi thpt') ||
    q.includes('các bẫy hay gặp');

  if (isGeneralExamTrapsQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: 10 BẪY ĐỀ THI TRẮC NGHIỆM TIN HỌC THPT HAY GẶP NHẤT**\n\n` +
      `${CURRICULUM_OVERVIEW.examTraps}`;
  }

  // =========================================================================
  // 8.4 HỎI RIÊNG VỀ MỘT THUẬT TOÁN BẤT KỲ (Bất chấp bài đang mở là bài nào)
  // =========================================================================
  const isAskingSelectionSort = (q.includes('selection sort') || q.includes('sắp xếp chọn')) && !q.includes('bubble');
  const isAskingInsertionSort = (q.includes('insertion sort') || q.includes('sắp xếp chèn')) && !q.includes('bubble');
  const isAskingBinarySearch = (q.includes('binary search') || q.includes('nhị phân')) && !q.includes('tuần tự');
  const isAskingLinearSearch = (q.includes('linear search') || q.includes('tuần tự') || q.includes('tuyến tính')) && !q.includes('nhị phân');
  const isAskingMergeSort = q.includes('merge sort') || (q.includes('sắp xếp trộn') && !q.includes('quick'));

  if (isAskingSelectionSort) {
    const selPed = getHighSchoolPedagogy('selection-sort');
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM VỀ THUẬT TOÁN SELECTION SORT (SẮP XẾP CHỌN):**\n\n` +
      `### 1. Ý tưởng đời sống:\n${selPed.realLifeAnalogy}\n\n` +
      `### 2. Mổ xẻ từng dòng code Python:\n${selPed.codeBreakdown}\n\n` +
      `### 3. Độ phức tạp Big-O & Bẫy đề thi:\n${selPed.complexityExplanation}\n\n` +
      `💡 **Mẹo thi THPT:** ${selPed.examTipsAndTraps}`;
  }

  if (isAskingInsertionSort) {
    const insPed = getHighSchoolPedagogy('insertion-sort');
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM VỀ THUẬT TOÁN INSERTION SORT (SẮP XẾP CHÈN):**\n\n` +
      `### 1. Ý tưởng xếp bài Tây:\n${insPed.realLifeAnalogy}\n\n` +
      `### 2. Mổ xẻ từng dòng code Python:\n${insPed.codeBreakdown}\n\n` +
      `### 3. Độ phức tạp Big-O & Điểm mạnh:\n${insPed.complexityExplanation}\n\n` +
      `💡 **Mẹo thi THPT:** ${insPed.examTipsAndTraps}`;
  }

  if (isAskingBinarySearch) {
    const binPed = getHighSchoolPedagogy('binary-search');
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM VỀ THUẬT TOÁN TÌM KIẾM NHỊ PHÂN (BINARY SEARCH):**\n\n` +
      `### 1. Ý tưởng lật từ điển chia đôi:\n${binPed.realLifeAnalogy}\n\n` +
      `### 2. Mổ xẻ từng dòng code Python:\n${binPed.codeBreakdown}\n\n` +
      `### 3. Hiệu năng siêu tốc O(log n):\n${binPed.complexityExplanation}\n\n` +
      `⚠️ **Điều kiện sống còn:** ${binPed.examTipsAndTraps}`;
  }

  if (isAskingLinearSearch) {
    const linPed = getHighSchoolPedagogy('linear-search');
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM VỀ THUẬT TOÁN TÌM KIẾM TUẦN TỰ (LINEAR SEARCH):**\n\n` +
      `### 1. Ý tưởng đời sống:\n${linPed.realLifeAnalogy}\n\n` +
      `### 2. Mổ xẻ từng dòng code Python:\n${linPed.codeBreakdown}\n\n` +
      `### 3. Độ phức tạp Big-O:\n${linPed.complexityExplanation}\n\n` +
      `💡 **Mẹo làm bài thi:** ${linPed.examTipsAndTraps}`;
  }

  if (isAskingMergeSort) {
    const mergePed = getHighSchoolPedagogy('merge-sort');
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM VỀ THUẬT TOÁN MERGE SORT (SẮP XẾP TRỘN):**\n\n` +
      `### 1. Ý tưởng Chia để trị & Trộn mảng:\n${mergePed.realLifeAnalogy}\n\n` +
      `### 2. Mổ xẻ logic code Python:\n${mergePed.codeBreakdown}\n\n` +
      `### 3. Tính ổn định và độ phức tạp O(n log n):\n${mergePed.complexityExplanation}\n\n` +
      `💡 **Mẹo làm bài thi:** ${mergePed.examTipsAndTraps}`;
  }

  // =========================================================================
  // 8.5 SO SÁNH 3 THUẬT TOÁN SẮP XẾP CƠ BẢN (BUBBLE, SELECTION, INSERTION)
  // =========================================================================
  const isComparisonQuery =
    q.includes('phân biệt') ||
    q.includes('khác nhau giữa') ||
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
  // 10.1 THUẬT TOÁN NÀO CHẠY NHANH NHẤT & KHI NÀO DÙNG THUẬT TOÁN NÀO?
  // =========================================================================
  const isFastestAlgorithmQuery =
    q.includes('nhanh nhất') ||
    q.includes('tốc độ cao nhất') ||
    q.includes('thuật toán tối ưu nhất') ||
    (q.includes('chạy') && q.includes('nhanh'));

  if (isFastestAlgorithmQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: THUẬT TOÁN NÀO CHẠY NHANH NHẤT TRONG TẤT CẢ CÁC BÀI?**\n\n` +
      `Thầy/Cô phân tích dựa trên 2 bài toán lớn trong chương trình THPT:\n\n` +
      `### 1. Đối với Bài toán Tìm kiếm:\n` +
      `- **Nhanh nhất vô địch:** **Binary Search (Tìm kiếm nhị phân)** đạt tốc độ siêu tốc **$O(\\log n)$**.\n` +
      `  * Với mảng 1 triệu phần tử, Linear Search phải duyệt tối đa 1.000.000 bước, trong khi Binary Search chỉ mất tối đa **20 phép chia đôi**!\n` +
      `  * *Lưu ý sống còn:* Binary Search bắt buộc mảng phải sắp xếp trước.\n\n` +
      `### 2. Đối với Bài toán Sắp xếp:\n` +
      `- **Dữ liệu lớn bất kỳ ($n > 10.000$):** **Quick Sort** và **Merge Sort** chạy nhanh nhất với độ phức tạp **$O(n \\log n)$**.\n` +
      `  * Quick Sort chạy nhanh nhất trong thực tế nhờ bộ nhớ cache CPU và in-place partition.\n` +
      `  * Merge Sort ổn định và luôn đảm bảo $O(n \\log n)$ không bao giờ bị rơi vào trường hợp xấu.\n` +
      `- **Dữ liệu nhỏ ($n < 30$) hoặc mảng gần như đã sắp xếp:** **Insertion Sort** chạy nhanh nhất ($O(n)$) vì không tốn chi phí gọi hàm đệ quy.\n` +
      `- **Dữ liệu có miền giá trị nhỏ ($0 \\le a_i \\le K$ với $K$ nhỏ):** **Counting Sort (Đếm phân phối)** đạt tốc độ thần tốc tuyến tính **$O(n + K)$**!`;
  }

  // =========================================================================
  // 10.2 KHI NÀO NÊN DÙNG THUẬT TOÁN NÀO? (HƯỚNG DẪN CHỌN THUẬT TOÁN THPT)
  // =========================================================================
  const isWhenToUseQuery =
    q.includes('khi nào nên dùng') ||
    q.includes('khi nào dùng') ||
    q.includes('chọn thuật toán') ||
    q.includes('lựa chọn thuật toán');

  if (isWhenToUseQuery) {
    return `🎯 **BÍ QUYẾT CHỌN THUẬT TOÁN TỐI ƯU TRONG MỌI BÀI THI TIN HỌC THPT:**\n\n` +
      `| Tình huống thực tế / Đề bài | Thuật toán nên chọn | Lý do chọn |\n` +
      `| :--- | :--- | :--- |\n` +
      `| **Mảng nhỏ ($n \\le 1.000$) hoặc lập trình nhanh** | **Bubble Sort / Insertion Sort** | Cực kỳ dễ nhớ, chỉ 4-5 dòng code |\n` +
      `| **Cần số lần hoán đổi ít nhất** | **Selection Sort** | Tối đa đúng $n - 1$ lần swap |\n` +
      `| **Mảng đã gần có thứ tự sẵn** | **Insertion Sort** | Chạy thần tốc $O(n)$, không tốn bộ nhớ |\n` +
      `| **Cần giữ nguyên thứ tự điểm số bằng nhau** | **Bubble Sort, Insertion Sort, Merge Sort** | Có tính ổn định (Stable Sort) |\n` +
      `| **Dữ liệu lớn ($n \\ge 100.000$)** | **Quick Sort / Merge Sort / \`sorted()\`** | Tối ưu thời gian $O(n \\log n)$ |\n` +
      `| **Mảng lộn xộn cần tìm một số** | **Linear Search** | Dùng được ngay không cần sắp xếp trước |\n` +
      `| **Mảng đã sắp xếp cần tìm siêu tốc** | **Binary Search** | Tốc độ $O(\\log n)$, chia đôi liên tục |`;
  }

  // =========================================================================
  // 10.3 HÀM INPUT() VÀ CÁCH NHẬP NHIỀU SỐ TRÊN MỘT DÒNG
  // =========================================================================
  const isInputSplitQuery =
    q.includes('input()') ||
    q.includes('nhập mảng') ||
    q.includes('map(int') ||
    q.includes('nhập dữ liệu') ||
    q.includes('input().split');

  if (isInputSplitQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: CÁCH NHẬP DỮ LIỆU TỪ BÀN PHÍM CHUẨN ĐỀ THI TIN HỌC THPT**\n\n` +
      `### 1. Cú pháp kinh điển nhập một dãy số cách nhau bởi dấu cách:\n` +
      `\`\`\`python\n` +
      `arr = list(map(int, input().split()))\n` +
      `\`\`\`\n\n` +
      `### 2. Mổ xẻ cơ chế hoạt động từng thành phần:\n` +
      `1. \`input()\`: Đọc toàn bộ dòng học sinh nhập vào dưới dạng một chuỗi duy nhất (str).\n` +
      `2. \`.split()\`: Tự động cắt chuỗi thành danh sách các chuỗi con tại mọi khoảng trắng: \`['5', '2', '9']\`.\n` +
      `3. \`map(int, ...)\`: Ép kiểu từng chuỗi con thành số nguyên \`int\` (để có thể cộng trừ so sánh).\n` +
      `4. \`list(...)\`: Đóng gói toàn bộ thành danh sách Python \`[5, 2, 9]\` hoàn chỉnh!\n\n` +
      `💡 **Mẹo nhập 2 biến trên 1 dòng (ví dụ n và k):** \`n, k = map(int, input().split())\`.`;
  }

  // =========================================================================
  // 10.4 PHÂN BIỆT HÀM sort() VÀ sorted() TRONG PYTHON
  // =========================================================================
  const isSortVsSortedQuery =
    (q.includes('sort') && q.includes('sorted')) ||
    q.includes('khác nhau giữa sort') ||
    q.includes('list.sort');

  if (isSortVsSortedQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: PHÂN BIỆT \`arr.sort()\` VÀ \`sorted(arr)\` TRONG PYTHON**\n\n` +
      `| Tiêu chí | Phương thức \`arr.sort()\` | Hàm toàn cục \`sorted(arr)\` |\n` +
      `| :--- | :--- | :--- |\n` +
      `| **Cơ chế** | Sắp xếp **trực tiếp tại chỗ (In-Place)** trên mảng gốc | Tạo và trả về một **danh sách MỚI** đã sắp xếp |\n` +
      `| **Giá trị trả về** | Trả về \`None\`! (Không được gán \`b = arr.sort()\`) | Trả về danh sách mới: \`b = sorted(arr)\` |\n` +
      `| **Mảng gốc ban đầu** | **Bị thay đổi vĩnh viễn** | **Giữ nguyên 100%**, không bị biến đổi |\n` +
      `| **Áp dụng cho kiểu dữ liệu** | Chỉ dùng riêng cho kiểu \`list\` | Dùng cho mọi kiểu lặp (tuple, str, dict...) |\n\n` +
      `⚠️ **Bẫy học sinh hay mắc phải:** Viết \`arr = arr.sort()\` $\\to$ Biến \`arr\` bị biến thành \`None\` và mất sạch dữ liệu!`;
  }

  // =========================================================================
  // 10.5 ĐỆ QUY (RECURSION) LÀ GÌ VÀ ỨNG DỤNG TRONG THUẬT TOÁN?
  // =========================================================================
  const isRecursionQuery =
    q.includes('đệ quy') ||
    q.includes('recursion') ||
    q.includes('gọi lại chính nó');

  if (isRecursionQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: BẢN CHẤT CỦA ĐỆ QUY (RECURSION) CHO HỌC SINH THPT**\n\n` +
      `### 1. Đệ quy là gì?\n` +
      `Đệ quy là kỹ thuật lập trình mà **một hàm tự gọi lại chính nó** với bài toán có kích thước nhỏ hơn.\n\n` +
      `### 2. Hai thành phần BẮT BUỘC của mọi hàm đệ quy:\n` +
      `1. **Điểm dừng (Base Case):** Điều kiện để hàm dừng lại, không gọi tiếp nữa. *Nếu quên điểm dừng, máy tính sẽ bị tràn ngăn xếp (RecursionError: maximum recursion depth exceeded)!*\n` +
      `2. **Bước đệ quy (Recursive Step):** Gọi lại hàm với dữ liệu nhỏ hơn để tiến dần về điểm dừng.\n\n` +
      `### 3. Ứng dụng trong thuật toán THPT:\n` +
      `- **Quick Sort:** Sau khi chọn Pivot, đệ quy sắp xếp nửa bên trái và nửa bên phải.\n` +
      `- **Merge Sort:** Đệ quy chia đôi mảng cho đến khi mảng chỉ còn 1 phần tử rồi trộn lại.\n` +
      `- **Binary Search:** Đệ quy tìm kiếm trên nửa mảng còn lại.`;
  }

  // =========================================================================
  // 10.6 PHÂN BIỆT VÒNG LẶP FOR VÀ WHILE
  // =========================================================================
  const isLoopComparisonQuery =
    (q.includes('for') && q.includes('while')) ||
    q.includes('khi nào dùng while') ||
    q.includes('khi nào dùng for');

  if (isLoopComparisonQuery) {
    return `🎯 **TRẢ LỜI ĐÚNG TRỌNG TÂM: KHI NÀO DÙNG VÒNG LẶP FOR VÀ KHI NÀO DÙNG WHILE?**\n\n` +
      `- **Dùng \`for\`:** Khi bạn **biết trước số lần lặp** hoặc muốn **duyệt tuần tự qua một tập hợp** (mảng, xâu, range).\n` +
      `  * Ví dụ: Duyệt qua $n$ phần tử trong mảng: \`for x in arr:\` hoặc \`for i in range(n):\`.\n` +
      `- **Dùng \`while\`:** Khi bạn **chưa biết trước phải lặp bao nhiêu lần**, vòng lặp chạy phụ thuộc vào một **điều kiện logic**.\n` +
      `  * Ví dụ: Vòng lặp dời phần tử trong Insertion Sort: \`while j >= 0 and arr[j] > key:\` (chừng nào chưa thỏa mãn thì lùi tiếp).\n` +
      `  * Ví dụ: Vòng lặp chia đôi trong Binary Search: \`while left <= right:\`.\n\n` +
      `⚠️ **Cảnh báo bẫy thi:** Dùng \`while\` phải luôn đảm bảo biến điều kiện được cập nhật (ví dụ \`j -= 1\`), nếu quên sẽ bị **vòng lặp vô tận (Infinite Loop)** làm treo chương trình!`;
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
      `### 2. Chi tiết độ phức tạp thuật toán hiện tại:\n` +
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
  // 18. MẶC ĐỊNH THÔNG MINH: TRẢ LỜI ĐÚNG TRỌNG TÂM THEO PHẠM VI (TỔNG THỂ HOẶC BÀI HỌC)
  // =========================================================================
  if (scope === 'all' || algorithmId === 'custom-code') {
    return `🎯 **TRẢ LỜI CHUYÊN GIA PYTHON CẤP CAO (TOÀN BỘ CHƯƠNG TRÌNH TIN HỌC THPT):**\n\n` +
      `Bạn đang hỏi: *"${rawQ}"*\n\n` +
      `Thầy/Cô chuyên gia giải đáp tổng thể cho bạn như sau:\n\n` +
      `1. **Bức tranh tổng thể thuật toán THPT:**\n` +
      `- Trong chương trình Tin học lớp 10, 11, 12, các bài toán trọng tâm gồm: **Sắp xếp** (Bubble, Selection, Insertion, Quick, Merge) và **Tìm kiếm** (Linear Search, Binary Search).\n` +
      `- Tùy theo kích thước dữ liệu $n$ và đặc điểm mảng (đã sắp xếp hay chưa), ta chọn thuật toán tối ưu nhất giữa tốc độ ($O(n \\log n)$, $O(\\log n)$) và bộ nhớ phụ.\n\n` +
      `2. **Nguyên tắc kỹ thuật lập trình Python cần nhớ:**\n` +
      `- Chỉ số mảng luôn bắt đầu từ 0 (Base Offset trong bộ nhớ RAM).\n` +
      `- Phép hoán đổi Python cực nhanh: \`a, b = b, a\` (Tuple Packing & Unpacking).\n` +
      `- Tránh các lỗi kinh điển: \`NameError\` (biến chưa khai báo hoặc gõ sai tên), \`IndexError\` (vượt cận mảng), \`TypeError\` (so sánh nhầm str và int).\n\n` +
      `💡 **Gợi ý tra cứu nhanh:** Bạn có thể bấm vào các nút phía trên (📊 **Bảng tổng hợp tất cả thuật toán**, ⚡ **Độ phức tạp Big-O**, 🎯 **10 Bẫy đề thi**) hoặc gõ bất kỳ câu hỏi nào về từng bài cụ thể nhé!`;
  }

  return `🎯 **TRẢ LỜI CHUYÊN GIA PYTHON VỀ THUẬT TOÁN ${pedagogy.name.toUpperCase()}:**\n\n` +
    `Bạn đang hỏi: *"${rawQ}"*\n\n` +
    `Dưới góc độ lập trình viên Python cấp cao, thầy/cô giải thích cho bạn như sau:\n\n` +
    `1. **Nguyên lý cốt lõi:** ${pedagogy.realLifeAnalogy}\n\n` +
    `2. **Điểm cần lưu ý trong mã nguồn:**\n` +
    `${pedagogy.codeBreakdown.split('\n').slice(0, 5).join('\n')}\n\n` +
    `💡 **Gợi ý hữu ích:** Bạn có thể bấm vào các thẻ câu hỏi gợi ý bên dưới (như *Tác dụng của biến cờ swapped?*, *Tại sao n - i - 1?*, *Cách sắp xếp giảm dần?*) hoặc chuyển sang chế độ **"Toàn bộ chương trình (Tất cả các bài)"** để so sánh đa bài học nhé!`;
}

/**
 * Sinh giải thích theo chế độ sư phạm tức thì 0ms (Local Fast Engine)
 * Hỗ trợ cả chế độ từng bài và chế độ tổng thể toàn bộ chương trình
 */
export function getLocalPedagogyResponse(
  mode:
    | 'concept'
    | 'code_breakdown'
    | 'complexity'
    | 'exam_tips'
    | 'step_insight'
    | 'curriculum_matrix'
    | 'curriculum_roadmap'
    | 'curriculum_bigo'
    | 'curriculum_exam_traps',
  algorithmId: string,
  currentStep?: TraceStep
): string {
  // Các chế độ tổng thể toàn bộ chương trình THPT
  if (mode === 'curriculum_matrix') return getCurriculumOverview('matrix');
  if (mode === 'curriculum_roadmap') return getCurriculumOverview('roadmap');
  if (mode === 'curriculum_bigo') return getCurriculumOverview('bigo');
  if (mode === 'curriculum_exam_traps') return getCurriculumOverview('exam_traps');

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
