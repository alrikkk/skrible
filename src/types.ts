export type RouteMode = "auto" | "notes" | "chef";

export interface FileAttachment {
  name: string;
  mimeType: string;
  data: string; // Base64 string
  previewUrl?: string;
}

export interface UntangleHistoryItem {
  id: string;
  timestamp: number;
  title: string;
  inputPrompt: string;
  inputType: "text" | "image" | "audio" | "multimodal";
  routeDetected: "notes" | "chef";
  outputMarkdown: string;
  budget?: string;
  tags: string[];
  pinned?: boolean;
}

export interface Flashcard {
  question: string;
  answer: string;
  tag: string;
}

export interface ExecutiveSummary {
  paragraph?: string;
  overview?: string;
  bullets: string[];
  markdown?: string;
}

export interface IngredientNutrition {
  name: string;
  amount?: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  sodiumMg?: number;
  percentOfCalories?: number;
  category?: "protein" | "carb" | "fat" | "vegetable" | "seasoning" | "dairy" | "other";
}

export interface NutritionInfo {
  recipeName: string;
  servings: number;
  caloriesPerServing: number;
  totalCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  sodiumMg?: number;
  totalProteinGrams?: number;
  totalCarbsGrams?: number;
  totalFatGrams?: number;
  macroPercentages?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  dietaryTags?: string[];
  healthNote?: string;
  ingredientBreakdown?: IngredientNutrition[];
  source?: "ingredient_estimate" | "ai_analysis";
  isAiGenerated?: boolean;
}

export interface PresetSample {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  category: "Note Engine" | "Dorm Chef";
  route: RouteMode;
  prompt: string;
  budget?: string;
  files?: FileAttachment[];
}
