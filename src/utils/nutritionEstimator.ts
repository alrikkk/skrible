import { IngredientNutrition, NutritionInfo } from "../types";

// Standard reference nutritional values for common ingredients
interface ReferenceFood {
  keywords: string[];
  category: "protein" | "carb" | "fat" | "vegetable" | "seasoning" | "dairy" | "other";
  // Baseline values per base unit
  baseUnit: "cup" | "tbsp" | "tsp" | "oz" | "g" | "piece" | "can" | "clove" | "slice";
  caloriesPerUnit: number;
  proteinPerUnit: number;
  carbsPerUnit: number;
  fatPerUnit: number;
  fiberPerUnit?: number;
  sodiumPerUnit?: number;
}

const FOOD_DATABASE: ReferenceFood[] = [
  // --- PROTEINS ---
  {
    keywords: ["egg", "eggs"],
    category: "protein",
    baseUnit: "piece",
    caloriesPerUnit: 72,
    proteinPerUnit: 6.3,
    carbsPerUnit: 0.4,
    fatPerUnit: 4.8,
    fiberPerUnit: 0,
    sodiumPerUnit: 70,
  },
  {
    keywords: ["egg white", "egg whites"],
    category: "protein",
    baseUnit: "piece",
    caloriesPerUnit: 17,
    proteinPerUnit: 3.6,
    carbsPerUnit: 0.2,
    fatPerUnit: 0.1,
    fiberPerUnit: 0,
    sodiumPerUnit: 55,
  },
  {
    keywords: ["chicken breast", "chicken tender", "chicken cutlet"],
    category: "protein",
    baseUnit: "oz",
    caloriesPerUnit: 46, // ~184 kcal per 4 oz
    proteinPerUnit: 8.8, // ~35g per 4 oz
    carbsPerUnit: 0,
    fatPerUnit: 1.0,
    fiberPerUnit: 0,
    sodiumPerUnit: 20,
  },
  {
    keywords: ["chicken thigh", "chicken leg"],
    category: "protein",
    baseUnit: "oz",
    caloriesPerUnit: 58,
    proteinPerUnit: 7.2,
    carbsPerUnit: 0,
    fatPerUnit: 3.1,
    fiberPerUnit: 0,
    sodiumPerUnit: 25,
  },
  {
    keywords: ["chicken", "shredded chicken", "rotisserie chicken"],
    category: "protein",
    baseUnit: "oz",
    caloriesPerUnit: 50,
    proteinPerUnit: 8.0,
    carbsPerUnit: 0,
    fatPerUnit: 2.0,
    fiberPerUnit: 0,
    sodiumPerUnit: 30,
  },
  {
    keywords: ["ground beef", "beef", "minced beef", "steak"],
    category: "protein",
    baseUnit: "oz",
    caloriesPerUnit: 68,
    proteinPerUnit: 7.3,
    carbsPerUnit: 0,
    fatPerUnit: 4.2,
    fiberPerUnit: 0,
    sodiumPerUnit: 20,
  },
  {
    keywords: ["ground turkey", "turkey"],
    category: "protein",
    baseUnit: "oz",
    caloriesPerUnit: 52,
    proteinPerUnit: 7.8,
    carbsPerUnit: 0,
    fatPerUnit: 2.3,
    fiberPerUnit: 0,
    sodiumPerUnit: 25,
  },
  {
    keywords: ["bacon", "bacon strip"],
    category: "protein",
    baseUnit: "slice",
    caloriesPerUnit: 43,
    proteinPerUnit: 3.0,
    carbsPerUnit: 0.1,
    fatPerUnit: 3.3,
    fiberPerUnit: 0,
    sodiumPerUnit: 190,
  },
  {
    keywords: ["tuna", "canned tuna"],
    category: "protein",
    baseUnit: "can",
    caloriesPerUnit: 130, // 5 oz can in water
    proteinPerUnit: 29.0,
    carbsPerUnit: 0,
    fatPerUnit: 1.0,
    fiberPerUnit: 0,
    sodiumPerUnit: 320,
  },
  {
    keywords: ["salmon", "salmon fillet"],
    category: "protein",
    baseUnit: "oz",
    caloriesPerUnit: 59,
    proteinPerUnit: 6.8,
    carbsPerUnit: 0,
    fatPerUnit: 3.5,
    fiberPerUnit: 0,
    sodiumPerUnit: 18,
  },
  {
    keywords: ["shrimp", "prawns"],
    category: "protein",
    baseUnit: "oz",
    caloriesPerUnit: 28,
    proteinPerUnit: 6.0,
    carbsPerUnit: 0.2,
    fatPerUnit: 0.3,
    fiberPerUnit: 0,
    sodiumPerUnit: 60,
  },
  {
    keywords: ["tofu", "firm tofu", "silken tofu"],
    category: "protein",
    baseUnit: "oz",
    caloriesPerUnit: 24,
    proteinPerUnit: 2.8,
    carbsPerUnit: 0.8,
    fatPerUnit: 1.4,
    fiberPerUnit: 0.3,
    sodiumPerUnit: 4,
  },
  {
    keywords: ["black beans", "black bean"],
    category: "protein",
    baseUnit: "can",
    caloriesPerUnit: 240, // 15 oz can drained
    proteinPerUnit: 15.0,
    carbsPerUnit: 43.0,
    fatPerUnit: 1.0,
    fiberPerUnit: 15.0,
    sodiumPerUnit: 460,
  },
  {
    keywords: ["chickpeas", "garbanzo beans"],
    category: "protein",
    baseUnit: "can",
    caloriesPerUnit: 260,
    proteinPerUnit: 14.0,
    carbsPerUnit: 45.0,
    fatPerUnit: 4.0,
    fiberPerUnit: 12.0,
    sodiumPerUnit: 420,
  },
  {
    keywords: ["kidney beans", "pinto beans", "beans"],
    category: "protein",
    baseUnit: "can",
    caloriesPerUnit: 240,
    proteinPerUnit: 15.0,
    carbsPerUnit: 42.0,
    fatPerUnit: 1.0,
    fiberPerUnit: 14.0,
    sodiumPerUnit: 440,
  },
  {
    keywords: ["lentils", "cooked lentils"],
    category: "protein",
    baseUnit: "cup",
    caloriesPerUnit: 230,
    proteinPerUnit: 18.0,
    carbsPerUnit: 40.0,
    fatPerUnit: 0.8,
    fiberPerUnit: 16.0,
    sodiumPerUnit: 4,
  },
  {
    keywords: ["peanut butter"],
    category: "protein",
    baseUnit: "tbsp",
    caloriesPerUnit: 94,
    proteinPerUnit: 4.0,
    carbsPerUnit: 3.5,
    fatPerUnit: 8.0,
    fiberPerUnit: 1.0,
    sodiumPerUnit: 75,
  },
  {
    keywords: ["greek yogurt", "plain greek yogurt"],
    category: "dairy",
    baseUnit: "cup",
    caloriesPerUnit: 130,
    proteinPerUnit: 22.0,
    carbsPerUnit: 8.0,
    fatPerUnit: 0.5,
    fiberPerUnit: 0,
    sodiumPerUnit: 85,
  },
  {
    keywords: ["cottage cheese"],
    category: "dairy",
    baseUnit: "cup",
    caloriesPerUnit: 220,
    proteinPerUnit: 25.0,
    carbsPerUnit: 8.0,
    fatPerUnit: 5.0,
    fiberPerUnit: 0,
    sodiumPerUnit: 680,
  },
  {
    keywords: ["cheddar cheese", "shredded cheddar", "cheese", "mozzarella", "monterey jack"],
    category: "dairy",
    baseUnit: "cup",
    caloriesPerUnit: 450, // 1 cup shredded ~110g
    proteinPerUnit: 28.0,
    carbsPerUnit: 2.0,
    fatPerUnit: 37.0,
    fiberPerUnit: 0,
    sodiumPerUnit: 700,
  },
  {
    keywords: ["parmesan", "parmesan cheese"],
    category: "dairy",
    baseUnit: "tbsp",
    caloriesPerUnit: 22,
    proteinPerUnit: 2.0,
    carbsPerUnit: 0.2,
    fatPerUnit: 1.5,
    fiberPerUnit: 0,
    sodiumPerUnit: 75,
  },

  // --- GRAINS & CARBS ---
  {
    keywords: ["rice", "white rice", "jasmine rice", "basmati rice"],
    category: "carb",
    baseUnit: "cup", // cooked
    caloriesPerUnit: 205,
    proteinPerUnit: 4.2,
    carbsPerUnit: 45.0,
    fatPerUnit: 0.4,
    fiberPerUnit: 0.6,
    sodiumPerUnit: 2,
  },
  {
    keywords: ["brown rice"],
    category: "carb",
    baseUnit: "cup",
    caloriesPerUnit: 218,
    proteinPerUnit: 4.5,
    carbsPerUnit: 46.0,
    fatPerUnit: 1.6,
    fiberPerUnit: 3.5,
    sodiumPerUnit: 5,
  },
  {
    keywords: ["pasta", "spaghetti", "macaroni", "penne", "noodles", "fettuccine"],
    category: "carb",
    baseUnit: "cup", // cooked
    caloriesPerUnit: 220,
    proteinPerUnit: 8.0,
    carbsPerUnit: 43.0,
    fatPerUnit: 1.3,
    fiberPerUnit: 2.5,
    sodiumPerUnit: 3,
  },
  {
    keywords: ["ramen", "instant ramen", "ramen noodles"],
    category: "carb",
    baseUnit: "piece", // 1 package
    caloriesPerUnit: 380,
    proteinPerUnit: 9.0,
    carbsPerUnit: 54.0,
    fatPerUnit: 14.0,
    fiberPerUnit: 2.0,
    sodiumPerUnit: 1200,
  },
  {
    keywords: ["bread", "sandwich bread", "white bread", "wheat bread", "toast"],
    category: "carb",
    baseUnit: "slice",
    caloriesPerUnit: 78,
    proteinPerUnit: 3.2,
    carbsPerUnit: 14.5,
    fatPerUnit: 1.0,
    fiberPerUnit: 1.5,
    sodiumPerUnit: 140,
  },
  {
    keywords: ["tortilla", "flour tortilla", "wrap"],
    category: "carb",
    baseUnit: "piece",
    caloriesPerUnit: 140,
    proteinPerUnit: 3.8,
    carbsPerUnit: 24.0,
    fatPerUnit: 3.5,
    fiberPerUnit: 1.5,
    sodiumPerUnit: 320,
  },
  {
    keywords: ["corn tortilla"],
    category: "carb",
    baseUnit: "piece",
    caloriesPerUnit: 52,
    proteinPerUnit: 1.4,
    carbsPerUnit: 11.0,
    fatPerUnit: 0.7,
    fiberPerUnit: 1.5,
    sodiumPerUnit: 10,
  },
  {
    keywords: ["oats", "oatmeal", "rolled oats", "quick oats"],
    category: "carb",
    baseUnit: "cup", // dry ~80g
    caloriesPerUnit: 300,
    proteinPerUnit: 10.0,
    carbsPerUnit: 54.0,
    fatPerUnit: 5.0,
    fiberPerUnit: 8.0,
    sodiumPerUnit: 2,
  },
  {
    keywords: ["potato", "potatoes", "russet potato"],
    category: "carb",
    baseUnit: "piece", // 1 medium
    caloriesPerUnit: 160,
    proteinPerUnit: 4.3,
    carbsPerUnit: 37.0,
    fatPerUnit: 0.2,
    fiberPerUnit: 3.8,
    sodiumPerUnit: 14,
  },
  {
    keywords: ["sweet potato", "sweet potatoes", "yam"],
    category: "carb",
    baseUnit: "piece",
    caloriesPerUnit: 112,
    proteinPerUnit: 2.0,
    carbsPerUnit: 26.0,
    fatPerUnit: 0.1,
    fiberPerUnit: 3.9,
    sodiumPerUnit: 70,
  },
  {
    keywords: ["quinoa"],
    category: "carb",
    baseUnit: "cup", // cooked
    caloriesPerUnit: 222,
    proteinPerUnit: 8.1,
    carbsPerUnit: 39.0,
    fatPerUnit: 3.6,
    fiberPerUnit: 5.0,
    sodiumPerUnit: 13,
  },
  {
    keywords: ["flour", "all purpose flour"],
    category: "carb",
    baseUnit: "cup",
    caloriesPerUnit: 455,
    proteinPerUnit: 13.0,
    carbsPerUnit: 95.0,
    fatPerUnit: 1.2,
    fiberPerUnit: 3.4,
    sodiumPerUnit: 2,
  },

  // --- OILS, BUTTER & FATS ---
  {
    keywords: ["olive oil", "vegetable oil", "canola oil", "cooking oil", "sesame oil", "oil"],
    category: "fat",
    baseUnit: "tbsp",
    caloriesPerUnit: 119,
    proteinPerUnit: 0,
    carbsPerUnit: 0,
    fatPerUnit: 13.5,
    fiberPerUnit: 0,
    sodiumPerUnit: 0,
  },
  {
    keywords: ["butter", "salted butter", "unsalted butter", "ghee"],
    category: "fat",
    baseUnit: "tbsp",
    caloriesPerUnit: 102,
    proteinPerUnit: 0.1,
    carbsPerUnit: 0,
    fatPerUnit: 11.5,
    fiberPerUnit: 0,
    sodiumPerUnit: 90,
  },
  {
    keywords: ["mayonnaise", "mayo"],
    category: "fat",
    baseUnit: "tbsp",
    caloriesPerUnit: 94,
    proteinPerUnit: 0.1,
    carbsPerUnit: 0.1,
    fatPerUnit: 10.3,
    fiberPerUnit: 0,
    sodiumPerUnit: 90,
  },
  {
    keywords: ["avocado"],
    category: "fat",
    baseUnit: "piece", // 1 whole
    caloriesPerUnit: 240,
    proteinPerUnit: 3.0,
    carbsPerUnit: 12.0,
    fatPerUnit: 22.0,
    fiberPerUnit: 10.0,
    sodiumPerUnit: 10,
  },

  // --- VEGETABLES & AROMATICS ---
  {
    keywords: ["onion", "yellow onion", "red onion", "white onion"],
    category: "vegetable",
    baseUnit: "piece", // 1 medium
    caloriesPerUnit: 44,
    proteinPerUnit: 1.2,
    carbsPerUnit: 10.0,
    fatPerUnit: 0.1,
    fiberPerUnit: 1.9,
    sodiumPerUnit: 4,
  },
  {
    keywords: ["garlic", "garlic clove"],
    category: "seasoning",
    baseUnit: "clove",
    caloriesPerUnit: 4,
    proteinPerUnit: 0.2,
    carbsPerUnit: 1.0,
    fatPerUnit: 0,
    fiberPerUnit: 0.1,
    sodiumPerUnit: 1,
  },
  {
    keywords: ["scallion", "green onion", "scallions", "green onions"],
    category: "vegetable",
    baseUnit: "piece", // 1 stalk
    caloriesPerUnit: 5,
    proteinPerUnit: 0.3,
    carbsPerUnit: 1.1,
    fatPerUnit: 0,
    fiberPerUnit: 0.4,
    sodiumPerUnit: 2,
  },
  {
    keywords: ["tomato", "tomatoes", "diced tomatoes", "fresh tomato"],
    category: "vegetable",
    baseUnit: "piece", // 1 medium
    caloriesPerUnit: 22,
    proteinPerUnit: 1.1,
    carbsPerUnit: 4.8,
    fatPerUnit: 0.2,
    fiberPerUnit: 1.5,
    sodiumPerUnit: 6,
  },
  {
    keywords: ["canned tomato", "canned tomatoes", "crushed tomatoes", "tomato sauce"],
    category: "vegetable",
    baseUnit: "can", // 14.5 oz
    caloriesPerUnit: 110,
    proteinPerUnit: 5.0,
    carbsPerUnit: 24.0,
    fatPerUnit: 0.8,
    fiberPerUnit: 6.0,
    sodiumPerUnit: 550,
  },
  {
    keywords: ["tomato paste"],
    category: "seasoning",
    baseUnit: "tbsp",
    caloriesPerUnit: 13,
    proteinPerUnit: 0.7,
    carbsPerUnit: 3.0,
    fatPerUnit: 0.1,
    fiberPerUnit: 0.7,
    sodiumPerUnit: 100,
  },
  {
    keywords: ["bell pepper", "capsicum", "sweet pepper"],
    category: "vegetable",
    baseUnit: "piece", // 1 medium
    caloriesPerUnit: 30,
    proteinPerUnit: 1.2,
    carbsPerUnit: 7.0,
    fatPerUnit: 0.3,
    fiberPerUnit: 2.5,
    sodiumPerUnit: 4,
  },
  {
    keywords: ["spinach", "baby spinach"],
    category: "vegetable",
    baseUnit: "cup",
    caloriesPerUnit: 7,
    proteinPerUnit: 0.9,
    carbsPerUnit: 1.1,
    fatPerUnit: 0.1,
    fiberPerUnit: 0.7,
    sodiumPerUnit: 24,
  },
  {
    keywords: ["broccoli", "broccoli florets"],
    category: "vegetable",
    baseUnit: "cup",
    caloriesPerUnit: 31,
    proteinPerUnit: 2.6,
    carbsPerUnit: 6.0,
    fatPerUnit: 0.3,
    fiberPerUnit: 2.4,
    sodiumPerUnit: 30,
  },
  {
    keywords: ["carrot", "carrots"],
    category: "vegetable",
    baseUnit: "piece", // 1 medium
    caloriesPerUnit: 25,
    proteinPerUnit: 0.6,
    carbsPerUnit: 6.0,
    fatPerUnit: 0.1,
    fiberPerUnit: 1.7,
    sodiumPerUnit: 42,
  },
  {
    keywords: ["mushrooms", "mushroom", "button mushrooms"],
    category: "vegetable",
    baseUnit: "cup",
    caloriesPerUnit: 15,
    proteinPerUnit: 2.2,
    carbsPerUnit: 2.3,
    fatPerUnit: 0.2,
    fiberPerUnit: 0.7,
    sodiumPerUnit: 4,
  },
  {
    keywords: ["corn", "sweet corn", "canned corn"],
    category: "vegetable",
    baseUnit: "cup",
    caloriesPerUnit: 130,
    proteinPerUnit: 4.5,
    carbsPerUnit: 29.0,
    fatPerUnit: 1.8,
    fiberPerUnit: 3.5,
    sodiumPerUnit: 15,
  },
  {
    keywords: ["peas", "green peas", "frozen peas"],
    category: "vegetable",
    baseUnit: "cup",
    caloriesPerUnit: 118,
    proteinPerUnit: 8.0,
    carbsPerUnit: 21.0,
    fatPerUnit: 0.6,
    fiberPerUnit: 7.0,
    sodiumPerUnit: 7,
  },
  {
    keywords: ["cabbage", "shredded cabbage"],
    category: "vegetable",
    baseUnit: "cup",
    caloriesPerUnit: 22,
    proteinPerUnit: 1.1,
    carbsPerUnit: 5.2,
    fatPerUnit: 0.1,
    fiberPerUnit: 2.2,
    sodiumPerUnit: 16,
  },
  {
    keywords: ["cucumber"],
    category: "vegetable",
    baseUnit: "piece", // 1 medium
    caloriesPerUnit: 30,
    proteinPerUnit: 1.3,
    carbsPerUnit: 7.3,
    fatPerUnit: 0.2,
    fiberPerUnit: 1.0,
    sodiumPerUnit: 4,
  },

  // --- DAIRY & LIQUIDS ---
  {
    keywords: ["milk", "whole milk", "dairy milk"],
    category: "dairy",
    baseUnit: "cup",
    caloriesPerUnit: 149,
    proteinPerUnit: 7.7,
    carbsPerUnit: 11.7,
    fatPerUnit: 7.9,
    fiberPerUnit: 0,
    sodiumPerUnit: 105,
  },
  {
    keywords: ["almond milk", "oat milk", "soy milk"],
    category: "dairy",
    baseUnit: "cup",
    caloriesPerUnit: 80,
    proteinPerUnit: 2.5,
    carbsPerUnit: 10.0,
    fatPerUnit: 3.0,
    fiberPerUnit: 1.0,
    sodiumPerUnit: 120,
  },
  {
    keywords: ["heavy cream", "whipping cream"],
    category: "dairy",
    baseUnit: "tbsp",
    caloriesPerUnit: 51,
    proteinPerUnit: 0.4,
    carbsPerUnit: 0.4,
    fatPerUnit: 5.4,
    fiberPerUnit: 0,
    sodiumPerUnit: 6,
  },
  {
    keywords: ["sour cream"],
    category: "dairy",
    baseUnit: "tbsp",
    caloriesPerUnit: 26,
    proteinPerUnit: 0.3,
    carbsPerUnit: 0.6,
    fatPerUnit: 2.5,
    fiberPerUnit: 0,
    sodiumPerUnit: 8,
  },
  {
    keywords: ["chicken broth", "vegetable broth", "beef broth", "stock"],
    category: "other",
    baseUnit: "cup",
    caloriesPerUnit: 15,
    proteinPerUnit: 1.5,
    carbsPerUnit: 1.0,
    fatPerUnit: 0.5,
    fiberPerUnit: 0,
    sodiumPerUnit: 550,
  },

  // --- CONDIMENTS & SAUCES ---
  {
    keywords: ["soy sauce", "tamari"],
    category: "seasoning",
    baseUnit: "tbsp",
    caloriesPerUnit: 10,
    proteinPerUnit: 1.3,
    carbsPerUnit: 0.8,
    fatPerUnit: 0,
    fiberPerUnit: 0.1,
    sodiumPerUnit: 920,
  },
  {
    keywords: ["sriracha", "hot sauce", "chili sauce"],
    category: "seasoning",
    baseUnit: "tsp",
    caloriesPerUnit: 5,
    proteinPerUnit: 0.1,
    carbsPerUnit: 1.0,
    fatPerUnit: 0,
    fiberPerUnit: 0.1,
    sodiumPerUnit: 100,
  },
  {
    keywords: ["honey"],
    category: "carb",
    baseUnit: "tbsp",
    caloriesPerUnit: 64,
    proteinPerUnit: 0.1,
    carbsPerUnit: 17.3,
    fatPerUnit: 0,
    fiberPerUnit: 0,
    sodiumPerUnit: 1,
  },
  {
    keywords: ["sugar", "brown sugar", "granulated sugar"],
    category: "carb",
    baseUnit: "tbsp",
    caloriesPerUnit: 48,
    proteinPerUnit: 0,
    carbsPerUnit: 12.5,
    fatPerUnit: 0,
    fiberPerUnit: 0,
    sodiumPerUnit: 1,
  },
  {
    keywords: ["salsa"],
    category: "vegetable",
    baseUnit: "tbsp",
    caloriesPerUnit: 5,
    proteinPerUnit: 0.2,
    carbsPerUnit: 1.2,
    fatPerUnit: 0,
    fiberPerUnit: 0.3,
    sodiumPerUnit: 95,
  },
];

