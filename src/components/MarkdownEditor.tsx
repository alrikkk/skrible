import React, { useRef, useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Eye,
  Edit3,
  Columns,
  RotateCcw,
  Check,
  Bookmark,
  X,
  FileText,
} from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  originalValue: string;
  onSaveToVault: () => void;
  isSaved: boolean;
  onClose: () => void;
  routeDetected: "notes" | "chef";
  renderPreview: (content: string) => React.ReactNode;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  originalValue,
  onSaveToVault,
  isSaved,
  onClose,
  routeDetected,
  renderPreview,
}) => {
  const [viewMode, setViewMode] = useState<"edit" | "split" | "preview">("split");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [justCopied, setJustCopied] = useState(false);

  const isModified = value !== originalValue;

  // Text statistics
  const stats = useMemo(() => {
    const trimmed = value.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = value.length;
    const lines = value.split("\n").length;
    return { words, chars, lines };
  }, [value]);

  // Insert markdown syntax helper
  const insertFormat = (prefix: string, suffix: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const replacement = selectedText ? `${prefix}${selectedText}${suffix}` : `${prefix}${placeholder}${suffix}`;

    const newValue = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start, start + replacement.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
      }
    }, 0);
  };

  // Keyboard shortcut handling (Tab for 2-space indent, Cmd+B / Ctrl+B for bold, Cmd+I for italic)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMac = typeof navigator !== "undefined" && navigator.userAgent.includes("Mac");
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = textarea.value.substring(0, start) + "  " + textarea.value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    } else if (modKey && e.key.toLowerCase() === "b") {
      e.preventDefault();
      insertFormat("**", "**", "bold text");
    } else if (modKey && e.key.toLowerCase() === "i") {
      e.preventDefault();
      insertFormat("*", "*", "italic text");
    }
  };

  const handleResetToOriginal = () => {
    if (window.confirm("Revert your manual changes back to the original AI-generated output?")) {
      onChange(originalValue);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="border border-[#ec4899]/40 rounded-2xl bg-[#FCFAF8] dark:bg-[#1A1A1E] shadow-sm mb-6 overflow-hidden"
    >
      {/* Top Header & View Mode Switcher */}
      <div className="bg-[#FAF6F2] dark:bg-[#222226] border-b border-black/10 dark:border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#ec4899] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-black dark:text-white uppercase tracking-tight">
                Refine Markdown
              </span>
              {isModified ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700">
                  Edited
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60 font-medium">
                  Original
                </span>
              )}
            </div>
          </div>
        </div>

        {/* View Mode Controls: Write | Split | Preview */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#2C2C32] border border-black/10 dark:border-white/10 rounded-xl p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode("edit")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === "edit"
                ? "bg-black dark:bg-white text-white dark:text-black shadow-2xs"
                : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5"
            }`}
            title="Write mode: Focus only on markdown text"
          >
            <Edit3 className="w-3 h-3" />
            <span>Write</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === "split"
                ? "bg-black dark:bg-white text-white dark:text-black shadow-2xs"
                : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5"
            }`}
            title="Split mode: Edit side-by-side with live formatted preview"
          >
            <Columns className="w-3 h-3" />
            <span>Split</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === "preview"
                ? "bg-black dark:bg-white text-white dark:text-black shadow-2xs"
                : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5"
            }`}
            title="Preview mode: View fully rendered result"
          >
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {isModified && (
            <button
              type="button"
              onClick={handleResetToOriginal}
              className="flex items-center gap-1 bg-white dark:bg-[#2C2C32] hover:bg-red-50 dark:hover:bg-red-950/40 text-black/70 dark:text-white/70 hover:text-red-700 border border-black/10 dark:border-white/10 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-2xs"
              title="Discard edits and revert to AI generated output"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden md:inline">Revert</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSaveToVault}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs ${
              isSaved
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300"
                : "bg-[#ec4899] hover:bg-[#db2777] text-white border border-[#ec4899]"
            }`}
            title="Save your refined markdown to the vault"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span>{isSaved ? "Saved to Vault" : "Save to Vault"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 bg-white dark:bg-[#2C2C32] hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white border border-black/15 dark:border-white/15 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs"
            title="Exit edit mode and return to main view"
          >
            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
            <span>Done</span>
          </button>
        </div>
      </div>

      {/* Formatting Tools Ribbon (when editing) */}
      {viewMode !== "preview" && (
        <div className="bg-white/80 dark:bg-[#1E1E22] border-b border-black/10 dark:border-white/10 px-4 py-1.5 flex flex-wrap items-center gap-1 text-black/70 dark:text-white/70">
          <button
            type="button"
            onClick={() => insertFormat("**", "**", "bold text")}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat("*", "*", "italic text")}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            title="Italic (*text*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1" />
          <button
            type="button"
            onClick={() => insertFormat("\n## ", "\n", "Section Title")}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-colors cursor-pointer text-xs font-bold"
            title="Heading 2 (## Title)"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat("\n### ", "\n", "Subheading")}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-colors cursor-pointer text-xs font-bold"
            title="Heading 3 (### Title)"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1" />
          <button
            type="button"
            onClick={() => insertFormat("\n- ", "", "list item")}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            title="Bullet List (- item)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat("\n- [ ] ", "", "task item")}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            title="Checkbox (- [ ] task)"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat("\n> ", "", "quote")}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            title="Blockquote (> quote)"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat("`", "`", "code")}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            title="Inline Code (`code`)"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat("\n\n---\n\n", "")}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            title="Horizontal Rule (---)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <span className="ml-auto text-[11px] font-mono text-black/50 dark:text-white/50 hidden md:inline">
            Tab indents • Ctrl+B bold • Ctrl+I italic
          </span>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="p-4">
        {viewMode === "edit" && (
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Refine your markdown notes or recipe here..."
              rows={22}
              className="w-full font-mono text-xs sm:text-sm text-black dark:text-white bg-white dark:bg-[#141416] border border-black/15 dark:border-white/15 rounded-xl p-4 leading-relaxed focus:outline-none focus:border-[#ec4899] focus:ring-1 focus:ring-[#ec4899] resize-y shadow-inner"
              spellCheck={false}
            />
          </div>
        )}

        {viewMode === "split" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Editor */}
            <div className="flex flex-col">
              <div className="text-[11px] font-bold uppercase tracking-wider text-black/50 dark:text-white/50 mb-1.5 flex items-center justify-between">
                <span>Markdown Input</span>
                <span>{stats.lines} lines</span>
              </div>
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Refine your markdown notes or recipe here..."
                rows={22}
                className="w-full flex-1 font-mono text-xs sm:text-sm text-black dark:text-white bg-white dark:bg-[#141416] border border-black/15 dark:border-white/15 rounded-xl p-3.5 leading-relaxed focus:outline-none focus:border-[#ec4899] focus:ring-1 focus:ring-[#ec4899] resize-y shadow-inner"
                spellCheck={false}
              />
            </div>

            {/* Right: Live Preview */}
            <div className="flex flex-col min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-black/50 dark:text-white/50 mb-1.5 flex items-center justify-between">
                <span>Live Rendered Preview</span>
                <span className="text-[#ec4899]">Real-time</span>
              </div>
              <div className="bg-white dark:bg-[#141416] border border-black/15 dark:border-white/15 rounded-xl p-4 overflow-y-auto max-h-[500px] min-h-[300px]">
                {renderPreview(value)}
              </div>
            </div>
          </div>
        )}

        {viewMode === "preview" && (
          <div className="bg-white dark:bg-[#141416] border border-black/15 dark:border-white/15 rounded-xl p-6 overflow-y-auto max-h-[600px]">
            {renderPreview(value)}
          </div>
        )}
      </div>

      {/* Bottom Footer Statistics & Done Action */}
      <div className="bg-[#FAF6F2] dark:bg-[#222226] border-t border-black/10 dark:border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 font-mono text-black/60 dark:text-white/60">
          <span>{stats.words} words</span>
          <span>•</span>
          <span>{stats.chars} characters</span>
          <span>•</span>
          <span>{stats.lines} lines</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white font-medium cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSaveToVault}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-2xs ${
              isSaved
                ? "bg-emerald-600 text-white"
                : "bg-black dark:bg-white text-white dark:text-black hover:bg-[#ec4899] dark:hover:bg-[#ec4899]"
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span>{isSaved ? "Saved in Vault" : "Save Refined Note"}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
