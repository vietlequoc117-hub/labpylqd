import { PseudocodeLine } from '../types';

/**
 * Intelligent algorithmic parser that translates arbitrary user-written Python code
 * into structured, pedagogical Vietnamese pseudocode with line-by-line synchronization.
 */
export function generatePseudocodeFromPython(pythonCode: string): PseudocodeLine[] {
  if (!pythonCode || !pythonCode.trim()) {
    return [];
  }

  const rawLines = pythonCode.split('\n');
  const result: PseudocodeLine[] = [];
  let pseudoLineCount = 1;

  for (let idx = 0; idx < rawLines.length; idx++) {
    const rawLine = rawLines[idx];
    const originalLineNum = idx + 1;
    const trimmed = rawLine.trim();

    // Skip empty lines or pure comment lines from pseudocode
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Determine indentation level (standard 4 spaces or 1 tab per level)
    const leadingSpaces = rawLine.search(/\S|$/);
    const indentLevel = Math.max(0, Math.floor(leadingSpaces / 4));

    // Strip inline comment
    let codePart = trimmed;
    let commentPart = '';
    const hashIdx = trimmed.indexOf('#');
    if (hashIdx !== -1) {
      codePart = trimmed.substring(0, hashIdx).trim();
      commentPart = trimmed.substring(hashIdx + 1).trim();
    }

    let pseudoText = '';
    let explanation = commentPart || undefined;

    // 1. Function definition
    if (codePart.startsWith('def ')) {
      const match = codePart.match(/def\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*:/);
      if (match) {
        pseudoText = `Thuật toán ${match[1]}(${match[2]}):`;
        explanation = explanation || `Định nghĩa hàm/thuật toán nhận tham số (${match[2]})`;
      } else {
        pseudoText = codePart.replace('def ', 'Thuật toán ').replace(':', ':');
      }
    }
    // 2. Class definition
    else if (codePart.startsWith('class ')) {
      const match = codePart.match(/class\s+([a-zA-Z0-9_]+)/);
      const name = match ? match[1] : 'Class';
      pseudoText = `Cấu trúc dữ liệu ${name}:`;
      explanation = explanation || `Khai báo cấu trúc dữ liệu ${name}`;
    }
    // 3. For loop with range
    else if (codePart.startsWith('for ') && codePart.includes(' in range(')) {
      const match = codePart.match(/for\s+([a-zA-Z0-9_,\s]+)\s+in\s+range\((.*?)\)\s*:/);
      if (match) {
        const iterVar = match[1].trim();
        const args = match[2].split(',').map((s) => s.trim());
        if (args.length === 1) {
          pseudoText = `Lặp ${iterVar} từ 0 đến ${args[0]} - 1:`;
        } else if (args.length === 2) {
          pseudoText = `Lặp ${iterVar} từ ${args[0]} đến ${args[1]} - 1:`;
        } else if (args.length === 3) {
          pseudoText = `Lặp ${iterVar} từ ${args[0]} đến ${args[1]} - 1 (bước ${args[2]}):`;
        }
      } else {
        pseudoText = codePart.replace('for ', 'Lặp ').replace(':', ' thì:');
      }
    }
    // 4. For loop over iterable (e.g. for x in arr:)
    else if (codePart.startsWith('for ') && codePart.includes(' in ')) {
      const match = codePart.match(/for\s+([a-zA-Z0-9_,\s]+)\s+in\s+(.*?)\s*:/);
      if (match) {
        pseudoText = `Duyệt từng phần tử ${match[1].trim()} trong ${match[2].trim()}:`;
      } else {
        pseudoText = codePart.replace('for ', 'Duyệt ').replace(':', ':');
      }
    }
    // 5. While loop
    else if (codePart.startsWith('while ')) {
      const cond = codePart.replace(/^while\s+/, '').replace(/\s*:\s*$/, '');
      pseudoText = `Trong khi (${cond}):`;
    }
    // 6. Conditionals (if, elif, else)
    else if (codePart.startsWith('if ')) {
      const cond = codePart.replace(/^if\s+/, '').replace(/\s*:\s*$/, '');
      pseudoText = `Nếu (${cond}) thì:`;
    } else if (codePart.startsWith('elif ')) {
      const cond = codePart.replace(/^elif\s+/, '').replace(/\s*:\s*$/, '');
      pseudoText = `Ngược lại nếu (${cond}) thì:`;
    } else if (codePart.startsWith('else:')) {
      pseudoText = 'Ngược lại:';
    }
    // 7. Swapping: a, b = b, a
    else if (codePart.includes(',') && codePart.includes('=') && !codePart.startsWith('return')) {
      const parts = codePart.split('=').map((p) => p.trim());
      if (parts.length === 2 && parts[0].includes(',') && parts[1].includes(',')) {
        pseudoText = `Hoán đổi ${parts[0]} ↔ ${parts[1]}`;
        explanation = explanation || 'Đổi chỗ hai phần tử trong danh sách';
      }
    }
    // 8. Return
    if (!pseudoText && codePart.startsWith('return')) {
      const retVal = codePart.replace(/^return\s*/, '').trim();
      pseudoText = retVal ? `Trả về ${retVal}` : 'Kết thúc thuật toán';
    }
    // 9. Break & Continue
    if (!pseudoText && codePart === 'break') {
      pseudoText = 'Dừng vòng lặp (break)';
    } else if (!pseudoText && codePart === 'continue') {
      pseudoText = 'Chuyển sang bước lặp tiếp theo (continue)';
    }
    // 10. Print
    if (!pseudoText && codePart.startsWith('print(')) {
      const inner = codePart.replace(/^print\(/, '').replace(/\)\s*$/, '');
      pseudoText = `Xuất ra màn hình: ${inner}`;
    }
    // 11. Input
    if (!pseudoText && codePart.includes('input(')) {
      pseudoText = `Nhận dữ liệu từ bàn phím: ${codePart.replace('=', '←')}`;
    }
    // 12. Standard assignments: var = val, var += val
    if (!pseudoText) {
      if (codePart.includes(' += ')) {
        const [left, right] = codePart.split(' += ');
        pseudoText = `${left.trim()} ← ${left.trim()} + ${right.trim()}`;
      } else if (codePart.includes(' -= ')) {
        const [left, right] = codePart.split(' -= ');
        pseudoText = `${left.trim()} ← ${left.trim()} - ${right.trim()}`;
      } else if (codePart.includes(' *= ')) {
        const [left, right] = codePart.split(' *= ');
        pseudoText = `${left.trim()} ← ${left.trim()} * ${right.trim()}`;
      } else if (codePart.includes(' /= ')) {
        const [left, right] = codePart.split(' /= ');
        pseudoText = `${left.trim()} ← ${left.trim()} / ${right.trim()}`;
      } else if (codePart.includes(' = ') && !codePart.startsWith('if') && !codePart.startsWith('while')) {
        const [left, right] = codePart.split(' = ');
        pseudoText = `${left.trim()} ← ${right.trim()}`;
      } else {
        pseudoText = codePart;
      }
    }

    result.push({
      lineNum: pseudoLineCount++,
      text: pseudoText,
      indent: indentLevel,
      explanation: explanation,
      correspondingPythonLines: [originalLineNum],
    });
  }

  return result;
}
