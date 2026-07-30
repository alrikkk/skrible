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
    <div className="mt-6 bg-[#B5FFD9] border-4 border-black p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] font-sans">
      <div className="flex items-center justify-between mb-4 border-b-4 border-black pb-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-black stroke-[3]" />
          <h4 className="font-black text-sm uppercase text-black tracking-tight">
            🛒 INTERACTIVE DORM SHOPPING CHECKLIST
          </h4>
        </div>
        <span className="text-xs font-black bg-white border-2 border-black px-2.5 py-1 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {Object.values(checked).filter(Boolean).length} / {ingredients.length} READY
        </span>
      </div>

      <div className="space-y-2.5">
        {ingredients.map((item, idx) => {
          const isDone = checked[idx];
          return (
            <div
              key={idx}
              onClick={() => toggleCheck(idx)}
              className={`flex items-center gap-3 p-2.5 border-3 border-black cursor-pointer transition-all ${
                isDone ? "bg-white/50 line-through opacity-70" : "bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center bg-white border-2 border-black text-black font-black">
                {isDone ? <Check className="w-4 h-4 text-black stroke-[4]" /> : null}
              </div>
              <span className="font-black text-xs uppercase text-black">{item}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
