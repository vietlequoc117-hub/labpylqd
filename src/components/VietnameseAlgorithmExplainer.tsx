import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Sparkles,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  ListOrdered,
  HelpCircle,
  FileCode,
  Wand2,
} from 'lucide-react';
import { PseudocodeLine } from '../types';
import { generatePseudocodeFromPython } from '../services/pseudocodeGenerator';

interface VietnameseAlgorithmExplainerProps {
  algorithmId?: string;
  algorithmTitle?: string;
  algorithmCategory?: string;
  customCode?: string;
  presetPseudocode?: PseudocodeLine[];
  activePythonLine?: number;
}

// Thư viện kiến thức thuật toán giải thích bằng Tiếng Việt sư phạm THPT
const ALGORITHM_KNOWLEDGE_BASE: Record<
  string,
  {
    analogy: string;
    steps: string[];
    keyRules: string[];
    practicalNote: string;
  }
> = {
  'bubble-sort': {
    analogy:
      'Tưởng tượng như sắp hàng chào cờ từ thấp đến cao: Hai bạn đứng cạnh nhau quay sang so chiều cao, bạn nào cao hơn thì đổi chỗ lùi về sau. Sau mỗi lượt, bạn cao nhất chắc chắn sẽ "nổi" về đứng cuối hàng.',
    steps: [
      'Bước 1: Bắt đầu từ đầu mảng, so sánh từng cặp phần tử liền kề (A[j] và A[j+1]).',
      'Bước 2: Nếu số đứng trước lớn hơn số đứng sau (A[j] > A[j+1]), tiến hành hoán đổi vị trí của chúng.',
      'Bước 3: Lặp lại quá trình này qua nhiều lượt. Sau lượt thứ i, phần tử lớn nhất của đoạn đó đã nằm đúng vị trí ở cuối.',
      'Bước 4: Dừng thuật toán khi duyệt qua hết một lượt mà không có bất kỳ sự hoán đổi nào (mảng đã được xếp xong).',
    ],
    keyRules: [
      'Quy tắc ghi nhớ: "So sánh cặp liền kề, đẩy số lớn về cuối".',
      'Độ phức tạp trung bình: O(n²) - phù hợp với danh sách nhỏ.',
      'Ưu điểm: Dễ hiểu nhất trong mọi thuật toán sắp xếp.',
    ],
    practicalNote:
      'Trong đề thi THPT, câu hỏi hay gặp: "Sau lượt duyệt đầu tiên của Bubble Sort, phần tử nào đã đứng đúng vị trí?" -> Đáp án luôn là: Phần tử lớn nhất mảng đã nằm ở vị trí cuối cùng.',
  },
  'selection-sort': {
    analogy:
      'Như đi nhặt quả dưa nhẹ nhất trên sạp: Bạn quét mắt nhìn qua toàn bộ các quả dưa, tìm ra quả nhẹ nhất rồi nhấc đặt vào vị trí đầu tiên. Sau đó làm tiếp với các quả còn lại.',
    steps: [
      'Bước 1: Giả sử vị trí đầu tiên i là phần tử nhỏ nhất (min_idx = i).',
      'Bước 2: Quét qua tất cả phần tử còn lại từ i+1 đến cuối mảng để tìm xem có số nào nhỏ hơn A[min_idx] không.',
      'Bước 3: Nếu tìm thấy, cập nhật vị trí min_idx mới.',
      'Bước 4: Sau khi quét hết lượt, hoán đổi giá trị A[i] với A[min_idx]. Đưa số nhỏ nhất về đúng vị trí đầu.',
      'Bước 5: Tăng i lên 1 và lặp lại cho đến hết mảng.',
    ],
    keyRules: [
      'Quy tắc ghi nhớ: "Tìm số nhỏ nhất trong phần còn lại rồi đổi về đầu".',
      'Số lần hoán đổi ít hơn Bubble Sort (chỉ đúng n - 1 lần hoán đổi).',
      'Độ phức tạp luôn là O(n²) trong mọi trường hợp.',
    ],
    practicalNote:
      'Điểm mấu chốt trong sách giáo khoa: Thuật toán chọn trực tiếp chỉ đổi chỗ một lần duy nhất ở cuối mỗi vòng lặp i, chứ không đổi liên tục như nổi bọt.',
  },
  'insertion-sort': {
    analogy:
      'Giống như bạn đang xếp các lá bài trên tay khi chơi bài: Mỗi khi rút thêm một lá bài mới, bạn tìm đúng khe vị trí giữa các lá bài đã xếp trước đó để chèn nó vào.',
    steps: [
      'Bước 1: Xem phần tử đầu tiên A[0] là một đoạn đã được sắp xếp (danh sách gồm 1 phần tử).',
      'Bước 2: Lấy phần tử kế tiếp key = A[i] để chuẩn bị chèn.',
      'Bước 3: So sánh key lần lượt với các phần tử đứng trước nó từ phải sang trái. Nếu phần tử đứng trước lớn hơn key, dịch phần tử đó sang phải một bước.',
      'Bước 4: Đặt key vào đúng vị trí trống vừa được tạo ra.',
      'Bước 5: Lặp lại cho tất cả các phần tử còn lại.',
    ],
    keyRules: [
      'Quy tắc ghi nhớ: "Lấy từng phần tử chèn vào đúng chỗ trong đoạn đã xếp".',
      'Cực kỳ nhanh khi mảng đã gần như có thứ tự (Best case O(n)).',
      'Là thuật toán tự nhiên nhất với tư duy con người.',
    ],
    practicalNote:
      'Nếu mảng ban đầu đã được sắp xếp tăng dần sẵn, Insertion Sort chỉ tốn O(n) phép so sánh và không cần dịch chuyển phần tử nào.',
  },
  'quick-sort': {
    analogy:
      'Ý tưởng "Chia để trị": Bạn chọn một bạn làm mốc (Pivot). Tất cả những bạn thấp hơn mốc thì đứng về bên trái, những bạn cao hơn thì đứng sang bên phải. Sau đó làm tương tự với nhóm bên trái và nhóm bên phải.',
    steps: [
      'Bước 1: Chọn một phần tử làm chốt (Pivot) - thường là phần tử ở giữa hoặc cuối mảng.',
      'Bước 2: Phân hoạch (Partition): Duyệt mảng và chuyển các số nhỏ hơn Pivot sang trái, số lớn hơn sang phải.',
      'Bước 3: Đặt Pivot vào chính giữa hai nhóm (vị trí này là vĩnh viễn cố định).',
      'Bước 4: Gọi đệ quy Quick Sort cho nửa bên trái và nửa bên phải.',
      'Bước 5: Khi các đoạn con chỉ còn 1 hoặc 0 phần tử, việc sắp xếp hoàn tất.',
    ],
    keyRules: [
      'Quy tắc ghi nhớ: "Chọn mốc, chia 2 phe bé - lớn, đệ quy sắp xếp".',
      'Tốc độ trung bình cực nhanh: O(n log n).',
      'Là thuật toán sắp xếp được dùng phổ biến nhất trong thực tế.',
    ],
    practicalNote:
      'Trong đề thi đại học và học sinh giỏi: Chú ý trường hợp xấu nhất O(n²) khi mảng đã xếp sẵn và ta chọn chốt xấu (ở mép).',
  },
  'merge-sort': {
    analogy:
      'Ý tưởng: Chia nhỏ danh sách làm đôi liên tục cho đến khi mỗi nhóm chỉ còn 1 phần tử. Sau đó, trộn từng cặp nhóm lại với nhau theo thứ tự tăng dần, như trộn hai xấp bài đã xếp sẵn.',
    steps: [
      'Bước 1: Chia đôi mảng tại vị trí chính giữa mid = len(arr) // 2.',
      'Bước 2: Gọi đệ quy Merge Sort để sắp xếp nửa bên trái và nửa bên phải.',
      'Bước 3: Quá trình trộn (Merge): So sánh phần tử đầu tiên của hai nửa, lấy phần tử nhỏ hơn đưa vào mảng kết quả.',
      'Bước 4: Đưa tất cả các phần tử còn dư của hai nửa vào mảng kết quả.',
    ],
    keyRules: [
      'Quy tắc ghi nhớ: "Bẻ đôi đến tận cùng rồi trộn lại theo thứ tự".',
      'Độ phức tạp luôn ổn định: O(n log n) trong mọi trường hợp.',
      'Nhược điểm: Tốn thêm bộ nhớ phụ O(n) để chứa mảng trộn.',
    ],
    practicalNote:
      'Merge Sort là ví dụ kinh điển nhất của mô hình thuật toán "Chia để trị" (Divide and Conquer).',
  },
  'linear-search': {
    analogy:
      'Tưởng tượng như bạn đang tìm một quyển sách trên giá sách chưa được xếp thứ tự hoặc tìm chìa khóa trong chùm chìa: Bạn chỉ có thể lần lượt thử từng chiếc chìa từ chiếc đầu tiên cho đến chiếc cuối cùng cho đến khi mở được ổ khóa hoặc thử hết chùm chìa.',
    steps: [
      'Bước 1: Bắt đầu duyệt từ phần tử đầu tiên của mảng (chỉ số i = 0).',
      'Bước 2: So sánh giá trị A[i] với giá trị cần tìm (target).',
      'Bước 3: Nếu A[i] == target: Tìm thấy! Trả về chỉ số i và dừng thuật toán ngay lập tức.',
      'Bước 4: Nếu A[i] != target: Tăng chỉ số i lên 1 (i = i + 1) và chuyển sang phần tử tiếp theo.',
      'Bước 5: Nếu đã duyệt hết mảng mà vẫn không tìm thấy: Trả về -1 (Không tìm thấy).',
    ],
    keyRules: [
      'Ưu điểm lớn nhất: Áp dụng được cho MỌI mảng, kể cả mảng lộn xộn chưa được sắp xếp.',
      'Độ phức tạp thời gian: O(n) ở trường hợp xấu nhất (Worst-case) và trung bình; O(1) ở trường hợp tốt nhất (Best-case).',
      'Không gian bộ nhớ: O(1) - chỉ dùng một biến chỉ số i để duyệt.',
      'Nhược điểm: Chậm khi mảng có kích thước lớn (n hàng triệu phần tử).',
    ],
    practicalNote:
      'Trong đề thi Tin học: Câu hỏi trắc nghiệm hay gặp: "Ưu điểm của thuật toán Tìm kiếm tuần tự so với Tìm kiếm nhị phân là gì?" -> Đáp án: Không yêu cầu mảng phải được sắp xếp trước.',
  },
  'binary-search': {
    analogy:
      'Tưởng tượng như bạn đang tra từ điển giấy hoặc đoán một số từ 1 đến 100: Bạn mở ngay trang chính giữa sách (hoặc đoán số 50). Nếu từ cần tìm đứng sau từ ở trang giữa, bạn bỏ hẳn nửa cuốn sách bên trái và chỉ tìm ở nửa bên phải. Mỗi lần kiểm tra, bạn đã loại bỏ ngay 50% số lượng phần tử!',
    steps: [
      'Bước 1: Điều kiện bắt buộc: Mảng phải được sắp xếp theo thứ tự tăng dần từ trước.',
      'Bước 2: Đặt 2 con trỏ: left = 0 (đầu mảng) và right = len - 1 (cuối mảng).',
      'Bước 3: Tính chỉ số ở chính giữa: mid = (left + right) // 2.',
      'Bước 4: So sánh phần tử A[mid] với số cần tìm (target):',
      '         • Nếu A[mid] == target: Tìm thấy ngay tại vị trí mid!',
      '         • Nếu A[mid] < target: target nằm ở nửa bên phải -> chuyển left = mid + 1.',
      '         • Nếu A[mid] > target: target nằm ở nửa bên trái -> chuyển right = mid - 1.',
      'Bước 5: Lặp lại quá trình trên cho đến khi tìm thấy hoặc left > right (không tìm thấy, trả về -1).',
    ],
    keyRules: [
      'Quy tắc vàng: Mảng BẮT BUỘC phải sắp xếp trước khi tìm kiếm nhị phân.',
      'Tốc độ siêu nhanh: O(log n) - với 1 triệu phần tử chỉ cần tối đa ~20 phép so sánh!',
      'Không gian bộ nhớ: O(1) - chỉ dùng 3 biến con trỏ left, right, mid.',
    ],
    practicalNote:
      'Trong đề thi THPT: Câu hỏi trắc nghiệm hay gặp: "Với mảng có 16 phần tử đã sắp xếp, thuật toán Tìm kiếm nhị phân cần tối đa bao nhiêu lần so sánh?" -> Đáp án luôn là: 4 lần (vì 2⁴ = 16).',
  },
};

