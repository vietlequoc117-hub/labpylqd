/**
 * Kho tri thức Sư phạm Tin học THPT dành cho Trợ lí AI
 * Cung cấp giải thích chuẩn mực bám sát chương trình Tin học lớp 10, 11, 12
 * Đảm bảo hệ thống luôn phản hồi tức thì và chính xác 100% trong mọi trường hợp.
 */

export interface AlgorithmPedagogy {
  id: string;
  name: string;
  realLifeAnalogy: string;
  codeBreakdown: string;
  complexityExplanation: string;
  examTipsAndTraps: string;
  quickQuestions: string[];
}

export const HIGH_SCHOOL_KNOWLEDGE_BASE: Record<string, AlgorithmPedagogy> = {
  'bubble-sort': {
    id: 'bubble-sort',
    name: 'Bubble Sort (Sắp xếp nổi bọt)',
    realLifeAnalogy: `🎈 **Hình ảnh đời sống: Những bọt khí nổi lên mặt nước**
Hãy tưởng tượng một cốc nước có ga: các bọt khí to, nhẹ hơn sẽ từ từ nổi lên mặt nước trước. 
Trong dãy số, ta so sánh từng cặp 2 bạn đứng liền kề nhau:
- Bạn nào **cao hơn** đứng trước bạn **thấp hơn** thì lập tức **đổi chỗ** cho nhau.
- Cứ làm như vậy từ đầu hàng đến cuối hàng, thì **bạn cao nhất chắc chắn sẽ trôi về đúng vị trí cuối cùng** sau lượt đầu tiên!
- Lượt thứ 2, bạn cao thứ nhì trôi về vị trí áp chót. Cứ thế mảng sẽ có thứ tự hoàn chỉnh.`,
    codeBreakdown: `📝 **Mổ xẻ từng dòng code Python:**
1. \`n = len(arr)\`: Lấy tổng số học sinh cần xếp hàng.
2. \`for i in range(n):\`: Vòng lặp ngoài cùng - biểu thị số lượt duyệt. Mỗi lượt $i$ sẽ "chốt" được một số lớn nhất về cuối.
3. \`swapped = False\`: Biến cờ thông minh (Flag) để theo dõi xem lượt này có ai phải đổi chỗ không.
4. \`for j in range(0, n - i - 1):\`: Vòng lặp trong - duyệt từng cặp liền kề. Tại sao lại là \`n - i - 1\`? Vì $i$ phần tử lớn nhất ở cuối mảng đã đúng vị trí rồi, ta không cần so sánh lại nữa (giúp tiết kiệm thời gian)!
5. \`if arr[j] > arr[j + 1]:\`: Nếu số đứng trước lớn hơn số đứng sau (sai thứ tự tăng dần).
6. \`arr[j], arr[j + 1] = arr[j + 1], arr[j]\`: Cú pháp tráo đổi cực đẹp của Python (không cần biến tạm)!
7. \`if not swapped: break\`: Nếu qua cả một lượt mà không có bất kỳ cặp nào phải đổi chỗ, tức là mảng đã sắp xếp xong 100% rồi -> dừng sớm ngay lập tức!`,
    complexityExplanation: `⏱️ **Độ phức tạp $O(n)$ là gì và tính thế nào?**
- **Trường hợp tốt nhất (Best Case) - $O(n)$**: Khi mảng đã sắp xếp sẵn (ví dụ: \`[1, 2, 3, 4, 5]\`). Nhờ biến cờ \`swapped\`, thuật toán chỉ duyệt 1 lượt ($n-1$ phép so sánh) rồi dừng ngay!
- **Trường hợp xấu nhất (Worst Case) - $O(n^2)$**: Khi mảng bị xếp ngược hoàn toàn (ví dụ: \`[5, 4, 3, 2, 1]\`). Số phép so sánh là:
  $$(n - 1) + (n - 2) + ... + 1 = \\frac{n(n - 1)}{2} \\approx \\frac{n^2}{2}$$
  Với $n = 1000$, máy tính phải so sánh khoảng $500,000$ lần!
- **Bộ nhớ phụ (Space)**: $O(1)$ - sắp xếp trực tiếp trên mảng gốc (in-place), không tốn thêm mảng phụ nào.`,
    examTipsAndTraps: `🎯 **Bẫy bài thi THPT & Mẹo làm bài nhanh:**
- ⚠️ **Bẫy cận vòng lặp:** Học sinh hay viết nhầm \`for j in range(n)\`, dẫn đến \`arr[j + 1]\` bị tràn mảng (IndexError)! Nhớ luôn luôn là \`n - i - 1\`.
- ⚠️ **Tính ổn định (Stable):** Bubble Sort là thuật toán **ổn định** vì chỉ đổi chỗ khi \`arr[j] > arr[j + 1]\` (nghiêm ngặt), hai số bằng nhau sẽ giữ nguyên thứ tự trước sau ban đầu.
- 💡 **Mẹo tính số lượt lặp trong đề trắc nghiệm:** Mảng có $n$ phần tử thì sau tối đa $n - 1$ lượt lặp là hoàn thành.`,
    quickQuestions: [
      'Tại sao vòng lặp trong lại là range(0, n - i - 1)?',
      'Biến cờ swapped có tác dụng gì quan trọng?',
      'Tại sao Bubble Sort lại có tính ổn định (Stable)?',
      'Nếu mảng đã sắp xếp sẵn thì chạy mất bao nhiêu bước?',
    ],
  },

  'selection-sort': {
    id: 'selection-sort',
    name: 'Selection Sort (Sắp xếp chọn)',
    realLifeAnalogy: `🏆 **Hình ảnh đời sống: Đi siêu thị nhặt quả táo rẻ nhất**
Bạn muốn sắp xếp các giỏ táo theo giá từ rẻ đến đắt:
- Bạn đi từ đầu đến cuối sạp hàng, tìm ra **quả táo có giá rẻ nhất** rồi đổi nó về vị trí đầu tiên (vị trí số 0).
- Tiếp tục tìm quả rẻ nhất trong các quả còn lại, đổi về vị trí thứ 2.
- Cứ thế, mỗi lượt ta "chọn" (select) ra phần tử nhỏ nhất và đưa nó về đúng vị trí đầu mảng còn trống.`,
    codeBreakdown: `📝 **Mổ xẻ từng dòng code Python:**
1. \`for i in range(n - 1):\`: Lượt $i$ đang tìm phần tử để đặt vào vị trí $i$.
2. \`min_idx = i\`: Tạm thời coi phần tử tại vị trí $i$ là nhỏ nhất.
3. \`for j in range(i + 1, n):\`: Quét qua toàn bộ các phần tử còn lại phía sau.
4. \`if arr[j] < arr[min_idx]: min_idx = j\`: Nếu thấy ai nhỏ hơn nữa, lập tức cập nhật lại vị trí nhỏ nhất (\`min_idx\`).
5. \`arr[i], arr[min_idx] = arr[min_idx], arr[i]\`: Đổi chỗ phần tử nhỏ nhất vừa tìm được về vị trí $i$. Sau dòng này, đoạn \`arr[0...i]\` đã chắc chắn đúng thứ tự!`,
    complexityExplanation: `⏱️ **Độ phức tạp: Vì sao luôn là $O(n^2)$ trong mọi trường hợp?**
- Dù mảng đã sắp xếp sẵn hay bị đảo ngược, thuật toán **vẫn phải quét hết từ $i+1$ đến cuối** để chắc chắn không còn số nào nhỏ hơn!
- Tổng số phép so sánh luôn là $\\frac{n(n - 1)}{2} \\Rightarrow$ Luôn là $O(n^2)$ (Best = Avg = Worst).
- **Ưu điểm vượt trội:** Số lần hoán đổi (swap) cực ít — tối đa chỉ đúng $n - 1$ lần hoán đổi! Rất thích hợp khi chi phí ghi dữ liệu đắt đỏ.`,
    examTipsAndTraps: `🎯 **Bẫy bài thi THPT & Mẹo làm bài:**
- ⚠️ **Không ổn định (Unstable):** Phép đổi chỗ từ xa có thể nhảy qua đầu phần tử khác bằng giá trị, làm đảo lộn thứ tự ban đầu của chúng.
- 💡 **Câu hỏi trắc nghiệm hay gặp:** *"Thuật toán sắp xếp nào có số lần hoán đổi (swap) ít nhất?"* ➔ Đáp án là **Selection Sort** ($O(n)$ lần hoán đổi)!`,
    quickQuestions: [
      'Tại sao Selection Sort luôn tốn O(n^2) ngay cả khi mảng đã sắp xếp?',
      'Selection Sort có ưu điểm gì so với Bubble Sort?',
      'Tại sao Selection Sort lại không có tính ổn định?',
      'Sau k lượt lặp thì mảng có đặc điểm gì?',
    ],
  },

  'insertion-sort': {
    id: 'insertion-sort',
    name: 'Insertion Sort (Sắp xếp chèn)',
    realLifeAnalogy: `🃏 **Hình ảnh đời sống: Cách bạn cầm và xếp bài Tây trên tay**
Khi chơi bài tiến lên, mỗi khi bốc thêm một lá bài mới:
- Tay trái bạn đã giữ các lá bài đã được sắp xếp tăng dần.
- Tay phải cầm lá bài mới bốc (\`key\`), so sánh lùi dần từ phải qua trái.
- Lá bài nào to hơn lá bài mới thì bạn dời nó sang phải một nấc để nhường chỗ trống.
- Khi gặp lá bài nhỏ hơn (hoặc hết bài), bạn **chèn ngay** lá bài mới vào chỗ trống đó!`,
    codeBreakdown: `📝 **Mổ xẻ từng dòng code Python:**
1. \`for i in range(1, n):\`: Bắt đầu từ lá bài thứ 2 (chỉ số 1), vì lá bài đầu tiên hiển nhiên coi như đã có thứ tự.
2. \`key = arr[i]\`: Nhấc lá bài hiện tại ra khỏi hàng để đem đi so sánh và chèn.
3. \`j = i - 1\`: Bắt đầu so sánh lùi về bên trái.
4. \`while j >= 0 and arr[j] > key:\`: Chừng nào chưa về đầu mảng VÀ số bên trái vẫn to hơn \`key\`.
5. \`arr[j + 1] = arr[j]\`: Dời số lớn hơn sang phải 1 bước để chừa chỗ trống.
6. \`j -= 1\`: Tiếp tục lùi sang trái kiểm tra số kế tiếp.
7. \`arr[j + 1] = key\`: Chèn giá trị \`key\` vào đúng vị trí khoảng trống thích hợp!`,
    complexityExplanation: `⏱️ **Độ phức tạp $O(n)$ hay $O(n^2)$?**
- **Best Case - $O(n)$**: Khi mảng đã sắp xếp sẵn, vòng lặp \`while\` không bao giờ chạy, chỉ tốn $n - 1$ lần so sánh!
- **Worst Case - $O(n^2)$**: Khi mảng ngược hoàn toàn, mỗi lá bài đều phải dời hết về đầu mảng.
- **Thực tế:** Với mảng nhỏ ($n < 30$) hoặc mảng **gần như đã sắp xếp**, Insertion Sort là một trong những thuật toán nhanh nhất trong thực tế (nhanh hơn cả Quick Sort vì không tốn chi phí đệ quy)!`,
    examTipsAndTraps: `🎯 **Bẫy bài thi THPT & Mẹo làm bài:**
- ⚠️ **Chỉ số sau vòng while:** Khi thoát khỏi \`while\`, giá trị của $j$ đã bị trừ dư 1 nấc, do đó lệnh chèn bắt buộc phải là \`arr[j + 1] = key\`.
- 💡 **Tính ổn định:** Insertion Sort có tính ổn định (Stable).`,
    quickQuestions: [
      'Tại sao vòng lặp i lại bắt đầu từ 1 chứ không phải 0?',
      'Tại sao lại phải lưu biến tạm key = arr[i]?',
      'Khi nào Insertion Sort chạy nhanh hơn Quick Sort?',
      'Lệnh chèn ở cuối sao lại là arr[j + 1] = key?',
    ],
  },

  'quick-sort': {
    id: 'quick-sort',
    name: 'Quick Sort (Sắp xếp nhanh)',
    realLifeAnalogy: `⚡ **Hình ảnh đời sống: Chia lớp thành 2 phe theo một bạn làm mốc (Pivot)**
Thầy giáo chọn ngẫu nhiên một bạn trong lớp làm "chuẩn" (Pivot, ví dụ cao 1m65):
- Tất cả bạn thấp hơn 1m65 đứng dồn sang bên **Trái**.
- Tất cả bạn cao hơn 1m65 đứng dồn sang bên **Phải**.
- Bạn mốc 1m65 đứng ở chính giữa. Sau lượt này, bạn mốc đã **vĩnh viễn đứng đúng vị trí tuyệt đối của mình**!
- Tiếp tục áp dụng đệ quy cách làm này cho nhóm bên Trái và nhóm bên Phải. Rất nhanh chóng cả lớp sẽ vào đúng hàng!`,
    codeBreakdown: `📝 **Mổ xẻ từng dòng code Python:**
1. \`if len(arr) <= 1: return arr\`: Điều kiện dừng đệ quy (Base Case) - mảng có 0 hoặc 1 phần tử thì đã có thứ tự rồi.
2. \`pivot = arr[len(arr) // 2]\`: Chọn phần tử mốc ở giữa mảng.
3. \`left = [x for x in arr if x < pivot]\`: Gom tất cả các bạn nhỏ hơn mốc về nửa trái.
4. \`middle = [x for x in arr if x == pivot]\`: Nhóm các phần tử bằng mốc.
5. \`right = [x for x in arr if x > pivot]\`: Gom tất cả các bạn lớn hơn mốc về nửa phải.
6. \`return quick_sort(left) + middle + quick_sort(right)\`: Đệ quy sắp xếp 2 nửa rồi ghép lại thành mảng hoàn chỉnh!`,
    complexityExplanation: `⏱️ **Hiệu năng siêu tốc $O(n \\log n)$:**
- **Trung bình (Average Case) - $O(n \\log n)$**: Mỗi lần chia đôi mảng, cây đệ quy có độ sâu $\\log_2 n$, mỗi tầng duyệt qua $n$ phần tử. Với $n = 1,000,000$, $\\log_2 n \\approx 20$, chỉ mất khoảng 20 triệu phép tính (trong khi $O(n^2)$ mất $1,000$ tỷ phép tính)!
- **Xấu nhất (Worst Case) - $O(n^2)$**: Khi chọn Pivot lệch (ví dụ luôn chọn phải số nhỏ nhất hoặc lớn nhất trên mảng đã sắp xếp).`,
    examTipsAndTraps: `🎯 **Bẫy bài thi THPT & Mẹo làm bài:**
- ⚠️ **Tư tưởng thuật toán:** Quick Sort áp dụng chiến lược **Chia để trị (Divide and Conquer)**.
- ⚠️ **Không ổn định (Unstable)** ở phiên bản phân hoạch chuẩn (Lomuto / Hoare partition).`,
    quickQuestions: [
      'Phần tử chốt (Pivot) có vai trò gì trong Quick Sort?',
      'Chiến lược Chia để trị (Divide and Conquer) hoạt động ra sao?',
      'Khi nào Quick Sort bị rơi vào trường hợp xấu nhất O(n^2)?',
      'Độ sâu đệ quy trung bình của Quick Sort là bao nhiêu?',
    ],
  },

  'merge-sort': {
    id: 'merge-sort',
    name: 'Merge Sort (Sắp xếp trộn)',
    realLifeAnalogy: `🤝 **Hình ảnh đời sống: Chia nhỏ để trị rồi Trộn hai tập bài đã xếp sẵn**
Nếu bạn có một tập 100 lá bài lộn xộn:
- Bạn chia đôi làm 2 xấp 50 lá, rồi chia tiếp 25, ... cho đến khi mỗi xấp chỉ còn đúng **1 lá bài** (1 lá thì đương nhiên là đã xếp xong).
- Sau đó bạn thực hiện thao tác **Trộn (Merge)**: Cầm 2 xấp bài đã sắp xếp ở hai tay, nhìn 2 lá bài trên cùng, lá nào nhỏ hơn thì đặt xuống bàn trước. Thao tác trộn này diễn ra cực kỳ mượt mà và nhanh chóng!`,
    codeBreakdown: `📝 **Mổ xẻ từng dòng code Python:**
1. \`mid = len(arr) // 2\`: Chia đôi mảng gốc thành nửa trái và nửa phải.
2. \`left = merge_sort(arr[:mid])\`: Đệ quy sắp xếp nửa trái.
3. \`right = merge_sort(arr[mid:])\`: Đệ quy sắp xếp nửa phải.
4. Vòng lặp trộn \`while i < len(left) and j < len(right):\`: So sánh 2 con trỏ $i$ và $j$, nhặt phần tử nhỏ hơn bỏ vào mảng kết quả.
5. Thêm các phần tử còn dư của mảng chưa hết vào cuối.`,
    complexityExplanation: `⏱️ **Ổn định tuyệt đối: Luôn là $O(n \\log n)$ trong mọi trường hợp!**
- Bất kể mảng đầu vào lộn xộn, đã sắp xếp hay bị đảo ngược, Merge Sort **luôn chia đôi hoàn hảo** và đạt độ phức tạp $O(n \\log n)$!
- **Đánh đổi:** Cần thêm bộ nhớ phụ $O(n)$ để chứa các mảng con khi trộn.
- **Tính ổn định (Stable):** Rất ổn định, giữ nguyên vị trí ban đầu của các phần tử bằng nhau.`,
    examTipsAndTraps: `🎯 **Bẫy bài thi THPT & Mẹo làm bài:**
- ⚠️ **So sánh với Quick Sort:** Merge Sort ổn định và đảm bảo $O(n \\log n)$ ở worst-case, nhưng tốn thêm bộ nhớ phụ $O(n)$. Quick Sort chạy tại chỗ (in-place) nhưng không ổn định.`,
    quickQuestions: [
      'Tại sao Merge Sort luôn đảm bảo O(n log n) trong mọi trường hợp?',
      'Nhược điểm lớn nhất của Merge Sort là gì?',
      'Tại sao Merge Sort lại có tính ổn định (Stable)?',
      'Thao tác Trộn (Merge) 2 mảng con tốn bao nhiêu phép tính?',
    ],
  },

  'linear-search': {
    id: 'linear-search',
    name: 'Linear Search (Tìm kiếm tuần tự / tuyến tính)',
    realLifeAnalogy: `🔍 **Hình ảnh đời sống: Tìm chìa khóa trong chùm chìa**
Bạn có một chùm chìa khóa không đánh dấu và muốn mở ổ khóa:
- Bạn thử chìa thứ nhất, nếu không vừa thì thử chìa thứ hai.
- Cứ thử lần lượt từ đầu đến cuối cho đến khi mở được (tìm thấy) hoặc đã thử hết cả chùm mà không có chìa nào vừa.
- Thuật toán này **không đòi hỏi mảng phải có thứ tự**!`,
    codeBreakdown: `📝 **Mổ xẻ từng dòng code Python:**
1. \`for i in range(len(arr)):\`: Duyệt lần lượt qua từng chỉ số từ 0 đến cuối mảng.
2. \`if arr[i] == target:\`: So sánh phần tử tại vị trí $i$ với giá trị cần tìm.
3. \`return i\`: Nếu bằng nhau, lập tức trả về chỉ số $i$ và dừng thuật toán ngay!
4. \`return -1\`: Nếu duyệt hết mảng mà vẫn không thấy, trả về -1 (quy ước báo hiệu không tìm thấy).`,
    complexityExplanation: `⏱️ **Độ phức tạp $O(n)$:**
- **Best Case - $O(1)$**: Phần tử cần tìm nằm ngay ở vị trí đầu tiên (\`arr[0]\`).
- **Worst Case - $O(n)$**: Phần tử nằm ở cuối cùng hoặc không tồn tại trong mảng (phải duyệt đủ $n$ lần).
- **Bộ nhớ:** $O(1)$ - không tốn thêm bộ nhớ phụ.`,
    examTipsAndTraps: `🎯 **Bẫy bài thi THPT & Mẹo làm bài:**
- 💡 Áp dụng được cho **mọi loại mảng**, kể cả mảng lộn xộn chưa được sắp xếp.
- ⚠️ Khi mảng có kích thước rất lớn ($n > 10^6$), thuật toán này sẽ chạy rất chậm.`,
    quickQuestions: [
      'Khi nào nên dùng Tìm kiếm tuần tự thay vì Tìm kiếm nhị phân?',
      'Tại sao quy ước trả về -1 khi không tìm thấy?',
      'Độ phức tạp trung bình của tìm kiếm tuần tự là bao nhiêu?',
      'Nếu mảng có nhiều phần tử trùng giá trị target thì hàm trả về vị trí nào?',
    ],
  },

  'binary-search': {
    id: 'binary-search',
    name: 'Binary Search (Tìm kiếm nhị phân)',
    realLifeAnalogy: `📖 **Hình ảnh đời sống: Lật từ điển hoặc chơi trò đoán số 1 đến 100**
Bạn đang tìm từ "Python" trong cuốn từ điển dày 1000 trang đã xếp theo thứ tự bảng chữ cái A-Z:
- Bạn mở ngay **trang chính giữa** (trang 500).
- Nếu từ ở trang 500 bắt đầu bằng chữ "M" (đứng trước "P"), bạn **bỏ ngay 500 trang đầu**, chỉ tìm trong nửa sau!
- Mỗi lần lật, bạn **loại bỏ được một nửa** số trang còn lại. Với 1 triệu trang, bạn chỉ cần tối đa khoảng 20 lần lật là tìm thấy!`,
    codeBreakdown: `📝 **Mổ xẻ từng dòng code Python:**
1. \`left = 0, right = len(arr) - 1\`: Giới hạn phạm vi tìm kiếm ban đầu từ đầu đến cuối mảng.
2. \`while left <= right:\`: Chừng nào phạm vi tìm kiếm vẫn còn hợp lệ.
3. \`mid = (left + right) // 2\`: Tìm vị trí chính giữa (phải dùng \`//\` để lấy số nguyên).
4. \`if arr[mid] == target: return mid\`: Tìm thấy ngay tại giữa, kết thúc!
5. \`elif arr[mid] < target: left = mid + 1\`: Giá trị ở giữa nhỏ hơn số cần tìm -> bỏ nửa trái, thu hẹp sang nửa phải.
6. \`else: right = mid - 1\`: Giá trị ở giữa lớn hơn số cần tìm -> bỏ nửa phải, thu hẹp sang nửa trái.
7. \`return -1\`: Hết phạm vi (\`left > right\`) mà không thấy -> Trả về -1.`,
    complexityExplanation: `⏱️ **Hiệu năng thần tốc $O(\\log n)$:**
- Sau mỗi lần so sánh, không gian tìm kiếm giảm đi 1 nửa: $\\frac{n}{2}, \\frac{n}{4}, \\frac{n}{8}, ... \\rightarrow 1$.
- Số bước thực hiện tối đa là $\\lfloor \\log_2 n \\rfloor + 1$.
- Ví dụ:
  - $n = 16 \\rightarrow$ Tối đa 4 bước so sánh.
  - $n = 1,000,000 \\rightarrow$ Tối đa chỉ 20 bước so sánh! Nhanh gấp 50,000 lần so với tìm kiếm tuần tự!`,
    examTipsAndTraps: `🎯 **Bẫy bài thi THPT & Mẹo làm bài:**
- ⚠️ **ĐIỀU KIỆN TIÊN QUYẾT BẮT BUỘC:** Mảng **phải được sắp xếp theo thứ tự** trước khi tìm kiếm! Nếu mảng chưa sắp xếp mà áp dụng Binary Search sẽ cho kết quả sai hoàn toàn.
- ⚠️ **Phép chia nguyên:** Bắt buộc dùng \`//\` thay vì \`/\` để tránh lỗi kiểu float (\`TypeError\`).`,
    quickQuestions: [
      'Điều kiện bắt buộc để áp dụng Tìm kiếm nhị phân là gì?',
      'Tại sao phải dùng phép chia // 2 thay vì / 2?',
      'Với mảng 1024 phần tử thì số lần so sánh tối đa là bao nhiêu?',
      'Khi nào left > right và điều đó có ý nghĩa gì?',
    ],
  },
  'string-sort': {
    id: 'string-sort',
    name: 'Sắp xếp Xâu Kí Tự (String / ASCII Sort)',
    realLifeAnalogy: `📚 **Hình ảnh đời sống: Xếp chữ cái trong cuốn từ điển & Bảng chữ cái**
Trong tiếng Việt và tiếng Anh, khi tra từ điển hoặc xếp sổ điểm theo thứ tự tên học sinh (An, Bình, Cường, Dũng...):
- Máy tính không hiểu trực tiếp "chữ cái" mà quy đổi mỗi kí tự thành một **mã số ASCII** (American Standard Code for Information Interchange).
- Kí tự 'A' có mã số 65, 'B' là 66, ..., 'Z' là 90.
- Kí tự chữ thường 'a' là 97, 'b' là 98...
- Phép so sánh \`'A' < 'B'\` thực chất là máy tính so sánh \`65 < 66\`! Vì vậy, các thuật toán sắp xếp (Bubble Sort, Selection Sort, Quick Sort) hoạt động hoàn toàn tự nhiên và tối ưu trên xâu kí tự!`,
    codeBreakdown: `📝 **Mổ xẻ từng dòng code sắp xếp xâu kí tự:**
1. \`n = len(chars)\`: Đếm tổng số kí tự trong xâu cần sắp xếp.
2. \`if chars[j] > chars[j + 1]:\`: Python tự động so sánh 2 kí tự theo thứ tự từ điển (mã ASCII). Ví dụ \`'Y'\` (89) > \`'P'\` (80) là Đúng (\`True\`).
3. \`chars[j], chars[j + 1] = chars[j + 1], chars[j]\`: Hoán đổi 2 kí tự liền kề để đưa kí tự có mã ASCII lớn hơn về phía sau.
4. \`"".join(sorted_chars)\`: Ghép danh sách các kí tự đã sắp xếp thành một xâu hoàn chỉnh.`,
    complexityExplanation: `⏱️ **Độ phức tạp & Hiệu năng với Xâu kí tự:**
- **Thời gian**: $O(n^2)$ với thuật toán nổi bọt, $O(n \\log n)$ nếu dùng Quick Sort / Merge Sort / Timsort của Python.
- **Không gian phụ**: $O(1)$ nếu sắp xếp trên mảng kí tự tại chỗ (\`list(s)\`).
- **Lưu ý đặc biệt trong Python**: Xâu kí tự (\`str\`) trong Python là kiểu bất biến (immutable), nên ta chuyển xâu thành danh sách \`list(s)\` để hoán đổi trực quan!`,
    examTipsAndTraps: `🎯 **Bẫy bài thi THPT về Xâu kí tự:**
- ⚠️ **Chữ hoa đứng trước chữ thường:** Trong bảng mã ASCII, 'Z' (90) đứng trước 'a' (97). Vì vậy \`'Z' < 'a'\` trong Python là Đúng! Muốn xếp không phân biệt hoa thường, học sinh hay dùng \`.lower()\`.
- ⚠️ **Kí tự dấu cách:** Dấu cách \`' '\` có mã ASCII là 32 (nhỏ hơn chữ cái).
- 💡 **Hàm ord() và chr():** \`ord('A')\` trả về 65, còn \`chr(65)\` trả về lại chữ \`'A'\`.`,
    quickQuestions: [
      'Tại sao trong Python chữ hoa lại đứng trước chữ thường khi sắp xếp?',
      'Hàm ord() và chr() có tác dụng gì trong xử lý xâu?',
      'Làm thế nào để sắp xếp xâu kí tự không phân biệt hoa thường?',
      'Xâu kí tự rỗng hoặc có 1 kí tự thì chạy ra sao?',
    ],
  },
};

