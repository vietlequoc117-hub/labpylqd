import { TraceResult, TraceStep, StackFrame, HeapObject, VariableValue, ShellSegment } from '../types';

class WaitingForInputSignal {
  lineNo: number;
  prompt: string;
  varName: string;
  constructor(lineNo: number, prompt: string = '', varName: string = '') {
    this.lineNo = lineNo;
    this.prompt = prompt;
    this.varName = varName;
  }
}

class ReturnSignal {
  value: any;
  constructor(value: any) {
    this.value = value;
  }
}

class BreakSignal {}
class ContinueSignal {}

interface LogicalLine {
  lineNo: number;
  indent: number;
  text: string;
  rawLine: string;
}

interface PyFunction {
  __py_func__: true;
  name: string;
  params: { name: string; defaultExpr?: string }[];
  body: StmtNode[];
  defLineNo: number;
}

interface PyTuple {
  __py_tuple__: true;
  items: any[];
}

function isPyTuple(v: any): v is PyTuple {
  return Boolean(v && typeof v === 'object' && v.__py_tuple__ === true);
}

function createTuple(items: any[]): PyTuple {
  return { __py_tuple__: true, items };
}

type StmtNode =
  | { type: 'simple'; lineNo: number; text: string }
  | {
      type: 'if';
      branches: { cond: string | null; lineNo: number; body: StmtNode[] }[];
    }
  | {
      type: 'while';
      lineNo: number;
      cond: string;
      body: StmtNode[];
    }
  | {
      type: 'for';
      lineNo: number;
      target: string;
      iterExpr: string;
      body: StmtNode[];
    }
  | {
      type: 'def';
      lineNo: number;
      name: string;
      params: { name: string; defaultExpr?: string }[];
      body: StmtNode[];
    };

/**
 * Xóa comment # nằm ngoài chuỗi
 */
function stripComment(line: string): string {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === '#' && !inSingle && !inDouble) {
      return line.slice(0, i);
    }
  }
  return line;
}

/**
 * Gom các dòng có ngoặc chưa đóng (), [], {} thành các LogicalLine
 */
function preprocessLines(code: string): LogicalLine[] {
  const rawLines = code.replace(/\r\n/g, '\n').split('\n');
  const result: LogicalLine[] = [];

  let accText = '';
  let startLineNo = 1;
  let startIndent = 0;
  let startRaw = '';
  let depth = 0;

  const countBracketDelta = (str: string): number => {
    let d = 0;
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === "'" && !inDouble) inSingle = !inSingle;
      else if (ch === '"' && !inSingle) inDouble = !inDouble;
      else if (!inSingle && !inDouble) {
        if (ch === '(' || ch === '[' || ch === '{') d++;
        else if (ch === ')' || ch === ']' || ch === '}') d--;
      }
    }
    return d;
  };

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const clean = stripComment(raw);
    const trimmed = clean.trim();

    if (depth === 0) {
      if (!trimmed) continue;
      const indentMatch = clean.match(/^([ \t]*)/);
      const indentStr = indentMatch ? indentMatch[1].replace(/\t/g, '    ') : '';
      startIndent = indentStr.length;
      startLineNo = i + 1;
      startRaw = raw;
      accText = trimmed;
      depth = countBracketDelta(clean);
      if (depth <= 0) {
        depth = 0;
        result.push({
          lineNo: startLineNo,
          indent: startIndent,
          text: accText,
          rawLine: startRaw,
        });
        accText = '';
      }
    } else {
      if (trimmed) {
        accText += ' ' + trimmed;
        depth += countBracketDelta(clean);
      }
      if (depth <= 0) {
        depth = 0;
        result.push({
          lineNo: startLineNo,
          indent: startIndent,
          text: accText,
          rawLine: startRaw,
        });
        accText = '';
      }
    }
  }

  if (accText) {
    result.push({
      lineNo: startLineNo,
      indent: startIndent,
      text: accText,
      rawLine: startRaw,
    });
  }

  return result;
}

/**
 * Parse danh sách LogicalLine thành cây StmtNode theo thụt lề Python
 */
function parseBlock(lines: LogicalLine[], startIdx: number, baseIndent: number): { nodes: StmtNode[]; nextIdx: number } {
  const nodes: StmtNode[] = [];
  let i = startIdx;

  while (i < lines.length) {
    const line = lines[i];
    if (line.indent < baseIndent) {
      break;
    }

    const text = line.text;

    // 1. if / elif / else
    if (/^if\s+.*:\s*$/.test(text)) {
      const cond = text.replace(/^if\s+/, '').replace(/:\s*$/, '').trim();
      i++;
      let body: StmtNode[] = [];
      if (i < lines.length && lines[i].indent > line.indent) {
        const sub = parseBlock(lines, i, lines[i].indent);
        body = sub.nodes;
        i = sub.nextIdx;
      }
      const branches: { cond: string | null; lineNo: number; body: StmtNode[] }[] = [
        { cond, lineNo: line.lineNo, body },
      ];

      while (i < lines.length && lines[i].indent === line.indent) {
        const brLine = lines[i];
        if (/^elif\s+.*:\s*$/.test(brLine.text)) {
          const elifCond = brLine.text.replace(/^elif\s+/, '').replace(/:\s*$/, '').trim();
          i++;
          let elifBody: StmtNode[] = [];
          if (i < lines.length && lines[i].indent > brLine.indent) {
            const sub = parseBlock(lines, i, lines[i].indent);
            elifBody = sub.nodes;
            i = sub.nextIdx;
          }
          branches.push({ cond: elifCond, lineNo: brLine.lineNo, body: elifBody });
        } else if (/^else\s*:\s*$/.test(brLine.text)) {
          i++;
          let elseBody: StmtNode[] = [];
          if (i < lines.length && lines[i].indent > brLine.indent) {
            const sub = parseBlock(lines, i, lines[i].indent);
            elseBody = sub.nodes;
            i = sub.nextIdx;
          }
          branches.push({ cond: null, lineNo: brLine.lineNo, body: elseBody });
          break;
        } else {
          break;
        }
      }

      nodes.push({ type: 'if', branches });
      continue;
    }

    // 2. while
    if (/^while\s+.*:\s*$/.test(text)) {
      const cond = text.replace(/^while\s+/, '').replace(/:\s*$/, '').trim();
      i++;
      let body: StmtNode[] = [];
      if (i < lines.length && lines[i].indent > line.indent) {
        const sub = parseBlock(lines, i, lines[i].indent);
        body = sub.nodes;
        i = sub.nextIdx;
      }
      nodes.push({ type: 'while', lineNo: line.lineNo, cond, body });
      continue;
    }

    // 3. for
    const forMatch = text.match(/^for\s+(.+?)\s+in\s+(.+):\s*$/);
    if (forMatch) {
      const target = forMatch[1].trim();
      const iterExpr = forMatch[2].trim();
      i++;
      let body: StmtNode[] = [];
      if (i < lines.length && lines[i].indent > line.indent) {
        const sub = parseBlock(lines, i, lines[i].indent);
        body = sub.nodes;
        i = sub.nextIdx;
      }
      nodes.push({ type: 'for', lineNo: line.lineNo, target, iterExpr, body });
      continue;
    }

    // 4. def
    const defMatch = text.match(/^def\s+([a-zA-Z_]\w*)\s*\((.*)\)\s*:\s*$/);
    if (defMatch) {
      const name = defMatch[1];
      const rawParams = defMatch[2].trim();
      const params: { name: string; defaultExpr?: string }[] = [];
      if (rawParams) {
        const parts = splitTopLevel(rawParams, ',');
        for (const p of parts) {
          const eqIdx = p.indexOf('=');
          if (eqIdx !== -1) {
            params.push({
              name: p.slice(0, eqIdx).trim(),
              defaultExpr: p.slice(eqIdx + 1).trim(),
            });
          } else {
            const pName = p.split(':')[0].trim();
            if (pName) params.push({ name: pName });
          }
        }
      }
      i++;
      let body: StmtNode[] = [];
      if (i < lines.length && lines[i].indent > line.indent) {
        const sub = parseBlock(lines, i, lines[i].indent);
        body = sub.nodes;
        i = sub.nextIdx;
      }
      nodes.push({ type: 'def', lineNo: line.lineNo, name, params, body });
      continue;
    }

    // 5. Inline single-line if/for/def fallback (e.g. `if not swapped: break`)
    const inlineIfMatch = text.match(/^if\s+(.+?):\s*(.+)$/);
    if (inlineIfMatch && !text.includes(' else ')) {
      nodes.push({
        type: 'if',
        branches: [
          {
            cond: inlineIfMatch[1].trim(),
            lineNo: line.lineNo,
            body: [{ type: 'simple', lineNo: line.lineNo, text: inlineIfMatch[2].trim() }],
          },
        ],
      });
      i++;
      continue;
    }

    nodes.push({ type: 'simple', lineNo: line.lineNo, text });
    i++;
  }

  return { nodes, nextIdx: i };
}

/**
 * Tách chuỗi theo delimiter ở mức ngoặc ngoài cùng (top-level)
 */
