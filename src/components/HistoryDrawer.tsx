import React, { useState, useMemo } from "react";
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
  Tag,
  Plus,
  Filter,
} from "lucide-react";

interface HistoryDrawerProps {
  history: UntangleHistoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectHistory: (item: UntangleHistoryItem) => void;
  onDeleteHistory: (id: string) => void;
  onClearAll: () => void;
  onBulkDelete?: (ids: string[]) => void;
  onUpdateTags?: (id: string, tags: string[]) => void;
  onBulkAddTag?: (ids: string[], tag: string) => void;
}

const DEFAULT_SUGGESTED_TAGS = ["Finance", "Biology", "Project", "Exam Prep", "Weekly Plan", "Ideas", "Recipe", "Study Note"];

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  isOpen,
  onClose,
  onSelectHistory,
  onDeleteHistory,
  onClearAll,
  onBulkDelete,
  onUpdateTags,
  onBulkAddTag,
}) => {
  const [search, setSearch] = useState("");
  const [filterRoute, setFilterRoute] = useState<"all" | "notes" | "chef">("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Adding tag inline state
  const [activeTaggingId, setActiveTaggingId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState("");

  // Bulk tag modal state
  const [isBulkTagModalOpen, setIsBulkTagModalOpen] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState("");

  // Extract all unique tags across history
  const allUniqueTags = useMemo(() => {
    const tagCountMap: Record<string, number> = {};
    history.forEach((item) => {
      if (item.tags) {
        item.tags.forEach((tag) => {
          const trimmed = tag.trim();
          if (trimmed) {
            tagCountMap[trimmed] = (tagCountMap[trimmed] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(tagCountMap).map(([tag, count]) => ({ tag, count }));
  }, [history]);

  if (!isOpen) return null;

  const filtered = history.filter((item) => {
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (item.title && item.title.toLowerCase().includes(query)) ||
      (item.outputMarkdown && item.outputMarkdown.toLowerCase().includes(query)) ||
      (item.inputPrompt && item.inputPrompt.toLowerCase().includes(query)) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(query)));

    const matchesRoute = filterRoute === "all" || item.routeDetected === filterRoute;

    const matchesTag =
      !selectedTag ||
      (item.tags &&
        item.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()));

    return matchesSearch && matchesRoute && matchesTag;
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

  const handleAddTagToItem = (itemId: string, tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    const item = history.find((h) => h.id === itemId);
    if (!item) return;

    const existingTags = item.tags || [];
    if (!existingTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      const updatedTags = [...existingTags, trimmed];
      if (onUpdateTags) {
        onUpdateTags(itemId, updatedTags);
      }
    }
    setNewTagInput("");
    setActiveTaggingId(null);
  };

  const handleRemoveTagFromItem = (itemId: string, tagToRemove: string) => {
    const item = history.find((h) => h.id === itemId);
    if (!item) return;

    const updatedTags = (item.tags || []).filter(
      (t) => t.toLowerCase() !== tagToRemove.toLowerCase()
    );
    if (onUpdateTags) {
      onUpdateTags(itemId, updatedTags);
    }
  };

  const handleApplyBulkTag = () => {
    const cleanTag = bulkTagInput.trim();
    if (!cleanTag || selectedIds.size === 0) return;

    const idsArray = Array.from(selectedIds);
    if (onBulkAddTag) {
      onBulkAddTag(idsArray, cleanTag);
    } else if (onUpdateTags) {
      idsArray.forEach((id) => {
        const item = history.find((h) => h.id === id);
        if (item) {
          const existing = item.tags || [];
          if (!existing.some((t) => t.toLowerCase() === cleanTag.toLowerCase())) {
            onUpdateTags(id, [...existing, cleanTag]);
          }
        }
      });
    }

    setBulkTagInput("");
    setIsBulkTagModalOpen(false);
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

        {/* Search & Route Filters */}
        <div className="space-y-3 mb-3">
          <div className="flex items-center gap-2 bg-[#FFF4E0] border-3 border-black px-3 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Search className="w-4 h-4 text-black stroke-[3] shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, tag, or content..."
              className="w-full bg-transparent text-xs font-black text-black outline-none uppercase placeholder:text-gray-600"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-black hover:text-red-500 transition-colors cursor-pointer shrink-0"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            )}
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

        {/* Tag Filter Toggle Bar */}
        <div className="mb-4 pb-3 border-b-2 border-black/20">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Filter by Tag:</span>
            </span>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-[10px] font-bold text-[#ec4899] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Clear Tag Filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedTag(null)}
              className={`text-[11px] font-bold px-2.5 py-1 border-2 border-black whitespace-nowrap transition-all cursor-pointer ${
                selectedTag === null
                  ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              All Tags
            </button>

            {allUniqueTags.length > 0 ? (
              allUniqueTags.map(({ tag, count }) => {
                const isTagActive = selectedTag?.toLowerCase() === tag.toLowerCase();
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(isTagActive ? null : tag)}
                    className={`text-[11px] font-bold px-2.5 py-1 border-2 border-black rounded-sm whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
                      isTagActive
                        ? "bg-[#ec4899] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-[#FFF4E0] text-black hover:bg-pink-100"
                    }`}
                  >
                    <span>#{tag}</span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded-full font-black ${
                        isTagActive ? "bg-white text-black" : "bg-black/10 text-black"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })
            ) : (
              <span className="text-[10px] text-gray-500 italic py-1">
                Add tags to your notes to categorize them (e.g., Finance, Biology, Project)
              </span>
            )}
          </div>
        </div>

        {/* Bulk Selection Control Bar */}
        {isSelectionMode && (
          <div className="bg-[#FF90E8] border-3 border-black p-3 mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 bg-white border-2 border-black px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-stone-100 cursor-pointer"
            >
              {allFilteredSelected ? (
                <>
                  <CheckSquare className="w-4 h-4 text-black stroke-[2.5]" />
                  <span>Deselect</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-black stroke-[2.5]" />
                  <span>All ({filtered.length})</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsBulkTagModalOpen(true)}
                disabled={selectedIds.size === 0}
                className="bg-[#FFF4E0] hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed text-black border-2 border-black px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Tag ({selectedIds.size})</span>
              </button>

              <button
                onClick={handleBulkDeleteAction}
                disabled={selectedIds.size === 0}
                className="bg-[#FF6B6B] hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-black border-2 border-black px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Del ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        )}

        {/* Bulk Tag Modal / Popover */}
        {isBulkTagModalOpen && (
          <div className="bg-amber-100 border-3 border-black p-3 mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase text-black flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 stroke-[2.5]" />
                Add tag to {selectedIds.size} selected items:
              </span>
              <button
                onClick={() => setIsBulkTagModalOpen(false)}
                className="text-black hover:text-red-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={bulkTagInput}
                onChange={(e) => setBulkTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyBulkTag();
                }}
                placeholder="e.g. Finance, Biology, Project..."
                className="flex-1 bg-white border-2 border-black px-2 py-1 text-xs font-bold text-black outline-none"
                autoFocus
              />
              <button
                onClick={handleApplyBulkTag}
                disabled={!bulkTagInput.trim()}
                className="bg-[#ec4899] disabled:opacity-50 text-white font-black text-xs uppercase px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                Apply
              </button>
            </div>

            <div className="flex flex-wrap gap-1">
              {DEFAULT_SUGGESTED_TAGS.slice(0, 5).map((sugg) => (
                <button
                  key={sugg}
                  onClick={() => setBulkTagInput(sugg)}
                  className="text-[10px] font-bold bg-white border border-black px-1.5 py-0.5 hover:bg-pink-100 cursor-pointer"
                >
                  +{sugg}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Item List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 border-3 border-dashed border-black bg-[#FFF4E0] p-4">
              {search || selectedTag ? (
                <>
                  <p className="font-black text-xs text-black uppercase">
                    No results found
                    {selectedTag && ` with tag #${selectedTag}`}
                    {search && ` for "${search}"`}
                  </p>
                  <p className="text-xs text-gray-700 font-bold mt-1">
                    Try clearing your tag filter or searching for another keyword.
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    {selectedTag && (
                      <button
                        onClick={() => setSelectedTag(null)}
                        className="bg-white hover:bg-black/5 text-black border-2 border-black px-2.5 py-1 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                      >
                        Clear Tag Filter
                      </button>
                    )}
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="bg-white hover:bg-black/5 text-black border-2 border-black px-2.5 py-1 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="font-black text-xs text-black uppercase">
                    No saved items found.
                  </p>
                  <p className="text-xs text-black font-bold mt-1">
                    Untangle notes or fridge ingredients to save them here!
                  </p>
                </>
              )}
            </div>
          ) : (
            filtered.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const isAddingTag = activeTaggingId === item.id;

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

                  {/* Note Tags & Inline Tagging Controls */}
                  <div className="mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.tags &&
                        item.tags.map((tag) => {
                          const isTagFiltered = selectedTag?.toLowerCase() === tag.toLowerCase();
                          return (
                            <span
                              key={tag}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 group/tag ${
                                isTagFiltered
                                  ? "bg-[#ec4899] text-white border border-black"
                                  : "bg-[#ec4899]/15 text-[#ec4899] border border-[#ec4899]/30 hover:bg-[#ec4899]/25"
                              }`}
                            >
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTag(isTagFiltered ? null : tag);
                                }}
                                className="cursor-pointer"
                                title={`Filter by #${tag}`}
                              >
                                #{tag}
                              </span>
                              {!isSelectionMode && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveTagFromItem(item.id, tag);
                                  }}
                                  className="hover:text-red-600 transition-colors cursor-pointer ml-0.5"
                                  title={`Remove tag #${tag}`}
                                >
                                  <X className="w-2.5 h-2.5 stroke-[3]" />
                                </button>
                              )}
                            </span>
                          );
                        })}

                      {/* Add Tag Button */}
                      {!isSelectionMode && !isAddingTag && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTaggingId(item.id);
                            setNewTagInput("");
                          }}
                          className="text-[10px] font-bold text-gray-700 bg-gray-100 hover:bg-pink-100 border border-dashed border-gray-400 hover:border-[#ec4899] hover:text-[#ec4899] px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-all cursor-pointer"
                          title="Add custom category tag (e.g. Finance, Biology, Project)"
                        >
                          <Plus className="w-2.5 h-2.5 stroke-[3]" />
                          <span>Tag</span>
                        </button>
                      )}
                    </div>

                    {/* Inline Tag Adder Box */}
                    {isAddingTag && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 p-2 bg-amber-50 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <input
                            type="text"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddTagToItem(item.id, newTagInput);
                              } else if (e.key === "Escape") {
                                setActiveTaggingId(null);
                              }
                            }}
                            placeholder="Tag name (e.g. Biology, Finance)..."
                            className="flex-1 bg-white border border-black px-2 py-0.5 text-xs font-bold text-black outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleAddTagToItem(item.id, newTagInput)}
                            disabled={!newTagInput.trim()}
                            className="bg-[#ec4899] disabled:opacity-50 text-white font-black text-[10px] uppercase px-2 py-1 border border-black cursor-pointer"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTaggingId(null)}
                            className="text-black hover:text-red-500 cursor-pointer p-0.5"
                          >
                            <X className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>

                        {/* Quick Tag Suggestions */}
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[9px] font-bold text-gray-500 uppercase">
                            Suggested:
                          </span>
                          {DEFAULT_SUGGESTED_TAGS.map((sugg) => (
                            <button
                              key={sugg}
                              type="button"
                              onClick={() => handleAddTagToItem(item.id, sugg)}
                              className="text-[9px] font-bold bg-white hover:bg-[#ec4899] hover:text-white border border-black/40 px-1.5 py-0.2 rounded transition-colors cursor-pointer"
                            >
                              +{sugg}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

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

