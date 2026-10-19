import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Lightbulb,
  Code2,
  Clock,
  AlertTriangle,
  Send,
  RefreshCw,
  Copy,
  Check,
  BookOpen,
  MessageSquare,
  HelpCircle,
  GraduationCap,
  ChevronRight,
  Zap,
  Globe,
  Target,
  Layers,
  Map,
  Table,
  CheckCircle2,
} from 'lucide-react';
import { TraceStep } from '../types';
import { getHighSchoolPedagogy } from '../services/aiTutorKnowledge';
import { getLocalPedagogyResponse, answerStudentQuestion } from '../services/aiTutorEngine';
import { lintPythonCode } from '../services/pythonLinter';

interface HighSchoolAITutorProps {
  algorithmId: string;
  algorithmTitle?: string;
  code: string;
  currentStep?: TraceStep;
  currentStepIndex: number;
  totalSteps: number;
  stdinInput?: string;
}

type TutorMode =
  | 'concept'
  | 'code_breakdown'
  | 'complexity'
  | 'exam_tips'
  | 'step_insight'
  | 'curriculum_matrix'
  | 'curriculum_roadmap'
  | 'curriculum_bigo'
  | 'curriculum_exam_traps'
  | 'chat';

export const HighSchoolAITutor: React.FC<HighSchoolAITutorProps> = ({
  algorithmId,
  algorithmTitle = 'Thuật toán',
  code,
  currentStep,
  currentStepIndex,
  totalSteps,
  stdinInput = '',
}) => {
  // Chế độ phạm vi: 'all' = Tổng thể tất cả các bài học THPT (mặc định), 'current' = Trọng tâm bài đang mở
  const [scope, setScope] = useState<'all' | 'current'>('all');

  // Mặc định ở chế độ Đặt câu hỏi tổng thể tất cả các bài học (Chat với Chuyên gia AI)
  const [activeMode, setActiveMode] = useState<TutorMode>('chat');
  const [responseContent, setResponseContent] = useState<string>(() =>
    getLocalPedagogyResponse('curriculum_matrix', algorithmId, currentStep)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; text: string; time: string }[]>([
    {
      role: 'assistant',
      text: `👋 **Chào bạn! Thầy/cô là Chuyên gia Lập trình Python kiêm Trợ lí Sư phạm Tin học THPT.**

Bạn đang ở **chế độ: Đặt câu hỏi tổng thể tất cả các bài học (Toàn bộ chương trình Tin học THPT)**.
Tại đây bạn không bị giới hạn trong từng bài, mà có thể thoải mái đặt mọi câu hỏi về:
- 📊 **So sánh & Tổng quan:** Bảng so sánh 8 thuật toán, tìm kiếm nhị phân vs tuần tự, thuật toán nào chạy nhanh nhất, khi nào nên dùng...
- 🐍 **Cú pháp & Bản chất Python:** Hoán đổi \`a, b = b, a\`, hàm \`range()\`, hàm \`len()\`, nhập mảng \`map(int, input().split())\`, đệ quy, lỗi biến chưa khai báo \`NameError\` (\`tota\`, \`resul\`, \`user_dat\`)...
- ⚡ **Độ phức tạp Big-O & 10 Bẫy đề thi trắc nghiệm THPT.**

💡 *Hãy gõ câu hỏi của bạn vào khung bên dưới hoặc nhấn vào các gợi ý có sẵn để nhận câu trả lời tức thì nhé!*`,
      time: 'Mới nhất',
    },
  ]);

  // Lọc câu hỏi gợi ý theo chuyên đề
  const [questionCategory, setQuestionCategory] = useState<'all_compare' | 'python_syntax' | 'exam_tips' | 'current_lesson'>('all_compare');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Khi học sinh chuyển scope, tự động cập nhật danh mục câu hỏi và giữ trải nghiệm liền mạch
  const handleScopeChange = (newScope: 'all' | 'current') => {
    setScope(newScope);
    if (newScope === 'all') {
      setQuestionCategory('all_compare');
    } else {
      setQuestionCategory('current_lesson');
    }
  };

  // Tự động tải lời giải thích theo chế độ khi đổi thuật toán hoặc đổi tab
  useEffect(() => {
    fetchTutorExplanation(activeMode, undefined, scope);
  }, [algorithmId, activeMode, currentStepIndex]);

  // Cuộn xuống cuối khi có tin nhắn mới trong chế độ chat
  useEffect(() => {
    if (activeMode === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeMode]);

  const fetchTutorExplanation = async (mode: TutorMode, specificQuestion?: string, currentScope: 'all' | 'current' = scope) => {
    // 1. Phản hồi TỨC THÌ 0ms bằng động cơ AI Sư Phạm Tích Hợp Sẵn (Hoàn toàn không cần API)
    if (mode === 'chat' && specificQuestion) {
      const instantAnswer = answerStudentQuestion({
        question: specificQuestion,
        algorithmId,
        algorithmTitle,
        code,
        currentStep,
        stdinInput,
        scope: currentScope,
      });
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: instantAnswer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } else if (mode !== 'chat') {
      const instantResponse = getLocalPedagogyResponse(mode, algorithmId, currentStep);
      setResponseContent(instantResponse);
    }

    // 2. Tùy chọn gửi ngầm đến backend server
    try {
      const res = await fetch('/api/gemini/high-school-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          algorithmId,
          algorithmName: algorithmTitle,
          code,
          mode: mode === 'chat' ? 'chat' : mode,
          userQuestion: specificQuestion || customQuestion,
          currentStep: currentStep || null,
          stdinInput,
          scope: currentScope,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.response && !data.isFallback) {
          if (mode === 'chat' && specificQuestion) {
            setChatHistory((prev) => {
              if (prev.length === 0) return prev;
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: 'assistant',
                text: data.response,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
              return updated;
            });
          } else if (mode !== 'chat') {
            setResponseContent(data.response);
          }
        }
      }
    } catch {
      // Yên lặng bỏ qua, học sinh vẫn có câu trả lời tức thì đầy đủ 100%
    }
  };

  const handleAskQuestion = (q?: string) => {
    const questionText = q || customQuestion.trim();
    if (!questionText) return;

    setActiveMode('chat');
    setChatHistory((prev) => [
      ...prev,
      {
        role: 'user',
        text: questionText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setCustomQuestion('');
    fetchTutorExplanation('chat', questionText, scope);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(responseContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Kiểm tra lỗi cú pháp/từ khóa thời gian thực trong code hiện tại của học sinh
  const currentLint = lintPythonCode(code);
  const keywordErrorsCount = currentLint.errors.filter((e) => e.category === 'keyword').length;

  // Danh mục câu hỏi gợi ý tổng thể toàn bộ chương trình THPT
  const categorizedQuestions = {
    all_compare: [
      'Thuật toán nào chạy nhanh nhất trong tất cả các bài?',
      'Bảng so sánh tất cả các thuật toán sắp xếp (Bubble, Selection, Insertion, Quick, Merge)?',
      'Khi nào nên dùng thuật toán nào trong bài thi THPT?',
      'So sánh Tìm kiếm nhị phân (Binary Search) và Tìm kiếm tuần tự (Linear Search)?',
      'Thuật toán sắp xếp nào có số lần hoán đổi (swap) ít nhất?',
      'Tính ổn định (Stable Sort) là gì và thuật toán nào có tính ổn định?',
      'Độ phức tạp Big-O: O(1), O(log n), O(n), O(n log n), O(n²) nghĩa là gì?',
      'Bản đồ lộ trình học thuật toán Tin học THPT nên học bài nào trước?',
    ],
    python_syntax: [
      'Tất cả các lỗi từ khóa và lỗi biến NameError (tota, resul, user_dat) hay gặp?',
      'Tại sao hoán đổi được a, b = b, a mà không cần biến trung gian temp?',
      'Cách nhập mảng bằng map(int, input().split()) trong đề thi?',
      'Tại sao chỉ số mảng trong Python lại bắt đầu từ 0?',
      'Hàm sort() và sorted() trong Python khác nhau thế nào?',
      'Khi nào dùng vòng lặp for và khi nào dùng while?',
      'Đệ quy (Recursion) là gì và ứng dụng trong Quick Sort / Merge Sort?',
      'Tại sao cận hàm range(0, n - i - 1) lại phải trừ 1 và trừ i?',
      'Tại sao khi so sánh xâu thì "10" < "2" và "Z" < "a"?',
      'Tác dụng của biến cờ swapped trong thuật toán nổi bọt?',
      'Kiểm tra lỗi từ khóa và cú pháp trong code em tự nhập?',
    ],
    exam_tips: [
      '10 bẫy đề thi trắc nghiệm Tin học THPT hay gặp nhất trong tất cả các bài?',
      'Bẫy điều kiện mảng chưa sắp xếp khi áp dụng Tìm kiếm nhị phân?',
      'Mẹo tính nhanh số lần lặp và số phép so sánh trong phòng thi?',
      'Các câu hỏi trắc nghiệm lý thuyết về độ phức tạp Big-O hay gài bẫy?',
      'Trợ lí AI có cần cài đặt API hay mật khẩu tài khoản không?',
    ],
    current_lesson: [
      `Ý tưởng đời sống và bản chất của ${algorithmTitle}?`,
      `Mổ xẻ từng dòng code của ${algorithmTitle}?`,
      `Độ phức tạp Big-O trường hợp tốt nhất và xấu nhất của ${algorithmTitle}?`,
      `Các bẫy đề thi trắc nghiệm hay gặp về ${algorithmTitle}?`,
      'Kiểm tra lỗi từ khóa và cú pháp trong code em tự nhập?',
    ],
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs text-slate-800">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-white to-purple-50/90 px-4 py-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-sm md:text-base text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Trợ Lí AI - Chuyên Gia Lập Trình Python Cấp Cao</span>
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold">
                Senior Python Tutor
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              {scope === 'all'
                ? 'Chế độ: Đặt câu hỏi tổng thể tất cả các bài học THPT • Chuẩn xác bản chất • Dễ hiểu 100%'
                : `Chế độ: Trọng tâm bài học ${algorithmTitle} • Đặt câu hỏi bất kỳ`}
            </p>
          </div>
        </div>

        {/* Huy hiệu Tính năng */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Hỏi tổng thể mọi bài</span>
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tích hợp sẵn (0ms)</span>
          </span>
        </div>
      </div>

      {/* Scope Selector: Toàn bộ chương trình vs Trọng tâm bài hiện tại */}
      <div className="px-3 pt-2 pb-1.5 bg-slate-50/90 border-b border-slate-200">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl max-w-xl">
          <button
            onClick={() => handleScopeChange('all')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              scope === 'all'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Toàn bộ chương trình (Tất cả các bài)</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-bold hidden sm:inline">
              Khuyên dùng
            </span>
          </button>

          <button
            onClick={() => handleScopeChange('current')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              scope === 'current'
                ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-slate-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Theo bài hiện tại ({algorithmTitle})</span>
          </button>
        </div>
      </div>

      {/* Code Error Warning Banner if student has syntax / keyword error */}
      {currentLint.errors.length > 0 && (
        <div
          onClick={() => handleAskQuestion('Kiểm tra lỗi từ khóa và cú pháp trong code em tự nhập?')}
          className="px-4 py-2 bg-rose-50 border-b border-rose-200 flex items-center justify-between gap-2 text-xs text-rose-800 cursor-pointer hover:bg-rose-100/80 transition-all"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
            <span className="font-semibold">
              Chuyên gia phát hiện {currentLint.errors.length} lỗi trong code {keywordErrorsCount > 0 ? `(có ${keywordErrorsCount} lỗi từ khóa)` : ''}! Nhấn vào đây để xem hướng dẫn sửa chi tiết.
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold flex items-center gap-1 shrink-0">
            <span>Sửa lỗi ngay</span>
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      )}

      {/* Action Buttons: Thay đổi linh hoạt theo Scope (Toàn bộ bài vs Bài hiện tại) */}
      <div className="p-2.5 bg-white border-b border-slate-200">
        {scope === 'all' ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              onClick={() => {
                setActiveMode('chat');
              }}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeMode === 'chat'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-xs ring-1 ring-indigo-400'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0 text-amber-300" />
              <span>Hỏi đáp mọi bài</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('curriculum_matrix');
                fetchTutorExplanation('curriculum_matrix', undefined, 'all');
              }}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeMode === 'curriculum_matrix'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
              }`}
            >
              <Table className="w-4 h-4 shrink-0 text-amber-300" />
              <span>Bảng so sánh 8 bài</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('curriculum_bigo');
                fetchTutorExplanation('curriculum_bigo', undefined, 'all');
              }}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeMode === 'curriculum_bigo'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0 text-cyan-300" />
              <span>Tra cứu Big-O</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('curriculum_exam_traps');
                fetchTutorExplanation('curriculum_exam_traps', undefined, 'all');
              }}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeMode === 'curriculum_exam_traps'
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />
              <span>10 Bẫy đề thi THPT</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('curriculum_roadmap');
                fetchTutorExplanation('curriculum_roadmap', undefined, 'all');
              }}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeMode === 'curriculum_roadmap'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
              }`}
            >
              <Map className="w-4 h-4 shrink-0 text-emerald-200" />
              <span>Lộ trình học Tin</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              onClick={() => {
                setActiveMode('chat');
              }}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeMode === 'chat'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-xs ring-1 ring-emerald-400'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0 text-amber-300" />
              <span>Hỏi đáp bài này</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('concept');
                fetchTutorExplanation('concept', undefined, 'current');
              }}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeMode === 'concept'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
              }`}
            >
              <Lightbulb className="w-4 h-4 shrink-0" />
              <span>Ý tưởng ({algorithmTitle})</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('code_breakdown');
                fetchTutorExplanation('code_breakdown', undefined, 'current');
              }}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeMode === 'code_breakdown'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
              }`}
            >
              <Code2 className="w-4 h-4 shrink-0" />
              <span>Mổ xẻ từng câu code</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('complexity');
                fetchTutorExplanation('complexity', undefined, 'current');
              }}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeMode === 'complexity'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>Độ phức tạp O(n)</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('exam_tips');
                fetchTutorExplanation('exam_tips', undefined, 'current');
              }}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeMode === 'exam_tips'
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Bẫy bài thi này</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[320px] bg-slate-50/40">
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-6 gap-3 text-indigo-600">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-xs font-medium">Trợ lí AI đang tổng hợp bài giảng...</span>
          </div>
        )}

        {/* Regular Mode Display */}
        {!isLoading && activeMode !== 'chat' && (
          <div className="space-y-4">
            {/* Header of the current section */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                {activeMode === 'curriculum_matrix' && <Table className="w-4 h-4 text-indigo-600" />}
                {activeMode === 'curriculum_bigo' && <Clock className="w-4 h-4 text-purple-600" />}
                {activeMode === 'curriculum_exam_traps' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                {activeMode === 'curriculum_roadmap' && <Map className="w-4 h-4 text-emerald-600" />}
                {activeMode === 'concept' && <Lightbulb className="w-4 h-4 text-amber-500" />}
                {activeMode === 'code_breakdown' && <Code2 className="w-4 h-4 text-sky-600" />}
                {activeMode === 'complexity' && <Clock className="w-4 h-4 text-purple-600" />}
                {activeMode === 'exam_tips' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                <span className="font-bold text-sm text-slate-900">
                  {activeMode === 'curriculum_matrix' && 'Bảng so sánh toàn diện 8 thuật toán THPT'}
                  {activeMode === 'curriculum_bigo' && 'Bảng tra cứu độ phức tạp thời gian Big-O toàn diện'}
                  {activeMode === 'curriculum_exam_traps' && 'Bộ 10 bẫy đề thi trắc nghiệm Tin học THPT kinh điển'}
                  {activeMode === 'curriculum_roadmap' && 'Bản đồ lộ trình học thuật toán & Python THPT'}
                  {activeMode === 'concept' && `Ý tưởng đời sống & Bản chất (${algorithmTitle})`}
                  {activeMode === 'code_breakdown' && `Giải thích chi tiết từng câu lệnh Python (${algorithmTitle})`}
                  {activeMode === 'complexity' && `Độ phức tạp Big-O (${algorithmTitle})`}
                  {activeMode === 'exam_tips' && `Các bẫy đề thi hay gặp (${algorithmTitle})`}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveMode('chat')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-all cursor-pointer shadow-2xs"
                  title="Mở khung hỏi đáp để thảo luận cùng Chuyên gia AI"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Hỏi đáp AI</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs transition-all cursor-pointer border border-slate-200 shadow-2xs"
                  title="Sao chép lời giải thích"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                </button>

                <button
                  onClick={() => fetchTutorExplanation(activeMode, undefined, scope)}
                  disabled={isLoading}
                  className="p-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 transition-all cursor-pointer border border-slate-200 shadow-2xs"
                  title="Tải lại nội dung"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Explanation Content formatted */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 text-xs md:text-sm leading-relaxed text-slate-800 whitespace-pre-line font-sans shadow-xs overflow-x-auto">
              {responseContent || 'Đang chuẩn bị nội dung sư phạm...'}
            </div>

            {/* Chuyên mục Câu hỏi gợi ý theo phân loại */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Câu hỏi gợi ý học sinh hay thắc mắc (Nhấn để hỏi AI ngay):</span>
                </span>

                {/* Tabs chuyên đề câu hỏi */}
                <div className="flex items-center gap-1 flex-wrap text-[10px]">
                  <button
                    onClick={() => setQuestionCategory('all_compare')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                      questionCategory === 'all_compare'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    So sánh thuật toán
                  </button>
                  <button
                    onClick={() => setQuestionCategory('python_syntax')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                      questionCategory === 'python_syntax'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    Lập trình Python
                  </button>
                  <button
                    onClick={() => setQuestionCategory('exam_tips')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                      questionCategory === 'exam_tips'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    Bẫy trắc nghiệm THPT
                  </button>
                  <button
                    onClick={() => setQuestionCategory('current_lesson')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                      questionCategory === 'current_lesson'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    Bài đang xem
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {categorizedQuestions[questionCategory].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskQuestion(q)}
                    className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer text-left shadow-2xs"
                  >
                    <HelpCircle className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Conversation History Mode */}
        {activeMode === 'chat' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  Hội thoại cùng Chuyên gia AI ({scope === 'all' ? 'Toàn bộ chương trình THPT' : `Bài: ${algorithmTitle}`})
                </span>
              </span>
              <button
                onClick={() => setChatHistory([])}
                className="text-[11px] text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 cursor-pointer"
              >
                Xóa lịch sử
              </button>
            </div>

            {chatHistory.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs space-y-2">
                <Bot className="w-8 h-8 mx-auto text-indigo-500/60" />
                <p>Hãy gõ câu hỏi bất kỳ về mọi bài học thuật toán, so sánh, cú pháp Python hoặc bấm câu hỏi gợi ý bên dưới!</p>
                <p className="text-[11px] text-emerald-700 font-semibold">
                  ⚡ Trả lời đúng 100% trọng tâm &bull; Tích hợp sẵn không cần API key
                </p>
              </div>
            )}

            {chatHistory.map((item, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  item.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs whitespace-pre-line ${
                    item.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none font-sans'
                  }`}
                >
                  {item.text}
                </div>
                <span className="text-[10px] text-slate-400 px-1 mt-0.5">{item.time}</span>
              </div>
            ))}
            <div ref={chatEndRef} />

            {/* Quick Suggestions below chat with category switching */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-1.5">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Chọn câu hỏi nhanh về mọi bài học:</span>
                </span>

                <div className="flex items-center gap-1 flex-wrap text-[10px]">
                  <button
                    onClick={() => setQuestionCategory('all_compare')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                      questionCategory === 'all_compare'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    So sánh thuật toán
                  </button>
                  <button
                    onClick={() => setQuestionCategory('python_syntax')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                      questionCategory === 'python_syntax'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    Lập trình Python
                  </button>
                  <button
                    onClick={() => setQuestionCategory('exam_tips')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                      questionCategory === 'exam_tips'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    Bẫy trắc nghiệm
                  </button>
                  <button
                    onClick={() => setQuestionCategory('current_lesson')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                      questionCategory === 'current_lesson'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    Bài đang xem
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {categorizedQuestions[questionCategory].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskQuestion(q)}
                    className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer text-left shadow-2xs"
                  >
                    <HelpCircle className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Bottom Question Input Bar */}
      <div className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder={
              scope === 'all'
                ? 'Hỏi Chuyên gia tổng thể mọi bài học (so sánh thuật toán, cú pháp Python, bài tập, đề thi...)...'
                : `Hỏi Chuyên gia về bài ${algorithmTitle} hoặc so sánh với các thuật toán khác...`
            }
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />

          <button
            type="submit"
            disabled={!customQuestion.trim() || isLoading}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hỏi AI</span>
          </button>
        </form>
      </div>
    </div>
  );
};