function splitTopLevel(str: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let depth = 0;
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '\\') {
      current += ch + (str[i + 1] || '');
      i++;
      continue;
    }
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      current += ch;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      current += ch;
      continue;
    }
    if (!inSingle && !inDouble) {
      if (ch === '(' || ch === '[' || ch === '{') depth++;
      else if (ch === ')' || ch === ']' || ch === '}') depth--;

      if (depth === 0 && str.slice(i, i + delimiter.length) === delimiter) {
        result.push(current.trim());
        current = '';
        i += delimiter.length - 1;
        continue;
      }
    }
    current += ch;
  }
  if (current.trim() !== '' || result.length > 0) {
    result.push(current.trim());
  }
  return result;
}

/**
 * Kiểm tra giá trị truthy theo chuẩn Python
 */
function pyTruthy(val: any): boolean {
  if (val === null || val === undefined || val === false) return false;
  if (val === true) return true;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') return val.length > 0;
  if (Array.isArray(val)) return val.length > 0;
  if (isPyTuple(val)) return val.items.length > 0;
  if (val instanceof Set) return val.size > 0;
  if (typeof val === 'object') return Object.keys(val).length > 0;
  return Boolean(val);
}

/**
 * Chuyển đổi sang chuỗi kiểu Python str(val)
 */
function pyStr(val: any): string {
  if (val === null || val === undefined) return 'None';
  if (val === true) return 'True';
  if (val === false) return 'False';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    return '[' + val.map((v) => pyRepr(v)).join(', ') + ']';
  }
  if (isPyTuple(val)) {
    if (val.items.length === 1) return '(' + pyRepr(val.items[0]) + ',)';
    return '(' + val.items.map((v) => pyRepr(v)).join(', ') + ')';
  }
  if (val instanceof Set) {
    const items = Array.from(val);
    if (items.length === 0) return 'set()';
    return '{' + items.map((v) => pyRepr(v)).join(', ') + '}';
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val).filter(([k]) => !k.startsWith('__'));
    return '{' + entries.map(([k, v]) => `${pyRepr(k)}: ${pyRepr(v)}`).join(', ') + '}';
  }
  return String(val);
}

function pyRepr(val: any): string {
  if (typeof val === 'string') {
    return `'${val}'`;
  }
  return pyStr(val);
}

/**
 * So sánh bằng theo chuẩn Python
 */
function pyEquals(a: any, b: any): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, idx) => pyEquals(v, b[idx]));
  }
  if (isPyTuple(a) && isPyTuple(b)) {
    if (a.items.length !== b.items.length) return false;
    return a.items.every((v, idx) => pyEquals(v, b.items[idx]));
  }
  return false;
}

// ============================================================================
// TOKENIZER CHO BIỂU THỨC PYTHON
// ============================================================================

type TokenType = 'NUMBER' | 'STRING' | 'FSTRING' | 'IDENT' | 'OP' | 'PUNCT' | 'EOF';

interface Token {
  type: TokenType;
  value: string;
}

