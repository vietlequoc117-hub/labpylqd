// Hệ thống Gợi ý Từ khóa, Hàm dựng sẵn & Gõ tắt (Autocomplete / IntelliSense) chuẩn Python cho Monaco Editor

let pythonCompletionDisposable: { dispose: () => void } | null = null;

interface PythonKeywordItem {
  name: string;
  doc?: string;
}

interface PythonSnippetItem {
  name: string;
  insertText: string;
  doc: string;
}

// Danh sách từ khóa & hàm chuẩn của Python (hiển thị kèm nhãn "keyword")
const PYTHON_KEYWORDS_AND_BUILTINS: PythonKeywordItem[] = [
  // Python Reserved Keywords
  { name: 'False', doc: 'Giá trị logic Sai (Boolean False)' },
  { name: 'None', doc: 'Giá trị rỗng / không xác định (NoneType)' },
  { name: 'True', doc: 'Giá trị logic Đúng (Boolean True)' },
  { name: 'and', doc: 'Toán tử logic VÀ (đúng khi cả 2 vế đều đúng)' },
  { name: 'as', doc: 'Đặt bí danh khi import hoặc bắt ngoại lệ' },
  { name: 'assert', doc: 'Kiểm tra điều kiện đúng, nếu sai báo lỗi AssertionError' },
  { name: 'async', doc: 'Khai báo hàm bất đồng bộ (coroutine)' },
  { name: 'await', doc: 'Đợi kết quả từ hàm bất đồng bộ' },
  { name: 'break', doc: 'Thoát khỏi vòng lặp for / while ngay lập tức' },
  { name: 'class', doc: 'Định nghĩa một lớp (Class) đối tượng' },
  { name: 'continue', doc: 'Bỏ qua phần còn lại của lượt lặp hiện tại, sang lượt kế tiếp' },
  { name: 'def', doc: 'Định nghĩa một hàm mới trong Python' },
  { name: 'del', doc: 'Xóa biến hoặc phần tử trong danh sách/từ điển' },
  { name: 'elif', doc: 'Nhánh kiểm tra điều kiện tiếp theo sau if' },
  { name: 'else', doc: 'Nhánh thực thi khi các điều kiện if/elif đều sai' },
  { name: 'except', doc: 'Bắt và xử lý lỗi ngoại lệ trong khối try...except' },
  { name: 'finally', doc: 'Khối lệnh luôn được thực thi sau try...except' },
  { name: 'for', doc: 'Vòng lặp duyệt qua chuỗi, danh sách hoặc range()' },
  { name: 'from', doc: 'Nhập thành phần cụ thể từ một thư viện (module)' },
  { name: 'global', doc: 'Khai báo sử dụng biến toàn cục bên trong hàm' },
  { name: 'if', doc: 'Câu lệnh rẽ nhánh có điều kiện' },
  { name: 'import', doc: 'Nạp thư viện (module) vào chương trình' },
  { name: 'in', doc: 'Kiểm tra phần tử có nằm trong danh sách/xâu hoặc dùng trong vòng lặp for' },
  { name: 'is', doc: 'Kiểm tra 2 biến có cùng trỏ tới một đối tượng hay không' },
  { name: 'lambda', doc: 'Tạo hàm ẩn danh ngắn gọn trên 1 dòng' },
  { name: 'nonlocal', doc: 'Sử dụng biến của hàm bao ngoài' },
  { name: 'not', doc: 'Toán tử đảo ngược giá trị logic (Phủ định)' },
  { name: 'or', doc: 'Toán tử logic HOẶC (đúng khi ít nhất 1 vế đúng)' },
  { name: 'pass', doc: 'Lệnh giữ chỗ rỗng (không làm gì cả)' },
  { name: 'raise', doc: 'Chủ động phát sinh một ngoại lệ (Exception)' },
  { name: 'return', doc: 'Trả về kết quả từ hàm và kết thúc hàm' },
  { name: 'try', doc: 'Bắt đầu khối lệnh kiểm tra lỗi ngoại lệ' },
  { name: 'while', doc: 'Vòng lặp thực hiện chừng nào điều kiện còn đúng' },
  { name: 'with', doc: 'Quản lý ngữ cảnh tự động (thường dùng khi mở file)' },
  { name: 'yield', doc: 'Trả về giá trị tạm thời từ hàm sinh (generator)' },

  // Python Built-in Functions & Types
  { name: 'abs', doc: 'abs(x) -> Trả về giá trị tuyệt đối của số x' },
  { name: 'all', doc: 'all(iterable) -> Trả về True nếu tất cả phần tử đều đúng' },
  { name: 'any', doc: 'any(iterable) -> Trả về True nếu có ít nhất 1 phần tử đúng' },
  { name: 'ascii', doc: 'ascii(obj) -> Trả về chuỗi biểu diễn chỉ gồm kí tự ASCII' },
  { name: 'bin', doc: 'bin(x) -> Chuyển số nguyên x sang chuỗi nhị phân (0b...)' },
  { name: 'bool', doc: 'bool(x) -> Ép kiểu sang giá trị logic True / False' },
  { name: 'chr', doc: 'chr(i) -> Trả về kí tự có mã ASCII / Unicode là số nguyên i' },
  { name: 'dict', doc: 'dict() -> Tạo từ điển (key-value) mới' },
  { name: 'divmod', doc: 'divmod(a, b) -> Trả về cặp (a // b, a % b)' },
  { name: 'enumerate', doc: 'enumerate(iterable) -> Duyệt kèm cả chỉ số (index, value)' },
  { name: 'eval', doc: 'eval(expr) -> Tính giá trị biểu thức Python dạng chuỗi' },
  { name: 'filter', doc: 'filter(fn, iterable) -> Lọc các phần tử thỏa mãn điều kiện' },
  { name: 'float', doc: 'float(x) -> Chuyển xâu hoặc số sang kiểu số thực' },
  { name: 'format', doc: 'format(value, spec) -> Định dạng giá trị thành chuỗi' },
  { name: 'hex', doc: 'hex(x) -> Chuyển số nguyên x sang hệ thập lục phân (0x...)' },
  { name: 'input', doc: 'input(prompt) -> Đọc một dòng dữ liệu nhập từ bàn phím (trả về str)' },
  { name: 'int', doc: 'int(x) -> Chuyển xâu hoặc số thực sang kiểu số nguyên' },
  { name: 'isinstance', doc: 'isinstance(obj, type) -> Kiểm tra kiểu dữ liệu của biến' },
  { name: 'len', doc: 'len(s) -> Trả về độ dài (số phần tử) của danh sách hoặc xâu kí tự' },
  { name: 'list', doc: 'list(iterable) -> Tạo hoặc chuyển đổi sang danh sách (mảng)' },
  { name: 'map', doc: 'map(fn, iterable) -> Áp dụng hàm fn lên từng phần tử (vd: map(int, input().split()))' },
  { name: 'max', doc: 'max(iterable) -> Tìm giá trị lớn nhất' },
  { name: 'min', doc: 'min(iterable) -> Tìm giá trị nhỏ nhất' },
  { name: 'next', doc: 'next(iterator) -> Lấy phần tử tiếp theo từ iterator' },
  { name: 'oct', doc: 'oct(x) -> Chuyển số nguyên x sang hệ bát phân (0o...)' },
  { name: 'open', doc: 'open(file, mode) -> Mở tệp tin để đọc hoặc ghi' },
  { name: 'ord', doc: 'ord(c) -> Trả về mã số ASCII / Unicode của kí tự c' },
  { name: 'pow', doc: 'pow(x, y[, z]) -> Tính lũy thừa x mũ y (hoặc x^y % z)' },
  { name: 'print', doc: 'print(*objects) -> In giá trị hoặc kết quả ra màn hình' },
  { name: 'range', doc: 'range(start, stop, step) -> Tạo dãy số nguyên cho vòng lặp for' },
  { name: 'repr', doc: 'repr(obj) -> Chuỗi biểu diễn chuẩn của đối tượng' },
  { name: 'reversed', doc: 'reversed(seq) -> Đảo ngược thứ tự các phần tử' },
  { name: 'round', doc: 'round(number[, ndigits]) -> Làm tròn số thực' },
  { name: 'set', doc: 'set(iterable) -> Tạo tập hợp các phần tử không trùng lặp' },
  { name: 'sorted', doc: 'sorted(iterable, reverse=False) -> Trả về danh sách mới đã sắp xếp' },
  { name: 'str', doc: 'str(obj) -> Chuyển đổi giá trị sang kiểu xâu kí tự (chuỗi)' },
  { name: 'sum', doc: 'sum(iterable) -> Tính tổng tất cả các số trong danh sách' },
  { name: 'tuple', doc: 'tuple(iterable) -> Tạo bộ giá trị bất biến' },
  { name: 'type', doc: 'type(obj) -> Trả về kiểu dữ liệu của biến' },
  { name: 'zip', doc: 'zip(*iterables) -> Ghép các phần tử tương ứng từ nhiều danh sách' },
];

