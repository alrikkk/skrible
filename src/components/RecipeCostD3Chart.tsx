import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { PieChart, BarChart3, Sparkles, DollarSign, Wallet, ArrowUpRight } from "lucide-react";

export interface RecipeCostD3ChartProps {
  ingredients: string[];
  totalCost?: string | number | null;
  budget?: string | number | null;
  remainingBudget?: string | number | null;
}

export interface CategorizedCostItem {
  category: string;
  key: string;
  color: string;
  totalCost: number;
  percentage: number;
  items: Array<{ name: string; cost: number; raw: string }>;
}

const CATEGORY_DEFINITIONS = [
  {
    key: "protein",
    name: "Proteins & Dairy",
    color: "#ec4899", // Skrible signature pink
    keywords: [
      "chicken", "beef", "pork", "turkey", "steak", "meat", "bacon", "sausage",
      "egg", "eggs", "tofu", "tempeh", "salmon", "tuna", "fish", "shrimp", "seafood",
      "cheese", "cheddar", "mozzarella", "parmesan", "feta", "milk", "yogurt",
      "cream", "butter", "whey", "paneer", "ricotta", "ham"
    ],
    baseWeight: 0.40,
  },
  {
    key: "produce",
    name: "Produce & Fresh Herbs",
    color: "#10b981", // Emerald
    keywords: [
      "onion", "onions", "garlic", "scallion", "scallions", "green onion", "shallot",
      "tomato", "tomatoes", "spinach", "lettuce", "kale", "cabbage", "pepper",
      "bell pepper", "jalapeno", "chili", "carrot", "carrots", "potato", "potatoes",
      "sweet potato", "avocado", "cilantro", "parsley", "basil", "ginger", "lime",
      "lemon", "apple", "banana", "mushroom", "mushrooms", "broccoli", "zucchini",
      "celery", "cucumber", "corn", "peas", "herb", "herbs", "berry", "berries"
    ],
    baseWeight: 0.25,
  },
  {
    key: "grains",
    name: "Grains & Carbs",
    color: "#f59e0b", // Amber
    keywords: [
      "rice", "pasta", "noodle", "noodles", "spaghetti", "ramen", "bread",
      "tortilla", "tortillas", "wrap", "flour", "oat", "oats", "quinoa",
      "couscous", "bagel", "pita", "macaroni", "grain", "grains", "bun", "toast", "cracker"
    ],
    baseWeight: 0.15,
  },
  {
    key: "pantry",
    name: "Pantry & Seasonings",
    color: "#6366f1", // Indigo
    keywords: [
      "oil", "olive oil", "vegetable oil", "sesame oil", "butter", "soy sauce",
      "vinegar", "hot sauce", "sriracha", "salt", "black pepper", "pepper",
      "paprika", "cumin", "oregano", "curry", "garlic powder", "onion powder",
      "chili powder", "sugar", "honey", "maple syrup", "mustard", "mayo",
      "mayonnaise", "ketchup", "dressing", "seasoning", "spice", "spices"
    ],
    baseWeight: 0.10,
  },
  {
    key: "canned",
    name: "Canned & Packaged",
    color: "#0ea5e9", // Sky blue
    keywords: [
      "can", "canned", "beans", "black beans", "pinto beans", "kidney beans",
      "chickpeas", "broth", "stock", "chicken broth", "vegetable broth",
      "beef broth", "tomato sauce", "tomato paste", "coconut milk", "marinara",
      "salsa", "soup", "olives"
    ],
    baseWeight: 0.10,
  },
];

