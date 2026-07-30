import React from "react";
import { History, RefreshCw } from "lucide-react";

interface HeaderProps {
  historyCount: number;
  onOpenHistory: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  historyCount,
  onOpenHistory,
  onReset,
}) => {
  return (
    <header className="w-full bg-[#FFE600] border-b-4 border-black p-3 sm:p-5 mb-6 shadow-[0px_5px_0px_0px_rgba(0,0,0,1)]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        
        {/* Brand Title & Subtitle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="inline-block">
              <button
                onClick={onReset}
                className="border-3 border-black bg-[#FF90E8] px-3.5 py-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center rotate-[-2deg] hover:rotate-1 hover:scale-105 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all duration-200 cursor-pointer"
                title="Reset to home"
              >
                <svg viewBox="0 0 250 52" className="w-32 sm:w-40 h-7 sm:h-9 overflow-visible" aria-label="SKRIBLE">
                  <defs>
                    <clipPath id="skribleTextClip">
                      <text
                        x="125"
                        y="38"
                        textAnchor="middle"
                        fontFamily="'Arial Black', 'Impact', sans-serif"
                        fontSize="40"
                        fontWeight="900"
                        letterSpacing="3px"
                      >
                        SKRIBLE
                      </text>
                    </clipPath>
                    <pattern id="sparsePenScribble" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
                      <line x1="2" y1="5" x2="18" y2="5" stroke="#000000" strokeWidth="1.2" opacity="0.35" strokeDasharray="3 3 6 2" />
                      <line x1="0" y1="14" x2="20" y2="14" stroke="#000000" strokeWidth="1.0" opacity="0.25" strokeDasharray="4 2 2 4" />
                    </pattern>
                  </defs>

                  {/* Outer thick black border outline */}
                  <text
                    x="125"
                    y="38"
                    textAnchor="middle"
                    fontFamily="'Arial Black', 'Impact', sans-serif"
                    fontSize="40"
                    fontWeight="900"
                    letterSpacing="3px"
                    fill="#000000"
                    stroke="#000000"
                    strokeWidth="10"
                    strokeLinejoin="miter"
                    strokeLinecap="square"
                  >
                    SKRIBLE
                  </text>

                  {/* Chunky solid white letter core */}
                  <text
                    x="125"
                    y="38"
                    textAnchor="middle"
                    fontFamily="'Arial Black', 'Impact', sans-serif"
                    fontSize="40"
                    fontWeight="900"
                    letterSpacing="3px"
                    fill="#FFFFFF"
                    stroke="none"
                  >
                    SKRIBLE
                  </text>

                  {/* Minimal, sparse black pen sketch lines overlay */}
                  <rect
                    x="0"
                    y="0"
                    width="250"
                    height="52"
                    fill="url(#sparsePenScribble)"
                    clipPath="url(#skribleTextClip)"
                    pointerEvents="none"
                  />

                  {/* Inner subtle pen accent strokes for cartoon hand-drawn feel */}
                  <text
                    x="125"
                    y="38"
                    textAnchor="middle"
                    fontFamily="'Arial Black', 'Impact', sans-serif"
                    fontSize="40"
                    fontWeight="900"
                    letterSpacing="3px"
                    fill="none"
                    stroke="#000000"
                    strokeWidth="1.5"
                    strokeDasharray="12 8 4 6"
                    clipPath="url(#skribleTextClip)"
                    opacity="0.6"
                  >
                    SKRIBLE
                  </text>
                </svg>
              </button>
            </h1>

            {/* Bright Cyan Badge v3.6 AI */}
            <span className="bg-[#00F5FF] border-3 border-black text-black font-black text-xs px-2.5 py-1 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider inline-flex items-center hover:rotate-6 hover:scale-105 transition-all duration-200 cursor-default select-none shrink-0">
              v3.6 AI
            </span>
          </div>

          <p className="text-xs font-black text-black leading-tight uppercase tracking-tight">
            UNTANGLE MESSY LECTURES, LATE-NIGHT VOICEMAILS & FRIDGE SURVIVAL MEALS
          </p>
        </div>

        {/* Right side interactive action blocks */}
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-stretch md:justify-end">
          <button
            onClick={onReset}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-white hover:bg-amber-100 text-black border-3 border-black px-3.5 py-1.5 sm:px-4 sm:py-2 font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer uppercase"
            title="Clear all inputs"
          >
            <RefreshCw className="w-3.5 h-3.5 stroke-[3]" />
            CLEAR
          </button>

          <button
            onClick={onOpenHistory}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-[#00F5FF] hover:bg-[#00d8e6] text-black border-3 border-black px-3.5 py-1.5 sm:px-4 sm:py-2 font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer uppercase shrink-0"
          >
            <History className="w-3.5 h-3.5 stroke-[3]" />
            SAVED VAULT ({historyCount})
          </button>
        </div>

      </div>
    </header>
  );
};
