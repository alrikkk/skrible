// Serving size multiplier and ingredient quantity recalculation utility

export interface ScaledIngredientResult {
  originalText: string;
  scaledText: string;
  originalQuantity?: string;
  scaledQuantity?: string;
  wasScaled: boolean;
  unit?: string;
}

// Convert unicode vulgar fractions to float
const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 0.25,
  "¾": 0.75,
  "⅕": 0.2,
  "⅖": 0.4,
  "⅗": 0.6,
  "⅘": 0.8,
  "⅙": 1 / 6,
  "⅚": 5 / 6,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

// Convert float to clean culinary fraction or decimal string
export function formatQuantity(val: number): string {
  if (val <= 0) return "0";
  // Round tiny floating inaccuracies
  const rounded = Math.round(val * 1000) / 1000;
  const whole = Math.floor(rounded);
  const frac = rounded - whole;

  const EPSILON = 0.045;

  const fractionMap: Array<{ frac: number; text: string }> = [
    { frac: 0.125, text: "1/8" },
    { frac: 0.2, text: "1/5" },
    { frac: 0.25, text: "1/4" },
    { frac: 1 / 3, text: "1/3" },
    { frac: 0.375, text: "3/8" },
    { frac: 0.5, text: "1/2" },
    { frac: 0.6, text: "3/5" },
    { frac: 0.625, text: "5/8" },
    { frac: 2 / 3, text: "2/3" },
    { frac: 0.75, text: "3/4" },
    { frac: 0.8, text: "4/5" },
    { frac: 0.875, text: "7/8" },
  ];

  if (frac < EPSILON) {
    return whole.toString();
  }

  if (1 - frac < EPSILON) {
    return (whole + 1).toString();
  }

  for (const { frac: targetFrac, text } of fractionMap) {
    if (Math.abs(frac - targetFrac) < EPSILON) {
      return whole > 0 ? `${whole} ${text}` : text;
    }
  }

  // If no common culinary fraction matches, format cleanly as decimal
  const decimalStr = rounded.toFixed(2);
  return decimalStr.replace(/\.?0+$/, "");
}

// Units that should be pluralized or singularized when count changes
const PLURALIZABLE_UNITS: Record<string, string> = {
  cup: "cups",
  can: "cans",
  clove: "cloves",
  slice: "slices",
  packet: "packets",
  pkg: "pkgs",
  piece: "pieces",
  stalk: "stalks",
  pinch: "pinches",
  dash: "dashes",
  handful: "handfuls",
  bottle: "bottles",
  scoop: "scoops",
  block: "blocks",
  fillet: "fillets",
  strip: "strips",
};

const SINGULAR_LOOKUP: Record<string, string> = Object.entries(PLURALIZABLE_UNITS).reduce(
  (acc, [sing, plur]) => {
    acc[plur.toLowerCase()] = sing;
    return acc;
  },
  {} as Record<string, string>
);

function adjustUnitPlurality(unit: string, newCount: number): string {
  const lower = unit.toLowerCase();
  const isPlural = newCount > 1.05;

  if (isPlural) {
    if (PLURALIZABLE_UNITS[lower]) {
      return PLURALIZABLE_UNITS[lower];
    }
    return unit;
  } else {
    // Singular desired (count <= 1)
    if (SINGULAR_LOOKUP[lower]) {
      return SINGULAR_LOOKUP[lower];
    }
    return unit;
  }
}

/**
 * Parse a numeric string (fraction, mixed number, decimal, or unicode fraction)
 */
function parseSingleValue(valStr: string): number | null {
  const trimmed = valStr.trim();
  if (!trimmed) return null;

  // Check unicode fraction e.g. "½" or "1 ½"
  for (const [char, num] of Object.entries(UNICODE_FRACTIONS)) {
    if (trimmed.includes(char)) {
      const rest = trimmed.replace(char, "").trim();
      const baseNum = rest ? parseFloat(rest) : 0;
      if (!isNaN(baseNum)) return baseNum + num;
    }
  }

  // Mixed fraction: e.g. "1 1/2" or "1-1/2"
  const mixedMatch = trimmed.match(/^(\d+)[-\s]+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);
    if (den !== 0) return whole + num / den;
  }

  // Simple fraction: e.g. "1/2", "3/4"
  const fracMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) {
    const num = parseInt(fracMatch[1], 10);
    const den = parseInt(fracMatch[2], 10);
    if (den !== 0) return num / den;
  }

  // Standard float or integer
  const parsed = parseFloat(trimmed);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Scales an individual ingredient line by a multiplier.
 * Handles fractions, mixed numbers, decimals, ranges (e.g. 2-3 cloves), and inline prices.
 */
