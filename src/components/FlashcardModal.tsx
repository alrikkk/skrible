import React, { useState } from "react";
import { Flashcard } from "../types";
import { X, RotateCw, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Layers } from "lucide-react";

interface FlashcardModalProps {
  flashcards: Flashcard[];
  onClose: () => void;
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({ flashcards, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState<Record<number, boolean>>({});

  if (!flashcards || flashcards.length === 0) return null;

  const current = flashcards[currentIndex];

  const handleNext = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const toggleMastered = (index: number) => {
    setMastered((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const masteredCount = Object.values(mastered).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-black/15 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#ec4899]/10 text-[#ec4899] rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-black leading-tight">
                cram flashcards
              </h3>
              <p className="text-xs font-medium text-black/50">
                card {currentIndex + 1} of {flashcards.length} ({masteredCount} mastered)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-black/60 hover:text-black hover:bg-black/5 border border-black/15 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-black/5 rounded-full h-2 mb-5 overflow-hidden">
          <div
            className="bg-[#ec4899] h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
          />
        </div>

        {/* FLASHCARD BODY */}
        <div
          onClick={() => setFlipped(!flipped)}
          className={`min-h-[220px] p-6 border rounded-2xl cursor-pointer flex flex-col justify-between transition-all duration-300 shadow-xs ${
            flipped
              ? "bg-[#ec4899]/10 border-[#ec4899]/30 text-black"
              : "bg-[#FAF8F5] border-black/15 text-black hover:bg-[#FAF8F5]/80"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-xs px-2.5 py-0.5 rounded-full border border-black/15 bg-white text-black/80">
              {current.tag || "CRAM KEY"}
            </span>
            <span className="font-medium text-xs text-black/60 flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5" /> click to flip
            </span>
          </div>

          <div className="my-auto text-center py-4">
            {!flipped ? (
              <div>
                <p className="text-xs font-mono text-black/40 uppercase tracking-wider mb-1">
                  question:
                </p>
                <h4 className="text-lg sm:text-2xl font-bold text-black font-sans leading-snug">
                  {current.question}
                </h4>
              </div>
            ) : (
              <div>
                <p className="text-xs font-mono text-[#ec4899] uppercase tracking-wider mb-1">
                  answer:
                </p>
                <h4 className="text-lg sm:text-2xl font-bold text-black font-sans leading-snug">
                  {current.answer}
                </h4>
              </div>
            )}
          </div>

          <div className="text-center text-xs font-medium text-black/40">
            {flipped ? "tap to see question" : "tap to see answer"}
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center justify-between gap-3 mt-6">
          <button
            onClick={handlePrev}
            className="bg-white hover:bg-black/5 text-black border border-black/15 px-4 py-2.5 rounded-xl font-medium text-xs cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> prev
          </button>

          <button
            onClick={() => toggleMastered(currentIndex)}
            className={`border px-4 py-2.5 rounded-xl font-semibold text-xs cursor-pointer flex items-center gap-1.5 transition-all ${
              mastered[currentIndex]
                ? "bg-[#ec4899] text-white border-[#ec4899]"
                : "bg-white text-black border-black/15 hover:bg-black/5"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {mastered[currentIndex] ? "mastered" : "mark mastered"}
          </button>

          <button
            onClick={handleNext}
            className="bg-black hover:bg-[#ec4899] text-white border border-black px-4 py-2.5 rounded-xl font-semibold text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
          >
            <span>next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
