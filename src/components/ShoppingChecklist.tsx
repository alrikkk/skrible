import React, { useState } from "react";
import { CheckSquare, Square, ShoppingCart, Check } from "lucide-react";

interface ShoppingChecklistProps {
  ingredients: string[];
}

export const ShoppingChecklist: React.FC<ShoppingChecklistProps> = ({ ingredients }) => {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const toggleCheck = (index: number) => {
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (!ingredients || ingredients.length === 0) return null;

  return (
    <div className="mt-6 bg-[#FAF8F5] border border-black/15 rounded-2xl p-5 shadow-xs font-sans">
      <div className="flex items-center justify-between mb-4 border-b border-black/10 pb-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[#ec4899]" />
          <h4 className="font-semibold text-sm text-black tracking-tight">
            dorm shopping checklist
          </h4>
        </div>
        <span className="text-xs font-semibold bg-white border border-black/15 px-2.5 py-1 rounded-full">
          {Object.values(checked).filter(Boolean).length} / {ingredients.length} ready
        </span>
      </div>

      <div className="space-y-2">
        {ingredients.map((item, idx) => {
          const isDone = checked[idx];
          return (
            <div
              key={idx}
              onClick={() => toggleCheck(idx)}
              className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                isDone ? "bg-black/5 border-black/10 line-through opacity-60" : "bg-white border-black/15 hover:border-black/30 shadow-2xs"
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                isDone ? "bg-[#ec4899] border-[#ec4899] text-white" : "border-black/30 bg-white"
              }`}>
                {isDone ? <Check className="w-3.5 h-3.5 text-white stroke-[3]" /> : null}
              </div>
              <span className="font-medium text-xs text-black">{item}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
