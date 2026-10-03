import React, { useState, useMemo, useRef, useEffect } from "react";
import { UntangleHistoryItem, StudyFolder } from "../types";
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
  Share2,
  Sparkles,
  FileDown,
  Folder,
  FolderPlus,
  FolderOpen,
  Edit2,
  ChevronDown,
} from "lucide-react";
import { isWebShareSupported, shareViaWebShare, SharePayloadOptions } from "../utils/webShare";
import { ShareModal } from "./ShareModal";
import { analyzeNoteContentForTags } from "../utils/tagSuggester";
import { downloadNotePdf } from "../utils/pdfExport";

// Helper to highlight matching keywords in titles and tags
const highlightKeywordMatch = (text: string, query: string): React.ReactNode => {
  if (!text || !query.trim()) return text;
  const tokens = query
    .toLowerCase()
    .replace(/^#+/, "")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (tokens.length === 0) return text;

  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="bg-amber-300 text-black font-black px-0.5 rounded-xs">
        {part}
      </span>
    ) : (
      part
    )
  );
};

export const FOLDER_COLOR_STYLES: Record<string, {
  pillBg: string;
  pillText: string;
  pillBorder: string;
  badgeBg: string;
  activeBg: string;
  iconColor: string;
}> = {
  indigo: {
    pillBg: "bg-indigo-50",
    pillText: "text-indigo-950",
    pillBorder: "border-indigo-300",
    badgeBg: "bg-indigo-600 text-white",
    activeBg: "bg-indigo-600 text-white",
    iconColor: "text-indigo-600",
  },
  emerald: {
    pillBg: "bg-emerald-50",
    pillText: "text-emerald-950",
    pillBorder: "border-emerald-300",
    badgeBg: "bg-emerald-600 text-white",
    activeBg: "bg-emerald-600 text-white",
    iconColor: "text-emerald-600",
  },
  amber: {
    pillBg: "bg-amber-50",
    pillText: "text-amber-950",
    pillBorder: "border-amber-300",
    badgeBg: "bg-amber-600 text-white",
    activeBg: "bg-amber-600 text-white",
    iconColor: "text-amber-600",
  },
  rose: {
    pillBg: "bg-rose-50",
    pillText: "text-rose-950",
    pillBorder: "border-rose-300",
    badgeBg: "bg-rose-600 text-white",
    activeBg: "bg-rose-600 text-white",
    iconColor: "text-rose-600",
  },
  purple: {
    pillBg: "bg-purple-50",
    pillText: "text-purple-950",
    pillBorder: "border-purple-300",
    badgeBg: "bg-purple-600 text-white",
    activeBg: "bg-purple-600 text-white",
    iconColor: "text-purple-600",
  },
  blue: {
    pillBg: "bg-blue-50",
    pillText: "text-blue-950",
    pillBorder: "border-blue-300",
    badgeBg: "bg-blue-600 text-white",
    activeBg: "bg-blue-600 text-white",
    iconColor: "text-blue-600",
  },
  stone: {
    pillBg: "bg-stone-100",
    pillText: "text-stone-950",
    pillBorder: "border-stone-300",
    badgeBg: "bg-stone-700 text-white",
    activeBg: "bg-stone-800 text-white",
    iconColor: "text-stone-700",
  },
};

const FOLDER_COLORS = ["indigo", "emerald", "amber", "rose", "purple", "blue", "stone"] as const;
const SUGGESTED_FOLDER_NAMES = [
  "Biology 101",
  "Exam Prep",
  "Calculus",
  "Dorm Recipes",
  "Chemistry",
  "World History",
];

interface HistoryDrawerProps {
  history: UntangleHistoryItem[];
  folders?: StudyFolder[];
  onUpdateFolders?: (folders: StudyFolder[]) => void;
  onMoveNoteToFolder?: (noteId: string, folderId: string | null) => void;
  onBulkMoveToFolder?: (noteIds: string[], folderId: string | null) => void;
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
  folders = [],
  onUpdateFolders,
  onMoveNoteToFolder,
  onBulkMoveToFolder,
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

  // Folders State
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // null = all, "unfiled" = unfiled, or folder.id
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [newFolderColor, setNewFolderColor] = useState<"indigo" | "emerald" | "amber" | "rose" | "purple" | "blue" | "stone">("indigo");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState<string>("");
  const [editingFolderColor, setEditingFolderColor] = useState<"indigo" | "emerald" | "amber" | "rose" | "purple" | "blue" | "stone">("indigo");