// Danh sách các mẫu gõ tắt nhanh (Snippets - hiển thị kèm nhãn "snippet")
const PYTHON_SNIPPETS: PythonSnippetItem[] = [
  {
    name: 'pdb',
    insertText: 'import pdb; pdb.set_trace()',
    doc: 'Chèn điểm dừng gỡ lỗi chuẩn Python (pdb.set_trace)',
  },
  {
    name: 'pdbbb',
    insertText: 'import pdb; pdb.set_trace()',
    doc: 'Chèn nhanh trình gỡ lỗi pdb',
  },
  {
    name: 'pprint',
    insertText: 'from pprint import pprint\npprint(${1:data})',
    doc: 'In cấu trúc dữ liệu đẹp (Pretty Print)',
  },
  {
    name: 'for',
    insertText: 'for ${1:i} in range(${2:n}):\n    ${3:pass}',
    doc: 'Gõ tắt vòng lặp for i in range(n)',
  },
  {
    name: 'forr',
    insertText: 'for ${1:i} in range(${2:0}, ${3:n}):\n    ${4:pass}',
    doc: 'Gõ tắt vòng lặp for i in range(start, stop)',
  },
  {
    name: 'fore',
    insertText: 'for ${1:i}, ${2:x} in enumerate(${3:arr}):\n    ${4:pass}',
    doc: 'Gõ tắt vòng lặp for kèm chỉ số enumerate()',
  },
  {
    name: 'while',
    insertText: 'while ${1:condition}:\n    ${2:pass}',
    doc: 'Gõ tắt vòng lặp while',
  },
  {
    name: 'def',
    insertText: 'def ${1:ten_ham}(${2:tham_so}):\n    ${3:return}',
    doc: 'Gõ tắt khai báo hàm def',
  },
  {
    name: 'if',
    insertText: 'if ${1:dieu_kien}:\n    ${2:pass}',
    doc: 'Gõ tắt câu lệnh điều kiện if',
  },
  {
    name: 'ifelse',
    insertText: 'if ${1:dieu_kien}:\n    ${2:pass}\nelse:\n    ${3:pass}',
    doc: 'Gõ tắt cấu trúc rẽ nhánh if ... else',
  },
  {
    name: 'ifelif',
    insertText: 'if ${1:dieu_kien_1}:\n    ${2:pass}\nelif ${3:dieu_kien_2}:\n    ${4:pass}\nelse:\n    ${5:pass}',
    doc: 'Gõ tắt cấu trúc if ... elif ... else',
  },
  {
    name: 'inpi',
    insertText: '${1:n} = int(input(${2:}))',
    doc: 'Gõ tắt nhập 1 số nguyên từ bàn phím: n = int(input())',
  },
  {
    name: 'inpl',
    insertText: '${1:arr} = [int(x) for x in input().split()]',
    doc: 'Gõ tắt nhập mảng các số nguyên trên 1 dòng',
  },
  {
    name: 'inpm',
    insertText: '${1:a}, ${2:b} = map(int, input().split())',
    doc: 'Gõ tắt nhập nhiều số nguyên trên cùng 1 dòng bằng map(int, ...)',
  },
  {
    name: 'try',
    insertText: 'try:\n    ${1:pass}\nexcept ${2:Exception} as ${3:e}:\n    print(${3:e})',
    doc: 'Gõ tắt khối bắt lỗi try ... except',
  },
  {
    name: 'main',
    insertText: 'if __name__ == "__main__":\n    ${1:pass}',
    doc: 'Điểm bắt đầu chương trình chuẩn Python',
  },
  {
    name: 'lc',
    insertText: '[${1:x} for ${1:x} in ${2:arr}]',
    doc: 'Gõ tắt tạo danh sách nhanh (List Comprehension)',
  },
  {
    name: 'class',
    insertText: 'class ${1:ClassName}:\n    def __init__(self, ${2:args}):\n        ${3:pass}',
    doc: 'Gõ tắt khởi tạo lớp đối tượng (Class)',
  },
];

