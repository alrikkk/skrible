import React from "react";
import { PresetSample } from "../types";
import { PRESET_SAMPLES } from "../data/presets";
import { ArrowRight, Sparkles, FlaskConical, Utensils, Mic, Receipt, Zap } from "lucide-react";

interface PresetBarProps {
  onSelectPreset: (preset: PresetSample) => void;
}

export const PresetBar: React.FC<PresetBarProps> = ({ onSelectPreset }) => {
  const renderIcon = (iconKey: string) => {
    switch (iconKey) {
      case "flask":
        return <FlaskConical className="w-5 h-5 text-[#ec4899]" />;
      case "utensils":
        return <Utensils className="w-5 h-5 text-[#ec4899]" />;
      case "mic":
        return <Mic className="w-5 h-5 text-[#ec4899]" />;
      case "receipt":
        return <Receipt className="w-5 h-5 text-[#ec4899]" />;
      case "zap":
        return <Zap className="w-5 h-5 text-[#ec4899]" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#ec4899]" />;
    }
  };

  return (
    <div className="w-full mb-8">
      {/* Clean paper section header */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30 rounded-full font-semibold text-xs px-3 py-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>test scenarios</span>
        </span>
        <span className="text-xs font-medium text-black/50 hidden sm:inline">
          click any sample scenario to auto-fill inputs
        </span>
      </div>

      {/* Preset cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {PRESET_SAMPLES.map((preset) => {
          const isNoteEngine = preset.category === "Note Engine";
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className="group text-left bg-white border border-black/15 hover:border-black/30 rounded-xl p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Single clean tag label without per-category color noise */}
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className="p-1.5 bg-[#ec4899]/10 rounded-lg">{renderIcon(preset.icon)}</span>
                  <span className="text-[10px] font-mono text-black/50 uppercase tracking-wider bg-black/5 px-2 py-0.5 rounded">
                    {isNoteEngine ? "notes" : "recipe"}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-semibold text-sm text-black group-hover:text-[#ec4899] transition-colors leading-snug">
                  {preset.title}
                </h4>

                {/* Subtitle */}
                <p className="text-xs text-black/60 line-clamp-2 mt-1.5 leading-relaxed">
                  {preset.subtitle}
                </p>
              </div>

              {/* Lower call-to-action */}
              <div className="mt-4 pt-2.5 border-t border-black/10 flex items-center justify-between text-xs font-medium text-black/70 group-hover:text-[#ec4899] transition-colors">
                <span>load scenario</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
