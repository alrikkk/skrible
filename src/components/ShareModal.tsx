import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Mail,
  Send,
  ExternalLink,
  Sparkles,
  Smartphone,
  Laptop,
  CheckCheck,
  FileText,
  MessageSquare,
  Globe,
  Users,
  Link2,
  FileDown,
} from "lucide-react";
import { downloadNotePdf } from "../utils/pdfExport";
import {
  isWebShareSupported,
  shareViaWebShare,
  formatShareableText,
  createMarkdownFile,
  getAppShareLinks,
  SharePayloadOptions,
} from "../utils/webShare";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: SharePayloadOptions;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, options }) => {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSharingNative, setIsSharingNative] = useState(false);
  const [nativeShareSuccess, setNativeShareSuccess] = useState<string | null>(null);
  const [nativeShareError, setNativeShareError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"formatted" | "markdown">("formatted");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  if (!isOpen) return null;

  const hasNativeShare = isWebShareSupported();
  const cleanTitle = options.title.replace(/^[#\s🍳DORMCHEF:🧠UNTANGLEDNOTES]+/, "").trim() || "Recipe / Note";
  const isChef = options.routeDetected === "chef";
  const shareableText = formatShareableText(options);
  const appLinks = getAppShareLinks(options);
  const shareUrl = options.url || (typeof window !== "undefined" ? window.location.href : "");

  // Native Web Share Trigger
  const handleNativeShare = async (includeFile = false) => {
    setIsSharingNative(true);
    setNativeShareError(null);
    setNativeShareSuccess(null);

    const result = await shareViaWebShare(options, includeFile);
    setIsSharingNative(false);

    if (result.success) {
      setNativeShareSuccess("Sent to your selected app!");
      setTimeout(() => setNativeShareSuccess(null), 3000);
    } else if (result.method === "aborted") {
      // User canceled, no error needed
    } else {
      setNativeShareError(
        result.error || "Web Share API was unable to open the native app sheet in this browser frame. Use the quick app buttons below!"
      );
    }
  };

  // Copy Plain Text formatted for messages
  const handleCopyFormattedText = async () => {
    try {
      await navigator.clipboard.writeText(shareableText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Copy Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Download Markdown file
  const handleDownloadMarkdown = () => {
    const file = createMarkdownFile(cleanTitle, options.markdown);
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download PDF file
  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      await downloadNotePdf({
        title: cleanTitle,
        markdown: options.markdown,
        routeDetected: options.routeDetected,
        servings: options.currentServings,
        nutrition: options.nutrition
          ? {
              calories: options.nutrition.caloriesPerServing,
              protein: options.nutrition.proteinGrams,
              carbs: options.nutrition.carbsGrams,
              fat: options.nutrition.fatGrams,
              estimatedCost: options.recipeStats?.totalCost,
            }
          : undefined,
      });
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 2500);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white border-2 border-black rounded-2xl w-full max-w-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 border-black bg-[#FAF8F5]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-black tracking-tight flex items-center gap-1.5">
                  <span>Send to Other Apps</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold border border-indigo-200">
                    Web Share API
                  </span>
                </h3>
                <p className="text-xs text-black/60">
                  {isChef ? "Share recipe with roommates or family" : "Send untangled notes to your study apps"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-black/60 hover:text-black p-1.5 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {/* Premier Action: Unique Public Link for Study Peers */}
            <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Public View-Only Link for Students</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
                  <span>View-Only (No Edit Access)</span>
                </span>
              </div>

              <p className="text-xs text-black/75 mb-3 leading-relaxed">
                Other students can open this unique public URL to read and study your untangled note without editing access. They can also practice cram flashcards or save a personal copy to their own vault.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="flex-1 w-full flex items-center bg-[#FAF8F5] border-2 border-black rounded-xl px-3 py-2 text-xs font-mono text-black overflow-hidden shadow-2xs">
                  <Link2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mr-2" />
                  <span className="truncate select-all font-semibold" title={shareUrl}>
                    {shareUrl}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold border-2 border-black transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 active:scale-95 ${
                      copiedLink
                        ? "bg-emerald-600 text-white border-black"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Public Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white hover:bg-blue-50 text-blue-600 border-2 border-black rounded-xl text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center cursor-pointer active:scale-95"
                    title="Open public link in new tab to test peer experience"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Primary Action: Native Device Share Sheet (Web Share API) */}
            <div className="bg-[#FAF8F5] border border-black/15 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <span>Native Device Share Sheet</span>
                </span>
                {hasNativeShare ? (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>API Available</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-black/50 bg-black/5 px-2 py-0.5 rounded-md">
                    Fallback Mode
                  </span>
                )}
              </div>

              <p className="text-xs text-black/70 mb-3">
                Uses the browser's <strong>Web Share API</strong> to open your device's native app drawer. Send directly to WhatsApp, iMessage, Slack, Apple Notes, Google Keep, Notion, or Gmail.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleNativeShare(false)}
                  disabled={isSharingNative}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  <Share2 className="w-4 h-4" />
                  <span>
                    {isSharingNative
                      ? "Opening Share Sheet..."
                      : "Send via Apps (Native Share)"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNativeShare(true)}
                  disabled={isSharingNative}
                  className="bg-white hover:bg-black/5 text-black border border-black/15 py-2.5 px-3.5 rounded-xl text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Share as attached .md markdown file"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-700" />
                  <span>Attach .md File</span>
                </button>
              </div>

              {nativeShareSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2.5 p-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{nativeShareSuccess}</span>
                </motion.div>
              )}

              {nativeShareError && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2.5 p-2 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-xs font-medium"
                >
                  {nativeShareError}
                </motion.div>
              )}
            </div>

            {/* Quick Messaging Apps */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-black/60 block mb-2">
                Quick Send to Popular Apps
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* WhatsApp */}
                <a
                  href={appLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>

                {/* Telegram */}
                <a
                  href={appLinks.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-900 rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Send className="w-4 h-4 text-sky-600" />
                  <span>Telegram</span>
                </a>

                {/* Mail */}
                <a
                  href={appLinks.email}
                  className="flex items-center justify-center gap-2 p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Mail className="w-4 h-4 text-rose-600" />
                  <span>Email</span>
                </a>

                {/* X / Twitter */}
                <a
                  href={appLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-900 rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="font-bold text-xs">𝕏</span>
                  <span>Twitter/X</span>
                </a>
              </div>
            </div>

            {/* Copy & File Actions */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-black/60 block mb-2">
                Copy & Export Tools
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Copy Formatted Text */}
                <button
                  type="button"
                  onClick={handleCopyFormattedText}
                  className="flex items-center justify-center gap-1.5 p-2 bg-white hover:bg-black/5 border border-black/15 rounded-xl text-xs font-semibold text-black transition-all shadow-2xs cursor-pointer"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-black/70" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                {/* Copy Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 p-2 bg-white hover:bg-black/5 border border-black/15 rounded-xl text-xs font-semibold text-black transition-all shadow-2xs cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-3.5 h-3.5 text-black/70" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                {/* Download Markdown */}
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="flex items-center justify-center gap-1.5 p-2 bg-white hover:bg-black/5 border border-black/15 rounded-xl text-xs font-semibold text-black transition-all shadow-2xs cursor-pointer"
                  title="Download .md file to import into Notion, Obsidian, or Notes"
                >
                  <Download className="w-3.5 h-3.5 text-black/70" />
                  <span>Download .md</span>
                </button>

                {/* Download PDF */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className={`flex items-center justify-center gap-1.5 p-2 border rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                    pdfDownloaded
                      ? "bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-400 font-bold"
                      : "bg-white hover:bg-black/5 border-black/15 text-black hover:border-rose-400"
                  }`}
                  title="Export formatted note or recipe to a downloadable PDF file"
                >
                  {isDownloadingPdf ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent animate-spin rounded-full" />
                      <span className="text-rose-600">Exporting...</span>
                    </>
                  ) : pdfDownloaded ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                      <span className="text-rose-800">Saved!</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5 text-rose-600" />
                      <span>Export PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Share Content Preview */}
            <div className="border border-black/10 rounded-xl overflow-hidden bg-[#FAF8F5]">
              <div className="flex items-center justify-between p-2.5 border-b border-black/10 bg-white">
                <span className="text-[11px] font-bold text-black flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Share Preview</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewTab("formatted")}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      previewTab === "formatted"
                        ? "bg-black text-white"
                        : "text-black/60 hover:bg-black/5"
                    }`}
                  >
                    Formatted
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("markdown")}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      previewTab === "markdown"
                        ? "bg-black text-white"
                        : "text-black/60 hover:bg-black/5"
                    }`}
                  >
                    Raw Markdown
                  </button>
                </div>
              </div>

              <div className="p-3 text-xs font-mono text-black/80 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text bg-[#FAF8F5]">
                {previewTab === "formatted" ? shareableText : options.markdown}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t-2 border-black bg-white flex items-center justify-between">
            <span className="text-[11px] text-black/50 font-medium">
              Sends clean zero-fluff data to any installed app.
            </span>
            <button
              onClick={onClose}
              className="bg-black text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-black/80 cursor-pointer shadow-2xs"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