// Các phương thức thông dụng của Xâu kí tự (str), Danh sách (list), Từ điển (dict)
const PYTHON_METHODS: PythonKeywordItem[] = [
  { name: 'append', doc: 'list.append(x) -> Thêm phần tử x vào cuối danh sách' },
  { name: 'clear', doc: 'Xóa toàn bộ phần tử trong danh sách/từ điển' },
  { name: 'copy', doc: 'Tạo bản sao nông của danh sách/từ điển' },
  { name: 'count', doc: 'seq.count(x) -> Đếm số lần xuất hiện của x' },
  { name: 'endswith', doc: 'str.endswith(suffix) -> Kiểm tra xâu có kết thúc bằng suffix không' },
  { name: 'extend', doc: 'list.extend(iterable) -> Nối thêm nhiều phần tử vào danh sách' },
  { name: 'find', doc: 'str.find(sub) -> Tìm vị trí đầu tiên của xâu con (trả về -1 nếu không có)' },
  { name: 'format', doc: 'str.format(*args) -> Định dạng xâu kí tự' },
  { name: 'get', doc: 'dict.get(key, default) -> Lấy giá trị theo khóa an toàn' },
  { name: 'index', doc: 'seq.index(x) -> Tìm chỉ số đầu tiên của phần tử x' },
  { name: 'insert', doc: 'list.insert(i, x) -> Chèn phần tử x vào vị trí chỉ số i' },
  { name: 'isalnum', doc: 'str.isalnum() -> Kiểm tra xâu chỉ gồm chữ cái hoặc chữ số' },
  { name: 'isalpha', doc: 'str.isalpha() -> Kiểm tra xâu chỉ gồm các chữ cái' },
  { name: 'isdigit', doc: 'str.isdigit() -> Kiểm tra xâu chỉ gồm các chữ số 0-9' },
  { name: 'islower', doc: 'str.islower() -> Kiểm tra toàn bộ chữ cái đều là chữ thường' },
  { name: 'isupper', doc: 'str.isupper() -> Kiểm tra toàn bộ chữ cái đều là chữ hoa' },
  { name: 'items', doc: 'dict.items() -> Lấy danh sách các cặp (key, value)' },
  { name: 'join', doc: 'sep.join(iterable) -> Ghép danh sách các chuỗi thành 1 xâu kí tự' },
  { name: 'keys', doc: 'dict.keys() -> Lấy danh sách các khóa trong từ điển' },
  { name: 'lower', doc: 'str.lower() -> Chuyển toàn bộ xâu sang chữ thường' },
  { name: 'lstrip', doc: 'str.lstrip() -> Xóa khoảng trắng thừa ở bên trái xâu' },
  { name: 'pop', doc: 'list.pop([i]) -> Lấy ra và xóa phần tử tại vị trí i (mặc định là cuối)' },
  { name: 'remove', doc: 'list.remove(x) -> Xóa phần tử đầu tiên có giá trị bằng x' },
  { name: 'replace', doc: 'str.replace(old, new) -> Thay thế xâu con old bằng new' },
  { name: 'reverse', doc: 'list.reverse() -> Đảo ngược danh sách tại chỗ' },
  { name: 'rfind', doc: 'str.rfind(sub) -> Tìm vị trí xuất hiện cuối cùng của xâu con' },
  { name: 'rstrip', doc: 'str.rstrip() -> Xóa khoảng trắng thừa ở bên phải xâu' },
  { name: 'sort', doc: 'list.sort(reverse=False) -> Sắp xếp danh sách tăng dần tại chỗ' },
  { name: 'split', doc: 'str.split(sep) -> Tách xâu thành danh sách các từ theo dấu cách/kí tự' },
  { name: 'startswith', doc: 'str.startswith(prefix) -> Kiểm tra xâu có bắt đầu bằng prefix không' },
  { name: 'strip', doc: 'str.strip() -> Xóa khoảng trắng thừa ở cả 2 đầu xâu' },
  { name: 'title', doc: 'str.title() -> Viết hoa chữ cái đầu mỗi từ' },
  { name: 'upper', doc: 'str.upper() -> Chuyển toàn bộ xâu sang CHỮ HOA' },
  { name: 'values', doc: 'dict.values() -> Lấy danh sách các giá trị trong từ điển' },
];

