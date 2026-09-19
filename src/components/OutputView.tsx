import React, { useState, useEffect, useRef, useMemo } from "react";
import Markdown from "react-markdown";
import { motion, Variants } from "motion/react";
import { ShoppingChecklist } from "./ShoppingChecklist";
import { RecipeCostD3Chart } from "./RecipeCostD3Chart";
import { RecipeNutritionCard } from "./RecipeNutritionCard";
import { ServingMultiplierBar } from "./ServingMultiplierBar";
import {
  scaleRecipeMarkdown,
  scaleIngredientsList,
  scaleIngredientLine,
} from "../utils/servingScaler";
import {
  RecipeStepTimer,
  ActiveTimerDock,
  ActiveTimerInfo,
  parseCookingTimeFromText,
} from "./RecipeStepTimer";
import { NotionExportModal } from "./NotionExportModal";
import { ShareModal } from "./ShareModal";
import { ExecutiveSummaryCard } from "./ExecutiveSummaryCard";
import { MarkdownEditor } from "./MarkdownEditor";
import {
  isWebShareSupported,
  shareViaWebShare,
  SharePayloadOptions,
} from "../utils/webShare";
import { getAuthHeaders } from "../lib/supabaseClient";
import { NutritionInfo, ExecutiveSummary } from "../types";
import {
  estimateRecipeNutrition,
  estimateIngredientNutrition,
} from "../utils/nutritionEstimator";
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
  BookOpen,
  ShoppingCart,
  HeartPulse,
  Timer,
  Users,
  Flame,
  Pencil,
  Eye,
  Link2,
  Globe,
  Printer,
} from "lucide-react";

interface OutputViewProps {
  markdown: string;
  routeDetected: "notes" | "chef";
  budget?: string;
  isStreaming?: boolean;
  onGenerateFlashcards: (markdown: string) => void;
  onSaveToHistory: (markdown: string, routeDetected: "notes" | "chef", tags?: string[]) => void;
  isSaved: boolean;
  onNewUntangle: () => void;
  onUpdateMarkdown?: (updatedMarkdown: string) => void;
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

const ingredientListContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.065,
      delayChildren: 0.05,
    },
  },
};

const ingredientItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 380,
      damping: 26,
      mass: 0.8,
    },
  },
};

const stepListContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.085,
      delayChildren: 0.06,
    },
  },
};

const stepItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 340,
      damping: 24,
      mass: 0.9,
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
  isStreaming = false,
  onGenerateFlashcards,
  onSaveToHistory,
  isSaved,
  onNewUntangle,
  onUpdateMarkdown,
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isNotionModalOpen, setIsNotionModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [nutritionData, setNutritionData] = useState<NutritionInfo | null>(null);
  const [activeCookingTimer, setActiveCookingTimer] = useState<ActiveTimerInfo | null>(null);
  const [publicShareUrl, setPublicShareUrl] = useState<string | null>(null);
  const [isGeneratingShareUrl, setIsGeneratingShareUrl] = useState<boolean>(false);

  // Manual markdown refinement state
  const [editedMarkdown, setEditedMarkdown] = useState<string>(markdown);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Sync editedMarkdown when upstream markdown changes
  useEffect(() => {
    setEditedMarkdown(markdown);
    setIsEditing(false);
    setPublicShareUrl(null);
  }, [markdown]);

  const handleMarkdownChange = (newVal: string) => {
    setEditedMarkdown(newVal);
    onUpdateMarkdown?.(newVal);
  };

  const activeMarkdown = editedMarkdown;
  const isManuallyEdited = editedMarkdown !== markdown;

  // Executive summary state
  const [summaryData, setSummaryData] = useState<ExecutiveSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSummaryDismissed, setIsSummaryDismissed] = useState(false);

  // Categorization tags state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [isAddingCustomTag, setIsAddingCustomTag] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const prevStreamingRef = useRef<boolean>(false);
  const hasAutoScrolledForNoteRef = useRef<boolean>(false);

  // Initialize tags and reset nutrition data & active timer when new content arrives or streaming completes
  useEffect(() => {
    if (!isStreaming) {
      setSelectedTags([routeDetected === "chef" ? "Recipe" : "Study Note"]);
      setNutritionData(null);
      setActiveCookingTimer(null);
      setSummaryData(null);
      setIsLoadingSummary(false);
      setSummaryError(null);
      setIsSummaryDismissed(false);
    }
  }, [isStreaming, routeDetected]);

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

  // Smooth scroll-to-view behavior that triggers automatically AFTER the AI finishes streaming the response
  useEffect(() => {
    const wasStreaming = prevStreamingRef.current;
    const isNowStreaming = isStreaming;

    // Trigger condition 1: AI was streaming and just finished (!isStreaming && wasStreaming was true)
    const justFinishedStreaming = wasStreaming && !isNowStreaming && Boolean(markdown.trim());

    // Trigger condition 2: New markdown content was loaded without streaming (e.g. from history vault, preset, or peer share link)
    const freshlyLoadedNonStream = !isNowStreaming && !wasStreaming && Boolean(markdown.trim()) && !hasAutoScrolledForNoteRef.current;

    if (justFinishedStreaming || freshlyLoadedNonStream) {
      hasAutoScrolledForNoteRef.current = true;

      // Small timeout to allow DOM and layout calculators (charts, markdown parser) to paint completely
      const scrollTimer = window.setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 150);

      prevStreamingRef.current = isNowStreaming;
      return () => window.clearTimeout(scrollTimer);
    }

    // Reset auto-scroll tracker whenever a new streaming session starts
    if (isNowStreaming) {
      hasAutoScrolledForNoteRef.current = false;
    }

    prevStreamingRef.current = isNowStreaming;
  }, [isStreaming, markdown]);

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
    const cleanText = activeMarkdown
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
    navigator.clipboard.writeText(displayMarkdown || activeMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        body: JSON.stringify({ text: activeMarkdown }),
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

  // Comprehensive ingredient extractor that extracts all ingredients from recipe outputs
  const extractIngredients = (text: string): string[] => {
    if (!text) return [];
    const lines = text.split("\n");
    const ingredients: string[] = [];
    let inIngredients = false;

    // Pattern for ingredient section headers
    const isIngredientHeader = (line: string): boolean => {
      const trimmed = line.trim();
      if (/^#{1,4}\s+.*(?:ingredient|shopping\s*list|grocery\s*list|items?\s*needed|what\s*(?:you'll|you\s*need)|pantry\s*items?|items?\s*used)/i.test(trimmed)) {
        return true;
      }
      if (/^(?:\*{1,3}|_{1,3})?\s*(?:ingredients?|grocery\s*list|shopping\s*list|items?\s*needed|what\s*you\s*(?:'ll\s*)?need)[:\s]*(?:\*{1,3}|_{1,3})?$/i.test(trimmed)) {
        return true;
      }
      const upper = trimmed.toUpperCase();
      if (
        (trimmed.startsWith("#") || trimmed.startsWith("**")) &&
        (upper.includes("INGREDIENT") || upper.includes("SHOPPING LIST") || upper.includes("GROCERY LIST") || upper.includes("WHAT YOU NEED"))
      ) {
        return true;
      }
      return false;
    };

    // Pattern for section enders (e.g. Instructions, Steps, Directions, Time & Steps)
    const isStopHeader = (line: string): boolean => {
      const trimmed = line.trim();
      if (/^#{1,4}\s+.*(?:instruction|direction|step|method|how\s*to|preparation|cooking|procedure|time\s*&\s*steps?|equipment|notes?|nutrition|tips?)/i.test(trimmed)) {
        return true;
      }
      if (/^(?:\*{1,3}|_{1,3})?\s*(?:instructions?|directions?|steps?|method|procedure|preparation|time\s*&\s*steps?)[:\s]*(?:\*{1,3}|_{1,3})?$/i.test(trimmed)) {
        return true;
      }
      return false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (isIngredientHeader(line)) {
        inIngredients = true;
        continue;
      }

      if (inIngredients) {
        if (isStopHeader(line)) {
          break;
        }

        if (ingredients.length > 0 && /^#{1,3}\s+[^#]/.test(line)) {
          break;
        }

        // Handle table row: | Ingredient | Amount | Price |
        if (line.startsWith("|") && line.endsWith("|")) {
          const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
          if (cells.length >= 1 && !cells[0].includes("---")) {
            const firstCellLower = cells[0].toLowerCase();
            if (!firstCellLower.includes("ingredient") && !firstCellLower.includes("item")) {
              const combined = cells.join(" — ");
              if (combined) ingredients.push(combined);
            }
          }
          continue;
        }

        // Handle bullet items, numbered items, task items: - , * , + , 1. , - [ ]
        if (
          line.startsWith("- ") ||
          line.startsWith("* ") ||
          line.startsWith("+ ") ||
          line.startsWith("• ") ||
          /^\d+[\.)]\s+/.test(line)
        ) {
          const clean = line
            .replace(/^[-*+•\d.)]+\s*/, "")
            .replace(/^\[[ xX]?\]\s*/, "")
            .replace(/\*\*/g, "")
            .trim();

          const lower = clean.toLowerCase();
          if (
            clean &&
            !lower.startsWith("prep time") &&
            !lower.startsWith("cook time") &&
            !lower.startsWith("total time") &&
            !lower.startsWith("estimated cost") &&
            !lower.startsWith("total recipe cost") &&
            !lower.startsWith("cost per serving") &&
            !lower.startsWith("remaining budget") &&
            !lower.startsWith("servings:")
          ) {
            ingredients.push(clean);
          }
        }
      }
    }

    // Fallback: If no explicit ingredients heading was found but text is a recipe
    if (
      ingredients.length === 0 &&
      (routeDetected === "chef" ||
        text.includes("DORM CHEF") ||
        text.includes("🍳") ||
        text.includes("COST BREAKDOWN") ||
        text.includes("Cost Per Serving") ||
        /recipe/i.test(text))
    ) {
      let inList = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (isStopHeader(trimmed) || (inList && /^\d+\.\s+/.test(trimmed))) {
          if (inList) break;
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("+ ")) {
          const clean = trimmed
            .replace(/^[-*+]\s*/, "")
            .replace(/^\[[ xX]?\]\s*/, "")
            .replace(/\*\*/g, "")
            .trim();
          const lower = clean.toLowerCase();

          if (
            clean &&
            !lower.includes("estimated cost") &&
            !lower.includes("total recipe cost") &&
            !lower.includes("cost per serving") &&
            !lower.includes("remaining budget") &&
            !lower.includes("prep time") &&
            !lower.includes("cook time") &&
            !lower.includes("servings")
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

  const ingredientsList = extractIngredients(activeMarkdown);
  const chefStats = routeDetected === "chef" ? extractChefStats(activeMarkdown) : null;
  const parsedServings = chefStats?.servings
    ? parseInt(chefStats.servings.replace(/[^0-9]/g, ""), 10) || null
    : null;

  const baseServings = parsedServings && parsedServings > 0 ? parsedServings : 1;
  const [currentServings, setCurrentServings] = useState<number>(baseServings);

  // Synchronize baseServings when recipe content changes
  useEffect(() => {
    setCurrentServings(parsedServings && parsedServings > 0 ? parsedServings : 1);
  }, [activeMarkdown, parsedServings]);

  const servingMultiplier = baseServings > 0 ? currentServings / baseServings : 1.0;
  const isServingModified = Math.abs(servingMultiplier - 1) > 0.01;

  // Recalculated ingredients list with updated measurements and prices
  const scaledIngredientsList = useMemo(() => {
    return scaleIngredientsList(ingredientsList, servingMultiplier);
  }, [ingredientsList, servingMultiplier]);

  // Recalculated recipe markdown with updated ingredient quantities in the ingredient section
  const displayMarkdown = useMemo(() => {
    return scaleRecipeMarkdown(activeMarkdown, servingMultiplier);
  }, [activeMarkdown, servingMultiplier]);

  const rawTotalCostNum = chefStats?.totalCost
    ? parseFloat(chefStats.totalCost.replace(/[^0-9.]/g, ""))
    : null;
  const displayTotalCost =
    rawTotalCostNum !== null && isServingModified
      ? `$${(rawTotalCostNum * servingMultiplier).toFixed(2)}`
      : chefStats?.totalCost;

  // Extract recipe title if available for grocery list naming
  const firstLine = activeMarkdown.split("\n")[0] || "";
  const recipeTitle =
    firstLine.replace(/^[#\s🍳DORMCHEF:🧠UNTANGLEDNOTES]+/, "").trim() || "Recipe";

  // Real-time automatic estimated nutritional breakdown calculated from ingredients list and portion multiplier
  const autoNutrition = useMemo(() => {
    return estimateRecipeNutrition(scaledIngredientsList, currentServings, recipeTitle);
  }, [scaledIngredientsList, currentServings, recipeTitle]);

  const activeNutrition = nutritionData || autoNutrition;

  // Share options payload for Web Share API and native app integrations
  const sharePayloadOptions: SharePayloadOptions = useMemo(
    () => ({
      title: recipeTitle,
      markdown: displayMarkdown,
      routeDetected,
      url: publicShareUrl || (typeof window !== "undefined" ? window.location.href : ""),
      recipeStats: chefStats
        ? {
            costPerServing: chefStats.costPerServing,
            totalCost: displayTotalCost,
            servings: currentServings,
          }
        : undefined,
      currentServings,
      nutrition: activeNutrition
        ? {
            caloriesPerServing: activeNutrition.caloriesPerServing,
            proteinGrams: activeNutrition.proteinGrams,
            carbsGrams: activeNutrition.carbsGrams,
            fatGrams: activeNutrition.fatGrams,
          }
        : undefined,
    }),
    [
      recipeTitle,
      displayMarkdown,
      routeDetected,
      publicShareUrl,
      chefStats,
      displayTotalCost,
      currentServings,
      activeNutrition,
    ]
  );

  // Word count and estimated reading time complexity statistics
  const readingStats = useMemo(() => {
    const rawText = (displayMarkdown || activeMarkdown || "").trim();
    if (!rawText) {
      return {
        words: 0,
        readingTime: "< 1 min read",
        minutes: 0,
        complexity: "Quick",
      };
    }

    // Strip markdown formatting symbols for accurate readable word counting
    const cleanText = rawText
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[.*?\]\(.*?\)/g, " ")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/^[#*>\-\d.]+\s+/gm, " ")
      .replace(/[*_~`]/g, " ")
      .trim();

    const matchedWords = cleanText.match(/\b[\w'-]+\b/g);
    const words = matchedWords ? matchedWords.length : cleanText.split(/\s+/).filter(Boolean).length;

    // Standard reading speed for study notes and recipes: ~200 wpm
    const minutes = Math.max(1, Math.round(words / 200));
    const readingTime = words < 60 ? "< 1 min read" : `${minutes} min read`;

    let complexity: "Bite-sized" | "Standard" | "In-depth" = "Bite-sized";
    if (words > 600) {
      complexity = "In-depth";
    } else if (words >= 200) {
      complexity = "Standard";
    }

    return {
      words,
      readingTime,
      minutes,
      complexity,
    };
  }, [displayMarkdown, activeMarkdown]);

  // Generate unique public URL and open share interface
  const handleShare = async () => {
    let activeUrl = publicShareUrl;

    if (!activeUrl) {
      try {
        setIsGeneratingShareUrl(true);
        const res = await fetch("/api/share-note", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: recipeTitle,
            content: displayMarkdown || activeMarkdown,
            routeDetected,
            budget,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to generate share URL.");
        }

        activeUrl = data.shareUrl;
        setPublicShareUrl(data.shareUrl);

        // Auto copy to clipboard for convenience
        try {
          await navigator.clipboard.writeText(data.shareUrl);
          setShared(true);
          setShareToast("Unique public URL generated & copied to clipboard! Ready to send to peers.");
          setTimeout(() => setShared(false), 3000);
        } catch {
          setShareToast("Unique public URL generated! Ready to share with study peers.");
        }
      } catch (err: any) {
        console.error("Failed to generate share URL:", err);
      } finally {
        setIsGeneratingShareUrl(false);
      }
    }

    // Open the full ShareModal where the unique public URL is prominently presented
    setIsShareModalOpen(true);
  };

  // Helper to extract clean plain text from React nodes (for time parsing)
  const extractPlainText = (node: React.ReactNode): string => {
    if (typeof node === "string" || typeof node === "number") {
      return String(node);
    }
    if (Array.isArray(node)) {
      return node.map(extractPlainText).join(" ");
    }
    if (React.isValidElement(node) && (node.props as any)?.children) {
      return extractPlainText((node.props as any).children);
    }
    return "";
  };

  const handleScrollToStep = (stepNum?: number) => {
    if (!stepNum) return;
    const el = document.getElementById(`recipe-step-${stepNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-[#ec4899]");
      setTimeout(() => el.classList.remove("ring-2", "ring-[#ec4899]"), 1500);
    }
  };

  // Generate concise bulleted executive summary of the content with AI
  const handleSummarize = async () => {
    // If summary is already generated and dismissed, un-dismiss and scroll to it
    if (summaryData && isSummaryDismissed) {
      setIsSummaryDismissed(false);
      setTimeout(() => {
        document
          .getElementById("executive-summary-card")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }

    // If already visible, scroll to it smoothly
    if (summaryData && !isSummaryDismissed) {
      document
        .getElementById("executive-summary-card")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    try {
      setIsLoadingSummary(true);
      setSummaryError(null);
      setIsSummaryDismissed(false);

      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          content: displayMarkdown || activeMarkdown,
          title: recipeTitle || (routeDetected === "chef" ? "Dorm Recipe" : "Untangled Notes"),
          routeDetected,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate executive summary.");
      }

      setSummaryData({
        overview: data.overview,
        bullets: data.bullets || [],
        markdown: data.markdown,
      });

      setTimeout(() => {
        document
          .getElementById("executive-summary-card")
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    } catch (err: any) {
      setSummaryError(err.message || "Failed to generate executive summary.");
    } finally {
      setIsLoadingSummary(false);
    }
  };

  return (
    <motion.div
      ref={containerRef}
      id="untangled-output-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-black/15 rounded-2xl p-6 sm:p-8 shadow-xs mb-8 font-sans scroll-mt-20"
    >
      {/* PRINT-SPECIFIC CLEAN DOCUMENT HEADER */}
      <div className="hidden print:block print-document-header">
        <div className="flex items-center justify-between pb-3 border-b-2 border-black">
          <div>
            <div className="text-2xl font-extrabold tracking-tight font-sans lowercase text-black">
              skrible
            </div>
            <div className="text-xs text-black/60 font-mono mt-0.5">
              / {routeDetected === "chef" ? "dorm chef recipe & budget plan" : "untangled study notes"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono font-medium text-black/80">
              {readingStats.words.toLocaleString()} words • {readingStats.readingTime} read
            </div>
            <div className="text-[10px] font-mono text-black/50 mt-0.5">
              printed from skrible
            </div>
          </div>
        </div>
      </div>
      
      {/* HEADER TOOLBAR */}
      <div id="output-toolbar" className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-black/10 pb-4 mb-6 print:hidden">
        
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30 rounded-full font-semibold text-xs px-3 py-1 flex items-center gap-1.5 shadow-2xs">
            {isStreaming ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ec4899] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ec4899]" />
                </span>
                <span>streaming {routeDetected === "chef" ? "recipe..." : "notes..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{routeDetected === "chef" ? "dorm chef recipe" : "untangled notes"}</span>
              </>
            )}
          </span>

          {/* Word Count & Estimated Reading Time Indicator */}
          <div
            id="reading-stats-indicator"
            className="flex items-center gap-2 bg-[#FAF8F5] border border-black/10 rounded-full px-3 py-1 text-xs text-black/75 font-medium shadow-2xs"
            title={`${readingStats.words.toLocaleString()} words • ${readingStats.readingTime} (based on 200 wpm) • ${readingStats.complexity} complexity`}
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-black/50 shrink-0" />
              <span className="font-semibold text-black">{readingStats.words.toLocaleString()}</span>
              <span className="text-black/60">{readingStats.words === 1 ? "word" : "words"}</span>
            </span>

            <span className="text-black/25 select-none font-bold">•</span>

            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#ec4899] shrink-0" />
              <span className="font-semibold text-black">{readingStats.readingTime}</span>
            </span>

            <span className="text-black/25 select-none font-bold hidden sm:inline">•</span>

            <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-black/5 text-black/60 font-semibold">
              {readingStats.complexity}
            </span>
          </div>

          <span className="text-xs font-mono text-black/40 uppercase hidden xl:inline">
            zero-fluff data
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">

          {/* Edit Markdown Mode Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 border px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98] ${
              isEditing
                ? "bg-[#ec4899] text-white border-[#ec4899]"
                : isManuallyEdited
                ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-bold"
                : "bg-white hover:bg-black/5 text-black border-black/15 hover:border-[#ec4899]"
            }`}
            title={isEditing ? "View rendered output" : "Manually refine markdown notes or recipe before saving to vault"}
          >
            {isEditing ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <Pencil className="w-3.5 h-3.5 text-[#ec4899]" />
            )}
            <span>{isEditing ? "preview" : isManuallyEdited ? "edit (refined)" : "edit markdown"}</span>
          </button>

          {/* AI Summarize Button */}
          <button
            onClick={handleSummarize}
            disabled={isLoadingSummary}
            className={`flex items-center gap-1.5 border px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98] ${
              isLoadingSummary
                ? "bg-black/5 text-black/60 border-black/15 cursor-wait"
                : summaryData && !isSummaryDismissed
                ? "bg-[#ec4899]/10 text-[#ec4899] border-[#ec4899]/40 hover:bg-[#ec4899]/20"
                : "bg-white hover:bg-black/5 text-black border-black/15 hover:border-[#ec4899]"
            }`}
            title="Generate a concise bulleted executive summary of this content with AI"
          >
            {isLoadingSummary ? (
              <div className="w-3.5 h-3.5 border-2 border-[#ec4899] border-t-transparent animate-spin rounded-full" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#ec4899]" />
            )}
            <span>
              {isLoadingSummary
                ? "summarizing..."
                : summaryData && !isSummaryDismissed
                ? "summary active"
                : "summarize"}
            </span>
          </button>
          
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
            disabled={isGeneratingShareUrl}
            className={`flex items-center gap-1.5 border px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98] ${
              shared
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white hover:bg-black/5 text-black border-black/15 hover:border-[#ec4899]"
            }`}
            title="Generate unique public URL to share note with study peers"
          >
            {isGeneratingShareUrl ? (
              <div className="w-3.5 h-3.5 border-2 border-[#ec4899] border-t-transparent animate-spin rounded-full" />
            ) : shared ? (
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-[#ec4899]" />
            )}
            <span>{isGeneratingShareUrl ? "generating link..." : shared ? "link copied!" : "share note"}</span>
          </button>

          {publicShareUrl && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicShareUrl);
                setShared(true);
                setShareToast("Unique public URL copied to clipboard!");
                setTimeout(() => setShared(false), 2500);
              }}
              className="flex items-center gap-1.5 bg-[#ec4899]/10 hover:bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/30 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Copy active public URL to clipboard"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>copy link</span>
            </button>
          )}

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-black/5 text-black border border-black/15 px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Open all sharing & export options (WhatsApp, Telegram, Mail, Twitter, .md file)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-black/60" />
            <span className="hidden sm:inline">send options</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-white hover:bg-black/5 text-black border border-black/15 px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "copied!" : "copy md"}
          </button>

          {/* Print Clean Document Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white hover:bg-black/5 text-black border border-black/15 px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer shadow-2xs hover:border-[#ec4899]"
            title="Print clean document or save to PDF (Ctrl+P / Cmd+P)"
          >
            <Printer className="w-3.5 h-3.5 text-black/60" />
            <span>print</span>
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

          {(routeDetected === "chef" || ingredientsList.length > 0) && (
            <button
              onClick={() => {
                document.getElementById("recipe-servings-bar")?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className={`flex items-center gap-1.5 border px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98] ${
                isServingModified
                  ? "bg-[#ec4899] text-white border-[#ec4899]"
                  : "bg-white hover:bg-black/5 text-black border-black/15"
              }`}
              title="Adjust serving size and automatically recalculate ingredient quantities"
            >
              <Users className="w-3.5 h-3.5" />
              <span>
                {currentServings} {currentServings === 1 ? "serving" : "servings"}
                {isServingModified && ` (${Math.round(servingMultiplier * 100) / 100}x)`}
              </span>
            </button>
          )}

          {ingredientsList.length > 0 && (
            <button
              onClick={() => {
                document.getElementById("recipe-grocery-list")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-1.5 bg-[#ec4899]/10 hover:bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/30 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
              title="Jump to interactive grocery list"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>grocery list ({ingredientsList.length})</span>
            </button>
          )}

          {(routeDetected === "chef" || ingredientsList.length > 0) && (
            <button
              onClick={() => {
                document.getElementById("recipe-nutrition-breakdown")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
              title="Jump to nutritional breakdown & macros"
            >
              <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                nutrition (~{activeNutrition.caloriesPerServing} kcal • {activeNutrition.proteinGrams}g P)
              </span>
            </button>
          )}

          {routeDetected === "chef" && (
            <button
              onClick={() => {
                const firstStep = document.querySelector("[id^='recipe-step-']");
                if (firstStep) {
                  firstStep.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
              title="Jump to recipe cooking steps and countdown timers"
            >
              <Timer className="w-3.5 h-3.5 text-amber-700" />
              <span>cooking timers</span>
            </button>
          )}

          {routeDetected === "notes" && (
            <button
              onClick={() => onGenerateFlashcards(activeMarkdown)}
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
            onClick={() => onSaveToHistory(activeMarkdown, routeDetected, selectedTags)}
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
        markdown={activeMarkdown}
        routeDetected={routeDetected}
      />

      {/* WEB SHARE MODAL */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        options={sharePayloadOptions}
      />

      {/* SHARE SUCCESS TOAST */}
      {shareToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            <span>{shareToast}</span>
          </div>
          <button
            onClick={() => setShareToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* EXECUTIVE SUMMARY CARD */}
      {(!isSummaryDismissed && (summaryData || isLoadingSummary || summaryError)) && (
        <ExecutiveSummaryCard
          summary={summaryData}
          isLoading={isLoadingSummary}
          error={summaryError}
          onRegenerate={() => {
            setSummaryData(null);
            handleSummarize();
          }}
          onDismiss={() => setIsSummaryDismissed(true)}
        />
      )}

      {/* CATEGORIZATION TAGS BAR */}
      <div id="category-tags-bar" className="bg-[#FAF8F5] border border-black/10 rounded-xl p-3 mb-6 flex flex-wrap items-center gap-2 print:hidden">
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

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {chefStats.costPerServing && (
                <span className="bg-[#ec4899] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5" />
                  <span>{chefStats.costPerServing}</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  document.getElementById("recipe-nutrition-breakdown")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="View or estimate calories and macros"
              >
                <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {activeNutrition.caloriesPerServing} kcal • {activeNutrition.proteinGrams}g protein
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {chefStats.costPerServing && (
              <div className="bg-white border border-black/10 rounded-xl p-3 shadow-2xs">
                <span className="text-[10px] text-black/50 font-semibold block mb-0.5">Cost / Serving</span>
                <span className="text-sm sm:text-base font-bold text-[#ec4899]">{chefStats.costPerServing}</span>
              </div>
            )}
            {chefStats.totalCost && (
              <div className="bg-white border border-black/10 rounded-xl p-3 shadow-2xs">
                <span className="text-[10px] text-black/50 font-semibold block mb-0.5">
                  Total Recipe Cost {isServingModified && "(Scaled)"}
                </span>
                <span className="text-sm sm:text-base font-bold text-black flex items-center gap-1.5 flex-wrap">
                  <span>{displayTotalCost}</span>
                  {isServingModified && (
                    <span className="text-[10px] text-black/40 font-mono font-normal">
                      (orig: {chefStats.totalCost})
                    </span>
                  )}
                </span>
              </div>
            )}
            {chefStats.remainingBudget && (
              <div className="bg-white border border-black/10 rounded-xl p-3 shadow-2xs">
                <span className="text-[10px] text-black/50 font-semibold block mb-0.5">Remaining Budget</span>
                <span className="text-sm sm:text-base font-bold text-emerald-700">{chefStats.remainingBudget}</span>
              </div>
            )}
            <div className="bg-white border border-black/10 rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] text-black/50 font-semibold block mb-0.5">Est. Nutrition / Serving</span>
              <span className="text-sm sm:text-base font-bold text-black flex items-center gap-1.5 flex-wrap">
                <span>{activeNutrition.caloriesPerServing} kcal</span>
                <span className="text-[11px] text-emerald-700 font-mono font-semibold">
                  ({activeNutrition.proteinGrams}g P)
                </span>
              </span>
            </div>
            {(chefStats.servings || isServingModified) && (
              <div className="bg-white border border-black/10 rounded-xl p-3 shadow-2xs">
                <span className="text-[10px] text-black/50 font-semibold block mb-0.5">Portion Yield</span>
                <span className="text-sm sm:text-base font-bold text-black flex items-center gap-1 flex-wrap">
                  <span>
                    {currentServings} {currentServings === 1 ? "serving" : "servings"}
                  </span>
                  {isServingModified && (
                    <span className="text-[10px] text-[#ec4899] font-mono font-bold">
                      ({Math.round(servingMultiplier * 100) / 100}x)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SERVING SIZE MULTIPLIER & INGREDIENT RECALCULATOR */}
      {(routeDetected === "chef" || ingredientsList.length > 0) && (
        <div id="recipe-servings-bar" className="mb-6 scroll-mt-24 print:hidden">
          <ServingMultiplierBar
            baseServings={baseServings}
            currentServings={currentServings}
            multiplier={Math.round(servingMultiplier * 100) / 100}
            onServingsChange={(servings) => setCurrentServings(servings)}
            onMultiplierChange={(mult) => {
              const newServings = Math.round(baseServings * mult * 2) / 2;
              setCurrentServings(Math.max(0.5, newServings));
            }}
            onReset={() => setCurrentServings(baseServings)}
            nutritionSummary={{
              caloriesPerServing: activeNutrition.caloriesPerServing,
              proteinGrams: activeNutrition.proteinGrams,
              carbsGrams: activeNutrition.carbsGrams,
              fatGrams: activeNutrition.fatGrams,
            }}
          />
        </div>
      )}

      {/* MANUAL EDIT MODE WORKSPACE */}
      {isEditing && (
        <MarkdownEditor
          value={activeMarkdown}
          onChange={handleMarkdownChange}
          originalValue={markdown}
          onSaveToVault={() => onSaveToHistory(activeMarkdown, routeDetected, selectedTags)}
          isSaved={isSaved}
          onClose={() => setIsEditing(false)}
          routeDetected={routeDetected}
          renderPreview={(content) => (
            <div className="prose max-w-none text-black dark:text-white text-sm leading-relaxed">
              <Markdown>{content}</Markdown>
            </div>
          )}
        />
      )}

      {/* REFINEMENT NOTICE (when edited but not currently in full edit view) */}
      {!isEditing && isManuallyEdited && (
        <div className="mb-5 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <Pencil className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold">Manual refinements active.</span>
            <span className="text-amber-700 dark:text-amber-400 hidden sm:inline">• Saving now will store your refined content in the vault</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="underline hover:no-underline font-bold text-amber-950 dark:text-amber-100 cursor-pointer"
            >
              Resume editing
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleMarkdownChange(markdown)}
              className="text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 underline hover:no-underline cursor-pointer"
            >
              Revert to original
            </button>
          </div>
        </div>
      )}

      {/* RAW MARKDOWN DISPLAY BOX WITH CLEAN PAPER STYLING & STAGGERED REVEAL ANIMATIONS */}
      <motion.div
        key={`${activeMarkdown.slice(0, 50)}-servings-${currentServings}`}
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
            h2: ({ children }) => {
              const textContent = extractPlainText(children);
              const isIngredientSection = /ingredient/i.test(textContent);
              const isStepSection = /instruction|step|direction|method|cooking|prep/i.test(textContent);

              return (
                <motion.h2
                  variants={itemRevealVariants}
                  className={`text-lg font-bold text-black border-l-4 pl-3 py-1 mt-6 mb-3 flex items-center justify-between gap-2 rounded-r-lg ${
                    isIngredientSection
                      ? "border-emerald-500 bg-emerald-50/50"
                      : isStepSection
                      ? "border-[#ec4899] bg-pink-50/40"
                      : "border-[#ec4899]"
                  }`}
                >
                  <span className="flex-1 min-w-0">{children}</span>
                  {isIngredientSection && (
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      {isServingModified && (
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#ec4899]/15 text-[#ec4899] font-bold border border-[#ec4899]/30">
                          {Math.round(servingMultiplier * 100) / 100}x Scaled
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold tracking-wider border border-emerald-300/70">
                        Pantry & Grocery
                      </span>
                    </div>
                  )}
                  {isStepSection && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-pink-100 text-[#ec4899] font-bold tracking-wider border border-[#ec4899]/30 shrink-0">
                      Cook Steps
                    </span>
                  )}
                </motion.h2>
              );
            },
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
                variants={ingredientListContainerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-2.5 my-4 pl-0 list-none"
              >
                {children}
              </motion.ul>
            ),
            li: ({ children, ...props }: any) => {
              const textContent = extractPlainText(children);
              const detectedTime = parseCookingTimeFromText(textContent);
              const isRecipeStep =
                props.isOrderedStep ||
                (routeDetected === "chef" && detectedTime !== null);

              if (isRecipeStep) {
                return (
                  <motion.li
                    id={props.stepIndex ? `recipe-step-${props.stepIndex}` : undefined}
                    variants={stepItemVariants}
                    whileHover={{ scale: 1.006, transition: { duration: 0.15 } }}
                    className="flex flex-col bg-[#FAF8F5] border border-black/15 hover:border-black/30 p-3.5 sm:p-4 rounded-xl font-medium text-sm text-black/90 transition-all shadow-2xs scroll-mt-24 group"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {props.stepIndex ? (
                          <span className="bg-black text-white px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono tracking-tight shrink-0 mt-0.5 flex items-center gap-1 shadow-2xs">
                            <Utensils className="w-3 h-3 text-[#ec4899]" />
                            <span>Step {props.stepIndex}</span>
                          </span>
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full bg-[#ec4899] mt-2 shrink-0" />
                        )}
                        <div className="flex-1 leading-relaxed text-black/90">{children}</div>
                      </div>

                      {/* Detected time pill if present */}
                      {detectedTime && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-black/60 bg-black/5 px-2 py-0.5 rounded-md shrink-0 self-start border border-black/10">
                          <Clock className="w-3 h-3 text-[#ec4899]" />
                          <span>{detectedTime.label}</span>
                        </span>
                      )}
                    </div>

                    {/* Integrated Countdown Timer Button & Controls */}
                    <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between gap-2 flex-wrap">
                      <RecipeStepTimer
                        stepNumber={props.stepIndex}
                        stepText={textContent}
                        onTimerChange={(info) => setActiveCookingTimer(info)}
                      />
                    </div>
                  </motion.li>
                );
              }

              // Calculate original quantity if this item is scaled
              const origScaleInfo = isServingModified
                ? scaleIngredientLine(textContent, 1 / servingMultiplier)
                : null;

              // Calculate item nutrition estimate
              const ingNutrition =
                routeDetected === "chef" ? estimateIngredientNutrition(textContent) : null;

              return (
                <motion.li
                  variants={ingredientItemVariants}
                  whileHover={{ scale: 1.006, transition: { duration: 0.15 } }}
                  className="flex items-start gap-3 bg-[#FAF8F5] border border-black/10 hover:border-black/25 p-3.5 rounded-xl font-medium text-sm text-black/90 transition-colors shadow-2xs"
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-[#ec4899] mt-2 shrink-0" />
                  <div className="flex-1 flex items-center justify-between gap-2 flex-wrap">
                    <span className="leading-relaxed">{children}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {ingNutrition && ingNutrition.calories > 0 && (
                        <span
                          className="text-[10px] font-mono text-black/60 bg-white border border-black/15 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 font-semibold"
                          title={`Estimated: ~${ingNutrition.calories} kcal, ${ingNutrition.proteinGrams}g protein, ${ingNutrition.carbsGrams}g carbs, ${ingNutrition.fatGrams}g fat`}
                        >
                          <Flame className="w-2.5 h-2.5 text-orange-500" />
                          ~{ingNutrition.calories} kcal
                        </span>
                      )}
                      {isServingModified && origScaleInfo?.wasScaled && origScaleInfo?.scaledQuantity && (
                        <span className="text-[11px] font-mono text-[#ec4899] bg-[#ec4899]/10 border border-[#ec4899]/25 px-1.5 py-0.5 rounded inline-flex items-center gap-1 font-semibold">
                          orig: {origScaleInfo.scaledQuantity}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.li>
              );
            },
            ol: ({ children }) => {
              const items = React.Children.toArray(children);
              return (
                <motion.ol
                  variants={stepListContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3.5 my-4 pl-0 list-none"
                >
                  {items.map((child, index) => {
                    if (React.isValidElement(child)) {
                      return React.cloneElement(child as React.ReactElement<any>, {
                        stepIndex: index + 1,
                        isOrderedStep: true,
                      });
                    }
                    return child;
                  })}
                </motion.ol>
              );
            },
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
          {displayMarkdown}
        </Markdown>
        {isStreaming && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-dashed border-black/10 text-xs text-black/60">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ec4899] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ec4899]" />
            </span>
            <span className="font-mono font-medium text-[#ec4899]">Untangling and streaming response...</span>
          </div>
        )}
      </motion.div>

      {/* DORM CHEF NUTRITIONAL PROFILE & MACROS ESTIMATION CARD */}
      {(routeDetected === "chef" || ingredientsList.length > 0) && (
        <RecipeNutritionCard
          recipeText={displayMarkdown}
          ingredients={scaledIngredientsList}
          servingsCount={currentServings}
          recipeTitle={recipeTitle}
          initialNutrition={nutritionData || autoNutrition}
          onNutritionLoaded={(data) => setNutritionData(data)}
        />
      )}

      {/* DORM CHEF D3 RECIPE COST CATEGORY BREAKDOWN CHART */}
      {(routeDetected === "chef" || ingredientsList.length > 0) &&
        (Boolean(budget && budget.trim().length > 0) || Boolean(chefStats?.remainingBudget)) && (
          <RecipeCostD3Chart
            ingredients={scaledIngredientsList}
            totalCost={displayTotalCost}
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

      {/* RECIPE CHECKBOX-BASED GROCERY LIST */}
      {scaledIngredientsList.length > 0 && (
        <div id="recipe-grocery-list" className="scroll-mt-6">
          <ShoppingChecklist
            ingredients={scaledIngredientsList}
            recipeTitle={`${recipeTitle}${isServingModified ? ` (${currentServings} Servings)` : ""}`}
          />
        </div>
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

      {/* FLOATING ACTIVE COOKING TIMER DOCK */}
      <ActiveTimerDock
        activeTimer={activeCookingTimer}
        onScrollToStep={handleScrollToStep}
        onDismiss={() => setActiveCookingTimer(null)}
      />

    </motion.div>
  );
};
