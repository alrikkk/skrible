import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Bookmark,
  Sparkles,
  Folder,
  FolderPlus,
  Tag,
  Check,
  Plus,
  ArrowRight,
  Brain,
  Lightbulb,
  CheckCircle2,
  FolderCheck,
  Loader2,
  RotateCw,
  SlidersHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StudyFolder } from "../types";
import {
  suggestFolderForNote,
  analyzeNoteWithAI,
  SuggestedTag,
  FolderAnalysisResult,
} from "../utils/tagSuggester";
import { FOLDER_COLOR_STYLES } from "./HistoryDrawer";

interface SaveOrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSave: (selectedTags: string[], selectedFolderId: string | null) => void;
  markdown: string;
  title?: string;
  routeDetected: "notes" | "chef";
  folders: StudyFolder[];
  onCreateFolder?: (name: string, color?: StudyFolder["color"]) => StudyFolder;
  isDark?: boolean;
}

export const SaveOrganizerModal: React.FC<SaveOrganizerModalProps> = ({
  isOpen,
  onClose,
  onConfirmSave,
  markdown,
  title,
  routeDetected,
  folders,
  onCreateFolder,
  isDark = false,
}) => {
  // Synchronous initial analysis for zero-latency UI
  const initialAnalysis = useMemo(() => {
    if (!isOpen || !markdown) return null;
    return suggestFolderForNote({
      title,
      outputMarkdown: markdown,
      routeDetected,
      folders,
    });
  }, [isOpen, markdown, title, routeDetected, folders]);

  // Dynamic analysis state (enriched by AI in background)
  const [analysis, setAnalysis] = useState<FolderAnalysisResult | null>(initialAnalysis);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // Selected tags state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // Selected folder ID (null means Unfiled)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Category filter for tags
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    "all" | "class" | "topic" | "format" | "ingredient" | "diet"
  >("all");

  // New folder creation state
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState("");
  const [newFolderColor, setNewFolderColor] = useState<StudyFolder["color"]>("indigo");
  const [customTagInput, setCustomTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  // On open or when note changes, initialize analysis and run deep AI enrichment
  useEffect(() => {
    if (!isOpen || !markdown) return;

    const base = suggestFolderForNote({
      title,
      outputMarkdown: markdown,
      routeDetected,
      folders,
    });
    setAnalysis(base);

    // Pre-select high-relevance suggested tags
    const initialTags = base.topTags
      .filter((t) => t.relevanceScore >= 60)
      .map((t) => t.tag);
    setSelectedTags(initialTags.length > 0 ? initialTags : base.topTags.slice(0, 3).map((t) => t.tag));

    // Pre-select recommended folder
    if (base.recommendedFolder) {
      setSelectedFolderId(base.recommendedFolder.id);
    } else {
      setSelectedFolderId(null);
    }

    // Run AI content analysis in background to discover nuanced categories
    let isCancelled = false;
    setIsAiAnalyzing(true);

    analyzeNoteWithAI({
      markdownNote: markdown,
      title,
      routeDetected,
      folders,
    })
      .then((aiResult) => {
        if (!isCancelled && aiResult) {
          setAnalysis(aiResult);
          // If user hasn't heavily customized, integrate newly discovered high-yield AI tags
          setSelectedTags((prev) => {
            const added = aiResult.topTags
              .filter((t) => t.relevanceScore >= 75)
              .map((t) => t.tag);
            return Array.from(new Set([...prev, ...added]));
          });

          if (aiResult.recommendedFolder && (!selectedFolderId || selectedFolderId === base.recommendedFolder?.id)) {
            setSelectedFolderId(aiResult.recommendedFolder.id);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) setIsAiAnalyzing(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, markdown, title, routeDetected, folders]);

  const handleReanalyze = () => {
    if (!markdown) return;
    setIsAiAnalyzing(true);
    analyzeNoteWithAI({
      markdownNote: markdown,
      title,
      routeDetected,
      folders,
    })
      .then((res) => {
        setAnalysis(res);
        const top = res.topTags.filter((t) => t.relevanceScore >= 65).map((t) => t.tag);
        setSelectedTags(top);
        if (res.recommendedFolder) setSelectedFolderId(res.recommendedFolder.id);
      })
      .catch(() => {})
      .finally(() => setIsAiAnalyzing(false));
  };

  if (!isOpen || !analysis) return null;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customTagInput.trim();
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags([...selectedTags, clean]);
    }
    setCustomTagInput("");
    setIsAddingTag(false);
  };

  const handleCreateAndSelectSuggestedFolder = (name: string, color?: StudyFolder["color"]) => {
    if (onCreateFolder) {
      const created = onCreateFolder(name, color || "indigo");
      setSelectedFolderId(created.id);
    }
  };

  const handleCreateCustomFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFolderNameInput.trim();
    if (!clean) return;
    if (onCreateFolder) {
      const created = onCreateFolder(clean, newFolderColor);
      setSelectedFolderId(created.id);
      setIsCreatingNewFolder(false);
      setNewFolderNameInput("");
    }
  };

  const handleSave = () => {
    onConfirmSave(selectedTags, selectedFolderId);
    onClose();
  };

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  // Filtered tags for category tab selection
  const displayedTags = analysis.topTags.filter((t) => {
    if (activeCategoryFilter === "all") return true;
    return t.category === activeCategoryFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="relative w-full max-w-xl bg-[#FFFDF9] dark:bg-[#18181B] border-3 border-black dark:border-white/20 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.15)] overflow-hidden my-auto"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black dark:border-white/10 bg-[#FF90E8] dark:bg-[#27272A] text-black dark:text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#FFE600] fill-[#FFE600]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-none uppercase">
                Auto-Tag & Organize Note
              </h2>
              <p className="text-[11px] font-semibold opacity-80 mt-0.5">
                AI analyzed your note and detected relevant categories & folders
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white dark:bg-[#18181B] text-black dark:text-white border-2 border-black dark:border-white/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
            title="Cancel"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Analysis Banner: What was detected */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/50 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center shrink-0 mt-0.5">
                <Brain className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 flex-wrap">
                  <span>Identified Subject:</span>
                  <span className="bg-amber-200/70 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 font-black px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700/60">
                    {analysis.detectedSubject}
                  </span>
                </p>
                <p className="text-amber-800/80 dark:text-amber-300/70 mt-1">
                  {routeDetected === "chef"
                    ? "Detected culinary ingredients, cooking times, and budget meal profile."
                    : "Detected academic keywords, course topic, and study format."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isAiAnalyzing ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-lg animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">AI analyzing...</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleReanalyze}
                  title="Re-analyze content with AI"
                  className="p-1.5 text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Re-analyze</span>
                </button>
              )}
            </div>
          </div>

          {/* SECTION 1: AUTO-DETECTED TAGS & CATEGORIES */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-fuchsia-600" />
                <span>Suggested Categories & Tags ({selectedTags.length} selected)</span>
              </label>

              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedTags(analysis.topTags.map((t) => t.tag))}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-neutral-300 dark:text-neutral-600">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedTags([])}
                  className="text-neutral-500 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 mb-2.5 overflow-x-auto pb-1 text-[11px]">
              {[
                { id: "all", label: "All Tags" },
                { id: "class", label: "🎓 Course/Class" },
                { id: "topic", label: "💡 Topics" },
                { id: "format", label: "📝 Format" },
                ...(routeDetected === "chef"
                  ? [
                      { id: "ingredient", label: "🥦 Ingredients" },
                      { id: "diet", label: "⚡ Diet" },
                    ]
                  : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategoryFilter(tab.id as any)}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeCategoryFilter === tab.id
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-2xs"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tag Pills Grid */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-white dark:bg-[#202024] border-2 border-black/15 dark:border-white/10 rounded-xl">
              {displayedTags.length === 0 ? (
                <span className="text-xs text-neutral-400 py-1">No tags in this category.</span>
              ) : (
                displayedTags.map((tagObj) => {
                  const isSelected = selectedTags.includes(tagObj.tag);
                  return (
                    <button
                      key={tagObj.tag}
                      type="button"
                      onClick={() => toggleTag(tagObj.tag)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border-2 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                        isSelected
                          ? "bg-[#FFE600] text-black border-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          : "bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white"
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-3 h-3 text-black stroke-[3]" />
                      ) : (
                        <span className="text-[10px]">
                          {tagObj.category === "class"
                            ? "🎓"
                            : tagObj.category === "ingredient"
                            ? "🥦"
                            : tagObj.category === "diet"
                            ? "⚡"
                            : tagObj.category === "format"
                            ? "📝"
                            : "💡"}
                        </span>
                      )}
                      <span>{tagObj.tag}</span>
                      <span className="text-[9px] opacity-60 ml-0.5 font-mono">
                        {tagObj.relevanceScore}%
                      </span>
                    </button>
                  );
                })
              )}

              {/* Custom Tag Input */}
              {isAddingTag ? (
                <form onSubmit={handleAddCustomTag} className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    placeholder="Custom tag..."
                    className="text-xs px-2 py-1 border-2 border-fuchsia-500 rounded-lg focus:outline-none bg-white dark:bg-neutral-900 text-black dark:text-white w-28"
                  />
                  <button
                    type="submit"
                    className="text-xs bg-fuchsia-600 text-white px-2 py-1 rounded-lg font-bold hover:bg-fuchsia-700 cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(false)}
                    className="text-xs px-1 text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className="text-xs px-2 py-1 rounded-lg border border-dashed border-neutral-400 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:border-black dark:hover:border-white flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Custom Tag</span>
                </button>
              )}
            </div>
          </div>

          {/* SECTION 2: FOLDER SELECTION & SMART RECOMMENDATION */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-indigo-600" />
                <span>Organize into Folder</span>
              </label>

              {analysis.recommendedFolder && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Best match auto-selected</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
              {/* Option: Unfiled */}
              <button
                type="button"
                onClick={() => setSelectedFolderId(null)}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedFolderId === null
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border-black dark:border-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]"
                    : "bg-white dark:bg-[#202024] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-black/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-neutral-400" />
                  <span className="text-xs">Unfiled (No folder)</span>
                </div>
                {selectedFolderId === null && <Check className="w-4 h-4 text-black dark:text-white stroke-[2.5]" />}
              </button>

              {/* Existing Folders */}
              {folders.map((folder) => {
                const isSelected = selectedFolderId === folder.id;
                const match = analysis.folderMatches.find((m) => m.folder.id === folder.id);
                const isRecommended = match?.isRecommended;
                const style = FOLDER_COLOR_STYLES[folder.color || "indigo"] || FOLDER_COLOR_STYLES.indigo;

                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? "bg-white dark:bg-[#202024] text-black dark:text-white border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)] ring-2 ring-indigo-500/40"
                        : "bg-white dark:bg-[#202024] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-black/40"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2 truncate">
                        <Folder className={`w-4 h-4 ${style.iconColor} shrink-0`} />
                        <span className="text-xs font-bold truncate">{folder.name}</span>
                      </div>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-indigo-600 stroke-[3] shrink-0 ml-1" />
                      ) : null}
                    </div>

                    {isRecommended && match && (
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{match.matchPercentage}% Match</span>
                        </span>
                        <span className="text-neutral-400 truncate max-w-[120px] text-right">
                          {match.matchReason.split("•")[0]}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Smart 1-Click Folder Creation Suggestion */}
            {analysis.suggestedNewFolderName && onCreateFolder && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs text-indigo-900 dark:text-indigo-200">
                    Suggested new folder: <strong>{analysis.suggestedNewFolderName}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleCreateAndSelectSuggestedFolder(
                      analysis.suggestedNewFolderName!,
                      analysis.suggestedNewFolderColor
                    )
                  }
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                  <span>Create & Select</span>
                </button>
              </div>
            )}

            {/* Custom Folder Creator Toggle */}
            {onCreateFolder && (
              <div>
                {!isCreatingNewFolder ? (
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewFolder(true)}
                    className="text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white flex items-center gap-1.5 cursor-pointer mt-1"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ Create custom folder</span>
                  </button>
                ) : (
                  <form
                    onSubmit={handleCreateCustomFolderSubmit}
                    className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-300 dark:border-neutral-700 mt-2 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={newFolderNameInput}
                        onChange={(e) => setNewFolderNameInput(e.target.value)}
                        placeholder="Folder name (e.g. Organic Chemistry)..."
                        className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-black dark:text-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black text-xs font-bold rounded-lg cursor-pointer hover:bg-neutral-800"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingNewFolder(false)}
                        className="text-xs text-neutral-500 hover:text-black p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-neutral-500 font-bold uppercase mr-1">Color:</span>
                      {(["indigo", "emerald", "amber", "rose", "purple", "blue", "stone"] as const).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewFolderColor(c)}
                          className={`w-4 h-4 rounded-full transition-transform ${
                            c === "indigo"
                              ? "bg-indigo-500"
                              : c === "emerald"
                              ? "bg-emerald-500"
                              : c === "amber"
                              ? "bg-amber-500"
                              : c === "rose"
                              ? "bg-rose-500"
                              : c === "purple"
                              ? "bg-purple-500"
                              : c === "blue"
                              ? "bg-blue-500"
                              : "bg-stone-500"
                          } ${newFolderColor === c ? "scale-125 ring-2 ring-black dark:ring-white" : ""}`}
                        />
                      ))}
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="p-4 sm:p-5 border-t-2 border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
            Saving to:{" "}
            <strong>{selectedFolder ? selectedFolder.name : "Unfiled"}</strong> •{" "}
            <span>{selectedTags.length} tag{selectedTags.length === 1 ? "" : "s"}</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider rounded-xl border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span>Save & Organize</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
