/**
 * Web Share API Utility for Skrible
 * Provides robust native device sharing with automatic fallbacks for notes and recipes.
 */

export interface ShareRecipeStats {
  costPerServing?: string;
  totalCost?: string;
  servings?: string | number;
}

export interface ShareNutritionStats {
  caloriesPerServing?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
}

export interface SharePayloadOptions {
  title: string;
  markdown: string;
  routeDetected: "notes" | "chef" | string;
  url?: string;
  recipeStats?: ShareRecipeStats;
  currentServings?: number;
  nutrition?: ShareNutritionStats;
}

export interface ShareResult {
  success: boolean;
  method: "native-share" | "clipboard" | "file-share" | "aborted" | "fallback";
  message?: string;
  error?: string;
}

/**
 * Check if the current browser environment supports the Web Share API.
 */
export const isWebShareSupported = (): boolean => {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function"
  );
};

/**
 * Check if the browser can share files via Web Share API Level 2.
 */
export const canShareFiles = (files: File[]): boolean => {
  if (!isWebShareSupported()) return false;
  try {
    return (
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files })
    );
  } catch {
    return false;
  }
};

/**
 * Clean and format markdown content into an aesthetically pleasing plain-text
 * representation suitable for sending to messaging apps (WhatsApp, iMessage, Slack, Email, Notes).
 */
