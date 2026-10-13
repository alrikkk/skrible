import React, { useState, useEffect } from "react";
import {
  X,
  Brain,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCw,
  Sparkles,
  Award,
  ChevronRight,
  Flame,
  Copy,
  Check,
  BookOpen,
  Utensils,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QuizData, QuizQuestion } from "../types";

interface QuizModalProps {
  isOpen: boolean;
  quizData: QuizData | null;
  isLoading?: boolean;
  onClose: () => void;
  onRetake?: () => void;
  isDark?: boolean;
  routeDetected?: "notes" | "chef";
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  quizData,
  isLoading = false,
  onClose,
  onRetake,
  isDark = false,
  routeDetected = "notes",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset when new quiz loaded
  useEffect(() => {
    if (quizData && quizData.questions && quizData.questions.length > 0) {
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setUserAnswers({});
      setScore(0);
      setStreak(0);
      setBestStreak(0);
      setShowHint(false);
      setIsCompleted(false);
    }
  }, [quizData]);

  if (!isOpen) return null;

  const questions = quizData?.questions || [];
  const currentQ: QuizQuestion | undefined = questions[currentIndex];
  const total = questions.length;

  const handleSelectOption = (optIndex: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(optIndex);
    setIsAnswerSubmitted(true);

    const isCorrect = optIndex === currentQ?.correctIndex;
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: optIndex }));

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setStreak((prev) => {
        const next = prev + 1;
        if (next > bestStreak) setBestStreak(next);
        return next;
      });
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < total) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setShowHint(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setUserAnswers({});
    setScore(0);
    setStreak(0);
    setShowHint(false);
    setIsCompleted(false);
    if (onRetake) onRetake();
  };

  const handleCopyStudySheet = () => {
    if (!quizData) return;
    let text = `# ${quizData.quizTitle || "Untangled Knowledge Check"}\n\n`;
    questions.forEach((q, idx) => {
      text += `### Question ${idx + 1}: ${q.question}\n`;
      q.options.forEach((opt, oIdx) => {
        const isCor = oIdx === q.correctIndex;
        text += `- [${isCor ? "x" : " "}] ${opt} ${isCor ? "✓ (Correct)" : ""}\n`;
      });
      text += `\n**Explanation:** ${q.explanation}\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Keyboard shortcut listener for options (1-4) and Next (Enter / Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || isLoading || isCompleted) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (!isAnswerSubmitted) {
        if (["1", "2", "3", "4"].includes(e.key)) {
          const index = parseInt(e.key, 10) - 1;
          if (currentQ && index < currentQ.options.length) {
            handleSelectOption(index);
          }
        }
      } else {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, isCompleted, isAnswerSubmitted, currentQ]);

  // Rank determination
  const scorePercent = total > 0 ? Math.round((score / total) * 100) : 0;
  let rankBadge = "Academic Weapon ⚔️";
  let rankSub = "Master of lecture chaos & instant recall!";
  if (routeDetected === "chef") {
    if (scorePercent === 100) {
      rankBadge = "Dorm Michelin Chef 🍳";
      rankSub = "Ready to survive finals with five-star microwave budget cuisine!";
    } else if (scorePercent >= 60) {
      rankBadge = "Budget Kitchen Wizard 🥪";
      rankSub = "You know how to stretch ramen and untangle leftover groceries!";
    } else {
      rankBadge = "Hungry Dorm Apprentice 🍜";
      rankSub = "Review the recipe steps to avoid burnt pans & sodium overload!";
    }
  } else {
    if (scorePercent === 100) {
      rankBadge = "Academic Weapon ⚔️";
      rankSub = "Flawless mastery! Straight A energy on lock.";
    } else if (scorePercent >= 75) {
      rankBadge = "Untangled Scholar 🎓";
      rankSub = "Exam ready! You've conquered the primary key concepts.";
    } else if (scorePercent >= 50) {
      rankBadge = "Midterm Survivor ☕";
      rankSub = "Solid recall, but review the explanations on the questions you missed.";
    } else {
      rankBadge = "Chaotic Note Goblin 🧠";
      rankSub = "Take 5 minutes to re-read your untangled summary, then try again!";
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="relative w-full max-w-2xl bg-[#FFFDF9] dark:bg-[#18181B] border-3 border-black dark:border-white/20 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.15)] overflow-hidden my-auto"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black dark:border-white/10 bg-[#FFE600] dark:bg-[#27272A] text-black dark:text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black shadow-2xs">
              <Brain className="w-4 h-4 text-[#FFE600] dark:text-amber-500" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-none uppercase">
                {quizData?.quizTitle || "Untangled Knowledge Check"}
              </h2>
              <p className="text-[11px] font-semibold opacity-75 mt-0.5">
                {routeDetected === "chef" ? "Dorm Cooking & Recipe Recall Quiz" : "Self-Testing Practice Exam"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {streak >= 2 && !isCompleted && !isLoading && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2.5 py-1 bg-rose-500 text-white rounded-full text-xs font-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-200 animate-pulse" />
                <span>{streak}x Streak</span>
              </motion.div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white dark:bg-[#18181B] text-black dark:text-white border-2 border-black dark:border-white/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              title="Close Quiz"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoading && (
          <div className="p-10 sm:p-14 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#FFE600] border-3 border-black dark:border-white flex items-center justify-center mb-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
              <Brain className="w-8 h-8 text-black stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-black text-black dark:text-white mb-2">
              Generating Custom Knowledge Quiz...
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-sm">
              Analyzing your untangled notes and extracting high-yield exam questions, practical steps, and concept challenges.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-mono text-neutral-500">
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>Drafting multiple-choice options & explanations...</span>
            </div>
          </div>
        )}

        {/* EMPTY / ERROR STATE */}
        {!isLoading && (!questions || questions.length === 0) && (
          <div className="p-8 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              No questions could be generated. Make sure your untangled note has sufficient lecture or recipe content.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Back to Notes
            </button>
          </div>
        )}

        {/* ACTIVE QUIZ QUESTION SCREEN */}
        {!isLoading && questions.length > 0 && !isCompleted && currentQ && (
          <div className="p-5 sm:p-7">
            {/* Progress Bar & Header Info */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                <span className="flex items-center gap-1.5 font-mono">
                  Question <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{currentIndex + 1}</span> of {total}
                </span>

                <div className="flex items-center gap-2">
                  {currentQ.difficulty && (
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-black dark:border-white/20 ${
                        currentQ.difficulty === "Easy"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : currentQ.difficulty === "Hard"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {currentQ.difficulty}
                    </span>
                  )}

                  <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                    Score: {score}
                  </span>
                </div>
              </div>

              {/* Gradient Progress Meter */}
              <div className="w-full h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden border border-black/20 dark:border-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#FFE600] via-[#FF90E8] to-[#00F5FF]"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIndex + 1) / total) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Question Text Prompt */}
            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#202024] border-2 border-black dark:border-white/15 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] mb-5">
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                {currentQ.question}
              </h3>
            </div>

            {/* Hint Drawer Toggle */}
            {currentQ.hint && !isAnswerSubmitted && (
              <div className="mb-4">
                {!showHint ? (
                  <button
                    onClick={() => setShowHint(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Need a hint? Click here</span>
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Hint:</strong> {currentQ.hint}</span>
                  </motion.div>
                )}
              </div>
            )}

            {/* 4 Interactive Choice Buttons */}
            <div className="grid grid-cols-1 gap-2.5 mb-5">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = selectedOption === oIdx;
                const isCorrect = oIdx === currentQ.correctIndex;

                let btnStyles = "bg-white dark:bg-[#242428] text-neutral-900 dark:text-neutral-100 border-black dark:border-white/20 hover:border-black hover:bg-neutral-50 dark:hover:bg-neutral-800";
                let badgeText = String.fromCharCode(65 + oIdx);
                let badgeColor = "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300";

                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    btnStyles = "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 border-emerald-600 dark:border-emerald-500 shadow-[3px_3px_0px_0px_rgba(5,150,105,1)]";
                    badgeColor = "bg-emerald-600 text-white";
                  } else if (isSelected) {
                    btnStyles = "bg-rose-100 dark:bg-rose-950/80 text-rose-950 dark:text-rose-100 border-rose-600 dark:border-rose-500 shadow-[3px_3px_0px_0px_rgba(225,29,72,1)]";
                    badgeColor = "bg-rose-600 text-white";
                  } else {
                    btnStyles = "bg-neutral-50 dark:bg-neutral-900/40 text-neutral-400 dark:text-neutral-500 border-neutral-300 dark:border-neutral-800 opacity-60";
                  }
                }

                return (
                  <motion.button
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    disabled={isAnswerSubmitted}
                    whileHover={!isAnswerSubmitted ? { scale: 1.01 } : undefined}
                    whileTap={!isAnswerSubmitted ? { scale: 0.99 } : undefined}
                    className={`p-3.5 rounded-xl border-2 text-left font-medium text-xs sm:text-sm flex items-center justify-between gap-3 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.08)] ${btnStyles}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 border border-black/20 ${badgeColor}`}>
                        {badgeText}
                      </span>
                      <span className="leading-snug">{opt}</span>
                    </div>

                    {isAnswerSubmitted && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                    {isAnswerSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Post-Answer Explanation Box */}
            <AnimatePresence>
              {isAnswerSubmitted && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: 8 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-4 rounded-xl border-2 mb-5 ${
                    selectedOption === currentQ.correctIndex
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-950 dark:text-rose-200"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {selectedOption === currentQ.correctIndex ? (
                      <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <HelpCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="text-xs sm:text-sm leading-relaxed">
                      <p className="font-bold mb-1">
                        {selectedOption === currentQ.correctIndex ? "🎉 Spot on!" : "💡 Not quite:"}
                      </p>
                      <p>{currentQ.explanation}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Navigation Toolbar */}
            <div className="flex items-center justify-between pt-2 border-t border-black/10 dark:border-white/10">
              <span className="text-[11px] font-mono text-neutral-500">
                {!isAnswerSubmitted ? "Press 1, 2, 3, or 4 to choose" : "Press Enter for next question"}
              </span>

              {isAnswerSubmitted && (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider rounded-xl border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                >
                  <span>{currentIndex + 1 < total ? "Next Question" : "See Results"}</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* RESULTS & REPORT CARD SCREEN */}
        {!isLoading && isCompleted && (
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="w-20 h-20 mx-auto rounded-3xl bg-[#FFE600] border-3 border-black dark:border-white/40 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-3"
              >
                <Award className="w-10 h-10 text-black stroke-[2.5]" />
              </motion.div>

              <span className="inline-block px-3 py-1 bg-black text-white dark:bg-white dark:text-black text-xs font-black uppercase tracking-wider rounded-full mb-2">
                {rankBadge}
              </span>

              <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                {score} / {total} Correct ({scorePercent}%)
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                {rankSub}
              </p>
            </div>

            {/* Scorecard Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-white dark:bg-[#202024] border-2 border-black dark:border-white/15 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="block text-[10px] font-bold uppercase text-neutral-500">Correct</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{score}</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#202024] border-2 border-black dark:border-white/15 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="block text-[10px] font-bold uppercase text-neutral-500">Missed</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400">{total - score}</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#202024] border-2 border-black dark:border-white/15 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="block text-[10px] font-bold uppercase text-neutral-500">Best Streak</span>
                <span className="text-lg font-black text-amber-500 flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 fill-amber-400 inline" />
                  {bestStreak}
                </span>
              </div>
            </div>

            {/* Question Breakdown Accordion */}
            <div className="mb-6 max-h-56 overflow-y-auto space-y-2 pr-1">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 block mb-2">
                Detailed Review
              </span>

              {questions.map((q, idx) => {
                const chosen = userAnswers[idx];
                const isCor = chosen === q.correctIndex;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs ${
                      isCor
                        ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                        : "bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {idx + 1}. {q.question}
                      </span>
                      {isCor ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      <strong>Correct Answer:</strong> {q.options[q.correctIndex]}
                    </p>
                    {!isCor && chosen !== undefined && (
                      <p className="text-rose-700 dark:text-rose-300 mt-0.5">
                        <strong>You selected:</strong> {q.options[chosen]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-black/10 dark:border-white/10">
              <button
                onClick={handleCopyStudySheet}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 bg-white dark:bg-[#27272A] border-2 border-black dark:border-white/20 rounded-xl hover:bg-neutral-100 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied Study Sheet!" : "Copy Quiz as Markdown"}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleRestart}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#FFE600] text-black border-2 border-black rounded-xl hover:bg-amber-300 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95"
                >
                  <RotateCw className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Retry Quiz</span>
                </button>

                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white rounded-xl transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
