import React, { useState, useEffect } from "react";
import { Flashcard } from "../types";
import {
  X,
  RotateCw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Shuffle,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FlashcardModalProps {
  flashcards: Flashcard[];
  onClose: () => void;
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({ flashcards: initialFlashcards, onClose }) => {
  const [cards, setCards] = useState<Flashcard[]>(initialFlashcards || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setCards(initialFlashcards || []);
    setCurrentIndex(0);
    setFlipped(false);
  }, [initialFlashcards]);

  if (!cards || cards.length === 0) return null;

  const current = cards[currentIndex];

  const handleNext = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleShuffle = () => {
    setFlipped(false);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
  };

  const toggleMastered = (index: number) => {
    setMastered((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMastered(currentIndex);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, cards.length]);

  const masteredCount = Object.values(mastered).filter(Boolean).length;
  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        {/* Backdrop click dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-[#1f1f1f] text-black dark:text-white border-2 border-black dark:border-white/20 rounded-2xl w-full max-w-xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] relative z-10 font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#ec4899]/10 text-[#ec4899] rounded-xl border border-[#ec4899]/20">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-black dark:text-white leading-tight flex items-center gap-1.5">
                  <span>cram flashcards</span>
                  <span className="text-[10px] font-mono uppercase bg-[#ec4899]/15 text-[#ec4899] font-bold px-2 py-0.5 rounded-full">
                    active study
                  </span>
                </h3>
                <p className="text-xs font-medium text-black/50 dark:text-white/50">
                  card {currentIndex + 1} of {cards.length} • {masteredCount} mastered
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShuffle}
                className="p-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 border border-black/15 dark:border-white/20 rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                title="Shuffle card order"
                aria-label="Shuffle cards"
              >
                <Shuffle className="w-4 h-4 text-[#ec4899]" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 border border-black/15 dark:border-white/20 rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                title="Close flashcards (Esc)"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar with animated fill */}
          <div className="w-full bg-black/5 dark:bg-white/10 rounded-full h-2 mb-5 overflow-hidden">
            <motion.div
              className="bg-[#ec4899] h-full rounded-full"
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>

          {/* 3D PERSPECTIVE FLASHCARD BODY */}
          <div
            className="w-full min-h-[240px] [perspective:1200px] cursor-pointer select-none"
            onClick={() => setFlipped(!flipped)}
          >
            <motion.div
              className="w-full h-full min-h-[240px] rounded-2xl relative [transform-style:preserve-3d] transition-shadow"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* FRONT: QUESTION */}
              <div
                className={`absolute inset-0 p-6 rounded-2xl border-2 border-black/15 dark:border-white/20 flex flex-col justify-between [backface-visibility:hidden] shadow-sm hover:shadow-md transition-colors ${
                  mastered[currentIndex]
                    ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-400"
                    : "bg-[#FAF8F5] dark:bg-[#252525]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-black/15 dark:border-white/20 bg-white dark:bg-[#1a1a1a] text-black dark:text-white shadow-2xs">
                    {current.tag || "CRAM KEY"}
                  </span>
                  <span className="font-semibold text-xs text-black/60 dark:text-white/60 flex items-center gap-1.5 hover:text-[#ec4899] transition-colors">
                    <RotateCw className="w-3.5 h-3.5 text-[#ec4899]" />
                    <span>tap to flip</span>
                  </span>
                </div>

                <div className="my-auto text-center py-4 px-2">
                  <p className="text-[11px] font-mono text-black/40 dark:text-white/40 uppercase tracking-widest mb-1.5 font-bold">
                    question
                  </p>
                  <h4 className="text-lg sm:text-xl font-bold text-black dark:text-white font-sans leading-snug">
                    {current.question}
                  </h4>
                </div>

                <div className="flex items-center justify-between text-[11px] text-black/40 dark:text-white/40 pt-2 border-t border-black/5 dark:border-white/5">
                  <span className="font-mono">Shortcuts: Space to flip • ← / → navigate</span>
                  <span className="font-semibold text-[#ec4899]">Reveal answer →</span>
                </div>
              </div>

              {/* BACK: ANSWER */}
              <div
                className="absolute inset-0 p-6 rounded-2xl border-2 border-[#ec4899]/40 bg-[#ec4899]/10 dark:bg-[#ec4899]/15 text-black dark:text-white flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-[#ec4899] text-white shadow-2xs">
                    ANSWER
                  </span>
                  <span className="font-semibold text-xs text-black/60 dark:text-white/60 flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-[#ec4899]" />
                    <span>tap to flip back</span>
                  </span>
                </div>

                <div className="my-auto text-center py-4 px-2">
                  <p className="text-[11px] font-mono text-[#ec4899] uppercase tracking-widest mb-1.5 font-bold">
                    untangled takeaway
                  </p>
                  <h4 className="text-base sm:text-lg font-semibold text-black dark:text-white leading-relaxed">
                    {current.answer}
                  </h4>
                </div>

                <div className="flex items-center justify-between text-[11px] text-black/50 dark:text-white/50 pt-2 border-t border-[#ec4899]/20">
                  <span className="font-mono">Press 'M' to mark mastered</span>
                  <span className="font-semibold text-[#ec4899]">← Back to question</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* CONTROLS */}
          <div className="flex items-center justify-between gap-3 mt-6 pt-2 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={handlePrev}
              className="bg-white dark:bg-[#2a2a2a] hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white border border-black/15 dark:border-white/20 px-4 py-2.5 rounded-xl font-medium text-xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs hover:border-[#ec4899]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>prev</span>
            </button>

            <button
              type="button"
              onClick={() => toggleMastered(currentIndex)}
              className={`border px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs ${
                mastered[currentIndex]
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white dark:bg-[#2a2a2a] text-black dark:text-white border-black/15 dark:border-white/20 hover:border-emerald-500"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{mastered[currentIndex] ? "mastered" : "mark mastered"}</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="bg-black dark:bg-[#333333] hover:bg-[#ec4899] dark:hover:bg-[#ec4899] text-white border border-black dark:border-white/20 px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <span>next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