/**
 * Trích xuất các định danh/từ cục bộ (local) đã xuất hiện trong file và trong bình luận/chuỗi
 * (không lấy chính từ đang gõ dở tại vị trí con trỏ nếu nó chưa xuất hiện ở nơi khác).
 */
function extractLocalWords(
  fullText: string,
  currentWord: string,
  cursorOffset: number,
  wordStartOffset: number
): string[] {
  const regex = /[A-Za-z_][A-Za-z0-9_]*/g;
  const seen = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(fullText)) !== null) {
    const word = match[0];
    const start = match.index;
    const end = start + word.length;

    // Bỏ qua chính từ đang gõ dở ngay tại con trỏ
    if (start === wordStartOffset && end >= cursorOffset) {
      continue;
    }

    if (word.length >= 2) {
      seen.add(word);
    }
  }

  return Array.from(seen);
}

export function registerPythonCompletions(monaco: any): void {
  if (pythonCompletionDisposable) {
    pythonCompletionDisposable.dispose();
    pythonCompletionDisposable = null;
  }

  pythonCompletionDisposable = monaco.languages.registerCompletionItemProvider('python', {
    triggerCharacters: ['.', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '_'],
    provideCompletionItems: (model: any, position: any) => {
      const wordInfo = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: wordInfo.startColumn,
        endColumn: wordInfo.endColumn,
      };

      const lineContent = model.getLineContent(position.lineNumber);
      const textBeforeWord = lineContent.slice(0, Math.max(0, wordInfo.startColumn - 1));
      const isAfterDot = textBeforeWord.trimEnd().endsWith('.');

      const suggestions: any[] = [];

      // Nếu người dùng gõ dấu chấm "." (vd: s. hoặc arr.), ưu tiên gợi ý các phương thức (method)
      if (isAfterDot) {
        for (const method of PYTHON_METHODS) {
          suggestions.push({
            label: {
              label: method.name,
              detail: '  keyword',
            },
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: method.name,
            filterText: method.name,
            sortText: `0_${method.name.toLowerCase()}`,
            documentation: method.doc,
            range,
          });
        }
        return { suggestions };
      }

      // 1. Các từ cục bộ (local) đã có trong chương trình (hiển thị trên cùng với nhãn "local")
      const fullText = model.getValue();
      const cursorOffset = model.getOffsetAt(position);
      const wordStartOffset = model.getOffsetAt({
        lineNumber: position.lineNumber,
        column: wordInfo.startColumn,
      });

      const localWords = extractLocalWords(fullText, wordInfo.word, cursorOffset, wordStartOffset);
      for (const localWord of localWords) {
        suggestions.push({
          label: {
            label: localWord,
            detail: '  local',
          },
          kind: monaco.languages.CompletionItemKind.Text,
          insertText: localWord,
          filterText: localWord,
          sortText: `0_${localWord.toLowerCase()}`,
          range,
        });
      }

      // 2. Các từ khóa & hàm dựng sẵn của Python (hiển thị với nhãn "keyword")
      for (const kw of PYTHON_KEYWORDS_AND_BUILTINS) {
        suggestions.push({
          label: {
            label: kw.name,
            detail: '  keyword',
          },
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw.name,
          filterText: kw.name,
          sortText: `1_${kw.name.toLowerCase()}_1`,
          documentation: kw.doc,
          range,
        });
      }

      // 3. Các mẫu gõ tắt nhanh (hiển thị với nhãn "snippet")
      for (const snip of PYTHON_SNIPPETS) {
        suggestions.push({
          label: {
            label: snip.name,
            detail: '  snippet',
          },
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: snip.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          filterText: snip.name,
          sortText: `1_${snip.name.toLowerCase()}_2`,
          documentation: snip.doc,
          range,
        });
      }

      // 4. Các phương thức phổ biến của chuỗi và danh sách
      for (const method of PYTHON_METHODS) {
        suggestions.push({
          label: {
            label: method.name,
            detail: '  keyword',
          },
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: method.name,
          filterText: method.name,
          sortText: `2_${method.name.toLowerCase()}`,
          documentation: method.doc,
          range,
        });
      }

      return { suggestions };
    },
  });
}