export function scaleIngredientLine(rawLine: string, multiplier: number): ScaledIngredientResult {
  if (!rawLine || typeof rawLine !== "string") {
    return { originalText: rawLine || "", scaledText: rawLine || "", wasScaled: false };
  }

  // If multiplier is exactly 1, no modification needed
  if (Math.abs(multiplier - 1) < 0.001) {
    return { originalText: rawLine, scaledText: rawLine, wasScaled: false };
  }

  let line = rawLine;

  // 1. First, scale any inline price tag e.g. "$0.40" or "— $1.20"
  line = line.replace(/(\$\s*)(\d+(?:\.\d{1,2})?)/g, (fullMatch, prefix, priceStr) => {
    const origPrice = parseFloat(priceStr);
    if (isNaN(origPrice)) return fullMatch;
    const scaledPrice = (origPrice * multiplier).toFixed(2);
    return `${prefix}${scaledPrice}`;
  });

  // 2. Identify the prefix (bullets, numbering, table pipes, brackets)
  const prefixMatch = line.match(/^(\s*(?:[-*+•]|\d+[\.)]|\|)?\s*(?:\[[ xX]?\]\s*)?)/);
  const prefix = prefixMatch ? prefixMatch[1] : "";
  const content = line.slice(prefix.length);

  // 3. Match leading quantity or range
  // Pattern supports:
  // - "1 1/2" or "1-1/2"
  // - "1/2" or "3/4"
  // - "2.5" or "2"
  // - Ranges: "2-3", "2 to 3", "1 - 2"
  // - Unicode: "½", "1 ½"
  const rangeRegex =
    /^((?:\d+(?:[-\s]+\d+\/\d+|\/\d+|\.\d+)?|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]))\s*(?:-|–|—|\bto\b)\s*((?:\d+(?:[-\s]+\d+\/\d+|\/\d+|\.\d+)?|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]))(\s+([a-zA-Z]+))?(.*)$/i;

  const singleRegex =
    /^((?:\d+[-\s]+\d+\/\d+|\d+\/\d+|\d+\.\d+|\d+|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]))(\s+([a-zA-Z]+))?(.*)$/;

  const rangeMatch = content.match(rangeRegex);
  if (rangeMatch) {
    const val1Str = rangeMatch[1];
    const val2Str = rangeMatch[2];
    const unit = rangeMatch[4] || "";
    const rest = rangeMatch[5] || "";

    const num1 = parseSingleValue(val1Str);
    const num2 = parseSingleValue(val2Str);

    if (num1 !== null && num2 !== null) {
      const scaled1 = num1 * multiplier;
      const scaled2 = num2 * multiplier;
      const formatted1 = formatQuantity(scaled1);
      const formatted2 = formatQuantity(scaled2);
      const adjustedUnit = unit ? adjustUnitPlurality(unit, scaled2) : "";

      const originalRange = `${val1Str} to ${val2Str}${unit ? " " + unit : ""}`.trim();
      const scaledRange = `${formatted1} to ${formatted2}${adjustedUnit ? " " + adjustedUnit : ""}`.trim();

      const scaledContent = `${scaledRange}${rest}`;
      return {
        originalText: rawLine,
        scaledText: `${prefix}${scaledContent}`,
        originalQuantity: originalRange,
        scaledQuantity: scaledRange,
        wasScaled: true,
        unit: adjustedUnit || unit,
      };
    }
  }

  const singleMatch = content.match(singleRegex);
  if (singleMatch) {
    const valStr = singleMatch[1];
    const unit = singleMatch[3] || "";
    const rest = singleMatch[4] || "";

    const num = parseSingleValue(valStr);
    if (num !== null) {
      const scaled = num * multiplier;
      const formatted = formatQuantity(scaled);
      const adjustedUnit = unit ? adjustUnitPlurality(unit, scaled) : "";

      const origQty = `${valStr}${unit ? " " + unit : ""}`.trim();
      const scaledQty = `${formatted}${adjustedUnit ? " " + adjustedUnit : ""}`.trim();

      const scaledContent = `${scaledQty}${rest}`;
      return {
        originalText: rawLine,
        scaledText: `${prefix}${scaledContent}`,
        originalQuantity: origQty,
        scaledQuantity: scaledQty,
        wasScaled: true,
        unit: adjustedUnit || unit,
      };
    }
  }

  // If no leading number was matched, return the line (with updated price if any)
  return {
    originalText: rawLine,
    scaledText: line,
    wasScaled: line !== rawLine,
  };
}

