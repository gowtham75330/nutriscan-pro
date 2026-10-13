import { nutritionDatabase, fileNameFoodMapping, type NutritionInfo } from "@/data/nutritionData";

export interface DetectionMatch {
  food: NutritionInfo;
  foodKey: string;
  confidence: number;
  detectedLabel: string;
}

// ── All valid food-related keywords for image validation ──────────────────────
const FOOD_KEYWORDS = new Set([
  // all fileNameFoodMapping keys
  ...Object.keys(fileNameFoodMapping),
  // all database keys
  ...Object.keys(nutritionDatabase),
  // extra common food words not in mapping
  "food","meal","dish","plate","bowl","snack","lunch","dinner","breakfast",
  "eat","eating","cook","cooked","recipe","cuisine","curry","masala","gravy",
  "sweet","dessert","fried","baked","grilled","roasted","steamed","raw",
  "veggie","vegetable","fruit","meat","protein","dairy","grain","drink",
  "soup","salad","rice","wheat","flour","spice","herb","sauce","chutney",
  "sambar","rasam","kootu","poriyal","kulambu","kuzhambu","thokku",
  "roti","naan","paratha","chapathi","dosa","idli","uttapam","appam",
  "biryani","pulao","briyani","fried rice","noodles","pasta","pizza","burger",
  "sandwich","toast","bread","oats","cereal","muesli","granola",
  "apple","banana","mango","orange","grapes","papaya","guava","coconut",
  "carrot","tomato","potato","onion","broccoli","spinach","cabbage",
  "chicken","fish","egg","mutton","prawns","paneer","tofu","dal","soya",
  "milk","curd","ghee","cheese","butter","yogurt","buttermilk","lassi",
  "tea","coffee","juice","water","drink","shake","smoothie",
  "cake","chocolate","icecream","sweet","laddu","halwa","payasam","kheer",
  "samosa","vada","bajji","pakoda","murukku","thattai","bonda",
]);

// ── Non-food image terms (commonly uploaded wrong images) ─────────────────────
const NON_FOOD_TERMS = [
  "selfie","portrait","person","people","man","woman","baby","child","kid",
  "dog","cat","animal","bird","pet","horse","cow","elephant","tiger","lion",
  "car","bike","motorcycle","truck","bus","vehicle","train","plane","ship",
  "house","building","room","office","school","college","hospital","church",
  "tree","flower","nature","mountain","river","ocean","beach","sky","cloud",
  "phone","laptop","computer","tablet","keyboard","mouse","screen","monitor",
  "book","pencil","pen","paper","notebook","document","file",
  "shirt","dress","shoes","clothes","fashion","outfit","jeans",
  "wallpaper","background","scenery","landscape","sunset","sunrise",
  "logo","icon","symbol","design","pattern","abstract","art","drawing",
];

/**
 * @deprecated No longer used to gate uploads/camera captures. File-name-only
 * validation is unreliable (mobile photos rarely have descriptive names),
 * which was the root cause of validation passing on laptop but not on
 * mobile. The real is-it-food gate now lives in `analyzeImageForFood()` in
 * `src/lib/aiFoodDetection.ts`, which inspects the actual image pixels via
 * an in-browser AI model, so it behaves identically on every device. Kept
 * here only for backward compatibility / potential future reuse.
 */