  // Single note folder picker popover
  const [activeFolderPickerNoteId, setActiveFolderPickerNoteId] = useState<string | null>(null);

  // Bulk folder move modal state
  const [isBulkFolderModalOpen, setIsBulkFolderModalOpen] = useState<boolean>(false);
  const [bulkNewFolderName, setBulkNewFolderName] = useState<string>("");

  // Adding tag inline state
  const [activeTaggingId, setActiveTaggingId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState("");

  // Bulk tag modal state
  const [isBulkTagModalOpen, setIsBulkTagModalOpen] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState("");

  // Share modal state for history item
  const [sharingItem, setSharingItem] = useState<UntangleHistoryItem | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  const handleDownloadItemPdf = async (item: UntangleHistoryItem) => {
    const firstLine = item.outputMarkdown.split("\n")[0] || "";
    const title =
      item.title ||
      firstLine.replace(/^[#\s🍳DORMCHEF:🧠UNTANGLEDNOTES]+/, "").trim() ||
      "Saved Untangle";

    setDownloadingPdfId(item.id);
    try {
      await downloadNotePdf({
        title,
        markdown: item.outputMarkdown,
        routeDetected: item.routeDetected,
        tags: item.tags,
      });
    } catch (err) {
      console.error("Failed to download PDF for history item:", err);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleShareItem = async (item: UntangleHistoryItem) => {
    const firstLine = item.outputMarkdown.split("\n")[0] || "";
    const title =
      firstLine.replace(/^[#\s🍳DORMCHEF:🧠UNTANGLEDNOTES]+/, "").trim() || "Saved Untangle";
    const shareOptions: SharePayloadOptions = {
      title,
      markdown: item.outputMarkdown,
      routeDetected: item.routeDetected,
      url: typeof window !== "undefined" ? window.location.href : "",
    };

    if (isWebShareSupported()) {
      const res = await shareViaWebShare(shareOptions);
      if (res.success || res.method === "aborted") return;
    }

    setSharingItem(item);
  };

  // Ref for the search input for programmatic focusing and shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut: Press '/' or 'Cmd/Ctrl+K' to focus search input in HistoryDrawer
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in another input or textarea
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;

      if (
        (e.key === "/" && activeEl !== searchInputRef.current && !isInput) ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Click outside to close note folder picker popover
  useEffect(() => {
    if (!activeFolderPickerNoteId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.(".folder-picker-container")) {
        setActiveFolderPickerNoteId(null);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [activeFolderPickerNoteId]);

  const currentFolders = folders || [];

  // Compute note counts per folder, unfiled notes, and total
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    currentFolders.forEach((f) => {
      counts[f.id] = 0;
    });
    let unfiled = 0;
    history.forEach((item) => {
      if (item.folderId && counts[item.folderId] !== undefined) {
        counts[item.folderId] += 1;
      } else {
        unfiled += 1;
      }
    });
    return { counts, unfiled, total: history.length };
  }, [history, currentFolders]);

  const activeFolder = useMemo(() => {
    if (!selectedFolderId || selectedFolderId === "unfiled") return null;
    return currentFolders.find((f) => f.id === selectedFolderId) || null;
  }, [selectedFolderId, currentFolders]);

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

  // Multi-token keyword search matching title, tags, content, or folder name
  const filtered = useMemo(() => {
    return history.filter((item) => {
      const rawQuery = search.trim().toLowerCase();

      // Folder filter
      if (selectedFolderId === "unfiled") {
        if (item.folderId && currentFolders.some((f) => f.id === item.folderId)) {
          return false;
        }
      } else if (selectedFolderId) {
        if (item.folderId !== selectedFolderId) {
          return false;
        }
      }

      // Route filter
      const matchesRoute = filterRoute === "all" || item.routeDetected === filterRoute;
      if (!matchesRoute) return false;

      // Tag filter
      const matchesTag =
        !selectedTag ||
        (item.tags &&
          item.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()));
      if (!matchesTag) return false;

      // If search query is empty, return item
      if (!rawQuery) return true;

      // Split query into tokens for multi-keyword matching
      const tokens = rawQuery
        .split(/\s+/)
        .map((t) => t.replace(/^#+/, "").trim())
        .filter((t) => t.length > 0);

      if (tokens.length === 0) return true;

      const titleLower = (item.title || "").toLowerCase();
      const tagsLower = (item.tags || []).map((t) => t.toLowerCase());
      const promptLower = (item.inputPrompt || "").toLowerCase();
      const markdownLower = (item.outputMarkdown || "").toLowerCase();

      const itemFolder = item.folderId ? currentFolders.find((f) => f.id === item.folderId) : null;
      const folderNameLower = itemFolder ? itemFolder.name.toLowerCase() : "";

      // Every keyword token must match either title, tags, folder, prompt, or content
      return tokens.every((token) => {
        if (folderNameLower.includes(token)) return true;
        if (tagsLower.some((t) => t.includes(token))) return true;
        if (titleLower.includes(token)) return true;
        return promptLower.includes(token) || markdownLower.includes(token);
      });
    });
  }, [history, search, filterRoute, selectedTag, selectedFolderId, currentFolders]);

  if (!isOpen) return null;

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

  // Folder Action Handlers
  const handleCreateFolder = (customName?: string, customColor?: any) => {
    const nameToUse = (customName || newFolderName).trim();
    if (!nameToUse) return;
    const colorToUse = customColor || newFolderColor || "indigo";
    const newFolder: StudyFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: nameToUse,
      color: colorToUse,
      createdAt: Date.now(),
    };
    const updated = [...currentFolders, newFolder];
    onUpdateFolders?.(updated);
    setNewFolderName("");
    setIsCreatingFolder(false);
    setSelectedFolderId(newFolder.id);
    return newFolder;
  };

  const handleSaveEditFolder = (folderId: string) => {
    const trimmed = editingFolderName.trim();
    if (!trimmed) return;
    const updated = currentFolders.map((f) =>
      f.id === folderId ? { ...f, name: trimmed, color: editingFolderColor } : f
    );
    onUpdateFolders?.(updated);
    setEditingFolderId(null);
  };

  const handleDeleteFolder = (folderId: string) => {
    const targetFolder = currentFolders.find((f) => f.id === folderId);
    if (!targetFolder) return;
    const countInFolder = folderCounts.counts[folderId] || 0;
    if (
      confirm(
        `Delete folder "${targetFolder.name}"? ${
          countInFolder > 0
            ? `Your ${countInFolder} saved note${countInFolder > 1 ? "s" : ""} will not be deleted; they will be moved to Unfiled.`
            : ""
        }`
      )
    ) {
      // Unfile notes in this folder
      const notesInFolder = history.filter((h) => h.folderId === folderId).map((h) => h.id);
      if (notesInFolder.length > 0) {
        onBulkMoveToFolder?.(notesInFolder, null);
      }
      const updated = currentFolders.filter((f) => f.id !== folderId);
      onUpdateFolders?.(updated);
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
    }
  };

  const handleAssignNoteToFolder = (noteId: string, folderId: string | null) => {
    onMoveNoteToFolder?.(noteId, folderId);
    setActiveFolderPickerNoteId(null);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([20]);
    }
  };

  const handleBulkMove = (folderId: string | null) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    onBulkMoveToFolder?.(ids, folderId);
    setIsBulkFolderModalOpen(false);
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([30, 20]);
    }
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

  // Smart suggested tags aggregated across selected items for bulk tagging
  const bulkSuggestedTags = useMemo(() => {
    if (selectedIds.size === 0) return DEFAULT_SUGGESTED_TAGS.slice(0, 5);
    const selectedItems = history.filter((h) => selectedIds.has(h.id));
    const tagCounts = new Map<string, number>();

    for (const item of selectedItems) {
      const detected = analyzeNoteContentForTags({
        title: item.title,
        outputMarkdown: item.outputMarkdown,
        inputPrompt: item.inputPrompt,
        routeDetected: item.routeDetected,
        existingTags: item.tags,
      });
      for (const t of detected) {
        tagCounts.set(t.tag, (tagCounts.get(t.tag) || 0) + 1);
      }
    }

    const sorted = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    return sorted.length > 0 ? sorted.slice(0, 6) : DEFAULT_SUGGESTED_TAGS.slice(0, 5);
  }, [selectedIds, history]);

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

        {/* Search Bar for Filtering by Title or Tag Keywords */}
        <div id="history-search-bar" className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-black">
            <span className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />
              <span>Search Saved Vault</span>
            </span>
            {search.trim() ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
                {filtered.length} of {history.length} {filtered.length === 1 ? "match" : "matches"}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-black/50">
                {history.length} {history.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>

          <div className="relative flex items-center bg-[#FFF4E0] border-3 border-black px-3 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <Search className="w-4 h-4 text-black/70 stroke-[2.5] shrink-0 mr-2" />
            <input
              id="history-search-input"
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  if (search) {
                    setSearch("");
                  } else {
                    searchInputRef.current?.blur();
                  }
                }
              }}
              placeholder="Filter notes & recipes by title, tag (#biology), or keyword..."
              className="w-full bg-transparent text-xs font-bold text-black outline-none placeholder:text-gray-500 placeholder:font-medium"
            />
            {search ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  searchInputRef.current?.focus();
                }}
                className="text-black hover:text-red-500 transition-colors cursor-pointer shrink-0 p-0.5"
                title="Clear search (Esc)"
              >
                <X className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            ) : (
              <kbd
                onClick={() => searchInputRef.current?.focus()}
                className="hidden sm:inline-block text-[9px] font-mono font-bold text-black/40 border border-black/20 rounded px-1.5 py-0.5 bg-black/5 select-none shrink-0 cursor-pointer hover:bg-black/10"
                title="Press / to search"
              >
                /
              </kbd>
            )}
          </div>

          {/* Quick Keyword suggestions for instant tag/title filtering */}
          {allUniqueTags.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto pt-0.5 pb-1 no-scrollbar text-[10px]">
              <span className="font-bold text-black/50 uppercase tracking-tight shrink-0 flex items-center gap-1 pr-1">
                <Tag className="w-3 h-3 text-fuchsia-600" />
                <span>Keywords:</span>
              </span>
              {allUniqueTags.slice(0, 6).map(({ tag }) => {
                const isMatchingQuery = search.toLowerCase().includes(tag.toLowerCase());
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (isMatchingQuery) {
                        setSearch("");
                      } else {
                        setSearch(tag);
                        searchInputRef.current?.focus();
                      }
                    }}
                    className={`px-2 py-0.5 border rounded-sm font-bold cursor-pointer transition-all shrink-0 ${
                      isMatchingQuery
                        ? "bg-indigo-600 text-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white hover:bg-indigo-50 text-black/80 border-black/20 hover:border-black"
                    }`}
                    title={`Filter by tag keyword "${tag}"`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 pt-1">
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

        {/* STUDY FOLDERS SECTION */}
        <div id="history-folders-section" className="mb-3 pb-2.5 border-b-2 border-black/20">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
              <span>Study Folders ({currentFolders.length}):</span>
            </span>

            <button
              id="create-new-folder-button"
              data-testid="create-new-folder"
              type="button"
              onClick={() => {
                setIsCreatingFolder((prev) => !prev);
                setNewFolderName("");
              }}
              className="text-[10px] font-bold bg-[#FFF4E0] hover:bg-amber-200 text-black border-2 border-black px-2 py-0.5 rounded shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
              title="Create a new custom folder for study organization"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>New Folder</span>
            </button>
          </div>

          {/* Inline Folder Creation Form */}
          {isCreatingFolder && (
            <div className="mb-2.5 p-2.5 bg-amber-50 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase text-black flex items-center gap-1">
                  <FolderPlus className="w-3.5 h-3.5 text-amber-600" />
                  <span>Create Custom Folder</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(false)}
                  className="text-black hover:text-red-500 cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>

              <div className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder();
                    if (e.key === "Escape") setIsCreatingFolder(false);
                  }}
                  placeholder="Folder name (e.g. Biology 101, Midterms)..."
                  className="flex-1 bg-white border border-black px-2 py-1 text-xs font-bold text-black outline-none focus:ring-1 focus:ring-amber-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleCreateFolder()}
                  disabled={!newFolderName.trim()}
                  className="bg-black hover:bg-indigo-600 disabled:opacity-50 text-white font-black text-[10px] uppercase px-3 py-1 border border-black cursor-pointer shadow-2xs transition-colors"
                >
                  Create
                </button>
              </div>

              {/* Color Swatches */}
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-black/60 uppercase">Theme:</span>
                  {FOLDER_COLORS.map((col) => {
                    const isSelected = newFolderColor === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewFolderColor(col)}
                        className={`w-4 h-4 rounded-full border-2 transition-transform cursor-pointer ${
                          isSelected ? "border-black scale-125 shadow-xs ring-1 ring-black" : "border-black/30 hover:scale-110"
                        } ${
                          col === "indigo"
                            ? "bg-indigo-500"
                            : col === "emerald"
                            ? "bg-emerald-500"
                            : col === "amber"
                            ? "bg-amber-500"
                            : col === "rose"
                            ? "bg-rose-500"
                            : col === "purple"
                            ? "bg-purple-500"
                            : col === "blue"
                            ? "bg-blue-500"
                            : "bg-stone-600"
                        }`}
                        title={col}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-mono text-black/40">Suggested:</span>
                  {SUGGESTED_FOLDER_NAMES.slice(0, 2).map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setNewFolderName(sugg)}
                      className="text-[9px] font-medium underline text-black/70 hover:text-black cursor-pointer"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Folder Chips Slider */}
          <div id="folders-bar" className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {/* All Notes Chip */}
            <button
              id="folder-tab-all"
              data-testid="folder-tab-all"
              type="button"
              onClick={() => setSelectedFolderId(null)}
              className={`text-[11px] font-bold px-2.5 py-1 border-2 whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer rounded-sm ${
                selectedFolderId === null
                  ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-black border-black/20 hover:border-black hover:bg-stone-50"
              }`}
            >
              <Folder className="w-3 h-3" />
              <span>All Notes</span>
              <span className={`text-[9px] px-1 py-0.2 rounded-full font-black ${selectedFolderId === null ? "bg-white text-black" : "bg-black/10 text-black"}`}>
                {folderCounts.total}
              </span>
            </button>

            {/* Custom Folders */}
            {currentFolders.map((folder) => {
              const isSelected = selectedFolderId === folder.id;
              const count = folderCounts.counts[folder.id] || 0;
              const colStyle = FOLDER_COLOR_STYLES[folder.color || "indigo"] || FOLDER_COLOR_STYLES.indigo;

              return (
                <button
                  key={folder.id}
                  id={`folder-tab-${folder.id}`}
                  data-testid={`folder-tab-${folder.id}`}
                  type="button"
                  onClick={() => setSelectedFolderId(isSelected ? null : folder.id)}
                  className={`text-[11px] font-bold px-2.5 py-1 border-2 rounded-sm whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? `${colStyle.activeBg} border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`
                      : `${colStyle.pillBg} ${colStyle.pillText} ${colStyle.pillBorder} hover:border-black`
                  }`}
                >
                  <FolderOpen className={`w-3 h-3 ${isSelected ? "text-white" : colStyle.iconColor}`} />
                  <span>{folder.name}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded-full font-black ${isSelected ? "bg-white text-black" : "bg-black/10 text-black"}`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Unfiled Chip */}
            <button
              id="folder-tab-unfiled"
              data-testid="folder-tab-unfiled"
              type="button"
              onClick={() => setSelectedFolderId(selectedFolderId === "unfiled" ? null : "unfiled")}
              className={`text-[11px] font-bold px-2.5 py-1 border-2 whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer rounded-sm ${
                selectedFolderId === "unfiled"
                  ? "bg-neutral-800 text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-neutral-50 text-neutral-600 border-dashed border-black/25 hover:border-black hover:text-black"
              }`}
              title="Notes not assigned to any folder"
            >
              <span>Unfiled</span>
              <span className={`text-[9px] px-1 py-0.2 rounded-full font-black ${selectedFolderId === "unfiled" ? "bg-white text-black" : "bg-black/10 text-black"}`}>
                {folderCounts.unfiled}
              </span>
            </button>
          </div>

          {/* Active Folder Subheader Banner (with Edit & Delete options) */}
          {activeFolder && (
            <div className="mt-2.5 p-2 bg-[#FFF9E6] border-2 border-black rounded flex items-center justify-between gap-2 text-xs shadow-2xs">
              {editingFolderId === activeFolder.id ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="text"
                    value={editingFolderName}
                    onChange={(e) => setEditingFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEditFolder(activeFolder.id);
                      if (e.key === "Escape") setEditingFolderId(null);
                    }}
                    className="flex-1 bg-white border border-black px-1.5 py-0.5 text-xs font-bold"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveEditFolder(activeFolder.id)}
                    className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingFolderId(null)}
                    className="text-black text-xs hover:text-red-500 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FolderOpen className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span className="font-bold text-black uppercase truncate text-[11px]">
                      Folder: {activeFolder.name}
                    </span>
                    <span className="text-[10px] font-mono text-black/60 shrink-0 font-bold">
                      ({folderCounts.counts[activeFolder.id] || 0} {folderCounts.counts[activeFolder.id] === 1 ? "note" : "notes"})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFolderId(activeFolder.id);
                        setEditingFolderName(activeFolder.name);
                        setEditingFolderColor(activeFolder.color || "indigo");
                      }}
                      className="p-1 hover:bg-black/10 rounded text-black/70 hover:text-black cursor-pointer"
                      title="Rename folder"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFolder(activeFolder.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-600 cursor-pointer"
                      title="Delete folder (notes stay in vault as unfiled)"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFolderId(null)}
                      className="text-[10px] font-bold text-black/70 hover:text-black underline cursor-pointer ml-1"
                    >
                      Show All
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Selection Mode Action Bar */}
        {isSelectionMode && (
          <div className="bg-[#FFF4E0] border-3 border-black p-2.5 mb-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-1.5 text-xs font-black uppercase text-black hover:text-indigo-600 cursor-pointer"
              >
                <span className="w-4 h-4 border-2 border-black flex items-center justify-center bg-white">
                  {allFilteredSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
                <span>{allFilteredSelected ? "Deselect All" : "Select All"}</span>
              </button>
              <span className="text-[10px] font-bold text-black/60 bg-black/10 px-1.5 py-0.5 rounded">
                {selectedIds.size} of {filtered.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsBulkFolderModalOpen(true)}
                disabled={selectedIds.size === 0}
                className="bg-white hover:bg-amber-100 disabled:opacity-40 text-black border-2 border-black px-2 py-1 text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer shadow-2xs transition-all active:translate-x-0.5 active:translate-y-0.5"
                title="Move selected notes to a study folder"
              >
                <Folder className="w-3 h-3 text-amber-600" />
                <span>Move</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBulkTagModalOpen(true)}
                disabled={selectedIds.size === 0}
                className="bg-white hover:bg-pink-100 disabled:opacity-40 text-black border-2 border-black px-2 py-1 text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer shadow-2xs transition-all active:translate-x-0.5 active:translate-y-0.5"
                title="Tag selected notes"
              >
                <Tag className="w-3 h-3 text-pink-600" />
                <span>Tag</span>
              </button>

              <button
                type="button"
                onClick={handleBulkDeleteAction}
                disabled={selectedIds.size === 0}
                className="bg-[#FF6B6B] hover:bg-red-400 disabled:opacity-40 text-black border-2 border-black px-2 py-1 text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer shadow-2xs transition-all active:translate-x-0.5 active:translate-y-0.5"
                title="Delete selected notes"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Bulk Folder Modal */}
        {isBulkFolderModalOpen && (
          <div className="bg-amber-50 border-3 border-black p-3 mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-amber-600" />
                <span>Move {selectedIds.size} note{selectedIds.size > 1 ? "s" : ""} to folder:</span>
              </span>
              <button
                onClick={() => setIsBulkFolderModalOpen(false)}
                className="text-black hover:text-red-500 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-2.5 max-h-40 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => handleBulkMove(null)}
                className="p-1.5 text-left bg-white hover:bg-neutral-100 border border-black rounded text-[11px] font-bold text-neutral-800 flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">Unfiled (No folder)</span>
              </button>
              {currentFolders.map((f) => {
                const col = FOLDER_COLOR_STYLES[f.color || "indigo"] || FOLDER_COLOR_STYLES.indigo;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleBulkMove(f.id)}
                    className={`p-1.5 text-left border rounded text-[11px] font-bold flex items-center justify-between cursor-pointer ${col.pillBg} ${col.pillText} ${col.pillBorder} hover:border-black`}
                  >
                    <span className="truncate flex items-center gap-1">
                      <Folder className="w-3 h-3 shrink-0" />
                      <span>{f.name}</span>
                    </span>
                    <span className="text-[9px] font-mono text-black/50 ml-1">
                      {folderCounts.counts[f.id] || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick create and move */}
            <div className="pt-2 border-t border-black/15 flex gap-1.5">
              <input
                type="text"
                value={bulkNewFolderName}
                onChange={(e) => setBulkNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && bulkNewFolderName.trim()) {
                    const created = handleCreateFolder(bulkNewFolderName);
                    if (created) {
                      handleBulkMove(created.id);
                      setBulkNewFolderName("");
                    }
                  }
                }}
                placeholder="Or create new folder and move..."
                className="flex-1 bg-white border border-black px-2 py-1 text-xs font-bold text-black outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (bulkNewFolderName.trim()) {
                    const created = handleCreateFolder(bulkNewFolderName);
                    if (created) {
                      handleBulkMove(created.id);
                      setBulkNewFolderName("");
                    }
                  }
                }}
                disabled={!bulkNewFolderName.trim()}
                className="bg-black hover:bg-indigo-600 disabled:opacity-50 text-white font-black text-[10px] uppercase px-2.5 py-1 border border-black cursor-pointer shadow-2xs"
              >
                Create & Move
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
                className="bg-black hover:bg-indigo-600 disabled:opacity-50 text-white font-black text-xs uppercase px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-colors"
              >
                Apply
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[9px] font-bold text-gray-600 uppercase flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                <span>Suggested:</span>
              </span>
              {bulkSuggestedTags.map((sugg) => (
                <button
                  key={sugg}
                  onClick={() => setBulkTagInput(sugg)}
                  className="text-[10px] font-bold bg-white border border-black px-1.5 py-0.5 hover:bg-pink-100 cursor-pointer shadow-2xs hover:scale-105 active:scale-95 transition-all"
                  title={`Suggest tag: ${sugg}`}
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

                      {/* Note Folder Pill & Dropdown Picker */}
                      {(() => {
                        const noteFolder = item.folderId
                          ? currentFolders.find((f) => f.id === item.folderId)
                          : null;
                        const isPickerOpen = activeFolderPickerNoteId === item.id;
                        const colStyle = noteFolder
                          ? FOLDER_COLOR_STYLES[noteFolder.color || "indigo"] || FOLDER_COLOR_STYLES.indigo
                          : null;

                        return (
                          <div className="relative folder-picker-container">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFolderPickerNoteId(isPickerOpen ? null : item.id);
                              }}
                              className={`text-[10px] font-bold px-2 py-0.5 border rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                                noteFolder
                                  ? `${colStyle?.pillBg} ${colStyle?.pillText} ${colStyle?.pillBorder} hover:border-black`
                                  : "bg-stone-50 hover:bg-stone-100 text-stone-600 border-dashed border-stone-300 hover:border-stone-500"
                              }`}
                              title={
                                noteFolder
                                  ? `Folder: ${noteFolder.name} (Click to change)`
                                  : "Assign to study folder"
                              }
                            >
                              <Folder className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[90px]">
                                {noteFolder ? noteFolder.name : "Folder"}
                              </span>
                              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                            </button>

                            {/* Dropdown Menu for Folder Assignment */}
                            {isPickerOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-0 top-full mt-1 w-52 bg-white border-2 border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-40 p-2 text-xs font-sans animate-fadeIn"
                              >
                                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-black/15">
                                  <span className="text-[10px] font-black uppercase text-black flex items-center gap-1">
                                    <Folder className="w-3 h-3 text-amber-600" />
                                    <span>Move to Folder</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setActiveFolderPickerNoteId(null)}
                                    className="text-black hover:text-red-500 cursor-pointer p-0.5"
                                  >
                                    <X className="w-3 h-3 stroke-[2.5]" />
                                  </button>
                                </div>

                                <div className="space-y-1 max-h-44 overflow-y-auto pr-0.5">
                                  {/* Unfiled option */}
                                  <button
                                    type="button"
                                    onClick={() => handleAssignNoteToFolder(item.id, null)}
                                    className={`w-full text-left px-2 py-1 rounded text-[11px] font-bold flex items-center justify-between cursor-pointer transition-colors ${
                                      !item.folderId
                                        ? "bg-black text-white"
                                        : "hover:bg-black/5 text-black"
                                    }`}
                                  >
                                    <span>None (Unfiled)</span>
                                    {!item.folderId && <Check className="w-3 h-3 stroke-[3]" />}
                                  </button>

                                  {/* Folders list */}
                                  {currentFolders.map((f) => {
                                    const isCurrent = item.folderId === f.id;
                                    const col =
                                      FOLDER_COLOR_STYLES[f.color || "indigo"] ||
                                      FOLDER_COLOR_STYLES.indigo;
                                    return (
                                      <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => handleAssignNoteToFolder(item.id, f.id)}
                                        className={`w-full text-left px-2 py-1 rounded text-[11px] font-bold flex items-center justify-between cursor-pointer transition-colors ${
                                          isCurrent
                                            ? `${col.activeBg}`
                                            : "hover:bg-black/5 text-black"
                                        }`}
                                      >
                                        <span className="flex items-center gap-1.5 truncate">
                                          <span
                                            className={`w-2 h-2 rounded-full shrink-0 ${
                                              f.color === "emerald"
                                                ? "bg-emerald-500"
                                                : f.color === "amber"
                                                ? "bg-amber-500"
                                                : f.color === "rose"
                                                ? "bg-rose-500"
                                                : f.color === "purple"
                                                ? "bg-purple-500"
                                                : f.color === "blue"
                                                ? "bg-blue-500"
                                                : f.color === "stone"
                                                ? "bg-stone-500"
                                                : "bg-indigo-500"
                                            }`}
                                          />
                                          <span className="truncate">{f.name}</span>
                                        </span>
                                        {isCurrent && <Check className="w-3 h-3 stroke-[3]" />}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Quick inline new folder in picker */}
                                <div className="mt-2 pt-1.5 border-t border-black/15">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveFolderPickerNoteId(null);
                                      setIsCreatingFolder(true);
                                      document
                                        .getElementById("history-folders-section")
                                        ?.scrollIntoView({ behavior: "smooth" });
                                    }}
                                    className="w-full text-center text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 py-1 rounded border border-indigo-200 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <Plus className="w-3 h-3 stroke-[3]" />
                                    <span>Create New Folder</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
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
                    {highlightKeywordMatch(item.title, search)}
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
                                #{highlightKeywordMatch(tag, search)}
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

                        {/* Quick Tag Suggestions Analyzed From Note Content */}
                        {(() => {
                          const autoSuggestions = analyzeNoteContentForTags({
                            title: item.title,
                            outputMarkdown: item.outputMarkdown,
                            inputPrompt: item.inputPrompt,
                            routeDetected: item.routeDetected,
                            existingTags: item.tags || [],
                            maxSuggestions: 8,
                          });

                          return (
                            <div className="pt-1.5 border-t border-black/15">
                              <div className="flex items-center justify-between text-[9px] font-black uppercase text-black/70 mb-1">
                                <span className="flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                                  <span>Suggested for this note:</span>
                                </span>
                                <span className="text-[8px] font-mono text-gray-500 lowercase">
                                  {item.routeDetected === "chef" ? "ingredients & diet" : "classes & topics"}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1">
                                {autoSuggestions.map((sugg) => {
                                  const icon =
                                    sugg.category === "class"
                                      ? "🎓"
                                      : sugg.category === "ingredient"
                                      ? "🥦"
                                      : sugg.category === "diet"
                                      ? "⚡"
                                      : "📌";
                                  return (
                                    <button
                                      key={sugg.tag}
                                      type="button"
                                      onClick={() => handleAddTagToItem(item.id, sugg.tag)}
                                      className="text-[9px] font-bold bg-white hover:bg-[#ec4899] hover:text-white border border-black/40 px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 group/sugg shadow-2xs hover:scale-105 active:scale-95"
                                      title={`Add "${sugg.tag}" (${sugg.categoryLabel} detected in note content)`}
                                    >
                                      <span className="text-[8px]">{icon}</span>
                                      <span>+{sugg.tag}</span>
                                    </button>
                                  );
                                })}

                                {autoSuggestions.length === 0 &&
                                  DEFAULT_SUGGESTED_TAGS.slice(0, 4).map((sugg) => (
                                    <button
                                      key={sugg}
                                      type="button"
                                      onClick={() => handleAddTagToItem(item.id, sugg)}
                                      className="text-[9px] font-bold bg-white hover:bg-[#ec4899] hover:text-white border border-black/40 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                                    >
                                      +{sugg}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          );
                        })()}
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

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadItemPdf(item);
                          }}
                          disabled={downloadingPdfId === item.id}
                          className="bg-white hover:bg-black/5 text-black border border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center gap-1"
                          title="Export and download as PDF file"
                        >
                          {downloadingPdfId === item.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent animate-spin rounded-full" />
                          ) : (
                            <FileDown className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          <span className="text-[10px] font-bold">PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareItem(item);
                          }}
                          className="bg-white hover:bg-black/5 text-black border border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center gap-1"
                          title="Send to other apps via Web Share API"
                        >
                          <Share2 className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-[10px] font-bold">SHARE</span>
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

      {/* Share Modal */}
      {sharingItem && (
        <ShareModal
          isOpen={Boolean(sharingItem)}
          onClose={() => setSharingItem(null)}
          options={{
            title:
              (sharingItem.outputMarkdown.split("\n")[0] || "").replace(
                /^[#\s🍳DORMCHEF:🧠UNTANGLEDNOTES]+/,
                ""
              ).trim() || "Saved Untangle",
            markdown: sharingItem.outputMarkdown,
            routeDetected: sharingItem.routeDetected,
            url: typeof window !== "undefined" ? window.location.href : "",
          }}
        />
      )}
    </div>
  );
};

