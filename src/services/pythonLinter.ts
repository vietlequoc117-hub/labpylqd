export interface PythonLintError {
  id: string;
  line: number;
  column: number;
  endColumn?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  category: 'symbol' | 'keyword' | 'syntax' | 'semantics';
  rule: string;
  suggestion?: string;
  fixable?: boolean;
}

export interface LintResult {
  errors: PythonLintError[];
  warnings: PythonLintError[];
  infos: PythonLintError[];
  isValid: boolean;
  canAutoFix: boolean;
  stats: {
    symbolErrors: number;
    keywordErrors: number;
    syntaxErrors: number;
    semanticErrors: number;
  };
}

// Danh sách từ khóa chuẩn của Python
const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
  'while', 'with', 'yield',
]);

// Danh sách các hàm & kiểu dữ liệu Built-in thông dụng trong Python
const PYTHON_BUILTINS = new Set([
  'abs', 'all', 'any', 'ascii', 'bin', 'bool', 'breakpoint', 'bytearray', 'bytes',
  'callable', 'chr', 'classmethod', 'compile', 'complex', 'delattr', 'dict',
  'dir', 'divmod', 'enumerate', 'eval', 'exec', 'filter', 'float', 'format',
  'frozenset', 'getattr', 'globals', 'hasattr', 'hash', 'help', 'hex', 'id',
  'input', 'int', 'isinstance', 'issubclass', 'iter', 'len', 'list', 'locals',
  'map', 'max', 'min', 'next', 'object', 'oct', 'open', 'ord', 'pow', 'print',
  'property', 'range', 'repr', 'reversed', 'round', 'set', 'setattr', 'slice',
  'sorted', 'staticmethod', 'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip',
  'sys', 'math', 'random', 'os', 'time',
]);

/**
 * Loại bỏ chuỗi ký tự ("..." hoặc '...') và comment (#...) để phân tích cú pháp an toàn
 */
function stripStringsAndComments(line: string): string {
  // Bỏ comment
  let clean = line.replace(/#.*$/, '');
  // Thay thế chuỗi kép và chuỗi đơn bằng khoảng trắng giữ nguyên độ dài
  clean = clean.replace(/"(?:\\.|[^"\\])*"/g, (m) => ' '.repeat(m.length));
  clean = clean.replace(/'(?:\\.|[^'\\])*'/g, (m) => ' '.repeat(m.length));
  return clean;
}

/**
 * Chuyên gia phân tích cú pháp & ngữ nghĩa Python cấp cao (Senior Python Diagnostic Engine)
 * Phát hiện toàn diện 4 nhóm lỗi kinh điển của học sinh:
 * 1. Thiếu dấu (dấu hai chấm :, ngoặc (), [], {}, dấu nháy chuỗi, dấu phẩy giữa các phần tử)
 * 2. Từ khóa & Gõ sai (typo từ khóa, gõ nhầm true/false viết thường, null, 'o'/'O' thay cho số 0, 'l' thay cho số 1)
 * 3. Cú pháp & Thụt lề (IndentationError, toán tử C/JS như &&, ||, !, ++, nhầm = và ==, arr(i) thay vì arr[i])
 * 4. Ngữ nghĩa & Logic (Biến chưa khai báo NameError, chia float trong chỉ số mảng, chia cho 0, phương thức mảng sai .push/.add, hoán đổi ghi đè)
 */
