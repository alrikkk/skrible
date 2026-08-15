import React, { useState, useEffect } from "react";
import { X, Check, ExternalLink, Sparkles, Send, Key, FileText, Globe, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getAuthHeaders } from "../lib/supabaseClient";

interface NotionExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdown: string;
  routeDetected: "notes" | "chef";
}

export const NotionExportModal: React.FC<NotionExportModalProps> = ({
  isOpen,
  onClose,
  markdown,
  routeDetected,
}) => {
  const defaultTitle = routeDetected === "chef" ? "Dorm Chef Recipe - Skrible Note" : "Untangled Notes - Skrible Note";

  const [mode, setMode] = useState<"notion_api" | "webhook">("notion_api");
  const [title, setTitle] = useState(defaultTitle);
  const [notionToken, setNotionToken] = useState("");
  const [pageId, setPageId] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [rememberConfig, setRememberConfig] = useState(true);

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);

  // Load saved configuration from localStorage
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("skrible_notion_token");
      const savedPageId = localStorage.getItem("skrible_notion_page_id");
      const savedWebhook = localStorage.getItem("skrible_notion_webhook");
      const savedMode = localStorage.getItem("skrible_notion_mode");

      if (savedToken) setNotionToken(savedToken);
      if (savedPageId) setPageId(savedPageId);
      if (savedWebhook) setWebhookUrl(savedWebhook);
      if (savedMode === "webhook" || savedMode === "notion_api") setMode(savedMode);
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  // Update default title when route or markdown changes
  useEffect(() => {
    setTitle(defaultTitle);
    setExportSuccess(null);
    setExportError(null);
    setExportedUrl(null);
  }, [markdown, routeDetected]);

  if (!isOpen) return null;

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(null);
    setExportedUrl(null);

    // Save or clear remembered configuration
    try {
      if (rememberConfig) {
        localStorage.setItem("skrible_notion_mode", mode);
        if (notionToken) localStorage.setItem("skrible_notion_token", notionToken);
        if (pageId) localStorage.setItem("skrible_notion_page_id", pageId);
        if (webhookUrl) localStorage.setItem("skrible_notion_webhook", webhookUrl);
      }
    } catch (e) {
      // Ignore localStorage errors
    }

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/export-notion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          mode,
          title: title.trim() || defaultTitle,
          markdown,
          routeDetected,
          notionToken: notionToken.trim(),
          pageId: pageId.trim(),
          webhookUrl: webhookUrl.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to export note to Notion.");
      }

      setExportSuccess(data.message || "Successfully exported to Notion!");
      if (data.pageUrl) {
        setExportedUrl(data.pageUrl);
      }

      // Haptic feedback
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([40, 60, 40]);
      }
    } catch (err: any) {
      setExportError(err.message || "Could not connect to Notion. Please check your credentials.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl border border-black/15 shadow-2xl max-w-lg w-full p-6 relative overflow-hidden font-sans text-black"
        >
          {/* Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#ec4899]" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-black/50 hover:text-black hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-black tracking-tight">Export to Notion</h3>
              <p className="text-xs text-black/60">Push your untangled notes directly into your Notion workspace</p>
            </div>
          </div>

          {/* Integration Mode Switcher */}
          <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-semibold my-4 border border-black/10">
            <button
              type="button"
              onClick={() => {
                setMode("notion_api");
                setExportError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "notion_api"
                  ? "bg-white text-black shadow-2xs font-bold"
                  : "text-black/60 hover:text-black"
              }`}
            >
              <Key className="w-3.5 h-3.5 text-[#ec4899]" />
              <span>Notion API Integration</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("webhook");
                setExportError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "webhook"
                  ? "bg-white text-black shadow-2xs font-bold"
                  : "text-black/60 hover:text-black"
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-[#ec4899]" />
              <span>Webhook (Zapier/Make)</span>
            </button>
          </div>

          {/* Export Form */}
          <form onSubmit={handleExport} className="space-y-4">
            {/* Note Title Input */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-black/70 mb-1">
                Notion Page Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter page title..."
                className="w-full px-3.5 py-2.5 border border-black/15 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#ec4899] bg-stone-50"
                required
              />
            </div>

            {/* DIRECT NOTION API FIELDS */}
            {mode === "notion_api" && (
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-mono font-bold uppercase text-black/70">
                      Integration Token (<span className="normal-case text-pink-600">secret_...</span>)
                    </label>
                  </div>
                  <input
                    type="password"
                    value={notionToken}
                    onChange={(e) => setNotionToken(e.target.value)}
                    placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 border border-black/15 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#ec4899] bg-white"
                    required
                  />
                  <p className="text-[10px] text-black/50 mt-1">
                    Created at <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" className="underline hover:text-[#ec4899]">notion.so/my-integrations</a>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-black/70 mb-1">
                    Parent Page ID or Notion URL
                  </label>
                  <input
                    type="text"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    placeholder="e.g., 32-character ID or page URL"
                    className="w-full px-3.5 py-2.5 border border-black/15 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#ec4899] bg-white"
                    required
                  />
                  <p className="text-[10px] text-black/50 mt-1">
                    Remember to click <strong>"..." → Connect to</strong> on your target Notion page to grant your Integration access.
                  </p>
                </div>
              </div>
            )}

            {/* WEBHOOK FIELDS */}
            {mode === "webhook" && (
              <div className="pt-1">
                <label className="block text-xs font-mono font-bold uppercase text-black/70 mb-1">
                  Webhook Endpoint URL
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/... or https://hook.eu1.make.com/..."
                  className="w-full px-3.5 py-2.5 border border-black/15 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#ec4899] bg-white"
                  required
                />
                <p className="text-[10px] text-black/50 mt-1">
                  Sends JSON payload with <code>title</code>, <code>markdown</code>, and <code>timestamp</code> to your automation workflow.
                </p>
              </div>
            )}

            {/* Remember Credentials Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberNotion"
                checked={rememberConfig}
                onChange={(e) => setRememberConfig(e.target.checked)}
                className="w-4 h-4 rounded text-[#ec4899] focus:ring-[#ec4899] border-gray-300 cursor-pointer"
              />
              <label htmlFor="rememberNotion" className="text-xs text-black/70 font-medium cursor-pointer select-none">
                Remember integration settings for future exports
              </label>
            </div>

            {/* Status Messages */}
            {exportError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-start gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{exportError}</span>
              </div>
            )}

            {exportSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>{exportSuccess}</span>
                </div>
                {exportedUrl && (
                  <a
                    href={exportedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline underline-offset-2"
                  >
                    <span>Open in Notion</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* Action Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-black/70 hover:text-black bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isExporting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-black hover:bg-[#ec4899] rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Pushing to Notion...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Export Now</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
