import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ChevronRight,
  BookOpen,
  BarChart2,
  FileText,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  generateQuizQuestion,
  QuizQuestion,
  AlgorithmType,
} from '../utils/quizGenerator';

interface AlgorithmQuizProps {
  currentAlgorithmId?: string;
  onLoadArrayToVisualizer?: (array: number[]) => void;
}

export const AlgorithmQuiz: React.FC<AlgorithmQuizProps> = ({
  currentAlgorithmId = 'bubble-sort',
  onLoadArrayToVisualizer,
}) => {
  // Map currentAlgorithmId sang AlgorithmType
  const initialType: AlgorithmType =
    currentAlgorithmId === 'selection-sort'
      ? 'selection-sort'
      : currentAlgorithmId === 'insertion-sort'
      ? 'insertion-sort'
      : currentAlgorithmId === 'quick-sort'
      ? 'quick-sort'
      : currentAlgorithmId === 'merge-sort'
      ? 'merge-sort'
      : 'bubble-sort';

  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmType>(initialType);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>(() =>
    generateQuizQuestion(initialType)
  );

  // User interaction state
  const [selectedOptionKey, setSelectedOptionKey] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Score stats for practice
  const [scoreStats, setScoreStats] = useState<{ total: number; correct: number }>({
    total: 0,
    correct: 0,
  });

  // Khi người dùng đổi tab thuật toán ở ngoài, đồng bộ theo
  useEffect(() => {
    let t: AlgorithmType = 'bubble-sort';
    if (currentAlgorithmId === 'selection-sort') t = 'selection-sort';
    else if (currentAlgorithmId === 'insertion-sort') t = 'insertion-sort';
    else if (currentAlgorithmId === 'quick-sort') t = 'quick-sort';
    else if (currentAlgorithmId === 'merge-sort') t = 'merge-sort';
    setSelectedAlgo(t);
    handleNewQuestion(t);
  }, [currentAlgorithmId]);

  // Sinh câu hỏi ngẫu nhiên mới
  const handleNewQuestion = (algo: AlgorithmType = selectedAlgo) => {
    const q = generateQuizQuestion(algo);
    setCurrentQuestion(q);
    setSelectedOptionKey(null);
    setShowExplanation(false);
  };

  // Chọn phương án
  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    if (selectedOptionKey !== null) return; // Đã trả lời rồi thì không đổi
    setSelectedOptionKey(key);
    setShowExplanation(true);

    const isCorrect = key === currentQuestion.correctOptionKey;
    setScoreStats((prev) => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }));
  };

  // Sao chép câu hỏi & giải thích chuẩn định dạng file tt.pdf
  const handleCopyFormattedText = () => {
    const text = `${currentQuestion.questionText}\n` +
      `A. ${currentQuestion.options.find((o) => o.key === 'A')?.label}\n` +
      `B. ${currentQuestion.options.find((o) => o.key === 'B')?.label}\n` +
      `C. ${currentQuestion.options.find((o) => o.key === 'C')?.label}\n` +
      `D. ${currentQuestion.options.find((o) => o.key === 'D')?.label}\n` +
      `${currentQuestion.fullExplanation}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAnswered = selectedOptionKey !== null;
  const isCorrectAnswer = selectedOptionKey === currentQuestion.correctOptionKey;

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto p-1">
      {/* Top Banner / Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-base text-slate-900">
                Trắc Nghiệm Kiến Thức Thuật Toán
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động sinh câu hỏi với <strong>dữ liệu 6 - 12 số</strong> và <strong>lượt lặp ngẫu nhiên</strong> kèm lời giải chi tiết.
            </p>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {scoreStats.total > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-slate-500">Đúng:</span>
              <span className="font-bold text-emerald-600">{scoreStats.correct}</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-800 font-semibold">{scoreStats.total}</span>
              <span className="text-[11px] text-slate-500">
                ({Math.round((scoreStats.correct / scoreStats.total) * 100)}%)
              </span>
            </div>
          )}

          <button
            onClick={() => handleNewQuestion()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
            title="Tạo mảng và lượt lặp ngẫu nhiên mới"
          >
            <Sparkles className="w-4 h-4" />
            <span>Câu hỏi ngẫu nhiên mới</span>
          </button>
        </div>
      </div>

      {/* Algorithm Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-xs text-slate-500 font-medium whitespace-nowrap mr-1">
          Thuật toán kiểm tra:
        </span>
        <button
          onClick={() => {
            setSelectedAlgo('bubble-sort');
            handleNewQuestion('bubble-sort');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
            selectedAlgo === 'bubble-sort'
              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          1. Bubble Sort (Nổi bọt)
        </button>
        <button
          onClick={() => {
            setSelectedAlgo('selection-sort');
            handleNewQuestion('selection-sort');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
            selectedAlgo === 'selection-sort'
              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          2. Selection Sort (Chọn)
        </button>
        <button
          onClick={() => {
            setSelectedAlgo('insertion-sort');
            handleNewQuestion('insertion-sort');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
            selectedAlgo === 'insertion-sort'
              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          3. Insertion Sort (Chèn)
        </button>
        <button
          onClick={() => {
            setSelectedAlgo('quick-sort');
            handleNewQuestion('quick-sort');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
            selectedAlgo === 'quick-sort'
              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          4. Quick Sort (Nhanh)
        </button>
        <button
          onClick={() => {
            setSelectedAlgo('merge-sort');
            handleNewQuestion('merge-sort');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
            selectedAlgo === 'merge-sort'
              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          5. Merge Sort (Trộn)
        </button>
      </div>

      {/* Main Question Card (Định dạng như trong tt.pdf) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col gap-5 text-slate-800">
        {/* Question Header & Level Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Thuật toán: {currentQuestion.algorithmName}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  currentQuestion.level === 'Nhận biết'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : currentQuestion.level === 'Thông hiểu'
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : 'bg-purple-50 text-purple-800 border-purple-200'
                }`}
              >
                Mức độ: {currentQuestion.level}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                (Mảng {currentQuestion.originalArray.length} phần tử &bull; Lượt thứ {currentQuestion.passNumber})
              </span>
            </div>

            {/* Nội dung câu hỏi đúng chuẩn file tt.pdf */}
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans tracking-wide leading-relaxed pt-1">
              {currentQuestion.questionText}
            </h3>
          </div>

          {/* Nút Copy câu hỏi & giải thích */}
          <button
            onClick={handleCopyFormattedText}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer transition-colors border border-slate-200 whitespace-nowrap shadow-2xs"
            title="Sao chép nội dung câu hỏi và lời giải định dạng chuẩn đề thi"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép đề'}</span>
          </button>
        </div>

        {/* 4 Phương án A, B, C, D */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedOptionKey === opt.key;
            const isCorrect = opt.isCorrect;

            let cardStyle =
              'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70 text-slate-800';
            let badgeStyle = 'bg-white text-slate-700 border-slate-200';

            if (isAnswered) {
              if (isCorrect) {
                cardStyle =
                  'bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-400 shadow-xs';
                badgeStyle = 'bg-emerald-600 text-white border-emerald-500';
              } else if (isSelected) {
                cardStyle =
                  'bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-400 shadow-xs';
                badgeStyle = 'bg-rose-600 text-white border-rose-500';
              } else {
                cardStyle = 'bg-slate-50/40 border-slate-200 opacity-60 text-slate-400';
              }
            }

            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleSelectOption(opt.key)}
                disabled={isAnswered}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${cardStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono border shadow-2xs ${badgeStyle}`}
                  >
                    {opt.key}
                  </span>
                  <span className="font-mono text-sm sm:text-base font-bold tracking-wider">
                    {opt.label}
                  </span>
                </div>

                {/* Status indicator */}
                {isAnswered && (
                  <div>
                    {isCorrect && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 fill-emerald-600 text-white" />
                        <span className="hidden sm:inline">Đáp án đúng</span>
                      </span>
                    )}
                    {isSelected && !isCorrect && (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-700">
                        <XCircle className="w-4 h-4 fill-rose-600 text-white" />
                        <span className="hidden sm:inline">Chưa chính xác</span>
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Phản hồi nhanh sau khi chọn */}
        {isAnswered && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between flex-wrap gap-2 ${
              isCorrectAnswer
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {isCorrectAnswer ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600" />
              )}
              <span className="text-xs sm:text-sm font-bold">
                {isCorrectAnswer
                  ? '🎉 Hoan hô! Bạn đã trả lời hoàn toàn chính xác!'
                  : `Rất tiếc! Đáp án đúng là ${currentQuestion.correctOptionKey}. Hãy xem phần giải thích bên dưới nhé!`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onLoadArrayToVisualizer && (
                <button
                  type="button"
                  onClick={() => onLoadArrayToVisualizer(currentQuestion.originalArray)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                  title="Nạp mảng này vào Biểu đồ cột để xem mô phỏng từng bước"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Xem trên Biểu đồ</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleNewQuestion()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer transition-all"
              >
                <span>Câu tiếp theo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Khối Giải Thích (Đúng 100% văn phong & cấu trúc file tt.pdf) */}
        {showExplanation && (
          <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>Giải thích chi tiết (Chuẩn đề thi):</span>
              </div>
            </div>

            {/* Đoạn văn giải thích nguyên văn chuẩn tt.pdf */}
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <strong className="text-amber-800 font-semibold">
                Giải thích ({currentQuestion.level}):{' '}
              </strong>
              {currentQuestion.fullExplanation.replace(/^Giải thích \([^)]+\):\s*/, '')}
            </p>

            {/* Bảng tiến trình qua các lượt để học sinh dễ đối chiếu */}
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-600">
                Bảng đối chiếu trạng thái mảng sau từng lượt ngoài (for i):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs flex flex-col gap-0.5 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold">Dãy ban đầu:</span>
                  <span className="font-mono text-slate-900 font-bold">
                    [{currentQuestion.originalArray.join(', ')}]
                  </span>
                </div>

                {currentQuestion.allPassesHistory.map((h) => {
                  const isTargetPass = h.pass === currentQuestion.passNumber;
                  return (
                    <div
                      key={h.pass}
                      className={`p-2 rounded-lg border text-xs flex flex-col gap-0.5 shadow-2xs ${
                        isTargetPass
                          ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold ${
                          isTargetPass ? 'text-emerald-800' : 'text-slate-500'
                        }`}
                      >
                        Sau lượt {h.pass} {isTargetPass ? '⭐ (Đáp án hỏi)' : ''}:
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          isTargetPass ? 'text-emerald-900 font-extrabold' : 'text-slate-800'
                        }`}
                      >
                        [{h.array.join(', ')}]
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thông tin tham khảo */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-500 flex items-center justify-between flex-wrap gap-2 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-sky-600" />
          <span>
            Các câu hỏi được thiết kế chuẩn theo ma trận đề thi trắc nghiệm Chuyên đề Thuật toán Tin học (Nhận biết &bull; Thông hiểu &bull; Vận dụng).
          </span>
        </div>
      </div>
    </div>
  );
};