export const VietnameseAlgorithmExplainer: React.FC<VietnameseAlgorithmExplainerProps> = ({
  algorithmId = 'bubble-sort',
  algorithmTitle,
  customCode,
  presetPseudocode,
  activePythonLine,
}) => {
  const [copied, setCopied] = useState(false);

  // Lấy dữ liệu giải thích tiếng Việt sư phạm
  const currentKnowledge = ALGORITHM_KNOWLEDGE_BASE[algorithmId] || {
    analogy:
      'Thuật toán này đang giải quyết bài toán theo từng bước lệnh tuần tự. Máy tính sẽ thực hiện từ câu lệnh trên xuống câu lệnh dưới, kiểm tra điều kiện (if) hoặc lặp lại (for/while) theo logic bạn đã viết.',
    steps: [
      'Bước 1: Nhận dữ liệu đầu vào (biến, danh sách mảng, hoặc nhập từ bàn phím).',
      'Bước 2: Khởi tạo các biến trung gian để lưu trữ trạng thái xử lý.',
      'Bước 3: Thực thi các câu lệnh tính toán, vòng lặp hoặc rẽ nhánh điều kiện.',
      'Bước 4: Xuất kết quả cuối cùng ra màn hình (hàm print) hoặc trả về giá trị (hàm return).',
    ],
    keyRules: [
      'Tuần tự: Lệnh nào viết trước thì máy tính chạy trước.',
      'Khối lệnh thụt lề: Các dòng lệnh trong for/while/if phải thụt vào trong 4 dấu cách.',
      'Biến số: Dùng để ghi nhớ giá trị thay đổi trong suốt quá trình chạy.',
    ],
    practicalNote:
      'Học sinh có thể theo dõi sự biến đổi của từng biến ở tab "Theo Dõi Biến" bên cạnh để hiểu rõ máy tính đang tính toán như thế nào qua từng dòng lệnh.',
  };

  // Tạo mã giả đối sánh từng dòng
  const effectivePseudocode = useMemo(() => {
    if (presetPseudocode && presetPseudocode.length > 0) {
      return { lines: presetPseudocode, isGenerated: false };
    }
    if (customCode && customCode.trim()) {
      const generated = generatePseudocodeFromPython(customCode);
      return { lines: generated, isGenerated: true };
    }
    return { lines: [], isGenerated: false };
  }, [presetPseudocode, customCode]);

  const { lines, isGenerated } = effectivePseudocode;

  const handleCopy = () => {
    if (!lines || lines.length === 0) return;
    const text = lines
      .map(
        (line) =>
          `${'  '.repeat(line.indent)}${line.lineNum}. ${line.text}${
            line.explanation ? ` // ${line.explanation}` : ''
          }`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col gap-4 p-4 text-slate-200">
      {/* 1. Header Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <span>Thuật Toán Giải Thích Bằng Tiếng Việt</span>
              {algorithmTitle && (
                <span className="text-xs text-amber-300 font-normal px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  {algorithmTitle}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400">
              Diễn giải trực quan, dễ nhớ, giúp học sinh nắm vững bản chất thuật toán
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer border border-slate-700"
          title="Sao chép toàn bộ thuật toán và mã giả vào bộ nhớ tạm"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Đã sao chép</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Chép thuật toán</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Visual Analogy (Ý tưởng đời sống trực quan) */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 shadow-sm">
        <div className="flex items-start gap-2.5">
          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Ý tưởng đời thường (Dễ hình dung nhất)
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {currentKnowledge.analogy}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Step-by-Step Execution Plan (Các bước thực hiện) */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
          <ListOrdered className="w-4 h-4" />
          <span>Quy trình các bước máy tính thực hiện:</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {currentKnowledge.steps.map((st, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-lg"
            >
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold font-mono text-[11px] flex items-center justify-center shrink-0 border border-emerald-500/30">
                {idx + 1}
              </span>
              <p className="leading-relaxed flex-1">{st}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Line-by-Line Python ↔ Vietnamese Pseudocode with Live Sync Highlighting */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex flex-col">
        <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-200">
              Đối Chiếu Mã Nguồn ↔ Thuật Toán Tiếng Việt Từng Dòng:
            </span>
          </div>
          {activePythonLine && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>Đang chạy lệnh dòng {activePythonLine}</span>
            </div>
          )}
        </div>

        <div className="divide-y divide-slate-800/60 max-h-[350px] overflow-y-auto font-mono text-xs">
          {lines.map((pLine) => {
            const isCurrentActive =
              activePythonLine &&
              pLine.correspondingPythonLines &&
              pLine.correspondingPythonLines.includes(activePythonLine);

            return (
              <div
                key={pLine.lineNum}
                className={`flex items-start gap-3 px-3.5 py-2 transition-all ${
                  isCurrentActive
                    ? 'bg-amber-500/15 border-l-4 border-amber-400 text-amber-100 font-semibold shadow-sm'
                    : 'hover:bg-slate-900/50 text-slate-300'
                }`}
              >
                {/* Line number */}
                <span className="w-6 shrink-0 text-right text-[11px] text-slate-500 select-none">
                  {pLine.lineNum}
                </span>

                {/* Indented Vietnamese text */}
                <div
                  className="flex-1 font-sans text-xs leading-relaxed"
                  style={{ paddingLeft: `${pLine.indent * 16}px` }}
                >
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {isCurrentActive && (
                      <span className="text-amber-400 inline-flex items-center gap-1 font-bold font-mono text-[10px] bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/40">
                        <ArrowRight className="w-3 h-3" /> ĐANG THỰC HIỆN
                      </span>
                    )}
                    <span
                      className={
                        isCurrentActive
                          ? 'text-amber-200 font-bold'
                          : pLine.indent === 0
                          ? 'text-indigo-300 font-semibold'
                          : 'text-slate-200'
                      }
                    >
                      {pLine.text}
                    </span>
                  </div>

                  {pLine.explanation && (
                    <p className="text-[11px] text-slate-400 font-sans italic mt-0.5 font-normal">
                      💡 {pLine.explanation}
                    </p>
                  )}
                </div>

                {/* Corresponding python line indicator */}
                {pLine.correspondingPythonLines && pLine.correspondingPythonLines.length > 0 && (
                  <span className="text-[10px] font-mono text-slate-500 shrink-0 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                    Dòng Python: {pLine.correspondingPythonLines.join(', ')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Key Rules & High School Exam Tip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-indigo-300">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <span>Quy tắc ghi nhớ nhanh:</span>
          </div>
          <ul className="space-y-1 text-slate-300 pl-4 list-disc text-[11px]">
            {currentKnowledge.keyRules.map((rule, idx) => (
              <li key={idx}>{rule}</li>
            ))}
          </ul>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-emerald-300">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Mẹo khi làm bài kiểm tra Tin học:</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {currentKnowledge.practicalNote}
          </p>
        </div>
      </div>
    </div>
  );
};
