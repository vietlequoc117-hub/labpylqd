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
  ArrowRight,
  Compass,
} from 'lucide-react';
import { TraceStep } from '../types';
import { getHighSchoolPedagogy } from '../services/aiTutorKnowledge';

interface HighSchoolAITutorProps {
  algorithmId: string;
  algorithmTitle?: string;
  code: string;
  currentStep?: TraceStep;
  currentStepIndex: number;
  totalSteps: number;
  stdinInput?: string;
}

type TutorMode = 'concept' | 'code_breakdown' | 'complexity' | 'exam_tips' | 'step_insight' | 'chat';

export const HighSchoolAITutor: React.FC<HighSchoolAITutorProps> = ({
  algorithmId,
  algorithmTitle = 'Thuật toán',
  code,
  currentStep,
  currentStepIndex,
  totalSteps,
  stdinInput = '',
}) => {
  const [activeMode, setActiveMode] = useState<TutorMode>('concept');
  const [responseContent, setResponseContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; text: string; time: string }[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const defaultPedagogy = getHighSchoolPedagogy(algorithmId);

  // Tự động tải lời giải thích theo chế độ khi đổi thuật toán hoặc đổi tab
  useEffect(() => {
    fetchTutorExplanation(activeMode);
  }, [algorithmId, activeMode]);

  // Cuộn xuống cuối khi có tin nhắn mới trong chế độ chat
  useEffect(() => {
    if (activeMode === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeMode]);

  const fetchTutorExplanation = async (mode: TutorMode, specificQuestion?: string) => {
    setIsLoading(true);
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
        }),
      });

      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      const answer = data.response || '';

      if (mode === 'chat' && specificQuestion) {
        setChatHistory((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: answer,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setResponseContent(answer);
      }
    } catch (err) {
      // Fallback cục bộ đảm bảo luôn có kết quả sư phạm hoàn hảo
      const fallback = getHighSchoolPedagogy(algorithmId);
      let fallbackText = fallback.realLifeAnalogy;
      if (mode === 'code_breakdown') fallbackText = fallback.codeBreakdown;
      else if (mode === 'complexity') fallbackText = fallback.complexityExplanation;
      else if (mode === 'exam_tips') fallbackText = fallback.examTipsAndTraps;
      else if (mode === 'step_insight' && currentStep) {
        fallbackText = `📍 **Phân tích bước hiện tại (Dòng ${currentStep.line_number || '-'}):**\n- Sự kiện: \`${currentStep.event || 'line'}\`.\n- Dòng lệnh này đang thực hiện thao tác so sánh hoặc cập nhật trong thuật toán. Hãy quan sát cột dữ liệu trên biểu đồ!`;
      }

      if (mode === 'chat' && specificQuestion) {
        setChatHistory((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: fallbackText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setResponseContent(fallbackText);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = (q?: string) => {
    const questionText = q || customQuestion.trim();
    if (!questionText || isLoading) return;

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
    fetchTutorExplanation('chat', questionText);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(responseContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl text-slate-100">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 px-4 py-3 border-b border-indigo-900/40 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm md:text-base text-white tracking-tight flex items-center gap-1.5">
                <span>Trợ Lí AI Sư Phạm Tin Học THPT</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-medium">
                  LQD AI Tutor
                </span>
              </h2>
            </div>
            <p className="text-[11px] text-slate-400">
              Giải thích thuật toán trực quan, dễ hiểu nhất dành riêng cho học sinh cấp 3
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sẵn sàng hỗ trợ</span>
          </span>
        </div>
      </div>

      {/* Current Context Pill Bar */}
      <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between gap-2 text-xs flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Thuật toán đang xem:</span>
          <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 font-semibold border border-indigo-500/30">
            {algorithmTitle}
          </span>
        </div>

        {totalSteps > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Tiến trình:</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
              Bước {currentStepIndex + 1}/{totalSteps} (Dòng {currentStep?.line_number || '-'})
            </span>
          </div>
        )}
      </div>

      {/* 4 Chế độ phân tích 1-chạm (Pedagogical Quick Actions) */}
      <div className="p-3 bg-slate-900 border-b border-slate-800">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setActiveMode('concept')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'concept'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md shadow-orange-500/20 ring-1 ring-amber-300'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
            }`}
          >
            <Lightbulb className="w-4 h-4 shrink-0" />
            <span>Ý tưởng đời sống</span>
          </button>

          <button
            onClick={() => setActiveMode('code_breakdown')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'code_breakdown'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold shadow-md shadow-blue-500/20 ring-1 ring-sky-300'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
            }`}
          >
            <Code2 className="w-4 h-4 shrink-0" />
            <span>Mổ xẻ từng dòng code</span>
          </button>

          <button
            onClick={() => setActiveMode('complexity')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'complexity'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold shadow-md shadow-purple-500/20 ring-1 ring-purple-300'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>Độ phức tạp O(n)</span>
          </button>

          <button
            onClick={() => setActiveMode('exam_tips')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'exam_tips'
                ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold shadow-md shadow-rose-500/20 ring-1 ring-rose-300'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Bẫy bài thi THPT</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[320px]">
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-10 gap-3 text-indigo-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-xs font-medium">Trợ lí AI đang phân tích và chuẩn bị bài giảng...</span>
          </div>
        )}

        {/* Regular Mode Display (Concept / Code Breakdown / Complexity / Exam Tips) */}
        {!isLoading && activeMode !== 'chat' && (
          <div className="space-y-4">
            {/* Header of the current section */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {activeMode === 'concept' && <Lightbulb className="w-4 h-4 text-amber-400" />}
                {activeMode === 'code_breakdown' && <Code2 className="w-4 h-4 text-sky-400" />}
                {activeMode === 'complexity' && <Clock className="w-4 h-4 text-purple-400" />}
                {activeMode === 'exam_tips' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                {activeMode === 'step_insight' && <Compass className="w-4 h-4 text-emerald-400" />}
                <span className="font-bold text-sm text-slate-100">
                  {activeMode === 'concept' && 'Ý tưởng đời sống & Bản chất thuật toán'}
                  {activeMode === 'code_breakdown' && 'Giải thích chi tiết từng câu lệnh Python'}
                  {activeMode === 'complexity' && 'Độ phức tạp thời gian Big-O dành cho học sinh'}
                  {activeMode === 'exam_tips' && 'Các bẫy đề thi hay gặp & Mẹo ghi nhớ'}
                  {activeMode === 'step_insight' && `Phân tích bước hiện tại (Dòng ${currentStep?.line_number || '-'})`}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all cursor-pointer"
                  title="Sao chép lời giải thích"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                </button>

                <button
                  onClick={() => fetchTutorExplanation(activeMode)}
                  disabled={isLoading}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                  title="Tải lại nội dung"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Explanation Content formatted */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-xs md:text-sm leading-relaxed text-slate-200 whitespace-pre-line font-sans shadow-inner">
              {responseContent || 'Đang tải nội dung sư phạm...'}
            </div>

            {/* Quick Suggested Questions Pill Container */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                💡 Câu hỏi gợi ý học sinh hay thắc mắc (Nhấn để hỏi AI):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {defaultPedagogy.quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskQuestion(q)}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/25 transition-all cursor-pointer text-left"
                  >
                    <HelpCircle className="w-3 h-3 text-amber-400 shrink-0" />
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
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Hội thoại Hỏi - Đáp cùng Trợ lí AI</span>
              </span>
              <button
                onClick={() => setChatHistory([])}
                className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800"
              >
                Xóa lịch sử
              </button>
            </div>

            {chatHistory.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs space-y-2">
                <Bot className="w-8 h-8 mx-auto text-indigo-400/60" />
                <p>Hãy gõ câu hỏi bất kỳ hoặc chọn câu hỏi gợi ý bên dưới để Trợ lí AI giải đáp cho bạn nhé!</p>
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
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-md whitespace-pre-line ${
                    item.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none font-sans'
                  }`}
                >
                  {item.text}
                </div>
                <span className="text-[10px] text-slate-500 px-1 mt-0.5">{item.time}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Interactive Bottom Question Input Bar */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col gap-2">
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
            placeholder="Đặt câu hỏi cho Trợ lí AI (Ví dụ: Tại sao phải dùng n - i - 1?)..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
          />

          <button
            type="submit"
            disabled={!customQuestion.trim() || isLoading}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hỏi AI</span>
          </button>
        </form>
      </div>
    </div>
  );
};
