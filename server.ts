import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { PRESET_COMPLEXITY_MAP, analyzeComplexityHeuristically } from './src/complexityData.ts';
import { getHighSchoolPedagogy } from './src/services/aiTutorKnowledge.ts';
import { answerStudentQuestion, getLocalPedagogyResponse } from './src/services/aiTutorEngine.ts';

dotenv.config();

const app = express();
app.use(express.json({ limit: '5mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory cache for complexity analysis to conserve Gemini API quota
const complexityCache = new Map<string, any>();

// Circuit breaker when free tier rate limit (429 RESOURCE_EXHAUSTED) is reached
let geminiQuotaExhaustedUntil = 0;

function isQuotaExhausted(): boolean {
  return Date.now() < geminiQuotaExhaustedUntil;
}

function markQuotaExhausted(): void {
  // Back off for 30 minutes to prevent spamming failed requests
  geminiQuotaExhaustedUntil = Date.now() + 30 * 60 * 1000;
}

// Python execution endpoint using local python3 sandbox
app.post('/api/trace', (req, res) => {
  const {
    code,
    stdin = '',
    max_steps = 800,
    interactive_mode = false,
    interactive_inputs = [],
  } = req.body;
  if (typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing code parameter' });
  }

  // Prevent runaway or dangerous system calls in untrusted code
  const dangerousKeywords = [
    'import os',
    'from os',
    'import subprocess',
    'from subprocess',
    'import socket',
    'from socket',
    'import shutil',
    'from shutil',
    '__import__("os")',
    '__import__(\'os\')',
    '__import__("subprocess")',
    '__import__(\'subprocess\')',
  ];

  for (const kw of dangerousKeywords) {
    if (code.includes(kw)) {
      return res.status(400).json({
        error: `Security restriction: Usage of module in "${kw}" is disabled in educational sandbox mode.`,
      });
    }
  }

  const pyProcess = spawn('python3', [
    path.resolve(process.cwd(), 'src/pythonTracer.py'),
    '--json',
  ]);

  let stdoutData = '';
  let stderrData = '';

  pyProcess.stdout.on('data', (chunk) => {
    stdoutData += chunk.toString();
  });

  pyProcess.stderr.on('data', (chunk) => {
    stderrData += chunk.toString();
  });

  const timer = setTimeout(() => {
    pyProcess.kill('SIGKILL');
  }, 7000);

  pyProcess.on('close', (codeStatus) => {
    clearTimeout(timer);
    if (codeStatus !== 0 && !stdoutData) {
      return res.status(500).json({
        error: stderrData || 'Python execution process failed or timed out.',
      });
    }
    try {
      const parsed = JSON.parse(stdoutData);
      return res.json(parsed);
    } catch (e) {
      return res.status(500).json({
        error: 'Failed to parse execution trace output.',
        raw: stdoutData,
        stderr: stderrData,
      });
    }
  });

  pyProcess.stdin.write(
    JSON.stringify({
      code,
      stdin,
      max_steps,
      interactive_mode,
      interactive_inputs,
    })
  );
  pyProcess.stdin.end();
});

// Gemini algorithmic complexity analyzer endpoint
app.post('/api/gemini/complexity', async (req, res) => {
  try {
    const { code, presetId } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required' });
    }

    // 1. Check if presetId matches a pre-computed report (Zero latency, 0 quota used)
    if (presetId && PRESET_COMPLEXITY_MAP[presetId]) {
      return res.json(PRESET_COMPLEXITY_MAP[presetId]);
    }

    // Check code keywords to auto-match preset
    const trimmed = code.trim();
    if (trimmed.includes('def bubble_sort') && PRESET_COMPLEXITY_MAP['bubble-sort']) {
      return res.json(PRESET_COMPLEXITY_MAP['bubble-sort']);
    }
    if (trimmed.includes('def selection_sort') && PRESET_COMPLEXITY_MAP['selection-sort']) {
      return res.json(PRESET_COMPLEXITY_MAP['selection-sort']);
    }
    if (trimmed.includes('def insertion_sort') && PRESET_COMPLEXITY_MAP['insertion-sort']) {
      return res.json(PRESET_COMPLEXITY_MAP['insertion-sort']);
    }
    if (trimmed.includes('def quick_sort') && PRESET_COMPLEXITY_MAP['quick-sort']) {
      return res.json(PRESET_COMPLEXITY_MAP['quick-sort']);
    }
    if (trimmed.includes('def merge_sort') && PRESET_COMPLEXITY_MAP['merge-sort']) {
      return res.json(PRESET_COMPLEXITY_MAP['merge-sort']);
    }
    if (presetId === 'complexity-comparison' && PRESET_COMPLEXITY_MAP['complexity-comparison']) {
      return res.json(PRESET_COMPLEXITY_MAP['complexity-comparison']);
    }
    if (trimmed.includes('def list_sum') && PRESET_COMPLEXITY_MAP['linked-tuple']) {
      return res.json(PRESET_COMPLEXITY_MAP['linked-tuple']);
    }
    if (trimmed.includes('def factorial') && PRESET_COMPLEXITY_MAP['factorial-recursion']) {
      return res.json(PRESET_COMPLEXITY_MAP['factorial-recursion']);
    }
    if (trimmed.includes('def fib(') && PRESET_COMPLEXITY_MAP['fibonacci-recursion']) {
      return res.json(PRESET_COMPLEXITY_MAP['fibonacci-recursion']);
    }
    if (trimmed.includes('def linear_search') && PRESET_COMPLEXITY_MAP['linear-search']) {
      return res.json(PRESET_COMPLEXITY_MAP['linear-search']);
    }
    if (trimmed.includes('def binary_search') && PRESET_COMPLEXITY_MAP['binary-search']) {
      return res.json(PRESET_COMPLEXITY_MAP['binary-search']);
    }

    // 2. Check in-memory cache for custom code
    const cacheKey = trimmed;
    if (complexityCache.has(cacheKey)) {
      return res.json(complexityCache.get(cacheKey));
    }

    // 3. If no API key configured or circuit breaker active (rate limit 429), use heuristic analyzer
    if (!process.env.GEMINI_API_KEY || isQuotaExhausted()) {
      const fallbackReport = analyzeComplexityHeuristically(code);
      complexityCache.set(cacheKey, fallbackReport);
      return res.json(fallbackReport);
    }

    // 4. Call Gemini 3.8 Flash
    try {
      const prompt = `Bạn là một Giáo sư Khoa học Máy tính và Chuyên gia Thuật toán hàng đầu.
Hãy phân tích độ phức tạp thời gian (Time Complexity) và không gian (Space Complexity) của đoạn code Python sau đây một cách cực kỳ chi tiết, chính xác và sư phạm:

\`\`\`python
${code}
\`\`\`

Hãy phân tích theo schema JSON yêu cầu:
- timeComplexity: ví dụ "O(n)", "O(n^2)", "O(log n)", "O(2^n)", "O(1)"
- spaceComplexity: ví dụ "O(n)", "O(1)", "O(log n)"
- auxiliaryStackSpace: phân tích chi tiết chiều sâu ngăn xếp gọi hàm đệ quy (ví dụ: "O(n) do tối đa n stack frames cùng tồn tại")
- heapAllocation: phân tích bộ nhớ cấp phát trên Heap cho các object (list, tuple, dict, custom nodes)
- recurrenceRelation: hệ thức truy hồi (nếu có đệ quy, ví dụ T(n) = T(n-1) + O(1), hoặc "N/A" nếu là lặp)
- timeExplanation: giải thích chi tiết từng vòng lặp, số lần gọi hàm, phân tích best/average/worst case nếu có
- spaceExplanation: giải thích tổng dung lượng bộ nhớ stack + heap
- keyOperationsCount: công thức xấp xỉ số phép tính theo n (ví dụ: "n * (n + 1) / 2" hoặc "2^n - 1")
- optimizationTips: mảng các mẹo tối ưu thuật toán (như dùng lặp, memoization, inplace)`;

      const geminiRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              timeComplexity: { type: Type.STRING },
              spaceComplexity: { type: Type.STRING },
              auxiliaryStackSpace: { type: Type.STRING },
              heapAllocation: { type: Type.STRING },
              recurrenceRelation: { type: Type.STRING },
              timeExplanation: { type: Type.STRING },
              spaceExplanation: { type: Type.STRING },
              keyOperationsCount: { type: Type.STRING },
              optimizationTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'timeComplexity',
              'spaceComplexity',
              'auxiliaryStackSpace',
              'heapAllocation',
              'timeExplanation',
              'spaceExplanation',
            ],
          },
        },
      });

      const parsed = JSON.parse(geminiRes.text || '{}');
      complexityCache.set(cacheKey, parsed);
      return res.json(parsed);
    } catch (apiError: any) {
      // If 429 quota is reached, activate circuit breaker
      if (
        apiError?.status === 429 ||
        apiError?.status === 'RESOURCE_EXHAUSTED' ||
        (typeof apiError?.message === 'string' && apiError.message.includes('429'))
      ) {
        markQuotaExhausted();
      }
      const fallback = analyzeComplexityHeuristically(code);
      complexityCache.set(cacheKey, fallback);
      return res.json(fallback);
    }
  } catch (err: any) {
    const fallback = analyzeComplexityHeuristically(req.body.code || '');
    return res.json(fallback);
  }
});

