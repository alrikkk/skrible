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

  // Render D3 chart
  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 320;
    const height = 260;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    svg.attr("viewBox", `0 0 ${width} ${height}`).attr("class", "w-full h-auto overflow-visible");

    if (activeView === "donut") {
      const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2;
      const innerRadius = radius * 0.62;
      const outerRadius = radius;

      const g = svg
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

      const pie = d3
        .pie<CategorizedCostItem>()
        .value((d) => d.totalCost)
        .sort(null)
        .padAngle(0.03);

      const arc = d3
        .arc<d3.PieArcDatum<CategorizedCostItem>>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .cornerRadius(6);

      const arcHover = d3
        .arc<d3.PieArcDatum<CategorizedCostItem>>()
        .innerRadius(innerRadius - 2)
        .outerRadius(outerRadius + 6)
        .cornerRadius(7);

      const arcs = g
        .selectAll(".arc")
        .data(pie(data))
        .enter()
        .append("g")
        .attr("class", "arc")
        .style("cursor", "pointer");

      // Draw slices
      arcs
        .append("path")
        .attr("d", arc)
        .attr("fill", (d) => d.data.color)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .style("transition", "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)")
        .attr("opacity", (d) => (hoveredCategory && hoveredCategory !== d.data.key ? 0.45 : 1))
        .on("mouseenter", function (event, d) {
          setHoveredCategory(d.data.key);
          d3.select(this)
            .transition()
            .duration(200)
            .attr("d", arcHover as any);
        })
        .on("mouseleave", function () {
          setHoveredCategory(null);
          d3.select(this)
            .transition()
            .duration(200)
            .attr("d", arc as any);
        });

      // Center summary text
      const centerGroup = g.append("g").attr("text-anchor", "middle");

      centerGroup
        .append("text")
        .attr("dy", "-0.3em")
        .attr("class", "font-mono font-bold text-lg fill-black dark:fill-white")
        .text(`$${totalCostNum.toFixed(2)}`);

      centerGroup
        .append("text")
        .attr("dy", "1.1em")
        .attr("class", "text-[10px] font-semibold uppercase tracking-wider fill-black/60 dark:fill-white/60")
        .text(budgetNum > 0 ? "Total Spent" : "Est. Cost");

      if (budgetNum > 0) {
        centerGroup
          .append("text")
          .attr("dy", "2.4em")
          .attr("class", "text-[9px] font-mono font-semibold fill-[#ec4899]")
          .text(`${budgetUtilization}% of budget`);
      }
    } else {
      // Horizontal Bar Breakdown View
      const innerWidth = width - 40;
      const barHeight = 22;
      const gap = 12;

      const g = svg.append("g").attr("transform", `translate(20, 20)`);

      const xScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.totalCost) || 1])
        .range([0, innerWidth - 110]);

      const barGroups = g
        .selectAll(".bar-group")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "bar-group")
        .attr("transform", (_, i) => `translate(0, ${i * (barHeight + gap)})`)
        .style("cursor", "pointer")
        .on("mouseenter", (_, d) => setHoveredCategory(d.key))
        .on("mouseleave", () => setHoveredCategory(null));

      // Category Label
      barGroups
        .append("text")
        .attr("x", 0)
        .attr("y", barHeight / 2 + 4)
        .attr("class", "text-[11px] font-semibold fill-black/80 dark:fill-white/80")
        .text((d) => d.category);

      // Background Bar
      barGroups
        .append("rect")
        .attr("x", 110)
        .attr("y", 0)
        .attr("width", innerWidth - 110)
        .attr("height", barHeight)
        .attr("rx", 5)
        .attr("fill", "rgba(0,0,0,0.05)");

      // Foreground Value Bar
      barGroups
        .append("rect")
        .attr("x", 110)
        .attr("y", 0)
        .attr("width", (d) => Math.max(8, xScale(d.totalCost)))
        .attr("height", barHeight)
        .attr("rx", 5)
        .attr("fill", (d) => d.color)
        .attr("opacity", (d) => (hoveredCategory && hoveredCategory !== d.key ? 0.45 : 1))
        .style("transition", "all 0.2s ease");

      // Value label
      barGroups
        .append("text")
        .attr("x", (d) => 115 + Math.max(8, xScale(d.totalCost)) + 6)
        .attr("y", barHeight / 2 + 4)
        .attr("class", "text-[10px] font-mono font-bold fill-black/70 dark:fill-white/70")
        .text((d) => `$${d.totalCost.toFixed(2)} (${d.percentage}%)`);
    }
  }, [data, activeView, hoveredCategory, totalCostNum, budgetNum, budgetUtilization]);

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
