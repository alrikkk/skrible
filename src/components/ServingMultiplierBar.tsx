import React from "react";
import { motion } from "motion/react";
import { Users, Minus, Plus, RotateCcw, Sparkles, Flame } from "lucide-react";

interface ServingMultiplierBarProps {
  baseServings: number;
  currentServings: number;
  multiplier: number;
  onServingsChange: (servings: number) => void;
  onMultiplierChange: (mult: number) => void;
  onReset: () => void;
  className?: string;
  compact?: boolean;
  nutritionSummary?: {
    caloriesPerServing: number;
    proteinGrams: number;
    carbsGrams?: number;
    fatGrams?: number;
  };
}

const PRESET_MULTIPLIERS = [
  { label: "0.5x", value: 0.5, desc: "Half portion" },
  { label: "1x", value: 1.0, desc: "Original yield" },
  { label: "2x", value: 2.0, desc: "Double portion" },
  { label: "3x", value: 3.0, desc: "Triple batch" },
  { label: "4x", value: 4.0, desc: "Meal prep / 4 portions" },
];

export const ServingMultiplierBar: React.FC<ServingMultiplierBarProps> = ({
  baseServings,
  currentServings,
  multiplier,
  onServingsChange,
  onMultiplierChange,
  onReset,
  className = "",
  compact = false,
  nutritionSummary,
}) => {
  const isModified = Math.abs(multiplier - 1) > 0.01;

  const handleDecrement = () => {
    if (currentServings <= 1) {
      if (currentServings > 0.5) {
        onServingsChange(0.5);
      }
    } else {
      onServingsChange(Math.max(1, currentServings - 1));
    }
  };

  const handleIncrement = () => {
    if (currentServings === 0.5) {
      onServingsChange(1);
    } else {
      onServingsChange(Math.min(24, currentServings + 1));
    }
  };

  return (
    <div
      className={`bg-[#FAF8F5] border border-black/15 rounded-2xl p-3.5 sm:p-4 shadow-2xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Title & Base Serving Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-black tracking-tight">
                Serving Size & Quantities
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/5 text-black/70 border border-black/10">
                Original: {baseServings} {baseServings === 1 ? "serving" : "servings"}
              </span>
              {isModified && (
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-[#ec4899]/15 text-[#ec4899] border border-[#ec4899]/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {multiplier}x Recalculated
                </span>
              )}
              {nutritionSummary && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300/80 flex items-center gap-1 font-semibold">
                  <Flame className="w-2.5 h-2.5 text-orange-500" />
                  ~{nutritionSummary.caloriesPerServing} kcal • {nutritionSummary.proteinGrams}g P / serving
                </span>
              )}
            </div>
            <p className="text-[11px] text-black/60 font-medium mt-0.5">
              Adjust servings to automatically recalculate all ingredient measurements & grocery items.
            </p>
          </div>
        </div>

        {/* Right: Stepper & Reset */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Stepper */}
          <div className="flex items-center bg-white border border-black/20 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={currentServings <= 0.5}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-black hover:bg-black/5 active:bg-black/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Decrease servings"
              aria-label="Decrease servings"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <div className="px-2.5 py-0.5 min-w-[76px] text-center">
              <span className="font-mono font-bold text-sm text-black block leading-tight">
                {currentServings}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-black/50 font-semibold block leading-none">
                {currentServings === 1 ? "serving" : "servings"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleIncrement}
              disabled={currentServings >= 24}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-black hover:bg-black/5 active:bg-black/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Increase servings"
              aria-label="Increase servings"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reset button if modified */}
          {isModified && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 text-[11px] font-semibold text-black/70 hover:text-black bg-white hover:bg-black/5 border border-black/15 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Reset to original yield"
            >
              <RotateCcw className="w-3 h-3 text-black/60" />
              <span>Reset</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Preset Multiplier Chips */}
      {!compact && (
        <div className="mt-3 pt-2.5 border-t border-black/10 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-black/50">Quick Scale:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_MULTIPLIERS.map((preset) => {
              const isSelected = Math.abs(multiplier - preset.value) < 0.05;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onMultiplierChange(preset.value)}
                  className={`text-xs px-2.5 py-1 rounded-xl border transition-all cursor-pointer font-medium flex items-center gap-1 ${
                    isSelected
                      ? "bg-black text-white border-black font-bold shadow-2xs"
                      : "bg-white text-black/80 border-black/15 hover:border-black/30 hover:bg-black/5"
                  }`}
                  title={preset.desc}
                >
                  <span>{preset.label}</span>
                  {preset.value === 1.0 && (
                    <span className="text-[9px] opacity-70 font-normal">orig</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