export function lintPythonCode(code: string): LintResult {
  const errors: PythonLintError[] = [];
  const warnings: PythonLintError[] = [];
  const infos: PythonLintError[] = [];

  if (!code || !code.trim()) {
    return {
      errors,
      warnings,
      infos,
      isValid: true,
      canAutoFix: false,
      stats: { symbolErrors: 0, keywordErrors: 0, syntaxErrors: 0, semanticErrors: 0 },
    };
  }

  const lines = code.split('\n');

  // Theo dõi các biến và hàm đã được khai báo
  const declaredVariables = new Set<string>();
  const definedFunctions: { name: string; line: number; params: string[] }[] = [];

  let expectedIndentLevel: number | null = null;
  let inMultiLineParen = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNum = i + 1;
    const trimmed = rawLine.trim();

    // Bỏ qua dòng trống
    if (!trimmed) continue;

    // Bỏ qua comment hoàn toàn
    if (trimmed.startsWith('#')) continue;

    const codeWithoutStrComment = stripStringsAndComments(rawLine);
    const trimmedClean = codeWithoutStrComment.trim();

    // Thụt lề dòng hiện tại
    const indentMatch = rawLine.match(/^(\s*)/);
    const indentSpaces = indentMatch ? indentMatch[1].length : 0;

    // =========================================================================
    // LỖI THỤT LỀ DÒNG ĐẦU TIÊN (FIRST LINE INDENTATION)
    // =========================================================================
    if (i === 0 && indentSpaces > 0) {
      errors.push({
        id: `unexpected-indent-first-line`,
        line: 1,
        column: 1,
        severity: 'error',
        category: 'syntax',
        rule: 'unexpected-indent',
        message: 'Dòng 1: Lỗi thụt lề bất thường (IndentationError: unexpected indent). Dòng đầu tiên của chương trình không được thụt lề.',
        suggestion: trimmed,
        fixable: true,
      });
    }

    // =========================================================================
    // NHÓM 1: THIẾU DẤU (PUNCTUATION & SYMBOLS)
    // =========================================================================

    // 1.1 Khai báo hàm def thiếu cặp ngoặc tròn () (Ví dụ: def inu: hoặc def inu)
    if (/^\s*def\s+[a-zA-Z_]\w*\s*(:|$)/.test(trimmedClean) && !/def\s+[a-zA-Z_]\w*\s*\(/.test(trimmedClean)) {
      const fnNameMatch = trimmedClean.match(/def\s+([a-zA-Z_]\w*)/);
      const fnName = fnNameMatch ? fnNameMatch[1] : '';
      errors.push({
        id: `missing-fn-parens-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(fnName) + fnName.length + 1,
        severity: 'error',
        category: 'symbol',
        rule: 'missing-function-parentheses',
        message: `Dòng ${lineNum}: Khai báo hàm "def ${fnName}" thiếu cặp ngoặc đơn "()".`,
        suggestion: `Sửa thành: def ${fnName}():`,
        fixable: true,
      });
    }

    // 1.2 Thiếu dấu hai chấm (:) ở các khối lệnh bắt buộc
    const headerKeywords = [
      { regex: /^def\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*$/, keyword: 'def', name: 'khai báo hàm def' },
      { regex: /^for\s+([a-zA-Z_]\w*|\([^)]*\))\s+in\s+.*$/, keyword: 'for', name: 'vòng lặp for' },
      { regex: /^while\s+.*$/, keyword: 'while', name: 'vòng lặp while' },
      { regex: /^if\s+.*$/, keyword: 'if', name: 'câu lệnh điều kiện if' },
      { regex: /^elif\s+.*$/, keyword: 'elif', name: 'nhánh điều kiện elif' },
      { regex: /^else\s*$/, keyword: 'else', name: 'nhánh else' },
      { regex: /^try\s*$/, keyword: 'try', name: 'khối try' },
      { regex: /^except(\s+.*)?$/, keyword: 'except', name: 'khối except' },
      { regex: /^finally\s*$/, keyword: 'finally', name: 'khối finally' },
      { regex: /^class\s+.*$/, keyword: 'class', name: 'khai báo lớp (class)' },
      { regex: /^with\s+.*$/, keyword: 'with', name: 'câu lệnh with' },
    ];

    for (const item of headerKeywords) {
      if (item.regex.test(trimmedClean)) {
        if (!trimmedClean.endsWith(':')) {
          errors.push({
            id: `missing-colon-${lineNum}`,
            line: lineNum,
            column: rawLine.length + 1,
            endColumn: rawLine.length + 2,
            severity: 'error',
            category: 'symbol',
            rule: 'missing-colon',
            message: `Dòng ${lineNum}: Thiếu dấu hai chấm ":" ở cuối ${item.name}.`,
            suggestion: `${trimmedClean}:`,
            fixable: true,
          });
        }
      }
    }

    // 1.3 Thiếu dấu đóng chuỗi (Unterminated string literal)
    const quoteCountSingle = (rawLine.match(/(?<!\\)'/g) || []).length;
    const quoteCountDouble = (rawLine.match(/(?<!\\)"/g) || []).length;
    if (quoteCountSingle % 2 !== 0 && !rawLine.includes("'''")) {
      errors.push({
        id: `unterminated-string-single-${lineNum}`,
        line: lineNum,
        column: rawLine.lastIndexOf("'") + 1,
        severity: 'error',
        category: 'symbol',
        rule: 'unterminated-string',
        message: `Dòng ${lineNum}: Chuỗi ký tự thiếu dấu đóng nháy đơn "'".`,
        suggestion: rawLine.trimEnd() + "'",
        fixable: true,
      });
    } else if (quoteCountDouble % 2 !== 0 && !rawLine.includes('"""')) {
      errors.push({
        id: `unterminated-string-double-${lineNum}`,
        line: lineNum,
        column: rawLine.lastIndexOf('"') + 1,
        severity: 'error',
        category: 'symbol',
        rule: 'unterminated-string',
        message: `Dòng ${lineNum}: Chuỗi ký tự thiếu dấu đóng nháy kép '"'.`,
        suggestion: rawLine.trimEnd() + '"',
        fixable: true,
      });
    }

    // 1.4 Khớp các cặp ngoặc đơn (), ngoặc vuông [], ngoặc nhọn {}
    const openParens = (codeWithoutStrComment.match(/\(/g) || []).length;
    const closeParens = (codeWithoutStrComment.match(/\)/g) || []).length;
    if (openParens > closeParens) {
      inMultiLineParen += openParens - closeParens;
      errors.push({
        id: `unclosed-paren-${lineNum}`,
        line: lineNum,
        column: rawLine.lastIndexOf('(') + 1,
        severity: 'error',
        category: 'symbol',
        rule: 'unclosed-paren',
        message: `Dòng ${lineNum}: Thiếu ${openParens - closeParens} dấu đóng ngoặc tròn ")".`,
        suggestion: rawLine.trimEnd() + ')'.repeat(openParens - closeParens),
        fixable: true,
      });
    } else if (closeParens > openParens) {
      errors.push({
        id: `extra-paren-${lineNum}`,
        line: lineNum,
        column: rawLine.lastIndexOf(')') + 1,
        severity: 'error',
        category: 'symbol',
        rule: 'extra-paren',
        message: `Dòng ${lineNum}: Dư thừa dấu đóng ngoặc tròn ")".`,
        fixable: false,
      });
    }

    const openBrackets = (codeWithoutStrComment.match(/\[/g) || []).length;
    const closeBrackets = (codeWithoutStrComment.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      errors.push({
        id: `unclosed-bracket-${lineNum}`,
        line: lineNum,
        column: rawLine.lastIndexOf('[') + 1,
        severity: 'error',
        category: 'symbol',
        rule: 'unclosed-bracket',
        message: `Dòng ${lineNum}: Thiếu dấu đóng ngoặc vuông "]".`,
        suggestion: rawLine.trimEnd() + ']',
        fixable: true,
      });
    } else if (closeBrackets > openBrackets) {
      errors.push({
        id: `extra-bracket-${lineNum}`,
        line: lineNum,
        column: rawLine.lastIndexOf(']') + 1,
        severity: 'error',
        category: 'symbol',
        rule: 'extra-bracket',
        message: `Dòng ${lineNum}: Dư thừa dấu đóng ngoặc vuông "]".`,
        fixable: false,
      });
    }

    // 1.5 Dấu chấm phẩy ";" thừa cuối dòng (ảnh hưởng thói quen C/C++/Java)
    if (trimmedClean.endsWith(';')) {
      warnings.push({
        id: `semicolon-trailing-${lineNum}`,
        line: lineNum,
        column: rawLine.lastIndexOf(';') + 1,
        severity: 'warning',
        category: 'symbol',
        rule: 'trailing-semicolon',
        message: `Dòng ${lineNum}: Thừa dấu chấm phẩy ";" ở cuối dòng. Trong Python câu lệnh không cần dấu chấm phẩy.`,
        suggestion: trimmedClean.replace(/;+$/, ''),
        fixable: true,
      });
    }

    // 1.6 Thiếu dấu phẩy giữa các phần tử mảng: ví dụ numbers = [5 2 8 1 3]
    const spaceSeparatedListMatch = codeWithoutStrComment.match(/\[\s*(-?\d+(?:\.\d+)?(?:\s+-?\d+(?:\.\d+)?)+)\s*\]/);
    if (spaceSeparatedListMatch) {
      const wrongList = spaceSeparatedListMatch[1];
      const fixedList = wrongList.trim().split(/\s+/).join(', ');
      errors.push({
        id: `missing-commas-in-list-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('[') + 1,
        severity: 'error',
        category: 'symbol',
        rule: 'missing-commas-in-list',
        message: `Dòng ${lineNum}: Danh sách thiếu dấu phẩy "," ngăn cách giữa các phần tử.`,
        suggestion: `Sửa thành: [${fixedList}]`,
        fixable: true,
      });
    }

    // =========================================================================
    // NHÓM 2: TỪ KHÓA & GÕ SAI (KEYWORDS & TYPOS)
    // =========================================================================

    // 2.1 Boolean viết thường: true / false (Lỗi kinh điển của học sinh quen JS/C++/Java)
    const lowercaseBoolMatch = codeWithoutStrComment.match(/\b(true|false)\b/);
    if (lowercaseBoolMatch) {
      const wrongVal = lowercaseBoolMatch[1];
      const correctVal = wrongVal === 'true' ? 'True' : 'False';
      errors.push({
        id: `lowercase-boolean-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(wrongVal) + 1,
        severity: 'error',
        category: 'keyword',
        rule: 'lowercase-boolean',
        message: `Dòng ${lineNum}: Viết sai giá trị boolean "${wrongVal}". Trong Python giá trị đúng/sai bắt buộc phải viết hoa chữ cái đầu: "${correctVal}".`,
        suggestion: rawLine.replace(new RegExp(`\\b${wrongVal}\\b`, 'g'), correctVal),
        fixable: true,
      });
    }

    // 2.2 Null / Nil / None viết thường
    const nullMatch = codeWithoutStrComment.match(/\b(null|nil|none)\b/);
    if (nullMatch && !codeWithoutStrComment.includes('def none')) {
      const wrongVal = nullMatch[1];
      errors.push({
        id: `null-literal-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(wrongVal) + 1,
        severity: 'error',
        category: 'keyword',
        rule: 'null-literal',
        message: `Dòng ${lineNum}: Trong Python giá trị rỗng/không xác định là "None" (viết hoa chữ N), không dùng "${wrongVal}".`,
        suggestion: rawLine.replace(new RegExp(`\\b${wrongVal}\\b`, 'g'), 'None'),
        fixable: true,
      });
    }

    // 2.3 function hoặc func thay vì def
    const funcMatch = trimmedClean.match(/^(function|func)\s+([a-zA-Z_]\w*)/);
    if (funcMatch) {
      errors.push({
        id: `func-keyword-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(funcMatch[1]) + 1,
        severity: 'error',
        category: 'keyword',
        rule: 'function-keyword',
        message: `Dòng ${lineNum}: Trong Python để khai báo hàm bắt buộc dùng từ khóa "def", không dùng "${funcMatch[1]}".`,
        suggestion: rawLine.replace(/^(?:\s*)(?:function|func)\b/, 'def'),
        fixable: true,
      });
    }

    // 2.4 else if thay vì elif
    if (/^\s*else\s+if\b/.test(trimmedClean)) {
      errors.push({
        id: `else-if-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('else if') + 1,
        severity: 'error',
        category: 'keyword',
        rule: 'else-if-keyword',
        message: `Dòng ${lineNum}: Python không có cú pháp "else if". Bạn phải dùng từ khóa "elif".`,
        suggestion: rawLine.replace(/\belse\s+if\b/, 'elif'),
        fixable: true,
      });
    }

    // 2.5 Lỗi gõ sai chính tả các từ khóa & hàm cơ bản
    const keywordTypos = [
      { regex: /\bpritn\b|\bprnt\b|\bprintt\b/i, correct: 'print', name: 'hàm in print()' },
      { regex: /\brang\b|\bragne\b|\brangge\b|\brnage\b|\braneg\b/i, correct: 'range', name: 'hàm range()' },
      { regex: /\bwhlie\b|\bwhil\b|\bwile\b/i, correct: 'while', name: 'vòng lặp while' },
      { regex: /\bfro\b|\bfo\b(?=\s+[a-zA-Z_])/i, correct: 'for', name: 'vòng lặp for' },
      { regex: /\bintput\b|\binptu\b|\binpt\b/i, correct: 'input', name: 'hàm nhập input()' },
      { regex: /\bretrun\b|\bretun\b|\breturnn\b/i, correct: 'return', name: 'từ khóa return' },
      { regex: /\bture\b/i, correct: 'True', name: 'giá trị boolean True' },
      { regex: /\bflase\b/i, correct: 'False', name: 'giá trị boolean False' },
      { regex: /\blenght\b|\blengh\b|\blegth\b/i, correct: 'len', name: 'hàm đo độ dài len()' },
      { regex: /\bbreka\b|\bbaerk\b/i, correct: 'break', name: 'lệnh dừng break' },
      { regex: /\bcontineu\b|\bcontinew\b/i, correct: 'continue', name: 'lệnh tiếp tục continue' },
      { regex: /\bimprot\b/i, correct: 'import', name: 'lệnh import' },
      { regex: /\beliff\b/i, correct: 'elif', name: 'nhánh elif' },
      { regex: /\besle\b/i, correct: 'else', name: 'nhánh else' },
    ];

    for (const typo of keywordTypos) {
      const match = trimmedClean.match(typo.regex);
      if (match) {
        errors.push({
          id: `typo-${lineNum}-${typo.correct}`,
          line: lineNum,
          column: rawLine.indexOf(match[0]) + 1,
          severity: 'error',
          category: 'keyword',
          rule: 'typo',
          message: `Dòng ${lineNum}: Viết sai chính tả "${match[0]}". Bạn muốn viết là "${typo.correct}"?`,
          suggestion: rawLine.replace(typo.regex, typo.correct),
          fixable: true,
        });
      }
    }

    // 2.6 Gõ nhầm chữ cái 'o' hoặc 'O' thay cho số 0 (Ví dụ: total = o, x = o)
    const assignLetterOMatch = trimmedClean.match(/^([a-zA-Z_]\w*\s*=\s*)([oO])(\s*)$/);
    if (assignLetterOMatch) {
      const varName = trimmedClean.split('=')[0].trim();
      const letter = assignLetterOMatch[2];
      errors.push({
        id: `letter-o-zero-typo-${lineNum}`,
        line: lineNum,
        column: rawLine.lastIndexOf(letter) + 1,
        severity: 'error',
        category: 'keyword',
        rule: 'letter-o-zero-typo',
        message: `Dòng ${lineNum}: Gán biến "${varName} = ${letter}" bằng chữ cái "${letter}". Có phải bạn gõ nhầm chữ cái "${letter}" thay vì chữ số 0 không?`,
        suggestion: `${varName} = 0`,
        fixable: true,
      });
    }

    // 2.7 Gõ nhầm chữ cái 'l' (chữ L thường) hoặc 'I' thay cho số 1
    const assignLetterLMatch = trimmedClean.match(/^([a-zA-Z_]\w*\s*=\s*)([lI])(\s*)$/);
    if (assignLetterLMatch) {
      const varName = trimmedClean.split('=')[0].trim();
      errors.push({
        id: `letter-l-one-typo-${lineNum}`,
        line: lineNum,
        column: rawLine.lastIndexOf(assignLetterLMatch[2]) + 1,
        severity: 'error',
        category: 'keyword',
        rule: 'letter-l-one-typo',
        message: `Dòng ${lineNum}: Gán biến "${varName} = ${assignLetterLMatch[2]}" bằng chữ cái. Có phải bạn muốn gán số 1 không?`,
        suggestion: `${varName} = 1`,
        fixable: true,
      });
    }

    // =========================================================================
    // NHÓM 3: CÚ PHÁP & TOÁN TỬ (SYNTAX & OPERATORS)
    // =========================================================================

    // 3.1 Dùng ngoặc tròn arr(i) thay vì ngoặc vuông arr[i] khi truy cập phần tử mảng
    const roundParenIndexingMatch = codeWithoutStrComment.match(/\b([a-zA-Z_]\w*)\s*\(\s*([a-zA-Z_]\w*(?:\s*[\+\-]\s*\w+)?|\d+)\s*\)/);
    if (roundParenIndexingMatch) {
      const varName = roundParenIndexingMatch[1];
      const indexExpr = roundParenIndexingMatch[2];
      if (!PYTHON_BUILTINS.has(varName) && !PYTHON_KEYWORDS.has(varName)) {
        if (
          /^(i|j|k|mid|idx|index|\d+|n\s*-\s*1)$/.test(indexExpr.trim()) ||
          ['arr', 'numbers', 'a', 'b', 'data', 'lst', 'list'].includes(varName.toLowerCase())
        ) {
          errors.push({
            id: `paren-indexing-${lineNum}`,
            line: lineNum,
            column: rawLine.indexOf(`${varName}(`) + 1,
            severity: 'error',
            category: 'syntax',
            rule: 'paren-indexing-error',
            message: `Dòng ${lineNum}: Dùng ngoặc tròn "${varName}(${indexExpr})" để truy cập phần tử. Trong Python, chỉ số mảng bắt buộc phải dùng ngoặc vuông "${varName}[${indexExpr}]".`,
            suggestion: rawLine.replace(new RegExp(`\\b${varName}\\s*\\(\\s*${indexExpr.replace('+', '\\+')}\\s*\\)`), `${varName}[${indexExpr}]`),
            fixable: true,
          });
        }
      }
    }

    // 3.2 Dùng toán tử C/Java/JS thay vì toán tử chuẩn của Python
    // && -> and
    if (/&&/.test(codeWithoutStrComment)) {
      errors.push({
        id: `operator-and-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('&&') + 1,
        severity: 'error',
        category: 'syntax',
        rule: 'operator-and',
        message: `Dòng ${lineNum}: Python không dùng toán tử "&&". Bạn cần dùng từ khóa "and".`,
        suggestion: rawLine.replace(/&&/g, 'and'),
        fixable: true,
      });
    }

    // || -> or
    if (/\|\|/.test(codeWithoutStrComment)) {
      errors.push({
        id: `operator-or-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('||') + 1,
        severity: 'error',
        category: 'syntax',
        rule: 'operator-or',
        message: `Dòng ${lineNum}: Python không dùng toán tử "||". Bạn cần dùng từ khóa "or".`,
        suggestion: rawLine.replace(/\|\|/g, 'or'),
        fixable: true,
      });
    }

    // !var -> not var (toán tử phủ định)
    const notOpMatch = codeWithoutStrComment.match(/(?<![!=<>])!\s*([a-zA-Z_]\w*)/);
    if (notOpMatch) {
      const targetVar = notOpMatch[1];
      errors.push({
        id: `exclamation-not-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('!') + 1,
        severity: 'error',
        category: 'syntax',
        rule: 'exclamation-not',
        message: `Dòng ${lineNum}: Python không dùng dấu "!" để phủ định. Bạn cần dùng từ khóa "not ${targetVar}".`,
        suggestion: rawLine.replace(new RegExp(`!\\s*${targetVar}\\b`), `not ${targetVar}`),
        fixable: true,
      });
    }

    // ++ hoặc -- (Ví dụ: i++, count--)
    const incrementMatch = trimmedClean.match(/([a-zA-Z_]\w*)\s*(\+\+|--)/);
    if (incrementMatch) {
      const varName = incrementMatch[1];
      const op = incrementMatch[2] === '++' ? '+=' : '-=';
      errors.push({
        id: `operator-increment-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(incrementMatch[0]) + 1,
        severity: 'error',
        category: 'syntax',
        rule: 'no-increment-decrement',
        message: `Dòng ${lineNum}: Python không hỗ trợ toán tử "${incrementMatch[2]}". Bạn cần viết là "${varName} ${op} 1".`,
        suggestion: rawLine.replace(incrementMatch[0], `${varName} ${op} 1`),
        fixable: true,
      });
    }

    // := gán kiểu Pascal ở đầu câu lệnh
    if (/^[a-zA-Z_]\w*\s*:=\s*[^=]/.test(trimmedClean)) {
      const varName = trimmedClean.split(':=')[0].trim();
      const val = trimmedClean.split(':=')[1].trim();
      errors.push({
        id: `pascal-assignment-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(':=') + 1,
        severity: 'error',
        category: 'syntax',
        rule: 'pascal-assignment',
        message: `Dòng ${lineNum}: Trong Python phép gán giá trị biến dùng một dấu "=", không dùng ":=" như Pascal.`,
        suggestion: `${varName} = ${val}`,
        fixable: true,
      });
    }

    // 3.3 Nhầm lẫn phép gán '=' thay vì so sánh '==' trong câu lệnh điều kiện if/elif/while
    if (/^(if|elif|while)\s+/.test(trimmedClean)) {
      const assignmentRegex = /(?<![<>=!])=(?!=)/;
      if (assignmentRegex.test(trimmedClean) && !trimmedClean.includes('==')) {
        errors.push({
          id: `single-equal-${lineNum}`,
          line: lineNum,
          column: rawLine.indexOf('=') + 1,
          severity: 'error',
          category: 'syntax',
          rule: 'assignment-in-condition',
          message: `Dòng ${lineNum}: Bạn đang dùng phép gán "=" trong câu lệnh điều kiện. Phép so sánh bằng trong Python phải dùng "==".`,
          suggestion: trimmedClean.replace(assignmentRegex, '=='),
          fixable: true,
        });
      }
    }

    // 3.4 Nhầm lẫn phép so sánh '==' thay vì gán '=' ở đầu dòng (Ví dụ: total == 0)
    if (/^[a-zA-Z_]\w*\s*==\s*[^=]/.test(trimmedClean) && !/^(if|elif|while|assert|return)/.test(trimmedClean)) {
      const varName = trimmedClean.split('==')[0].trim();
      const val = trimmedClean.split('==')[1].trim();
      errors.push({
        id: `double-equal-assignment-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('==') + 1,
        severity: 'error',
        category: 'syntax',
        rule: 'double-equal-in-assignment',
        message: `Dòng ${lineNum}: Bạn đang dùng "==" để gán giá trị cho biến "${varName}". Để gán giá trị, bạn chỉ dùng 1 dấu "=": "${varName} = ${val}".`,
        suggestion: `${varName} = ${val}`,
        fixable: true,
      });
    }

    // 3.5 Biểu thức không có phép gán (Statement has no effect / Missing += or =)
    // Ví dụ: total + x hoặc i + 1 hoặc count + 1 đứng một mình
    const unassignedMatch = trimmedClean.match(
      /^([a-zA-Z_]\w*)\s*([\+\-\*\/%]|(?:\/\/)|(?:\*\*))\s*([^=<>!]+)$/
    );
    if (
      unassignedMatch &&
      !trimmedClean.startsWith('return ') &&
      !trimmedClean.startsWith('print(') &&
      !trimmedClean.startsWith('yield ') &&
      !trimmedClean.includes('=') &&
      !trimmedClean.includes('(')
    ) {
      const varName = unassignedMatch[1];
      const op = unassignedMatch[2];
      const restExpr = unassignedMatch[3].trim();
      errors.push({
        id: `unassigned-expression-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(varName) + 1,
        severity: 'error',
        category: 'syntax',
        rule: 'unassigned-expression',
        message: `Dòng ${lineNum}: Phép tính "${trimmedClean}" không lưu kết quả! Biến "${varName}" sẽ không được cộng dồn và không đổi giá trị.`,
        suggestion: `${varName} ${op}= ${restExpr}  (hoặc ${varName} = ${varName} ${op} ${restExpr})`,
        fixable: true,
      });
    }

    // 3.6 Hàm print thiếu ngoặc tròn (thói quen Python 2)
    if (/^\s*print\s+[^(]/.test(trimmedClean) && !/^\s*print\s*$/.test(trimmedClean)) {
      const printArg = trimmedClean.replace(/^\s*print\s+/, '').replace(/;*$/, '');
      errors.push({
        id: `print-without-parens-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('print') + 1,
        severity: 'error',
        category: 'syntax',
        rule: 'print-without-parens',
        message: `Dòng ${lineNum}: Trong Python 3, "print" là một hàm và bắt buộc phải có cặp ngoặc tròn: print(...).`,
        suggestion: `print(${printArg})`,
        fixable: true,
      });
    }

    // 3.7 Kiểm tra thụt lề sau dấu hai chấm (:)
    if (expectedIndentLevel !== null && inMultiLineParen === 0) {
      if (indentSpaces <= expectedIndentLevel) {
        errors.push({
          id: `indent-error-${lineNum}`,
          line: lineNum,
          column: 1,
          severity: 'error',
          category: 'syntax',
          rule: 'indentation',
          message: `Dòng ${lineNum}: Lỗi thụt lề (IndentationError). Khối lệnh con sau dấu ":" bắt buộc phải thụt vào trong (thường là 4 dấu cách).`,
          suggestion: '    ' + trimmed,
          fixable: true,
        });
      }
      expectedIndentLevel = null;
    }

    if (trimmedClean.endsWith(':') || headerKeywords.some((k) => k.regex.test(trimmedClean))) {
      expectedIndentLevel = indentSpaces;
    }

    // =========================================================================
    // NHÓM 4: NGỮ NGHĨA & LOGIC (SEMANTICS & LOGIC)
    // =========================================================================

    // 4.1 Thu thập khai báo hàm và tham số
    const defMatch = trimmedClean.match(/^def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/);
    if (defMatch) {
      const fnName = defMatch[1];
      const params = defMatch[2].split(',').map((p) => p.trim()).filter(Boolean);
      definedFunctions.push({ name: fnName, line: lineNum, params });
      declaredVariables.add(fnName);
      params.forEach((p) => declaredVariables.add(p));
    }

    // 4.2 Thu thập biến từ vòng lặp for: for x in arr: hoặc for i, val in enumerate(arr):
    const forMatch = trimmedClean.match(/^for\s+([^:]+)\s+in\s+/);
    if (forMatch) {
      const rawVars = forMatch[1].replace(/[()]/g, '').split(',');
      rawVars.forEach((v) => {
        const cleanedVar = v.trim();
        if (/^[a-zA-Z_]\w*$/.test(cleanedVar)) {
          declaredVariables.add(cleanedVar);
        }
      });
    }

    // 4.3 Thu thập biến từ phép gán: a = ..., a, b = ..., a += ...
    const assignMatch = trimmedClean.match(/^([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)\s*(\+=|-=|\*=|\/=|%=|=)/);
    if (assignMatch && !/^(if|elif|while)/.test(trimmedClean)) {
      const vars = assignMatch[1].split(',').map((v) => v.trim());
      vars.forEach((v) => {
        if (/^[a-zA-Z_]\w*$/.test(v)) {
          declaredVariables.add(v);
        }
      });
    }

    // 4.4 Kiểm tra biến chưa được định nghĩa (Undefined Variable / NameError)
    const forIterableMatch = trimmedClean.match(/^for\s+[^:]+\s+in\s+([a-zA-Z_]\w*)\s*:/);
    if (forIterableMatch) {
      const iterableName = forIterableMatch[1];
      if (
        !declaredVariables.has(iterableName) &&
        !PYTHON_BUILTINS.has(iterableName) &&
        !PYTHON_KEYWORDS.has(iterableName)
      ) {
        errors.push({
          id: `undefined-var-in-for-${lineNum}`,
          line: lineNum,
          column: rawLine.indexOf(iterableName) + 1,
          severity: 'error',
          category: 'semantics',
          rule: 'undefined-variable',
          message: `Dòng ${lineNum}: Biến "${iterableName}" được duyệt qua nhưng chưa từng được khai báo hay gán giá trị ở các dòng trước (Lỗi NameError).`,
          suggestion: `Hãy tạo mảng "${iterableName} = [1, 2, 3]" trước vòng lặp này.`,
          fixable: false,
        });
      }
    }

    // 4.5 Chỉ số mảng chứa phép chia số thực "/" (Index must be int, not float)
    const floatDivIndexing = codeWithoutStrComment.match(/\[[^\]]*\b[a-zA-Z0-9_\(\)]+\s*\/\s*[a-zA-Z0-9_\(\)]+[^\]]*\]/);
    if (floatDivIndexing && !floatDivIndexing[0].includes('//')) {
      errors.push({
        id: `float-div-indexing-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('/') + 1,
        severity: 'error',
        category: 'semantics',
        rule: 'float-div-indexing',
        message: `Dòng ${lineNum}: Chỉ số mảng chứa phép chia số thực "/". Trong Python 3, chỉ số mảng phải là số nguyên int, hãy dùng phép chia nguyên "//" (ví dụ: arr[len(arr) // 2]).`,
        suggestion: rawLine.replace(/([a-zA-Z0-9_\)]+)\s*\/\s*([a-zA-Z0-9_\(]+)/, '$1 // $2'),
        fixable: true,
      });
    }

    // 4.6 Các phương thức mảng bị nhầm từ JS / Java / C++
    // arr.push(x) -> arr.append(x)
    const pushMatch = trimmedClean.match(/([a-zA-Z_]\w*)\.push\s*\(/);
    if (pushMatch) {
      errors.push({
        id: `method-push-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('.push') + 1,
        severity: 'error',
        category: 'semantics',
        rule: 'wrong-list-method',
        message: `Dòng ${lineNum}: Trong Python danh sách (List) không có phương thức ".push()". Bạn cần dùng ".append()".`,
        suggestion: rawLine.replace(/\.push\(/g, '.append('),
        fixable: true,
      });
    }

    // arr.add(x) trên List
    const addMatch = trimmedClean.match(/([a-zA-Z_]\w*)\.add\s*\(/);
    if (addMatch) {
      warnings.push({
        id: `method-add-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('.add') + 1,
        severity: 'warning',
        category: 'semantics',
        rule: 'wrong-list-method',
        message: `Dòng ${lineNum}: Nếu "${addMatch[1]}" là danh sách (List), hãy dùng ".append()" thay vì ".add()".`,
        suggestion: rawLine.replace(/\.add\(/g, '.append('),
        fixable: true,
      });
    }

    // arr.size() hoặc arr.length -> len(arr)
    const sizeMatch = trimmedClean.match(/([a-zA-Z_]\w*)\.(size\(\)|length)/);
    if (sizeMatch) {
      const varName = sizeMatch[1];
      errors.push({
        id: `method-size-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(sizeMatch[0]) + 1,
        severity: 'error',
        category: 'semantics',
        rule: 'wrong-len-method',
        message: `Dòng ${lineNum}: Để lấy độ dài của "${varName}" trong Python, bạn phải dùng hàm "len(${varName})".`,
        suggestion: rawLine.replace(`${varName}.${sizeMatch[2]}`, `len(${varName})`),
        fixable: true,
      });
    }

    // 4.7 Kiểm tra chia cho 0 tĩnh (ZeroDivisionError)
    const zeroDivMatch = trimmedClean.match(/(?:[\+\-\*\/%]\s*|\/|\/\/|%)\s*0\b(?!\.)/);
    if (zeroDivMatch && !trimmedClean.includes('==') && !trimmedClean.includes('!=')) {
      const actualDivByZero = trimmedClean.match(/\/(\/)?\s*0\b|%\s*0\b/);
      if (actualDivByZero) {
        errors.push({
          id: `zero-division-${lineNum}`,
          line: lineNum,
          column: rawLine.indexOf('0') + 1,
          severity: 'error',
          category: 'semantics',
          rule: 'zero-division',
          message: `Dòng ${lineNum}: Lỗi chia cho số 0 (ZeroDivisionError). Mẫu số trong phép chia hoặc chia lấy dư bắt buộc phải khác 0.`,
          fixable: false,
        });
      }
    }

    // 4.8 Lỗi hoán đổi mảng bị ghi đè dữ liệu (Flawed swap overwrite)
    if (i < lines.length - 1) {
      const nextLine = lines[i + 1].trim();
      const swapOver1 = trimmedClean.match(/^([a-zA-Z_]\w*\[[^\]]+\])\s*=\s*([a-zA-Z_]\w*\[[^\]]+\])$/);
      if (swapOver1) {
        const left1 = swapOver1[1];
        const right1 = swapOver1[2];
        const swapOver2 = nextLine.match(/^([a-zA-Z_]\w*\[[^\]]+\])\s*=\s*([a-zA-Z_]\w*\[[^\]]+\])$/);
        if (swapOver2 && swapOver2[1] === right1 && swapOver2[2] === left1) {
          errors.push({
            id: `flawed-swap-overwrite-${lineNum}`,
            line: lineNum,
            column: 1,
            severity: 'error',
            category: 'semantics',
            rule: 'flawed-swap-overwrite',
            message: `Dòng ${lineNum}-${lineNum + 1}: Lỗi hoán đổi mảng bị ghi đè! Gán "${left1} = ${right1}" làm mất giá trị gốc của "${left1}".`,
            suggestion: `Trong Python, hãy hoán đổi đồng thời bằng cú pháp chuẩn: ${left1}, ${right1} = ${right1}, ${left1}`,
            fixable: true,
          });
        }
      }
    }

    // 4.9 Biến lặp trùng tên với danh sách: for arr in arr:
    const shadowIterMatch = trimmedClean.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+([a-zA-Z_]\w*)\s*:/);
    if (shadowIterMatch && shadowIterMatch[1] === shadowIterMatch[2]) {
      warnings.push({
        id: `shadow-loop-var-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(shadowIterMatch[1]) + 1,
        severity: 'warning',
        category: 'semantics',
        rule: 'shadow-loop-variable',
        message: `Dòng ${lineNum}: Biến lặp "${shadowIterMatch[1]}" trùng tên với mảng đang duyệt. Biến này sẽ ghi đè và làm mất mảng gốc!`,
        suggestion: `Đổi thành: for item in ${shadowIterMatch[2]}:`,
        fixable: true,
      });
    }
  }

  // 4.10 Kiểm tra hàm đã định nghĩa nhưng chưa có lệnh gọi chạy ở cuối chương trình
  const fullCodeWithoutDef = code.replace(/def\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*:/g, '');
  for (const fn of definedFunctions) {
    const callRegex = new RegExp(`(^|\\s|\\b)${fn.name}\\s*\\(`, 'm');
    if (!callRegex.test(fullCodeWithoutDef)) {
      const sampleArgs = fn.params.length > 0 ? fn.params.map(() => 'numbers').join(', ') : '';
      warnings.push({
        id: `uncalled-function-${fn.name}`,
        line: fn.line,
        column: 1,
        severity: 'warning',
        category: 'semantics',
        rule: 'uncalled-function',
        message: `Hàm "${fn.name}()" đã được định nghĩa nhưng chưa được gọi để chạy ở cuối bài.`,
        suggestion: `Thêm lệnh gọi hàm ở cuối: ${fn.name}(${sampleArgs})`,
        fixable: true,
      });
    }
  }

  // Thống kê từng nhóm lỗi
  const stats = {
    symbolErrors: errors.filter((e) => e.category === 'symbol').length,
    keywordErrors: errors.filter((e) => e.category === 'keyword').length,
    syntaxErrors: errors.filter((e) => e.category === 'syntax').length,
    semanticErrors: errors.filter((e) => e.category === 'semantics').length,
  };

  const isValid = errors.length === 0;
  const canAutoFix = errors.some((e) => e.fixable) || warnings.some((w) => w.fixable);

  return { errors, warnings, infos, isValid, canAutoFix, stats };
}

/**
 * Tự động sửa nhanh tất cả các lỗi có thể sửa tự động (dấu :, phép gán, ngoặc, toán tử...)
 */
export function autoFixPythonCode(code: string): { fixedCode: string; fixesApplied: string[] } {
  const lines = code.split('\n');
  const fixesApplied: string[] = [];

  const headerKeywords = [
    /^(\s*def\s+[a-zA-Z_]\w*\s*\([^)]*\))\s*$/,
    /^(\s*for\s+([a-zA-Z_]\w*|\([^)]*\))\s+in\s+.*)$/,
    /^(\s*while\s+.*)$/,
    /^(\s*if\s+.*)$/,
    /^(\s*elif\s+.*)$/,
    /^(\s*else)\s*$/,
    /^(\s*try)\s*$/,
    /^(\s*except(\s+.*)?)$/,
    /^(\s*finally)\s*$/,
    /^(\s*class\s+.*)$/,
  ];

  const definedFunctions: { name: string; params: string[] }[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    // 0. Sửa thụt lề dòng đầu tiên
    if (i === 0 && line.startsWith(' ')) {
      line = line.trimStart();
      lines[i] = line;
      fixesApplied.push('Dòng 1: Xóa khoảng trắng thụt lề ở dòng đầu tiên.');
    }

    // 1. Thêm cặp ngoặc đơn () nếu def thiếu
    const defNoParenMatch = line.match(/^(\s*def\s+[a-zA-Z_]\w*)\s*(:|$)/);
    if (defNoParenMatch && !line.includes('(')) {
      line = line.replace(/def\s+([a-zA-Z_]\w*)\s*(:|$)/, 'def $1():');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Bổ sung cặp ngoặc () và dấu : cho hàm.`);
    }

    // 2. Tự động thêm dấu : vào cuối câu lệnh
    if (!line.trim().endsWith(':')) {
      for (const regex of headerKeywords) {
        if (regex.test(line)) {
          line = line.trimEnd() + ':';
          lines[i] = line;
          fixesApplied.push(`Dòng ${i + 1}: Thêm dấu ":" vào cuối câu lệnh.`);
          break;
        }
      }
    }

    // 3. Thu thập hàm
    const defMatch = trimmed.match(/^def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/);
    if (defMatch) {
      definedFunctions.push({
        name: defMatch[1],
        params: defMatch[2].split(',').map((p) => p.trim()).filter(Boolean),
      });
    }

    // 4. Sửa boolean viết thường: true -> True, false -> False
    if (/\btrue\b/.test(line)) {
      line = line.replace(/\btrue\b/g, 'True');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi "true" thành "True".`);
    }
    if (/\bfalse\b/.test(line)) {
      line = line.replace(/\bfalse\b/g, 'False');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi "false" thành "False".`);
    }

    // 5. Sửa null -> None
    if (/\bnull\b/.test(line)) {
      line = line.replace(/\bnull\b/g, 'None');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi "null" thành "None".`);
    }

    // 6. Sửa function/func -> def
    if (/^\s*(?:function|func)\b/.test(line)) {
      line = line.replace(/^(?:\s*)(?:function|func)\b/, 'def');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi từ khóa thành "def".`);
    }

    // 7. Sửa else if -> elif
    if (/\belse\s+if\b/.test(line)) {
      line = line.replace(/\belse\s+if\b/g, 'elif');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi "else if" thành "elif".`);
    }

    // 8. Sửa nhầm '=' thành '==' trong if/elif/while
    if (/^(if|elif|while)\s+/.test(trimmed)) {
      const assignmentRegex = /(?<![<>=!])=(?!=)/;
      if (assignmentRegex.test(line) && !line.includes('==')) {
        line = line.replace(assignmentRegex, '==');
        lines[i] = line;
        fixesApplied.push(`Dòng ${i + 1}: Sửa dấu gán "=" thành so sánh "==".`);
      }
    }

    // 9. Sửa '==' thành '=' khi gán biến ở đầu dòng
    if (/^\s*[a-zA-Z_]\w*\s*==\s*[^=]/.test(line) && !/^(if|elif|while|assert|return)/.test(trimmed)) {
      line = line.replace('==', '=');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Sửa "==" thành dấu gán "=".`);
    }

    // 10. Sửa := thành =
    if (/^\s*[a-zA-Z_]\w*\s*:=\s*[^=]/.test(line)) {
      line = line.replace(':=', '=');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Sửa phép gán ":=" thành "=".`);
    }

    // 11. Bổ sung ngoặc đơn thiếu
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    if (openParens > closeParens) {
      const needed = openParens - closeParens;
      line = line.trimEnd() + ')'.repeat(needed);
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Thêm ${needed} dấu đóng ngoặc ")".`);
    }

    // 12. Sửa toán tử C/JS: && -> and, || -> or, !var -> not var, i++ -> i += 1
    if (/&&/.test(line)) {
      line = line.replace(/&&/g, 'and');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi toán tử "&&" thành "and".`);
    }
    if (/\|\|/.test(line)) {
      line = line.replace(/\|\|/g, 'or');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi toán tử "||" thành "or".`);
    }
    if (/(?<![!=<>])!\s*([a-zA-Z_]\w*)/.test(line)) {
      line = line.replace(/(?<![!=<>])!\s*([a-zA-Z_]\w*)/g, 'not $1');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi toán tử "!" thành "not".`);
    }
    const incMatch = line.match(/([a-zA-Z_]\w*)\s*(\+\+|--)/);
    if (incMatch) {
      const op = incMatch[2] === '++' ? '+=' : '-=';
      line = line.replace(incMatch[0], `${incMatch[1]} ${op} 1`);
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi "${incMatch[2]}" thành "${op} 1".`);
    }

    // 13. Sửa phương thức mảng .push -> .append
    if (/\.push\s*\(/.test(line)) {
      line = line.replace(/\.push\(/g, '.append(');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi ".push()" thành ".append()".`);
    }

    // 14. Sửa chia float trong mảng [n / 2] -> [n // 2]
    if (/\[[^\]]*\b[a-zA-Z0-9_\(\)]+\s*\/\s*[a-zA-Z0-9_\(\)]+[^\]]*\]/.test(line) && !line.includes('//')) {
      line = line.replace(/([a-zA-Z0-9_\)]+)\s*\/\s*([a-zA-Z0-9_\(]+)/, '$1 // $2');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi phép chia "/" thành chia nguyên "//" trong chỉ số mảng.`);
    }

    // 15. Sửa gõ nhầm chữ cái 'o' hoặc 'O' thành số 0 (Ví dụ: total = o -> total = 0)
    const assignLetterOMatch = line.match(/^(\s*[a-zA-Z_]\w*\s*=\s*)([oO])(\s*)$/);
    if (assignLetterOMatch) {
      line = `${assignLetterOMatch[1]}0${assignLetterOMatch[3]}`;
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi chữ cái "${assignLetterOMatch[2]}" thành số 0.`);
    }

    // 16. Sửa biểu thức thiếu phép gán (Ví dụ: total + x -> total += x, i + 1 -> i += 1)
    const unassignedMatch = trimmed.match(
      /^([a-zA-Z_]\w*)\s*([\+\-\*\/%]|(?:\/\/)|(?:\*\*))\s*([^=<>!]+)$/
    );
    if (
      unassignedMatch &&
      !trimmed.startsWith('return ') &&
      !trimmed.startsWith('print(') &&
      !trimmed.startsWith('yield ') &&
      !trimmed.includes('=') &&
      !trimmed.includes('(')
    ) {
      const varName = unassignedMatch[1];
      const op = unassignedMatch[2];
      const restExpr = unassignedMatch[3].trim();
      const indent = line.match(/^(\s*)/)?.[1] || '';
      line = `${indent}${varName} ${op}= ${restExpr}`;
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Chuyển phép tính "${trimmed}" thành phép gán tích lũy "${varName} ${op}= ${restExpr}".`);
    }

    // 17. Sửa mảng số thiếu dấu phẩy [1 2 3 4]
    const spaceSepMatch = line.match(/\[\s*(-?\d+(?:\.\d+)?(?:\s+-?\d+(?:\.\d+)?)+)\s*\]/);
    if (spaceSepMatch) {
      const fixed = spaceSepMatch[1].trim().split(/\s+/).join(', ');
      line = line.replace(spaceSepMatch[0], `[${fixed}]`);
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Thêm dấu phẩy ngăn cách các phần tử mảng: [${fixed}].`);
    }

    // 18. Bỏ dấu chấm phẩy thừa cuối dòng
    if (line.trimEnd().endsWith(';')) {
      line = line.replace(/;+\s*$/, '');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Xóa dấu chấm phẩy ";" thừa ở cuối dòng.`);
    }
  }

  // 19. Tự động thêm lệnh gọi hàm ở cuối nếu có hàm chưa được gọi
  const fullCodeJoined = lines.join('\n');
  const codeWithoutDef = fullCodeJoined.replace(/def\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*:/g, '');

  for (const fn of definedFunctions) {
    const callRegex = new RegExp(`(^|\\s|\\b)${fn.name}\\s*\\(`, 'm');
    if (!callRegex.test(codeWithoutDef)) {
      const sampleArgs = fn.params.length > 0 ? fn.params.map(() => '[5, 2, 8, 1, 3]').join(', ') : '';
      lines.push('');
      lines.push(`# Tự động gọi hàm ${fn.name} để thực thi chương trình:`);
      lines.push(`${fn.name}(${sampleArgs})`);
      fixesApplied.push(`Thêm lệnh gọi hàm "${fn.name}(${sampleArgs})" ở cuối code.`);
    }
  }

  return {
    fixedCode: lines.join('\n'),
    fixesApplied,
  };
}

