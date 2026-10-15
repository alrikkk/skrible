/**
 * tagSuggester.ts
 *
 * Analyzes the content of generated notes (markdown, title, prompt, route)
 * to automatically detect and suggest relevant tags such as:
 * - Academic class names, subjects & course codes (e.g., CS 101, Organic Chemistry, Calculus, Biology)
 * - Ingredient types & staples (e.g., Chicken, Pasta, Rice, Tofu, Eggs, Garlic, Broccoli)
 * - Dietary & meal profiles (e.g., High Protein, Vegetarian, Quick Meal, Budget Friendly, One Pot)
 * - Study document formats (e.g., Exam Prep, Cheat Sheet, Formulas, Flashcards, Lab Report)
 */

import { StudyFolder } from "../types";

export interface SuggestedTag {
  tag: string;
  category: "class" | "ingredient" | "topic" | "format" | "diet";
  categoryLabel: string;
  relevanceScore: number;
}

export interface FolderMatchSuggestion {
  folder: StudyFolder;
  score: number;
  matchPercentage: number;
  matchReason: string;
  isRecommended: boolean;
}

export interface FolderAnalysisResult {
  recommendedFolder: StudyFolder | null;
  folderMatches: FolderMatchSuggestion[];
  suggestedNewFolderName: string | null;
  suggestedNewFolderColor: "indigo" | "emerald" | "amber" | "rose" | "purple" | "blue" | "stone";
  detectedSubject: string;
  topTags: SuggestedTag[];
}

// -------------------------------------------------------------
// Academic Subjects, Courses & Class Patterns
// -------------------------------------------------------------
interface AcademicTopicPattern {
  name: string;
  keywords: string[];
  category: "class" | "topic";
  categoryLabel: string;
}