// Unit conversion ratios to standard base units
const UNIT_CONVERSIONS: Record<string, { toUnit: ReferenceFood["baseUnit"]; multiplier: number }> = {
  // Volume to cup
  cup: { toUnit: "cup", multiplier: 1 },
  cups: { toUnit: "cup", multiplier: 1 },
  c: { toUnit: "cup", multiplier: 1 },
  tablespoon: { toUnit: "tbsp", multiplier: 1 },
  tablespoons: { toUnit: "tbsp", multiplier: 1 },
  tbsp: { toUnit: "tbsp", multiplier: 1 },
  tbs: { toUnit: "tbsp", multiplier: 1 },
  t: { toUnit: "tbsp", multiplier: 1 },
  teaspoon: { toUnit: "tsp", multiplier: 1 },
  teaspoons: { toUnit: "tsp", multiplier: 1 },
  tsp: { toUnit: "tsp", multiplier: 1 },
  // Weight to oz
  ounce: { toUnit: "oz", multiplier: 1 },
  ounces: { toUnit: "oz", multiplier: 1 },
  oz: { toUnit: "oz", multiplier: 1 },
  pound: { toUnit: "oz", multiplier: 16 },
  pounds: { toUnit: "oz", multiplier: 16 },
  lb: { toUnit: "oz", multiplier: 16 },
  lbs: { toUnit: "oz", multiplier: 16 },
  gram: { toUnit: "g", multiplier: 1 },
  grams: { toUnit: "g", multiplier: 1 },
  g: { toUnit: "g", multiplier: 1 },
  // Specific discrete counts
  clove: { toUnit: "clove", multiplier: 1 },
  cloves: { toUnit: "clove", multiplier: 1 },
  slice: { toUnit: "slice", multiplier: 1 },
  slices: { toUnit: "slice", multiplier: 1 },
  can: { toUnit: "can", multiplier: 1 },
  cans: { toUnit: "can", multiplier: 1 },
  piece: { toUnit: "piece", multiplier: 1 },
  pieces: { toUnit: "piece", multiplier: 1 },
  stalk: { toUnit: "piece", multiplier: 1 },
  stalks: { toUnit: "piece", multiplier: 1 },
  pinch: { toUnit: "tsp", multiplier: 0.125 },
  pinches: { toUnit: "tsp", multiplier: 0.25 },
  dash: { toUnit: "tsp", multiplier: 0.125 },
};