// Gemini AI Tutor endpoint
app.post('/api/gemini/tutor', async (req, res) => {
  try {
    const { code, currentStep, userQuestion, mode = 'explain_step' } = req.body;

    if (!process.env.GEMINI_API_KEY || isQuotaExhausted()) {
      if (mode === 'explain_step') {
        const activeFrame = currentStep?.stack_frames?.[currentStep.stack_frames.length - 1];
        return res.json({
          response: `**Bước hiện tại (Dòng ${currentStep?.line_number || '-'}):**\n` +
            `- **Sự kiện:** \`${currentStep?.event || 'line'}\` trong khung hàm \`${activeFrame?.name || 'Global'}\`.\n` +
            `- **Bộ nhớ:** Có **${currentStep?.stack_frames?.length || 0}** khung trong Call Stack và **${Object.keys(currentStep?.heap_objects || {}).length}** đối tượng trên Heap.`,
        });
      } else {
        return res.json({
          response:
            'Chức năng Trợ giảng AI: Bạn có thể quan sát trực tiếp các bước chuyển trạng thái biến và đối tượng trên bảng **Biến & Bộ Nhớ (Variables)** bên cạnh.',
        });
      }
    }

    const stepSummary = currentStep
      ? `
- Dòng đang thực thi: ${currentStep.line_number}
- Sự kiện (Event): ${currentStep.event}
- Số frames trong Call Stack: ${currentStep.stack_frames?.length || 0} (Khung đỉnh: ${currentStep.stack_frames?.[currentStep.stack_frames.length - 1]?.name || 'N/A'})
- Biến trong active frame: ${JSON.stringify(currentStep.stack_frames?.[currentStep.stack_frames.length - 1]?.variables || {})}
- Số đối tượng trên Heap: ${Object.keys(currentStep.heap_objects || {}).length}
- Stdout hiện tại: ${currentStep.stdout || '(trống)'}
- Return value (nếu có): ${JSON.stringify(currentStep.return_value || null)}
`
      : 'Chưa có bước thực thi nào được chọn.';

    let prompt = '';
    if (mode === 'ask_question') {
      prompt = `Bạn là Trợ giảng AI cho phòng lab trực quan hóa thực thi Python (PyViz Lab).
Học sinh đang theo dõi đoạn code sau:
\`\`\`python
${code}
\`\`\`

Trạng thái thực thi hiện tại:
${stepSummary}

Câu hỏi của học sinh:
"${userQuestion}"

Hãy trả lời bằng tiếng Việt thân thiện, rõ ràng, giải thích bản chất bộ nhớ (Call stack, con trỏ tham chiếu, Heap) và thuật toán để học sinh dễ hiểu nhất. Định dạng Markdown đẹp mắt, có thể dùng code block hoặc bullet points.`;
    } else {
      prompt = `Bạn là Trợ giảng AI trực quan hóa thực thi Python.
Hãy giải thích ngắn gọn, súc tích (khoảng 3-4 câu) cho học sinh hiểu chính xác chuyện gì vừa xảy ra ở bước thực thi này:

Code Python:
\`\`\`python
${code}
\`\`\`

Trạng thái thực thi hiện tại:
${stepSummary}

Hãy nêu:
1. Dòng lệnh này làm gì?
2. Bộ nhớ (Call stack hoặc Heap hoặc biến) đã thay đổi như thế nào?
3. Điều gì sẽ diễn ra tiếp theo?
TrẢ lời bằng tiếng Việt sư phạm, dễ hiểu.`;
    }

    try {
      const geminiRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      return res.json({ response: geminiRes.text });
    } catch (apiErr: any) {
      if (
        apiErr?.status === 429 ||
        apiErr?.status === 'RESOURCE_EXHAUSTED' ||
        (typeof apiErr?.message === 'string' && apiErr.message.includes('429'))
      ) {
        markQuotaExhausted();
      }
      if (mode === 'explain_step') {
        const activeFrame = currentStep?.stack_frames?.[currentStep.stack_frames.length - 1];
        return res.json({
          response: `**Bước hiện tại (Dòng ${currentStep?.line_number || '-'}):**\n` +
            `- **Sự kiện:** \`${currentStep?.event || 'line'}\` trong khung hàm \`${activeFrame?.name || 'Global'}\`.\n` +
            `- **Bộ nhớ:** Có **${currentStep?.stack_frames?.length || 0}** khung trong Call Stack và **${Object.keys(currentStep?.heap_objects || {}).length}** đối tượng trên Heap.`,
        });
      } else {
        return res.json({
          response:
            'Chức năng Trợ giảng AI: Bạn có thể quan sát trực tiếp các bước chuyển trạng thái biến và đối tượng trên bảng **Biến & Bộ Nhớ (Variables)** bên cạnh.',
        });
      }
    }
  } catch (err: any) {
    return res.json({
      response:
        'Hệ thống đang hoạt động ổn định. Bạn có thể tiếp tục xem trực quan hóa các bước thực thi trên sơ đồ bộ nhớ.',
    });
  }
});

