import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Check,
  Copy,
  Plus,
  CheckCheck,
  DollarSign,
  Receipt,
  Tag,
} from "lucide-react";

interface ShoppingChecklistProps {
  ingredients: string[];
}

interface ParsedIngredient {
  raw: string;
  name: string;
  priceFormatted?: string;
  priceNumeric?: number;
  note?: string;
}

function parseIngredientItem(raw: string): ParsedIngredient {
  let text = raw.trim();
  let note: string | undefined = undefined;
  let priceFormatted: string | undefined = undefined;
  let priceNumeric: number | undefined = undefined;

  // Check for notes in brackets or receipt remarks
  const bracketMatch = text.match(/\[(.*?)\]/) || text.match(/\((Receipt:.*?)\)/i) || text.match(/\((portion cost:.*?)\)/i);
  if (bracketMatch) {
    note = bracketMatch[1];
    text = text.replace(bracketMatch[0], "").trim();
  }

  // Check for price formatted like — $0.50, - $0.50, : $0.50, ($0.50), or $0.50
  const priceMatch = text.match(/(?:—|-|:|\(|\s|^)\s*\$(\d+(?:\.\d{1,2})?)/);
  if (priceMatch) {
    const num = parseFloat(priceMatch[1]);
    if (!isNaN(num)) {
      priceNumeric = num;
      priceFormatted = `$${num.toFixed(2)}`;
      // Clean up name
      text = text
        .replace(new RegExp(`(?:—|-|:)\\s*\\$${priceMatch[1]}`, "i"), "")
        .replace(new RegExp(`\\(\\s*\\$${priceMatch[1]}\\s*\\)`, "i"), "")
        .replace(new RegExp(`\\$${priceMatch[1]}`, "i"), "")
        .trim();
    }
  }

  // Strip leading list bullet and trailing dashes, colons, or punctuation
  text = text.replace(/^[-*+\d.]+\s*/, "").replace(/[-—:,\s]+$/, "").trim();

  return {
    raw,
    name: text || raw,
    priceFormatted,
    priceNumeric,
    note,
  };
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
    const textToCopy =
      missing.length > 0
        ? `🛒 Dorm Chef Shopping List (${missing.length} items needed):\n` +
          missing.map((item) => `- [ ] ${item}`).join("\n")
        : "All ingredients are ready in the pantry!";

    navigator.clipboard.writeText(textToCopy);
    setCopiedMissing(true);
    setTimeout(() => setCopiedMissing(false), 2000);
  };

  if (!items || items.length === 0) return null;

  const parsedItems: ParsedIngredient[] = items.map((item) => parseIngredientItem(item));
  const totalCount = items.length;
  const readyCount = Object.entries(checked).filter(([k, v]) => v && Number(k) < items.length).length;
  const missingCount = totalCount - readyCount;
  const progressPercent = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  // Calculate costs if parsed prices exist
  const pricedItems = parsedItems.filter((p) => p.priceNumeric !== undefined);
  const hasPrices = pricedItems.length > 0;

  const neededCost = parsedItems.reduce((sum, p, idx) => {
    if (!checked[idx] && p.priceNumeric !== undefined) {
      return sum + p.priceNumeric;
    }
    return sum;
  }, 0);

  const inPantryCost = parsedItems.reduce((sum, p, idx) => {
    if (checked[idx] && p.priceNumeric !== undefined) {
      return sum + p.priceNumeric;
    }
    return sum;
  }, 0);

  const visibleItems = parsedItems
    .map((parsed, idx) => ({ parsed, idx, isDone: Boolean(checked[idx]) }))
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
              <span>dorm ingredients & receipt checklist</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-black/5 text-black/60 border border-black/10">
                interactive
              </span>
            </h4>
            <p className="text-xs text-black/60 font-medium">
              Check off what you already have; see estimated grocery spend for the rest.
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {hasPrices && (
            <span className="text-xs font-semibold bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30 px-2.5 py-1 rounded-full flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              <span>Need: ${neededCost.toFixed(2)}</span>
            </span>
          )}
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

      {/* Price Summary Banner if prices parsed */}
      {hasPrices && (
        <div className="mb-4 bg-white border border-black/10 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-black/70 font-medium">
            <Receipt className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Parsed Receipt & Portion Pricing:</span>
          </div>
          <div className="flex items-center gap-3 font-semibold">
            <span className="text-[#ec4899]">To Buy: ${neededCost.toFixed(2)}</span>
            <span className="text-black/30">•</span>
            <span className="text-emerald-700">In Pantry: ${inPantryCost.toFixed(2)}</span>
          </div>
        </div>
      )}

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
          visibleItems.map(({ parsed, idx, isDone }) => {
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
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                    isDone
                      ? "bg-[#ec4899] border-[#ec4899] text-white"
                      : "border-black/30 bg-white group-hover:border-[#ec4899]"
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 text-white stroke-[3]" /> : null}
                </div>

                {/* Name & Note */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-medium text-xs transition-all ${
                        isDone ? "line-through text-black/50" : "text-black font-semibold"
                      }`}
                    >
                      {parsed.name}
                    </span>
                    {parsed.note && (
                      <span className="text-[10px] text-black/50 italic bg-black/5 px-1.5 py-0.5 rounded">
                        {parsed.note}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price Badge if parsed */}
                {parsed.priceFormatted && (
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border shrink-0 ${
                      isDone
                        ? "bg-black/5 text-black/40 border-black/10 line-through"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {parsed.priceFormatted}
                  </span>
                )}

                {/* Pantry / Need Pill */}
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all shrink-0 ${
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
          placeholder="Add extra ingredient or staple with price (e.g. Olive Oil — $0.35)..."
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


