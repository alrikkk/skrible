import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Flame,
  Dna,
  Wheat,
  Droplets,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Copy,
  Check,
  Scale,
  Zap,
  ShieldCheck,
  ArrowUpDown,
  Layers,
} from "lucide-react";
import { NutritionInfo, IngredientNutrition } from "../types";
import { getAuthHeaders } from "../lib/supabaseClient";
import {
  estimateRecipeNutrition,
  calculateDailyValuePercent,
} from "../utils/nutritionEstimator";

interface RecipeNutritionCardProps {
  recipeText: string;
  ingredients: string[];
  servingsCount?: number | null;
  recipeTitle?: string;
  initialNutrition?: NutritionInfo | null;
  onNutritionLoaded?: (data: NutritionInfo) => void;
}

export const RecipeNutritionCard: React.FC<RecipeNutritionCardProps> = ({
  recipeText,
  ingredients,
  servingsCount,
  recipeTitle,
  initialNutrition = null,
  onNutritionLoaded,
}) => {
  const currentServings = servingsCount && servingsCount > 0 ? servingsCount : 1;

  // Compute instant ingredient-based nutritional baseline
  const localEstimatedNutrition = useMemo(() => {
    return estimateRecipeNutrition(
      ingredients,
      currentServings,
      recipeTitle || "Dorm Chef Recipe"
    );
  }, [ingredients, currentServings, recipeTitle]);

  const [nutrition, setNutrition] = useState<NutritionInfo | null>(
    initialNutrition || localEstimatedNutrition
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"per_serving" | "total">("per_serving");
  const [showIngredientDetails, setShowIngredientDetails] = useState(true);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [sortBy, setSortBy] = useState<"calories" | "protein" | "name">("calories");

  // Keep nutrition synchronized when ingredients or servings change, unless user has active AI-refined data
  useEffect(() => {
    if (initialNutrition) {
      setNutrition(initialNutrition);
    } else {
      setNutrition(localEstimatedNutrition);
    }
  }, [localEstimatedNutrition, initialNutrition]);

  // If servings changed and we have existing AI data, scale it proportionally
  useEffect(() => {
    if (nutrition && nutrition.isAiGenerated && nutrition.servings !== currentServings) {
      const ratio = currentServings / (nutrition.servings || 1);
      setNutrition((prev) => {
        if (!prev) return localEstimatedNutrition;
        return {
          ...prev,
          servings: currentServings,
          totalCalories: Math.round(prev.caloriesPerServing * currentServings),
          totalProteinGrams: Math.round(prev.proteinGrams * currentServings),
          totalCarbsGrams: Math.round(prev.carbsGrams * currentServings),
          totalFatGrams: Math.round(prev.fatGrams * currentServings),
          ingredientBreakdown: prev.ingredientBreakdown?.map((item) => ({
            ...item,
            calories: Math.round(item.calories * ratio),
            proteinGrams: Math.round(item.proteinGrams * ratio * 10) / 10,
            carbsGrams: Math.round(item.carbsGrams * ratio * 10) / 10,
            fatGrams: Math.round(item.fatGrams * ratio * 10) / 10,
          })),
        };
      });
    }
  }, [currentServings]);

  // Request Gemini AI for deep culinary nutritional refinement
  const fetchAINutrition = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          recipeText,
          ingredients,
          servings: currentServings,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.nutrition) {
        const aiData: NutritionInfo = {
          ...data.nutrition,
          isAiGenerated: true,
          source: "ai_analysis",
        };
        setNutrition(aiData);
        if (onNutritionLoaded) {
          onNutritionLoaded(aiData);
        }
      } else {
        throw new Error("Invalid response format from nutrition service.");
      }
    } catch (err: any) {
      console.error("Failed to estimate nutrition with AI:", err);
      setError(err.message || "Failed to fine-tune nutrition with AI. Using ingredient-based estimates.");
    } finally {
      setLoading(false);
    }
  };

  const activeNutrition = nutrition || localEstimatedNutrition;
  const isPerServing = viewMode === "per_serving";
  const servings = activeNutrition.servings || currentServings;

  // Active values based on viewMode
  const displayCalories = isPerServing
    ? activeNutrition.caloriesPerServing
    : activeNutrition.totalCalories || activeNutrition.caloriesPerServing * servings;
  const displayProtein = isPerServing
    ? activeNutrition.proteinGrams
    : activeNutrition.totalProteinGrams || activeNutrition.proteinGrams * servings;
  const displayCarbs = isPerServing
    ? activeNutrition.carbsGrams
    : activeNutrition.totalCarbsGrams || activeNutrition.carbsGrams * servings;
  const displayFat = isPerServing
    ? activeNutrition.fatGrams
    : activeNutrition.totalFatGrams || activeNutrition.fatGrams * servings;

  const displayFiber =
    activeNutrition.fiberGrams !== undefined
      ? isPerServing
        ? activeNutrition.fiberGrams
        : Math.round((activeNutrition.fiberGrams * servings) * 10) / 10
      : null;

  const displaySodium =
    activeNutrition.sodiumMg !== undefined
      ? isPerServing
        ? activeNutrition.sodiumMg
        : Math.round(activeNutrition.sodiumMg * servings)
      : null;

  const netCarbs =
    displayFiber !== null ? Math.max(0, Math.round((displayCarbs - displayFiber) * 10) / 10) : displayCarbs;

  // Macro calorie energy percentages
  const proteinKcal = displayProtein * 4;
  const carbsKcal = displayCarbs * 4;
  const fatKcal = displayFat * 9;
  const totalMacroKcal = Math.max(1, proteinKcal + carbsKcal + fatKcal);

  const proteinPercent = Math.round(
    activeNutrition.macroPercentages?.protein || (proteinKcal / totalMacroKcal) * 100
  );
  const carbsPercent = Math.round(
    activeNutrition.macroPercentages?.carbs || (carbsKcal / totalMacroKcal) * 100
  );
  const fatPercent = Math.max(
    0,
    100 - proteinPercent - carbsPercent
  );

  // Daily value percentages (DV%)
  const caloriesDV = calculateDailyValuePercent("calories", displayCalories);
  const proteinDV = calculateDailyValuePercent("protein", displayProtein);
  const carbsDV = calculateDailyValuePercent("carbs", displayCarbs);
  const fatDV = calculateDailyValuePercent("fat", displayFat);
  const fiberDV = displayFiber !== null ? calculateDailyValuePercent("fiber", displayFiber) : 0;
  const sodiumDV = displaySodium !== null ? calculateDailyValuePercent("sodium", displaySodium) : 0;

  // Sort itemized ingredients
  const sortedBreakdown = useMemo(() => {
    const list = [...(activeNutrition.ingredientBreakdown || [])];
    if (sortBy === "calories") {
      return list.sort((a, b) => b.calories - a.calories);
    }
    if (sortBy === "protein") {
      return list.sort((a, b) => b.proteinGrams - a.proteinGrams);
    }
    if (sortBy === "name") {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [activeNutrition.ingredientBreakdown, sortBy]);

  const handleCopySummary = () => {
    const title = recipeTitle || activeNutrition.recipeName || "Dorm Chef Recipe";
    const lines = [
      `🥗 Nutrition Facts: ${title}`,
      `Portion: ${isPerServing ? "Per Serving" : `Entire Recipe (${servings} servings)`}`,
      `───────────────────────────────`,
      `• Calories: ${displayCalories} kcal (${caloriesDV}% DV)`,
      `• Protein: ${displayProtein}g (${proteinDV}% DV • ${proteinPercent}% of calories)`,
      `• Carbohydrates: ${displayCarbs}g (${carbsDV}% DV • ${carbsPercent}% of calories)`,
      `  - Net Carbs: ${netCarbs}g`,
      displayFiber !== null ? `  - Dietary Fiber: ${displayFiber}g (${fiberDV}% DV)` : null,
      `• Fat: ${displayFat}g (${fatDV}% DV • ${fatPercent}% of calories)`,
      displaySodium !== null ? `• Sodium: ${displaySodium}mg (${sodiumDV}% DV)` : null,
      activeNutrition.dietaryTags?.length ? `• Dietary Tags: ${activeNutrition.dietaryTags.join(", ")}` : null,
      activeNutrition.healthNote ? `\nStudent Fuel Note: ${activeNutrition.healthNote}` : null,
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div
      id="recipe-nutrition-breakdown"
      className="my-6 bg-[#FAF8F5] border-2 border-black/15 rounded-2xl p-4 sm:p-6 shadow-xs font-sans scroll-mt-6"
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30 flex items-center justify-center shrink-0 mt-0.5">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm sm:text-base text-black tracking-tight">
                Nutritional Value Breakdown & Macros
              </h4>
              {activeNutrition.isAiGenerated ? (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#ec4899]/15 text-[#ec4899] border border-[#ec4899]/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Gemini AI Refined
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" /> Ingredients Calculated
                </span>
              )}
            </div>
            <p className="text-xs text-black/60 font-medium mt-0.5">
              Calculated from itemized ingredient measurements for {servings}{" "}
              {servings === 1 ? "serving" : "servings"} • {recipeTitle || "Dorm Meal"}
            </p>
          </div>
        </div>

        {/* CONTROLS: VIEW MODE & ACTIONS */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Per Serving / Total Recipe Toggle */}
          <div className="inline-flex p-0.5 bg-white border border-black/15 rounded-xl text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setViewMode("per_serving")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                isPerServing ? "bg-black text-white" : "text-black/70 hover:bg-black/5"
              }`}
            >
              Per Serving
            </button>
            <button
              onClick={() => setViewMode("total")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                !isPerServing ? "bg-black text-white" : "text-black/70 hover:bg-black/5"
              }`}
            >
              Total ({servings}x)
            </button>
          </div>

          {/* Copy Summary */}
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1 bg-white hover:bg-black/5 text-black border border-black/15 px-2.5 py-1 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            title="Copy nutrition breakdown to clipboard"
          >
            {copiedSummary ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedSummary ? "Copied" : "Copy"}</span>
          </button>

          {/* AI Fine-Tuning Refresh */}
          <button
            onClick={fetchAINutrition}
            disabled={loading}
            className={`flex items-center gap-1.5 border px-2.5 py-1 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98] ${
              activeNutrition.isAiGenerated
                ? "bg-white hover:bg-black/5 text-black border-black/15"
                : "bg-[#ec4899] hover:bg-[#db2777] text-white border-[#ec4899]"
            }`}
            title="Refine nutrition values using Gemini AI culinary model"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Analyzing..." : activeNutrition.isAiGenerated ? "Re-analyze" : "AI Refine"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
          {error}
        </div>
      )}

      {/* 4 CORE NUTRITION CARDS: Calories, Protein, Carbs, Fat */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        {/* Calories Card */}
        <div className="bg-white border-2 border-black/10 rounded-xl p-3.5 shadow-2xs relative overflow-hidden group">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold text-black/60 uppercase tracking-wide">
              Calories
            </span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-black font-mono tracking-tight">
              {displayCalories}
            </span>
            <span className="text-xs font-semibold text-black/50">kcal</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px]">
            <span className="text-black/50 font-medium">{caloriesDV}% Daily Value</span>
            <span className="font-mono text-black/40">
              {isPerServing ? `Total: ${activeNutrition.totalCalories} kcal` : `${servings} portions`}
            </span>
          </div>
        </div>

        {/* Protein Card */}
        <div className="bg-white border-2 border-black/10 rounded-xl p-3.5 shadow-2xs relative overflow-hidden group">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
              Protein
            </span>
            <Dna className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tracking-tight">
              {displayProtein}
            </span>
            <span className="text-xs font-semibold text-emerald-600">g</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px]">
            <span className="text-emerald-800/80 font-bold">{proteinPercent}% of cals</span>
            <span className="text-black/50 font-medium">{proteinDV}% DV</span>
          </div>
        </div>

        {/* Carbs Card */}
        <div className="bg-white border-2 border-black/10 rounded-xl p-3.5 shadow-2xs relative overflow-hidden group">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
              Carbohydrates
            </span>
            <Wheat className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-amber-700 font-mono tracking-tight">
              {displayCarbs}
            </span>
            <span className="text-xs font-semibold text-amber-600">g</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px]">
            <span className="text-amber-800/80 font-bold">{carbsPercent}% of cals</span>
            <span className="text-black/50 font-medium">{carbsDV}% DV</span>
          </div>
        </div>

        {/* Fat Card */}
        <div className="bg-white border-2 border-black/10 rounded-xl p-3.5 shadow-2xs relative overflow-hidden group">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wide">
              Total Fat
            </span>
            <Droplets className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-rose-700 font-mono tracking-tight">
              {displayFat}
            </span>
            <span className="text-xs font-semibold text-rose-600">g</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px]">
            <span className="text-rose-800/80 font-bold">{fatPercent}% of cals</span>
            <span className="text-black/50 font-medium">{fatDV}% DV</span>
          </div>
        </div>
      </div>

      {/* MACRONUTRIENT RATIO SPLIT PROGRESS BAR */}
      <div className="bg-white border border-black/10 rounded-xl p-3.5 mb-4 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-bold text-black/75 mb-2">
          <span className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Energy Macro Calorie Split</span>
          </span>
          <span className="text-[11px] font-mono text-black/60 font-semibold">
            Protein {proteinPercent}% • Carbs {carbsPercent}% • Fat {fatPercent}%
          </span>
        </div>

        {/* Proportional Split Bar */}
        <div className="w-full h-3 rounded-full bg-black/5 overflow-hidden flex p-0.5 border border-black/10">
          <div
            style={{ width: `${Math.max(proteinPercent, 4)}%` }}
            className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
            title={`Protein: ${displayProtein}g (${proteinPercent}%)`}
          />
          <div
            style={{ width: `${Math.max(carbsPercent, 4)}%` }}
            className="h-full bg-amber-400 transition-all duration-500"
            title={`Carbs: ${displayCarbs}g (${carbsPercent}%)`}
          />
          <div
            style={{ width: `${Math.max(fatPercent, 4)}%` }}
            className="h-full bg-rose-400 rounded-r-full transition-all duration-500"
            title={`Fat: ${displayFat}g (${fatPercent}%)`}
          />
        </div>

        {/* Micro Badges & Secondary Metrics */}
        <div className="flex items-center justify-between text-[11px] font-medium text-black/70 mt-2 px-1 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="font-semibold text-black">Protein ({displayProtein}g)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="font-semibold text-black">Carbs ({displayCarbs}g)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
            <span className="font-semibold text-black">Fat ({displayFat}g)</span>
          </div>
        </div>
      </div>

      {/* SECONDARY METRICS: FIBER, SODIUM, NET CARBS & DIETARY TAGS */}
      <div className="space-y-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {displayFiber !== null && (
            <div className="bg-white border border-black/10 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs">
              <span className="text-black/55 font-medium">Dietary Fiber:</span>
              <span className="font-bold text-black font-mono">{displayFiber}g</span>
              <span className="text-[10px] text-black/40">({fiberDV}% DV)</span>
            </div>
          )}

          {displayFiber !== null && (
            <div className="bg-white border border-black/10 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs">
              <span className="text-black/55 font-medium">Net Carbs:</span>
              <span className="font-bold text-black font-mono">{netCarbs}g</span>
            </div>
          )}

          {displaySodium !== null && (
            <div className="bg-white border border-black/10 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs">
              <span className="text-black/55 font-medium">Sodium:</span>
              <span className="font-bold text-black font-mono">{displaySodium}mg</span>
              <span className="text-[10px] text-black/40">({sodiumDV}% DV)</span>
            </div>
          )}

          {/* Dietary Badges */}
          {activeNutrition.dietaryTags?.map((tag) => (
            <span
              key={tag}
              className="bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30 px-2.5 py-1 rounded-xl text-xs font-bold"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Student Health & Study Energy Insight */}
        {activeNutrition.healthNote && (
          <div className="bg-white border border-black/10 rounded-xl p-3 flex items-start gap-2.5 shadow-2xs text-xs text-black/80 font-medium">
            <Zap className="w-4 h-4 text-[#ec4899] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-black mr-1">Dorm Fuel Insight:</span>
              <span>{activeNutrition.healthNote}</span>
            </div>
          </div>
        )}
      </div>

      {/* ITEMIZED INGREDIENT NUTRITIONAL BREAKDOWN TABLE */}
      {activeNutrition.ingredientBreakdown && activeNutrition.ingredientBreakdown.length > 0 && (
        <div className="border border-black/10 rounded-xl overflow-hidden bg-white shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2 bg-black/[0.02] border-b border-black/10">
            <button
              onClick={() => setShowIngredientDetails(!showIngredientDetails)}
              className="flex items-center gap-2 text-xs font-bold text-black cursor-pointer select-none"
            >
              <Layers className="w-3.5 h-3.5 text-[#ec4899]" />
              <span>
                Itemized Ingredient Breakdown ({activeNutrition.ingredientBreakdown.length} items)
              </span>
              <div className="flex items-center text-black/50 text-[11px] font-normal ml-1">
                {showIngredientDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </div>
            </button>

            {showIngredientDetails && (
              <div className="flex items-center gap-1.5 text-xs text-black/60">
                <ArrowUpDown className="w-3 h-3 text-black/40" />
                <span className="text-[11px] font-semibold">Sort by:</span>
                <div className="inline-flex bg-white border border-black/15 rounded-lg p-0.5 text-[11px] font-medium">
                  <button
                    onClick={() => setSortBy("calories")}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      sortBy === "calories" ? "bg-black text-white font-bold" : "text-black/70 hover:bg-black/5"
                    }`}
                  >
                    Calories
                  </button>
                  <button
                    onClick={() => setSortBy("protein")}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      sortBy === "protein" ? "bg-black text-white font-bold" : "text-black/70 hover:bg-black/5"
                    }`}
                  >
                    Protein
                  </button>
                  <button
                    onClick={() => setSortBy("name")}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      sortBy === "name" ? "bg-black text-white font-bold" : "text-black/70 hover:bg-black/5"
                    }`}
                  >
                    Name
                  </button>
                </div>
              </div>
            )}
          </div>

          <AnimatePresence>
            {showIngredientDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-x-auto"
              >
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-black/5 text-black/70 font-semibold text-[11px]">
                      <th className="py-2.5 px-3">Ingredient</th>
                      <th className="py-2.5 px-2 text-right">Calories</th>
                      <th className="py-2.5 px-2 text-right">Protein</th>
                      <th className="py-2.5 px-2 text-right">Carbs</th>
                      <th className="py-2.5 px-3 text-right">Fat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 font-mono">
                    {sortedBreakdown.map((item, idx) => {
                      const calorieShare =
                        activeNutrition.totalCalories > 0
                          ? Math.round((item.calories / activeNutrition.totalCalories) * 100)
                          : 0;

                      return (
                        <tr key={idx} className="hover:bg-black/[0.02] transition-colors">
                          <td className="py-2.5 px-3 font-sans">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-black">{item.name}</span>
                              {item.amount && (
                                <span className="text-[10px] text-black/50 font-mono">
                                  ({item.amount})
                                </span>
                              )}
                              {item.category && item.category !== "other" && (
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-black/5 text-black/60 border border-black/10">
                                  {item.category}
                                </span>
                              )}
                            </div>
                            {/* Mini contribution bar */}
                            <div className="w-24 h-1 bg-black/10 rounded-full mt-1 overflow-hidden">
                              <div
                                style={{ width: `${Math.min(100, calorieShare)}%` }}
                                className="h-full bg-[#ec4899] rounded-full"
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <span className="font-bold text-black">{item.calories}</span>{" "}
                            <span className="text-[10px] text-black/40 font-normal">
                              ({calorieShare}%)
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right text-emerald-700 font-semibold">
                            {item.proteinGrams}g
                          </td>
                          <td className="py-2.5 px-2 text-right text-amber-700 font-semibold">
                            {item.carbsGrams}g
                          </td>
                          <td className="py-2.5 px-3 text-right text-rose-700 font-semibold">
                            {item.fatGrams}g
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-black/5 font-bold font-mono text-xs border-t border-black/10">
                      <td className="py-2.5 px-3 font-sans text-black">
                        Total Itemized Ingredients ({sortedBreakdown.length} items)
                      </td>
                      <td className="py-2.5 px-2 text-right text-black">
                        {activeNutrition.totalCalories} kcal
                      </td>
                      <td className="py-2.5 px-2 text-right text-emerald-700">
                        {activeNutrition.totalProteinGrams ||
                          Math.round(activeNutrition.proteinGrams * servings)}
                        g
                      </td>
                      <td className="py-2.5 px-2 text-right text-amber-700">
                        {activeNutrition.totalCarbsGrams ||
                          Math.round(activeNutrition.carbsGrams * servings)}
                        g
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-700">
                        {activeNutrition.totalFatGrams ||
                          Math.round(activeNutrition.fatGrams * servings)}
                        g
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