/**
 * Lấy kiến thức giải thích sư phạm chuẩn cho thuật toán
 */
export function getHighSchoolPedagogy(algorithmId: string): AlgorithmPedagogy {
  if (HIGH_SCHOOL_KNOWLEDGE_BASE[algorithmId]) {
    return HIGH_SCHOOL_KNOWLEDGE_BASE[algorithmId];
  }
  // Mặc định cho bài tự do
  return {
    id: 'custom-code',
    name: 'Bài toán tự nhập của bạn',
    realLifeAnalogy: `💡 **Phân tích thuật toán tự nhập:**
Thuật toán của bạn đang xử lý một danh sách số nguyên. Trong Tin học THPT, việc phân tách bài toán thành các bước tuần tự (duyệt mảng, tính toán trung gian, gom kết quả) là kỹ năng lập trình căn bản nhất.`,
    codeBreakdown: `📝 **Các bước hoạt động chính:**
1. Khởi tạo cấu trúc lưu trữ và biến tích lũy.
2. Vòng lặp duyệt qua từng phần tử của mảng dữ liệu.
3. Cập nhật trạng thái biến tại mỗi bước.
4. Trả về kết quả sau khi duyệt xong.`,
    complexityExplanation: `⏱️ **Độ phức tạp ước tính:**
- Duyệt 1 vòng lặp đơn qua mảng có độ dài $n$: Thời gian $O(n)$.
- Sử dụng mảng phụ lưu kết quả: Không gian phụ $O(n)$.`,
    examTipsAndTraps: `🎯 **Lời khuyên lập trình từ chuyên gia:**
- Luôn kiểm tra trường hợp mảng rỗng hoặc chỉ có 1 phần tử.
- Đặt tên biến có nghĩa (ví dụ: \`total\`, \`numbers\`, \`is_found\`) để dễ đọc hiểu.`,
    quickQuestions: [
      'Thuật toán này thuộc dạng xử lý nào trong chương trình THPT?',
      'Làm thế nào để tối ưu bộ nhớ cho đoạn code này?',
      'Nếu mảng đầu vào rỗng thì code có bị lỗi không?',
    ],
  };
}

