import React, { useState } from "react";
import { UntangleHistoryItem } from "../types";
import {
  X,
  Trash2,
  Search,
  Brain,
  Utensils,
  Bookmark,
  Clock,
  ArrowRight,
  CheckSquare,
  Square,
  Check,
  ListChecks,
} from "lucide-react";

interface HistoryDrawerProps {
  history: UntangleHistoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectHistory: (item: UntangleHistoryItem) => void;
  onDeleteHistory: (id: string) => void;
  onClearAll: () => void;
  onBulkDelete?: (ids: string[]) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  isOpen,
  onClose,
  onSelectHistory,
  onDeleteHistory,
  onClearAll,
  onBulkDelete,
}) => {
  const [search, setSearch] = useState("");
  const [filterRoute, setFilterRoute] = useState<"all" | "notes" | "chef">("all");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const filtered = history.filter((item) => {
    const query = search.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(query) ||
      item.outputMarkdown.toLowerCase().includes(query) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(query)));
    const matchesRoute = filterRoute === "all" || item.routeDetected === filterRoute;
    return matchesSearch && matchesRoute;
  });

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((item) => selectedIds.has(item.id));

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      // Deselect all filtered
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((item) => next.delete(item.id));
        return next;
      });
    } else {
      // Select all filtered
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((item) => next.add(item.id));
        return next;
      });
    }
  };

  const handleBulkDeleteAction = () => {
    if (selectedIds.size === 0) return;

    const count = selectedIds.size;
    if (confirm(`Delete ${count} selected item${count > 1 ? "s" : ""} from your vault?`)) {
      const idsArray = Array.from(selectedIds);
      if (onBulkDelete) {
        onBulkDelete(idsArray);
      } else {
        idsArray.forEach((id) => onDeleteHistory(id));
      }

      // Haptic feedback
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([30, 40, 30]);
      }

      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  };

  const handleExitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white border-l-4 border-black w-full max-w-md h-full p-6 shadow-2xl flex flex-col font-sans overflow-hidden">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-black fill-black" />
            <h2 className="font-black text-xl text-black uppercase tracking-tight">
              SAVED UNTANGLES
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Selection Mode Toggle Button */}
            {history.length > 0 && (
              <button
                onClick={() => {
                  if (isSelectionMode) {
                    handleExitSelectionMode();
                  } else {
                    setIsSelectionMode(true);
                  }
                }}
                className={`p-1.5 border-3 border-black font-black text-xs uppercase flex items-center gap-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer ${
                  isSelectionMode
                    ? "bg-black text-white"
                    : "bg-[#FFF4E0] hover:bg-amber-200 text-black"
                }`}
                title={isSelectionMode ? "Exit Selection Mode" : "Bulk Select Mode"}
              >
                <ListChecks className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">{isSelectionMode ? "Cancel" : "Select"}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="bg-[#FF90E8] text-black border-3 border-black p-1.5 hover:bg-pink-300 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <X className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 bg-[#FFF4E0] border-3 border-black px-3 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Search className="w-4 h-4 text-black stroke-[3]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search saved notes or recipes..."
              className="w-full bg-transparent text-xs font-black text-black outline-none uppercase placeholder:text-gray-600"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterRoute("all")}
              className={`flex-1 py-1.5 px-2 border-3 border-black text-xs font-black uppercase cursor-pointer ${
                filterRoute === "all"
                  ? "bg-[#FF90E8] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-black"
              }`}
            >
              ALL ({history.length})
            </button>
            <button
              onClick={() => setFilterRoute("notes")}
              className={`flex-1 py-1.5 px-2 border text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                filterRoute === "notes"
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-black/15 hover:bg-black/5"
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>notes</span>
            </button>
            <button
              onClick={() => setFilterRoute("chef")}
              className={`flex-1 py-1.5 px-2 border text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                filterRoute === "chef"
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-black/15 hover:bg-black/5"
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>chef</span>
            </button>
          </div>
        </div>

        {/* Bulk Selection Control Bar */}
        {isSelectionMode && (
          <div className="bg-[#FF90E8] border-3 border-black p-3 mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-2 animate-fadeIn">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 bg-white border-2 border-black px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-stone-100 cursor-pointer"
            >
              {allFilteredSelected ? (
                <>
                  <CheckSquare className="w-4 h-4 text-black stroke-[2.5]" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-black stroke-[2.5]" />
                  <span>Select All ({filtered.length})</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-black uppercase">
                {selectedIds.size} Selected
              </span>

              <button
                onClick={handleBulkDeleteAction}
                disabled={selectedIds.size === 0}
                className="bg-[#FF6B6B] hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-black border-2 border-black px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Delete ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        )}

        {/* Item List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 border-3 border-dashed border-black bg-[#FFF4E0] p-4">
              <p className="font-black text-xs text-black uppercase">
                No saved items found.
              </p>
              <p className="text-xs text-black font-bold mt-1">
                Untangle notes or fridge ingredients to save them here!
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const isSelected = selectedIds.has(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleSelectItem(item.id);
                    }
                  }}
                  className={`border-3 border-black p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all relative group ${
                    isSelectionMode ? "cursor-pointer" : ""
                  } ${
                    isSelected
                      ? "bg-[#FFF4E0] ring-2 ring-black"
                      : "bg-white hover:bg-[#FFF4E0]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      {/* Checkbox in selection mode */}
                      {isSelectionMode && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectItem(item.id);
                          }}
                          className={`w-5 h-5 border-2 border-black flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? "bg-black text-white" : "bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      )}

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 border rounded-full flex items-center gap-1 ${
                          item.routeDetected === "chef"
                            ? "bg-[#ec4899]/10 text-[#ec4899] border-[#ec4899]/30"
                            : "bg-black/5 text-black/70 border-black/15"
                        }`}
                      >
                        {item.routeDetected === "chef" ? (
                          <>
                            <Utensils className="w-3 h-3" />
                            <span>dorm chef</span>
                          </>
                        ) : (
                          <>
                            <Brain className="w-3 h-3" />
                            <span>note engine</span>
                          </>
                        )}
                      </span>
                    </div>

                    <span className="text-[10px] font-black text-black flex items-center gap-1">
                      <Clock className="w-3 h-3 stroke-[3]" />
                      {new Date(item.timestamp).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <h4
                    onClick={(e) => {
                      if (!isSelectionMode) {
                        onSelectHistory(item);
                        onClose();
                      }
                    }}
                    className={`font-black text-sm text-black uppercase line-clamp-1 mb-1 ${
                      isSelectionMode ? "" : "cursor-pointer hover:underline"
                    }`}
                  >
                    {item.title}
                  </h4>

                  <p className="text-xs text-gray-800 font-bold line-clamp-2 mb-2">
                    {item.outputMarkdown.replace(/[#*`_~[\]]/g, "")}
                  </p>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-semibold bg-[#ec4899]/15 text-[#ec4899] border border-[#ec4899]/30 px-2 py-0.5 rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {!isSelectionMode && (
                    <div className="flex items-center justify-between border-t-2 border-black pt-2 text-[11px] font-black uppercase">
                      <button
                        onClick={() => {
                          onSelectHistory(item);
                          onClose();
                        }}
                        className="text-black hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        VIEW UNTANGLE <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHistory(item.id);
                        }}
                        className="bg-[#FF6B6B] hover:bg-red-400 text-black border border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Clear All Footer */}
        {history.length > 0 && !isSelectionMode && (
          <div className="pt-4 border-t-4 border-black mt-4 flex items-center justify-between">
            <span className="text-xs font-black text-black uppercase">
              Total Saved: {history.length}
            </span>
            <button
              onClick={onClearAll}
              className="bg-[#FF6B6B] hover:bg-red-400 text-black border-3 border-black px-3.5 py-1.5 font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              CLEAR ALL VAULT
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
