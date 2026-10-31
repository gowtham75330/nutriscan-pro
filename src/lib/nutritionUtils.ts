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

/** Lookup a food by free text using database and mapping table with smart normalization and plural stemming. */
export function findFoodByText(text: string): string | null {
  const q = text.toLowerCase().trim();
  if (!q) return null;

  // Direct database match
  if (nutritionDatabase[q]) return q;
  // Direct mapping match
  if (fileNameFoodMapping[q]) return fileNameFoodMapping[q];

  // Plural stemming (e.g. "apples" -> "apple", "bananas" -> "banana", "eggs" -> "egg")
  if (q.endsWith("s") && q.length > 3) {
    const single = q.slice(0, -1);
    if (nutritionDatabase[single]) return single;
    if (fileNameFoodMapping[single]) return fileNameFoodMapping[single];
  }
  if (q.endsWith("es") && q.length > 4) {
    const single = q.slice(0, -2);
    if (nutritionDatabase[single]) return single;
    if (fileNameFoodMapping[single]) return fileNameFoodMapping[single];
  }

  // Normalized with clean spaces
  const normalized = q.replace(/[^a-z0-9]+/g, " ").trim();
  if (nutritionDatabase[normalized]) return normalized;
  if (fileNameFoodMapping[normalized]) return fileNameFoodMapping[normalized];

  // Check normalized plurals
  if (normalized.endsWith("s") && normalized.length > 3) {
    const single = normalized.slice(0, -1);
    if (nutritionDatabase[single]) return single;
    if (fileNameFoodMapping[single]) return fileNameFoodMapping[single];
  }

  // Compressed no-space match (e.g. "fishfry" matches "fish fry")
  const noSpace = q.replace(/[^a-z0-9]/g, "");
  for (const [k, v] of Object.entries(fileNameFoodMapping)) {
    if (k.replace(/\s+/g, "") === noSpace) return v;
  }
  for (const dbKey of Object.keys(nutritionDatabase)) {
    if (dbKey.replace(/\s+/g, "") === noSpace) return dbKey;
  }

  // Longest matching keyword first
  const keys = Object.keys(fileNameFoodMapping).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (q.includes(k) || normalized.includes(k)) return fileNameFoodMapping[k];
  }

  // Database food name match
  for (const [dbKey, food] of Object.entries(nutritionDatabase)) {
    const fName = food.name.toLowerCase();
    if (fName === q || fName.includes(q) || q.includes(fName)) return dbKey;
  }

  return null;
}

export interface ParsedItem {
  foodKey: string;
  food: NutritionInfo;
  scaled: NutritionInfo;
  quantity: number;
  unit: "g" | "ml" | "piece";
  display: string;
}

export interface ParsedInput {
  foodKey: string;
  food: NutritionInfo;
  scaled: NutritionInfo;
  quantity: number;
  unit: "g" | "ml" | "piece";
  display: string;
  items?: ParsedItem[];
}

/**
 * Parses a single food phrase with optional quantity,
 * e.g. "2 apple", "250g biryani", "1 cup milk", "2 fish fry", "apple".
 */