export function validateFoodImage(fileName: string): { isFood: boolean; reason: string } {
  const cleaned = fileName
    .toLowerCase()
    .replace(/\.[^.]+$/, "")           // remove extension
    .replace(/[_\-+,&()[\]{}]+/g, " ") // replace separators
    .replace(/\d+/g, " ")              // remove numbers like IMG_2024
    .replace(/\b(img|dsc|photo|pic|image|screenshot|capture|snap|cam|copy|edit|final|new|old|my|the|a|an|of|in|on|at|from|with|and|or)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned.split(" ").filter(w => w.length > 1);

  // Check for non-food terms first
  for (const word of words) {
    if (NON_FOOD_TERMS.includes(word)) {
      return { isFood: false, reason: `Detected "${word}" — not a food image` };
    }
  }

  // If file name is generic (IMG_001, photo, etc.) → treat as unknown → show manual select
  if (words.length === 0 || (words.length === 1 && words[0].length <= 2)) {
    return { isFood: true, reason: "generic" }; // allow but will show manual selector
  }

  // Check for food keywords
  for (const word of words) {
    if (FOOD_KEYWORDS.has(word)) {
      return { isFood: true, reason: "matched" };
    }
  }

  // Multi-word phrase check
  const phrase = words.join(" ");
  for (const keyword of FOOD_KEYWORDS) {
    if (phrase.includes(keyword)) {
      return { isFood: true, reason: "matched" };
    }
  }

  // No food word found — could be non-food
  return { isFood: false, reason: "No food-related content detected in this image" };
}

/**
 * Detect food from filename keywords.
 * PRIMARY detection method — works accurately for named food images.
 */
export function detectFoodFromFileName(fileName: string): DetectionMatch | null {
  const all = detectMultipleFoodsFromFileName(fileName);
  return all[0] ?? null;
}

/**
 * Detect MULTIPLE foods in a single filename.
 * e.g. "idli_sambar_dosa.jpg" or "rice and dal.jpg"
 *
 * IMPORTANT: matches are done on WORD BOUNDARIES, not raw substrings.
 * A raw `.includes("roti")` would also match inside "rotisserie",
 * "erotic", etc. — this was the exact cause of a rotisserie-chicken photo
 * (AI label: "rotisserie") being wrongly identified as "Chapati" (mapped
 * from the short key "roti"). Word-boundary matching prevents keywords
 * from accidentally matching as part of a longer, unrelated word.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findWholeWordMatch(text: string, keyword: string): number {
  const pattern = new RegExp(`(?<![a-z0-9])${escapeRegExp(keyword)}(?![a-z0-9])`, "i");
  const match = text.match(pattern);
  return match ? match.index! : -1;
}

export function detectMultipleFoodsFromFileName(fileName: string): DetectionMatch[] {
  const cleaned = fileName
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[_\-+,&]+/g, " ")
    .replace(/\b(and|with|plus)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const sortedKeys = Object.keys(fileNameFoodMapping).sort((a, b) => b.length - a.length);
  const seen = new Set<string>();
  const matches: (DetectionMatch & { pos: number })[] = [];

  let scratch = ` ${cleaned} `;
  for (const keyword of sortedKeys) {
    const idx = findWholeWordMatch(scratch, keyword);
    if (idx >= 0) {
      const foodKey = fileNameFoodMapping[keyword];
      const food = nutritionDatabase[foodKey];
      if (food && !seen.has(foodKey)) {
        seen.add(foodKey);
        matches.push({ food, foodKey, confidence: 0.95, detectedLabel: food.name, pos: idx });
        // Blank out the matched word (keep length so later indices stay valid)
        // so it can't be matched again by a shorter, overlapping keyword.
        scratch = scratch.slice(0, idx) + " ".repeat(keyword.length) + scratch.slice(idx + keyword.length);
      }
    }
  }

  for (const dbKey of Object.keys(nutritionDatabase)) {
    if (seen.has(dbKey)) continue;
    const idx = findWholeWordMatch(scratch, dbKey);
    if (idx >= 0) {
      seen.add(dbKey);
      matches.push({
        food: nutritionDatabase[dbKey],
        foodKey: dbKey,
        confidence: 0.9,
        detectedLabel: nutritionDatabase[dbKey].name,
        pos: idx,
      });
    }
  }

  return matches.sort((a, b) => a.pos - b.pos).map(({ pos: _p, ...m }) => m);
}

export function getFoodList(): { key: string; name: string; emoji: string }[] {
  return Object.entries(nutritionDatabase).map(([key, food]) => ({
    key,
    name: food.name,
    emoji: food.emoji,
  }));
}
