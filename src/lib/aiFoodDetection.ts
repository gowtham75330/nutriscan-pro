/**
 * aiFoodDetection.ts
 * ────────────────────────────────────────────────────────────────────────────
 * REAL, image-content-based food validation.
 *
 * Root cause of the mobile-vs-laptop bug this file fixes:
 * The old `validateFoodImage()` (see foodDetection.ts) only ever looked at the
 * FILE NAME string — it never looked at the actual picture. Laptop test files
 * often have descriptive names ("dog.jpg", "pizza.png") so the keyword
 * heuristic happened to work. Mobile photos (camera roll / DCIM / live
 * capture) almost always have generic, auto-generated names such as
 * "IMG_20250718_143022.jpg", "1000012345.jpg", or "camera-capture.jpg" — none
 * of those contain any keyword, so the old code fell into a "generic ⇒ treat
 * as food, let the user manually pick" branch, letting invalid images through
 * on mobile while rejecting them on laptop. Live camera capture was even
 * worse — it was hard-coded to `isFood: true` unconditionally, so it was
 * NEVER validated on either platform.
 *
 * The fix: analyze the actual pixels of the image using an in-browser AI
 * model (MobileNet, via TensorFlow.js) and decide isFood from what the model
 * actually sees. This has nothing to do with file names, so it behaves
 * identically for gallery uploads, drag-and-drop, and live camera capture, on
 * both mobile and laptop browsers.
 */
import type * as tfTypes from "@tensorflow/tfjs";
import type * as mobilenetTypes from "@tensorflow-models/mobilenet";

export interface AIDetectionResult {
  isFood: boolean;
  /** Best-guess label from the model, useful as a hint for nutrition lookup */
  topLabel: string;
  /** How confident the model is that topLabel specifically is correct (0-1) */
  topLabelConfidence: number;
  /** Confidence (0-1) that the image is food at all */
  confidence: number;
  /** Raw top predictions from the model, most confident first */
  predictions: { className: string; probability: number }[];
}

// ── MobileNet (ImageNet) class names that correspond to actual food items ──
// Expanded to cover more food categories including produce, cooking contexts,
// and items that strongly imply food is present.
const FOOD_CLASS_KEYWORDS = [
  // International fast food
  "cheeseburger", "hamburger", "hotdog", "hot dog", "pizza", "potpie",
  "trifle", "ice cream", "ice lolly", "french loaf", "bagel", "pretzel",
  "mashed potato", "head cabbage", "broccoli", "cauliflower", "zucchini",
  "spaghetti squash", "acorn squash", "butternut squash", "cucumber",
  "artichoke", "bell pepper", "cardoon", "mushroom", "granny smith",
  "strawberry", "orange", "lemon", "fig", "pineapple", "banana", "jackfruit",
  "custard apple", "pomegranate", "carbonara", "chocolate sauce", "dough",
  "meat loaf", "meatloaf", "burrito", "red wine", "espresso", "eggnog",
  "consomme", "guacamole", "plate", "corn", "custard", "waffle", "pomegranate",
  "sandwich", "taco", "sushi", "ramen", "noodle", "pasta", "curry", "salad",
  "soup bowl", "pancake", "pie", "cake", "cupcake", "donut", "doughnut",
  "bread", "toast", "rice", "cookie", "biscuit", "chip", "fries", "fried",
  "rotisserie", "frying pan", "wok", "hotpot", "dutch oven", "crock pot",
  // Fruits and vegetables (ImageNet produce classes)
  "apple", "banana", "orange", "lemon", "lime", "mango", "papaya",
  "pineapple", "watermelon", "strawberry", "blueberry", "raspberry",
  "grape", "peach", "pear", "cherry", "plum", "pomegranate", "fig",
  "avocado", "coconut", "kiwi", "guava", "melon", "jackfruit",
  "carrot", "potato", "sweet potato", "tomato", "onion", "garlic",
  "spinach", "lettuce", "cabbage", "eggplant", "pepper",
  "pumpkin", "radish", "turnip", "beet", "celery", "asparagus",
  // Protein / meat
  "chicken", "egg", "fish", "shrimp", "lobster", "crab", "clam",
  "beef", "pork", "lamb", "steak", "sausage", "bacon", "ham",
  "meat", "poultry", "seafood", "salmon", "tuna", "sardine",
  // Dairy
  "cheese", "milk", "butter", "yogurt", "cream", "ice cream",
  // Cooking / kitchen context (implies food present)
  "bowl", "dining table", "kitchen", "cutting board", "ladle",
  "spatula", "whisk", "mortar", "colander", "strainer",
  "coffee", "tea", "juice", "smoothie", "drink", "beverage",
  "alcohol", "beer", "wine", "cocktail",
  // Baked goods
  "muffin", "scone", "croissant", "pretzel", "cracker", "tortilla",
  "wrap", "pita", "flatbread", "roti", "naan", "dumpling",
  // Desserts
  "chocolate", "candy", "caramel", "pudding", "mousse", "gelatin",
  "brownie", "fudge", "truffle", "macaron",
  // Grains
  "oat", "wheat", "barley", "quinoa", "cereal",
  // Nuts and legumes
  "peanut", "almond", "walnut", "cashew", "pistachio", "bean", "lentil",
];

