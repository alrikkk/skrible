import React, { useState } from "react";
import { motion } from "motion/react";
import Markdown from "react-markdown";
import {
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  X,
  FileText,
  AlertCircle,
} from "lucide-react";
import { ExecutiveSummary } from "../types";

interface ExecutiveSummaryCardProps {
  summary: ExecutiveSummary | null;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
  onDismiss: () => void;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({
  summary,
  isLoading,
  error,
  onRegenerate,
  onDismiss,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    if (!summary) return;
    const textToCopy =
      summary.markdown ||
      `${summary.overview ? `${summary.overview}\n\n` : ""}${summary.bullets
        .map((b) => `• ${b}`)
        .join("\n")}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If not loading, no error, and no summary, don't render anything
  if (!isLoading && !error && (!summary || summary.bullets.length === 0)) {
    return null;
  }

  return (
    <motion.section
      id="executive-summary-card"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="mb-6 bg-[#FAF8F5] dark:bg-[#1C1C1E] border border-black/15 dark:border-white/20 rounded-2xl p-5 sm:p-6 shadow-2xs font-sans relative overflow-hidden"
      aria-label="Executive Summary"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3 pb-3.5 mb-4 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#ec4899]/10 dark:bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-black dark:text-white tracking-tight">
                Executive Summary
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#ec4899]/10 text-[#ec4899] font-bold border border-[#ec4899]/25">
                AI Distilled
              </span>
            </div>
            <p className="text-xs text-black/60 dark:text-white/60 font-medium">
              Concise bulleted synthesis of key takeaways and actionable items
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isLoading && summary && (
            <>
              <button
                type="button"
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 bg-white dark:bg-[#2A2A2E] hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white border border-black/15 dark:border-white/15 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-2xs"
                title="Copy executive summary to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                    <span className="text-emerald-700 dark:text-emerald-400">copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-black/60 dark:text-white/60" />
                    <span>copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onRegenerate}
                className="flex items-center gap-1 bg-white dark:bg-[#2A2A2E] hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white border border-black/15 dark:border-white/15 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-2xs"
                title="Re-generate executive summary"
              >
                <RotateCcw className="w-3 h-3 text-black/60 dark:text-white/60" />
                <span className="hidden sm:inline">refresh</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onDismiss}
            className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss summary"
            aria-label="Dismiss summary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-6 flex flex-col items-center justify-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-[#ec4899] border-t-transparent animate-spin rounded-full" />
            <span className="text-xs font-semibold text-black/80 dark:text-white/80">
              Generating concise executive summary with Gemini...
            </span>
          </div>
          <div className="w-full max-w-md space-y-2 mt-2">
            <div className="h-3 bg-black/5 dark:bg-white/10 rounded-full animate-pulse w-4/5 mx-auto" />
            <div className="h-3 bg-black/5 dark:bg-white/10 rounded-full animate-pulse w-full" />
            <div className="h-3 bg-black/5 dark:bg-white/10 rounded-full animate-pulse w-3/4 mx-auto" />
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              onClick={onRegenerate}
              className="mt-2 text-xs font-bold text-red-900 dark:text-red-200 underline hover:no-underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Content State */}
      {!isLoading && !error && summary && (
        <div className="space-y-3.5">
          {/* High-Level Overview Lead */}
          {summary.overview && (
            <div className="text-sm font-medium text-black/85 dark:text-white/85 leading-relaxed bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3.5 italic">
              {summary.overview}
            </div>
          )}

          {/* Bulleted Points */}
          <ul className="space-y-2.5" role="list">
            {summary.bullets.map((bullet, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-xs sm:text-sm text-black/80 dark:text-white/85 leading-relaxed"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#ec4899] mt-2 shrink-0" />
                <div className="flex-1 [&_strong]:text-black dark:[&_strong]:text-white [&_strong]:font-semibold">
                  <Markdown>{bullet}</Markdown>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.section>
  );
};