// Cross-unit conversions when base unit differs from specified unit
function convertUnits(
  fromUnit: ReferenceFood["baseUnit"],
  toUnit: ReferenceFood["baseUnit"],
  quantity: number
): number {
  if (fromUnit === toUnit) return quantity;

  // Volume conversions
  if (fromUnit === "tbsp" && toUnit === "cup") return quantity / 16;
  if (fromUnit === "cup" && toUnit === "tbsp") return quantity * 16;
  if (fromUnit === "tsp" && toUnit === "tbsp") return quantity / 3;
  if (fromUnit === "tbsp" && toUnit === "tsp") return quantity * 3;
  if (fromUnit === "tsp" && toUnit === "cup") return quantity / 48;
  if (fromUnit === "cup" && toUnit === "tsp") return quantity * 48;

  // Weight conversions
  if (fromUnit === "g" && toUnit === "oz") return quantity / 28.35;
  if (fromUnit === "oz" && toUnit === "g") return quantity * 28.35;

  // Common heuristics: 1 piece ~ 4 oz or 1 cup
  if (fromUnit === "piece" && toUnit === "oz") return quantity * 4;
  if (fromUnit === "oz" && toUnit === "piece") return quantity / 4;
  if (fromUnit === "piece" && toUnit === "cup") return quantity * 0.75;
  if (fromUnit === "cup" && toUnit === "piece") return quantity / 0.75;

  // Default fallback
  return quantity;
}