// ── Non-food class keywords (things frequently mistaken for food, or that
// commonly appear in "wrong image" uploads — used as an extra safety net) ──
const CLEARLY_NON_FOOD_KEYWORDS = [
  "person", "man", "woman", "groom", "bride", "dog", "cat", "bird", "horse",
  "car", "truck", "bus", "bicycle", "motor scooter", "airliner", "laptop",
  "notebook", "computer", "cellular telephone", "remote control", "screen",
  "monitor", "desk", "chair", "building", "church", "mosque", "library",
  "seashore", "mountain", "valley", "cliff", "lakeside", "volcano", "sky",
  "book jacket", "envelope", "web site", "menu", "comic book",
];

let modelPromise: Promise<mobilenetTypes.MobileNet> | null = null;

/** Loads (and caches) the MobileNet model. Safe to call repeatedly. */
function getModel(): Promise<mobilenetTypes.MobileNet> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const [tf, mobilenet] = await Promise.all([
        import("@tensorflow/tfjs"),
        import("@tensorflow-models/mobilenet"),
      ]);
      // Prefer WebGL for speed; TF.js falls back automatically on unsupported
      // devices (e.g. some older mobile browsers), so this works everywhere.
      try {
        await tf.setBackend("webgl");
      } catch {
        await tf.setBackend("cpu");
      }
      await tf.ready();
      return mobilenet.load({ version: 2, alpha: 1.0 });
    })();
  }
  return modelPromise;
}

/** Pre-warms the model in the background (call on app/page load, optional). */
export function preloadFoodDetectionModel(): void {
  getModel().catch(() => {
    // Ignore — a real classification attempt later will surface the error.
  });
}

function loadImageElement(source: string | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image for analysis"));
    if (typeof source === "string") {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}

function isFoodPrediction(predictions: { className: string; probability: number }[]): {
  isFood: boolean;
  confidence: number;
} {
  const top = predictions.slice(0, 5);

  let foodScore = 0;
  let nonFoodScore = 0;

  for (const p of top) {
    const label = p.className.toLowerCase();
    if (FOOD_CLASS_KEYWORDS.some((kw) => label.includes(kw))) {
      foodScore += p.probability;
    }
    if (CLEARLY_NON_FOOD_KEYWORDS.some((kw) => label.includes(kw))) {
      nonFoodScore += p.probability;
    }
  }

  // Lowered minimum confidence bar from 0.15 to 0.08 because many Indian
  // foods (idli, dosa, biryani, sambar, etc.) are NOT in ImageNet — so
  // MobileNet labels them with generic tags like "soup bowl", "plate",
  // "mixing bowl" etc. which have lower probability. A too-strict threshold
  // was causing valid Indian food images to be rejected.
  // Strategy: food wins if food signal >= 0.08 AND exceeds non-food signal.
  // If NEITHER food nor non-food scored strongly, treat as ALLOWED (better
  // to show manual food selector than block a genuine food photo).
  const clearNonFood = nonFoodScore >= 0.4 && nonFoodScore > foodScore * 2;
  const hasAnyFoodSignal = foodScore >= 0.08 && foodScore > nonFoodScore;
  const ambiguous = foodScore < 0.08 && nonFoodScore < 0.3;

  const isFood = hasAnyFoodSignal || ambiguous;
  return { isFood, confidence: Math.min(1, foodScore + (ambiguous ? 0.5 : 0)) };
}

/**
 * Runs the actual AI image-content analysis. Accepts either a data URL
 * (from FileReader / canvas.toDataURL) or a Blob/File — works identically
 * for gallery uploads, drag-and-drop files, and live camera captures.
 */
export async function analyzeImageForFood(source: string | Blob): Promise<AIDetectionResult> {
  const model = await getModel();
  const img = await loadImageElement(source);

  try {
    const rawPredictions = await model.classify(img, 10);
    const { isFood, confidence } = isFoodPrediction(rawPredictions);

    return {
      isFood,
      topLabel: rawPredictions[0]?.className ?? "unknown",
      topLabelConfidence: rawPredictions[0]?.probability ?? 0,
      confidence,
      predictions: rawPredictions,
    };
  } finally {
    if (img.src.startsWith("blob:")) {
      URL.revokeObjectURL(img.src);
    }
  }
}