const ACADEMIC_PATTERNS: AcademicTopicPattern[] = [
  // Computer Science & Tech
  {
    name: "Computer Science",
    keywords: ["computer science", "programming", "software", "comp sci"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Data Structures",
    keywords: ["data structure", "binary tree", "linked list", "hash map", "graph theory", "stack", "queue"],
    category: "topic",
    categoryLabel: "Topic",
  },
  {
    name: "Algorithms",
    keywords: ["algorithm", "time complexity", "big o", "sorting", "dynamic programming", "dijkstra", "recursion"],
    category: "topic",
    categoryLabel: "Topic",
  },
  {
    name: "Web Development",
    keywords: ["web dev", "frontend", "backend", "javascript", "typescript", "react", "html", "css", "node.js"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Machine Learning",
    keywords: ["machine learning", "neural network", "deep learning", "gradient descent", "ai model", "supervised learning"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Database Systems",
    keywords: ["database", "sql", "postgresql", "normalization", "relational model", "nosql"],
    category: "class",
    categoryLabel: "Class",
  },

  // Life Sciences & Medicine
  {
    name: "Biology",
    keywords: ["biology", "biological", "cellular", "organism", "mitosis", "meiosis"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Anatomy",
    keywords: ["anatomy", "skeletal", "muscular system", "nervous system", "cranial", "bones", "tissues"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Physiology",
    keywords: ["physiology", "cardiovascular", "homeostasis", "endocrine", "metabolic pathways", "renal"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Genetics",
    keywords: ["genetics", "dna replication", "rna", "chromosome", "allele", "punnett square", "genotype"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Neuroscience",
    keywords: ["neuroscience", "neuron", "synapse", "neurotransmitter", "cerebral", "action potential"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Microbiology",
    keywords: ["microbiology", "bacteria", "pathogen", "virus", "antibiotic", "culture"],
    category: "class",
    categoryLabel: "Class",
  },

  // Physical Sciences & Math
  {
    name: "Chemistry",
    keywords: ["chemistry", "chemical", "molecules", "periodic table", "stoichiometry", "titration"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Organic Chemistry",
    keywords: ["organic chemistry", "ochem", "alkane", "alkene", "carbonyl", "electrophile", "nucleophile", "resonance structure"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Physics",
    keywords: ["physics", "kinematics", "velocity", "acceleration", "thermodynamics", "quantum", "electromagnetism", "gravity"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Calculus",
    keywords: ["calculus", "derivative", "integral", "differentiation", "integration", "limits", "calc i", "calc ii"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Linear Algebra",
    keywords: ["linear algebra", "eigenvalue", "eigenvector", "matrix multiplication", "vector space", "determinant"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Statistics",
    keywords: ["statistics", "probability", "p-value", "hypothesis test", "standard deviation", "normal distribution", "regression"],
    category: "class",
    categoryLabel: "Class",
  },

  // Business, Economics & Finance
  {
    name: "Finance",
    keywords: ["finance", "financial", "portfolio", "roi", "compound interest", "capital", "equity", "valuation"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Economics",
    keywords: ["economics", "supply and demand", "market equilibrium", "elasticity", "gdp", "inflation", "macroeconomics", "microeconomics"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Accounting",
    keywords: ["accounting", "balance sheet", "income statement", "cash flow", "debit and credit", "gaap", "ledger"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Marketing",
    keywords: ["marketing", "branding", "target audience", "market segmentation", "conversion rate", "seo"],
    category: "class",
    categoryLabel: "Class",
  },

  // Humanities & Social Sciences
  {
    name: "Psychology",
    keywords: ["psychology", "cognitive", "behavioral", "freud", "classical conditioning", "perception", "memory recall"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Sociology",
    keywords: ["sociology", "social stratification", "demographics", "institutions", "culture norms"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "History",
    keywords: ["history", "historical", "revolution", "world war", "civil war", "ancient", "renaissance", "treaty"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Philosophy",
    keywords: ["philosophy", "epistemology", "ethics", "utilitarianism", "kant", "metaphysics", "logic"],
    category: "class",
    categoryLabel: "Class",
  },
  {
    name: "Literature",
    keywords: ["literature", "novel", "metaphor", "prose", "protagonist", "theme", "poetry", "essay analysis"],
    category: "class",
    categoryLabel: "Class",
  },
];

// Document Format / Purpose Patterns
const FORMAT_PATTERNS: { name: string; keywords: string[] }[] = [
  { name: "Exam Prep", keywords: ["exam", "midterm", "final exam", "study guide", "quiz", "test review"] },
  { name: "Cheat Sheet", keywords: ["cheat sheet", "quick reference", "summary sheet", "formula sheet"] },
  { name: "Formulas", keywords: ["formula", "equation", "theorem", "math notation", "laws"] },
  { name: "Flashcards", keywords: ["flashcard", "q&a", "question:", "answer:", "definitions"] },
  { name: "Lecture Notes", keywords: ["lecture", "professor", "class notes", "slides", "week 1", "week 2", "week 3", "week 4"] },
  { name: "Lab Report", keywords: ["lab report", "hypothesis", "experiment", "methodology", "apparatus"] },
];

// -------------------------------------------------------------
// Dorm Chef / Culinary Patterns & Ingredients
// -------------------------------------------------------------
interface IngredientPattern {
  name: string;
  keywords: string[];
  category: "ingredient" | "diet";
  categoryLabel: string;
}

const INGREDIENT_PATTERNS: IngredientPattern[] = [
  // Proteins
  { name: "Chicken", keywords: ["chicken", "poultry", "chicken breast", "chicken thigh"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Beef", keywords: ["beef", "ground beef", "steak", "meatballs"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Eggs", keywords: ["egg", "eggs", "omelet", "scrambled egg", "fried egg"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Tofu", keywords: ["tofu", "soy protein", "bean curd"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Salmon", keywords: ["salmon", "fish fillet"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Tuna", keywords: ["tuna", "canned tuna"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Beans", keywords: ["beans", "black beans", "kidney beans", "chickpeas", "pinto beans", "lentils"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Pork", keywords: ["pork", "bacon", "ham", "sausage"], category: "ingredient", categoryLabel: "Ingredient" },

  // Grains & Carbs
  { name: "Pasta", keywords: ["pasta", "spaghetti", "penne", "macaroni", "fettuccine", "rigatoni"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Rice", keywords: ["rice", "jasmine rice", "brown rice", "fried rice", "white rice"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Noodles", keywords: ["noodles", "ramen", "udon", "soba", "instant ramen"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Oats", keywords: ["oats", "oatmeal", "overnight oats"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Bread", keywords: ["bread", "toast", "sandwich", "bagel", "tortilla", "wrap"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Potatoes", keywords: ["potato", "potatoes", "mashed potato", "hashbrown", "sweet potato"], category: "ingredient", categoryLabel: "Ingredient" },

  // Dairy & Cheese
  { name: "Cheese", keywords: ["cheese", "cheddar", "mozzarella", "parmesan", "gouda", "feta"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Yogurt", keywords: ["yogurt", "greek yogurt"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Milk", keywords: ["milk", "almond milk", "oat milk", "dairy"], category: "ingredient", categoryLabel: "Ingredient" },

  // Vegetables & Aromatics
  { name: "Garlic", keywords: ["garlic", "minced garlic", "garlic powder", "cloves garlic"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Onions", keywords: ["onion", "onions", "shallot", "green onion", "scallion"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Spinach", keywords: ["spinach", "baby spinach", "leafy greens"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Broccoli", keywords: ["broccoli", "broccoli florets"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Mushrooms", keywords: ["mushroom", "mushrooms", "cremini", "shiitake"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Tomatoes", keywords: ["tomato", "tomatoes", "marinara", "tomato sauce"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Avocado", keywords: ["avocado", "guacamole"], category: "ingredient", categoryLabel: "Ingredient" },
  { name: "Peppers", keywords: ["bell pepper", "chili pepper", "jalapeno", "paprika"], category: "ingredient", categoryLabel: "Ingredient" },
];

const DIETARY_PATTERNS: { name: string; test: (text: string) => boolean }[] = [
  {
    name: "High Protein",
    test: (text) => /high protein|2[5-9]g protein|[3-9]\d\s?g protein|bulk fuel|protein packed/i.test(text),
  },
  {
    name: "Vegetarian",
    test: (text) => {
      if (/vegetarian/i.test(text)) return true;
      const hasMeat = /chicken|beef|pork|bacon|salmon|tuna|turkey|shrimp|fish|meat/i.test(text);
      const hasVeg = /tofu|beans|cheese|pasta|rice|veggie|egg/i.test(text);
      return !hasMeat && hasVeg;
    },
  },
  {
    name: "Quick Meal",
    test: (text) => /quick|5[\s-]min|10[\s-]min|15[\s-]min|fast meal|rapid/i.test(text),
  },
  {
    name: "Budget Friendly",
    test: (text) => /budget|under \$5|cheap|cost-effective|inexpensive|dorm budget/i.test(text),
  },
  {
    name: "One Pot",
    test: (text) => /one pot|one pan|single pot|sheet pan/i.test(text),
  },
  {
    name: "Microwave Only",
    test: (text) => /microwave|mug cake|microwaveable|no stove/i.test(text),
  },
  {
    name: "Meal Prep",
    test: (text) => /meal prep|batch cook|freezer friendly|leftovers/i.test(text),
  },
];

// Helper to extract course code patterns (e.g. CS 101, BIO-202, MATH 151, ENG 102)
function extractCourseCodes(text: string): string[] {
  const codes: string[] = [];
  const regex = /\b([A-Z]{2,5})\s?[-_]?\s?(\d{2,4}[A-Z]?)\b/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const prefix = match[1].toUpperCase();
    const num = match[2].toUpperCase();
    // Exclude common false positives like "ISO 9001", "HTML 5", "MP 3", "UTF 8", "AM 10"
    const ignored = ["HTML", "CSS", "UTF", "ISO", "AM", "PM", "USD", "STEP", "PART", "PAGE", "VOL"];
    if (!ignored.includes(prefix)) {
      codes.push(`${prefix} ${num}`);
    }
  }

  return Array.from(new Set(codes));
}

// Helper to extract key concepts from markdown headings
function extractHeadingKeywords(markdown: string): string[] {
  const headings: string[] = [];
  const lines = markdown.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ") || trimmed.startsWith("## ")) {
      const headingText = trimmed.replace(/^#+\s*/, "").replace(/[#*`_~[\]]/g, "").trim();
      // Remove generic filler words like "Introduction to", "Overview of", "Recipe for"
      const cleaned = headingText
        .replace(/^(introduction to|overview of|lecture \d+:|chapter \d+:|module \d+:|easy|quick|best|dorm chef)\s+/i, "")
        .trim();

      if (cleaned.length >= 3 && cleaned.length <= 32 && !cleaned.toLowerCase().includes("instructions") && !cleaned.toLowerCase().includes("ingredients")) {
        headings.push(cleaned);
      }
    }
  }

  return headings;
}

/**
 * Main Content Analyzer function
 * Evaluates the full context of a note to produce ranked, categorized tag suggestions.
 */
export function analyzeNoteContentForTags(params: {
  title?: string;
  outputMarkdown: string;
  inputPrompt?: string;
  routeDetected?: "notes" | "chef";
  existingTags?: string[];
  maxSuggestions?: number;
}): SuggestedTag[] {
  const {
    title = "",
    outputMarkdown = "",
    inputPrompt = "",
    routeDetected = "notes",
    existingTags = [],
    maxSuggestions = 8,
  } = params;

  const combinedText = `${title}\n${inputPrompt}\n${outputMarkdown}`;
  const lowerText = combinedText.toLowerCase();
  const existingSet = new Set(existingTags.map((t) => t.trim().toLowerCase()));

  const suggestions: SuggestedTag[] = [];

  // Helper to add unique suggestion
  const addSuggestion = (
    tag: string,
    category: SuggestedTag["category"],
    categoryLabel: string,
    relevanceScore: number
  ) => {
    const cleanTag = tag.trim();
    if (!cleanTag || cleanTag.length > 25) return;
    const lower = cleanTag.toLowerCase();

    // Check if already in existing tags or already suggested
    if (existingSet.has(lower)) return;
    if (suggestions.some((s) => s.tag.toLowerCase() === lower)) return;

    suggestions.push({
      tag: cleanTag,
      category,
      categoryLabel,
      relevanceScore,
    });
  };

  // 1. Extract Course Codes (e.g. CS 101, CHEM 210, BIO 101, MATH 201)
  const courseCodes = extractCourseCodes(combinedText);
  for (const code of courseCodes) {
    addSuggestion(code, "class", "Class Code", 100);
  }

  // 2. Academic Subjects & Topics (Class names)
  for (const pattern of ACADEMIC_PATTERNS) {
    let matchCount = 0;
    for (const kw of pattern.keywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      // Bonus if keyword is in title or input prompt
      const inTitle = pattern.keywords.some((kw) => title.toLowerCase().includes(kw));
      const score = 80 + (inTitle ? 20 : 0) + matchCount * 5;
      addSuggestion(pattern.name, pattern.category, pattern.categoryLabel, score);
    }
  }

  // 3. Document Format & Academic Goals
  for (const fmt of FORMAT_PATTERNS) {
    const matched = fmt.keywords.some((kw) => lowerText.includes(kw));
    if (matched) {
      addSuggestion(fmt.name, "format", "Study Goal", 75);
    }
  }

  // 4. Dorm Chef: Ingredients & Culinary Staples
  for (const ing of INGREDIENT_PATTERNS) {
    let matchCount = 0;
    for (const kw of ing.keywords) {
      // Word boundary match check
      const re = new RegExp(`\\b${kw.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, "\\$&")}\\b`, "i");
      if (re.test(combinedText)) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      const inTitle = ing.keywords.some((kw) => title.toLowerCase().includes(kw));
      const score = (routeDetected === "chef" ? 90 : 60) + (inTitle ? 25 : 0) + matchCount * 5;
      addSuggestion(ing.name, ing.category, ing.categoryLabel, score);
    }
  }

  // 5. Dietary & Meal Profiles
  for (const diet of DIETARY_PATTERNS) {
    if (diet.test(combinedText)) {
      const score = routeDetected === "chef" ? 85 : 65;
      addSuggestion(diet.name, "diet", "Diet & Meal", score);
    }
  }

  // 6. Heading extraction for specialized topics/dishes
  const headings = extractHeadingKeywords(outputMarkdown);
  for (const h of headings.slice(0, 3)) {
    // Avoid re-adding generic words
    if (!["notes", "recipe", "study note", "ingredients", "instructions", "summary"].includes(h.toLowerCase())) {
      addSuggestion(h, "topic", "Key Concept", 70);
    }
  }

  // 7. Base Default Fallback if note is very brief
  if (suggestions.length === 0) {
    if (routeDetected === "chef") {
      addSuggestion("Recipe", "format", "Type", 50);
      addSuggestion("Quick Meal", "diet", "Diet & Meal", 45);
      addSuggestion("Budget Friendly", "diet", "Diet & Meal", 40);
    } else {
      addSuggestion("Study Note", "format", "Type", 50);
      addSuggestion("Exam Prep", "format", "Study Goal", 45);
      addSuggestion("Key Concepts", "topic", "Topic", 40);
    }
  }

  // Sort by relevance score descending
  suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return suggestions.slice(0, maxSuggestions);
}

/**
 * Intelligent Folder Analyzer
 * Analyzes note content and tags to match against the student's existing folders,
 * or recommends creating a tailored new folder with high confidence.
 */
export function suggestFolderForNote(params: {
  title?: string;
  outputMarkdown: string;
  inputPrompt?: string;
  routeDetected?: "notes" | "chef";
  folders: StudyFolder[];
  existingTags?: string[];
}): FolderAnalysisResult {
  const {
    title = "",
    outputMarkdown = "",
    inputPrompt = "",
    routeDetected = "notes",
    folders = [],
    existingTags = [],
  } = params;

  // 1. Analyze content for top tags
  const topTags = analyzeNoteContentForTags({
    title,
    outputMarkdown,
    inputPrompt,
    routeDetected,
    existingTags,
    maxSuggestions: 8,
  });

  const combinedText = `${title}\n${inputPrompt}\n${outputMarkdown}`.toLowerCase();

  // 2. Determine primary subject or category
  const classTag = topTags.find((t) => t.category === "class");
  const topicTag = topTags.find((t) => t.category === "topic");
  const formatTag = topTags.find((t) => t.category === "format");
  const dietTag = topTags.find((t) => t.category === "diet");
  const ingredientTag = topTags.find((t) => t.category === "ingredient");

  let detectedSubject =
    classTag?.tag ||
    (routeDetected === "chef"
      ? (ingredientTag ? `${ingredientTag.tag} Recipes` : "Dorm Meals")
      : topicTag?.tag || "General Studies");

  // 3. Score existing folders
  const matches: FolderMatchSuggestion[] = [];

  for (const folder of folders) {
    let score = 0;
    let matchReasons: string[] = [];
    const fNameLower = folder.name.toLowerCase();

    // Route matching
    if (routeDetected === "chef") {
      if (fNameLower.includes("recipe") || fNameLower.includes("food") || fNameLower.includes("cook") || fNameLower.includes("meal") || fNameLower.includes("dorm")) {
        score += 80;
        matchReasons.push("Dorm chef meal format detected");
      }
    } else {
      if (fNameLower.includes("recipe") || fNameLower.includes("cook") || fNameLower.includes("food")) {
        score -= 40; // Penalize recipe folders for academic notes
      }
    }

    // Class/Subject matching
    if (classTag && (fNameLower.includes(classTag.tag.toLowerCase()) || classTag.tag.toLowerCase().includes(fNameLower))) {
      score += 90;
      matchReasons.push(`Matches subject: ${classTag.tag}`);
    }

    // Direct tag matching
    for (const tag of topTags) {
      if (fNameLower.includes(tag.tag.toLowerCase())) {
        score += 35;
        if (!matchReasons.includes(`Matches tag: ${tag.tag}`)) {
          matchReasons.push(`Matches tag: ${tag.tag}`);
        }
      }
    }

    // Token overlap
    const folderTokens = fNameLower.split(/[\s&/_-]+/).filter((t) => t.length > 2);
    for (const token of folderTokens) {
      if (combinedText.includes(token)) {
        score += 15;
      }
    }

    // Exam prep matching
    if (formatTag?.tag === "Exam Prep" && (fNameLower.includes("exam") || fNameLower.includes("prep") || fNameLower.includes("midterm") || fNameLower.includes("study"))) {
      score += 50;
      matchReasons.push("Exam prep study format");
    }

    // Normalize confidence percentage (cap at 99%)
    const matchPercentage = Math.min(99, Math.max(10, Math.round((score / 120) * 100)));

    matches.push({
      folder,
      score,
      matchPercentage,
      matchReason: matchReasons.length > 0 ? matchReasons.join(" • ") : "General note content",
      isRecommended: false,
    });
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  // Set best recommended folder if score is sufficient
  let recommendedFolder: StudyFolder | null = null;
  if (matches.length > 0 && matches[0].score >= 35) {
    matches[0].isRecommended = true;
    recommendedFolder = matches[0].folder;
  }

  // 4. Suggest creating a new specific folder if subject is distinct
  let suggestedNewFolderName: string | null = null;
  let suggestedNewFolderColor: StudyFolder["color"] = "indigo";

  if (classTag) {
    const existingExact = folders.some((f) => f.name.toLowerCase() === classTag.tag.toLowerCase());
    if (!existingExact) {
      suggestedNewFolderName = classTag.tag;
      suggestedNewFolderColor =
        classTag.tag.toLowerCase().includes("bio") || classTag.tag.toLowerCase().includes("science")
          ? "emerald"
          : classTag.tag.toLowerCase().includes("math") || classTag.tag.toLowerCase().includes("calc") || classTag.tag.toLowerCase().includes("cs") || classTag.tag.toLowerCase().includes("comp")
          ? "indigo"
          : classTag.tag.toLowerCase().includes("chem") || classTag.tag.toLowerCase().includes("phys")
          ? "blue"
          : "purple";
    }
  } else if (routeDetected === "chef" && ingredientTag) {
    const candidate = `${ingredientTag.tag} Dinners`;
    if (!folders.some((f) => f.name.toLowerCase() === candidate.toLowerCase())) {
      suggestedNewFolderName = candidate;
      suggestedNewFolderColor = "amber";
    }
  }

  return {
    recommendedFolder,
    folderMatches: matches,
    suggestedNewFolderName,
    suggestedNewFolderColor,
    detectedSubject,
    topTags,
  };
}

/**
 * Hybrid Content & Folder Analyzer
 * Requests AI-powered semantic analysis from /api/analyze-tags with instant
 * graceful fallback to local heuristic analysis on network errors or timeouts.
 */
export async function analyzeNoteWithAI(params: {
  markdownNote: string;
  title?: string;
  routeDetected?: "notes" | "chef";
  folders: StudyFolder[];
  existingTags?: string[];
}): Promise<FolderAnalysisResult> {
  const localFallback = suggestFolderForNote({
    title: params.title,
    outputMarkdown: params.markdownNote,
    routeDetected: params.routeDetected,
    folders: params.folders,
    existingTags: params.existingTags,
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch("/api/analyze-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        markdownNote: params.markdownNote,
        title: params.title,
        routeDetected: params.routeDetected || "notes",
        folders: params.folders.map((f) => ({ id: f.id, name: f.name })),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return localFallback;
    }

    const data = await res.json();
    const analysis = data?.analysis;
    if (!analysis) return localFallback;

    // Map AI tags
    const aiTags: SuggestedTag[] = Array.isArray(analysis.suggestedTags)
      ? analysis.suggestedTags.map((t: any) => ({
          tag: String(t.tag || "").trim(),
          category: ["class", "topic", "format", "ingredient", "diet"].includes(t.category)
            ? t.category
            : "topic",
          categoryLabel: String(t.categoryLabel || "Topic"),
          relevanceScore: typeof t.relevanceScore === "number" ? t.relevanceScore : 85,
        })).filter((t: SuggestedTag) => t.tag.length > 0)
      : [];

    // Merge AI tags with local tags (ensuring uniqueness)
    const combinedTags: SuggestedTag[] = [...aiTags];
    for (const lt of localFallback.topTags) {
      if (!combinedTags.some((at) => at.tag.toLowerCase() === lt.tag.toLowerCase())) {
        combinedTags.push(lt);
      }
    }

    // Match recommended folder
    let recFolder: StudyFolder | null = null;
    if (analysis.recommendedFolderId) {
      recFolder = params.folders.find((f) => f.id === analysis.recommendedFolderId) || null;
    }
    if (!recFolder && analysis.suggestedFolderName) {
      const match = params.folders.find(
        (f) => f.name.toLowerCase() === analysis.suggestedFolderName.toLowerCase()
      );
      if (match) recFolder = match;
    }
    if (!recFolder) {
      recFolder = localFallback.recommendedFolder;
    }

    // Enrich folder matches
    const folderMatches: FolderMatchSuggestion[] = params.folders.map((f) => {
      const localMatch = localFallback.folderMatches.find((m) => m.folder.id === f.id);
      const isAiPick = recFolder?.id === f.id;
      return {
        folder: f,
        score: isAiPick ? 100 : localMatch?.score || 10,
        matchPercentage: isAiPick
          ? Math.max(88, analysis.folderMatchPercentage || 92)
          : localMatch?.matchPercentage || 15,
        matchReason: isAiPick
          ? analysis.folderMatchReason || "Strong content and topic alignment"
          : localMatch?.matchReason || "General note match",
        isRecommended: isAiPick,
      };
    });

    folderMatches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return {
      recommendedFolder: recFolder,
      folderMatches,
      suggestedNewFolderName: analysis.suggestedNewFolderName || localFallback.suggestedNewFolderName,
      suggestedNewFolderColor: analysis.suggestedNewFolderColor || localFallback.suggestedNewFolderColor,
      detectedSubject: analysis.detectedSubject || localFallback.detectedSubject,
      topTags: combinedTags.slice(0, 10),
    };
  } catch {
    return localFallback;
  }
}