// Convert unicode fractions and fraction strings to numeric float
function parseFractionOrNumber(str: string): number {
  const trimmed = str.trim();
  const unicodeMap: Record<string, number> = {
    "½": 0.5,
    "⅓": 0.333,
    "⅔": 0.667,
    "¼": 0.25,
    "¾": 0.75,
    "⅛": 0.125,
    "⅜": 0.375,
    "⅝": 0.625,
    "⅞": 0.875,
  };

  if (unicodeMap[trimmed]) {
    return unicodeMap[trimmed];
  }

  // Mixed number with unicode: "1 ½"
  const mixedUnicodeMatch = trimmed.match(/^(\d+)\s*([½⅓⅔¼¾⅛⅜⅝⅞])$/);
  if (mixedUnicodeMatch) {
    return parseFloat(mixedUnicodeMatch[1]) + (unicodeMap[mixedUnicodeMatch[2]] || 0);
  }

  // Mixed fraction: "1 1/2"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseFloat(mixedMatch[1]);
    const num = parseFloat(mixedMatch[2]);
    const den = parseFloat(mixedMatch[3]);
    if (den !== 0) return whole + num / den;
  }

  // Simple fraction: "1/2"
  const simpleMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (simpleMatch) {
    const num = parseFloat(simpleMatch[1]);
    const den = parseFloat(simpleMatch[2]);
    if (den !== 0) return num / den;
  }

  // Range: "2-3" or "2 to 3"
  const rangeMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)$/i);
  if (rangeMatch) {
    return (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;
  }

  const num = parseFloat(trimmed);
  return isNaN(num) ? 1 : num;
}

