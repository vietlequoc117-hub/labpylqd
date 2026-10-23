import { PRESETS } from '../presets';

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

// Tập hợp các chương trình thuật toán chuẩn mực theo menu (Không bao giờ báo lỗi trừ khi người dùng chỉnh sửa)
const OFFICIAL_PRESET_CODES = new Set(
  PRESETS.map((p) => p.code.trim().replace(/\r\n/g, '\n'))
);

// Danh sách từ khóa chuẩn của Python 3.10+
export const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
  'while', 'with', 'yield',
]);

// Bản đồ từ khóa viết thường để kiểm tra lỗi viết hoa/thường (Case Sensitivity)
export const LOWER_CASE_KEYWORDS_MAP: Record<string, string> = {
  def: 'def',
  for: 'for',
  while: 'while',
  if: 'if',
  elif: 'elif',
  else: 'else',
  return: 'return',
  break: 'break',
  continue: 'continue',
  import: 'import',
  from: 'from',
  as: 'as',
  pass: 'pass',
  class: 'class',
  try: 'try',
  except: 'except',
  finally: 'finally',
  with: 'with',
  yield: 'yield',
  raise: 'raise',
  global: 'global',
  nonlocal: 'nonlocal',
  lambda: 'lambda',
  assert: 'assert',
  del: 'del',
  in: 'in',
  is: 'is',
  and: 'and',
  or: 'or',
  not: 'not',
  true: 'True',
  false: 'False',
  none: 'None',
};

// Từ khóa bắt đầu câu lệnh (Statement Starters)
export const STATEMENT_KEYWORDS = [
  'def', 'for', 'while', 'if', 'elif', 'else', 'return', 'break',
  'continue', 'import', 'from', 'pass', 'class', 'try', 'except',
  'finally', 'with', 'yield', 'raise', 'global', 'nonlocal', 'assert', 'del',
];

// Danh sách các từ khóa sai chính tả phổ biến (Common Keyword Typos)
export const COMMON_KEYWORD_TYPOS: Record<string, { correct: string; name: string }> = {
  // def
  dfe: { correct: 'def', name: 'từ khóa khai báo hàm def' },
  deff: { correct: 'def', name: 'từ khóa khai báo hàm def' },
  defa: { correct: 'def', name: 'từ khóa khai báo hàm def' },
  ddef: { correct: 'def', name: 'từ khóa khai báo hàm def' },
  df: { correct: 'def', name: 'từ khóa khai báo hàm def' },
  // for
  fro: { correct: 'for', name: 'vòng lặp for' },
  fo: { correct: 'for', name: 'vòng lặp for' },
  fr: { correct: 'for', name: 'vòng lặp for' },
  forr: { correct: 'for', name: 'vòng lặp for' },
  // while
  whle: { correct: 'while', name: 'vòng lặp while' },
  whil: { correct: 'while', name: 'vòng lặp while' },
  wile: { correct: 'while', name: 'vòng lặp while' },
  whiel: { correct: 'while', name: 'vòng lặp while' },
  // if
  fi: { correct: 'if', name: 'câu lệnh điều kiện if' },
  iff: { correct: 'if', name: 'câu lệnh điều kiện if' },
  // elif
  eli: { correct: 'elif', name: 'nhánh điều kiện elif' },
  eliff: { correct: 'elif', name: 'nhánh điều kiện elif' },
  elsif: { correct: 'elif', name: 'nhánh điều kiện elif' },
  elseif: { correct: 'elif', name: 'nhánh điều kiện elif' },
  // else
  esle: { correct: 'else', name: 'nhánh else' },
  els: { correct: 'else', name: 'nhánh else' },
  elsee: { correct: 'else', name: 'nhánh else' },
  // return
  retrun: { correct: 'return', name: 'từ khóa return' },
  retun: { correct: 'return', name: 'từ khóa return' },
  reutrn: { correct: 'return', name: 'từ khóa return' },
  retur: { correct: 'return', name: 'từ khóa return' },
  returnn: { correct: 'return', name: 'từ khóa return' },
  rtn: { correct: 'return', name: 'từ khóa return' },
  // break
  brek: { correct: 'break', name: 'lệnh dừng break' },
  brake: { correct: 'break', name: 'lệnh dừng break' },
  baerk: { correct: 'break', name: 'lệnh dừng break' },
  breka: { correct: 'break', name: 'lệnh dừng break' },
  // continue
  contine: { correct: 'continue', name: 'lệnh tiếp tục continue' },
  continew: { correct: 'continue', name: 'lệnh tiếp tục continue' },
  contineu: { correct: 'continue', name: 'lệnh tiếp tục continue' },
  cotinue: { correct: 'continue', name: 'lệnh tiếp tục continue' },
  // import & from
  improt: { correct: 'import', name: 'lệnh import' },
  ipmort: { correct: 'import', name: 'lệnh import' },
  impot: { correct: 'import', name: 'lệnh import' },
  imprt: { correct: 'import', name: 'lệnh import' },
  form: { correct: 'from', name: 'từ khóa from' },
  // class
  calss: { correct: 'class', name: 'từ khóa class' },
  clas: { correct: 'class', name: 'từ khóa class' },
  // pass
  pas: { correct: 'pass', name: 'lệnh pass' },
  passs: { correct: 'pass', name: 'lệnh pass' },
  // assert, yield, raise, lambda
  asert: { correct: 'assert', name: 'lệnh assert' },
  yeld: { correct: 'yield', name: 'từ khóa yield' },
  yeild: { correct: 'yield', name: 'từ khóa yield' },
  rasie: { correct: 'raise', name: 'lệnh raise' },
  lamda: { correct: 'lambda', name: 'từ khóa lambda' },
  whith: { correct: 'with', name: 'từ khóa with' },
  fianlly: { correct: 'finally', name: 'khối finally' },
  exsept: { correct: 'except', name: 'khối except' },
  glbal: { correct: 'global', name: 'từ khóa global' },
  globl: { correct: 'global', name: 'từ khóa global' },
  // boolean & none
  ture: { correct: 'True', name: 'giá trị boolean True' },
  tru: { correct: 'True', name: 'giá trị boolean True' },
  flase: { correct: 'False', name: 'giá trị boolean False' },
  fals: { correct: 'False', name: 'giá trị boolean False' },
  fales: { correct: 'False', name: 'giá trị boolean False' },
  // built-in functions
  pritn: { correct: 'print', name: 'hàm in print()' },
  prnt: { correct: 'print', name: 'hàm in print()' },
  printt: { correct: 'print', name: 'hàm in print()' },
  prin: { correct: 'print', name: 'hàm in print()' },
  rang: { correct: 'range', name: 'hàm range()' },
  ragne: { correct: 'range', name: 'hàm range()' },
  rangge: { correct: 'range', name: 'hàm range()' },
  rnage: { correct: 'range', name: 'hàm range()' },
  raneg: { correct: 'range', name: 'hàm range()' },
  lenght: { correct: 'len', name: 'hàm đo độ dài len()' },
  lengh: { correct: 'len', name: 'hàm đo độ dài len()' },
  legth: { correct: 'len', name: 'hàm đo độ dài len()' },
  lenth: { correct: 'len', name: 'hàm đo độ dài len()' },
  intput: { correct: 'input', name: 'hàm nhập input()' },
  inptu: { correct: 'input', name: 'hàm nhập input()' },
  inpt: { correct: 'input', name: 'hàm nhập input()' },
  imput: { correct: 'input', name: 'hàm nhập input()' },
};

/**
 * Thuật toán tính khoảng cách chỉnh sửa Levenshtein Distance giữa 2 từ
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

// Danh sách các hàm & kiểu dữ liệu Built-in thông dụng trong Python
export const PYTHON_BUILTINS = new Set([
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
 * Loại bỏ chuỗi ký tự ("..." hoặc '...') và comment (#...) một cách chính xác (Single-pass lexer):
 * - Thay thế chuỗi thông thường bằng `""` (thay vì khoảng trắng) để sau khi `.trim()`, phép gán `s = "abcdefg"` trở thành `s = ""` (giữ nguyên vế phải khác rỗng, tránh lỗi nhận diện nhầm `s =` thiếu vế phải!).
 * - Xử lý tiền tố chuỗi `f`, `r`, `b`, `u` (ví dụ `f"Kết quả: {t}"`) để không báo lỗi nhầm chữ `f` là biến chưa khai báo, đồng thời trích xuất biểu thức `{t}` bên trong f-string để kiểm tra biến hợp lệ.
 * - Không cắt nhầm dấu `#` nằm bên trong chuỗi ký tự.
 */