/**
 * Recalculate a list of ingredient strings
 */
export function scaleIngredientsList(ingredients: string[], multiplier: number): string[] {
  if (!ingredients || ingredients.length === 0) return [];
  if (Math.abs(multiplier - 1) < 0.001) return ingredients;

  return ingredients.map((item) => scaleIngredientLine(item, multiplier).scaledText);
}

/**
 * Scan recipe markdown text and scale the ingredient section lines,
 * leaving steps, notes, and other markdown sections untouched.
 */
export function scaleRecipeMarkdown(markdown: string, multiplier: number): string {
  if (!markdown) return "";
  if (Math.abs(multiplier - 1) < 0.001) return markdown;

  const lines = markdown.split("\n");
  const result: string[] = [];
  let inIngredients = false;

  const isIngredientHeader = (line: string): boolean => {
    const trimmed = line.trim();
    if (
      /^#{1,4}\s+.*(?:ingredient|shopping\s*list|grocery\s*list|items?\s*needed|what\s*(?:you'll|you\s*need)|pantry\s*items?)/i.test(
        trimmed
      )
    ) {
      return true;
    }
    if (
      /^(?:\*{1,3}|_{1,3})?\s*(?:ingredients?|grocery\s*list|shopping\s*list)[:\s]*(?:\*{1,3}|_{1,3})?$/i.test(
        trimmed
      )
    ) {
      return true;
    }
    const upper = trimmed.toUpperCase();
    if (
      (trimmed.startsWith("#") || trimmed.startsWith("**")) &&
      (upper.includes("INGREDIENT") || upper.includes("SHOPPING LIST") || upper.includes("GROCERY LIST"))
    ) {
      return true;
    }
    return false;
  };

  const isStopHeader = (line: string): boolean => {
    const trimmed = line.trim();
    if (
      /^#{1,4}\s+.*(?:instruction|direction|step|method|how\s*to|preparation|cooking|procedure|time\s*&\s*steps?|equipment|notes?|nutrition|tips?)/i.test(
        trimmed
      )
    ) {
      return true;
    }
    if (
      /^(?:\*{1,3}|_{1,3})?\s*(?:instructions?|directions?|steps?|method|procedure|time\s*&\s*steps?)[:\s]*(?:\*{1,3}|_{1,3})?$/i.test(
        trimmed
      )
    ) {
      return true;
    }
    return false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (isIngredientHeader(trimmed)) {
      inIngredients = true;
      result.push(line);
      continue;
    }

    if (inIngredients) {
      if (isStopHeader(trimmed)) {
        inIngredients = false;
        result.push(line);
        continue;
      }

      if (/^#{1,3}\s+[^#]/.test(trimmed)) {
        inIngredients = false;
        result.push(line);
        continue;
      }

      // If bullet item or table row, scale it
      if (
        trimmed.startsWith("- ") ||
        trimmed.startsWith("* ") ||
        trimmed.startsWith("+ ") ||
        trimmed.startsWith("• ") ||
        /^\d+[\.)]\s+/.test(trimmed) ||
        (trimmed.startsWith("|") && trimmed.endsWith("|"))
      ) {
        // Don't scale metadata lines like "Prep Time: 10 mins" or "Cost Per Serving: $1.20"
        const lower = trimmed.toLowerCase();
        if (
          lower.includes("prep time") ||
          lower.includes("cook time") ||
          lower.includes("cost per serving") ||
          lower.includes("total recipe cost") ||
          lower.includes("remaining budget") ||
          lower.includes("servings:")
        ) {
          result.push(line);
        } else {
          const scaled = scaleIngredientLine(line, multiplier);
          result.push(scaled.scaledText);
        }
        continue;
      }
    }

    result.push(line);
  }

  return result.join("\n");
}