/**
 * Extracts quantity, unit, and clean ingredient name from a raw recipe line.
 */
export function parseIngredientDetails(rawLine: string): {
  quantity: number;
  unit: string;
  foodName: string;
  originalText: string;
} {
  // Strip markdown, bullets, checkboxes, and pricing
  let cleaned = rawLine
    .replace(/^[-*+]\s*/, "")
    .replace(/^\[[ xX]?\]\s*/, "")
    .replace(/\*\*/g, "")
    .trim();

  // Strip cost segments: "— $1.50 [Receipt: $3.99]" or "(~$1.20)"
  cleaned = cleaned.replace(/\s*[-—–]\s*\$[\d.]+(?:\s*\[[^\]]+\])?/i, "");
  cleaned = cleaned.replace(/\s*\(\s*~?\$[\d.]+\s*\)/i, "");

  // Match leading quantity
  // e.g. "2 large eggs", "1 1/2 cups rice", "1/2 cup cheddar", "1 can black beans (15 oz)"
  const qtyRegex = /^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[½⅓⅔¼¾⅛⅜⅝⅞]|\d+\s*[½⅓⅔¼¾⅛⅜⅝⅞]|\d+\s*(?:-|to)\s*\d+))\s*(.*)$/i;
  const match = cleaned.match(qtyRegex);

  let quantity = 1;
  let remainder = cleaned;

  if (match) {
    quantity = parseFractionOrNumber(match[1]);
    remainder = match[2].trim();
  }

  // Check for unit in remainder
  const words = remainder.split(/\s+/);
  const firstWord = words[0]?.toLowerCase().replace(/[.,]/g, "") || "";

  let unit = "piece";
  let foodName = remainder;

  if (UNIT_CONVERSIONS[firstWord]) {
    unit = firstWord;
    foodName = words.slice(1).join(" ");
  }

  // Clean food name: remove prep adjectives like "(diced)", "chopped", "minced"
  foodName = foodName
    .replace(/\([^)]*\)/g, "")
    .replace(/,\s*(diced|chopped|minced|sliced|shredded|crushed|cooked|raw|fresh|frozen|warm|hot|cold)/gi, "")
    .trim();

  return {
    quantity: Math.max(0.1, quantity),
    unit,
    foodName: foodName || cleaned,
    originalText: rawLine,
  };
}