/**
 * Dịch các thông báo lỗi runtime Python sang tiếng Việt dễ hiểu
 */
export function translatePythonErrorToVietnamese(rawError: string): {
  title: string;
  vietnameseExplanation: string;
  suggestion: string;
  line?: number;
} {
  if (!rawError) {
    return {
      title: 'Lỗi không xác định',
      vietnameseExplanation: 'Đã xảy ra lỗi khi thực thi chương trình.',
      suggestion: 'Hãy kiểm tra lại cú pháp câu lệnh trong bài.',
    };
  }

  // Trích xuất số dòng lỗi nếu có
  const lineMatch = rawError.match(/line\s+(\d+)/i) || rawError.match(/dòng\s+(\d+)/i);
  const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined;

  if (rawError.includes('SyntaxError')) {
    let specificExplanation = line
      ? `Câu lệnh ở dòng ${line} viết sai quy tắc ngữ pháp của Python.`
      : 'Có câu lệnh viết sai quy tắc ngữ pháp của Python.';
    let specificSuggestion =
      'Kiểm tra xem dòng lệnh có thiếu dấu hai chấm ":" ở cuối (def, for, if), thiếu dấu đóng ngoặc ")", hoặc nhầm dấu "=" và "==" không.';

    if (rawError.includes("expected ':'")) {
      specificExplanation = `Dòng ${line || ''} thiếu dấu hai chấm ":" bắt buộc ở cuối câu lệnh (ví dụ: def, for, if, while).`;
      specificSuggestion = 'Thêm dấu ":" vào cuối dòng.';
    } else if (rawError.includes("unmatched ')'") || rawError.includes("unmatched ']'")) {
      specificExplanation = `Dòng ${line || ''} có dấu đóng ngoặc không khớp hoặc bị thừa.`;
      specificSuggestion = 'Kiểm tra lại số lượng và thứ tự mở/đóng các cặp ngoặc (), [].';
    } else if (rawError.includes('Perhaps you forgot a comma?')) {
      specificExplanation = `Dòng ${line || ''} thiếu dấu phẩy "," ngăn cách giữa các phần tử trong danh sách hoặc tham số hàm.`;
      specificSuggestion = 'Thêm dấu phẩy giữa các phần tử: ví dụ [1, 2, 3].';
    }

    return {
      title: 'Lỗi cú pháp (SyntaxError)',
      vietnameseExplanation: specificExplanation,
      suggestion: specificSuggestion,
      line,
    };
  }

  if (rawError.includes('IndentationError')) {
    let explanation = line
      ? `Dòng ${line} bị thụt lề sai so với các dòng lệnh khác trong khối.`
      : 'Các dòng lệnh con không được thụt lề đồng đều.';

    if (rawError.includes('unexpected indent')) {
      explanation = `Dòng ${line || ''} có khoảng trắng thừa ở đầu dòng mà không nằm trong khối lệnh nào.`;
    } else if (rawError.includes('expected an indented block')) {
      explanation = `Sau dấu hai chấm ":", dòng lệnh tiếp theo bắt buộc phải thụt vào trong 4 dấu cách.`;
    }

    return {
      title: 'Lỗi thụt lề (IndentationError)',
      vietnameseExplanation: explanation,
      suggestion:
        'Tất cả câu lệnh bên trong def, for, while, if bắt buộc phải thụt vào trong 4 dấu cách (Space) hoặc 1 phím Tab đồng nhất.',
      line,
    };
  }

  if (rawError.includes('NameError')) {
    const varMatch = rawError.match(/name '(\w+)' is not defined/);
    const varName = varMatch ? varMatch[1] : 'biến';
    let hint = `Hãy gán giá trị cho "${varName}" trước khi sử dụng (ví dụ: ${varName} = 0) hoặc kiểm tra xem bạn có viết sai chính tả tên biến không.`;
    if (varName === 'true' || varName === 'false') {
      hint = `Trong Python, giá trị đúng/sai bắt buộc phải viết hoa chữ cái đầu: "${varName === 'true' ? 'True' : 'False'}".`;
    } else if (varName === 'null') {
      hint = 'Trong Python không có "null", hãy dùng giá trị "None" (viết hoa chữ N).';
    }
    return {
      title: 'Lỗi tên biến chưa khai báo (NameError)',
      vietnameseExplanation: `Biến hoặc hàm "${varName}" được sử dụng nhưng máy tính chưa biết nó được tạo ra từ đâu.`,
      suggestion: hint,
      line,
    };
  }

  if (rawError.includes('IndexError')) {
    return {
      title: 'Lỗi vượt quá chỉ số mảng (IndexError: list index out of range)',
      vietnameseExplanation: 'Bạn đang truy cập vào một vị trí (index) không tồn tại trong danh sách.',
      suggestion: 'Nhớ rằng chỉ số mảng trong Python bắt đầu từ 0 đến len(arr) - 1. Nếu duyệt mảng và truy cập arr[i+1], hãy giới hạn vòng lặp là range(len(arr) - 1).',
      line,
    };
  }

  if (rawError.includes('TypeError')) {
    let exp = 'Đang thực hiện phép toán giữa 2 kiểu dữ liệu không tương thích với nhau.';
    let sug = 'Kiểm tra kiểu dữ liệu của các biến tham gia phép toán.';

    if (rawError.includes("'list' object is not callable")) {
      exp = 'Bạn đang dùng ngoặc tròn () trên một danh sách mảng như thể gọi hàm (ví dụ: arr(i)).';
      sug = 'Để truy cập phần tử trong Python, bạn phải dùng ngoặc vuông: arr[i].';
    } else if (rawError.includes('list indices must be integers or slices, not float')) {
      exp = 'Chỉ số mảng đang là số thực (float) do bạn dùng phép chia "/".';
      sug = 'Hãy dùng phép chia lấy phần nguyên "//" (ví dụ: arr[len(arr) // 2]).';
    } else if (rawError.includes("'<' not supported between instances of")) {
      exp = 'Không thể so sánh giữa chuỗi chữ (str) và số nguyên (int).';
      sug = 'Hãy dùng int() để ép kiểu dữ liệu từ chuỗi sang số trước khi so sánh.';
    }

    return {
      title: 'Lỗi kiểu dữ liệu (TypeError)',
      vietnameseExplanation: exp,
      suggestion: sug,
      line,
    };
  }

  if (rawError.includes('ZeroDivisionError')) {
    return {
      title: 'Lỗi chia cho số 0 (ZeroDivisionError)',
      vietnameseExplanation: 'Phép toán của bạn đang cố gắng chia một số cho 0.',
      suggestion: 'Kiểm tra lại mẫu số trong phép chia "/" hoặc chia lấy dư "%" để đảm bảo nó luôn khác 0.',
      line,
    };
  }

  if (rawError.includes('RecursionError')) {
    return {
      title: 'Lỗi đệ quy vô tận (RecursionError)',
      vietnameseExplanation: 'Hàm đệ quy gọi lại chính nó quá nhiều lần mà không đạt được điểm dừng (Base case).',
      suggestion: 'Kiểm tra điều kiện dừng đệ quy (ví dụ: if len(arr) <= 1: return arr).',
      line,
    };
  }

  return {
    title: 'Lỗi thực thi chương trình',
    vietnameseExplanation: rawError,
    suggestion: 'Xem lại dòng lệnh được đánh dấu đỏ để sửa lỗi.',
    line,
  };
}