function tokenizeExpr(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = expr.length;

  while (i < n) {
    const ch = expr[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // F-string: f"..." or f'...' or F"..."
    if ((ch === 'f' || ch === 'F') && (expr[i + 1] === '"' || expr[i + 1] === "'")) {
      const quote = expr[i + 1];
      i += 2;
      let s = '';
      let braceDepth = 0;
      while (i < n && (expr[i] !== quote || braceDepth > 0)) {
        if (expr[i] === '\\' && i + 1 < n) {
          const next = expr[i + 1];
          if (next === 'n') s += '\n';
          else if (next === 't') s += '\t';
          else s += next;
          i += 2;
        } else {
          if (expr[i] === '{') braceDepth++;
          else if (expr[i] === '}' && braceDepth > 0) braceDepth--;
          s += expr[i];
          i++;
        }
      }
      i++; // skip closing quote
      tokens.push({ type: 'FSTRING', value: s });
      continue;
    }

    // String literal
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      let s = '';
      while (i < n && expr[i] !== quote) {
        if (expr[i] === '\\' && i + 1 < n) {
          const next = expr[i + 1];
          if (next === 'n') s += '\n';
          else if (next === 't') s += '\t';
          else s += next;
          i += 2;
        } else {
          s += expr[i];
          i++;
        }
      }
      i++; // skip closing quote
      tokens.push({ type: 'STRING', value: s });
      continue;
    }

    // Number literal
    if (/\d/.test(ch) || (ch === '.' && i + 1 < n && /\d/.test(expr[i + 1]))) {
      let numStr = '';
      while (i < n && /[\d.]/.test(expr[i])) {
        numStr += expr[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    // Two-character operators
    const twoChar = expr.slice(i, i + 2);
    if (['==', '!=', '<=', '>=', '//', '**'].includes(twoChar)) {
      tokens.push({ type: 'OP', value: twoChar });
      i += 2;
      continue;
    }

    // Single-character operators
    if (['+', '-', '*', '/', '%', '<', '>'].includes(ch)) {
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }

    // Punctuation
    if (['(', ')', '[', ']', '{', '}', ',', ':', '.', '='].includes(ch)) {
      tokens.push({ type: 'PUNCT', value: ch });
      i++;
      continue;
    }

    // Identifier or Keyword
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < n && /[a-zA-Z0-9_]/.test(expr[i])) {
        ident += expr[i];
        i++;
      }
      tokens.push({ type: 'IDENT', value: ident });
      continue;
    }

    // Fallback skip unknown char
    i++;
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

// ============================================================================
// BỘ THÔNG DỊCH VÀ GHI VẾT TỪNG BƯỚC PYTHON (LOCAL PYTHON TRACER)
// ============================================================================

export function runLocalPythonTrace(
  codeStr: string,
  stdinInput: string = '',
  maxSteps: number = 800,
  interactiveMode: boolean = false,
  interactiveInputs: string[] = []
): TraceResult {
  const steps: TraceStep[] = [];
  const shellSegments: ShellSegment[] = [];
  let stdoutCapture = '';

  const objIdMap = new WeakMap<object, string>();
  let nextHeapId = 1;

  const getRefId = (obj: object, typePrefix: string): string => {
    let existing = objIdMap.get(obj);
    if (!existing) {
      existing = `${typePrefix}_${nextHeapId++}`;
      objIdMap.set(obj, existing);
    }
    return existing;
  };

  // Call stack frames: bottom is Global frame
  const callStack: {
    name: string;
    lineNo: number;
    locals: Record<string, any>;
  }[] = [
    {
      name: 'Global frame',
      lineNo: 1,
      locals: {},
    },
  ];

  const getCurrentLocals = () => callStack[callStack.length - 1].locals;
  const getGlobalLocals = () => callStack[0].locals;

  const lookupVar = (name: string): any => {
    for (let i = callStack.length - 1; i >= 0; i--) {
      if (name in callStack[i].locals) {
        return callStack[i].locals[name];
      }
    }
    throw new Error(`NameError: name '${name}' is not defined`);
  };

  const setVar = (name: string, val: any) => {
    callStack[callStack.length - 1].locals[name] = val;
  };

  // Chuẩn bị dữ liệu stdin
  const codeLines = (codeStr || '').split(/\r?\n/);
  const rawStdin = (stdinInput || '').trim();
  const stdinLines = rawStdin ? rawStdin.split(/\r?\n/) : [];
  const stdinTokens = rawStdin ? rawStdin.replace(/,/g, ' ').split(/\s+/).filter(Boolean) : [];
  let stdinLineIdx = 0;
  let stdinTokenIdx = 0;
  const defaultIntFallbacks = ['5', '10', '3', '8', '2', '7', '4', '6'];
  let fallbackIdx = 0;
  let interactiveIdx = 0;
  const totalInputCallsInCode = (codeStr.match(/input\s*\(/g) || []).length;

  let currentExecutingLine = 1;

  // Serialize giá trị biến và cập nhật currentStepHeap
  const serializeValue = (
    val: any,
    currentStepHeap: Record<string, HeapObject>,
    depth: number = 0
  ): VariableValue => {
    if (depth > 8) {
      return { type: 'primitive', value: '...' };
    }
    if (val === null || val === undefined) {
      return { type: 'NoneType', value: 'None' };
    }
    if (typeof val === 'boolean') {
      return { type: 'bool', value: val };
    }
    if (typeof val === 'number') {
      const isInt = Number.isInteger(val);
      return { type: isInt ? 'int' : 'float', value: val };
    }
    if (typeof val === 'string') {
      return { type: 'str', value: val };
    }
    if (val && typeof val === 'object' && val.__py_func__) {
      return { type: 'function', value: `func ${val.name}()` };
    }

    if (Array.isArray(val)) {
      const refId = getRefId(val, 'list');
      if (!currentStepHeap[refId]) {
        currentStepHeap[refId] = {
          id: refId,
          type: 'list',
          elements: [],
        };
        currentStepHeap[refId].elements = val.map((item, idx) => {
          const ser = serializeValue(item, currentStepHeap, depth + 1);
          const el: any = {
            index: idx,
            type: ser.type,
            value: ser.value,
          };
          if (ser.ref_id) el.ref_id = ser.ref_id;
          return el;
        });
      }
      return { type: 'ref', ref_id: refId, value: `[${refId}]` };
    }

    if (isPyTuple(val)) {
      const refId = getRefId(val, 'tuple');
      if (!currentStepHeap[refId]) {
        currentStepHeap[refId] = {
          id: refId,
          type: 'tuple',
          elements: [],
        };
        currentStepHeap[refId].elements = val.items.map((item, idx) => {
          const ser = serializeValue(item, currentStepHeap, depth + 1);
          const el: any = {
            index: idx,
            type: ser.type,
            value: ser.value,
          };
          if (ser.ref_id) el.ref_id = ser.ref_id;
          return el;
        });
      }
      return { type: 'ref', ref_id: refId, value: `[${refId}]` };
    }

    if (val instanceof Set) {
      const refId = getRefId(val, 'set');
      if (!currentStepHeap[refId]) {
        currentStepHeap[refId] = {
          id: refId,
          type: 'set',
          elements: [],
        };
        currentStepHeap[refId].elements = Array.from(val).map((item, idx) => {
          const ser = serializeValue(item, currentStepHeap, depth + 1);
          const el: any = {
            index: idx,
            type: ser.type,
            value: ser.value,
          };
          if (ser.ref_id) el.ref_id = ser.ref_id;
          return el;
        });
      }
      return { type: 'ref', ref_id: refId, value: `[${refId}]` };
    }

    if (typeof val === 'object') {
      const refId = getRefId(val, 'dict');
      if (!currentStepHeap[refId]) {
        currentStepHeap[refId] = {
          id: refId,
          type: 'dict',
          elements: [],
        };
        currentStepHeap[refId].elements = Object.entries(val)
          .filter(([k]) => !k.startsWith('__'))
          .map(([k, v]) => {
            const ser = serializeValue(v, currentStepHeap, depth + 1);
            const el: any = {
              key: String(k),
              type: ser.type,
              value: ser.value,
            };
            if (ser.ref_id) el.ref_id = ser.ref_id;
            return el;
          });
      }
      return { type: 'ref', ref_id: refId, value: `[${refId}]` };
    }

    return { type: 'primitive', value: String(val) };
  };

  // Ghi nhận 1 bước vào steps[]
  const recordStep = (
    lineNo: number,
    event: 'call' | 'line' | 'return' | 'exception' = 'line',
    returnVal?: any,
    exceptionMsg?: string
  ) => {
    if (steps.length >= maxSteps) return;
    callStack[callStack.length - 1].lineNo = lineNo;

    const currentStepHeap: Record<string, HeapObject> = {};
    const stackFrames: StackFrame[] = callStack.map((frame, idx) => {
      const cleanVars: Record<string, VariableValue> = {};
      for (const [k, v] of Object.entries(frame.locals)) {
        if (k.startsWith('__')) continue;
        cleanVars[k] = serializeValue(v, currentStepHeap);
      }
      return {
        name: frame.name,
        lineNo: frame.lineNo,
        line_number: frame.lineNo,
        is_active: idx === callStack.length - 1,
        variables: cleanVars,
      };
    });

    const stepData: TraceStep = {
      step_index: steps.length,
      line_number: lineNo,
      event,
      stack_frames: stackFrames,
      heap_objects: JSON.parse(JSON.stringify(currentStepHeap)),
      stdout: stdoutCapture,
      shell_segments: [...shellSegments],
    };

    if (event === 'return') {
      stepData.return_value = serializeValue(returnVal, currentStepHeap);
      stepData.heap_objects = JSON.parse(JSON.stringify(currentStepHeap));
    } else if (event === 'exception' && exceptionMsg) {
      stepData.exception = exceptionMsg;
    }

    steps.push(stepData);
  };

  // Hàm xử lý input()
  const handlePythonInput = (prompt: string = ''): string => {
    if (prompt) {
      stdoutCapture += String(prompt);
      shellSegments.push({ type: 'stdout', text: String(prompt) });
    }

    const callerLineText =
      currentExecutingLine >= 1 && currentExecutingLine <= codeLines.length
        ? codeLines[currentExecutingLine - 1]
        : '';

    if (interactiveMode) {
      if (interactiveIdx < interactiveInputs.length) {
        const val = String(interactiveInputs[interactiveIdx]);
        interactiveIdx++;
        shellSegments.push({ type: 'input', text: val + '\n' });
        return val;
      } else {
        let varName = '';
        const cleanLine = stripComment(callerLineText).trim();
        if (
          cleanLine.includes('=') &&
          !cleanLine.startsWith('if ') &&
          !cleanLine.startsWith('while ')
        ) {
          const lhs = cleanLine.split('=')[0].trim();
          if (/^[a-zA-Z_]\w*$/.test(lhs)) {
            varName = lhs;
          }
        }
        // Ghi nhận bước hiện tại tại dòng đang chờ nhập dữ liệu
        recordStep(currentExecutingLine, 'line');
        throw new WaitingForInputSignal(currentExecutingLine, String(prompt), varName);
      }
    }

    const noSpaceLine = callerLineText.replace(/\s+/g, '');
    const expectsSingleNumber =
      (noSpaceLine.includes('int(input') || noSpaceLine.includes('float(input')) &&
      !callerLineText.includes('.split');
    const expectsSplitLine =
      callerLineText.includes('.split') || callerLineText.includes('list(');

    if (expectsSingleNumber && !expectsSplitLine) {
      if (stdinTokenIdx < stdinTokens.length) {
        const tok = stdinTokens[stdinTokenIdx++];
        if (stdinLineIdx < stdinLines.length && stdinLines[stdinLineIdx].trim() === tok) {
          stdinLineIdx++;
        }
        return tok;
      }
      const val = defaultIntFallbacks[fallbackIdx % defaultIntFallbacks.length];
      fallbackIdx++;
      return val;
    }

    if (
      totalInputCallsInCode > 1 &&
      stdinLines.length === 1 &&
      stdinTokens.length >= totalInputCallsInCode &&
      !expectsSplitLine
    ) {
      if (stdinTokenIdx < stdinTokens.length) {
        return stdinTokens[stdinTokenIdx++];
      }
    }

    if (stdinLineIdx < stdinLines.length) {
      return stdinLines[stdinLineIdx++];
    }

    if (stdinTokenIdx < stdinTokens.length) {
      return stdinTokens[stdinTokenIdx++];
    }

    return expectsSingleNumber ? '5' : 'abcdefg';
  };

  // Chuyển đối tượng thành mảng để lặp
  const toIterableArray = (val: any): any[] => {
    if (Array.isArray(val)) return val;
    if (isPyTuple(val)) return val.items;
    if (typeof val === 'string') return val.split('');
    if (val instanceof Set) return Array.from(val);
    if (val && typeof val === 'object') return Object.keys(val).filter((k) => !k.startsWith('__'));
    throw new Error(`TypeError: '${typeof val}' object is not iterable`);
  };

  // Gán giá trị cho 1 biến hoặc chuỗi biến unpack (ví dụ: `i` hoặc `k, v`)
  const assignLoopTarget = (targetStr: string, val: any) => {
    const parts = splitTopLevel(targetStr, ',');
    if (parts.length === 1) {
      setVar(parts[0].trim(), val);
    } else {
      const arr = toIterableArray(val);
      for (let idx = 0; idx < parts.length; idx++) {
        setVar(parts[idx].trim(), arr[idx]);
      }
    }
  };

  // Đánh giá biểu thức Python
  const evalExpr = (exprStr: string): any => {
    const trimmed = exprStr.trim();
    if (!trimmed) return null;

    const tokens = tokenizeExpr(trimmed);
    let pos = 0;

    const peek = (): Token => tokens[pos] || { type: 'EOF', value: '' };
    const consume = (): Token => tokens[pos++] || { type: 'EOF', value: '' };

    const matchIdent = (word: string): boolean => {
      if (peek().type === 'IDENT' && peek().value === word) {
        pos++;
        return true;
      }
      return false;
    };

    const matchPunct = (p: string): boolean => {
      if (peek().type === 'PUNCT' && peek().value === p) {
        pos++;
        return true;
      }
      return false;
    };

    const matchOp = (op: string): boolean => {
      if (peek().type === 'OP' && peek().value === op) {
        pos++;
        return true;
      }
      return false;
    };

    // Chạy comprehension: `<itemExpr> for <varTarget> in <iterExpr> [if <condExpr>]`
    const evalComprehensionTokens = (
      itemTokens: Token[],
      varTarget: string,
      iterTokens: Token[],
      condTokens: Token[] | null
    ): any[] => {
      const iterVal = evalFromTokens(iterTokens);
      const items = toIterableArray(iterVal);
      const res: any[] = [];
      const locals = getCurrentLocals();
      const hadPrev = varTarget in locals;
      const prevVal = locals[varTarget];

      for (const item of items) {
        assignLoopTarget(varTarget, item);
        if (condTokens) {
          const condVal = evalFromTokens(condTokens);
          if (!pyTruthy(condVal)) continue;
        }
        res.push(evalFromTokens(itemTokens));
      }

      if (hadPrev) locals[varTarget] = prevVal;
      return res;
    };

    const parseTopExpression = (): any => {
      // Hỗ trợ lambda: `lambda x: x + 1`
      if (peek().type === 'IDENT' && peek().value === 'lambda') {
        consume();
        const paramNames: string[] = [];
        while (peek().type !== 'EOF' && !(peek().type === 'PUNCT' && peek().value === ':')) {
          const t = consume();
          if (t.type === 'IDENT') paramNames.push(t.value);
        }
        matchPunct(':');
        const bodyTokens: Token[] = [];
        let d = 0;
        while (peek().type !== 'EOF') {
          const tk = peek();
          if (tk.type === 'PUNCT' && (tk.value === '(' || tk.value === '[' || tk.value === '{')) d++;
          if (tk.type === 'PUNCT' && (tk.value === ')' || tk.value === ']' || tk.value === '}')) {
            if (d === 0) break;
            d--;
          }
          if (tk.type === 'PUNCT' && tk.value === ',' && d === 0) break;
          bodyTokens.push(consume());
        }
        bodyTokens.push({ type: 'EOF', value: '' });
        return {
          __py_lambda__: true,
          params: paramNames,
          bodyTokens,
        };
      }

      const exprVal = parseOr();

      // Ternary conditional: `exprVal if cond else falseVal`
      if (peek().type === 'IDENT' && peek().value === 'if') {
        consume(); // consume 'if'
        const condVal = parseOr();
        if (matchIdent('else')) {
          const falseVal = parseTopExpression();
          return pyTruthy(condVal) ? exprVal : falseVal;
        }
      }

      return exprVal;
    };

    const parseOr = (): any => {
      let left = parseAnd();
      while (peek().type === 'IDENT' && peek().value === 'or') {
        consume();
        const right = parseAnd();
        left = pyTruthy(left) ? left : right;
      }
      return left;
    };

    const parseAnd = (): any => {
      let left = parseNot();
      while (peek().type === 'IDENT' && peek().value === 'and') {
        consume();
        const right = parseNot();
        left = !pyTruthy(left) ? left : right;
      }
      return left;
    };

    const parseNot = (): any => {
      if (peek().type === 'IDENT' && peek().value === 'not') {
        consume();
        return !pyTruthy(parseNot());
      }
      return parseComparison();
    };

    const isComparisonNext = (): boolean => {
      const tk = peek();
      if (tk.type === 'OP' && ['==', '!=', '<', '<=', '>', '>='].includes(tk.value)) return true;
      if (tk.type === 'IDENT' && (tk.value === 'in' || tk.value === 'is')) return true;
      if (
        tk.type === 'IDENT' &&
        tk.value === 'not' &&
        tokens[pos + 1]?.type === 'IDENT' &&
        tokens[pos + 1]?.value === 'in'
      ) {
        return true;
      }
      return false;
    };

    const evalSingleComparison = (op: string, a: any, b: any): boolean => {
      switch (op) {
        case '==':
          return pyEquals(a, b);
        case '!=':
          return !pyEquals(a, b);
        case '<':
          return a < b;
        case '<=':
          return a <= b;
        case '>':
          return a > b;
        case '>=':
          return a >= b;
        case 'is':
          return a === b;
        case 'is not':
          return a !== b;
        case 'in': {
          if (typeof b === 'string') return b.includes(String(a));
          if (Array.isArray(b)) return b.some((item) => pyEquals(a, item));
          if (isPyTuple(b)) return b.items.some((item) => pyEquals(a, item));
          if (b instanceof Set) return b.has(a);
          if (b && typeof b === 'object') return String(a) in b;
          return false;
        }
        case 'not in':
          return !evalSingleComparison('in', a, b);
        default:
          return false;
      }
    };

    const parseComparison = (): any => {
      let left = parseAddSub();
      if (!isComparisonNext()) return left;

      let result = true;
      while (isComparisonNext()) {
        let op = '';
        const tk = peek();
        if (tk.type === 'OP') {
          op = consume().value;
        } else if (tk.type === 'IDENT' && tk.value === 'not') {
          consume(); // 'not'
          consume(); // 'in'
          op = 'not in';
        } else if (tk.type === 'IDENT' && tk.value === 'is') {
          consume(); // 'is'
          if (peek().type === 'IDENT' && peek().value === 'not') {
            consume();
            op = 'is not';
          } else {
            op = 'is';
          }
        } else if (tk.type === 'IDENT' && tk.value === 'in') {
          consume();
          op = 'in';
        }

        const right = parseAddSub();
        if (result) {
          result = evalSingleComparison(op, left, right);
        }
        left = right;
      }
      return result;
    };

    const parseAddSub = (): any => {
      let left = parseMulDiv();
      while (peek().type === 'OP' && (peek().value === '+' || peek().value === '-')) {
        const op = consume().value;
        const right = parseMulDiv();
        if (op === '+') {
          if (Array.isArray(left) && Array.isArray(right)) {
            left = [...left, ...right];
          } else if (isPyTuple(left) && isPyTuple(right)) {
            left = createTuple([...left.items, ...right.items]);
          } else if (typeof left === 'string' || typeof right === 'string') {
            left = String(left) + String(right);
          } else {
            left = Number(left) + Number(right);
          }
        } else {
          left = Number(left) - Number(right);
        }
      }
      return left;
    };

    const parseMulDiv = (): any => {
      let left = parseUnary();
      while (peek().type === 'OP' && ['*', '/', '//', '%'].includes(peek().value)) {
        const op = consume().value;
        const right = parseUnary();
        if (op === '*') {
          if (typeof left === 'string' && typeof right === 'number') {
            left = left.repeat(Math.max(0, Math.floor(right)));
          } else if (typeof right === 'string' && typeof left === 'number') {
            left = right.repeat(Math.max(0, Math.floor(left)));
          } else if (Array.isArray(left) && typeof right === 'number') {
            const res: any[] = [];
            for (let k = 0; k < right; k++) res.push(...left);
            left = res;
          } else if (Array.isArray(right) && typeof left === 'number') {
            const res: any[] = [];
            for (let k = 0; k < left; k++) res.push(...right);
            left = res;
          } else {
            left = Number(left) * Number(right);
          }
        } else if (op === '/') {
          if (Number(right) === 0) throw new Error('ZeroDivisionError: division by zero');
          left = Number(left) / Number(right);
        } else if (op === '//') {
          if (Number(right) === 0) throw new Error('ZeroDivisionError: integer division or modulo by zero');
          left = Math.floor(Number(left) / Number(right));
        } else if (op === '%') {
          if (Number(right) === 0) throw new Error('ZeroDivisionError: integer division or modulo by zero');
          const r = Number(right);
          left = ((Number(left) % r) + r) % r;
        }
      }
      return left;
    };

    const parseUnary = (): any => {
      if (peek().type === 'OP' && peek().value === '-') {
        consume();
        return -Number(parseUnary());
      }
      if (peek().type === 'OP' && peek().value === '+') {
        consume();
        return +Number(parseUnary());
      }
      return parsePower();
    };

    const parsePower = (): any => {
      const base = parsePostfix();
      if (matchOp('**')) {
        const exp = parseUnary();
        return Math.pow(Number(base), Number(exp));
      }
      return base;
    };

    const parsePostfix = (): any => {
      let val = parsePrimary();

      while (true) {
        // 1. Attribute / Method access: `.attr`
        if (matchPunct('.')) {
          const attrToken = consume();
          const attrName = attrToken.value;
          if (matchPunct('(')) {
            const args = parseCallArgs();
            val = invokeMethod(val, attrName, args);
          } else {
            val = val?.[attrName];
          }
          continue;
        }

        // 2. Indexing or Slicing: `[...]`
        if (matchPunct('[')) {
          val = parseSubscriptOrSlice(val);
          continue;
        }

        // 3. Function call: `(...)`
        if (matchPunct('(')) {
          const args = parseCallArgs();
          val = invokeCallable(val, args);
          continue;
        }

        break;
      }

      return val;
    };

    const parseCallArgs = (): { posArgs: any[]; kwArgs: Record<string, any> } => {
      const posArgs: any[] = [];
      const kwArgs: Record<string, any> = {};

      if (matchPunct(')')) {
        return { posArgs, kwArgs };
      }

      // Kiểm tra xem có phải generator expression bên trong lời gọi hàm không, ví dụ:
      // `all(p.lstrip('-').isdigit() for p in parts if p)`
      const savedPos = pos;
      let d = 0;
      let forIdx = -1;
      let scan = pos;
      while (scan < tokens.length && tokens[scan].type !== 'EOF') {
        const tk = tokens[scan];
        if (tk.type === 'PUNCT' && (tk.value === '(' || tk.value === '[' || tk.value === '{')) d++;
        else if (tk.type === 'PUNCT' && (tk.value === ')' || tk.value === ']' || tk.value === '}')) {
          if (d === 0 && tk.value === ')') break;
          d--;
        } else if (d === 0 && tk.type === 'IDENT' && tk.value === 'for') {
          forIdx = scan;
          break;
        }
        scan++;
      }

      if (forIdx !== -1) {
        const itemTokens = tokens.slice(savedPos, forIdx);
        itemTokens.push({ type: 'EOF', value: '' });
        pos = forIdx + 1; // skip 'for'

        let varTarget = '';
        while (peek().type !== 'EOF' && !(peek().type === 'IDENT' && peek().value === 'in')) {
          varTarget += consume().value;
        }
        matchIdent('in');

        const iterTokens: Token[] = [];
        let condTokens: Token[] | null = null;
        let inCond = false;
        let depthGen = 0;

        while (peek().type !== 'EOF') {
          const tk = peek();
          if (tk.type === 'PUNCT' && (tk.value === '(' || tk.value === '[' || tk.value === '{')) depthGen++;
          else if (tk.type === 'PUNCT' && (tk.value === ')' || tk.value === ']' || tk.value === '}')) {
            if (depthGen === 0 && tk.value === ')') break;
            depthGen--;
          } else if (depthGen === 0 && tk.type === 'IDENT' && tk.value === 'if' && !inCond) {
            consume(); // skip 'if'
            inCond = true;
            condTokens = [];
            continue;
          }
          if (inCond && condTokens) {
            condTokens.push(consume());
          } else {
            iterTokens.push(consume());
          }
        }
        iterTokens.push({ type: 'EOF', value: '' });
        if (condTokens) condTokens.push({ type: 'EOF', value: '' });
        matchPunct(')');

        const genArray = evalComprehensionTokens(itemTokens, varTarget, iterTokens, condTokens);
        posArgs.push(genArray);
        return { posArgs, kwArgs };
      }

      while (peek().type !== 'EOF' && !(peek().type === 'PUNCT' && peek().value === ')')) {
        // Check keyword argument `key=val`
        if (
          peek().type === 'IDENT' &&
          tokens[pos + 1]?.type === 'PUNCT' &&
          tokens[pos + 1]?.value === '='
        ) {
          const key = consume().value;
          consume(); // '='
          kwArgs[key] = parseTopExpression();
        } else {
          posArgs.push(parseTopExpression());
        }
        if (!matchPunct(',')) break;
      }
      matchPunct(')');
      return { posArgs, kwArgs };
    };

    const parseSubscriptOrSlice = (target: any): any => {
      let startVal: any = undefined;
      let stopVal: any = undefined;
      let stepVal: any = undefined;
      let isSlice = false;

      if (matchPunct(':')) {
        isSlice = true;
      } else {
        startVal = parseTopExpression();
        if (matchPunct(':')) {
          isSlice = true;
        }
      }

      if (isSlice) {
        if (
          !(peek().type === 'PUNCT' && (peek().value === ':' || peek().value === ']')) &&
          peek().type !== 'EOF'
        ) {
          stopVal = parseTopExpression();
        }
        if (matchPunct(':')) {
          if (!(peek().type === 'PUNCT' && peek().value === ']') && peek().type !== 'EOF') {
            stepVal = parseTopExpression();
          }
        }
        matchPunct(']');
        return applyPythonSlice(target, startVal, stopVal, stepVal);
      }

      matchPunct(']');

      if (Array.isArray(target) || typeof target === 'string' || isPyTuple(target)) {
        const arr = isPyTuple(target) ? target.items : target;
        let idx = Number(startVal);
        if (idx < 0) idx = arr.length + idx;
        if (idx < 0 || idx >= arr.length) {
          throw new Error('IndexError: index out of range');
        }
        return arr[idx];
      }

      if (target && typeof target === 'object') {
        if (String(startVal) in target) {
          return target[String(startVal)];
        }
        throw new Error(`KeyError: '${startVal}'`);
      }

      throw new Error('TypeError: object is not subscriptable');
    };

    const parsePrimary = (): any => {
      const tk = peek();

      if (tk.type === 'NUMBER') {
        consume();
        return tk.value.includes('.') ? parseFloat(tk.value) : parseInt(tk.value, 10);
      }

      if (tk.type === 'STRING') {
        consume();
        return tk.value;
      }

      if (tk.type === 'FSTRING') {
        consume();
        return tk.value.replace(/\{([^}]+)\}/g, (_, innerExpr) => {
          const formatParts = innerExpr.split(':');
          const rawExpr = formatParts[0].trim();
          const val = evalExpr(rawExpr);
          return pyStr(val);
        });
      }

      if (tk.type === 'IDENT') {
        consume();
        if (tk.value === 'True') return true;
        if (tk.value === 'False') return false;
        if (tk.value === 'None') return null;

        // Built-in functions / types
        const builtins = [
          'print',
          'input',
          'int',
          'float',
          'str',
          'bool',
          'len',
          'range',
          'list',
          'tuple',
          'dict',
          'set',
          'sum',
          'max',
          'min',
          'abs',
          'round',
          'ord',
          'chr',
          'sorted',
          'reversed',
          'enumerate',
          'zip',
          'map',
          'filter',
          'all',
          'any',
          'isinstance',
          'type',
        ];
        try {
          return lookupVar(tk.value);
        } catch (err) {
          if (builtins.includes(tk.value)) {
            return { __py_builtin__: tk.value };
          }
          throw err;
        }
      }

      // Parenthesized expression or Tuple `(a, b)`
      if (matchPunct('(')) {
        if (matchPunct(')')) {
          return createTuple([]);
        }
        const first = parseTopExpression();
        if (matchPunct(',')) {
          const items = [first];
          while (peek().type !== 'EOF' && !(peek().type === 'PUNCT' && peek().value === ')')) {
            items.push(parseTopExpression());
            if (!matchPunct(',')) break;
          }
          matchPunct(')');
          return createTuple(items);
        }
        matchPunct(')');
        return first;
      }

      // List literal `[a, b]` or List Comprehension `[expr for x in iter if cond]`
      if (matchPunct('[')) {
        if (matchPunct(']')) {
          return [];
        }

        // Check for list comprehension at depth 0 inside `[...]`
        const savedPos = pos;
        let d = 0;
        let forIdx = -1;
        let scan = pos;
        while (scan < tokens.length && tokens[scan].type !== 'EOF') {
          const t = tokens[scan];
          if (t.type === 'PUNCT' && (t.value === '(' || t.value === '[' || t.value === '{')) d++;
          else if (t.type === 'PUNCT' && (t.value === ')' || t.value === ']' || t.value === '}')) {
            if (d === 0 && t.value === ']') break;
            d--;
          } else if (d === 0 && t.type === 'IDENT' && t.value === 'for') {
            forIdx = scan;
            break;
          }
          scan++;
        }

        if (forIdx !== -1) {
          const itemTokens = tokens.slice(savedPos, forIdx);
          itemTokens.push({ type: 'EOF', value: '' });
          pos = forIdx + 1; // skip 'for'

          let varTarget = '';
          while (peek().type !== 'EOF' && !(peek().type === 'IDENT' && peek().value === 'in')) {
            varTarget += consume().value;
          }
          matchIdent('in');

          const iterTokens: Token[] = [];
          let condTokens: Token[] | null = null;
          let inCond = false;
          let depthComp = 0;

          while (peek().type !== 'EOF') {
            const t = peek();
            if (t.type === 'PUNCT' && (t.value === '(' || t.value === '[' || t.value === '{')) depthComp++;
            else if (t.type === 'PUNCT' && (t.value === ')' || t.value === ']' || t.value === '}')) {
              if (depthComp === 0 && t.value === ']') break;
              depthComp--;
            } else if (depthComp === 0 && t.type === 'IDENT' && t.value === 'if' && !inCond) {
              consume(); // skip 'if'
              inCond = true;
              condTokens = [];
              continue;
            }
            if (inCond && condTokens) {
              condTokens.push(consume());
            } else {
              iterTokens.push(consume());
            }
          }
          iterTokens.push({ type: 'EOF', value: '' });
          if (condTokens) condTokens.push({ type: 'EOF', value: '' });
          matchPunct(']');

          return evalComprehensionTokens(itemTokens, varTarget, iterTokens, condTokens);
        }

        const elements: any[] = [];
        while (peek().type !== 'EOF' && !(peek().type === 'PUNCT' && peek().value === ']')) {
          elements.push(parseTopExpression());
          if (!matchPunct(',')) break;
        }
        matchPunct(']');
        return elements;
      }

      // Dict `{k: v}` or Set `{a, b}`
      if (matchPunct('{')) {
        if (matchPunct('}')) {
          return {};
        }
        const firstKey = parseTopExpression();
        if (matchPunct(':')) {
          const obj: Record<string, any> = {};
          const firstVal = parseTopExpression();
          obj[String(firstKey)] = firstVal;
          while (matchPunct(',')) {
            if (peek().type === 'PUNCT' && peek().value === '}') break;
            const k = parseTopExpression();
            matchPunct(':');
            const v = parseTopExpression();
            obj[String(k)] = v;
          }
          matchPunct('}');
          return obj;
        } else {
          const setItems = new Set<any>([firstKey]);
          while (matchPunct(',')) {
            if (peek().type === 'PUNCT' && peek().value === '}') break;
            setItems.add(parseTopExpression());
          }
          matchPunct('}');
          return setItems;
        }
      }

      consume();
      return null;
    };

    const result = parseTopExpression();

    // Nếu có dấu phẩy ở mức ngoài cùng (ví dụ: `return i, j` hoặc `arr[j + 1], arr[j]`), gom thành tuple!
    if (matchPunct(',')) {
      const tupleItems = [result];
      while (peek().type !== 'EOF') {
        tupleItems.push(parseTopExpression());
        if (!matchPunct(',')) break;
      }
      return createTuple(tupleItems);
    }

    return result;
  };

  const evalFromTokens = (subTokens: Token[]): any => {
    const reconstructed = subTokens
      .filter((t) => t.type !== 'EOF')
      .map((t) => {
        if (t.type === 'STRING') return JSON.stringify(t.value);
        if (t.type === 'FSTRING') return `f${JSON.stringify(t.value)}`;
        return t.value;
      })
      .join(' ');
    return evalExpr(reconstructed);
  };

  // Xử lý cắt lát (Slicing) chuẩn Python: `target[start:stop:step]`
  const applyPythonSlice = (target: any, startVal: any, stopVal: any, stepVal: any): any => {
    const isStr = typeof target === 'string';
    const isTup = isPyTuple(target);
    const arr = isStr ? target.split('') : isTup ? target.items : Array.isArray(target) ? target : [];
    const len = arr.length;

    const step = stepVal === undefined || stepVal === null ? 1 : Number(stepVal);
    if (step === 0) throw new Error('ValueError: slice step cannot be zero');

    let start: number;
    let stop: number;

    if (step > 0) {
      start = startVal === undefined || startVal === null ? 0 : Number(startVal);
      if (start < 0) start = Math.max(0, len + start);
      else start = Math.min(len, start);

      stop = stopVal === undefined || stopVal === null ? len : Number(stopVal);
      if (stop < 0) stop = Math.max(0, len + stop);
      else stop = Math.min(len, stop);
    } else {
      start = startVal === undefined || startVal === null ? len - 1 : Number(startVal);
      if (start < 0) start = Math.max(-1, len + start);
      else start = Math.min(len - 1, start);

      stop = stopVal === undefined || stopVal === null ? -1 : Number(stopVal);
      if (stop < 0) stop = Math.max(-1, len + stop);
      else stop = Math.min(len - 1, stop);
    }

    const sliced: any[] = [];
    if (step > 0) {
      for (let i = start; i < stop; i += step) {
        sliced.push(arr[i]);
      }
    } else {
      for (let i = start; i > stop; i += step) {
        sliced.push(arr[i]);
      }
    }

    if (isStr) return sliced.join('');
    if (isTup) return createTuple(sliced);
    return sliced;
  };

  // Gọi method trên đối tượng (str, list, dict, set)
  const invokeMethod = (
    target: any,
    methodName: string,
    argsObj: { posArgs: any[]; kwArgs: Record<string, any> }
  ): any => {
    const { posArgs, kwArgs } = argsObj;

    // String methods
    if (typeof target === 'string') {
      switch (methodName) {
        case 'strip': {
          if (posArgs.length === 0) return target.trim();
          const chars = String(posArgs[0]);
          let s = target;
          while (s.length > 0 && chars.includes(s[0])) s = s.slice(1);
          while (s.length > 0 && chars.includes(s[s.length - 1])) s = s.slice(0, -1);
          return s;
        }
        case 'lstrip': {
          if (posArgs.length === 0) return target.trimStart();
          const chars = String(posArgs[0]);
          let s = target;
          while (s.length > 0 && chars.includes(s[0])) s = s.slice(1);
          return s;
        }
        case 'rstrip': {
          if (posArgs.length === 0) return target.trimEnd();
          const chars = String(posArgs[0]);
          let s = target;
          while (s.length > 0 && chars.includes(s[s.length - 1])) s = s.slice(0, -1);
          return s;
        }
        case 'split': {
          if (posArgs.length === 0 || posArgs[0] === null || posArgs[0] === undefined) {
            const trimmed = target.trim();
            return trimmed ? trimmed.split(/\s+/) : [];
          }
          return target.split(String(posArgs[0]));
        }
        case 'replace':
          return target.split(String(posArgs[0] ?? '')).join(String(posArgs[1] ?? ''));
        case 'join': {
          const iter = toIterableArray(posArgs[0]);
          return iter.map((x) => pyStr(x)).join(target);
        }
        case 'upper':
          return target.toUpperCase();
        case 'lower':
          return target.toLowerCase();
        case 'isdigit':
          return target.length > 0 && /^\d+$/.test(target);
        case 'isalpha':
          return target.length > 0 && /^[a-zA-ZÀ-ỹ]+$/.test(target);
        case 'isalnum':
          return target.length > 0 && /^[a-zA-Z0-9À-ỹ]+$/.test(target);
        case 'startswith':
          return target.startsWith(String(posArgs[0] ?? ''));
        case 'endswith':
          return target.endsWith(String(posArgs[0] ?? ''));
        case 'find':
          return target.indexOf(String(posArgs[0] ?? ''));
        case 'count': {
          const sub = String(posArgs[0] ?? '');
          if (!sub) return target.length + 1;
          return target.split(sub).length - 1;
        }
      }
    }

    // List methods
    if (Array.isArray(target)) {
      switch (methodName) {
        case 'append':
          target.push(posArgs[0]);
          return null;
        case 'pop': {
          if (target.length === 0) throw new Error('IndexError: pop from empty list');
          if (posArgs.length === 0) return target.pop();
          let idx = Number(posArgs[0]);
          if (idx < 0) idx = target.length + idx;
          return target.splice(idx, 1)[0];
        }
        case 'insert': {
          const idx = Number(posArgs[0]);
          target.splice(idx, 0, posArgs[1]);
          return null;
        }
        case 'remove': {
          const idx = target.findIndex((x) => pyEquals(x, posArgs[0]));
          if (idx === -1) throw new Error('ValueError: list.remove(x): x not in list');
          target.splice(idx, 1);
          return null;
        }
        case 'sort': {
          const rev = Boolean(kwArgs.reverse);
          target.sort((a, b) => {
            if (a < b) return rev ? 1 : -1;
            if (a > b) return rev ? -1 : 1;
            return 0;
          });
          return null;
        }
        case 'reverse':
          target.reverse();
          return null;
        case 'copy':
          return [...target];
        case 'clear':
          target.length = 0;
          return null;
        case 'extend':
          target.push(...toIterableArray(posArgs[0]));
          return null;
        case 'index': {
          const idx = target.findIndex((x) => pyEquals(x, posArgs[0]));
          if (idx === -1) throw new Error(`ValueError: ${posArgs[0]} is not in list`);
          return idx;
        }
        case 'count':
          return target.filter((x) => pyEquals(x, posArgs[0])).length;
      }
    }

    // Set methods
    if (target instanceof Set) {
      switch (methodName) {
        case 'add':
          target.add(posArgs[0]);
          return null;
        case 'remove':
        case 'discard':
          target.delete(posArgs[0]);
          return null;
      }
    }

    // Dict methods
    if (target && typeof target === 'object') {
      switch (methodName) {
        case 'get': {
          const k = String(posArgs[0]);
          return k in target ? target[k] : posArgs[1] ?? null;
        }
        case 'keys':
          return Object.keys(target).filter((k) => !k.startsWith('__'));
        case 'values':
          return Object.entries(target)
            .filter(([k]) => !k.startsWith('__'))
            .map(([, v]) => v);
        case 'items':
          return Object.entries(target)
            .filter(([k]) => !k.startsWith('__'))
            .map(([k, v]) => createTuple([k, v]));
      }
    }

    throw new Error(`AttributeError: object has no attribute '${methodName}'`);
  };

  // Gọi hàm built-in hoặc hàm người dùng định nghĩa
  const invokeCallable = (
    callee: any,
    argsObj: { posArgs: any[]; kwArgs: Record<string, any> }
  ): any => {
    const { posArgs, kwArgs } = argsObj;

    // 1. Lambda
    if (callee && callee.__py_lambda__) {
      const locals = getCurrentLocals();
      const saved: Record<string, any> = {};
      callee.params.forEach((p: string, idx: number) => {
        saved[p] = locals[p];
        locals[p] = posArgs[idx];
      });
      const res = evalFromTokens(callee.bodyTokens);
      callee.params.forEach((p: string) => {
        if (saved[p] !== undefined) locals[p] = saved[p];
      });
      return res;
    }

    // 2. Built-in functions
    if (callee && callee.__py_builtin__) {
      const fnName = callee.__py_builtin__;
      switch (fnName) {
        case 'print': {
          const sep = kwArgs.sep !== undefined ? String(kwArgs.sep) : ' ';
          const end = kwArgs.end !== undefined ? String(kwArgs.end) : '\n';
          const textOut = posArgs.map((a) => pyStr(a)).join(sep) + end;
          stdoutCapture += textOut;
          shellSegments.push({ type: 'stdout', text: textOut });
          return null;
        }
        case 'input': {
          const prompt = posArgs.length > 0 ? pyStr(posArgs[0]) : '';
          return handlePythonInput(prompt);
        }
        case 'int': {
          if (posArgs.length === 0) return 0;
          const v = posArgs[0];
          const base = posArgs.length > 1 ? Number(posArgs[1]) : 10;
          const parsed = typeof v === 'number' ? Math.trunc(v) : parseInt(String(v).trim(), base);
          if (isNaN(parsed)) {
            throw new Error(`ValueError: invalid literal for int() with base ${base}: '${v}'`);
          }
          return parsed;
        }
        case 'float': {
          if (posArgs.length === 0) return 0.0;
          const parsed = parseFloat(String(posArgs[0]).trim());
          if (isNaN(parsed)) {
            throw new Error(`ValueError: could not convert string to float: '${posArgs[0]}'`);
          }
          return parsed;
        }
        case 'str':
          return posArgs.length === 0 ? '' : pyStr(posArgs[0]);
        case 'bool':
          return posArgs.length === 0 ? false : pyTruthy(posArgs[0]);
        case 'len': {
          const v = posArgs[0];
          if (typeof v === 'string' || Array.isArray(v)) return v.length;
          if (isPyTuple(v)) return v.items.length;
          if (v instanceof Set) return v.size;
          if (v && typeof v === 'object') return Object.keys(v).filter((k) => !k.startsWith('__')).length;
          throw new Error(`TypeError: object of type '${typeof v}' has no len()`);
        }
        case 'range': {
          let start = 0;
          let stop = 0;
          let step = 1;
          if (posArgs.length === 1) {
            stop = Number(posArgs[0]);
          } else if (posArgs.length === 2) {
            start = Number(posArgs[0]);
            stop = Number(posArgs[1]);
          } else if (posArgs.length >= 3) {
            start = Number(posArgs[0]);
            stop = Number(posArgs[1]);
            step = Number(posArgs[2]);
          }
          if (step === 0) throw new Error('ValueError: range() arg 3 must not be zero');
          const arr: number[] = [];
          if (step > 0) {
            for (let x = start; x < stop; x += step) arr.push(x);
          } else {
            for (let x = start; x > stop; x += step) arr.push(x);
          }
          return arr;
        }
        case 'list':
          if (posArgs.length === 0) return [];
          return [...toIterableArray(posArgs[0])];
        case 'tuple':
          if (posArgs.length === 0) return createTuple([]);
          return createTuple([...toIterableArray(posArgs[0])]);
        case 'set':
          if (posArgs.length === 0) return new Set();
          return new Set(toIterableArray(posArgs[0]));
        case 'dict':
          if (posArgs.length === 0) return { ...kwArgs };
          return { ...posArgs[0], ...kwArgs };
        case 'sum': {
          const arr = toIterableArray(posArgs[0]);
          const init = posArgs.length > 1 ? Number(posArgs[1]) : 0;
          return arr.reduce((acc, cur) => acc + Number(cur), init);
        }
        case 'max': {
          const items = posArgs.length === 1 ? toIterableArray(posArgs[0]) : posArgs;
          if (items.length === 0) throw new Error('ValueError: max() arg is an empty sequence');
          return items.reduce((best, cur) => (cur > best ? cur : best), items[0]);
        }
        case 'min': {
          const items = posArgs.length === 1 ? toIterableArray(posArgs[0]) : posArgs;
          if (items.length === 0) throw new Error('ValueError: min() arg is an empty sequence');
          return items.reduce((best, cur) => (cur < best ? cur : best), items[0]);
        }
        case 'abs':
          return Math.abs(Number(posArgs[0]));
        case 'round': {
          const num = Number(posArgs[0]);
          const digits = posArgs.length > 1 ? Number(posArgs[1]) : 0;
          const factor = Math.pow(10, digits);
          return Math.round(num * factor) / factor;
        }
        case 'ord': {
          const s = String(posArgs[0]);
          if (s.length !== 1) {
            throw new Error(`TypeError: ord() expected a character, but string of length ${s.length} found`);
          }
          return s.charCodeAt(0);
        }
        case 'chr':
          return String.fromCharCode(Number(posArgs[0]));
        case 'sorted': {
          const arr = [...toIterableArray(posArgs[0])];
          const rev = Boolean(kwArgs.reverse);
          arr.sort((a, b) => {
            if (a < b) return rev ? 1 : -1;
            if (a > b) return rev ? -1 : 1;
            return 0;
          });
          return arr;
        }
        case 'reversed':
          return [...toIterableArray(posArgs[0])].reverse();
        case 'enumerate': {
          const arr = toIterableArray(posArgs[0]);
          const start = posArgs.length > 1 ? Number(posArgs[1]) : 0;
          return arr.map((item, idx) => createTuple([start + idx, item]));
        }
        case 'zip': {
          const arrays = posArgs.map((a) => toIterableArray(a));
          if (arrays.length === 0) return [];
          const minLen = Math.min(...arrays.map((a) => a.length));
          const res: PyTuple[] = [];
          for (let i = 0; i < minLen; i++) {
            res.push(createTuple(arrays.map((a) => a[i])));
          }
          return res;
        }
        case 'map': {
          const fn = posArgs[0];
          const arr = toIterableArray(posArgs[1]);
          return arr.map((item) => invokeCallable(fn, { posArgs: [item], kwArgs: {} }));
        }
        case 'filter': {
          const fn = posArgs[0];
          const arr = toIterableArray(posArgs[1]);
          return arr.filter((item) =>
            fn === null ? pyTruthy(item) : pyTruthy(invokeCallable(fn, { posArgs: [item], kwArgs: {} }))
          );
        }
        case 'all': {
          const arr = toIterableArray(posArgs[0]);
          return arr.every((x) => pyTruthy(x));
        }
        case 'any': {
          const arr = toIterableArray(posArgs[0]);
          return arr.some((x) => pyTruthy(x));
        }
        case 'isinstance': {
          const val = posArgs[0];
          const typeArg = posArgs[1];
          const checkOne = (t: any): boolean => {
            const bName = t?.__py_builtin__;
            if (bName === 'int') return typeof val === 'number' && Number.isInteger(val);
            if (bName === 'float') return typeof val === 'number';
            if (bName === 'str') return typeof val === 'string';
            if (bName === 'bool') return typeof val === 'boolean';
            if (bName === 'list') return Array.isArray(val);
            if (bName === 'tuple') return isPyTuple(val);
            if (bName === 'dict') return Boolean(val && typeof val === 'object' && !Array.isArray(val) && !isPyTuple(val));
            return false;
          };
          if (isPyTuple(typeArg)) return typeArg.items.some(checkOne);
          return checkOne(typeArg);
        }
        case 'type':
          return typeof posArgs[0];
      }
    }

    // 3. User-defined Python Function
    if (callee && callee.__py_func__) {
      const fn = callee as PyFunction;
      const newLocals: Record<string, any> = {};
      fn.params.forEach((param, idx) => {
        if (idx < posArgs.length) {
          newLocals[param.name] = posArgs[idx];
        } else if (param.name in kwArgs) {
          newLocals[param.name] = kwArgs[param.name];
        } else if (param.defaultExpr !== undefined) {
          newLocals[param.name] = evalExpr(param.defaultExpr);
        } else {
          newLocals[param.name] = null;
        }
      });

      callStack.push({
        name: fn.name,
        lineNo: fn.defLineNo,
        locals: newLocals,
      });

      recordStep(fn.defLineNo, 'call');

      let retVal: any = null;
      try {
        executeBlock(fn.body);
      } catch (sig) {
        if (sig instanceof ReturnSignal) {
          retVal = sig.value;
        } else {
          callStack.pop();
          throw sig;
        }
      }

      const lastLine = callStack[callStack.length - 1].lineNo;
      recordStep(lastLine, 'return', retVal);
      callStack.pop();
      return retVal;
    }

    throw new Error('TypeError: object is not callable');
  };

  // Gán giá trị cho 1 đích đơn (biến hoặc phần tử mảng/dict: `arr[j + 1]`)
  const assignSingleTarget = (lhsStr: string, val: any) => {
    const trimmed = lhsStr.trim();
    const bracketIdx = trimmed.indexOf('[');
    if (bracketIdx !== -1 && trimmed.endsWith(']')) {
      const objExpr = trimmed.slice(0, bracketIdx).trim();
      const idxExpr = trimmed.slice(bracketIdx + 1, -1).trim();
      const obj = evalExpr(objExpr);
      const idxVal = evalExpr(idxExpr);

      if (Array.isArray(obj)) {
        let i = Number(idxVal);
        if (i < 0) i = obj.length + i;
        if (i < 0 || i >= obj.length) {
          throw new Error('IndexError: list assignment index out of range');
        }
        obj[i] = val;
        return;
      }
      if (obj && typeof obj === 'object') {
        obj[String(idxVal)] = val;
        return;
      }
      throw new Error('TypeError: object does not support item assignment');
    }

    if (/^[a-zA-Z_]\w*$/.test(trimmed)) {
      setVar(trimmed, val);
      return;
    }

    throw new Error(`SyntaxError: cannot assign to '${trimmed}'`);
  };

  // Gán giá trị cho đích đơn hoặc tuple unpacking (`a, b = b, a` hoặc `arr[j], arr[j+1] = arr[j+1], arr[j]`)
  const assignTarget = (lhsStr: string, val: any) => {
    const targets = splitTopLevel(lhsStr, ',');
    if (targets.length === 1) {
      assignSingleTarget(targets[0], val);
    } else {
      const unpacked = toIterableArray(val);
      if (unpacked.length !== targets.length) {
        throw new Error(
          `ValueError: not enough/too many values to unpack (expected ${targets.length}, got ${unpacked.length})`
        );
      }
      for (let i = 0; i < targets.length; i++) {
        assignSingleTarget(targets[i], unpacked[i]);
      }
    }
  };

  // Tìm vị trí toán tử gán ở ngoài cùng (top-level)
  const findTopLevelAssignment = (
    text: string
  ): { op: string; lhsList: string[]; rhs: string } | null => {
    let depth = 0;
    let inSingle = false;
    let inDouble = false;

    // Kiểm tra toán tử gán kết hợp (+=, -=, *=, //=, /=, %=) trước
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === "'" && !inDouble) inSingle = !inSingle;
      else if (ch === '"' && !inSingle) inDouble = !inDouble;
      else if (!inSingle && !inDouble) {
        if (ch === '(' || ch === '[' || ch === '{') depth++;
        else if (ch === ')' || ch === ']' || ch === '}') depth--;
        else if (depth === 0) {
          const three = text.slice(i, i + 3);
          if (three === '//=' || three === '**=') {
            return {
              op: three,
              lhsList: [text.slice(0, i).trim()],
              rhs: text.slice(i + 3).trim(),
            };
          }
          const two = text.slice(i, i + 2);
          if (['+=', '-=', '*=', '/=', '%='].includes(two)) {
            return {
              op: two,
              lhsList: [text.slice(0, i).trim()],
              rhs: text.slice(i + 2).trim(),
            };
          }
        }
      }
    }

    // Kiểm tra toán tử `=` (có thể nối chuỗi `i = j = k = 0`)
    const eqPositions: number[] = [];
    depth = 0;
    inSingle = false;
    inDouble = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === "'" && !inDouble) inSingle = !inSingle;
      else if (ch === '"' && !inSingle) inDouble = !inDouble;
      else if (!inSingle && !inDouble) {
        if (ch === '(' || ch === '[' || ch === '{') depth++;
        else if (ch === ')' || ch === ']' || ch === '}') depth--;
        else if (depth === 0 && ch === '=') {
          const prev = text[i - 1] || '';
          const next = text[i + 1] || '';
          if (!['=', '!', '<', '>', '+', '-', '*', '/', '%'].includes(prev) && next !== '=') {
            eqPositions.push(i);
          }
        }
      }
    }

    if (eqPositions.length > 0) {
      const lhsList: string[] = [];
      let prevIdx = 0;
      for (const eqPos of eqPositions) {
        lhsList.push(text.slice(prevIdx, eqPos).trim());
        prevIdx = eqPos + 1;
      }
      const rhs = text.slice(prevIdx).trim();
      return { op: '=', lhsList, rhs };
    }

    return null;
  };

  // Thực thi 1 câu lệnh đơn
  const executeSimpleStmt = (lineNo: number, text: string) => {
    currentExecutingLine = lineNo;

    if (text === 'pass') {
      recordStep(lineNo, 'line');
      return;
    }

    if (text === 'break') {
      recordStep(lineNo, 'line');
      throw new BreakSignal();
    }

    if (text === 'continue') {
      recordStep(lineNo, 'line');
      throw new ContinueSignal();
    }

    if (text === 'return' || text.startsWith('return ')) {
      const expr = text.slice(6).trim();
      const val = expr ? evalExpr(expr) : null;
      recordStep(lineNo, 'line');
      throw new ReturnSignal(val);
    }

    const assignInfo = findTopLevelAssignment(text);
    if (assignInfo) {
      const { op, lhsList, rhs } = assignInfo;
      const rhsVal = evalExpr(rhs);

      if (op === '=') {
        for (const lhs of lhsList) {
          assignTarget(lhs, rhsVal);
        }
      } else {
        const lhs = lhsList[0];
        const curVal = evalExpr(lhs);
        let nextVal: any;
        switch (op) {
          case '+=':
            if (Array.isArray(curVal) && Array.isArray(rhsVal)) {
              curVal.push(...rhsVal);
              nextVal = curVal;
            } else if (typeof curVal === 'string' || typeof rhsVal === 'string') {
              nextVal = String(curVal) + String(rhsVal);
            } else {
              nextVal = Number(curVal) + Number(rhsVal);
            }
            break;
          case '-=':
            nextVal = Number(curVal) - Number(rhsVal);
            break;
          case '*=':
            nextVal = Number(curVal) * Number(rhsVal);
            break;
          case '/=':
            nextVal = Number(curVal) / Number(rhsVal);
            break;
          case '//=':
            nextVal = Math.floor(Number(curVal) / Number(rhsVal));
            break;
          case '%=': {
            const r = Number(rhsVal);
            nextVal = ((Number(curVal) % r) + r) % r;
            break;
          }
          case '**=':
            nextVal = Math.pow(Number(curVal), Number(rhsVal));
            break;
        }
        assignSingleTarget(lhs, nextVal);
      }

      recordStep(lineNo, 'line');
      return;
    }

    // Biểu thức đơn lẻ (ví dụ: `print(...)`, `arr.sort()`, `quick_sort(...)`)
    evalExpr(text);
    recordStep(lineNo, 'line');
  };

  // Thực thi 1 khối lệnh
  const executeBlock = (stmts: StmtNode[]) => {
    for (const stmt of stmts) {
      if (steps.length >= maxSteps) return;

      if (stmt.type === 'simple') {
        executeSimpleStmt(stmt.lineNo, stmt.text);
      } else if (stmt.type === 'def') {
        currentExecutingLine = stmt.lineNo;
        const fnObj: PyFunction = {
          __py_func__: true,
          name: stmt.name,
          params: stmt.params,
          body: stmt.body,
          defLineNo: stmt.lineNo,
        };
        setVar(stmt.name, fnObj);
        getGlobalLocals()[stmt.name] = fnObj;
        recordStep(stmt.lineNo, 'line');
      } else if (stmt.type === 'if') {
        for (const branch of stmt.branches) {
          currentExecutingLine = branch.lineNo;
          if (branch.cond !== null) {
            recordStep(branch.lineNo, 'line');
            const condVal = evalExpr(branch.cond);
            if (pyTruthy(condVal)) {
              executeBlock(branch.body);
              break;
            }
          } else {
            executeBlock(branch.body);
            break;
          }
        }
      } else if (stmt.type === 'while') {
        let guard = 0;
        while (steps.length < maxSteps && guard++ < maxSteps) {
          currentExecutingLine = stmt.lineNo;
          recordStep(stmt.lineNo, 'line');
          const condVal = evalExpr(stmt.cond);
          if (!pyTruthy(condVal)) break;
          try {
            executeBlock(stmt.body);
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
          }
        }
      } else if (stmt.type === 'for') {
        currentExecutingLine = stmt.lineNo;
        const iterVal = evalExpr(stmt.iterExpr);
        const items = toIterableArray(iterVal);
        for (const item of items) {
          if (steps.length >= maxSteps) break;
          currentExecutingLine = stmt.lineNo;
          assignLoopTarget(stmt.target, item);
          recordStep(stmt.lineNo, 'line');
          try {
            executeBlock(stmt.body);
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
          }
        }
      }
    }
  };

  let errorMsg: string | null = null;
  let waitingInput = false;
  let waitingLine: number | undefined = undefined;
  let waitingPrompt = '';
  let waitingVar = '';

  try {
    const logicalLines = preprocessLines(codeStr);
    const { nodes } = parseBlock(logicalLines, 0, 0);
    executeBlock(nodes);
  } catch (err: any) {
    if (err instanceof WaitingForInputSignal) {
      waitingInput = true;
      waitingLine = err.lineNo;
      waitingPrompt = err.prompt;
      waitingVar = err.varName;
    } else if (err instanceof ReturnSignal) {
      // Top-level return
    } else {
      errorMsg = err?.message || String(err);
      recordStep(currentExecutingLine, 'exception', undefined, errorMsg || undefined);
    }
  }

  if (steps.length > 0 && !waitingInput) {
    steps[steps.length - 1].stdout = stdoutCapture;
    steps[steps.length - 1].shell_segments = [...shellSegments];
  }

  return {
    steps,
    error: errorMsg,
    total_steps: steps.length,
    stdout: stdoutCapture,
    waiting_input: waitingInput,
    waiting_line: waitingLine,
    waiting_prompt: waitingPrompt,
    waiting_var: waitingVar,
    shell_segments: shellSegments,
  };
}