export function parseSingleFoodFragment(fragment: string): ParsedItem | null {
  const text = fragment.toLowerCase().trim();
  if (!text) return null;

  // 1. Match leading quantity, e.g. "2 apple", "250g chicken", "1 cup rice"
  const startMatch = text.match(/^(\d+(?:\.\d+)?)\s*(kg|g|ml|l|cups?|pieces?|pcs?|nos?|no)?\s*(.*)$/i);
  // 2. Match trailing quantity, e.g. "chicken 250g", "apple 2"
  const endMatch = text.match(/^(.*?)\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l|cups?|pieces?|pcs?|nos?|no)?$/i);

  let qty = 1;
  let rawUnit = "";
  let foodText = text;

  if (startMatch && startMatch[1] && startMatch[3]) {
    qty = parseFloat(startMatch[1]);
    rawUnit = (startMatch[2] ?? "").toLowerCase();
    foodText = startMatch[3].trim();
  } else if (endMatch && endMatch[2] && endMatch[1] && isNaN(Number(endMatch[1]))) {
    qty = parseFloat(endMatch[2]);
    rawUnit = (endMatch[3] ?? "").toLowerCase();
    foodText = endMatch[1].trim();
  } else {
    const anyNumMatch = text.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|cups?|pieces?|pcs?|nos?|no)?/i);
    if (anyNumMatch) {
      qty = parseFloat(anyNumMatch[1]);
      rawUnit = (anyNumMatch[2] ?? "").toLowerCase();
      foodText = text.replace(anyNumMatch[0], "").trim();
    }
  }

  // Normalise unit synonyms.
  if (rawUnit === "kg") { qty *= 1000; rawUnit = "g"; }
  if (rawUnit === "l") { qty *= 1000; rawUnit = "ml"; }
  if (["cup", "cups"].includes(rawUnit)) { qty *= 240; rawUnit = "ml"; }
  if (["piece", "pieces", "pc", "pcs", "nos", "no"].includes(rawUnit)) rawUnit = "piece";

  const foodKey = findFoodByText(foodText) || findFoodByText(text);
  if (!foodKey) return null;

  const food = nutritionDatabase[foodKey];
  const serving = getServing(foodKey);
  const unit: "g" | "ml" | "piece" = (rawUnit as "g" | "ml" | "piece") || serving.unit;

  let factor = 1;
  // If the user did not explicitly provide "g" or "ml", treat qty as count of servings/pieces
  if (!rawUnit || unit === "piece") {
    factor = qty;
  } else {
    // Explicit gram or ml amount provided (e.g. 250g, 150ml)
    factor = qty / serving.grams;
  }

  const scaled = scaleNutrition(food, factor, foodKey);
  const display = unit === "piece" || !rawUnit
    ? `${qty} ${food.name}`
    : `${qty}${unit} ${food.name}`;
  scaled.servingLabel = display;

  return { foodKey, food, scaled, quantity: qty, unit, display };
}

/**
 * Parse single or MULTIPLE foods with quantities, e.g.:
 * - "2 apple and 2 banana"
 * - "2 idli, 1 vada and 1 cup tea"
 * - "1 cup rice with dal 100g and 2 fish fry"
 * Accurately sums calories, macros, vitamins, minerals, fiber, sugar, sodium!
 */
export function parseQuantityInput(input: string): ParsedInput | null {
  const text = input.trim();
  if (!text) return null;

  // Split on delimiters: "and", "with", "plus", ",", "&", "+"
  const delimiterRegex = /\s*(?:,|\band\b|\bwith\b|\bplus\b|\&|\+)\s*/i;
  let rawFragments = text.split(delimiterRegex).map((s) => s.trim()).filter(Boolean);

  // If no explicit delimiter, check for multiple number tokens, e.g. "2 apple 2 banana"
  if (rawFragments.length <= 1) {
    const multiMatch = text.match(/\b\d+(?:\.\d+)?\s*(?:kg|g|ml|l|cups?|pieces?|pcs?|nos?|no)?\s+[a-zA-Z\s]+?(?=\s+\d+|$)/gi);
    if (multiMatch && multiMatch.length > 1) {
      rawFragments = multiMatch.map((s) => s.trim());
    }
  }

  const parsedItems: ParsedItem[] = [];
  for (const frag of rawFragments) {
    const item = parseSingleFoodFragment(frag);
    if (item) {
      parsedItems.push(item);
    }
  }

  if (parsedItems.length === 0) {
    const single = parseSingleFoodFragment(text);
    return single ? { ...single, items: [single] } : null;
  }

  if (parsedItems.length === 1) {
    return { ...parsedItems[0], items: parsedItems };
  }

  // Multiple foods parsed — sum all nutrients accurately!
  const scaledList = parsedItems.map((p) => p.scaled);
  const combined = sumNutrition(scaledList);

  const display = parsedItems.map((p) => p.display).join(" + ");
  const names = parsedItems.map((p) => p.food.name).join(" + ");
  const emojis = Array.from(new Set(parsedItems.map((p) => p.food.emoji))).join(" ");

  combined.name = names;
  combined.emoji = emojis || "🍱";
  combined.healthTip = `Combined meal of ${parsedItems.length} items (${names}). Nutrient values are summed accurately.`;
  combined.servingLabel = display;

  return {
    foodKey: parsedItems[0].foodKey,
    food: parsedItems[0].food,
    scaled: combined,
    quantity: parsedItems.reduce((acc, p) => acc + p.quantity, 0),
    unit: parsedItems[0].unit,
    display,
    items: parsedItems,
  };
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