app.post('/api/gemini/high-school-tutor', async (req, res) => {
  const {
    algorithmId = 'bubble-sort',
    algorithmName = 'Thuật toán',
    code = '',
    mode = 'concept',
    userQuestion = '',
    currentStep = null,
    stdinInput = '',
    scope = 'all',
  } = req.body;

  const fallbackPedagogy = getHighSchoolPedagogy(algorithmId);

  // Fallback response generator when Gemini API is unconfigured, offline, or rate-limited
  const getFallbackContent = () => {
    if (mode === 'chat' && userQuestion) {
      return answerStudentQuestion({
        question: userQuestion,
        algorithmId,
        algorithmTitle: algorithmName,
        code,
        currentStep,
        stdinInput,
        scope,
      });
    }
    return getLocalPedagogyResponse(
      mode as
        | 'concept'
        | 'code_breakdown'
        | 'complexity'
        | 'exam_tips'
        | 'step_insight'
        | 'curriculum_matrix'
        | 'curriculum_roadmap'
        | 'curriculum_bigo'
        | 'curriculum_exam_traps',
      algorithmId,
      currentStep
    );
  };

  try {

    if (!process.env.GEMINI_API_KEY || isQuotaExhausted()) {
      return res.json({
        response: getFallbackContent(),
        mode,
        isFallback: true,
      });
    }

    // Build pedagogical prompt as Senior Python Expert for High School Students (THPT)
    let prompt = `Bạn là CHUYÊN GIA LẬP TRÌNH CẤP CAO PYTHON (Senior Python Software Engineer) kiêm Chuyên gia Sư phạm Tin học THPT chuyên bồi dưỡng học sinh cấp 3 (Lớp 10, 11, 12) của nền tảng LQD_PYTHON_LAB.
VAI TRÒ & NGUYÊN TẮC BẮT BUỘC:
1. TRẢ LỜI ĐÚNG TRỌNG TÂM 100%: Đi thẳng vào vấn đề học sinh hỏi, trả lời trực diện, chuẩn xác, không nói vòng vo lan man.
2. TẦM NHÌN TOÀN DIỆN MỌI BÀI HỌC (THPT): Học sinh có thể đặt câu hỏi TỔNG THỂ TẤT CẢ CÁC BÀI HỌC trong chương trình (Bubble Sort, Selection Sort, Insertion Sort, Quick Sort, Merge Sort, Linear Search, Binary Search, Xâu ký tự & mã ASCII, cú pháp Python, bài tập tự do, mẹo thi THPT). Hãy tự do so sánh giữa các thuật toán và giải thích tổng quan toàn diện, không được tự giới hạn mình chỉ trong bài học hiện tại trừ khi học sinh yêu cầu cụ thể bài đó.
3. CỰC KỲ DỄ HIỂU CHO HỌC SINH CẤP 3: Dùng ngôn ngữ sư phạm trong sáng, ví dụ trực quan gần gũi, giúp học sinh nắm vững bản chất từ gốc rễ.
4. CHUẨN XÁC KỸ THUẬT PYTHON: Giải thích chính xác bản chất bộ nhớ máy tính (chỉ số 0-based offset, cơ chế tuple packing/unpacking khi hoán đổi a, b = b, a, độ phức tạp Big-O, mutability của list vs immutability của string, bảng mã ASCII...).
5. TRÌNH BÀY CHUYÊN NGHIỆP: Định dạng Markdown đẹp mắt, có gạch đầu dòng, bảng biểu so sánh nếu cần, bôi đậm từ khóa then chốt và kèm khối code Python ngắn gọn có chú thích rõ ràng.

Thông tin ngữ cảnh phòng lab (đang mở bài học: "${algorithmName}" - mã ${algorithmId}):
- Dữ liệu đầu vào: ${stdinInput || '(Mặc định)'}
- Đoạn mã Python hiện tại trên màn hình:
\`\`\`python
${code || '# Chưa có code'}
\`\`\`
`;

    if (currentStep) {
      prompt += `\nTrạng thái bước thực thi hiện tại:
- Dòng lệnh: ${currentStep.line_number}
- Biến hiện có: ${JSON.stringify(currentStep.stack_frames?.[currentStep.stack_frames.length - 1]?.variables || {})}
- Stdout: ${currentStep.stdout || '(trống)'}
`;
    }

    if (mode === 'concept') {
      prompt += `\nYêu cầu: Hãy giải thích Ý TƯỞNG CỐT LÕI của thuật toán này bằng một VÍ DỤ ĐỜI SỐNG THỰC TẾ cực kỳ sinh động và quen thuộc (như xếp hàng chào cờ, lật từ điển, nhặt đồ, chia bài...).
Nêu rõ tại sao con người lại nghĩ ra cách làm này. Trình bày bằng Markdown đẹp mắt, có emoji, gạch đầu dòng rõ ràng.`;
    } else if (mode === 'code_breakdown') {
      prompt += `\nYêu cầu: Hãy MỔ XẺ TỪNG DÒNG CODE Python trên dưới góc nhìn Chuyên gia Python cấp cao.
Giải thích cho học sinh hiểu:
- Từng vòng lặp for/while chạy từ đâu đến đâu và để làm gì?
- Câu lệnh điều kiện if kiểm tra cái gì?
- Các biến (như swapped, key, pivot, mid, left, right...) có vai trò gì?
Trình bày sư phạm, dễ nhớ, làm nổi bật logic của bài.`;
    } else if (mode === 'complexity') {
      prompt += `\nYêu cầu: Hãy giải thích ĐỘ PHỨC TẠP THỜI GIAN Big-O (O(n), O(n^2), O(n log n), O(log n)) cho học sinh THPT dễ hiểu nhất:
- Không dùng công thức vi tích phân phức tạp.
- Đếm số lần so sánh/lặp một cách trực quan.
- Phân biệt rõ Best case (khi nào nhanh nhất), Worst case (khi nào chậm nhất).
- So sánh ví dụ khi n = 10, n = 100, n = 1000 thì mất bao nhiêu bước tính.`;
    } else if (mode === 'exam_tips') {
      prompt += `\nYêu cầu: Hãy chỉ ra CÁC BẪY HỌC SINH HAY SAI & MẸO LÀM BÀI THI TRẮC NGHIỆM TIN HỌC THPT về thuật toán này:
- Những lỗi sai kinh điển khi viết code (IndexError, nhầm dấu so sánh, quên đổi chỗ, nhầm điều kiện dừng...).
- Câu hỏi trắc nghiệm lý thuyết hay gài bẫy (tính ổn định Stable, số lần hoán đổi, số bước lặp sau k lượt...).
- Mẹo ghi nhớ nhanh để không bị nhầm lẫn giữa các thuật toán.`;
    } else if (mode === 'step_insight') {
      prompt += `\nYêu cầu: Hãy giải thích ngắn gọn (3-4 câu) chuyện gì vừa xảy ra ở bước thực thi dòng ${currentStep?.line_number || 'này'}?
Biến nào vừa thay đổi giá trị? Điều gì sẽ diễn ra ở bước tiếp theo?`;
    } else if (mode === 'chat') {
      prompt += `\nCâu hỏi của học sinh:
"${userQuestion}"

YÊU CẦU DÀNH RIÊNG CHO CHUYÊN GIA PYTHON:
1. Trả lời TRỰC DIỆN, ĐÚNG 100% TRỌNG TÂM câu hỏi của học sinh (không nói chung chung, không né tránh câu hỏi).
2. Giải thích rõ ràng nguyên lý hoạt động của Python ở khía cạnh này (ví dụ: tại sao cú pháp này lại như vậy, máy tính chạy câu lệnh này ra sao).
3. Đưa ra ví dụ code Python ngắn gọn, minh họa dễ hiểu nhất để học sinh cấp 3 đọc là hiểu ngay.
4. Cảnh báo các lỗi thường gặp hoặc bẫy đề thi liên quan đến câu hỏi này.`;
    }

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({
      response: geminiRes.text || getFallbackContent(),
      mode,
      isFallback: false,
    });
  } catch (apiError: any) {
    if (
      apiError?.status === 429 ||
      apiError?.status === 'RESOURCE_EXHAUSTED' ||
      (typeof apiError?.message === 'string' && apiError.message.includes('429'))
    ) {
      markQuotaExhausted();
    }
    const fallbackText = getFallbackContent();
    return res.json({
      response: fallbackText,
      mode: req.body.mode || 'concept',
      isFallback: true,
    });
  }
});

// Setup Vite middleware or static serving
const distPath = path.resolve(process.cwd(), 'dist');
const indexHtmlPath = path.resolve(distPath, 'index.html');
const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(indexHtmlPath);

if (!isProd) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    if (fs.existsSync(indexHtmlPath)) {
      res.sendFile(indexHtmlPath);
    } else {
      res.status(404).send('Not Found');
    }
  });
}

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`PyViz Lab Server running on http://0.0.0.0:${PORT}`);
});