function stripStringsAndComments(line: string): string {
  let result = '';
  let i = 0;
  const n = line.length;

  while (i < n) {
    // 1. Nếu gặp dấu # ngoài chuỗi -> bỏ toàn bộ phần comment phía sau
    if (line[i] === '#') {
      break;
    }

    // 2. Kiểm tra tiền tố chuỗi (f, r, b, u, fr, rf, br, rb...) ngay trước dấu nháy
    let isFString = false;
    let prefixLen = 0;
    if (/[fFrRbBuU]/.test(line[i]) && (i === 0 || !/[a-zA-Z0-9_]/.test(line[i - 1]))) {
      if (i + 1 < n && (line[i + 1] === '"' || line[i + 1] === "'")) {
        prefixLen = 1;
        isFString = /[fF]/.test(line[i]);
      } else if (
        i + 2 < n &&
        /[fFrRbBuU]/.test(line[i + 1]) &&
        (line[i + 2] === '"' || line[i + 2] === "'")
      ) {
        prefixLen = 2;
        isFString = /[fF]/.test(line[i]) || /[fF]/.test(line[i + 1]);
      }
    }

    if (prefixLen > 0 || line[i] === '"' || line[i] === "'") {
      i += prefixLen;
      const quoteChar = line[i];
      // Kiểm tra chuỗi 3 dấu nháy (""" hoặc ''')
      const isTriple =
        i + 2 < n && line[i + 1] === quoteChar && line[i + 2] === quoteChar;
      const quoteToken = isTriple ? quoteChar.repeat(3) : quoteChar;
      i += quoteToken.length;

      let strContent = '';
      while (i < n) {
        if (line[i] === '\\') {
          strContent += line.slice(i, i + 2);
          i += 2;
          continue;
        }
        if (isTriple) {
          if (line.startsWith(quoteToken, i)) {
            i += 3;
            break;
          }
        } else {
          if (line[i] === quoteChar) {
            i += 1;
            break;
          }
        }
        strContent += line[i];
        i++;
      }

      if (isFString && strContent.includes('{')) {
        // Trích xuất các biểu thức {expr} trong f-string (bỏ phần định dạng :.2f hoặc !r)
        const exprs: string[] = [];
        const braceRegex = /\{([^{}]+)\}/g;
        let m: RegExpExecArray | null;
        while ((m = braceRegex.exec(strContent)) !== null) {
          const rawExpr = m[1].split(/[:!]/)[0].trim();
          if (rawExpr) exprs.push(`(${rawExpr})`);
        }
        result += exprs.length > 0 ? `"" + ${exprs.join(' + ')}` : '""';
      } else {
        result += '""';
      }
      continue;
    }

    result += line[i];
    i++;
  }

  return result;
}

/**
 * Kiểm tra chuỗi ký tự chưa đóng dấu nháy trên 1 dòng (bỏ qua phần # comment và xử lý đúng nháy lồng nhau như "It's")
 */
function checkUnterminatedStringOnLine(rawLine: string): { quote: "'" | '"'; col: number } | null {
  if (rawLine.includes("'''") || rawLine.includes('"""')) return null;
  let inQuote: "'" | '"' | null = null;
  let quoteCol = -1;

  for (let i = 0; i < rawLine.length; i++) {
    const ch = rawLine[i];
    if (ch === '\\') {
      i++; // Bỏ qua ký tự được escape
      continue;
    }
    if (!inQuote) {
      if (ch === '#') break; // Gặp comment ngoài chuỗi -> dừng kiểm tra
      if (ch === "'" || ch === '"') {
        inQuote = ch;
        quoteCol = i + 1;
      }
    } else if (ch === inQuote) {
      inQuote = null;
      quoteCol = -1;
    }
  }

  return inQuote ? { quote: inQuote, col: quoteCol } : null;
}

