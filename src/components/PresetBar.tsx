import React from "react";
import { PresetSample } from "../types";
import { PRESET_SAMPLES } from "../data/presets";
import { ArrowRight, Sparkles, FlaskConical, Utensils, Mic, Receipt, Zap } from "lucide-react";

interface PresetBarProps {
  onSelectPreset: (preset: PresetSample) => void;
}

export const PresetBar: React.FC<PresetBarProps> = ({ onSelectPreset }) => {
  const renderIconBadge = (iconKey: string) => {
    switch (iconKey) {
      case "flask":
        return (
          <span className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200/80 rounded-lg">
            <FlaskConical className="w-4.5 h-4.5" />
          </span>
        );
      case "utensils":
        return (
          <span className="p-1.5 bg-amber-50 text-amber-600 border border-amber-200/80 rounded-lg">
            <Utensils className="w-4.5 h-4.5" />
          </span>
        );
      case "mic":
        return (
          <span className="p-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200/80 rounded-lg">
            <Mic className="w-4.5 h-4.5" />
          </span>
        );
      case "receipt":
        return (
          <span className="p-1.5 bg-teal-50 text-teal-600 border border-teal-200/80 rounded-lg">
            <Receipt className="w-4.5 h-4.5" />
          </span>
        );
      case "zap":
        return (
          <span className="p-1.5 bg-orange-50 text-orange-600 border border-orange-200/80 rounded-lg">
            <Zap className="w-4.5 h-4.5" />
          </span>
        );
      default:
        return (
          <span className="p-1.5 bg-rose-50 text-rose-600 border border-rose-200/80 rounded-lg">
            <Sparkles className="w-4.5 h-4.5" />
          </span>
        );
    }
  };

  return (
    <div className="w-full mb-8">
      {/* Clean paper section header */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="bg-amber-50 text-amber-800 border border-amber-300/80 rounded-full font-semibold text-xs px-3 py-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
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
              className="group text-left bg-white border border-black/15 hover:border-black/30 rounded-xl p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Single clean tag label without per-category color noise */}
                <div className="flex items-center justify-between mb-3 gap-2">
                  {renderIconBadge(preset.icon)}
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-semibold ${
                    isNoteEngine ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60" : "bg-amber-50 text-amber-700 border border-amber-200/60"
                  }`}>
                    {isNoteEngine ? "notes" : "recipe"}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-semibold text-sm text-black group-hover:text-black transition-colors leading-snug">
                  {preset.title}
                </h4>

                {/* Subtitle */}
                <p className="text-xs text-black/60 line-clamp-2 mt-1.5 leading-relaxed">
                  {preset.subtitle}
                </p>
              </div>

              {/* Lower call-to-action */}
              <div className="mt-4 pt-2.5 border-t border-black/10 flex items-center justify-between text-xs font-medium text-black/70 group-hover:text-black transition-colors">
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
