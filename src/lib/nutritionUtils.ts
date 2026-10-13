import type { NutritionInfo } from "@/data/nutritionData";
import { nutritionDatabase, fileNameFoodMapping } from "@/data/nutritionData";
import { getServing } from "@/data/servingSizes";
import { getExtras } from "@/data/nutritionExtras";

/** Scale every numeric nutrient by `factor`. Extras (fiber/sugar/sodium) are scaled from the real reference data when foodKey is known. */
export function scaleNutrition(n: NutritionInfo, factor: number, foodKey?: string): NutritionInfo {
  const r = (v: number) => +(v * factor).toFixed(1);
  const extras = foodKey ? getExtras(foodKey) : null;
  return {
    ...n,
    calories: Math.round(n.calories * factor),
    protein: r(n.protein),
    carbs: r(n.carbs),
    fat: r(n.fat),
    goodFat: r(n.goodFat),
    badFat: r(n.badFat),
    fiber: extras ? r(extras.fiber) : (n.fiber !== undefined ? r(n.fiber) : undefined),
    sugar: extras ? r(extras.sugar) : (n.sugar !== undefined ? r(n.sugar) : undefined),
    sodium: extras ? Math.round(extras.sodium * factor) : (n.sodium !== undefined ? Math.round(n.sodium * factor) : undefined),
  };
}

/** Sum a list of nutrition entries (for recipes). */
export function sumNutrition(items: NutritionInfo[]): NutritionInfo {
  if (items.length === 0) {
    return {
      name: "Total", emoji: "🍽️", category: "recipe",
      calories: 0, protein: 0, carbs: 0, fat: 0, goodFat: 0, badFat: 0,
      vitamins: [], minerals: [], healthTip: "",
    };
  }
  const base = items[0];
  const addOpt = (a?: number, b?: number) =>
    a === undefined && b === undefined ? undefined : +((a ?? 0) + (b ?? 0)).toFixed(1);
  return items.slice(1).reduce<NutritionInfo>(
    (acc, n) => ({
      ...acc,
      calories: acc.calories + n.calories,
      protein: +(acc.protein + n.protein).toFixed(1),
      carbs: +(acc.carbs + n.carbs).toFixed(1),
      fat: +(acc.fat + n.fat).toFixed(1),
      goodFat: +(acc.goodFat + n.goodFat).toFixed(1),
      badFat: +(acc.badFat + n.badFat).toFixed(1),
      fiber: addOpt(acc.fiber, n.fiber),
      sugar: addOpt(acc.sugar, n.sugar),
      sodium: addOpt(acc.sodium, n.sodium),
      vitamins: Array.from(new Set([...acc.vitamins, ...n.vitamins])),
      minerals: Array.from(new Set([...acc.minerals, ...n.minerals])),
    }),
    { ...base, name: "Combined Meal", emoji: "🍱" }
  );
}

/** 0-100 health score with category label. */
export function healthScore(n: NutritionInfo): { score: number; label: string; color: string } {
  // Heuristics: reward protein, good fat, vitamins/minerals; penalise bad fat, excess calories.
  let s = 60;
  s += Math.min(n.protein * 1.2, 20);
  s += Math.min(n.goodFat * 1.5, 10);
  s -= Math.min(n.badFat * 2, 25);
  s -= Math.max(0, (n.calories - 250) / 25);
  s += Math.min(n.vitamins.length * 1.5, 8);
  s += Math.min(n.minerals.length * 1.5, 8);
  const score = Math.max(0, Math.min(100, Math.round(s)));
  let label = "Poor", color = "hsl(0 70% 55%)";
  if (score >= 85) { label = "Excellent"; color = "hsl(145 65% 42%)"; }
  else if (score >= 65) { label = "Good"; color = "hsl(145 60% 50%)"; }
  else if (score >= 45) { label = "Average"; color = "hsl(45 90% 50%)"; }
  return { score, label, color };
}

/** Lookup a food by free text using the filename mapping table. */
export function findFoodByText(text: string): string | null {
  const q = text.toLowerCase().trim();
  if (!q) return null;
  if (nutritionDatabase[q]) return q;
  // direct keyword
  if (fileNameFoodMapping[q]) return fileNameFoodMapping[q];
  // longest matching keyword first
  const keys = Object.keys(fileNameFoodMapping).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (q.includes(k)) return fileNameFoodMapping[k];
  }
  return null;
}

export interface ParsedInput {
  foodKey: string;
  food: NutritionInfo;
  scaled: NutritionInfo;
  quantity: number;
  unit: "g" | "ml" | "piece";
  display: string;
}

/**
 * Parse free text like "2 idli", "chicken biryani 250g", "150 ml milk".
 * Returns scaled nutrition or null if no food recognised.
 */
export function parseQuantityInput(input: string): ParsedInput | null {
  const text = input.toLowerCase().trim();
  if (!text) return null;

  // Pull a number + unit if present.
  const qtyMatch = text.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|cup|cups|piece|pieces|pc|pcs|nos|no)?/i);
  let qty = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
  let rawUnit = (qtyMatch?.[2] ?? "").toLowerCase();

  // Normalise unit synonyms.
  if (rawUnit === "kg") { qty *= 1000; rawUnit = "g"; }
  if (rawUnit === "l") { qty *= 1000; rawUnit = "ml"; }
  if (["cup", "cups"].includes(rawUnit)) { qty *= 240; rawUnit = "ml"; }
  if (["piece", "pieces", "pc", "pcs", "nos", "no"].includes(rawUnit)) rawUnit = "piece";

  // Strip the matched quantity from text to identify the food.
  const foodText = text.replace(qtyMatch?.[0] ?? "", "").trim();
  const foodKey = findFoodByText(foodText) || findFoodByText(text);
  if (!foodKey) return null;

  const food = nutritionDatabase[foodKey];
  const serving = getServing(foodKey);
  const unit: "g" | "ml" | "piece" = (rawUnit as "g" | "ml" | "piece") || serving.unit;

  let factor = 1;
  if (unit === "piece") {
    factor = qty;
  } else {
    // grams or ml — scale by weight ratio (1 ml ≈ 1 g for our purposes)
    factor = qty / serving.grams;
  }

  const scaled = scaleNutrition(food, factor, foodKey);
  const display = unit === "piece"
    ? `${qty} ${serving.pieceLabel ?? "piece"}${qty > 1 ? "s" : ""} of ${food.name}`
    : `${qty}${unit} of ${food.name}`;
  scaled.servingLabel = display;

  return { foodKey, food, scaled, quantity: qty, unit, display };
}

/**
 * Returns real fiber/sugar/sodium when available on the nutrition object,
 * otherwise null. No fabricated estimates.
 */
export function getRealExtras(n: NutritionInfo) {
  if (n.fiber === undefined && n.sugar === undefined && n.sodium === undefined) return null;
  return {
    fiber: n.fiber,
    sugar: n.sugar,
    sodium: n.sodium,
  };
}

/** @deprecated kept for backward compatibility — prefer getRealExtras. */
export function estimateExtras(n: NutritionInfo) {
  return getRealExtras(n) ?? { fiber: undefined, sugar: undefined, sodium: undefined };
}