/**
 * Chuyên gia phân tích cú pháp & ngữ nghĩa Python cấp cao (Senior Python Diagnostic Engine)
 * Phát hiện toàn diện 4 nhóm lỗi kinh điển của học sinh (bao gồm cả mảng số và bài tập Xâu kí tự):
 * 1. Thiếu dấu (dấu hai chấm :, ngoặc (), [], {}, dấu nháy chuỗi, dấu phẩy giữa các phần tử)
 * 2. Từ khóa & Gõ sai (typo từ khóa, gõ nhầm true/false viết thường, null, 'o'/'O' thay cho số 0, 'l' thay cho số 1)
 * 3. Cú pháp & Thụt lề (IndentationError, toán tử C/JS như &&, ||, !, ++, nhầm = và ==, arr(i) thay vì arr[i])
 * 4. Ngữ nghĩa, Logic & Xâu kí tự (Biến chưa khai báo NameError, bất biến xâu s[0]='a', dùng dấu : trong range, dùng dấu , trong cắt xâu s[1,3], phương thức xâu sai .toUpperCase/.trim, chia float trong chỉ số mảng, chia cho 0, hoán đổi ghi đè)
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

  // 1. Nếu là chương trình thuật toán chuẩn mực trong Menu (Chưa bị học sinh sửa đổi), bỏ qua báo lỗi hoàn toàn 100%
  const normalizedCode = code.trim().replace(/\r\n/g, '\n');
  if (OFFICIAL_PRESET_CODES.has(normalizedCode)) {
    return {
      errors: [],
      warnings: [],
      infos: [],
      isValid: true,
      canAutoFix: false,
      stats: { symbolErrors: 0, keywordErrors: 0, syntaxErrors: 0, semanticErrors: 0 },
    };
  }

  const lines = code.split('\n');

  // Theo dõi các biến và hàm đã được khai báo
  const declaredVariables = new Set<string>();
  const stringVariables = new Set<string>();
  const definedFunctions: { name: string; line: number; params: string[] }[] = [];

  // Pre-pass: Thu thập trước toàn bộ hàm và biến được khai báo/gán trong code để tránh báo sai lỗi từ khóa/tên biến
  for (let idx = 0; idx < lines.length; idx++) {
    const cleanL = stripStringsAndComments(lines[idx]).trim();
    if (!cleanL || cleanL.startsWith('#')) continue;

    // Def
    const dMatch = cleanL.match(/^def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/);
    if (dMatch) {
      const fnName = dMatch[1];
      const params = dMatch[2]
        .split(',')
        .map((p) => p.split('=')[0].split(':')[0].replace(/\*/g, '').trim())
        .filter(Boolean);
      definedFunctions.push({ name: fnName, line: idx + 1, params });
      declaredVariables.add(fnName);
      params.forEach((p) => declaredVariables.add(p));
    }

    // For (bao gồm cả vòng lặp for đầu dòng và list/generator comprehension `for x in ...`)
    const forRegexGlobal = /\bfor\s+([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*|\([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*\))\s+in\b/g;
    let fMatch: RegExpExecArray | null;
    while ((fMatch = forRegexGlobal.exec(cleanL)) !== null) {
      fMatch[1].replace(/[()]/g, '').split(',').forEach((v) => {
        const cleaned = v.trim();
        if (/^[a-zA-Z_]\w*$/.test(cleaned)) declaredVariables.add(cleaned);
      });
    }

    // Assignment (s = "abcdefg", t = s[::2], a, b = ..., a = b = ...)
    const aMatch = cleanL.match(/^\(?([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)\)?\s*(?:\+=|-=|\*=|\/=|\/\/=|%=|\*\*=|=(?!=))/);
    if (aMatch && !/^(if|elif|while|return|assert)\b/.test(cleanL)) {
      aMatch[1].split(',').forEach((v) => {
        const cleaned = v.trim();
        if (/^[a-zA-Z_]\w*$/.test(cleaned)) declaredVariables.add(cleaned);
      });
    }

    // with ... as var / except ... as var
    const asMatch = cleanL.match(/\bas\s+([a-zA-Z_]\w*)/);
    if (asMatch) declaredVariables.add(asMatch[1]);

    // Import
    const impMatch = cleanL.match(/^(?:import|from)\s+([a-zA-Z_]\w*)/);
    if (impMatch) declaredVariables.add(impMatch[1]);
  }

  // Theo dõi các biến đã được khai báo theo trình tự thời gian (Chronological Scope Tracking)
  const variablesDeclaredSoFar = new Set<string>([
    ...PYTHON_BUILTINS,
    '__name__', '__file__', '_',
  ]);
  // Khai báo trước các tên hàm và thư viện import
  definedFunctions.forEach((f) => variablesDeclaredSoFar.add(f.name));
  lines.forEach((l) => {
    const impM = stripStringsAndComments(l).trim().match(/^(?:import|from)\s+([a-zA-Z_]\w*)/);
    if (impM) variablesDeclaredSoFar.add(impM[1]);
  });

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
            suggestion: `${rawLine.replace(/#.*$/, '').trimEnd()}:`,
            fixable: true,
          });
        }
      }
    }

    // 1.3 Thiếu dấu đóng chuỗi (Unterminated string literal)
    const unclosedStr = checkUnterminatedStringOnLine(rawLine);
    if (unclosedStr) {
      errors.push({
        id: `unterminated-string-${unclosedStr.quote === "'" ? 'single' : 'double'}-${lineNum}`,
        line: lineNum,
        column: unclosedStr.col,
        severity: 'error',
        category: 'symbol',
        rule: 'unterminated-string',
        message: `Dòng ${lineNum}: Chuỗi ký tự thiếu dấu đóng nháy ${unclosedStr.quote === "'" ? `đơn "'"` : `kép '"'`}.`,
        suggestion: rawLine.trimEnd() + unclosedStr.quote,
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
    // Chẩn đoán toàn diện mọi lỗi từ khóa của học sinh: viết hoa/thường, gõ sai chính tả,
    // dùng từ khóa ngôn ngữ khác, dùng từ khóa làm tên biến/hàm, thiếu 'in' trong for.
    // =========================================================================

    // 2.1 Kiểm tra từ khóa Python viết hoa/thường sai (Case Sensitivity)
    // Trong Python, tất cả các từ khóa bắt buộc viết THƯỜNG (trừ True, False, None)
    const capitalizedKwRegex = /\b(Def|DEF|For|FOR|While|WHILE|If|IF|Elif|ELIF|Else|ELSE|Return|RETURN|Break|BREAK|Continue|CONTINUE|Import|IMPORT|From|FROM|Pass|PASS|Class|CLASS|In|IN|Is|IS|Not|NOT|And|AND|Or|OR)\b/g;
    let capMatch;
    while ((capMatch = capitalizedKwRegex.exec(codeWithoutStrComment)) !== null) {
      const wrongWord = capMatch[1];
      const lowerWord = wrongWord.toLowerCase();
      // Bỏ qua nếu là chuỗi hoặc tên biến đã được định nghĩa
      errors.push({
        id: `capitalized-keyword-${lineNum}-${wrongWord}`,
        line: lineNum,
        column: rawLine.indexOf(wrongWord) + 1,
        severity: 'error',
        category: 'keyword',
        rule: 'keyword-case-sensitivity',
        message: `Dòng ${lineNum}: Lỗi từ khóa viết hoa/thường! Python phân biệt chữ hoa/thường (case-sensitive) và từ khóa này bắt buộc phải viết thường toàn bộ: "${lowerWord}". Bạn đang viết là "${wrongWord}".`,
        suggestion: rawLine.replace(new RegExp(`\\b${wrongWord}\\b`, 'g'), lowerWord),
        fixable: true,
      });
    }

    // 2.2 Boolean viết thường hoặc sai hoa/thường: true / false / TRUE / FALSE
    const boolMatch = codeWithoutStrComment.match(/\b(true|false|TRUE|FALSE)\b/);
    if (boolMatch) {
      const wrongVal = boolMatch[1];
      const correctVal = wrongVal.toLowerCase() === 'true' ? 'True' : 'False';
      errors.push({
        id: `lowercase-boolean-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(wrongVal) + 1,
        severity: 'error',
        category: 'keyword',
        rule: 'lowercase-boolean',
        message: `Dòng ${lineNum}: Lỗi từ khóa boolean "${wrongVal}". Trong Python giá trị đúng/sai bắt buộc phải viết hoa chữ cái đầu và viết thường chữ sau: "${correctVal}".`,
        suggestion: rawLine.replace(new RegExp(`\\b${wrongVal}\\b`, 'g'), correctVal),
        fixable: true,
      });
    }

    // 2.3 Null / Nil / None viết thường: null, nil, none, NULL, NONE
    const nullMatch = codeWithoutStrComment.match(/\b(null|nil|none|NULL|NONE)\b/);
    if (nullMatch && !codeWithoutStrComment.includes('def none')) {
      const wrongVal = nullMatch[1];
      errors.push({
        id: `null-literal-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(wrongVal) + 1,
        severity: 'error',
        category: 'keyword',
        rule: 'null-literal',
        message: `Dòng ${lineNum}: Lỗi từ khóa giá trị rỗng. Trong Python giá trị rỗng/không xác định là "None" (chữ N viết hoa), không dùng "${wrongVal}".`,
        suggestion: rawLine.replace(new RegExp(`\\b${wrongVal}\\b`, 'g'), 'None'),
        fixable: true,
      });
    }

    // 2.4 Từ khóa của ngôn ngữ khác (C/C++, Java, JS, Pascal) gõ nhầm vào Python
    // 2.4.1 Khai báo biến var, let, const, dim ở đầu dòng
    const foreignVarMatch = trimmedClean.match(/^(var|let|const|dim)\s+([a-zA-Z_]\w*)\s*(=|:)/);
    if (foreignVarMatch) {
      const kw = foreignVarMatch[1];
      const varName = foreignVarMatch[2];
      errors.push({
        id: `foreign-var-keyword-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(kw) + 1,
        severity: 'error',
        category: 'keyword',
        rule: 'foreign-var-keyword',
        message: `Dòng ${lineNum}: Lỗi từ khóa khai báo biến! Python là ngôn ngữ định kiểu động, không dùng từ khóa "${kw}" để khai báo biến. Hãy gán trực tiếp: "${varName} = giá_trị".`,
        suggestion: rawLine.replace(new RegExp(`^(\\s*)${kw}\\s+`), '$1'),
        fixable: true,
      });
    }

    // 2.4.2 Khai báo hàm function, func, procedure, sub, void thay vì def
    const foreignFnMatch = trimmedClean.match(/^(function|func|procedure|sub|void)\s+([a-zA-Z_]\w*)/);
    if (foreignFnMatch) {
      const kw = foreignFnMatch[1];
      errors.push({
        id: `foreign-fn-keyword-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(kw) + 1,
        severity: 'error',
        category: 'keyword',
        rule: 'foreign-function-keyword',
        message: `Dòng ${lineNum}: Lỗi từ khóa khai báo hàm! Trong Python để khai báo hàm bắt buộc dùng từ khóa "def", không dùng "${kw}".`,
        suggestion: rawLine.replace(new RegExp(`^(\\s*)${kw}\\b`), '$1def'),
        fixable: true,
      });
    }

    // 2.4.3 Từ khóa kiểu dữ liệu C/Java đứng trước biến (int x = 5, float y = 2.0, string s = "abc", bool f = True)
    const foreignTypeMatch = trimmedClean.match(/^(int|float|string|str|bool|double|char)\s+([a-zA-Z_]\w*)\s*=/);
    if (foreignTypeMatch) {
      const typeKw = foreignTypeMatch[1];
      const varName = foreignTypeMatch[2];
      errors.push({
        id: `foreign-type-keyword-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(typeKw) + 1,
        severity: 'error',
        category: 'keyword',
        rule: 'foreign-type-keyword',
        message: `Dòng ${lineNum}: Lỗi cú pháp kiểu dữ liệu! Trong Python bạn không cần viết từ khóa kiểu "${typeKw}" trước biến. Hãy viết trực tiếp: "${varName} = ...".`,
        suggestion: rawLine.replace(new RegExp(`^(\\s*)${typeKw}\\s+`), '$1'),
        fixable: true,
      });
    }

    // 2.4.4 else if thay vì elif
    if (/^\s*else\s+if\b/.test(trimmedClean)) {
      errors.push({
        id: `else-if-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('else if') + 1,
        severity: 'error',
        category: 'keyword',
        rule: 'else-if-keyword',
        message: `Dòng ${lineNum}: Lỗi từ khóa nhánh điều kiện! Python không có cú pháp "else if". Bạn phải dùng từ khóa "elif".`,
        suggestion: rawLine.replace(/\belse\s+if\b/, 'elif'),
        fixable: true,
      });
    }

    // 2.4.5 Từ khóa "then" trong if (ảnh hưởng Pascal/VB)
    if (/^\s*if\s+.*\b(?:then)\s*(?::|$)/.test(trimmedClean)) {
      errors.push({
        id: `if-then-keyword-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('then') + 1,
        severity: 'error',
        category: 'keyword',
        rule: 'no-then-keyword',
        message: `Dòng ${lineNum}: Lỗi từ khóa "then"! Trong Python câu lệnh if không dùng từ khóa "then", chỉ cần kết thúc bằng dấu hai chấm ":".`,
        suggestion: rawLine.replace(/\bthen\s*(:|$)/, ':'),
        fixable: true,
      });
    }

    // 2.4.6 Từ khóa "do" trong while (ảnh hưởng C/Pascal)
    if (/^\s*while\s+.*\b(?:do)\s*(?::|$)/.test(trimmedClean)) {
      errors.push({
        id: `while-do-keyword-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('do') + 1,
        severity: 'error',
        category: 'keyword',
        rule: 'no-do-keyword',
        message: `Dòng ${lineNum}: Lỗi từ khóa "do"! Trong Python vòng lặp while không dùng từ khóa "do", chỉ cần kết thúc bằng dấu hai chấm ":".`,
        suggestion: rawLine.replace(/\bdo\s*(:|$)/, ':'),
        fixable: true,
      });
    }

    // 2.5 Dùng từ khóa dành riêng của Python làm tên biến hoặc tên hàm
    const assignVarKwMatch = trimmedClean.match(/^([a-zA-Z_]\w*)\s*(=|\+=|-=|\*=|\/=|%=)/);
    if (assignVarKwMatch && !/^(if|elif|while)/.test(trimmedClean)) {
      const varCandidate = assignVarKwMatch[1];
      if (PYTHON_KEYWORDS.has(varCandidate)) {
        errors.push({
          id: `reserved-keyword-as-var-${lineNum}`,
          line: lineNum,
          column: rawLine.indexOf(varCandidate) + 1,
          severity: 'error',
          category: 'keyword',
          rule: 'reserved-keyword-as-variable',
          message: `Dòng ${lineNum}: Lỗi từ khóa nghiêm trọng! "${varCandidate}" là từ khóa dành riêng của Python, không bao giờ được sử dụng làm tên biến (gây lỗi SyntaxError: cannot assign to ${varCandidate}).`,
          suggestion: `Hãy đổi tên biến thành: my_${varCandidate} hoặc ${varCandidate}_val`,
          fixable: false,
        });
      }
    }

    const defFnKwMatch = trimmedClean.match(/^def\s+([a-zA-Z_]\w*)/);
    if (defFnKwMatch) {
      const fnCandidate = defFnKwMatch[1];
      if (PYTHON_KEYWORDS.has(fnCandidate)) {
        errors.push({
          id: `reserved-keyword-as-fn-${lineNum}`,
          line: lineNum,
          column: rawLine.indexOf(fnCandidate) + 1,
          severity: 'error',
          category: 'keyword',
          rule: 'reserved-keyword-as-function',
          message: `Dòng ${lineNum}: Lỗi từ khóa nghiêm trọng! "${fnCandidate}" là từ khóa dành riêng của Python, không thể sử dụng làm tên hàm.`,
          suggestion: `Hãy đổi tên hàm thành: run_${fnCandidate} hoặc my_${fnCandidate}`,
          fixable: false,
        });
      }
    }

    // 2.6 Lỗi từ khóa trong cấu trúc vòng lặp for: for <var> <sai_in> <iterable>:
    // Ví dụ: for i im range(n), for i inn range(n), for i on range(n), for i of range(n)
    const forLoopMiddleKwMatch = trimmedClean.match(/^for\s+([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)\s+([a-zA-Z_]\w*)\s+(.+)/);
    if (forLoopMiddleKwMatch && forLoopMiddleKwMatch[2] !== 'in') {
      const wrongInWord = forLoopMiddleKwMatch[2];
      const loopVars = forLoopMiddleKwMatch[1];
      errors.push({
        id: `for-missing-in-keyword-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(wrongInWord) + 1,
        severity: 'error',
        category: 'keyword',
        rule: 'for-loop-in-keyword',
        message: `Dòng ${lineNum}: Lỗi từ khóa trong vòng lặp for! Vòng lặp for của Python bắt buộc phải dùng từ khóa "in" (ví dụ: for ${loopVars} in ...). Bạn đang viết sai thành "${wrongInWord}".`,
        suggestion: rawLine.replace(new RegExp(`\\b${wrongInWord}\\b`), 'in'),
        fixable: true,
      });
    }

    // 2.7 Kiểm tra tra cứu từ điển các lỗi gõ sai từ khóa và hàm Built-in (COMMON_KEYWORD_TYPOS)
    // Tự động quét từng từ trong dòng code sạch
    const wordTokens = codeWithoutStrComment.match(/\b[a-zA-Z_]\w*\b/g) || [];
    for (const token of wordTokens) {
      if (COMMON_KEYWORD_TYPOS[token]) {
        const typoInfo = COMMON_KEYWORD_TYPOS[token];
        errors.push({
          id: `typo-${lineNum}-${token}`,
          line: lineNum,
          column: rawLine.indexOf(token) + 1,
          severity: 'error',
          category: 'keyword',
          rule: 'keyword-typo',
          message: `Dòng ${lineNum}: Lỗi viết sai từ khóa "${token}"! Bạn muốn viết là "${typoInfo.correct}" (${typoInfo.name}) đúng không?`,
          suggestion: rawLine.replace(new RegExp(`\\b${token}\\b`), typoInfo.correct),
          fixable: true,
        });
      }
    }

    // 2.8 Chẩn đoán thông minh bằng thuật toán Levenshtein cho từ khóa đầu dòng câu lệnh
    // Nếu dòng bắt đầu bằng một từ lạ không nằm trong biến, hàm, built-in hay từ khóa nhưng khoảng cách Levenshtein <= 2
    const firstWordMatch = trimmedClean.match(/^([a-zA-Z_]\w*)/);
    if (firstWordMatch) {
      const firstWord = firstWordMatch[1];
      const isKnown =
        PYTHON_KEYWORDS.has(firstWord) ||
        PYTHON_BUILTINS.has(firstWord) ||
        declaredVariables.has(firstWord) ||
        COMMON_KEYWORD_TYPOS[firstWord] ||
        firstWord === 'pass' ||
        firstWord.startsWith('_');

      if (!isKnown) {
        // Tìm từ khóa gần nhất có khoảng cách Levenshtein <= 2
        let closestKw: string | null = null;
        let minDistance = 999;

        for (const kw of STATEMENT_KEYWORDS) {
          const dist = levenshteinDistance(firstWord.toLowerCase(), kw);
          // Cho phép khoảng cách 1 với từ ngắn (2-3 ký tự) hoặc 2 với từ dài hơn
          const maxAllowed = kw.length <= 3 ? 1 : 2;
          if (dist <= maxAllowed && dist < minDistance) {
            minDistance = dist;
            closestKw = kw;
          }
        }

        if (closestKw && !errors.some((e) => e.line === lineNum && e.category === 'keyword')) {
          errors.push({
            id: `fuzzy-keyword-typo-${lineNum}-${firstWord}`,
            line: lineNum,
            column: rawLine.indexOf(firstWord) + 1,
            severity: 'error',
            category: 'keyword',
            rule: 'fuzzy-keyword-typo',
            message: `Dòng ${lineNum}: Lỗi từ khóa (Keyword Error)! Từ "${firstWord}" ở đầu câu lệnh không hợp lệ trong Python. Có phải bạn gõ nhầm từ khóa "${closestKw}" không?`,
            suggestion: rawLine.replace(new RegExp(`^(\\s*)${firstWord}\\b`), `$1${closestKw}`),
            fixable: true,
          });
        }
      }
    }

    // 2.9 Gõ nhầm chữ cái 'o' hoặc 'O' thay cho số 0 (Ví dụ: total = o, x = o)
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

    // 2.10 Gõ nhầm chữ cái 'l' (chữ L thường) hoặc 'I' thay cho số 1
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
          suggestion: rawLine.replace(assignmentRegex, '=='),
          fixable: true,
        });
      }
    }

    // 3.4 Nhầm lẫn phép so sánh '==' thay vì gán '=' ở đầu dòng (Ví dụ: total == 0)
    if (/^[a-zA-Z_]\w*\s*==\s*[^=]/.test(trimmedClean) && !/^(if|elif|while|assert|return)/.test(trimmedClean)) {
      const varName = trimmed.split('==')[0].trim();
      const val = trimmed.split('==').slice(1).join('==').trim();
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
      const rawUnassignedMatch = trimmed.match(
        /^([a-zA-Z_]\w*)\s*([\+\-\*\/%]|(?:\/\/)|(?:\*\*))\s*(.+)$/
      );
      const restExpr = rawUnassignedMatch ? rawUnassignedMatch[3].trim() : unassignedMatch[3].trim();
      errors.push({
        id: `unassigned-expression-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(varName) + 1,
        severity: 'error',
        category: 'syntax',
        rule: 'unassigned-expression',
        message: `Dòng ${lineNum}: Phép tính "${trimmed}" không lưu kết quả! Biến "${varName}" sẽ không được cộng dồn và không đổi giá trị.`,
        suggestion: `${varName} ${op}= ${restExpr}  (hoặc ${varName} = ${varName} ${op} ${restExpr})`,
        fixable: true,
      });
    }

    // 3.6 Hàm print thiếu ngoặc tròn (thói quen Python 2)
    if (/^\s*print\s+[^(]/.test(trimmedClean) && !/^\s*print\s*$/.test(trimmedClean)) {
      const printArg = trimmed.replace(/^\s*print\s+/, '').replace(/;*$/, '');
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

    // 4.1 Thu thập khai báo hàm và tham số dòng hiện tại
    const defMatch = trimmedClean.match(/^def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/);
    const currentDefParams = new Set<string>();
    if (defMatch) {
      const fnName = defMatch[1];
      const params = defMatch[2]
        .split(',')
        .map((p) => p.split('=')[0].split(':')[0].replace(/\*/g, '').trim())
        .filter(Boolean);
      declaredVariables.add(fnName);
      params.forEach((p) => {
        declaredVariables.add(p);
        currentDefParams.add(p);
      });
    }

    // 4.2 Thu thập biến từ vòng lặp for dòng hiện tại (bao gồm cả for đầu dòng và list comprehension)
    const currentForVars = new Set<string>();
    const forInlineRegex = /\bfor\s+([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*|\([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*\))\s+in\b/g;
    let forMatchIter: RegExpExecArray | null;
    while ((forMatchIter = forInlineRegex.exec(trimmedClean)) !== null) {
      const rawVars = forMatchIter[1].replace(/[()]/g, '').split(',');
      rawVars.forEach((v) => {
        const cleanedVar = v.trim();
        if (/^[a-zA-Z_]\w*$/.test(cleanedVar)) {
          declaredVariables.add(cleanedVar);
          currentForVars.add(cleanedVar);
        }
      });
    }

    // Thu thập biến từ `as` (with ... as f, except ... as e) và tham số `lambda x, y: ...`
    const asTargetMatch = trimmedClean.match(/\bas\s+([a-zA-Z_]\w*)/);
    if (asTargetMatch) {
      declaredVariables.add(asTargetMatch[1]);
      currentForVars.add(asTargetMatch[1]);
    }
    const lambdaMatch = trimmedClean.match(/\blambda\s+([^:]+):/);
    if (lambdaMatch) {
      lambdaMatch[1].split(',').forEach((p) => {
        const cleaned = p.split('=')[0].trim();
        if (/^[a-zA-Z_]\w*$/.test(cleaned)) {
          declaredVariables.add(cleaned);
          currentForVars.add(cleaned);
        }
      });
    }

    // 4.3 Thu thập biến thuộc vế trái của phép gán đơn (s = "abcdefg", t = s[::2], a, b = ..., a = b = ...)
    const simpleAssignMatch = trimmedClean.match(/^\s*\(?([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)\)?\s*=(?!=)/);
    const simpleLhsVars = new Set<string>();
    if (simpleAssignMatch && !/^(if|elif|while|return|assert)\b/.test(trimmedClean)) {
      simpleAssignMatch[1].split(',').forEach((v) => {
        const cleaned = v.trim();
        if (/^[a-zA-Z_]\w*$/.test(cleaned)) {
          declaredVariables.add(cleaned);
          simpleLhsVars.add(cleaned);
        }
      });
      // Hỗ trợ gán chuỗi nhiều biến: a = b = 0
      const chainedMatches = trimmedClean.matchAll(/([a-zA-Z_]\w*)\s*=(?!=)/g);
      for (const cm of chainedMatches) {
        if (cm[1] && !PYTHON_KEYWORDS.has(cm[1])) {
          declaredVariables.add(cm[1]);
          simpleLhsVars.add(cm[1]);
        }
      }

      // Nhận diện biến kiểu Xâu kí tự (str) để phục vụ kiểm tra chuyên sâu bài tập xâu
      const rhsClean = trimmedClean.replace(/^\s*\(?[a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*\)?\s*=\s*/, '').trim();
      const isStringRhs =
        rhsClean.startsWith('""') ||
        /^str\s*\(/.test(rhsClean) ||
        /^input\s*\(/.test(rhsClean) ||
        /^chr\s*\(/.test(rhsClean) ||
        /""\.join\s*\(/.test(rhsClean) ||
        Array.from(stringVariables).some((sv) => new RegExp(`^${sv}\\b`).test(rhsClean));

      if (isStringRhs && simpleLhsVars.size === 1) {
        simpleLhsVars.forEach((v) => stringVariables.add(v));
      }
    }

    // 4.4 CHẨN ĐOÁN TOÀN DIỆN LỖI BIẾN CHƯA KHAI BÁO & LỖI GÕ SAI TÊN BIẾN (NameError & Typos)
    // Quét tất cả các token định danh được ĐỌC (READ) trong dòng lệnh hiện tại
    const wordTokensOnLine = codeWithoutStrComment.match(/\b[a-zA-Z_]\w*\b/g) || [];

    for (const token of wordTokensOnLine) {
      // Bỏ qua từ khóa, built-in, hoặc biến đã được khai báo ở các dòng trước / dòng hiện tại
      if (
        PYTHON_KEYWORDS.has(token) ||
        PYTHON_BUILTINS.has(token) ||
        variablesDeclaredSoFar.has(token) ||
        simpleLhsVars.has(token) ||
        currentDefParams.has(token) ||
        currentForVars.has(token) ||
        token.startsWith('_')
      ) {
        continue;
      }

      // Bỏ qua tên phương thức gọi sau dấu chấm (ví dụ: arr.append, string.split)
      const dotMethodRegex = new RegExp(`\\.\\s*${token}\\b`);
      if (dotMethodRegex.test(codeWithoutStrComment)) {
        continue;
      }

      // Bỏ qua tên tham số đặt tên (keyword arguments) trong lời gọi hàm: print(..., end=""), sort(reverse=True)
      const kwArgRegex = new RegExp(`[(,]\\s*${token}\\s*=(?!=)`);
      if (kwArgRegex.test(codeWithoutStrComment)) {
        continue;
      }

      // Bỏ qua tên module trong câu lệnh import / from
      if (/^(import|from)\b/.test(trimmedClean)) {
        continue;
      }

      // Tránh báo lỗi trùng nếu dòng này đã báo lỗi từ khóa
      if (errors.some((e) => e.line === lineNum && (e.category === 'keyword' || e.rule.includes('keyword')))) {
        continue;
      }

      // So sánh với các biến đã khai báo trước đó để tìm lỗi gõ sai tên biến (Levenshtein Distance)
      let bestMatchVar: string | null = null;
      let minDistance = 999;

      for (const declaredVar of variablesDeclaredSoFar) {
        if (PYTHON_BUILTINS.has(declaredVar) || PYTHON_KEYWORDS.has(declaredVar) || declaredVar.length < 2) {
          continue;
        }
        const dist = levenshteinDistance(token.toLowerCase(), declaredVar.toLowerCase());
        const maxDist = declaredVar.length <= 4 ? 1 : 2;
        if (dist <= maxDist && dist < minDistance) {
          minDistance = dist;
          bestMatchVar = declaredVar;
        }
      }

      if (bestMatchVar && !errors.some((e) => e.line === lineNum && e.id.includes(token))) {
        errors.push({
          id: `undefined-var-typo-${lineNum}-${token}`,
          line: lineNum,
          column: rawLine.indexOf(token) + 1,
          severity: 'error',
          category: 'semantics',
          rule: 'undefined-variable-typo',
          message: `Dòng ${lineNum}: Lỗi tên biến chưa khai báo (NameError)! Biến "${token}" chưa được tạo ra. Có phải bạn gõ nhầm từ tên biến gốc "${bestMatchVar}" không?`,
          suggestion: rawLine.replace(new RegExp(`\\b${token}\\b`, 'g'), bestMatchVar),
          fixable: true,
        });
      } else if (!errors.some((e) => e.line === lineNum && e.id.includes(token))) {
        const isAugmented = new RegExp(`^\\s*${token}\\s*(\\+=|-=|\\*=|\\/=|%=)`).test(trimmedClean);
        errors.push({
          id: `undefined-var-${lineNum}-${token}`,
          line: lineNum,
          column: rawLine.indexOf(token) + 1,
          severity: 'error',
          category: 'semantics',
          rule: 'undefined-variable',
          message: isAugmented
            ? `Dòng ${lineNum}: Lỗi tên biến chưa khai báo (NameError)! Biến "${token}" chưa được khởi tạo giá trị ban đầu trước phép gán tích lũy.`
            : `Dòng ${lineNum}: Lỗi tên biến chưa khai báo (NameError)! Biến "${token}" được sử dụng nhưng chưa từng được định nghĩa hay gán giá trị ở các dòng trước.`,
          suggestion: `Hãy gán giá trị ban đầu "${token} = 0" (hoặc giá trị thích hợp) ở các dòng trước.`,
          fixable: false,
        });
      }
    }

    // Cập nhật variablesDeclaredSoFar với các biến vừa được khởi tạo ở dòng này
    if (defMatch && defMatch[1]) variablesDeclaredSoFar.add(defMatch[1]);
    currentDefParams.forEach((p) => variablesDeclaredSoFar.add(p));
    currentForVars.forEach((v) => variablesDeclaredSoFar.add(v));
    simpleLhsVars.forEach((v) => variablesDeclaredSoFar.add(v));
    const augAssignMatch = trimmedClean.match(/^([a-zA-Z_]\w*)\s*(\+=|-=|\*=|\/=|\/\/=|%=|\*\*=)/);
    if (augAssignMatch) variablesDeclaredSoFar.add(augAssignMatch[1]);

    // 4.5 Chỉ số mảng / cắt xâu chứa phép chia số thực "/" (Index must be int, not float)
    const floatDivIndexing = codeWithoutStrComment.match(/\[[^\]]*\b[a-zA-Z0-9_\(\)]+\s*\/\s*[a-zA-Z0-9_\(\)]+[^\]]*\]/);
    if (floatDivIndexing && !floatDivIndexing[0].includes('//')) {
      errors.push({
        id: `float-div-indexing-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('/') + 1,
        severity: 'error',
        category: 'semantics',
        rule: 'float-div-indexing',
        message: `Dòng ${lineNum}: Chỉ số mảng/xâu chứa phép chia số thực "/". Trong Python 3, chỉ số hoặc vị trí cắt xâu (slice) bắt buộc phải là số nguyên int, hãy dùng phép chia nguyên "//" (ví dụ: s[len(s) // 2]).`,
        suggestion: rawLine.replace(/([a-zA-Z0-9_\)]+)\s*\/\s*([a-zA-Z0-9_\(]+)/, '$1 // $2'),
        fixable: true,
      });
    }

    // 4.5b LỖI XÂU KÍ TỰ (STRING IMMUTABILITY): Gán trực tiếp kí tự vào vị trí của xâu s[0] = 'a'
    const strItemAssignMatch = trimmedClean.match(/^([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]\s*=(?!=)\s*(.+)$/);
    if (strItemAssignMatch && stringVariables.has(strItemAssignMatch[1])) {
      const sVar = strItemAssignMatch[1];
      const idxExpr = strItemAssignMatch[2].trim();
      const rawRhs = rawLine.split(/=(?!=)/).slice(1).join('=').trim();
      errors.push({
        id: `string-item-assign-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('[') + 1,
        severity: 'error',
        category: 'semantics',
        rule: 'string-item-assignment',
        message: `Dòng ${lineNum}: Lỗi bất biến xâu kí tự (TypeError: 'str' object does not support item assignment)! Trong Python, xâu "${sVar}" là kiểu bất biến (immutable), không thể sửa trực tiếp từng kí tự bằng "${sVar}[${idxExpr}] = ...".`,
        suggestion: `Hãy dùng phép cắt ghép xâu: ${sVar} = ${sVar}[:${idxExpr}] + ${rawRhs} + ${sVar}[${idxExpr} + 1:]`,
        fixable: true,
      });
    }

    // 4.5c LỖI DÙNG DẤU HAI CHẤM ":" TRONG HÀM range() THAY VÌ DẤU PHẨY "," (Ví dụ: range(0:len(s):2))
    const rangeColonMatch = codeWithoutStrComment.match(/\brange\s*\(([^)]*:[^)]*)\)/);
    if (rangeColonMatch) {
      errors.push({
        id: `range-colon-syntax-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('range') + 1,
        severity: 'error',
        category: 'syntax',
        rule: 'range-colon-syntax',
        message: `Dòng ${lineNum}: Lỗi cú pháp trong hàm "range()"! Các tham số (start, stop, step) trong "range()" phải ngăn cách bằng dấu phẩy ",", không được dùng dấu hai chấm ":" như khi cắt xâu.`,
        suggestion: rawLine.replace(/(\brange\s*\([^)]+)\:([^)]*\))/g, (m) => m.replace(/:/g, ', ')),
        fixable: true,
      });
    }

    // 4.5d LỖI DÙNG DẤU PHẨY "," KHI CẮT XÂU (STRING SLICING) THAY VÌ DẤU HAI CHẤM ":" (Ví dụ: s[1, 3] hoặc s[0, len(s), 2])
    const sliceCommaMatch = codeWithoutStrComment.match(/\b([a-zA-Z_]\w*)\s*\[\s*([^\]\[:]+(?:\s*,\s*[^\]\[:]+)+)\s*\]/);
    if (sliceCommaMatch && stringVariables.has(sliceCommaMatch[1])) {
      const sVar = sliceCommaMatch[1];
      const insideBracket = sliceCommaMatch[2];
      const fixedSlice = insideBracket.split(',').map((p) => p.trim()).join(':');
      errors.push({
        id: `string-slice-comma-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('[') + 1,
        severity: 'error',
        category: 'semantics',
        rule: 'string-slice-comma',
        message: `Dòng ${lineNum}: Lỗi cú pháp cắt xâu (TypeError: string indices must be integers)! Để cắt xâu "${sVar}", bạn phải dùng dấu hai chấm ":" (${sVar}[${fixedSlice}]) thay vì dấu phẩy ",".`,
        suggestion: rawLine.replace(sliceCommaMatch[0], `${sVar}[${fixedSlice}]`),
        fixable: true,
      });
    }

    // 4.5e LỖI BƯỚC NHẢY CẮT XÂU BẰNG 0 (ValueError: slice step cannot be zero, ví dụ: s[::0])
    const zeroSliceStepMatch = codeWithoutStrComment.match(/\[[^\]]*:[^\]]*:\s*0\s*\]/);
    if (zeroSliceStepMatch) {
      errors.push({
        id: `zero-slice-step-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(':0') !== -1 ? rawLine.indexOf(':0') + 1 : 1,
        severity: 'error',
        category: 'semantics',
        rule: 'zero-slice-step',
        message: `Dòng ${lineNum}: Lỗi bước nhảy cắt xâu bằng 0 (ValueError: slice step cannot be zero)! Bước nhảy (step) trong [start:stop:step] bắt buộc phải khác 0 (ví dụ: [::2] hoặc [::-1]).`,
        fixable: false,
      });
    }

    // 4.5f LỖI PHƯƠNG THỨC XÂU KÍ TỰ TỪ NGÔN NGỮ KHÁC (JS / Java / C++ / Pascal)
    const wrongStrMethodMatch = trimmedClean.match(
      /([a-zA-Z_]\w*)\.(toUpperCase|toLowerCase|trim|charAt|substr|substring|len)\s*\(([^)]*)\)/
    );
    if (wrongStrMethodMatch) {
      const targetVar = wrongStrMethodMatch[1];
      const wrongMethod = wrongStrMethodMatch[2];
      const argInside = wrongStrMethodMatch[3].trim();
      const methodFixes: Record<string, { py: string; desc: string }> = {
        toUpperCase: { py: `${targetVar}.upper()`, desc: `.upper()` },
        toLowerCase: { py: `${targetVar}.lower()`, desc: `.lower()` },
        trim: { py: `${targetVar}.strip()`, desc: `.strip()` },
        charAt: { py: `${targetVar}[${argInside || '0'}]`, desc: `${targetVar}[i]` },
        substr: { py: `${targetVar}[${argInside.replace(/\s*,\s*/, ':')}]`, desc: `cắt xâu ${targetVar}[start:end]` },
        substring: { py: `${targetVar}[${argInside.replace(/\s*,\s*/, ':')}]`, desc: `cắt xâu ${targetVar}[start:end]` },
        len: { py: `len(${targetVar})`, desc: `hàm len(${targetVar})` },
      };
      const fixInfo = methodFixes[wrongMethod];
      if (fixInfo) {
        errors.push({
          id: `wrong-str-method-${lineNum}`,
          line: lineNum,
          column: rawLine.indexOf(`.${wrongMethod}`) + 1,
          severity: 'error',
          category: 'semantics',
          rule: 'wrong-string-method',
          message: `Dòng ${lineNum}: Trong Python xâu kí tự không có phương thức ".${wrongMethod}()". Hãy dùng ${fixInfo.desc}.`,
          suggestion: rawLine.replace(wrongStrMethodMatch[0], fixInfo.py),
          fixable: true,
        });
      }
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

  // 4.10 Kiểm tra hàm đã định nghĩa nhưng chưa có lệnh gọi chạy ở bất kỳ đâu trong bài
  for (const fn of definedFunctions) {
    const codeLinesExceptDef = lines.filter((_, idx) => idx + 1 !== fn.line).join('\n');
    const callRegex = new RegExp(`(^|\\s|\\b)${fn.name}\\s*\\(`, 'm');
    if (!callRegex.test(codeLinesExceptDef)) {
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

    // 4. Sửa boolean viết thường hoặc sai kiểu hoa/thường: true -> True, false -> False
    if (/\b(?:true|TRUE)\b/.test(line)) {
      line = line.replace(/\b(?:true|TRUE)\b/g, 'True');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi thành "True".`);
    }
    if (/\b(?:false|FALSE)\b/.test(line)) {
      line = line.replace(/\b(?:false|FALSE)\b/g, 'False');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi thành "False".`);
    }

    // 5. Sửa null / nil / none / NULL / NONE -> None
    if (/\b(?:null|nil|none|NULL|NONE)\b/.test(line) && !line.includes('def none')) {
      line = line.replace(/\b(?:null|nil|none|NULL|NONE)\b/g, 'None');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi thành "None".`);
    }

    // 6. Sửa từ khóa viết hoa/thường sai (Def -> def, For -> for, While -> while, If -> if, Return -> return...)
    const capKwFixes = ['def', 'for', 'while', 'if', 'elif', 'else', 'return', 'break', 'continue', 'import', 'from', 'pass', 'class'];
    for (const kw of capKwFixes) {
      const regex = new RegExp(`\\b(${kw.charAt(0).toUpperCase() + kw.slice(1)}|${kw.toUpperCase()})\\b`, 'g');
      if (regex.test(line)) {
        line = line.replace(regex, kw);
        lines[i] = line;
        fixesApplied.push(`Dòng ${i + 1}: Đổi từ khóa viết hoa thành chữ thường chuẩn "${kw}".`);
      }
    }

    // 7. Sửa từ khóa ngôn ngữ khác:
    // 7.1 function / func / procedure / sub / void -> def
    if (/^\s*(?:function|func|procedure|sub|void)\b/.test(line)) {
      line = line.replace(/^(?:\s*)(?:function|func|procedure|sub|void)\b/, (m) => m.replace(/\w+$/, 'def'));
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi từ khóa khai báo hàm thành "def".`);
    }
    // 7.2 var / let / const / dim x = ... -> x = ...
    if (/^\s*(?:var|let|const|dim)\s+([a-zA-Z_]\w*\s*=)/.test(line)) {
      line = line.replace(/^\s*(?:var|let|const|dim)\s+/, '');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Bỏ từ khóa khai báo biến dư thừa.`);
    }
    // 7.3 int / float / string / bool x = ... -> x = ...
    if (/^\s*(?:int|float|string|str|bool)\s+([a-zA-Z_]\w*\s*=)/.test(line)) {
      line = line.replace(/^\s*(?:int|float|string|str|bool)\s+/, '');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Bỏ từ khóa kiểu dữ liệu C/Java trước tên biến.`);
    }

    // 8. Sửa else if -> elif
    if (/\belse\s+if\b/.test(line)) {
      line = line.replace(/\belse\s+if\b/g, 'elif');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi "else if" thành "elif".`);
    }

    // 9. Bỏ "then" trong if và "do" trong while
    if (/^\s*if\s+.*\b(?:then)\s*(?::|$)/.test(line)) {
      line = line.replace(/\bthen\s*(:|$)/, ':');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Xóa từ khóa "then" trong câu lệnh if.`);
    }
    if (/^\s*while\s+.*\b(?:do)\s*(?::|$)/.test(line)) {
      line = line.replace(/\bdo\s*(:|$)/, ':');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Xóa từ khóa "do" trong câu lệnh while.`);
    }

    // 10. Sửa từ khóa sai trong vòng lặp for: for i im range(...) -> for i in range(...)
    const forLoopFixMatch = line.match(/^(\s*for\s+[a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*\s+)(im|inn|on|of|into|within)\s+/);
    if (forLoopFixMatch) {
      line = line.replace(forLoopFixMatch[0], `${forLoopFixMatch[1]}in `);
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Sửa từ khóa vòng lặp "${forLoopFixMatch[2]}" thành "in".`);
    }

    // 11. Sửa từ khóa gõ sai chính tả (COMMON_KEYWORD_TYPOS)
    for (const [wrong, info] of Object.entries(COMMON_KEYWORD_TYPOS)) {
      const typoRegex = new RegExp(`\\b${wrong}\\b`, 'g');
      if (typoRegex.test(line)) {
        line = line.replace(typoRegex, info.correct);
        lines[i] = line;
        fixesApplied.push(`Dòng ${i + 1}: Sửa lỗi chính tả từ khóa "${wrong}" thành "${info.correct}".`);
      }
    }

    // 12. Sửa nhầm '=' thành '==' trong if/elif/while
    if (/^(if|elif|while)\s+/.test(trimmed)) {
      const assignmentRegex = /(?<![<>=!])=(?!=)/;
      if (assignmentRegex.test(line) && !line.includes('==')) {
        line = line.replace(assignmentRegex, '==');
        lines[i] = line;
        fixesApplied.push(`Dòng ${i + 1}: Sửa dấu gán "=" thành so sánh "==".`);
      }
    }

    // 13. Sửa '==' thành '=' khi gán biến ở đầu dòng
    if (/^\s*[a-zA-Z_]\w*\s*==\s*[^=]/.test(line) && !/^(if|elif|while|assert|return)/.test(trimmed)) {
      line = line.replace('==', '=');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Sửa "==" thành dấu gán "=".`);
    }

    // 14. Sửa := thành =
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

    // 13. Sửa phương thức mảng .push -> .append và phương thức xâu JS/Java (.toUpperCase, .toLowerCase, .trim, .len)
    if (/\.push\s*\(/.test(line)) {
      line = line.replace(/\.push\(/g, '.append(');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi ".push()" thành ".append()".`);
    }
    if (/\.toUpperCase\s*\(\s*\)/.test(line)) {
      line = line.replace(/\.toUpperCase\s*\(\s*\)/g, '.upper()');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi ".toUpperCase()" thành ".upper()".`);
    }
    if (/\.toLowerCase\s*\(\s*\)/.test(line)) {
      line = line.replace(/\.toLowerCase\s*\(\s*\)/g, '.lower()');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi ".toLowerCase()" thành ".lower()".`);
    }
    if (/\.trim\s*\(\s*\)/.test(line)) {
      line = line.replace(/\.trim\s*\(\s*\)/g, '.strip()');
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi ".trim()" thành ".strip()".`);
    }
    const dotLenMatch = line.match(/\b([a-zA-Z_]\w*)\.(?:len|size)\s*\(\s*\)|\b([a-zA-Z_]\w*)\.length\b/);
    if (dotLenMatch) {
      const targetV = dotLenMatch[1] || dotLenMatch[2];
      line = line.replace(dotLenMatch[0], `len(${targetV})`);
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi "${dotLenMatch[0]}" thành "len(${targetV})".`);
    }

    // 13.5 Sửa dấu ":" trong range(a:b:c) thành dấu phẩy range(a, b, c)
    if (/\brange\s*\([^)]*:[^)]*\)/.test(line)) {
      line = line.replace(/\brange\s*\(([^)]*:[^)]*)\)/g, (_, inner) => {
        return `range(${inner.split(':').map((s: string) => s.trim()).join(', ')})`;
      });
      lines[i] = line;
      fixesApplied.push(`Dòng ${i + 1}: Đổi dấu ":" trong hàm range() thành dấu phẩy "," chuẩn.`);
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

  // 18.5 Tự động sửa lỗi gõ sai tên biến, lỗi cắt xâu dùng dấu phẩy, và lỗi gán kí tự vào xâu bất biến
  const tempDiagnostics = lintPythonCode(lines.join('\n'));
  for (const err of tempDiagnostics.errors) {
    if (
      (err.rule === 'undefined-variable-typo' ||
        err.rule === 'string-slice-comma' ||
        err.rule === 'wrong-string-method') &&
      err.fixable &&
      err.suggestion
    ) {
      const lineIdx = err.line - 1;
      if (lineIdx >= 0 && lineIdx < lines.length) {
        lines[lineIdx] = err.suggestion;
        fixesApplied.push(`Dòng ${err.line}: ${err.message}`);
      }
    } else if (err.rule === 'string-item-assignment' && err.fixable && err.suggestion) {
      const lineIdx = err.line - 1;
      if (lineIdx >= 0 && lineIdx < lines.length) {
        const indent = lines[lineIdx].match(/^(\s*)/)?.[1] || '';
        const cleanFix = err.suggestion.replace(/^Hãy dùng phép cắt ghép xâu:\s*/, '');
        lines[lineIdx] = `${indent}${cleanFix}`;
        fixesApplied.push(`Dòng ${err.line}: Chuyển phép gán kí tự trực tiếp sang phép cắt ghép xâu mới.`);
      }
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

    if (rawError.includes("cannot assign to")) {
      const kwMatch = rawError.match(/cannot assign to (\w+)/);
      const kwName = kwMatch ? kwMatch[1] : 'từ khóa';
      specificExplanation = `Dòng ${line || ''} mắc lỗi từ khóa nghiêm trọng: Cố gắng gán giá trị cho từ khóa "${kwName}". Trong Python, từ khóa dành riêng không thể dùng làm tên biến.`;
      specificSuggestion = `Đổi tên biến "${kwName}" thành tên khác như "my_${kwName}" hoặc "${kwName}_val".`;
    } else if (rawError.includes("expected ':'")) {
      specificExplanation = `Dòng ${line || ''} thiếu dấu hai chấm ":" bắt buộc ở cuối câu lệnh (ví dụ: def, for, if, while).`;
      specificSuggestion = 'Thêm dấu ":" vào cuối dòng.';
    } else if (rawError.includes("unmatched ')'") || rawError.includes("unmatched ']'")) {
      specificExplanation = `Dòng ${line || ''} có dấu đóng ngoặc không khớp hoặc bị thừa.`;
      specificSuggestion = 'Kiểm tra lại số lượng và thứ tự mở/đóng các cặp ngoặc (), [].';
    } else if (rawError.includes('Perhaps you forgot a comma?')) {
      specificExplanation = `Dòng ${line || ''} thiếu dấu phẩy "," ngăn cách giữa các phần tử trong danh sách hoặc tham số hàm.`;
      specificSuggestion = 'Thêm dấu phẩy giữa các phần tử: ví dụ [1, 2, 3].';
    } else if (rawError.includes('unterminated string literal') || rawError.includes('EOL while scanning string literal')) {
      specificExplanation = `Dòng ${line || ''} có xâu kí tự chưa được đóng dấu nháy (' hoặc ").`;
      specificSuggestion = 'Thêm dấu nháy đóng tương ứng ở cuối xâu kí tự.';
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
    let hint = `Hãy gán giá trị cho "${varName}" trước khi sử dụng (ví dụ: ${varName} = 0 hoặc ${varName} = "") hoặc kiểm tra xem bạn có viết sai chính tả tên biến không.`;
    let isKwError = false;

    // Kiểm tra nếu tên biến chưa khai báo thực chất là do gõ sai từ khóa hoặc viết hoa từ khóa
    const lowerVar = varName.toLowerCase();
    if (LOWER_CASE_KEYWORDS_MAP[lowerVar]) {
      isKwError = true;
      hint = `Từ khóa "${varName}" bị lỗi chữ hoa/thường! Trong Python từ khóa này bắt buộc phải viết chữ thường: "${LOWER_CASE_KEYWORDS_MAP[lowerVar]}".`;
    } else if (COMMON_KEYWORD_TYPOS[varName]) {
      isKwError = true;
      hint = `Lỗi từ khóa chính tả! Bạn gõ "${varName}", từ khóa đúng trong Python là "${COMMON_KEYWORD_TYPOS[varName].correct}".`;
    } else if (varName === 'true' || varName === 'false') {
      isKwError = true;
      hint = `Trong Python, giá trị đúng/sai bắt buộc phải viết hoa chữ cái đầu: "${varName === 'true' ? 'True' : 'False'}".`;
    } else if (varName === 'null') {
      isKwError = true;
      hint = 'Trong Python không có "null", hãy dùng giá trị "None" (viết hoa chữ N).';
    } else {
      // Tìm từ khóa gần nhất bằng Levenshtein
      for (const kw of STATEMENT_KEYWORDS) {
        if (levenshteinDistance(lowerVar, kw) <= (kw.length <= 3 ? 1 : 2)) {
          isKwError = true;
          hint = `Có phải bạn gõ sai từ khóa "${kw}" thành "${varName}" không? Hãy sửa lại thành "${kw}".`;
          break;
        }
      }
    }

    return {
      title: isKwError ? 'Lỗi từ khóa (Keyword NameError)' : 'Lỗi tên biến chưa khai báo (NameError)',
      vietnameseExplanation: isKwError
        ? `Phát hiện lỗi từ khóa ở dòng ${line || ''}: Từ "${varName}" bị máy tính hiểu nhầm là tên biến vì gõ sai chính tả hoặc sai hoa/thường!`
        : `Biến hoặc hàm "${varName}" được sử dụng nhưng máy tính chưa biết nó được tạo ra từ đâu.`,
      suggestion: hint,
      line,
    };
  }

  if (rawError.includes('IndexError')) {
    const isStringIdx = rawError.includes('string index out of range');
    return {
      title: isStringIdx
        ? 'Lỗi vượt quá chỉ số xâu kí tự (IndexError: string index out of range)'
        : 'Lỗi vượt quá chỉ số mảng (IndexError: list index out of range)',
      vietnameseExplanation: isStringIdx
        ? 'Bạn đang truy cập vào vị trí kí tự s[i] vượt ngoài độ dài của xâu (hoặc xâu đang rỗng).'
        : 'Bạn đang truy cập vào một vị trí (index) không tồn tại trong danh sách.',
      suggestion: isStringIdx
        ? 'Nhớ rằng chỉ số của xâu s bắt đầu từ 0 đến len(s) - 1. Nếu dùng phép cắt xâu s[a:b] thì không bao giờ bị lỗi vượt chỉ số.'
        : 'Nhớ rằng chỉ số mảng trong Python bắt đầu từ 0 đến len(arr) - 1. Nếu duyệt mảng và truy cập arr[i+1], hãy giới hạn vòng lặp là range(len(arr) - 1).',
      line,
    };
  }

  if (rawError.includes('TypeError')) {
    let exp = 'Đang thực hiện phép toán giữa 2 kiểu dữ liệu không tương thích với nhau.';
    let sug = 'Kiểm tra kiểu dữ liệu của các biến tham gia phép toán.';

    if (rawError.includes("'str' object does not support item assignment")) {
      exp = 'Trong Python, xâu kí tự (str) là kiểu dữ liệu bất biến (immutable), không thể gán trực tiếp s[i] = "..." để đổi 1 kí tự.';
      sug = 'Hãy tạo xâu mới bằng phép cắt ghép: s = s[:i] + "kí_tự_mới" + s[i+1:] hoặc chuyển sang list(s).';
    } else if (rawError.includes('can only concatenate str')) {
      exp = 'Bạn đang cộng trực tiếp một xâu kí tự (str) với một số (int/float).';
      sug = 'Hãy ép kiểu số sang xâu bằng hàm str(so) trước khi ghép nối với xâu kí tự.';
    } else if (rawError.includes('string indices must be integers')) {
      exp = 'Chỉ số truy cập xâu kí tự s[...] phải là số nguyên (int) hoặc lát cắt (slice dùng dấu ":"), không được dùng chuỗi hay dấu phẩy.';
      sug = 'Nếu muốn cắt xâu, hãy dùng dấu hai chấm ":" (ví dụ: s[1:4] hoặc s[::2]).';
    } else if (rawError.includes("'list' object is not callable") || rawError.includes("'str' object is not callable")) {
      exp = 'Bạn đang dùng ngoặc tròn () trên một danh sách hoặc xâu kí tự như thể gọi hàm (ví dụ: s(i) hoặc arr(i)).';
      sug = 'Để truy cập phần tử hoặc kí tự trong Python, bạn bắt buộc phải dùng ngoặc vuông: s[i] hoặc arr[i].';
    } else if (rawError.includes('indices must be integers or slices, not float')) {
      exp = 'Chỉ số mảng hoặc xâu đang là số thực (float) do bạn dùng phép chia "/".';
      sug = 'Hãy dùng phép chia lấy phần nguyên "//" (ví dụ: s[len(s) // 2]).';
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

  if (rawError.includes('ValueError')) {
    let exp = 'Giá trị truyền vào hàm hoặc phép toán không hợp lệ.';
    let sug = 'Kiểm tra lại dữ liệu đầu vào hoặc tham số câu lệnh.';
    if (rawError.includes('slice step cannot be zero')) {
      exp = 'Bước nhảy (step) khi cắt xâu hoặc danh sách [start:stop:step] không được phép bằng 0.';
      sug = 'Hãy dùng bước nhảy khác 0 (ví dụ: s[::2] để lấy các vị trí chẵn, hoặc s[::-1] để đảo ngược xâu).';
    } else if (rawError.includes('invalid literal for int()')) {
      exp = 'Không thể chuyển đổi chuỗi chứa chữ cái hoặc ký tự đặc biệt sang số nguyên bằng int().';
      sug = 'Đảm bảo chuỗi chỉ chứa các chữ số trước khi gọi int().';
    }
    return {
      title: 'Lỗi giá trị không hợp lệ (ValueError)',
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
