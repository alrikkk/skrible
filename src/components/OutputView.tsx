import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { motion, Variants } from "motion/react";
import { ShoppingChecklist } from "./ShoppingChecklist";
import { RecipeCostD3Chart } from "./RecipeCostD3Chart";
import { NotionExportModal } from "./NotionExportModal";
import { getAuthHeaders } from "../lib/supabaseClient";
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  Headphones,
  Layers,
  Bookmark,
  Share2,
  Mail,
  Download,
  Sparkles,
  Zap,
  RotateCcw,
  Tag,
  Plus,
  ExternalLink,
  Send,
  DollarSign,
  Receipt,
  Utensils,
  Clock,
} from "lucide-react";

interface OutputViewProps {
  markdown: string;
  routeDetected: "notes" | "chef";
  budget?: string;
  onGenerateFlashcards: (markdown: string) => void;
  onSaveToHistory: (markdown: string, routeDetected: "notes" | "chef", tags?: string[]) => void;
  isSaved: boolean;
  onNewUntangle: () => void;
}

interface ChefStats {
  totalCost: string | null;
  costPerServing: string | null;
  remainingBudget: string | null;
  servings: string | null;
  prepTime: string | null;
}

const extractChefStats = (text: string): ChefStats | null => {
  if (!text) return null;
  const isChef =
    text.includes("DORM CHEF") ||
    text.includes("🍳") ||
    text.includes("COST BREAKDOWN") ||
    text.includes("COST & SERVING") ||
    text.includes("Cost Per Serving");
  if (!isChef) return null;

  const totalCostMatch = text.match(
    /(?:Total Recipe Cost|Total Estimated Cost|Estimated Cost|Total Cost):\s*(\$?[0-9.]+)/i
  );
  const costPerServingMatch = text.match(
    /Cost Per Serving:\s*(\$?[0-9.]+(?:\s*\/\s*serving)?(?:\s*\([^)]+\))?)/i
  );
  const budgetMatch = text.match(/Remaining Budget:\s*(\$?[0-9.]+)/i);
  const servingsMatch = text.match(/(?:Servings|Yield):\s*([0-9]+(?:\s*servings?)?)/i);
  const prepTimeMatch = text.match(/(?:Prep Time):\s*([0-9]+\s*(?:minutes|mins|min)?)/i);

  const totalCost = totalCostMatch
    ? totalCostMatch[1].startsWith("$")
      ? totalCostMatch[1]
      : `$${totalCostMatch[1]}`
    : null;
  const costPerServing = costPerServingMatch
    ? costPerServingMatch[1].startsWith("$")
      ? costPerServingMatch[1]
      : `$${costPerServingMatch[1]}`
    : null;
  const remainingBudget = budgetMatch
    ? budgetMatch[1].startsWith("$")
      ? budgetMatch[1]
      : `$${budgetMatch[1]}`
    : null;
  const servings = servingsMatch ? servingsMatch[1] : null;
  const prepTime = prepTimeMatch ? prepTimeMatch[1] : null;

  if (!totalCost && !costPerServing && !remainingBudget) return null;

  return {
    totalCost,
    costPerServing,
    remainingBudget,
    servings,
    prepTime,
  };
};

const PRESET_TAGS = [
  "Important",
  "Study Note",
  "Recipe",
  "Exam Prep",
  "Quick Meal",
  "Formula",
  "Cheat Sheet",
  "High Priority",
];

const markdownContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

const itemRevealVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

