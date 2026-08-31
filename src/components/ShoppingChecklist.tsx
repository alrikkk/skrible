import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Square,
  ShoppingCart,
  Check,
  Copy,
  Plus,
  RotateCcw,
  ListFilter,
  CheckCheck,
  Sparkles,
} from "lucide-react";

interface ShoppingChecklistProps {
  ingredients: string[];
}

export const ShoppingChecklist: React.FC<ShoppingChecklistProps> = ({ ingredients: initialIngredients }) => {
  const [items, setItems] = useState<string[]>([]);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [filter, setFilter] = useState<"all" | "missing" | "ready">("all");
  const [newItemText, setNewItemText] = useState("");
  const [copiedMissing, setCopiedMissing] = useState(false);

  // Sync with prop when ingredients change
  useEffect(() => {
    setItems(initialIngredients);
    setChecked({});
  }, [initialIngredients]);

  const toggleCheck = (index: number) => {
    setChecked((prev) => {
      const next = { ...prev, [index]: !prev[index] };
      // Haptic feedback
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(25);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    const allChecked = items.length > 0 && items.every((_, idx) => checked[idx]);
    const newCheckedState: Record<number, boolean> = {};
    if (!allChecked) {
      items.forEach((_, idx) => {
        newCheckedState[idx] = true;
      });
    }
    setChecked(newCheckedState);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newItemText.trim();
    if (!clean) return;
    setItems((prev) => [...prev, clean]);
    setNewItemText("");
  };

  const handleCopyMissing = () => {
    const missing = items.filter((_, idx) => !checked[idx]);
    const textToCopy = missing.length > 0
      ? `🛒 Shopping List (${missing.length} items needed):\n` + missing.map((item) => `- [ ] ${item}`).join("\n")
      : "All ingredients are ready in the pantry!";

    navigator.clipboard.writeText(textToCopy);
    setCopiedMissing(true);
    setTimeout(() => setCopiedMissing(false), 2000);
  };

  if (!items || items.length === 0) return null;

  const totalCount = items.length;
  const readyCount = Object.entries(checked).filter(([k, v]) => v && Number(k) < items.length).length;
  const missingCount = totalCount - readyCount;
  const progressPercent = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  const visibleItems = items
    .map((item, idx) => ({ item, idx, isDone: Boolean(checked[idx]) }))
    .filter(({ isDone }) => {
      if (filter === "ready") return isDone;
      if (filter === "missing") return !isDone;
      return true;
    });

  return (
    <div className="mt-6 bg-[#FAF8F5] border border-black/15 rounded-2xl p-5 sm:p-6 shadow-xs font-sans">
      {/* Header with Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-black tracking-tight flex items-center gap-1.5">
              <span>dorm ingredients checklist</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-black/5 text-black/60 border border-black/10">
                interactive
              </span>
            </h4>
            <p className="text-xs text-black/60 font-medium">
              Check off what you have in your dorm; copy the rest to buy.
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold bg-white border border-black/15 px-3 py-1 rounded-full shadow-2xs">
            {readyCount} / {totalCount} ready ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-black/5 rounded-full h-2 mb-4 overflow-hidden border border-black/10">
        <div
          className="bg-[#ec4899] h-full transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Action Toolbar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white border border-black/15 p-1 rounded-xl shadow-2xs">
          <button
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === "all" ? "bg-black text-white" : "text-black/70 hover:bg-black/5"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilter("missing")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === "missing" ? "bg-[#ec4899] text-white" : "text-black/70 hover:bg-black/5"
            }`}
          >
            Need to Buy ({missingCount})
          </button>
          <button
            onClick={() => setFilter("ready")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === "ready" ? "bg-black text-white" : "text-black/70 hover:bg-black/5"
            }`}
          >
            In Pantry ({readyCount})
          </button>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleAll}
            className="flex items-center gap-1 bg-white hover:bg-black/5 text-black border border-black/15 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title={readyCount === totalCount ? "Uncheck all" : "Check all"}
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>{readyCount === totalCount ? "Uncheck All" : "Check All"}</span>
          </button>

          {missingCount > 0 && (
            <button
              onClick={handleCopyMissing}
              className="flex items-center gap-1 bg-white hover:bg-black/5 text-black border border-black/15 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              title="Copy needed ingredients to clipboard"
            >
              {copiedMissing ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-black/70" />
                  <span>Copy Needed</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {visibleItems.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-black/20 rounded-xl bg-white p-4">
            <p className="text-xs font-semibold text-black/60">
              {filter === "ready"
                ? "No ingredients checked as ready yet. Click items to check them off!"
                : filter === "missing"
                ? "All ingredients are marked as ready in your pantry!"
                : "No ingredients found."}
            </p>
          </div>
        ) : (
          visibleItems.map(({ item, idx, isDone }) => {
            return (
              <div
                key={idx}
                onClick={() => toggleCheck(idx)}
                className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                  isDone
                    ? "bg-black/5 border-black/10 text-black/50"
                    : "bg-white border-black/15 hover:border-black/30 shadow-2xs hover:shadow-xs"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                    isDone
                      ? "bg-[#ec4899] border-[#ec4899] text-white"
                      : "border-black/30 bg-white group-hover:border-[#ec4899]"
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 text-white stroke-[3]" /> : null}
                </div>
                <span
                  className={`font-medium text-xs flex-1 transition-all ${
                    isDone ? "line-through text-black/50" : "text-black font-semibold"
                  }`}
                >
                  {item}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                    isDone
                      ? "bg-black/5 text-black/40 border-black/10"
                      : "bg-[#ec4899]/10 text-[#ec4899] border-[#ec4899]/30"
                  }`}
                >
                  {isDone ? "In Pantry" : "Need"}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Add Custom Ingredient Form */}
      <form onSubmit={handleAddItem} className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add extra ingredient or staple (e.g. olive oil, salt)..."
          className="flex-1 bg-white border border-black/15 rounded-xl px-3 py-1.5 text-xs font-medium text-black outline-none focus:border-[#ec4899]"
        />
        <button
          type="submit"
          disabled={!newItemText.trim()}
          className="bg-black hover:bg-[#ec4899] disabled:opacity-40 disabled:hover:bg-black text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>
    </div>
  );
};