export const formatShareableText = (options: SharePayloadOptions): string => {
  const { title, markdown, routeDetected, recipeStats, currentServings, nutrition, url } = options;
  const isChef = routeDetected === "chef";

  // Clean title
  const cleanTitle = title.replace(/^[#\s🍳DORMCHEF:🧠UNTANGLEDNOTES]+/, "").trim();

  const lines: string[] = [];

  // Header banner
  if (isChef) {
    lines.push(`🍳 DORM CHEF RECIPE: ${cleanTitle.toUpperCase()}`);
    lines.push("─".repeat(Math.min(cleanTitle.length + 22, 42)));
    
    // Highlights
    const highlights: string[] = [];
    if (recipeStats?.costPerServing) {
      highlights.push(`💰 Cost: ${recipeStats.costPerServing}/serving`);
    }
    if (currentServings) {
      highlights.push(`🍽️ Yield: ${currentServings} ${currentServings === 1 ? "serving" : "servings"}`);
    }
    if (nutrition?.caloriesPerServing) {
      highlights.push(`⚡ Est. Calories: ~${nutrition.caloriesPerServing} kcal`);
    }
    if (nutrition?.proteinGrams) {
      highlights.push(`💪 Protein: ~${nutrition.proteinGrams}g`);
    }
    if (highlights.length > 0) {
      lines.push(highlights.join(" • "));
      lines.push("");
    }
  } else {
    lines.push(`🧠 UNTANGLED NOTES: ${cleanTitle.toUpperCase()}`);
    lines.push("─".repeat(Math.min(cleanTitle.length + 20, 42)));
    lines.push("");
  }

  // Process markdown into clean plain text
  const cleanedMarkdown = markdown
    // Remove the very first H1 title line if it duplicates our header
    .replace(/^#\s+[^\n]+\n+/, "")
    // Transform headers to clean uppercase section headers
    .replace(/^#{2,4}\s+(.+)$/gm, "\n📌 $1\n")
    // Transform bold/italic
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Transform unordered list bullets to clean bullets
    .replace(/^[\s]*[-*+]\s+/gm, "• ")
    // Transform blockquotes
    .replace(/^>\s+/gm, "  │ ")
    // Clean code fences
    .replace(/```[a-z]*\n([\s\S]*?)```/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    // Clean excessive blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  lines.push(cleanedMarkdown);
  lines.push("");
  lines.push("─".repeat(32));
  lines.push("Created with Skrible — AI Untangler for Chaotic Student Lives");

  const appUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  if (appUrl) {
    lines.push(appUrl);
  }

  return lines.join("\n");
};

/**
 * Creates a downloadable/shareable Markdown File object for Web Share API Level 2.
 */
export const createMarkdownFile = (title: string, markdown: string): File => {
  const safeSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "skrible-note";

  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  return new File([blob], `${safeSlug}.md`, { type: "text/markdown" });
};

/**
 * Invokes the Web Share API to send content to other native apps on the device.
 * Gracefully handles permission issues, AbortError, and fallbacks.
 */
export const shareViaWebShare = async (
  options: SharePayloadOptions,
  includeFileIfSupported = false
): Promise<ShareResult> => {
  const isChef = options.routeDetected === "chef";
  const cleanTitle = options.title.replace(/^[#\s🍳DORMCHEF:🧠UNTANGLEDNOTES]+/, "").trim();
  const shareTitle = isChef ? `${cleanTitle} (Dorm Chef Recipe)` : `${cleanTitle} (Skrible Notes)`;
  const shareText = formatShareableText(options);
  const shareUrl = options.url || (typeof window !== "undefined" ? window.location.href : "");

  // If Web Share is not supported at all
  if (!isWebShareSupported()) {
    return {
      success: false,
      method: "unsupported" as any,
      message: "Web Share API is not supported in this browser.",
    };
  }

  // Attempt Level 2 file sharing if requested
  if (includeFileIfSupported) {
    try {
      const file = createMarkdownFile(cleanTitle, options.markdown);
      if (canShareFiles([file])) {
        await navigator.share({
          files: [file],
          title: shareTitle,
          text: shareText.slice(0, 300) + "...",
          url: shareUrl,
        });
        return {
          success: true,
          method: "file-share",
          message: "Sent file and note to app!",
        };
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        return { success: false, method: "aborted", message: "Share canceled." };
      }
      // Fall through to standard text share
    }
  }

  // Attempt standard Web Share: Title + Text + URL
  try {
    const dataToShare: ShareData = {
      title: shareTitle,
      text: shareText,
      url: shareUrl,
    };

    if (typeof navigator.canShare === "function" && !navigator.canShare(dataToShare)) {
      // Some platforms don't allow URL + long text together; try just text
      await navigator.share({
        title: shareTitle,
        text: shareText,
      });
    } else {
      await navigator.share(dataToShare);
    }

    return {
      success: true,
      method: "native-share",
      message: "Shared successfully via native apps!",
    };
  } catch (err: any) {
    // User pressed cancel or closed the sheet
    if (err.name === "AbortError") {
      return {
        success: false,
        method: "aborted",
        message: "Share canceled by user.",
      };
    }

    // Try secondary fallback without URL (some mobile apps fail when both text and url are passed)
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
      });
      return {
        success: true,
        method: "native-share",
        message: "Shared successfully via native apps!",
      };
    } catch (secondErr: any) {
      if (secondErr.name === "AbortError") {
        return { success: false, method: "aborted", message: "Share canceled." };
      }
      return {
        success: false,
        method: "fallback",
        error: secondErr.message || err.message || "Failed to invoke native share.",
      };
    }
  }
};

/**
 * Quick deep-link URLs for popular chat and productivity apps
 */
export const getAppShareLinks = (options: SharePayloadOptions) => {
  const text = formatShareableText(options);
  const encodedText = encodeURIComponent(text);
  const cleanTitle = options.title.replace(/^[#\s🍳DORMCHEF:🧠UNTANGLEDNOTES]+/, "").trim();
  const encodedSubject = encodeURIComponent(
    options.routeDetected === "chef"
      ? `Dorm Chef Recipe: ${cleanTitle}`
      : `Untangled Notes: ${cleanTitle}`
  );
  const url = encodeURIComponent(
    options.url || (typeof window !== "undefined" ? window.location.href : "")
  );

  return {
    whatsapp: `https://wa.me/?text=${encodedText}`,
    telegram: `https://t.me/share/url?url=${url}&text=${encodeURIComponent(
      `🍳 ${cleanTitle}\n\n` + text.slice(0, 1000)
    )}`,
    email: `mailto:?subject=${encodedSubject}&body=${encodedText}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `Just untangled "${cleanTitle}" on Skrible! 🍳⚡\n`
    )}&url=${url}`,
  };
};