export const OutputView: React.FC<OutputViewProps> = ({
  markdown,
  routeDetected,
  budget,
  onGenerateFlashcards,
  onSaveToHistory,
  isSaved,
  onNewUntangle,
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isNotionModalOpen, setIsNotionModalOpen] = useState(false);

  // Categorization tags state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [isAddingCustomTag, setIsAddingCustomTag] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize tags based on route when new content arrives
  useEffect(() => {
    setSelectedTags([routeDetected === "chef" ? "Recipe" : "Study Note"]);
  }, [markdown, routeDetected]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
    }
    setCustomTagInput("");
    setIsAddingCustomTag(false);
  };

  // Smooth scroll into view when new markdown content is received
  useEffect(() => {
    if (markdown && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [markdown]);

  // Clean speech synthesis on unmount or when markdown changes
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [markdown]);

  // Web Speech API Read Aloud
  const handleReadAloud = () => {
    if (!('speechSynthesis' in window)) {
      alert("Web Speech API is not supported in this browser.");
      return;
    }

    if (isSpeaking || window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Strip markdown tags for smooth natural narration
    const cleanText = markdown
      .replace(/#{1,6}\s+/g, '') // strip headers
      .replace(/[*_~`]/g, '') // strip emphasis & code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // strip link tags
      .replace(/>\s+/g, '') // strip blockquotes
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel(); // clear previous queue
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Copy Markdown
  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Web Share API for Social Sharing
  const handleShare = async () => {
    const title = routeDetected === "chef" ? "Skrible Dorm Chef Recipe" : "Skrible Untangled Notes";
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: markdown,
          url: window.location.href,
        });
      } catch (err) {
        // User aborted share or share failed
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${title}\n\n${markdown}`);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        alert("Sharing not supported on this browser.");
      }
    }
  };

  // Mailto Email Share
  const handleEmailShare = () => {
    const subject = encodeURIComponent(
      routeDetected === "chef" ? "Dorm Chef Recipe via Skrible" : "Untangled Notes via Skrible"
    );
    const body = encodeURIComponent(
      `Hey! Check out these ${routeDetected === "chef" ? "dorm recipe ideas" : "untangled study notes"} from Skrible:\n\n${markdown}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Play Gemini TTS Audio
  const handleTTS = async () => {
    if (isPlayingAudio && audioElement) {
      audioElement.pause();
      setIsPlayingAudio(false);
      return;
    }

    try {
      setIsLoadingAudio(true);
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ text: markdown }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate audio readout.");
      }

      if (data.audio) {
        const audioSrc = `data:audio/wav;base64,${data.audio}`;
        const audio = new Audio(audioSrc);
        setAudioElement(audio);

        audio.onended = () => setIsPlayingAudio(false);
        audio.play();
        setIsPlayingAudio(true);
      }
    } catch (err: any) {
      alert(err.message || "Failed to generate audio readout.");
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Extract ingredients list if route is chef or contains ingredients
  const extractIngredients = (text: string): string[] => {
    if (!text) return [];
    const lines = text.split("\n");
    const ingredients: string[] = [];
    let inIngredients = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const upper = line.toUpperCase();

      // Detect header indicating ingredients
      if (
        upper.includes("INGREDIENT") ||
        upper.includes("SHOPPING LIST") ||
        upper.includes("GROCERY LIST") ||
        upper.includes("PANTRY") ||
        upper.includes("WHAT YOU NEED") ||
        upper.includes("ITEMS USED")
      ) {
        inIngredients = true;
        continue;
      }

      // If in ingredients section and encounter next major heading
      if (inIngredients && (line.startsWith("# ") || line.startsWith("## ") || line.startsWith("### "))) {
        break;
      }

      if (inIngredients && (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("+ ") || /^\d+\.\s+/.test(line))) {
        const item = line.replace(/^[-*+\d.]+\s*/, "").replace(/\*\*/g, "").trim();
        const lower = item.toLowerCase();
        if (
          item &&
          !lower.startsWith("prep time") &&
          !lower.startsWith("cook time") &&
          !lower.startsWith("total time") &&
          !lower.startsWith("estimated cost")
        ) {
          ingredients.push(item);
        }
      }
    }

    // Fallback: If no explicit ingredients heading was found but route is chef, find bulleted items
    if (ingredients.length === 0 && (routeDetected === "chef" || text.includes("DORM CHEF") || text.includes("🍳"))) {
      let inList = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const clean = trimmed.replace(/^[-*]\s*/, "").replace(/\*\*/g, "").trim();
          const lower = clean.toLowerCase();
          if (
            clean &&
            !lower.includes("estimated cost") &&
            !lower.includes("remaining budget") &&
            !lower.includes("prep time") &&
            !lower.includes("cook time")
          ) {
            ingredients.push(clean);
            inList = true;
          }
        } else if (inList && trimmed.startsWith("## ")) {
          break;
        }
      }
    }

    return ingredients;
  };

  const ingredientsList = routeDetected === "chef" ? extractIngredients(markdown) : [];
  const chefStats = routeDetected === "chef" ? extractChefStats(markdown) : null;

  return (
    <motion.div
      ref={containerRef}
      key={markdown.slice(0, 60) + "_" + routeDetected}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-black/15 rounded-2xl p-6 sm:p-8 shadow-xs mb-8 font-sans scroll-mt-6"
    >
      
      {/* HEADER TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-black/10 pb-4 mb-6">
        
        <div className="flex items-center gap-2">
          <span className="bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30 rounded-full font-semibold text-xs px-3 py-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{routeDetected === "chef" ? "dorm chef recipe" : "untangled notes"}</span>
          </span>
          <span className="text-xs font-mono text-black/50 uppercase">
            zero-fluff data
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          
          <button
            onClick={handleReadAloud}
            className={`flex items-center gap-1.5 border px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              isSpeaking
                ? "bg-[#ec4899] text-white border-[#ec4899] animate-pulse"
                : "bg-white hover:bg-black/5 text-black border-black/15 hover:border-[#ec4899]"
            }`}
            title="Listen to untangled note read aloud"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#ec4899]" />}
            <span>{isSpeaking ? "Stop" : "Listen"}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 bg-white hover:bg-black/5 text-black border border-black/15 px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer"
            title="Share with friends"
          >
            <Share2 className="w-3.5 h-3.5" />
            {shared ? "copied!" : "share"}
          </button>

          <button
            onClick={handleEmailShare}
            className="flex items-center gap-1.5 bg-white hover:bg-black/5 text-black border border-black/15 px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer"
            title="Email note/recipe via mailto:"
          >
            <Mail className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Share</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-white hover:bg-black/5 text-black border border-black/15 px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "copied!" : "copy md"}
          </button>

          <button
            onClick={handleTTS}
            disabled={isLoadingAudio}
            className="flex items-center gap-1.5 bg-white hover:bg-black/5 text-black border border-black/15 px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer"
          >
            {isLoadingAudio ? (
              <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent animate-spin rounded-full" />
            ) : isPlayingAudio ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
            {isPlayingAudio ? "stop audio" : "listen audio"}
          </button>

          {routeDetected === "notes" && (
            <button
              onClick={() => onGenerateFlashcards(markdown)}
              className="flex items-center gap-1.5 bg-[#ec4899] hover:bg-[#db2777] text-white border border-[#ec4899] px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Layers className="w-3.5 h-3.5" /> flashcards
            </button>
          )}

          <button
            onClick={() => setIsNotionModalOpen(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-stone-50 text-black border border-black/15 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs hover:border-[#ec4899]"
            title="Export to Notion page or webhook"
          >
            <Send className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Export to Notion</span>
          </button>

          <button
            onClick={() => onSaveToHistory(markdown, routeDetected, selectedTags)}
            disabled={isSaved}
            className={`flex items-center gap-1.5 border px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              isSaved
                ? "bg-black/5 text-black/40 border-black/10 cursor-default"
                : "bg-black hover:bg-[#ec4899] text-white border-black cursor-pointer shadow-xs"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            {isSaved ? "saved" : "save to vault"}
          </button>

        </div>
      </div>

      {/* NOTION EXPORT MODAL */}
      <NotionExportModal
        isOpen={isNotionModalOpen}
        onClose={() => setIsNotionModalOpen(false)}
        markdown={markdown}
        routeDetected={routeDetected}
      />

      {/* CATEGORIZATION TAGS BAR */}
      <div className="bg-[#FAF8F5] border border-black/10 rounded-xl p-3 mb-6 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-black/70 mr-1 shrink-0">
          <Tag className="w-3.5 h-3.5 text-[#ec4899]" />
          <span>Categorize:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 flex-1">
          {Array.from(new Set([...PRESET_TAGS, ...selectedTags])).map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#ec4899] text-white border-[#ec4899] font-semibold shadow-2xs"
                    : "bg-white text-black/70 border-black/15 hover:border-black/30 hover:bg-black/5 font-medium"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                <span>{tag}</span>
              </button>
            );
          })}

          {isAddingCustomTag ? (
            <form onSubmit={handleAddCustomTag} className="inline-flex items-center gap-1">
              <input
                type="text"
                autoFocus
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                placeholder="tag name..."
                className="text-xs px-2 py-0.5 border border-[#ec4899] rounded-lg focus:outline-none bg-white text-black w-24"
              />
              <button
                type="submit"
                className="text-[11px] bg-[#ec4899] text-white px-2 py-0.5 rounded-lg font-semibold cursor-pointer"
              >
                add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCustomTag(false)}
                className="text-[11px] bg-black/10 text-black px-1.5 py-0.5 rounded-lg cursor-pointer hover:bg-black/20"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingCustomTag(true)}
              className="text-xs px-2 py-1 rounded-lg border border-dashed border-black/20 text-black/60 hover:text-black hover:border-black/40 hover:bg-white font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>custom tag</span>
            </button>
          )}
        </div>
      </div>

      {/* CHEF RECEIPT & COST PER SERVING HIGHLIGHT BANNER */}
      {chefStats && (
        <div className="mb-6 bg-[#FAF8F5] border border-black/15 rounded-2xl p-4 sm:p-5 shadow-xs font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-3.5 mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-black tracking-tight flex items-center gap-1.5">
                  <span>receipt breakdown & serving economics</span>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/5 text-black/60 border border-black/10">
                    auto-calculated
                  </span>
                </h4>
                <p className="text-xs text-black/60 font-medium">
                  Parsed ingredient pricing per portion & cost per serving.
                </p>
              </div>
            </div>

            {chefStats.costPerServing && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="bg-[#ec4899] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5" />
                  <span>{chefStats.costPerServing}</span>
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {chefStats.costPerServing && (
              <div className="bg-white border border-black/10 rounded-xl p-3 shadow-2xs">
                <span className="text-[10px] text-black/50 font-semibold block mb-0.5">Cost / Serving</span>
                <span className="text-sm sm:text-base font-bold text-[#ec4899]">{chefStats.costPerServing}</span>
              </div>
            )}
            {chefStats.totalCost && (
              <div className="bg-white border border-black/10 rounded-xl p-3 shadow-2xs">
                <span className="text-[10px] text-black/50 font-semibold block mb-0.5">Total Recipe Cost</span>
                <span className="text-sm sm:text-base font-bold text-black">{chefStats.totalCost}</span>
              </div>
            )}
            {chefStats.remainingBudget && (
              <div className="bg-white border border-black/10 rounded-xl p-3 shadow-2xs">
                <span className="text-[10px] text-black/50 font-semibold block mb-0.5">Remaining Budget</span>
                <span className="text-sm sm:text-base font-bold text-emerald-700">{chefStats.remainingBudget}</span>
              </div>
            )}
            {chefStats.servings && (
              <div className="bg-white border border-black/10 rounded-xl p-3 shadow-2xs">
                <span className="text-[10px] text-black/50 font-semibold block mb-0.5">Portion Yield</span>
                <span className="text-sm sm:text-base font-bold text-black">{chefStats.servings}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RAW MARKDOWN DISPLAY BOX WITH CLEAN PAPER STYLING & STAGGERED REVEAL ANIMATIONS */}
      <motion.div
        variants={markdownContainerVariants}
        initial="hidden"
        animate="visible"
        className="prose max-w-none text-black"
      >
        <Markdown
          components={{
            h1: ({ children }) => (
              <motion.h1
                variants={itemRevealVariants}
                className="text-2xl sm:text-3xl font-bold text-black border-b border-black/15 pb-2.5 my-4"
              >
                {children}
              </motion.h1>
            ),
            h2: ({ children }) => (
              <motion.h2
                variants={itemRevealVariants}
                className="text-lg font-bold text-black border-l-3 border-[#ec4899] pl-3 py-0.5 mt-6 mb-3"
              >
                {children}
              </motion.h2>
            ),
            h3: ({ children }) => (
              <motion.h3
                variants={itemRevealVariants}
                className="text-base font-bold text-black mt-4 mb-2"
              >
                {children}
              </motion.h3>
            ),
            ul: ({ children }) => (
              <motion.ul
                variants={markdownContainerVariants}
                className="space-y-2.5 my-4 pl-0 list-none"
              >
                {children}
              </motion.ul>
            ),
            li: ({ children }) => (
              <motion.li
                variants={itemRevealVariants}
                className="flex items-start gap-3 bg-[#FAF8F5] border border-black/10 p-3.5 rounded-xl font-medium text-sm text-black/90"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-[#ec4899] mt-2 shrink-0" />
                <div className="flex-1">{children}</div>
              </motion.li>
            ),
            ol: ({ children }) => (
              <motion.ol
                variants={markdownContainerVariants}
                className="space-y-2.5 my-4 pl-0 list-none"
              >
                {children}
              </motion.ol>
            ),
            p: ({ children }) => (
              <motion.p
                variants={itemRevealVariants}
                className="text-sm sm:text-base font-normal leading-relaxed my-3 text-black/80"
              >
                {children}
              </motion.p>
            ),
            blockquote: ({ children }) => (
              <motion.blockquote
                variants={itemRevealVariants}
                className="border-l-4 border-black/20 pl-4 py-1 my-3 text-black/70 italic text-sm"
              >
                {children}
              </motion.blockquote>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-black bg-[#ec4899]/15 px-1.5 py-0.5 rounded text-xs">
                {children}
              </strong>
            ),
          }}
        >
          {markdown}
        </Markdown>
      </motion.div>

      {/* DORM CHEF D3 RECIPE COST CATEGORY BREAKDOWN CHART */}
      {(routeDetected === "chef" || ingredientsList.length > 0) &&
        (Boolean(budget && budget.trim().length > 0) || Boolean(chefStats?.remainingBudget)) && (
          <RecipeCostD3Chart
            ingredients={ingredientsList}
            totalCost={chefStats?.totalCost}
            budget={
              budget ||
              (chefStats?.remainingBudget && chefStats?.totalCost
                ? (
                    parseFloat(chefStats.totalCost.replace(/[^0-9.]/g, "") || "0") +
                    parseFloat(chefStats.remainingBudget.replace(/[^0-9.]/g, "") || "0")
                  ).toFixed(2)
                : null)
            }
            remainingBudget={chefStats?.remainingBudget}
          />
        )}

      {/* DORM CHEF SHOPPING CHECKLIST */}
      {(routeDetected === "chef" || ingredientsList.length > 0) && ingredientsList.length > 0 && (
        <ShoppingChecklist ingredients={ingredientsList} />
      )}

      {/* NEW UNTANGLE FOOTER */}
      <div className="mt-8 pt-4 border-t border-black/10 flex justify-end">
        <button
          onClick={onNewUntangle}
          className="bg-black text-white hover:bg-[#ec4899] px-5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" /> untangle something else
        </button>
      </div>

    </motion.div>
  );
};
