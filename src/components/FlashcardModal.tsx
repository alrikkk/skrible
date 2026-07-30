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
      <div className="bg-white border-4 border-black w-full max-w-xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-black pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#FF90E8] border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Layers className="w-5 h-5 text-black stroke-[3]" />
            </div>
            <div>
              <h3 className="font-black text-lg text-black uppercase leading-none tracking-tight">
                AI CRAM FLASHCARDS
              </h3>
              <p className="text-xs font-black text-black uppercase mt-1">
                Card {currentIndex + 1} of {flashcards.length} ({masteredCount} Mastered)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="bg-[#FF90E8] text-black border-3 border-black p-1.5 hover:bg-pink-300 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white border-3 border-black h-4 mb-5 overflow-hidden p-0.5">
          <div
            className="bg-[#B5FFD9] h-full transition-all duration-300 border-r-2 border-black"
            style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
          />
        </div>

        {/* FLASHCARD BODY */}
        <div
          onClick={() => setFlipped(!flipped)}
          className={`min-h-[220px] p-6 border-4 border-black cursor-pointer flex flex-col justify-between transition-all duration-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
            flipped
              ? "bg-[#00F5FF] text-black"
              : "bg-[#FFF4E0] text-black hover:bg-amber-100"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-black text-xs uppercase px-2 py-0.5 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {current.tag || "CRAM KEY"}
            </span>
            <span className="font-black text-xs text-black uppercase flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5 stroke-[3]" /> CLICK TO FLIP
            </span>
          </div>

          <div className="my-auto text-center py-4">
            {!flipped ? (
              <div>
                <p className="text-xs font-black text-black uppercase tracking-wider mb-1">
                  QUESTION:
                </p>
                <h4 className="text-lg sm:text-2xl font-black text-black font-sans leading-snug uppercase">
                  {current.question}
                </h4>
              </div>
            ) : (
              <div>
                <p className="text-xs font-black text-black uppercase tracking-wider mb-1">
                  ANSWER:
                </p>
                <h4 className="text-lg sm:text-2xl font-black text-black font-sans leading-snug uppercase">
                  {current.answer}
                </h4>
              </div>
            )}
          </div>

          <div className="text-center text-[11px] font-black text-black uppercase">
            {flipped ? "Tap to see Question" : "Tap to see Answer"}
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center justify-between gap-3 mt-6">
          <button
            onClick={handlePrev}
            className="bg-white hover:bg-amber-100 text-black border-3 border-black p-3 font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center gap-1 active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            <ChevronLeft className="w-4 h-4 stroke-[3]" /> PREV
          </button>

          <button
            onClick={() => toggleMastered(currentIndex)}
            className={`border-3 border-black px-4 py-3 font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center gap-1.5 active:translate-x-1 active:translate-y-1 active:shadow-none ${
              mastered[currentIndex]
                ? "bg-[#B5FFD9] text-black"
                : "bg-white text-black hover:bg-amber-100"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 stroke-[3]" />
            {mastered[currentIndex] ? "MASTERED ✓" : "MARK MASTERED"}
          </button>

          <button
            onClick={handleNext}
            className="bg-[#FF90E8] hover:bg-pink-300 text-black border-3 border-black p-3 font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center gap-1 active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            NEXT <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

      </div>
    </div>
  );
};