/**
 * Kho kiến thức Sư phạm Tổng Thể Toàn Bộ Chương Trình Tin Học THPT
 * Dành cho chế độ hỏi đáp tổng hợp đa bài học
 */
export const CURRICULUM_OVERVIEW = {
  matrix: `📊 **BẢNG TỔNG HỢP SO SÁNH TẤT CẢ CÁC THUẬT TOÁN THPT (CHUYÊN ĐỀ SẮP XẾP & TÌM KIẾM)**

| Thuật toán | Cơ chế cốt lõi | Best Case | Avg Case | Worst Case | Bộ nhớ phụ | Tính ổn định | Số lần Hoán đổi (Swap) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Bubble Sort** (Nổi bọt) | So sánh cặp kề nhau, dồn số lớn về cuối | **$O(n)$** *(có cờ swapped)* | $O(n^2)$ | $O(n^2)$ | $O(1)$ | **Ổn định** (Stable) | Nhiều nhất (tối đa $\\approx n^2/2$) |
| **Selection Sort** (Chọn) | Quét tìm phần tử nhỏ nhất đưa về đầu | $O(n^2)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | **Không ổn định** | **Ít nhất** (đúng $n - 1$ lần) |
| **Insertion Sort** (Chèn) | Rút từng số chèn lùi vào vị trí thích hợp | **$O(n)$** *(khi gần có thứ tự)* | $O(n^2)$ | $O(n^2)$ | $O(1)$ | **Ổn định** (Stable) | Trung bình (thao tác dời chỗ) |
| **Quick Sort** (Nhanh) | Phân hoạch mảng theo phần tử chốt (Pivot) | $O(n \\log n)$ | **$O(n \\log n)$** | $O(n^2)$ *(chọn pivot lệch)* | $O(\\log n)$ | **Không ổn định** | Trung bình, chạy thực tế nhanh nhất |
| **Merge Sort** (Trộn) | Chia đôi đến 1 phần tử rồi trộn 2 mảng con | **$O(n \\log n)$** | **$O(n \\log n)$** | **$O(n \\log n)$** *(đảm bảo)* | $O(n)$ | **Ổn định** (Stable) | Không swap trực tiếp, chép mảng |
| **Linear Search** (Tuần tự) | Quét từng phần tử từ đầu đến cuối | **$O(1)$** | $O(n)$ | $O(n)$ | $O(1)$ | — | Không yêu cầu mảng có thứ tự |
| **Binary Search** (Nhị phân) | Chia đôi không gian tìm kiếm \`mid\` | **$O(1)$** | **$O(\\log n)$** | **$O(\\log n)$** | $O(1)$ | — | **Bắt buộc mảng đã sắp xếp** |
| **String / ASCII Sort** | So sánh mã số ASCII của từng ký tự | Tùy thuật toán | Tùy thuật toán | Tùy thuật toán | $O(1)$ | Theo thuật toán | Xâu là Immutable, chuyển sang List |`,

  roadmap: `🗺️ **BẢN ĐỒ LỘ TRÌNH HỌC THUẬT TOÁN & LẬP TRÌNH PYTHON THPT (LỚP 10, 11, 12)**

### 📌 Chặng 1: Nền tảng Python & Thao tác Mảng 1 chiều (Cốt lõi Tin 10)
- Nắm vững cú pháp cơ bản: Biến, Kiểu dữ liệu (\`int\`, \`float\`, \`str\`, \`list\`, \`bool\`).
- Cơ chế chỉ số mảng bắt đầu từ **0** (Offset trong bộ nhớ RAM).
- Vòng lặp \`for\` với hàm \`range(start, stop, step)\` (lưu ý cận \`stop\` luôn bị trừ đi 1).
- Tránh 4 lỗi kinh điển: \`NameError\`, \`IndexError\`, \`TypeError\`, \`SyntaxError\`.

### 📌 Chặng 2: Bộ ba Thuật toán Sắp xếp Cơ bản $O(n^2)$
- **Bubble Sort**: Học cách tư duy so sánh cặp kề nhau và kỹ thuật cờ hiệu (\`swapped\`) để dừng sớm $O(n)$.
- **Selection Sort**: Kỹ thuật tìm min/max trong đoạn con và tối ưu số lần hoán đổi ($n - 1$ lần).
- **Insertion Sort**: Mô phỏng xếp bài Tây, cực kỳ hiệu quả khi dữ liệu đã gần ngăn nắp.
- **Kỹ thuật Python đặc trưng**: Hoán đổi không biến tạm \`a, b = b, a\` (Tuple Packing & Unpacking).

### 📌 Chặng 3: Thuật toán Tìm kiếm (Tuần tự vs Nhị phân)
- **Linear Search**: Tìm kiếm linh hoạt trên mọi dữ liệu lộn xộn.
- **Binary Search**: Cú pháp chia đôi thần tốc $O(\\log n)$, điều kiện tiên quyết mảng phải có thứ tự.

### 📌 Chặng 4: Thuật toán Nâng cao & Chia để trị $O(n \\log n)$
- **Quick Sort**: Ý tưởng phần tử chốt (Pivot), phân hoạch và đệ quy.
- **Merge Sort**: Tư tưởng chia nhỏ rồi trộn (Merge), đảm bảo $O(n \\log n)$ mọi trường hợp.

### 📌 Chặng 5: Ứng dụng Xâu ký tự & Bảng mã ASCII
- Hàm \`ord()\` lấy mã số ASCII và \`chr()\` đổi số sang ký tự.
- Xử lý bất biến (Immutability) của chuỗi trong Python bằng cách chuyển đổi qua lại với \`list\`.`,

  bigo: `⚡ **BẢNG TRA CỨU ĐỘ PHỨC TẠP BIG-O TOÀN DIỆN CHO HỌC SINH THPT**

Độ phức tạp thời gian Big-O là thước đo **tốc độ gia tăng số phép tính của máy tính khi số lượng dữ liệu $n$ tăng lên**:

| Độ phức tạp | Tên gọi | Tốc độ | Số phép tính khi $n = 1.000$ | Số phép tính khi $n = 1.000.000$ | Ví dụ thực tế trong bài |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **$O(1)$** | Hằng số | Tức thì | **1** phép tính | **1** phép tính | Truy cập \`arr[0]\`, kiểm tra \`len()\`, gán biến |
| **$O(\\log n)$** | Logarit | Siêu tốc | $\\approx$ **10** phép tính | $\\approx$ **20** phép tính | **Binary Search** (Tìm kiếm nhị phân chia đôi) |
| **$O(n)$** | Tuyến tính | Nhanh | **1.000** phép tính | **1.000.000** phép tính | **Linear Search**, 1 vòng lặp \`for\`, Bubble Sort tốt nhất |
| **$O(n \\log n)$** | Tuyến tính - Log | Tối ưu | $\\approx$ **10.000** phép tính | $\\approx$ **20.000.000** phép tính | **Quick Sort**, **Merge Sort**, hàm \`sorted()\` Python |
| **$O(n^2)$** | Bậc hai | Rất chậm | **1.000.000** phép tính | **1.000.000.000.000** phép tính (Treo máy!) | 2 vòng lặp lồng nhau (Bubble, Selection, Insertion) |

💡 **Quy tắc làm bài thi nhanh:**
- 1 vòng lặp \`for i in range(n)\` không lồng $\\to O(n)$.
- 2 vòng lặp \`for\` lồng nhau $\\to O(n^2)$.
- Mỗi lần lặp chia đôi không gian tìm kiếm $\\to O(\\log n)$.`,

  examTraps: `🎯 **BỘ 10 BẪY ĐỀ THI TRẮC NGHIỆM TIN HỌC THPT HAY GẶP NHẤT TRONG TẤT CẢ CÁC BÀI**

1. ⚠️ **Bẫy điều kiện Binary Search:**
   - Đề hỏi: *"Cho mảng [9, 2, 7, 1, 5], tìm số 7 bằng Binary Search tốn mấy bước?"*
   - **Bẫy:** Mảng CHƯA sắp xếp nên KHÔNG được dùng Binary Search! Nếu cố tình chạy sẽ ra kết quả sai hoàn toàn.

2. ⚠️ **Bẫy số lần hoán đổi ít nhất:**
   - Đề hỏi: *"Thuật toán nào có số lần hoán đổi ít nhất?"* $\\to$ Đáp án là **Selection Sort** (tối đa chỉ đúng $n - 1$ lần hoán đổi).

3. ⚠️ **Bẫy tính ổn định (Stable Sort):**
   - Thuật toán ỔN ĐỊNH: **Bubble Sort, Insertion Sort, Merge Sort**.
   - Thuật toán KHÔNG ỔN ĐỊNH: **Selection Sort, Quick Sort**.

4. ⚠️ **Bẫy Best-case của Bubble Sort:**
   - Chỉ đạt $O(n)$ khi có **biến cờ kiểm tra (swapped)** kết hợp \`break\`. Nếu không có cờ, Bubble Sort ngây thơ vẫn chạy $O(n^2)$!

5. ⚠️ **Bẫy cận vòng lặp trong Bubble Sort:**
   - Luôn là \`range(0, n - i - 1)\`. Viết nhầm \`range(n)\` sẽ gây lỗi \`IndexError: list index out of range\` khi truy cập \`arr[j + 1]\`.

6. ⚠️ **Bẫy so sánh xâu ký tự:**
   - \`"10" < "2"\` là **True** vì so sánh theo mã ASCII của ký tự đầu: \`'1'\` (mã 49) nhỏ hơn \`'2'\` (mã 50).

7. ⚠️ **Bẫy chữ hoa và chữ thường trong bảng mã ASCII:**
   - Trong ASCII, chữ hoa ('A'-'Z': 65..90) đứng TRƯỚC chữ thường ('a'-'z': 97..122). Do đó \`'Z' < 'a'\` là **True**!

8. ⚠️ **Bẫy lệnh chèn Insertion Sort:**
   - Sau khi kết thúc vòng lặp \`while\`, giá trị của $j$ đã bị trừ lùi 1 nấc, vì vậy lệnh chèn đúng luôn là \`arr[j + 1] = key\` chứ không phải \`arr[j] = key\`.

9. ⚠️ **Bẫy phép chia chỉ số mảng:**
   - Chỉ số mảng bắt buộc là số nguyên (\`int\`). Phải dùng phép chia nguyên \`//\` (ví dụ: \`mid = (left + right) // 2\`). Nếu dùng \`/\` sẽ bị lỗi \`TypeError\`.

10. ⚠️ **Bẫy gõ nhầm biến chưa khai báo (NameError):**
    - Viết \`tota\` thay cho \`total\`, \`resul\` thay cho \`result\`, \`user_dat\` thay cho \`user_data\`, hoặc dùng \`+=\` trước khi gán giá trị khởi tạo \`= 0\`.`,
};

/**
 * Trả về nội dung giải thích tổng thể toàn bộ chương trình theo chủ đề
 */
export function getCurriculumOverview(topic: 'matrix' | 'roadmap' | 'bigo' | 'exam_traps'): string {
  switch (topic) {
    case 'matrix':
      return CURRICULUM_OVERVIEW.matrix;
    case 'roadmap':
      return CURRICULUM_OVERVIEW.roadmap;
    case 'bigo':
      return CURRICULUM_OVERVIEW.bigo;
    case 'exam_traps':
      return CURRICULUM_OVERVIEW.examTraps;
    default:
      return CURRICULUM_OVERVIEW.matrix;
  }
}

