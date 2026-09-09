import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "motion/react";
import {
  ShoppingCart,
  Check,
  Copy,
  Plus,
  CheckCheck,
  DollarSign,
  Receipt,
  Trash2,
  Share2,
} from "lucide-react";

const checklistContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.03,
    },
  },
};

const checklistItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 420,
      damping: 26,
      mass: 0.8,
    },
  },
};

interface ShoppingChecklistProps {
  ingredients: string[];
  recipeTitle?: string;
}

export interface GroceryItem {
  id: string;
  raw: string;
  name: string;
  priceFormatted?: string;
  priceNumeric?: number;
  note?: string;
  checked: boolean;
}

function parseIngredientItem(raw: string): Omit<GroceryItem, "id" | "checked"> {
  let text = raw.trim();
  let note: string | undefined = undefined;
  let priceFormatted: string | undefined = undefined;
  let priceNumeric: number | undefined = undefined;

  // Check for notes in brackets or receipt remarks
  const bracketMatch =
    text.match(/\[(.*?)\]/) ||
    text.match(/\((Receipt:.*?)\)/i) ||
    text.match(/\((portion cost:.*?)\)/i);
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
  text = text.replace(/^[-*+•\d.)]+\s*/, "").replace(/[-—:,\s]+$/, "").trim();

  return {
    raw,
    name: text || raw,
    priceFormatted,
    priceNumeric,
    note,
  };
}

