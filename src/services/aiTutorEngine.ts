/**
 * Động Cơ Trợ Lí AI Sư Phạm Tin Học THPT Tích Hợp Sẵn (100% Offline / Local Engine)
 * - HOẠT ĐỘNG HOÀN TOÀN TỰ ĐỘNG, KHÔNG CẦN CẤU HÌNH API HAY KHÓA BẢO MẬT.
 * - Phù hợp 100% với học sinh và giáo viên THPT (Lớp 10, 11, 12).
 * - Phản hồi tức thì 0ms, không phụ thuộc mạng, không bao giờ lỗi quota/API.
 */

import { TraceStep } from '../types';
import { HIGH_SCHOOL_KNOWLEDGE_BASE, getHighSchoolPedagogy, AlgorithmPedagogy } from './aiTutorKnowledge';

export interface TutorResponse {
  content: string;
  isInstant: boolean;
  source: 'built-in-ai' | 'hybrid';
}

/**
 * Trả lời câu hỏi bất kỳ của học sinh dựa trên ngữ cảnh thuật toán và đoạn code hiện tại
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
  const q = question.trim().toLowerCase();
  const pedagogy = getHighSchoolPedagogy(algorithmId);

  // 1. Thắc mắc về API / Thiết lập cài đặt
  if (
    q.includes('api') ||
    q.includes('cài đặt') ||
    q.includes('thiết lập') ||
    q.includes('khóa') ||
    q.includes('key') ||
    q.includes('tài khoản') ||
    q.includes('token')
  ) {
    return `🎓 **Chào bạn! Hệ thống Trợ Lí AI đã được TÍCH HỢP SẴN 100%:**\n\n` +
      `✅ **Học sinh THPT không cần thiết lập bất kỳ API hay khóa bảo mật nào!**\n` +
      `- Trợ lí AI sư phạm của chúng ta hoạt động trực tiếp ngay trên trình duyệt và hệ thống máy chủ nội bộ của phòng thực hành Tin học.\n` +
      `- Bạn và thầy cô chỉ cần mở ứng dụng là có thể học tập, chạy thử, quan sát từng bước biến đổi và hỏi đáp thuật toán ngay lập tức.\n` +
      `- Không tốn phí, không cần đăng ký tài khoản và không lo bị gián đoạn hay giới hạn lượt dùng!`;
  }

  // 2. Thắc mắc về bước hiện tại / Dòng code hiện tại đang chạy
  if (
    q.includes('bước hiện tại') ||
    q.includes('bước này') ||
    q.includes('dòng này') ||
    q.includes('đang làm gì') ||
    q.includes('chuyện gì đang xảy ra')
  ) {
    if (currentStep) {
      const vars = currentStep.stack_frames?.[currentStep.stack_frames.length - 1]?.variables || {};
      const varEntries = Object.entries(vars);
      const varText = varEntries.length > 0
        ? varEntries.map(([k, v]) => `\`${k} = ${JSON.stringify(v)}\``).join(', ')
        : 'Chưa có biến cục bộ nào được tạo';

      return `📍 **Phân tích bước thực thi hiện tại (Dòng ${currentStep.line_number}):**\n\n` +
        `- **Sự kiện thực thi:** Lệnh \`${currentStep.event || 'line'}\` tại dòng **${currentStep.line_number}**.\n` +
        `- **Giá trị các biến ở thời điểm này:** ${varText}.\n` +
        `- **Ý nghĩa sư phạm:** Máy tính đang đọc và thực thi câu lệnh này trên bộ nhớ RAM. ` +
        `Bạn hãy nhìn sang biểu đồ trực quan (cột đồ họa) để thấy sự biến đổi tương ứng của mảng và vị trí các con trỏ!`;
    } else {
      return `💡 **Bạn hãy bấm nút "Chạy Chương Trình" (màu xanh lá)** ở thanh trên cùng, sau đó bấm nút **Tiếp Tục** để theo dõi từng bước máy tính thực thi nhé!`;
    }
  }

  // 3. Câu hỏi về vòng lặp n - i - 1 trong Bubble Sort
  if (
    (q.includes('n - i - 1') || q.includes('n-i-1') || q.includes('tại sao lại là n - i') || q.includes('vòng lặp trong')) &&
    algorithmId.includes('bubble')
  ) {
    return `🎯 **Tại sao vòng lặp trong của Bubble Sort lại là \`range(0, n - i - 1)\`?**\n\n` +
      `Đây là câu hỏi cực kỳ hay và là "điểm mấu chốt" trong các đề thi Tin học THPT!\n\n` +
      `1. **Trừ đi 1 (\`- 1\`):** Trong vòng lặp, ta so sánh \`arr[j]\` với \`arr[j + 1]\`. Nếu $j$ chạy tới tận $n-1$, thì $j+1 = n$ sẽ nằm ngoài mảng, gây ra lỗi kinh điển **IndexError: list index out of range**!\n` +
      `2. **Trừ đi $i$ (\`- i\`):** Sau mỗi lượt $i$ của vòng lặp ngoài, phần tử lớn nhất đã chắc chắn trôi về cuối mảng rồi (vị trí đã được bảo toàn). Ta không cần so sánh lại những phần tử ở cuối nữa!\n\n` +
      `💡 **Hiệu quả:** Giúp thuật toán giảm được một nửa số phép so sánh dư thừa, chạy nhanh gấp đôi!`;
  }

  // 4. Câu hỏi về biến cờ swapped
  if (q.includes('swapped') || q.includes('biến cờ') || q.includes('dừng sớm') || q.includes('cờ')) {
    return `🚩 **Tác dụng của biến cờ \`swapped\` (Optimization Flag):**\n\n` +
      `Trong các đề thi trắc nghiệm THPT, đây là kỹ thuật nâng cấp Bubble Sort từ $O(n^2)$ lên Best-case $O(n)$!\n\n` +
      `- Đầu mỗi lượt duyệt, ta đặt \`swapped = False\`.\n` +
      `- Nếu có bất kỳ cặp nào đứng sai thứ tự và bị đổi chỗ, ta bật \`swapped = True\`.\n` +
      `- Sau cả lượt duyệt mà \`swapped\` vẫn là \`False\`, điều đó chứng minh **toàn bộ các cặp số đã nằm đúng thứ tự 100% rồi**!\n` +
      `- Ta dùng lệnh \`break\` để dừng chương trình ngay lập tức mà không cần chạy thêm các lượt sau nữa.\n\n` +
      `👉 **Ví dụ:** Cho mảng đã sắp xếp sẵn \`[1, 2, 3, 4, 5]\`, nhờ có \`swapped\`, máy tính chỉ duyệt 1 lượt ($n-1$ phép tính) rồi kết thúc!`;
  }

  // 5. Câu hỏi về Độ phức tạp thời gian Big-O
  if (
    q.includes('độ phức tạp') ||
    q.includes('big-o') ||
    q.includes('o(n') ||
    q.includes('thời gian') ||
    q.includes('best case') ||
    q.includes('worst case')
  ) {
    return pedagogy.complexityExplanation;
  }

  // 6. Câu hỏi về Tính ổn định (Stability)
  if (q.includes('ổn định') || q.includes('stable') || q.includes('tính ổn định')) {
    return `⚖️ **Khái niệm "Tính Ổn Định (Stability)" trong Thuật Toán Sắp Xếp THPT:**\n\n` +
      `Một thuật toán sắp xếp được gọi là **ổn định (Stable)** nếu nó **giữ nguyên thứ tự ban đầu** của các phần tử có giá trị bằng nhau.\n\n` +
      `Ví dụ: Học sinh A đạt 8 điểm (đứng trước) và học sinh B đạt 8 điểm (đứng sau):\n` +
      `- **Ổn định:** Sau khi sắp xếp điểm, A vẫn đứng trước B.\n` +
      `- **Không ổn định:** B có thể bị nhảy lên đứng trước A!\n\n` +
      `📋 **Bảng tra cứu cho bài thi trắc nghiệm:**\n` +
      `- **Thuật toán Ổn định:** Bubble Sort, Insertion Sort, Merge Sort.\n` +
      `- **Thuật toán Không ổn định:** Selection Sort, Quick Sort.`;
  }

  // 7. Câu hỏi về Xâu kí tự / Sắp xếp chuỗi / Bảng mã ASCII
  if (
    q.includes('xâu') ||
    q.includes('kí tự') ||
    q.includes('chuỗi') ||
    q.includes('string') ||
    q.includes('ascii') ||
    q.includes('ord') ||
    q.includes('chr')
  ) {
    return `🔤 **Cách Máy Tính và Python Xử Lý & Sắp Xếp Xâu Kí Tự:**\n\n` +
      `Trong Tin học cấp THPT, máy tính không "nhìn" chữ cái mà chuyển đổi sang **Mã số ASCII**:\n\n` +
      `1. **Quy tắc so sánh kí tự:**\n` +
      `   - Chữ hoa 'A' (65) đến 'Z' (90).\n` +
      `   - Chữ thường 'a' (97) đến 'z' (122).\n` +
      `   - Vì $65 < 97$ nên trong Python phép so sánh \`'A' < 'a'\` luôn cho kết quả là **True** (Chữ hoa đứng trước chữ thường)!\n` +
      `2. **Hai hàm quan trọng cần nhớ trong đề thi:**\n` +
      `   - \`ord('A')\` ➔ Trả về mã số nguyên \`65\`.\n` +
      `   - \`chr(65)\` ➔ Trả về lại kí tự \`'A'\`.\n` +
      `3. **Tối ưu trên xâu:** Do xâu (\`str\`) trong Python là bất biến (immutable), ta dùng \`list(s)\` để hoán đổi trực quan, sau đó nối lại bằng \`"".join(list)\`!`;
  }

  // 8. Câu hỏi về Tìm kiếm nhị phân (Binary Search)
  if (
    (q.includes('nhị phân') || q.includes('binary') || q.includes('điều kiện')) &&
    (algorithmId.includes('binary') || q.includes('binary'))
  ) {
    return `📖 **Quy tắc vàng của Tìm kiếm Nhị Phân (Binary Search):**\n\n` +
      `⚠️ **ĐIỀU KIỆN TIÊN QUYẾT BẮT BUỘC:**\n` +
      `Mảng **PHẢI ĐÃ ĐƯỢC SẮP XẾP TĂNG DẦN (HOẶC GIẢM DẦN)** từ trước!\n` +
      `- Nếu mảng lộn xộn, bạn bắt buộc phải dùng **Tìm kiếm tuần tự (Linear Search)** hoặc phải sắp xếp mảng trước.\n` +
      `- Trong Python, luôn lấy phần tử giữa bằng phép chia nguyên: \`mid = (left + right) // 2\` để nhận chỉ số nguyên, tránh lỗi số thực (\`float\`).`;
  }

  // 9. Câu hỏi về Quick Sort và Pivot
  if (
    (q.includes('pivot') || q.includes('chốt') || q.includes('chia để trị') || q.includes('quick')) &&
    (algorithmId.includes('quick') || q.includes('quick'))
  ) {
    return `⚡ **Phần tử chốt (Pivot) trong Quick Sort:**\n\n` +
      `- **Vai trò:** Pivot là "cột mốc" để phân chia lớp. Tất cả số nhỏ hơn Pivot đứng bên Trái, lớn hơn đứng bên Phải.\n` +
      `- Sau 1 lần phân hoạch (Partition), Pivot đã **vĩnh viễn đứng đúng vị trí cuối cùng của nó trong mảng**!\n` +
      `- **Trường hợp xấu nhất $O(n^2)$:** Xảy ra khi ta chọn Pivot luôn rơi vào phần tử nhỏ nhất hoặc lớn nhất trên một mảng đã sắp xếp sẵn (khiến việc chia đôi bị lệch hẳn về một phía).`;
  }

  // 10. Câu hỏi về Lỗi lập trình hay gặp (IndexError, TypeError,...)
  if (q.includes('lỗi') || q.includes('indexerror') || q.includes('typeerror') || q.includes('syntax')) {
    return `🛡️ **Các Lỗi Python Học Sinh THPT Hay Mắc Phải Nhất:**\n\n` +
      `1. **IndexError: list index out of range:**\n` +
      `   - Nguyên nhân: Truy cập chỉ số vượt quá độ dài mảng (ví dụ mảng có 5 phần tử từ chỉ số 0 đến 4, nhưng gọi \`arr[5]\` hoặc \`arr[j + 1]\` khi $j = 4$).\n` +
      `   - Cách sửa: Chú ý cận vòng lặp, ví dụ dùng \`n - i - 1\` thay vì \`n\`.\n` +
      `2. **TypeError: '<' not supported between instances of 'str' and 'int':**\n` +
      `   - Nguyên nhân: So sánh lẫn lộn giữa số và chữ.\n` +
      `   - Cách sửa: Chuyển đổi kiểu dữ liệu rõ ràng bằng \`int()\` hoặc \`str()\`.`;
  }

  // 11. Câu hỏi về Bẫy đề thi / Trắc nghiệm
  if (q.includes('thi') || q.includes('bẫy') || q.includes('mẹo') || q.includes('trắc nghiệm')) {
    return pedagogy.examTipsAndTraps;
  }

  // 12. Câu hỏi về Ý tưởng / Bản chất
  if (q.includes('ý tưởng') || q.includes('bản chất') || q.includes('tại sao') || q.includes('thế nào')) {
    return `${pedagogy.realLifeAnalogy}\n\n${pedagogy.codeBreakdown}`;
  }

  // Mặc định: Trả lời sư phạm tổng hợp, ân cần
  return `Chào bạn! Với bài toán **${pedagogy.name}**:\n\n` +
    `${pedagogy.realLifeAnalogy}\n\n` +
    `💡 **Mẹo học tập:** Bạn có thể bấm vào 4 nút phân tích nhanh ở trên (Ý tưởng đời sống, Mổ xẻ từng dòng code, Độ phức tạp Big-O, Bẫy bài thi THPT) hoặc gõ câu hỏi cụ thể hơn để Trợ lí AI giải đáp ngay nhé!`;
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

        return `📍 **Phân tích bước thực thi máy tính đang chạy (Dòng ${currentStep.line_number || '-'}):**\n\n` +
          `- **Sự kiện thực thi:** Lệnh \`${currentStep.event || 'line'}\` tại dòng **${currentStep.line_number}**.\n` +
          `- **Giá trị các biến hiện thời trong bộ nhớ:**\n${varList || '• Chưa có biến cục bộ'}\n\n` +
          `🔍 **Nhận định sư phạm:** Máy tính đang thực hiện câu lệnh ở dòng này để so sánh hoặc gán giá trị. Hãy quan sát trên đồ họa cột bên cạnh để thấy trạng thái hoán đổi dữ liệu tương ứng!`;
      }
      return '📍 **Chưa có bước thực thi nào được chọn.** Hãy bấm nút "Chạy Chương Trình" (màu xanh lá) và bấm "Tiếp Tục" để theo dõi từng bước máy tính thực hiện.';
    default:
      return pedagogy.realLifeAnalogy;
  }
}
