import React from "react";
import { PresetSample } from "../types";
import { PRESET_SAMPLES } from "../data/presets";
import { Sparkles, ArrowRight } from "lucide-react";

interface PresetBarProps {
  onSelectPreset: (preset: PresetSample) => void;
}

export const PresetBar: React.FC<PresetBarProps> = ({ onSelectPreset }) => {
  return (
    <div className="w-full mb-8">
      {/* High-contrast orange-red badge */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="bg-[#FF4500] text-white font-black text-xs px-3 py-1.5 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider flex items-center gap-1">
          ⚡️ 1-CLICK TEST PRESETS
        </span>
        <span className="text-xs font-black text-black uppercase tracking-tight hidden sm:inline">
          SELECT A STUDENT SCENARIO TO TEST
        </span>
      </div>

      {/* Structural dashboard matrix:
          - Smartphone (< 768px): single column grid-cols-1
          - Medium/Computer (>= 768px): double column / 5-col grid matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {PRESET_SAMPLES.map((preset) => {
          const isNoteEngine = preset.category === "Note Engine";
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className="group relative text-left bg-white border-4 border-black p-3.5 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:bg-[#FFF4E0] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Upper right status chip: alternating high-visibility magenta & emerald green */}
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className="text-2xl leading-none">{preset.icon}</span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 border-2 border-black uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] ${
                      isNoteEngine
                        ? "bg-[#FF90E8] text-black"
                        : "bg-[#00FF66] text-black"
                    }`}
                  >
                    {isNoteEngine ? "NOTE ENGINE" : "DORM CHEF"}
                  </span>
                </div>

                {/* Distinct bold underlined header */}
                <h4 className="font-black text-xs sm:text-sm text-black uppercase underline decoration-2 underline-offset-2 leading-tight group-hover:text-black">
                  {preset.title}
                </h4>

                {/* Secondary paragraph text layer */}
                <p className="text-[11px] font-bold text-gray-800 line-clamp-2 mt-2 leading-snug">
                  {preset.subtitle}
                </p>
              </div>

              {/* Lower call-to-action bar ending in a crisp directional vector arrow */}
              <div className="mt-4 pt-2.5 border-t-3 border-black flex items-center justify-between text-[11px] font-black uppercase text-black">
                <span>LOAD PRESET</span>
                <ArrowRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform text-black" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
