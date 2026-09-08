import React, { useState } from "react";
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
  Info,
  Scale,
  Zap,
} from "lucide-react";
import { NutritionInfo } from "../types";
import { getAuthHeaders } from "../lib/supabaseClient";

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
  const [nutrition, setNutrition] = useState<NutritionInfo | null>(initialNutrition);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"per_serving" | "total">("per_serving");
  const [showIngredientDetails, setShowIngredientDetails] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const fetchNutrition = async () => {
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
          servings: servingsCount || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.nutrition) {
        setNutrition(data.nutrition);
        if (onNutritionLoaded) {
          onNutritionLoaded(data.nutrition);
        }
      } else {
        throw new Error("Invalid response format from nutrition service.");
      }
    } catch (err: any) {
      console.error("Failed to estimate nutrition:", err);
      setError(err.message || "Failed to estimate nutrition with AI model. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (!nutrition) return;
    const isPerServing = viewMode === "per_serving";
    const title = recipeTitle || nutrition.recipeName || "Dorm Chef Recipe";
    const summary = [
      `🥗 Nutrition Breakdown: ${title}`,
      `Portion: ${isPerServing ? "Per Serving" : `Entire Recipe (${nutrition.servings} servings)`}`,
      `• Calories: ${isPerServing ? nutrition.caloriesPerServing : nutrition.totalCalories} kcal`,
      `• Protein: ${isPerServing ? nutrition.proteinGrams : nutrition.totalProteinGrams || nutrition.proteinGrams * nutrition.servings}g`,
      `• Carbohydrates: ${isPerServing ? nutrition.carbsGrams : nutrition.totalCarbsGrams || nutrition.carbsGrams * nutrition.servings}g`,
      `• Fats: ${isPerServing ? nutrition.fatGrams : nutrition.totalFatGrams || nutrition.fatGrams * nutrition.servings}g`,
      nutrition.fiberGrams ? `• Fiber: ${nutrition.fiberGrams}g` : null,
      nutrition.sodiumMg ? `• Sodium: ${nutrition.sodiumMg}mg` : null,
      nutrition.healthNote ? `\nTip: ${nutrition.healthNote}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // If no nutrition has been estimated yet, show the prompt card to trigger estimation
  if (!nutrition && !loading) {
    return (
      <div
        id="recipe-nutrition-breakdown"
        className="my-6 bg-[#FAF8F5] border-2 border-dashed border-black/20 rounded-2xl p-4 sm:p-6 transition-all hover:border-[#ec4899]/50 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30 flex items-center justify-center shrink-0 mt-0.5">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-sm sm:text-base text-black tracking-tight">
                  Nutritional Breakdown & Macros
                </h4>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#ec4899]/15 text-[#ec4899] border border-[#ec4899]/25 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> AI Model
                </span>
              </div>
              <p className="text-xs text-black/65 font-medium mt-1 max-w-xl">
                Estimate calories, protein, carbs, and fat per serving for this dorm recipe using Gemini AI.
              </p>
              {error && (
                <div className="mt-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          </div>

          <button
            id="estimate-nutrition-btn"
            onClick={fetchNutrition}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#ec4899] hover:bg-[#db2777] text-white px-4 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all cursor-pointer shadow-xs hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Estimate Nutrition</span>
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div
        id="recipe-nutrition-breakdown"
        className="my-6 bg-[#FAF8F5] border-2 border-black/15 rounded-2xl p-6 sm:p-8 text-center shadow-xs"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#ec4899]/15 text-[#ec4899] mb-3 animate-bounce">
          <HeartPulse className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-black tracking-tight flex items-center justify-center gap-2">
          <span>Estimating Nutritional Breakdown</span>
          <div className="w-3.5 h-3.5 border-2 border-[#ec4899] border-t-transparent animate-spin rounded-full" />
        </h4>
        <p className="text-xs text-black/60 font-medium mt-1.5 max-w-md mx-auto">
          Gemini is analyzing the ingredients, portion sizes, and dorm cooking methods to calculate calories & macro ratios...
        </p>
      </div>
    );
  }

  if (!nutrition) return null;

  // Calculation values depending on view mode
  const isPerServing = viewMode === "per_serving";
  const servings = nutrition.servings || 1;
  const currentCalories = isPerServing
    ? nutrition.caloriesPerServing
    : nutrition.totalCalories || nutrition.caloriesPerServing * servings;
  const currentProtein = isPerServing
    ? nutrition.proteinGrams
    : nutrition.totalProteinGrams || nutrition.proteinGrams * servings;
  const currentCarbs = isPerServing
    ? nutrition.carbsGrams
    : nutrition.totalCarbsGrams || nutrition.carbsGrams * servings;
  const currentFat = isPerServing
    ? nutrition.fatGrams
    : nutrition.totalFatGrams || nutrition.fatGrams * servings;

  // Macro percentages calculation
  const totalMacroGrams = currentProtein + currentCarbs + currentFat || 1;
  const proteinPercent = Math.round(
    nutrition.macroPercentages?.protein || (currentProtein / totalMacroGrams) * 100
  );
  const carbsPercent = Math.round(
    nutrition.macroPercentages?.carbs || (currentCarbs / totalMacroGrams) * 100
  );
  const fatPercent = Math.round(
    nutrition.macroPercentages?.fat || (currentFat / totalMacroGrams) * 100
  );

  return (
    <div
      id="recipe-nutrition-breakdown"
      className="my-6 bg-[#FAF8F5] border-2 border-black/15 rounded-2xl p-4 sm:p-6 shadow-xs font-sans scroll-mt-6"
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30 flex items-center justify-center shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm sm:text-base text-black tracking-tight">
                Nutritional Profile & Macros
              </h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> AI Estimated
              </span>
            </div>
            <p className="text-xs text-black/60 font-medium mt-0.5">
              Calculated for {nutrition.servings} {nutrition.servings === 1 ? "serving" : "servings"} • {nutrition.recipeName || recipeTitle || "Dorm Meal"}
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
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
              Total Recipe ({servings}x)
            </button>
          </div>

          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1 bg-white hover:bg-black/5 text-black border border-black/15 px-2.5 py-1 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Copy nutrition summary"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSummary ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={fetchNutrition}
            disabled={loading}
            className="flex items-center gap-1 bg-white hover:bg-black/5 text-black border border-black/15 px-2.5 py-1 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Recalculate nutrition with AI"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Nutrition Grid: Calories + 3 Core Macros */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        {/* Calories */}
        <div className="bg-white border-2 border-black/10 rounded-xl p-3.5 shadow-2xs relative overflow-hidden group">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold text-black/60 uppercase tracking-wide">Calories</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-black font-mono tracking-tight">
              {currentCalories}
            </span>
            <span className="text-xs font-semibold text-black/50">kcal</span>
          </div>
          <span className="text-[10px] text-black/50 block mt-1">
            {isPerServing ? `Total: ${nutrition.totalCalories || nutrition.caloriesPerServing * servings} kcal` : `${servings} portions`}
          </span>
        </div>

        {/* Protein */}
        <div className="bg-white border-2 border-black/10 rounded-xl p-3.5 shadow-2xs relative overflow-hidden group">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
              <span>Protein</span>
            </span>
            <Dna className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tracking-tight">
              {currentProtein}
            </span>
            <span className="text-xs font-semibold text-emerald-600">g</span>
          </div>
          <span className="text-[10px] text-emerald-800/70 font-semibold block mt-1">
            {proteinPercent}% of calories
          </span>
        </div>

        {/* Carbohydrates */}
        <div className="bg-white border-2 border-black/10 rounded-xl p-3.5 shadow-2xs relative overflow-hidden group">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">Carbs</span>
            <Wheat className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-amber-700 font-mono tracking-tight">
              {currentCarbs}
            </span>
            <span className="text-xs font-semibold text-amber-600">g</span>
          </div>
          <span className="text-[10px] text-amber-800/70 font-semibold block mt-1">
            {carbsPercent}% of calories
          </span>
        </div>

        {/* Fats */}
        <div className="bg-white border-2 border-black/10 rounded-xl p-3.5 shadow-2xs relative overflow-hidden group">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wide">Fat</span>
            <Droplets className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-rose-700 font-mono tracking-tight">
              {currentFat}
            </span>
            <span className="text-xs font-semibold text-rose-600">g</span>
          </div>
          <span className="text-[10px] text-rose-800/70 font-semibold block mt-1">
            {fatPercent}% of calories
          </span>
        </div>
      </div>

      {/* Visual Macro Split Progress Bar */}
      <div className="bg-white border border-black/10 rounded-xl p-3.5 mb-4 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-bold text-black/75 mb-2">
          <span className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Macronutrient Ratio Split</span>
          </span>
          <span className="text-[11px] font-mono text-black/50 font-normal">
            P {proteinPercent}% • C {carbsPercent}% • F {fatPercent}%
          </span>
        </div>

        {/* Proportional bar */}
        <div className="w-full h-3.5 rounded-full bg-black/5 overflow-hidden flex p-0.5 border border-black/10">
          <div
            style={{ width: `${Math.max(proteinPercent, 5)}%` }}
            className="h-full bg-emerald-500 rounded-l-full transition-all duration-500 relative group"
            title={`Protein: ${currentProtein}g (${proteinPercent}%)`}
          />
          <div
            style={{ width: `${Math.max(carbsPercent, 5)}%` }}
            className="h-full bg-amber-400 transition-all duration-500 relative group"
            title={`Carbohydrates: ${currentCarbs}g (${carbsPercent}%)`}
          />
          <div
            style={{ width: `${Math.max(fatPercent, 5)}%` }}
            className="h-full bg-rose-400 rounded-r-full transition-all duration-500 relative group"
            title={`Fat: ${currentFat}g (${fatPercent}%)`}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] font-medium text-black/70 mt-2 px-1 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Protein ({currentProtein}g)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span>Carbs ({currentCarbs}g)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
            <span>Fat ({currentFat}g)</span>
          </div>
        </div>
      </div>

      {/* Additional Stats: Fiber, Sodium, Tags, Health Note */}
      <div className="space-y-3">
        {/* Micro-metrics & Tags Row */}
        <div className="flex flex-wrap items-center gap-2">
          {nutrition.fiberGrams !== undefined && nutrition.fiberGrams !== null && (
            <div className="bg-white border border-black/10 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs">
              <span className="text-black/55 font-medium">Fiber:</span>
              <span className="font-bold text-black font-mono">
                {isPerServing ? nutrition.fiberGrams : (nutrition.fiberGrams * servings).toFixed(0)}g
              </span>
            </div>
          )}

          {nutrition.sodiumMg !== undefined && nutrition.sodiumMg !== null && (
            <div className="bg-white border border-black/10 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs">
              <span className="text-black/55 font-medium">Sodium:</span>
              <span className="font-bold text-black font-mono">
                {isPerServing ? nutrition.sodiumMg : (nutrition.sodiumMg * servings).toFixed(0)}mg
              </span>
            </div>
          )}

          {/* Dietary tags */}
          {nutrition.dietaryTags?.map((tag) => (
            <span
              key={tag}
              className="bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30 px-2.5 py-1 rounded-xl text-xs font-bold"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Student Health & Study Energy Insight */}
        {nutrition.healthNote && (
          <div className="bg-white border border-black/10 rounded-xl p-3 flex items-start gap-2.5 shadow-2xs text-xs text-black/80 font-medium">
            <Zap className="w-4 h-4 text-[#ec4899] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-black mr-1">Dorm Fuel Insight:</span>
              <span>{nutrition.healthNote}</span>
            </div>
          </div>
        )}

        {/* Collapsible Itemized Ingredient Breakdown */}
        {nutrition.ingredientBreakdown && nutrition.ingredientBreakdown.length > 0 && (
          <div className="border border-black/10 rounded-xl overflow-hidden bg-white shadow-2xs">
            <button
              onClick={() => setShowIngredientDetails(!showIngredientDetails)}
              className="w-full flex items-center justify-between p-3 text-xs font-bold text-black hover:bg-black/5 transition-colors cursor-pointer select-none"
            >
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#ec4899]" />
                <span>Itemized Ingredient Nutritional Breakdown ({nutrition.ingredientBreakdown.length} items)</span>
              </span>
              <div className="flex items-center gap-1 text-black/50 text-[11px] font-normal">
                <span>{showIngredientDetails ? "Hide" : "Show"}</span>
                {showIngredientDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            <AnimatePresence>
              {showIngredientDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-black/10 divide-y divide-black/5 overflow-x-auto"
                >
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-black/5 text-black/70 font-semibold text-[11px]">
                        <th className="py-2 px-3">Ingredient</th>
                        <th className="py-2 px-2 text-right">Calories</th>
                        <th className="py-2 px-2 text-right">Protein</th>
                        <th className="py-2 px-2 text-right">Carbs</th>
                        <th className="py-2 px-3 text-right">Fat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 font-mono">
                      {nutrition.ingredientBreakdown.map((item, idx) => (
                        <tr key={idx} className="hover:bg-black/[0.02]">
                          <td className="py-2 px-3 font-sans font-medium text-black">
                            {item.name}
                            {item.amount && <span className="text-[10px] text-black/50 ml-1 font-mono">({item.amount})</span>}
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-black">
                            {item.calories} <span className="text-[10px] text-black/50 font-normal">kcal</span>
                          </td>
                          <td className="py-2 px-2 text-right text-emerald-700">
                            {item.proteinGrams}g
                          </td>
                          <td className="py-2 px-2 text-right text-amber-700">
                            {item.carbsGrams}g
                          </td>
                          <td className="py-2 px-3 text-right text-rose-700">
                            {item.fatGrams}g
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
