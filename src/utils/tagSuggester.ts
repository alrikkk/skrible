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

export interface SuggestedTag {
  tag: string;
  category: "class" | "ingredient" | "topic" | "format" | "diet";
  categoryLabel: string;
  relevanceScore: number;
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