function parseNumericValue(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  const match = val.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

export function classifyIngredients(
  rawIngredients: string[],
  totalCostNum: number
): CategorizedCostItem[] {
  if (!rawIngredients || rawIngredients.length === 0) return [];

  // Parse items and explicit prices if available
  const parsedItems = rawIngredients.map((raw) => {
    let clean = raw.trim();
    let price: number | null = null;

    // Check for explicit price in item string (e.g. — $1.50 or ($0.75))
    const priceMatch = clean.match(/(?:—|-|:|\(|\s|^)\s*\$(\d+(?:\.\d{1,2})?)/);
    if (priceMatch) {
      price = parseFloat(priceMatch[1]);
    }

    // Clean name for keyword matching
    const nameOnly = clean
      .replace(/^[-*+\d.]+\s*/, "")
      .replace(/\[.*?\]/g, "")
      .replace(/\(.*?\)/g, "")
      .replace(/(?:—|-|:)\s*\$[\d.]+/g, "")
      .toLowerCase()
      .trim();

    return { raw, name: nameOnly || raw, price };
  });

  // Assign category to each item
  const categorizedMap: Record<
    string,
    {
      category: string;
      key: string;
      color: string;
      items: Array<{ name: string; cost: number; raw: string }>;
      explicitCost: number;
    }
  > = {};

  CATEGORY_DEFINITIONS.forEach((cat) => {
    categorizedMap[cat.key] = {
      category: cat.name,
      key: cat.key,
      color: cat.color,
      items: [],
      explicitCost: 0,
    };
  });

  // Fallback category
  const otherKey = "other";
  categorizedMap[otherKey] = {
    category: "Other Essentials",
    key: "other",
    color: "#8b5cf6", // Purple
    items: [],
    explicitCost: 0,
  };

  parsedItems.forEach((item) => {
    let matchedKey = otherKey;
    const words = item.name.split(/\s+/);

    for (const cat of CATEGORY_DEFINITIONS) {
      const match = cat.keywords.some((kw) =>
        item.name.includes(kw) || words.some((w) => w.startsWith(kw) || kw.startsWith(w))
      );
      if (match) {
        matchedKey = cat.key;
        break;
      }
    }

    categorizedMap[matchedKey].items.push({
      name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
      cost: item.price ?? 0,
      raw: item.raw,
    });

    if (item.price !== null) {
      categorizedMap[matchedKey].explicitCost += item.price;
    }
  });

  // Check if any items had explicit costs
  const totalExplicit = Object.values(categorizedMap).reduce(
    (sum, cat) => sum + cat.explicitCost,
    0
  );

  const finalTotal = totalCostNum > 0 ? totalCostNum : totalExplicit > 0 ? totalExplicit : 10.0;

  // If explicit costs were found and cover most items, calculate costs directly
  const activeCategories = Object.values(categorizedMap).filter(
    (cat) => cat.items.length > 0
  );

  if (activeCategories.length === 0) return [];

  let result: CategorizedCostItem[] = [];

  if (totalExplicit > 0) {
    // Distribute remaining cost to items without explicit prices
    const itemsWithoutPrice = activeCategories.flatMap((c) =>
      c.items.filter((i) => i.cost === 0)
    );
    const unallocatedCost = Math.max(0, finalTotal - totalExplicit);
    const perUnallocated =
      itemsWithoutPrice.length > 0 ? unallocatedCost / itemsWithoutPrice.length : 0;

    result = activeCategories.map((cat) => {
      const totalCatCost = cat.items.reduce((sum, item) => {
        const cost = item.cost > 0 ? item.cost : perUnallocated;
        item.cost = Number(cost.toFixed(2));
        return sum + item.cost;
      }, 0);

      return {
        category: cat.category,
        key: cat.key,
        color: cat.color,
        totalCost: Number(totalCatCost.toFixed(2)),
        percentage: 0,
        items: cat.items,
      };
    });
  } else {
    // Distribute total based on category weights and item count
    const totalWeights = activeCategories.reduce((sum, cat) => {
      const def = CATEGORY_DEFINITIONS.find((d) => d.key === cat.key);
      const w = (def ? def.baseWeight : 0.1) * cat.items.length;
      return sum + w;
    }, 0);

    result = activeCategories.map((cat) => {
      const def = CATEGORY_DEFINITIONS.find((d) => d.key === cat.key);
      const weight = (def ? def.baseWeight : 0.1) * cat.items.length;
      const catTotal = (weight / totalWeights) * finalTotal;
      const perItem = catTotal / cat.items.length;

      cat.items.forEach((i) => {
        i.cost = Number(perItem.toFixed(2));
      });

      return {
        category: cat.category,
        key: cat.key,
        color: cat.color,
        totalCost: Number(catTotal.toFixed(2)),
        percentage: 0,
        items: cat.items,
      };
    });
  }

  // Calculate percentages
  const grandTotal = result.reduce((sum, r) => sum + r.totalCost, 0) || 1;
  result.forEach((r) => {
    r.percentage = Math.round((r.totalCost / grandTotal) * 100);
  });

  return result.sort((a, b) => b.totalCost - a.totalCost);
}

export const RecipeCostD3Chart: React.FC<RecipeCostD3ChartProps> = ({
  ingredients,
  totalCost,
  budget,
  remainingBudget,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeView, setActiveView] = useState<"donut" | "bars">("donut");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [justUpdated, setJustUpdated] = useState(false);

  // References to preserve state across data updates for smooth tweening
  const prevCostRef = useRef<number>(0);
  const prevBudgetUtilizationRef = useRef<number>(0);
  const prevViewRef = useRef<"donut" | "bars">("donut");
  const isInitializedRef = useRef<boolean>(false);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  const budgetNum = parseNumericValue(budget);
  const totalCostNum = parseNumericValue(totalCost);
  const remainingNum =
    remainingBudget !== undefined && remainingBudget !== null
      ? parseNumericValue(remainingBudget)
      : budgetNum > 0
      ? Math.max(0, budgetNum - totalCostNum)
      : 0;

  const effectiveBudget = budgetNum > 0 ? budgetNum : totalCostNum + remainingNum;
  const budgetUtilization =
    effectiveBudget > 0 ? Math.min(100, Math.round((totalCostNum / effectiveBudget) * 100)) : 100;

  const data = useMemo(
    () => classifyIngredients(ingredients, totalCostNum),
    [ingredients, totalCostNum]
  );

  // Flash update pill briefly when ingredients or totalCost change after initial render
  useEffect(() => {
    if (isInitializedRef.current) {
      setJustUpdated(true);
      if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
      updateTimerRef.current = setTimeout(() => {
        setJustUpdated(false);
      }, 1800);
    }
    return () => {
      if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    };
  }, [ingredients, totalCostNum, budgetNum]);

  // Dimension constants
  const width = 320;
  const height = 260;
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2;
  const innerRadius = radius * 0.62;
  const outerRadius = radius;

  const arc = useMemo(
    () =>
      d3
        .arc<any>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .cornerRadius(6),
    [innerRadius, outerRadius]
  );

  const arcHover = useMemo(
    () =>
      d3
        .arc<any>()
        .innerRadius(innerRadius - 2)
        .outerRadius(outerRadius + 7)
        .cornerRadius(7),
    [innerRadius, outerRadius]
  );

  // Main D3 rendering & update effect
  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    const viewChanged = prevViewRef.current !== activeView;
    prevViewRef.current = activeView;

    // If view switched (donut <-> bars), reset SVG container
    if (viewChanged || !isInitializedRef.current) {
      svg.selectAll("*").remove();
      svg
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("class", "w-full h-auto overflow-visible select-none");
    }

    if (activeView === "donut") {
      let g = svg.select<SVGGElement>("g.donut-root");
      const isFirstDonut = g.empty();

      if (isFirstDonut) {
        g = svg
          .append("g")
          .attr("class", "donut-root")
          .attr("transform", `translate(${width / 2}, ${height / 2})`);

        // Slices group
        g.append("g").attr("class", "slices-group");

        // Center labels group
        const centerGroup = g.append("g").attr("class", "center-group").attr("text-anchor", "middle");

        centerGroup
          .append("text")
          .attr("class", "cost-number font-mono font-bold text-lg fill-black dark:fill-white")
          .attr("dy", "-0.3em")
          .text("$0.00");

        centerGroup
          .append("text")
          .attr("class", "cost-label text-[10px] font-semibold uppercase tracking-wider fill-black/60 dark:fill-white/60")
          .attr("dy", "1.1em")
          .style("opacity", 0)
          .text(budgetNum > 0 ? "Total Spent" : "Est. Cost")
          .transition()
          .duration(700)
          .delay(200)
          .style("opacity", 1);

        centerGroup
          .append("text")
          .attr("class", "budget-percent text-[9px] font-mono font-semibold fill-[#ec4899]")
          .attr("dy", "2.4em")
          .style("opacity", 0);
      }

      const pie = d3
        .pie<CategorizedCostItem>()
        .value((d) => d.totalCost)
        .sort(null)
        .padAngle(0.03);

      const pieData = pie(data);
      const slicesGroup = g.select<SVGGElement>("g.slices-group");

      // Bind slices with category key
      const sliceSelection = slicesGroup
        .selectAll<SVGPathElement, d3.PieArcDatum<CategorizedCostItem>>("path.pie-slice")
        .data(pieData, (d: any) => d.data.key);

      // Handle EXIT slices
      sliceSelection
        .exit()
        .transition()
        .duration(500)
        .ease(d3.easeCubicIn)
        .attrTween("d", function (d: any) {
          const current = (this as any)._current || d;
          const i = d3.interpolate(current, {
            startAngle: current.endAngle,
            endAngle: current.endAngle,
          });
          return function (t: number) {
            return arc(i(t)) || "";
          };
        })
        .style("opacity", 0)
        .remove();

      // Handle ENTER slices
      const enterSlices = sliceSelection
        .enter()
        .append("path")
        .attr("class", "pie-slice")
        .attr("fill", (d) => d.data.color)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .style("opacity", 0)
        .on("mouseenter", function (event, d) {
          setHoveredCategory(d.data.key);
        })
        .on("mouseleave", function () {
          setHoveredCategory(null);
        });

      if (isFirstDonut) {
        // Initial entrance: smooth clockwise sweep unfurl transition
        enterSlices
          .style("opacity", 1)
          .transition()
          .duration(850)
          .ease(d3.easeCubicOut)
          .attrTween("d", function (d) {
            const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
            (this as any)._current = { ...d };
            return function (t: number) {
              return arc(i(t)) || "";
            };
          });
      } else {
        // Subsequent slice entries: expand from target startAngle
        enterSlices
          .transition()
          .duration(700)
          .ease(d3.easeCubicOut)
          .style("opacity", 1)
          .attrTween("d", function (d) {
            const i = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d);
            (this as any)._current = { ...d };
            return function (t: number) {
              return arc(i(t)) || "";
            };
          });
      }

      // Handle UPDATE slices: smooth morph between previous and current angles
      sliceSelection
        .transition()
        .duration(750)
        .ease(d3.easeCubicInOut)
        .attr("fill", (d) => d.data.color)
        .attrTween("d", function (d) {
          const current = (this as any)._current || {
            startAngle: d.startAngle,
            endAngle: d.startAngle,
          };
          const i = d3.interpolate(current, d);
          (this as any)._current = { ...d };
          return function (t: number) {
            return arc(i(t)) || "";
          };
        });

      // Update Center Count-Up Numbers with transitions
      const centerGroup = g.select<SVGGElement>("g.center-group");

      const costText = centerGroup.select<SVGTextElement>("text.cost-number");
      const startCost = isFirstDonut ? 0 : prevCostRef.current;
      costText
        .transition()
        .duration(800)
        .ease(d3.easeCubicOut)
        .tween("text", function () {
          const i = d3.interpolateNumber(startCost, totalCostNum);
          return function (t: number) {
            this.textContent = `$${i(t).toFixed(2)}`;
          };
        });

      centerGroup
        .select<SVGTextElement>("text.cost-label")
        .text(budgetNum > 0 ? "Total Spent" : "Est. Cost");

      const percentText = centerGroup.select<SVGTextElement>("text.budget-percent");
      if (budgetNum > 0) {
        percentText.style("opacity", 1);
        const startPct = isFirstDonut ? 0 : prevBudgetUtilizationRef.current;
        percentText
          .transition()
          .duration(800)
          .ease(d3.easeCubicOut)
          .tween("text", function () {
            const i = d3.interpolateNumber(startPct, budgetUtilization);
            return function (t: number) {
              this.textContent = `${Math.round(i(t))}% of budget`;
            };
          });
      } else {
        percentText.style("opacity", 0).text("");
      }

      // Save previous numbers for next transition
      prevCostRef.current = totalCostNum;
      prevBudgetUtilizationRef.current = budgetUtilization;
    } else {
      // Horizontal Bar Chart View
      const innerWidth = width - 40;
      const barHeight = 22;
      const gap = 12;

      let g = svg.select<SVGGElement>("g.bars-root");
      const isFirstBars = g.empty();

      if (isFirstBars) {
        g = svg.append("g").attr("class", "bars-root").attr("transform", `translate(20, 20)`);
      }

      const xScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.totalCost) || 1])
        .range([0, innerWidth - 115]);

      const barRowSelection = g
        .selectAll<SVGGElement, CategorizedCostItem>("g.bar-row")
        .data(data, (d: any) => d.key);

      // EXIT bar rows
      barRowSelection
        .exit()
        .transition()
        .duration(350)
        .ease(d3.easeCubicIn)
        .style("opacity", 0)
        .attr("transform", (_, i) => `translate(0, ${i * (barHeight + gap) + 10})`)
        .remove();

      // ENTER bar rows
      const enterRows = barRowSelection
        .enter()
        .append("g")
        .attr("class", "bar-row")
        .attr("transform", (_, i) => `translate(0, ${i * (barHeight + gap)})`)
        .style("cursor", "pointer")
        .style("opacity", 0)
        .on("mouseenter", (_, d) => setHoveredCategory(d.key))
        .on("mouseleave", () => setHoveredCategory(null));

      // Category text label
      enterRows
        .append("text")
        .attr("class", "category-label text-[11px] font-semibold fill-black/80 dark:fill-white/80")
        .attr("x", 0)
        .attr("y", barHeight / 2 + 4)
        .text((d) => d.category);

      // Background Track
      enterRows
        .append("rect")
        .attr("class", "track-bg")
        .attr("x", 115)
        .attr("y", 0)
        .attr("width", innerWidth - 115)
        .attr("height", barHeight)
        .attr("rx", 5)
        .attr("fill", "rgba(0,0,0,0.05)");

      // Foreground Animated Value Bar
      enterRows
        .append("rect")
        .attr("class", "value-bar")
        .attr("x", 115)
        .attr("y", 0)
        .attr("height", barHeight)
        .attr("rx", 5)
        .attr("fill", (d) => d.color)
        .attr("width", 0);

      // Value label text
      enterRows
        .append("text")
        .attr("class", "val-label text-[10px] font-mono font-bold fill-black/70 dark:fill-white/70")
        .attr("x", 120)
        .attr("y", barHeight / 2 + 4)
        .style("opacity", 0)
        .text((d) => `$${d.totalCost.toFixed(2)} (${d.percentage}%)`);

      // Animate ENTER rows with staggered entrance
      enterRows
        .transition()
        .duration(650)
        .delay((_, i) => i * 65)
        .ease(d3.easeCubicOut)
        .style("opacity", 1);

      enterRows
        .select(".value-bar")
        .transition()
        .duration(750)
        .delay((_, i) => i * 65)
        .ease(d3.easeCubicOut)
        .attr("width", (d) => Math.max(8, xScale(d.totalCost)));

      enterRows
        .select(".val-label")
        .transition()
        .duration(750)
        .delay((_, i) => i * 65 + 100)
        .ease(d3.easeCubicOut)
        .style("opacity", 1)
        .attr("x", (d) => 120 + Math.max(8, xScale(d.totalCost)) + 6);

      // UPDATE existing bar rows
      barRowSelection
        .transition()
        .duration(650)
        .ease(d3.easeCubicOut)
        .attr("transform", (_, i) => `translate(0, ${i * (barHeight + gap)})`)
        .style("opacity", 1);

      barRowSelection
        .select<SVGTextElement>(".category-label")
        .text((d) => d.category);

      barRowSelection
        .select<SVGRectElement>(".value-bar")
        .transition()
        .duration(700)
        .ease(d3.easeCubicOut)
        .attr("fill", (d) => d.color)
        .attr("width", (d) => Math.max(8, xScale(d.totalCost)));

      barRowSelection
        .select<SVGTextElement>(".val-label")
        .text((d) => `$${d.totalCost.toFixed(2)} (${d.percentage}%)`)
        .transition()
        .duration(700)
        .ease(d3.easeCubicOut)
        .attr("x", (d) => 120 + Math.max(8, xScale(d.totalCost)) + 6);
    }

    isInitializedRef.current = true;
  }, [data, activeView, totalCostNum, budgetNum, budgetUtilization, arc, arcHover]);

  // Dedicated hover effect without rebuilding or interrupting main chart transitions
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    if (activeView === "donut") {
      svg
        .selectAll<SVGPathElement, d3.PieArcDatum<CategorizedCostItem>>("path.pie-slice")
        .interrupt("hover")
        .transition("hover")
        .duration(220)
        .ease(d3.easeCubicOut)
        .attr("d", function (d) {
          if (hoveredCategory === d.data.key) {
            return arcHover(d) || "";
          }
          return arc(d) || "";
        })
        .style("opacity", function (d) {
          if (!hoveredCategory) return 1;
          return hoveredCategory === d.data.key ? 1 : 0.38;
        });
    } else {
      svg
        .selectAll<SVGGElement, CategorizedCostItem>("g.bar-row")
        .interrupt("hover")
        .transition("hover")
        .duration(200)
        .ease(d3.easeCubicOut)
        .style("opacity", function (d) {
          if (!hoveredCategory) return 1;
          return hoveredCategory === d.key ? 1 : 0.4;
        });
    }
  }, [hoveredCategory, activeView, arc, arcHover]);

  if (data.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="mt-6 bg-[#FAF8F5] border border-black/15 rounded-2xl p-5 sm:p-6 shadow-xs font-sans"
    >
      {/* Header with Title, Budget Pill & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-black tracking-tight flex items-center gap-1.5">
              <span>recipe budget & category breakdown</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30">
                d3 chart
              </span>
              {justUpdated && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>chart updated</span>
                </span>
              )}
            </h4>
            <p className="text-xs text-black/60 font-medium">
              Cost allocation by ingredient category relative to your budget.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {budgetNum > 0 && (
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
              <Wallet className="w-3 h-3" />
              <span>Budget: ${budgetNum.toFixed(2)}</span>
            </span>
          )}

          {/* Chart View Toggle */}
          <div className="flex items-center gap-1 bg-white border border-black/15 p-1 rounded-xl shadow-2xs">
            <button
              onClick={() => setActiveView("donut")}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === "donut" ? "bg-black text-white" : "text-black/60 hover:bg-black/5"
              }`}
              title="Donut Chart View"
            >
              <PieChart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveView("bars")}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === "bars" ? "bg-black text-white" : "text-black/60 hover:bg-black/5"
              }`}
              title="Bar Chart View"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Budget Utilization Meter */}
      {budgetNum > 0 && (
        <div className="mb-5 bg-white border border-black/10 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-black/70 flex items-center gap-1">
              <span>Budget Utilization:</span>
              <strong className="text-black font-bold font-mono">
                ${totalCostNum.toFixed(2)} / ${budgetNum.toFixed(2)}
              </strong>
            </span>
            <span
              className={`font-mono font-bold px-2 py-0.5 rounded-full text-[11px] ${
                remainingNum >= 0
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}
            >
              {remainingNum >= 0
                ? `$${remainingNum.toFixed(2)} Remaining`
                : `$${Math.abs(remainingNum).toFixed(2)} Over Budget`}
            </span>
          </div>

          <div className="w-full bg-black/5 rounded-full h-2 overflow-hidden border border-black/10">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                budgetUtilization > 100
                  ? "bg-red-500"
                  : budgetUtilization > 80
                  ? "bg-[#ec4899]"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, budgetUtilization)}%` }}
            />
          </div>
        </div>
      )}

      {/* Grid: D3 SVG Chart + Interactive Category Breakdown Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: D3 SVG Chart */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-2 bg-white border border-black/10 rounded-2xl shadow-2xs">
          <svg ref={svgRef} className="w-full max-w-[280px] h-auto" />
          <span className="text-[10px] text-black/40 font-mono mt-1">
            Interactive D3 Visualization • Hover to inspect
          </span>
        </div>

        {/* Right: Categorized Items Breakdown List */}
        <div className="md:col-span-7 space-y-2.5">
          {data.map((cat) => {
            const isHovered = hoveredCategory === cat.key;
            return (
              <div
                key={cat.key}
                onMouseEnter={() => setHoveredCategory(cat.key)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`border rounded-xl p-3 transition-all cursor-pointer ${
                  isHovered
                    ? "bg-white border-[#ec4899] shadow-xs translate-x-1"
                    : "bg-white border-black/10 hover:border-black/25 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-bold text-xs text-black">{cat.category}</span>
                    <span className="text-[10px] font-mono text-black/50 bg-black/5 px-1.5 py-0.5 rounded">
                      {cat.items.length} {cat.items.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-black">
                      ${cat.totalCost.toFixed(2)}
                    </span>
                    <span
                      className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        color: cat.color,
                      }}
                    >
                      {cat.percentage}%
                    </span>
                  </div>
                </div>

                {/* Items in category */}
                <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-black/5">
                  {cat.items.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium text-black/80 bg-black/5 border border-black/5 px-2 py-0.5 rounded-lg flex items-center gap-1"
                    >
                      <span>{item.name}</span>
                      <span className="font-mono text-[10px] text-black/50 font-semibold">
                        ${item.cost.toFixed(2)}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