/**
 * Finds the best matching reference food from the database.
 */
function findReferenceFood(foodName: string): ReferenceFood | null {
  const lower = foodName.toLowerCase();

  // Try exact or substring keyword match
  let bestMatch: ReferenceFood | null = null;
  let maxKeywordLength = 0;

  for (const food of FOOD_DATABASE) {
    for (const kw of food.keywords) {
      if (lower.includes(kw)) {
        if (kw.length > maxKeywordLength) {
          maxKeywordLength = kw.length;
          bestMatch = food;
        }
      }
    }
  }

  return bestMatch;
}

/**
 * Estimates nutritional breakdown for a single itemized ingredient.
 */
export function estimateIngredientNutrition(rawLine: string): IngredientNutrition {
  const { quantity, unit, foodName } = parseIngredientDetails(rawLine);
  const refFood = findReferenceFood(foodName);

  if (!refFood) {
    // Intelligent heuristic based on category keyword guesses
    const lower = foodName.toLowerCase();
    let estimatedCalories = 50;
    let protein = 1;
    let carbs = 5;
    let fat = 2;
    let fiber = 0.5;
    let sodium = 50;
    let category: IngredientNutrition["category"] = "other";

    if (/beef|meat|pork|sausage|ham|fish|turkey/i.test(lower)) {
      estimatedCalories = Math.round(quantity * 160);
      protein = Math.round(quantity * 18);
      fat = Math.round(quantity * 9);
      carbs = 0;
      category = "protein";
    } else if (/pasta|noodle|grain|cereal|bread|flour|dough/i.test(lower)) {
      estimatedCalories = Math.round(quantity * 180);
      protein = Math.round(quantity * 5);
      carbs = Math.round(quantity * 35);
      fat = Math.round(quantity * 1);
      fiber = Math.round(quantity * 2);
      category = "carb";
    } else if (/oil|butter|fat|mayo|dressing/i.test(lower)) {
      estimatedCalories = Math.round(quantity * 100);
      fat = Math.round(quantity * 11);
      protein = 0;
      carbs = 0;
      category = "fat";
    } else if (/vegetable|salad|greens|herb|lettuce|slaw/i.test(lower)) {
      estimatedCalories = Math.round(quantity * 25);
      protein = Math.round(quantity * 1);
      carbs = Math.round(quantity * 4);
      fat = 0;
      fiber = Math.round(quantity * 1.5);
      category = "vegetable";
    }

    return {
      name: foodName,
      amount: `${quantity} ${unit !== "piece" ? unit : ""}`.trim(),
      calories: Math.max(5, estimatedCalories),
      proteinGrams: protein,
      carbsGrams: carbs,
      fatGrams: fat,
      fiberGrams: fiber,
      sodiumMg: sodium,
      category,
    };
  }

  // Convert given unit to refFood baseUnit
  const unitInfo = UNIT_CONVERSIONS[unit.toLowerCase()];
  const normalizedUnit = unitInfo ? unitInfo.toUnit : "piece";
  const unitMultiplier = unitInfo ? unitInfo.multiplier : 1;

  const convertedQty = convertUnits(normalizedUnit, refFood.baseUnit, quantity * unitMultiplier);

  const calories = Math.round(convertedQty * refFood.caloriesPerUnit);
  const proteinGrams = Math.round(convertedQty * refFood.proteinPerUnit * 10) / 10;
  const carbsGrams = Math.round(convertedQty * refFood.carbsPerUnit * 10) / 10;
  const fatGrams = Math.round(convertedQty * refFood.fatPerUnit * 10) / 10;
  const fiberGrams = refFood.fiberPerUnit ? Math.round(convertedQty * refFood.fiberPerUnit * 10) / 10 : 0;
  const sodiumMg = refFood.sodiumPerUnit ? Math.round(convertedQty * refFood.sodiumPerUnit) : 10;

  return {
    name: foodName,
    amount: `${quantity} ${unit !== "piece" ? unit : ""}`.trim(),
    calories: Math.max(2, calories),
    proteinGrams,
    carbsGrams,
    fatGrams,
    fiberGrams,
    sodiumMg,
    category: refFood.category,
  };
}

