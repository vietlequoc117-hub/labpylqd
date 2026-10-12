import React from 'react';
import { Table, Check, X, Shield, Zap, Sparkles, AlertCircle } from 'lucide-react';

export const ComplexityMatrixTable: React.FC = () => {
  const data = [
    {
      name: 'Bubble Sort (Sắp Xếp Nổi Bọt)',
      best: 'O(n)',
      avg: 'O(n²)',
      worst: 'O(n²)',
      space: 'O(1)',
      stable: true,
      inplace: true,
      desc: 'Đổi chỗ cặp kề nhau. Đạt O(n) khi mảng đã có thứ tự nhờ cờ swapped.',
      useCase: 'Giảng dạy nhập môn, phát hiện mảng gần như đã sắp xếp.',
    },
    {
      name: 'Selection Sort (Sắp xếp chọn)',
      best: 'O(n²)',
      avg: 'O(n²)',
      worst: 'O(n²)',
      space: 'O(1)',
      stable: false,
      inplace: true,
      desc: 'Tìm min đưa về đầu đoạn. Luôn so sánh n*(n-1)/2 lần.',
      useCase: 'Khi chi phí ghi bộ nhớ (writes/swaps) rất đắt (tối đa chỉ n-1 lần swap).',
    },
    {
      name: 'Insertion Sort (Sắp Xếp Chèn)',
      best: 'O(n)',
      avg: 'O(n²)',
      worst: 'O(n²)',
      space: 'O(1)',
      stable: true,
      inplace: true,
      desc: 'Chèn key vào mảng con đã sắp xếp phía trước.',
      useCase: 'Mảng kích thước nhỏ (n < 30) hoặc mảng gần như đã sắp xếp (Nearly sorted).',
    },
    {
      name: 'Quick Sort (Sắp Xếp Nhanh)',
      best: 'O(n log n)',
      avg: 'O(n log n)',
      worst: 'O(n²)',
      space: 'O(log n)',
      stable: false,
      inplace: true,
      desc: 'Phân hoạch mảng quanh pivot. Nhanh nhất trong thực tế nhờ bộ đệm cache CPU.',
      useCase: 'Sắp xếp thông dụng đa mục đích (General-purpose sorting).',
    },
    {
      name: 'Merge Sort (Sắp Xếp Trộn)',
      best: 'O(n log n)',
      avg: 'O(n log n)',
      worst: 'O(n log n)',
      space: 'O(n)',
      stable: true,
      inplace: false,
      desc: 'Chia để trị chia đôi mảng rồi trộn. Đạt O(n log n) ổn định trong MỌI trường hợp.',
      useCase: 'Khi cần tính ổn định (Stable Sort), dữ liệu lớn ngoài đĩa, hoặc Linked List.',
    },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs flex flex-col h-full text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
            6. Bảng Tổng Hợp Đối Chiếu Độ Phức Tạp Thuật Toán
          </h3>
        </div>
        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
          Big-O Comparison
        </span>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto flex-1 p-3">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase bg-slate-50">
              <th className="py-2.5 px-3">Thuật toán</th>
              <th className="py-2.5 px-2">Best Case</th>
              <th className="py-2.5 px-2">Avg Case</th>
              <th className="py-2.5 px-2">Worst Case</th>
              <th className="py-2.5 px-2">Aux Space</th>
              <th className="py-2.5 px-2 text-center">Ổn định (Stable)</th>
              <th className="py-2.5 px-2 text-center">In-place</th>
              <th className="py-2.5 px-3">Khuyến nghị sử dụng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-3 font-semibold text-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{row.name}</span>
                  </div>
                </td>
                <td className="py-3 px-2 font-mono font-bold text-emerald-700">
                  {row.best}
                </td>
                <td className="py-3 px-2 font-mono font-bold text-amber-700">
                  {row.avg}
                </td>
                <td className="py-3 px-2 font-mono font-bold text-rose-700">
                  {row.worst}
                </td>
                <td className="py-3 px-2 font-mono text-sky-700 font-semibold">
                  {row.space}
                </td>
                <td className="py-3 px-2 text-center">
                  {row.stable ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                      <Check className="w-3 h-3" /> Có
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                      <X className="w-3 h-3 text-slate-400" /> Không
                    </span>
                  )}
                </td>
                <td className="py-3 px-2 text-center">
                  {row.inplace ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                      <Check className="w-3 h-3" /> Có
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-medium px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                      <AlertCircle className="w-3 h-3" /> Mảng phụ
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-[11px] text-slate-600">
                  {row.useCase}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend & Key Takeaway */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-xs">
          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tốc độ trong thực tế</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Quick Sort</strong> thường chạy nhanh nhất nhờ tối ưu bộ nhớ đệm cache (locality of reference), dù Worst-case lý thuyết là O(n²).
            </p>
          </div>

          <div className="p-3 rounded-lg bg-sky-50/60 border border-sky-100">
            <div className="flex items-center gap-1.5 font-bold text-sky-800 mb-1">
              <Shield className="w-3.5 h-3.5 text-sky-600" />
              <span>Tính Ổn Định (Stability)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Thuật toán ổn định bảo toàn thứ tự tương đối của các phần tử trùng giá trị. Rất quan trọng khi sắp xếp theo nhiều tiêu chí (ví dụ: Tên rồi đến Tuổi).
            </p>
          </div>

          <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-100">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Tiết Kiệm Bộ Nhớ (In-place)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Merge Sort</strong> cần thêm O(n) mảng phụ để trộn, trong khi <strong>Bubble, Selection, Insertion, Quick Sort</strong> biến đổi trực tiếp trên mảng gốc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