export const ShoppingChecklist: React.FC<ShoppingChecklistProps> = ({
  ingredients: initialIngredients,
  recipeTitle,
}) => {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [filter, setFilter] = useState<"all" | "missing" | "ready">("all");
  const [newItemText, setNewItemText] = useState("");
  const [copiedMode, setCopiedMode] = useState<"needed" | "all" | null>(null);

  // Synchronize when extracted recipe ingredients change (preserving checked state)
  useEffect(() => {
    if (!initialIngredients || initialIngredients.length === 0) {
      setItems([]);
      return;
    }

    setItems((prev) => {
      const checkedMap = new Map<string, boolean>();
      prev.forEach((p, idx) => {
        // Map by name and by index as fallback
        checkedMap.set(p.name.toLowerCase().replace(/[^a-z0-9]/g, ""), p.checked);
        checkedMap.set(`idx-${idx}`, p.checked);
      });

      return initialIngredients.map((raw, idx) => {
        const parsed = parseIngredientItem(raw);
        const key = parsed.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const wasChecked = checkedMap.has(key)
          ? checkedMap.get(key)
          : checkedMap.get(`idx-${idx}`) || false;

        return {
          id: `item-${idx}-${raw.replace(/[^a-zA-Z0-9]/g, "").slice(0, 15)}`,
          ...parsed,
          checked: Boolean(wasChecked),
        };
      });
    });
  }, [initialIngredients]);

  const toggleCheck = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(25);
    }
  };

  const handleToggleAll = () => {
    const allChecked = items.length > 0 && items.every((i) => i.checked);
    setItems((prev) => prev.map((item) => ({ ...item, checked: !allChecked })));
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(30);
    }
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newItemText.trim();
    if (!clean) return;

    const parsed = parseIngredientItem(clean);
    const newItem: GroceryItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...parsed,
      checked: false,
    };

    setItems((prev) => [...prev, newItem]);
    setNewItemText("");
  };

  const handleCopyList = (onlyNeeded: boolean) => {
    const targetItems = onlyNeeded ? items.filter((i) => !i.checked) : items;
    if (targetItems.length === 0) return;

    const titlePrefix = recipeTitle
      ? `🛒 Grocery List for ${recipeTitle}`
      : "🛒 Recipe Grocery List";

    const header = onlyNeeded
      ? `${titlePrefix} (${targetItems.length} items to buy):`
      : `${titlePrefix} (${targetItems.length} items):`;

    const formattedLines = targetItems.map((item) => {
      const checkMark = item.checked ? "[x]" : "[ ]";
      const price = item.priceFormatted ? ` — ${item.priceFormatted}` : "";
      const note = item.note ? ` (${item.note})` : "";
      return `- ${checkMark} ${item.name}${price}${note}`;
    });

    const fullText = `${header}\n\n${formattedLines.join("\n")}`;

    navigator.clipboard.writeText(fullText);
    setCopiedMode(onlyNeeded ? "needed" : "all");
    setTimeout(() => setCopiedMode(null), 2200);
  };

  if (!items || items.length === 0) return null;

  const totalCount = items.length;
  const readyCount = items.filter((i) => i.checked).length;
  const missingCount = totalCount - readyCount;
  const progressPercent = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  const pricedItems = items.filter((p) => p.priceNumeric !== undefined);
  const hasPrices = pricedItems.length > 0;

  const neededCost = items.reduce((sum, item) => {
    if (!item.checked && item.priceNumeric !== undefined) {
      return sum + item.priceNumeric;
    }
    return sum;
  }, 0);

  const inPantryCost = items.reduce((sum, item) => {
    if (item.checked && item.priceNumeric !== undefined) {
      return sum + item.priceNumeric;
    }
    return sum;
  }, 0);

  const visibleItems = items.filter((item) => {
    if (filter === "ready") return item.checked;
    if (filter === "missing") return !item.checked;
    return true;
  });

  return (
    <div className="mt-8 bg-[#FAF8F5] border-2 border-black/15 rounded-2xl p-5 sm:p-7 shadow-xs font-sans">
      {/* Header with Title & Live Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30 flex items-center justify-center shadow-2xs">
            <ShoppingCart className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="font-bold text-base text-black tracking-tight flex items-center gap-2 flex-wrap">
              <span>Recipe Grocery List</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30 font-semibold">
                simple checklist
              </span>
              {totalCount > 0 && (
                <span className="text-[11px] font-mono text-black/50">
                  ({totalCount} ingredients extracted)
                </span>
              )}
            </h4>
            <p className="text-xs text-black/60 font-medium">
              Check off ingredients you've bought or have in your pantry; copy or buy the rest.
            </p>
          </div>
        </div>

        {/* Live Counters & Spent Badges */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {hasPrices && (
            <span className="text-xs font-semibold bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
              <DollarSign className="w-3 h-3" />
              <span>To Buy: ${neededCost.toFixed(2)}</span>
            </span>
          )}
          <span className="text-xs font-semibold bg-white border border-black/15 px-3 py-1 rounded-full shadow-2xs text-black">
            {readyCount} of {totalCount} bought ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full bg-black/5 rounded-full h-2.5 mb-4 overflow-hidden border border-black/10">
        <div
          className="bg-[#ec4899] h-full transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Price Summary Banner if itemized prices exist */}
      {hasPrices && (
        <div className="mb-4 bg-white border border-black/10 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
          <div className="flex items-center gap-1.5 text-black/70 font-medium">
            <Receipt className="w-3.5 h-3.5 text-[#ec4899]" />
            <span className="font-semibold text-black">Receipt & Portion Breakdown:</span>
          </div>
          <div className="flex items-center gap-3 font-semibold">
            <span className="text-[#ec4899] flex items-center gap-1">
              <span>To Buy:</span>
              <span className="font-mono">${neededCost.toFixed(2)}</span>
            </span>
            <span className="text-black/30">•</span>
            <span className="text-emerald-700 flex items-center gap-1">
              <span>Bought / Pantry:</span>
              <span className="font-mono">${inPantryCost.toFixed(2)}</span>
            </span>
          </div>
        </div>
      )}

      {/* Action Toolbar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-white border border-black/15 p-1 rounded-xl shadow-2xs">
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
            To Buy ({missingCount})
          </button>
          <button
            onClick={() => setFilter("ready")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === "ready" ? "bg-black text-white" : "text-black/70 hover:bg-black/5"
            }`}
          >
            Bought ({readyCount})
          </button>
        </div>

        {/* Action Buttons: Check All & Copy Grocery List */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleToggleAll}
            className="flex items-center gap-1.5 bg-white hover:bg-black/5 text-black border border-black/15 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title={readyCount === totalCount ? "Uncheck all ingredients" : "Mark all as bought"}
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>{readyCount === totalCount ? "Uncheck All" : "Mark All Bought"}</span>
          </button>

          {/* Copy To-Buy Items */}
          <button
            onClick={() => handleCopyList(true)}
            disabled={missingCount === 0}
            className="flex items-center gap-1.5 bg-white hover:bg-black/5 disabled:opacity-40 disabled:hover:bg-white text-black border border-black/15 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Copy needed grocery items to clipboard"
          >
            {copiedMode === "needed" ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600 stroke-[2.5]" />
                <span className="text-green-600 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-black/70" />
                <span>Copy To-Buy ({missingCount})</span>
              </>
            )}
          </button>

          {/* Copy Full Checklist */}
          <button
            onClick={() => handleCopyList(false)}
            className="flex items-center gap-1.5 bg-white hover:bg-black/5 text-black border border-black/15 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Copy full ingredient checklist to clipboard"
          >
            {copiedMode === "all" ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600 stroke-[2.5]" />
                <span className="text-green-600 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-black/70" />
                <span>Copy All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Checkbox-based Grocery Items */}
      <motion.div
        key={`checklist-${filter}-${items.length}`}
        variants={checklistContainerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2 max-h-96 overflow-y-auto pr-1"
      >
        {visibleItems.length === 0 ? (
          <motion.div
            variants={checklistItemVariants}
            className="text-center py-8 border border-dashed border-black/20 rounded-xl bg-white p-5"
          >
            <p className="text-xs font-semibold text-black/70">
              {filter === "ready"
                ? "No ingredients marked as bought yet. Click items to check them off!"
                : filter === "missing"
                ? "🎉 All ingredients are marked as bought! You have everything ready."
                : "No ingredients found in this list."}
            </p>
          </motion.div>
        ) : (
          visibleItems.map((item) => {
            const isDone = item.checked;
            return (
              <motion.div
                key={item.id}
                variants={checklistItemVariants}
                whileHover={{ scale: 1.006, transition: { duration: 0.15 } }}
                onClick={() => toggleCheck(item.id)}
                role="checkbox"
                aria-checked={isDone}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    toggleCheck(item.id);
                  }
                }}
                className={`group flex items-center justify-between gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all select-none ${
                  isDone
                    ? "bg-black/[0.02] border-black/10 text-black/45"
                    : "bg-white border-black/15 hover:border-[#ec4899]/60 shadow-2xs hover:shadow-xs"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Checkbox box with spring pop animation */}
                  <motion.div
                    animate={{
                      scale: isDone ? [1, 1.25, 1] : 1,
                      backgroundColor: isDone ? "#ec4899" : "#ffffff",
                      borderColor: isDone ? "#ec4899" : "rgba(0, 0, 0, 0.3)",
                    }}
                    transition={{
                      duration: 0.24,
                      ease: "easeOut",
                    }}
                    className="w-5.5 h-5.5 rounded-lg flex items-center justify-center border-2 shrink-0 relative overflow-hidden"
                  >
                    <AnimatePresence>
                      {isDone && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0, rotate: -20 }}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          exit={{ scale: 0, opacity: 0, rotate: 20 }}
                          transition={{
                            type: "spring",
                            stiffness: 600,
                            damping: 26,
                          }}
                        >
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Ingredient Name & Receipt Details with Animated Strike-through */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative inline-flex items-center max-w-full">
                        <motion.span
                          animate={{
                            color: isDone ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.95)",
                          }}
                          transition={{ duration: 0.25 }}
                          className={`text-xs select-none block transition-colors ${
                            isDone ? "font-normal" : "font-semibold text-black"
                          }`}
                        >
                          {item.name}
                        </motion.span>

                        {/* Animated Pen/Marker Strike-Through Line once marked as bought */}
                        <motion.span
                          aria-hidden="true"
                          initial={false}
                          animate={{
                            scaleX: isDone ? 1 : 0,
                            opacity: isDone ? 0.95 : 0,
                          }}
                          transition={{
                            duration: 0.32,
                            ease: [0.16, 1, 0.3, 1], // snappy pen stroke draw
                          }}
                          style={{ transformOrigin: "left center" }}
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2.5px] bg-[#ec4899] rounded-full pointer-events-none"
                        />
                      </div>

                      {item.note && (
                        <motion.span
                          animate={{
                            opacity: isDone ? 0.45 : 0.85,
                          }}
                          transition={{ duration: 0.2 }}
                          className="text-[10px] text-black/55 italic bg-black/5 px-2 py-0.5 rounded-md border border-black/10 select-none"
                        >
                          {item.note}
                        </motion.span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Badges & Delete Action */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Price badge if item has price */}
                  {item.priceFormatted && (
                    <div className="relative inline-flex items-center">
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border transition-colors ${
                          isDone
                            ? "bg-black/5 text-black/40 border-black/10"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {item.priceFormatted}
                      </span>
                      <motion.span
                        aria-hidden="true"
                        initial={false}
                        animate={{
                          scaleX: isDone ? 1 : 0,
                          opacity: isDone ? 0.8 : 0,
                        }}
                        transition={{
                          duration: 0.28,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        style={{ transformOrigin: "left center" }}
                        className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-[1.5px] bg-black/40 rounded-full pointer-events-none"
                      />
                    </div>
                  )}

                  {/* Status Pill */}
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                      isDone
                        ? "bg-black/5 text-black/40 border-black/10"
                        : "bg-[#ec4899]/10 text-[#ec4899] border-[#ec4899]/30"
                    }`}
                  >
                    {isDone ? "Bought ✓" : "To Buy"}
                  </span>

                  {/* Delete Item Button */}
                  <button
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-black/40 hover:text-red-600 hover:bg-red-50 rounded-md transition-all cursor-pointer"
                    title="Remove ingredient from list"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Add Custom Ingredient Form */}
      <form onSubmit={handleAddItem} className="mt-3.5 flex items-center gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add extra ingredient or dorm staple (e.g. Soy Sauce — $0.25, Paper Towels)..."
          className="flex-1 bg-white border border-black/15 rounded-xl px-3.5 py-2 text-xs font-medium text-black outline-none focus:border-[#ec4899] focus:ring-1 focus:ring-[#ec4899]/30 shadow-2xs"
        />
        <button
          type="submit"
          disabled={!newItemText.trim()}
          className="bg-black hover:bg-[#ec4899] disabled:opacity-40 disabled:hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>
    </div>
  );
};