/**
 * Calculates complete recipe nutritional profile and itemized breakdown from ingredients.
 */
export function estimateRecipeNutrition(
  ingredients: string[],
  servings: number = 1,
  recipeTitle: string = "Dorm Recipe"
): NutritionInfo {
  const effectiveServings = Math.max(0.5, servings || 1);

  if (!ingredients || ingredients.length === 0) {
    return {
      recipeName: recipeTitle,
      servings: effectiveServings,
      caloriesPerServing: 350,
      totalCalories: Math.round(350 * effectiveServings),
      proteinGrams: 15,
      carbsGrams: 45,
      fatGrams: 10,
      fiberGrams: 4,
      sodiumMg: 450,
      totalProteinGrams: Math.round(15 * effectiveServings),
      totalCarbsGrams: Math.round(45 * effectiveServings),
      totalFatGrams: Math.round(10 * effectiveServings),
      macroPercentages: { protein: 20, carbs: 55, fat: 25 },
      dietaryTags: ["Balanced Fuel", "Student Friendly"],
      healthNote: "Estimated nutrition based on standard dorm meal preparations.",
      ingredientBreakdown: [],
      source: "ingredient_estimate",
    };
  }

  // Calculate each ingredient's values
  const breakdown = ingredients.map((line) => estimateIngredientNutrition(line));

  // Sum total values
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  let totalSodium = 0;

  for (const item of breakdown) {
    totalCalories += item.calories;
    totalProtein += item.proteinGrams;
    totalCarbs += item.carbsGrams;
    totalFat += item.fatGrams;
    totalFiber += item.fiberGrams || 0;
    totalSodium += item.sodiumMg || 0;
  }

  // Calculate percentage of total calories for each ingredient
  const safeTotalCalories = Math.max(totalCalories, 1);
  for (const item of breakdown) {
    item.percentOfCalories = Math.round((item.calories / safeTotalCalories) * 100);
  }

  // Sort breakdown descending by calorie contribution
  breakdown.sort((a, b) => b.calories - a.calories);

  // Per serving values
  const caloriesPerServing = Math.round(totalCalories / effectiveServings);
  const proteinPerServing = Math.round((totalProtein / effectiveServings) * 10) / 10;
  const carbsPerServing = Math.round((totalCarbs / effectiveServings) * 10) / 10;
  const fatPerServing = Math.round((totalFat / effectiveServings) * 10) / 10;
  const fiberPerServing = Math.round((totalFiber / effectiveServings) * 10) / 10;
  const sodiumPerServing = Math.round(totalSodium / effectiveServings);

  // Calculate macro energy percentages: Protein 4 cal/g, Carbs 4 cal/g, Fat 9 cal/g
  const proteinKcal = proteinPerServing * 4;
  const carbsKcal = carbsPerServing * 4;
  const fatKcal = fatPerServing * 9;
  const totalMacroKcal = Math.max(1, proteinKcal + carbsKcal + fatKcal);

  const proteinPct = Math.round((proteinKcal / totalMacroKcal) * 100);
  const carbsPct = Math.round((carbsKcal / totalMacroKcal) * 100);
  const fatPct = Math.max(0, 100 - proteinPct - carbsPct);

  // Derive smart dietary tags
  const tags: string[] = [];
  if (proteinPerServing >= 28) {
    tags.push("High Protein (28g+)");
  } else if (proteinPerServing >= 18) {
    tags.push("Solid Protein");
  }

  if (fiberPerServing >= 6) {
    tags.push("Fiber Rich (6g+)");
  }

  if (caloriesPerServing <= 400) {
    tags.push("Under 400 Kcal");
  } else if (caloriesPerServing <= 600) {
    tags.push("Moderate Calorie");
  } else {
    tags.push("Hearty Bulk Fuel");
  }

  if (carbsPerServing <= 20) {
    tags.push("Low Carb");
  } else if (carbsPct >= 50) {
    tags.push("High Energy Carbs");
  }

  if (fatPerServing <= 10) {
    tags.push("Low Fat");
  }

  // Check vegetarian
  const hasMeat = breakdown.some(
    (item) =>
      item.category === "protein" &&
      /chicken|beef|pork|bacon|turkey|tuna|salmon|shrimp|meat/i.test(item.name)
  );
  if (!hasMeat) {
    tags.push("Vegetarian");
  }

  // Dorm health advice note
  let healthNote = "";
  if (proteinPerServing >= 25 && carbsPerServing >= 35) {
    healthNote = `Balanced high-protein & complex carb profile providing ${proteinPerServing}g protein for muscle recovery and steady mental stamina during long study sessions.`;
  } else if (proteinPerServing >= 25) {
    healthNote = `Power-packed protein punch (${proteinPerServing}g per serving) that helps promote satiety and prevents late-night dorm snacking.`;
  } else if (caloriesPerServing <= 450) {
    healthNote = `Light, nutrient-dense dorm meal (${caloriesPerServing} kcal) that prevents the classic afternoon food-coma so you stay alert.`;
  } else {
    healthNote = `Hearty comfort fuel delivering ${caloriesPerServing} kcal and essential macronutrients for busy collegiate schedules.`;
  }

  return {
    recipeName: recipeTitle,
    servings: effectiveServings,
    caloriesPerServing,
    totalCalories,
    proteinGrams: proteinPerServing,
    carbsGrams: carbsPerServing,
    fatGrams: fatPerServing,
    fiberGrams: fiberPerServing,
    sodiumMg: sodiumPerServing,
    totalProteinGrams: Math.round(totalProtein),
    totalCarbsGrams: Math.round(totalCarbs),
    totalFatGrams: Math.round(totalFat),
    macroPercentages: {
      protein: proteinPct,
      carbs: carbsPct,
      fat: fatPct,
    },
    dietaryTags: tags.slice(0, 4),
    healthNote,
    ingredientBreakdown: breakdown,
    source: "ingredient_estimate",
  };
}

// Daily reference values (based on 2000 kcal standard diet)
export const DAILY_VALUES = {
  calories: 2000,
  protein: 50, // g
  carbs: 275, // g
  fat: 78, // g
  fiber: 28, // g
  sodium: 2300, // mg
};

export function calculateDailyValuePercent(
  nutrient: keyof typeof DAILY_VALUES,
  amount: number
): number {
  const reference = DAILY_VALUES[nutrient];
  if (!reference || amount <= 0) return 0;
  return Math.round((amount / reference) * 100);
}
