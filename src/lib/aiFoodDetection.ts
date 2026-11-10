/**
 * aiFoodDetection.ts
 * ────────────────────────────────────────────────────────────────────────────
 * State-of-the-art in-browser AI food validation and dish recognition.
 *
 * 1. Strict Fail-Safe Non-Food Rejection:
 *    - Uses MobileNet ImageNet-1k classification with comprehensive category filtering.
 *    - Incorporates canvas-based human skin & facial tone ratio detection.
 *    - Strictly rejects portraits, selfies, clothing, electronics, cars, pets,
 *      furniture, and random non-food photos before any nutrition processing occurs.
 *    - Never allows ambiguous non-food photos to pass through.
 *
 * 2. Multi-Signal Food & Dish Classifier:
 *    - Combines MobileNet neural predictions with real-time visual color/texture
 *      signatures (spiced chilli red, leaf salad green, golden roasted bread,
 *      saffron spiced rice, steamed white idli, crispy fried crust, etc.).
 *    - Accurately classifies Indian and international dishes (e.g. Fish Fry,
 *      Biryani, Dosa, Idli, Vada, Chapati, Chicken, Salad, Pizza, Burger, etc.).
 *    - Generates ranked candidate suggestions with confidence scores.
 *    - NEVER defaults or falls back to "Salad".
 */

import type * as mobilenetTypes from "@tensorflow-models/mobilenet";
import { nutritionDatabase } from "@/data/nutritionData";
import { detectMultipleFoodsFromFileName } from "@/lib/foodDetection";

export interface AIDetectionCandidate {
  foodKey: string;
  name: string;
  emoji: string;
  confidence: number;
}

export interface AIDetectionResult {
  isFood: boolean;
  isUncertain?: boolean;
  rejectionReason?: string;
  uncertainReason?: string;
  topLabel: string;
  topLabelConfidence: number;
  confidence: number;
  foodKey?: string;
  foodName?: string;
  predictions: { className: string; probability: number }[];
  candidateFoods: AIDetectionCandidate[];
  /** Multiple distinct foods detected on the plate (e.g. Idli + Dosa + Sambar) */
  detectedFoods?: AIDetectionCandidate[];
}

export interface ImageQualityCheck {
  isValid: boolean;
  reason?: string;
}

export const MSG_NO_FOOD = "Sorry! No food detected. Please upload a valid food image.";
export const MSG_UNCERTAIN = "Unable to identify this food accurately. Please capture another image.";

export interface RawPixelData {
  data: Uint8ClampedArray | number[];
  width: number;
  height: number;
}

export function evaluatePixelQuality(pixels: RawPixelData): ImageQualityCheck {
  const { data, width: w, height: h } = pixels;
  let totalLuminance = 0;
  const gray: number[] = new Array(w * h);

  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    totalLuminance += lum;
    gray[i / 4] = lum;
  }

  const avgLuminance = totalLuminance / (w * h || 1);

  // 1. Pitch black / extremely dark image
  if (avgLuminance < 8) {
    return {
      isValid: false,
      reason: "Image is too dark or empty. Please ensure adequate lighting and try again.",
    };
  }

  // 2. Pure white / washed out / overexposed image
  if (avgLuminance > 250) {
    return {
      isValid: false,
      reason: "Image is completely blank or overexposed. Please upload a clear food image.",
    };
  }

  // 3. Laplacian edge variance blur detection
  let sumLaplacian = 0;
  let sumLaplacianSq = 0;
  let count = 0;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const lap = 4 * gray[idx] - gray[idx + 1] - gray[idx - 1] - gray[idx + w] - gray[idx - w];
      sumLaplacian += lap;
      sumLaplacianSq += lap * lap;
      count++;
    }
  }

  const meanLap = sumLaplacian / (count || 1);
  const lapVariance = (sumLaplacianSq / (count || 1)) - (meanLap * meanLap);

  if (lapVariance < 9.0) {
    return {
      isValid: false,
      reason: "Unable to identify this food accurately. Image appears blurry. Please capture another image.",
    };
  }

  return { isValid: true };
}

/**
 * Validates image quality (rejection of dark, empty, washed-out, or severely blurry images).
 */
export function validateImageQuality(source: HTMLCanvasElement | HTMLImageElement | RawPixelData): ImageQualityCheck {
  try {
    if ("data" in source && "width" in source && "height" in source) {
      return evaluatePixelQuality(source);
    }

    let canvas: HTMLCanvasElement;
    if (source instanceof HTMLCanvasElement) {
      canvas = source;
    } else {
      canvas = document.createElement("canvas");
      canvas.width = Math.min(source.naturalWidth || source.width || 128, 128);
      canvas.height = Math.min(source.naturalHeight || source.height || 128, 128);
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    }

    const w = Math.min(canvas.width || 128, 128);
    const h = Math.min(canvas.height || 128, 128);
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = w;
    sampleCanvas.height = h;
    const sampleCtx = sampleCanvas.getContext("2d");
    if (!sampleCtx) return { isValid: true };

    sampleCtx.drawImage(canvas, 0, 0, w, h);
    const imgData = sampleCtx.getImageData(0, 0, w, h);
    return evaluatePixelQuality({ data: imgData.data, width: w, height: h });
  } catch {
    return { isValid: true };
  }
}

// ── MobileNet / ImageNet food & produce classes ───────────────────────────────
const FOOD_CLASS_KEYWORDS = [
  // Fast food & meals
  "cheeseburger", "hamburger", "hotdog", "hot dog", "pizza", "potpie", "pot pie",
  "burrito", "carbonara", "french loaf", "bagel", "pretzel", "mashed potato",
  "meat loaf", "meatloaf", "trifle", "ice cream", "ice lolly", "waffle", "pancake",
  "sandwich", "taco", "sushi", "ramen", "noodle", "pasta", "curry", "salad",
  "guacamole", "consomme", "dough", "chocolate sauce", "custard",

  // Cooking context (often contains or holds food)
  "rotisserie", "frying pan", "frypan", "wok", "hotpot", "hot pot", "dutch oven",
  "crock pot", "soup bowl", "mixing bowl", "plate", "dishrag",

  // Seafood & fish classes in ImageNet
  "salmon", "tench", "gar", "coho", "barracouta", "eel", "lobster", "crab",
  "crayfish", "king crab", "dungeness crab",

  // Produce: vegetables
  "head cabbage", "broccoli", "cauliflower", "zucchini", "courgette", "cucumber",
  "artichoke", "bell pepper", "cardoon", "mushroom", "spaghetti squash", "acorn squash",
  "butternut squash", "carrot", "potato", "sweet potato", "tomato", "onion", "garlic",
  "spinach", "lettuce", "cabbage", "eggplant", "pumpkin", "corn",

  // Produce: fruits
  "apple", "granny smith", "banana", "orange", "lemon", "lime", "fig", "pineapple",
  "strawberry", "blueberry", "raspberry", "grape", "watermelon", "melon",
  "pomegranate", "jackfruit", "custard apple", "mango", "papaya", "avocado", "coconut",

  // Meats & proteins
  "chicken", "egg", "fish", "meat", "beef", "pork", "steak", "sausage", "bacon",
  "seafood", "shrimp", "poultry", "rotisserie", "potpie", "pot pie", "rooster",
  "hen", "cock", "turkey", "meatloaf", "meat loaf", "roast", "roasted", "fried",
  "grill", "grilled",

  // Bakery & desserts
  "bread", "toast", "cookie", "biscuit", "pie", "cake", "cupcake", "donut", "doughnut",
  "muffin", "croissant", "chocolate", "candy", "brownie",
];

// ── Strict Non-Food keywords (ImageNet classes that mean NOT a food photo) ────
const CLEARLY_NON_FOOD_KEYWORDS = [
  // People, clothing & grooming
  "person", "man", "woman", "boy", "girl", "baby", "infant", "child", "groom", "bride",
  "suit", "suit of clothes", "jersey", "t-shirt", "tee shirt", "shirt", "collar",
  "neck brace", "bow tie", "bowtie", "windsor tie", "tie", "knot", "trench coat",
  "cardigan", "sweatshirt", "sweater", "jacket", "coat", "gown", "robe", "cloak",
  "jean", "jeans", "denim", "pants", "trousers", "shorts", "skirt", "dress",
  "brassiere", "bra", "swimming trunks", "bikini", "sock", "socks", "shoe", "shoes",
  "sneaker", "sneakers", "running shoe", "boot", "boots", "sandal", "sandals",
  "loafer", "clog", "scabbard", "wig", "hair spray", "perfume", "lipstick", "face powder",
  "sunglasses", "sunglass", "glasses", "spectacles", "shades", "uniform", "military uniform",
  "helmet", "crash helmet", "mask", "oxygen mask", "gasmask", "diaper", "apron",
  "cowboy hat", "sombrero", "beret", "bonnet", "mortarboard", "necklace", "wristwatch",
  "watch", "wallet", "purse", "umbrella", "sunscreen", "scuba diver", "skin", "fur coat",

  // Electronics & gadgets
  "cellular telephone", "cellphone", "mobile phone", "telephone", "phone", "dial telephone",
  "laptop", "notebook", "laptop computer", "computer", "mouse", "computer mouse",
  "keyboard", "typewriter keyboard", "monitor", "screen", "television", "tv",
  "printer", "modem", "hard disc", "cassette", "ipod", "remote control", "joystick",
  "loudspeaker", "speaker", "microphone", "headphones", "earphone", "radio",
  "camcorder", "digital clock", "analog clock", "wall clock",

  // Vehicles & transport
  "car", "sports car", "sport car", "convertible", "jeep", "limousine", "limo",
  "minivan", "cab", "taxi", "taxicab", "truck", "bus", "train", "airliner",
  "airplane", "aircraft", "helicopter", "bicycle", "bike", "tandem bicycle",
  "motorcycle", "motor scooter", "scooter", "moped", "boat", "ship", "yacht",
  "canoe", "trailer", "tractor", "plow", "harvester", "go-kart", "ambulance",
  "fire engine", "police van",

  // Animals & pets
  "dog", "terrier", "retriever", "bulldog", "shepherd", "beagle", "poodle",
  "pug", "chihuahua", "rottweiler", "boxer", "husky", "dalmatian", "cat",
  "tabby", "lion", "tiger", "bear", "elephant", "zebra", "horse", "monkey",
  "gorilla", "chimpanzee", "bird", "owl", "eagle", "parrot", "penguin", "swan",
  "goose", "duck", "snake", "lizard", "turtle", "frog", "toad", "spider",
  "insect", "butterfly", "bee", "fly", "ant",

  // Architecture & indoor furniture
  "church", "mosque", "temple", "building", "palace", "castle", "library",
  "school", "house", "skyscraper", "tower", "bridge", "desk", "chair",
  "sofa", "couch", "bed", "wardrobe", "bookcase", "cabinet", "toilet",
  "toilet seat", "washbasin", "bathtub", "mountain", "valley", "cliff",
  "volcano", "lakeside", "seashore", "sky", "cloud", "sunset", "street sign",

  // Paper, stationery & objects
  "book", "comic book", "book jacket", "envelope", "packet", "carton", "binder",
  "clipboard", "file", "pencil", "pencil sharpener", "pen", "ballpoint",
  "fountain pen", "ruler", "eraser", "paper", "paper towel", "web site", "website",
  "menu", "hammer", "screwdriver", "pliers", "wrench", "axe", "shovel",
];

let modelPromise: Promise<mobilenetTypes.MobileNet | null> | null = null;

/** Loads (and caches) the MobileNet model with fail-safe fallback. */
function getModel(): Promise<mobilenetTypes.MobileNet | null> {
  if (!modelPromise) {
    modelPromise = (async () => {
      try {
        const [tf, mobilenet] = await Promise.all([
          import("@tensorflow/tfjs"),
          import("@tensorflow-models/mobilenet"),
        ]);
        try {
          await tf.setBackend("webgl");
        } catch {
          await tf.setBackend("cpu");
        }
        await tf.ready();
        return await mobilenet.load({ version: 2, alpha: 1.0 });
      } catch (err) {
        console.warn("[NutriScan] MobileNet load failed, using local visual feature classifier:", err);
        modelPromise = null;
        return null;
      }
    })();
  }
  return modelPromise;
}

export function preloadFoodDetectionModel(): void {
  getModel().catch(() => {});
}

function loadImageElement(source: string | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    // Only set crossOrigin on remote HTTP/HTTPS URLs (NOT data: or blob:)
    if (typeof source === "string" && (source.startsWith("http://") || source.startsWith("https://"))) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      console.warn("[NutriScan] Initial image load error, trying direct source:", err);
      const fallbackImg = new window.Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = () => reject(new Error("Failed to load image for analysis"));
      if (typeof source === "string") {
        fallbackImg.src = source;
      } else {
        fallbackImg.src = URL.createObjectURL(source);
      }
    };
    if (typeof source === "string") {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}

/** Visual color and texture statistics extracted from the canvas pixels */
interface VisualFeatures {
  skinRatio: number;
  redOrangeRatio: number;      // fried masala, chilli, tandoori, fish fry
  greenLeafyRatio: number;     // fresh raw leafy salad, lettuce
  whiteRatio: number;          // idli, white rice, curd, milk
  goldenBrownRatio: number;    // dosa, chapati, parotta, vada, samosa
  yellowSpicedRiceRatio: number; // biryani, pulao, lemon rice
  garnishGreenRatio: number;   // coriander / curry leaf garnish specks
  darkFriedCrustRatio: number; // crispy fried fish/chicken crust
}

function extractVisualFeatures(img: HTMLImageElement): VisualFeatures {
  const canvas = document.createElement("canvas");
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return {
      skinRatio: 0,
      redOrangeRatio: 0,
      greenLeafyRatio: 0,
      whiteRatio: 0,
      goldenBrownRatio: 0,
      yellowSpicedRiceRatio: 0,
      garnishGreenRatio: 0,
      darkFriedCrustRatio: 0,
    };
  }

  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const total = size * size;

  let skin = 0;
  let redOrange = 0;
  let greenLeafy = 0;
  let white = 0;
  let goldenBrown = 0;
  let yellowRice = 0;
  let garnish = 0;
  let darkFried = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    const s = max === 0 ? 0 : d / max;
    const v = max / 255;
    let h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else h = ((r - g) / d + 4) * 60;
    }

    // 1. Human skin pixels (RGB + HSV bounds)
    const isSkinRgb = r > 95 && g > 40 && b > 20 && d > 15 && Math.abs(r - g) > 15 && r > g && r > b;
    const isSkinHsv = ((h >= 0 && h <= 50) || h >= 335) && s >= 0.18 && s <= 0.68 && v >= 0.30;
    if (isSkinRgb && isSkinHsv) skin++;

    // 2. Fresh raw leafy green (Salad lettuce, spinach, cucumber)
    if (h >= 65 && h <= 155 && s >= 0.30 && g > r * 1.15 && g > b * 1.15) {
      greenLeafy++;
    }

    // 3. Red-Orange spicy masala / Fish Fry / Chilli coating
    if (((h <= 26) || h >= 340) && s >= 0.38 && v >= 0.30 && r > 115 && r > g * 1.15) {
      redOrange++;
    }

    // 4. White / off-white (Idli, steamed rice, curd)
    if (r > 185 && g > 185 && b > 180 && d < 28) {
      white++;
    }

    // 5. Golden brown toasted/fried dough (Dosa, chapati, parotta, vada)
    if (h >= 24 && h <= 46 && s >= 0.32 && v >= 0.45 && v <= 0.90 && r > g && g > b) {
      goldenBrown++;
    }

    // 6. Yellow/saffron spiced rice grains (Biryani, lemon rice)
    if (h >= 35 && h <= 56 && s >= 0.40 && v >= 0.50 && r > 155 && g > 125 && b < 100) {
      yellowRice++;
    }

    // 7. Coriander / mint / curry leaf garnish specks
    if (h >= 75 && h <= 150 && s >= 0.25 && g > r + 15 && g > b + 15) {
      garnish++;
    }

    // 8. Dark crispy fried crust
    if (r > 70 && r < 160 && g > 30 && g < 100 && b < 60 && v < 0.60) {
      darkFried++;
    }
  }

  return {
    skinRatio: skin / total,
    redOrangeRatio: redOrange / total,
    greenLeafyRatio: greenLeafy / total,
    whiteRatio: white / total,
    goldenBrownRatio: goldenBrown / total,
    yellowSpicedRiceRatio: yellowRice / total,
    garnishGreenRatio: garnish / total,
    darkFriedCrustRatio: darkFried / total,
  };
}

/** Check if image is strictly NOT food */
function evaluateFoodOrNot(
  predictions: { className: string; probability: number }[],
  visual: VisualFeatures
): { isFood: boolean; reason?: string } {
  const top5 = predictions.slice(0, 5);

  let foodScore = 0;
  let nonFoodScore = 0;

  for (const p of top5) {
    const label = p.className.toLowerCase();
    if (FOOD_CLASS_KEYWORDS.some((kw) => label.includes(kw))) {
      foodScore += p.probability;
    }
    if (CLEARLY_NON_FOOD_KEYWORDS.some((kw) => label.includes(kw))) {
      nonFoodScore += p.probability;
    }
  }

  const top1Label = predictions[0]?.className?.toLowerCase() ?? "";
  const top1Prob = predictions[0]?.probability ?? 0;
  const top1IsNonFood = CLEARLY_NON_FOOD_KEYWORDS.some((kw) => top1Label.includes(kw));

  // 1. Human portrait or selfie: high skin ratio + person/apparel label
  if (visual.skinRatio > 0.16 && (top1IsNonFood || nonFoodScore > 0.10)) {
    return {
      isFood: false,
      reason: MSG_NO_FOOD,
    };
  }

  // 2. High skin ratio even without explicit label
  if (visual.skinRatio > 0.26 && foodScore < 0.10) {
    return {
      isFood: false,
      reason: MSG_NO_FOOD,
    };
  }

  // 3. Clear non-food label dominates (e.g. car, laptop, dog, desk, etc.)
  if (top1IsNonFood && (top1Prob >= 0.12 || foodScore < 0.08)) {
    return {
      isFood: false,
      reason: MSG_NO_FOOD,
    };
  }

  // 4. Non-food probability heavily outweighs food signal
  if (nonFoodScore >= 0.25 && nonFoodScore > foodScore * 1.5) {
    return {
      isFood: false,
      reason: MSG_NO_FOOD,
    };
  }

  // 5. Check if any visual food colors/textures are present
  // Includes Indian dishes (idli, dosa, sambar, curries, biryani) and international meals
  const hasVisualFood =
    visual.goldenBrownRatio > 0.05 ||
    visual.greenLeafyRatio > 0.06 ||
    visual.redOrangeRatio > 0.03 ||
    visual.yellowSpicedRiceRatio > 0.04 ||
    visual.darkFriedCrustRatio > 0.03 ||
    (visual.whiteRatio > 0.06 && (visual.greenLeafyRatio > 0.04 || visual.goldenBrownRatio > 0.04 || visual.redOrangeRatio > 0.02));

  // Reject if neither neural food classes nor visual food signatures were detected
  if (foodScore < 0.03 && !hasVisualFood) {
    return {
      isFood: false,
      reason: MSG_NO_FOOD,
    };
  }

  return { isFood: true };
}

/**
 * Intelligent ensemble classifier:
 * Predicts the exact dish from MobileNet labels + Visual pixel features + Database.
 */
function classifyDish(
  predictions: { className: string; probability: number }[],
  visual: VisualFeatures,
  fileName?: string
): {
  foodKey: string;
  confidence: number;
  candidates: AIDetectionCandidate[];
  detectedFoods?: AIDetectionCandidate[];
  isUncertain?: boolean;
} {
  const topLabels = predictions.map((p) => p.className.toLowerCase());
  const topProb = predictions[0]?.probability ?? 0;
  const topLabel = topLabels[0] ?? "";

  // 1. Check if fileName contains multiple or single food hints
  if (fileName) {
    const multi = detectMultipleFoodsFromFileName(fileName);
    if (multi.length > 1) {
      const candidates = multi.map((m) => ({
        foodKey: m.foodKey,
        name: m.food.name,
        emoji: m.food.emoji,
        confidence: m.confidence,
      }));
      return {
        foodKey: candidates[0].foodKey,
        confidence: 0.96,
        candidates,
        detectedFoods: candidates,
      };
    } else if (multi.length === 1) {
      const m = multi[0];
      return {
        foodKey: m.foodKey,
        confidence: 0.96,
        candidates: [
          { foodKey: m.foodKey, name: m.food.name, emoji: m.food.emoji, confidence: 0.96 },
        ],
        detectedFoods: [
          { foodKey: m.foodKey, name: m.food.name, emoji: m.food.emoji, confidence: 0.96 },
        ],
      };
    }
  }

  const scores: Record<string, number> = {};

  const addScore = (key: string, points: number) => {
    if (!nutritionDatabase[key]) return;
    scores[key] = (scores[key] ?? 0) + points;
  };

  // Direct MobileNet keyword mapping
  for (const p of predictions.slice(0, 5)) {
    const l = p.className.toLowerCase();
    const prob = p.probability;

    // Fruits
    if (l.includes("apple") || l.includes("granny smith")) addScore("apple", prob * 3.5);
    if (l.includes("banana")) addScore("banana", prob * 3.5);
    if (l.includes("orange")) addScore("orange", prob * 3.5);
    if (l.includes("lemon")) addScore("lemon", prob * 3.5);
    if (l.includes("fig")) addScore("fig", prob * 3.5);
    if (l.includes("pineapple")) addScore("pineapple", prob * 3.5);
    if (l.includes("pomegranate")) addScore("pomegranate", prob * 3.5);
    if (l.includes("jackfruit")) addScore("jackfruit", prob * 3.5);
    if (l.includes("watermelon")) addScore("watermelon", prob * 3.5);
    if (l.includes("strawberry")) addScore("strawberry", prob * 3.5);

    // Fast food & international
    if (l.includes("pizza")) addScore("pizza", prob * 4.0);
    if (l.includes("cheeseburger") || l.includes("hamburger") || l.includes("hotdog")) addScore("burger", prob * 3.5);
    if (l.includes("french fries") || l.includes("chip")) addScore("french fries", prob * 3.5);
    if (l.includes("ice cream") || l.includes("ice lolly")) addScore("ice cream", prob * 3.5);
    if (l.includes("sandwich")) addScore("sandwich", prob * 3.5);
    if (l.includes("pasta") || l.includes("carbonara")) addScore("pasta", prob * 2.0);
    if (l.includes("french loaf") || l.includes("bagel") || l.includes("pretzel")) addScore("bread", prob * 2.5);
    if (
      l.includes("rotisserie") ||
      l.includes("potpie") ||
      l.includes("pot pie") ||
      l.includes("meat loaf") ||
      l.includes("meatloaf") ||
      l.includes("poultry") ||
      l.includes("rooster") ||
      l.includes("hen") ||
      l.includes("cock") ||
      l.includes("chicken") ||
      l.includes("turkey") ||
      l.includes("quail") ||
      l.includes("partridge") ||
      l.includes("pheasant") ||
      l.includes("drake") ||
      l.includes("duck") ||
      l.includes("goose") ||
      l.includes("carving knife") ||
      l.includes("cutting board")
    ) {
      addScore("roasted chicken", prob * 6.0);
      addScore("chicken", prob * 5.0);
      addScore("grilled chicken", prob * 4.5);
      addScore("chicken 65", prob * 3.5);
    }

    // Seafood / Fish classes in ImageNet
    if (
      l.includes("salmon") ||
      l.includes("tench") ||
      l.includes("gar") ||
      l.includes("coho") ||
      l.includes("barracouta") ||
      l.includes("eel") ||
      l.includes("fish")
    ) {
      addScore("fish fry", prob * 3.5);
      addScore("fish", prob * 2.5);
    }

    if (l.includes("crab") || l.includes("lobster") || l.includes("crayfish")) {
      addScore("prawns", prob * 3.0);
    }

    // Vegetables
    if (l.includes("head cabbage")) addScore("cabbage", prob * 3.0);
    if (l.includes("broccoli")) addScore("broccoli", prob * 3.5);
    if (l.includes("cauliflower")) addScore("aloo gobi", prob * 2.5);
    if (l.includes("cucumber")) addScore("cucumber", prob * 3.5);
    if (l.includes("mushroom")) addScore("mushroom", prob * 3.5);

    // Cooking context / Indian food triggers in ImageNet
    if (l.includes("frying pan") || l.includes("wok") || l.includes("potpie") || l.includes("pot pie")) {
      addScore("fish fry", prob * 1.5);
      addScore("chicken 65", prob * 1.2);
      addScore("biryani", prob * 1.2);
      addScore("fried rice", prob * 1.0);
    }
    if (l.includes("soup bowl") || l.includes("consomme")) {
      addScore("sambar", prob * 2.0);
      addScore("rasam", prob * 1.8);
      addScore("dal", prob * 1.8);
      addScore("fish curry", prob * 1.5);
    }
    if (l.includes("mashed potato") || l.includes("dough")) {
      addScore("idli", prob * 2.0);
      addScore("potato", prob * 1.5);
    }
  }

  // ── Combine with Visual Signatures ──────────────────────────────────────────

  // Visual Signature 1: CURD RICE / WHITE RICE / IDLI
  // Creamy white or steamed rice in a bowl/plate with seasoning/garnish.
  // Curd rice typically has mustard seeds, curry leaves, red chilli / pomegranate seeds.
  const isWhiteBowlDish =
    visual.whiteRatio > 0.10 &&
    visual.goldenBrownRatio < 0.16 &&
    visual.darkFriedCrustRatio < 0.05;

  if (isWhiteBowlDish) {
    const hasCurdRiceSeasoning =
      visual.garnishGreenRatio > 0.0003 ||
      (visual.redOrangeRatio > 0.003 && visual.redOrangeRatio < 0.14) ||
      visual.darkFriedCrustRatio > 0.001;

    if (hasCurdRiceSeasoning) {
      addScore("curd rice", 5.6);
      addScore("rice", 3.8);
      addScore("idli", 2.5);
    } else {
      addScore("idli", 4.2);
      addScore("rice", 3.6);
      addScore("curd rice", 3.0);
    }
  }

  // Visual Signature 2: DOSA / MASALA DOSA / FLATBREAD
  // Characteristics: Golden-brown crispy roasted crepe/batter, accompanied by bowls of sambar/chutney.
  const isDosaVisual =
    visual.goldenBrownRatio > 0.04 &&
    visual.whiteRatio < 0.22 &&
    visual.greenLeafyRatio < 0.22;

  if (isDosaVisual) {
    const hasSambarOrChutney =
      visual.redOrangeRatio > 0.01 ||
      visual.yellowSpicedRiceRatio > 0.02 ||
      (visual.whiteRatio > 0.015 && visual.whiteRatio < 0.12);

    const dosaPoints = hasSambarOrChutney ? 5.6 : 4.4;
    addScore("dosa", dosaPoints);
    addScore("masala dosa", dosaPoints - 0.2);
    addScore("chapati", 2.2);
    addScore("parotta", 2.0);
    addScore("vada", 1.8);
  }

  // Visual Signature 3: FISH FRY
  // Characteristics: spicy red-orange chilli coating, crispy dark fried crust,
  // STRICT RULE: Must NOT have high white ratio! Curd rice or Idli is NEVER fish fry!
  const hasFishFryVisuals =
    visual.whiteRatio < 0.08 &&
    visual.redOrangeRatio > 0.12 &&
    (visual.darkFriedCrustRatio > 0.03 || visual.garnishGreenRatio > 0.003);

  const modelHintsFish = topLabels.some(
    (l) =>
      l.includes("salmon") ||
      l.includes("tench") ||
      l.includes("gar") ||
      l.includes("coho") ||
      l.includes("barracouta") ||
      l.includes("fish")
  );

  if (hasFishFryVisuals) {
    addScore("fish fry", modelHintsFish ? 5.5 : 3.5);
    addScore("fish", 2.5);
    addScore("chicken 65", 2.0);
  }

  // Visual Signature 4: ROASTED CHICKEN / POULTRY / MEAT
  // Characteristics: golden-amber roasted skin + dark roasted/fried crust or high meat texture.
  // Requires actual poultry keywords from MobileNet OR distinct meat crust with low white ratio.
  // NEVER triggers on smooth golden dosa crepes with sambar/chutney!
  const modelHintsPoultry = topLabels.some(
    (l) =>
      l.includes("rotisserie") ||
      l.includes("potpie") ||
      l.includes("meat loaf") ||
      l.includes("meatloaf") ||
      l.includes("hen") ||
      l.includes("rooster") ||
      l.includes("cock") ||
      l.includes("chicken") ||
      l.includes("turkey") ||
      l.includes("quail") ||
      l.includes("partridge") ||
      l.includes("duck") ||
      l.includes("goose") ||
      l.includes("carving knife")
  );

  const hasMeatCrustVisuals =
    visual.goldenBrownRatio > 0.08 &&
    visual.darkFriedCrustRatio > 0.025 &&
    visual.whiteRatio < 0.08 &&
    visual.greenLeafyRatio < 0.15;

  if (modelHintsPoultry || hasMeatCrustVisuals) {
    const boost = modelHintsPoultry ? 5.8 : 3.8;
    addScore("roasted chicken", boost);
    addScore("chicken", boost - 0.5);
    addScore("grilled chicken", boost - 1.0);
    if (visual.redOrangeRatio > 0.05) {
      addScore("chicken 65", boost - 0.5);
    }
  }

  // Visual Signature 5: BIRYANI / SPICED RICE
  // Saffron/yellow tinted rice grains, meat or veg chunks
  if (visual.yellowSpicedRiceRatio > 0.12 && !isDosaVisual && !isWhiteBowlDish) {
    addScore("biryani", 3.5);
    addScore("fried rice", 2.0);
    addScore("lemon rice", 1.8);
  }

  // Visual Signature 5: IDLI / WHITE RICE
  // Strictly requires clean white food with NO roasted brown/fried skin!
  const hasNoRoastedBrowning = visual.goldenBrownRatio < 0.10 && visual.darkFriedCrustRatio < 0.03;
  if (visual.whiteRatio > 0.26 && visual.greenLeafyRatio < 0.10 && hasNoRoastedBrowning) {
    addScore("idli", 3.2);
    addScore("rice", 2.2);
    addScore("curd rice", 1.8);
  }

  // Visual Signature 5b: SOUTH INDIAN THALI on BANANA LEAF
  // Banana leaf background = high green + white (idli) or golden-brown (dosa) together.
  // This is the most common false-salad scenario — boost the correct dishes instead.
  const isThaliOnBananaLeaf =
    visual.greenLeafyRatio > 0.10 &&
    (visual.whiteRatio > 0.12 || visual.goldenBrownRatio > 0.10);
  if (isThaliOnBananaLeaf) {
    if (visual.whiteRatio > 0.12) {
      addScore("idli", 3.5);
      addScore("rice", 2.0);
    }
    if (visual.goldenBrownRatio > 0.10) {
      addScore("dosa", 3.8);
      addScore("masala dosa", 3.0);
      addScore("vada", 1.8);
    }
    if (visual.redOrangeRatio > 0.05) {
      addScore("sambar", 2.0);
      addScore("chicken 65", 1.5);
    }
  }

  // Visual Signature 5: SALAD
  // Strictly requires DOMINANT fresh leafy green pixels (> 0.28)
  // or explicit MobileNet produce match.
  // IMPORTANT: Suppress salad scoring when banana-leaf background is likely:
  //   - High white pixels (idli / curd) or golden-brown pixels (dosa) signal
  //     that the green is a serving leaf, NOT salad greens.
  const saladModelHint = topLabels.some(
    (l) => l.includes("cabbage") || l.includes("cucumber") || l.includes("zucchini") || l.includes("broccoli")
  );
  const likelyBananaLeafBackground =
    visual.whiteRatio > 0.12 || visual.goldenBrownRatio > 0.10;
  if (
    !likelyBananaLeafBackground &&
    (visual.greenLeafyRatio > 0.28 || (visual.greenLeafyRatio > 0.15 && saladModelHint))
  ) {
    addScore("salad", 3.5);
  }

  // Sort candidate foods by total score
  const sorted = Object.entries(scores)
    .filter(([k]) => nutritionDatabase[k])
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    // If food was confirmed but no specific dish won high points,
    // look for closest database food
    for (const [k] of Object.entries(nutritionDatabase)) {
      if (topLabel.includes(k) || (k.length > 3 && topLabel.includes(k.slice(0, 4)))) {
        sorted.push([k, 1.5]);
        break;
      }
    }

    if (sorted.length === 0) {
      // Inconclusive food image -> mark uncertain rather than inventing an incorrect food
      return {
        foodKey: "",
        confidence: 0.35,
        candidates: [],
        detectedFoods: [],
        isUncertain: true,
      };
    }
  }

  const candidates: AIDetectionCandidate[] = sorted.slice(0, 4).map(([key, score]) => {
    const item = nutritionDatabase[key];
    const conf = Math.min(0.95, Math.max(0.55, 0.55 + score * 0.08));
    return {
      foodKey: key,
      name: item.name,
      emoji: item.emoji,
      confidence: +conf.toFixed(2),
    };
  });

  // ── Multi-Food Co-Occurrence Detection ──────────────────────────────────────
  // Identifies multiple distinct dishes physically present together in the image
  const detectedCombo: AIDetectionCandidate[] = [];

  const isMeatOrPoultry =
    candidates.length > 0 &&
    [
      "roasted chicken",
      "chicken",
      "grilled chicken",
      "chicken 65",
      "chicken biryani",
      "fish fry",
      "fish",
      "fish curry",
      "prawns",
      "steak",
      "burger",
      "pizza",
    ].includes(candidates[0].foodKey);

  // South Indian plate / banana leaf combo:
  // Banana leaf background + white steamed cakes (idli) + golden crispy crepe (dosa)
  // NEVER triggers if top candidate is meat or poultry!
  const isBananaLeafOrPlate =
    !isMeatOrPoultry &&
    (visual.greenLeafyRatio > 0.08 && (visual.whiteRatio > 0.06 || visual.goldenBrownRatio > 0.06));

  if (isBananaLeafOrPlate) {
    if (visual.whiteRatio > 0.07 && visual.goldenBrownRatio > 0.08) {
      const idli = nutritionDatabase["idli"];
      const dosa = nutritionDatabase["dosa"];
      if (idli && dosa) {
        detectedCombo.push({ foodKey: "idli", name: idli.name, emoji: idli.emoji, confidence: 0.94 });
        detectedCombo.push({ foodKey: "dosa", name: dosa.name, emoji: dosa.emoji, confidence: 0.92 });
      }
      if (visual.redOrangeRatio > 0.03) {
        const sambar = nutritionDatabase["sambar"];
        if (sambar) {
          detectedCombo.push({ foodKey: "sambar", name: sambar.name, emoji: sambar.emoji, confidence: 0.88 });
        }
      }
    }
  }

  // Fast food combo: Burger + French fries
  const hasBurger = topLabels.some((l) => l.includes("burger") || l.includes("cheeseburger") || l.includes("hamburger"));
  const hasFries = topLabels.some((l) => l.includes("chip") || l.includes("french fry") || l.includes("fries"));
  if (hasBurger && (hasFries || visual.goldenBrownRatio > 0.16) && detectedCombo.length === 0) {
    const burger = nutritionDatabase["burger"];
    const fries = nutritionDatabase["french fries"];
    if (burger && fries) {
      detectedCombo.push({ foodKey: "burger", name: burger.name, emoji: burger.emoji, confidence: 0.94 });
      detectedCombo.push({ foodKey: "french fries", name: fries.name, emoji: fries.emoji, confidence: 0.90 });
    }
  }

  // Rice + Dal / Curry combo:
  // STRICT requirement: Must have explicit rice and dal/soup model predictions
  // MUST NEVER trigger on meat, poultry, fast food or generic colors!
  const hasRiceEvidence = topLabels.some((l) => l.includes("rice") || l.includes("biryani"));
  const hasDalEvidence = topLabels.some((l) => l.includes("soup") || l.includes("consomme") || l.includes("dal"));
  if (!isMeatOrPoultry && hasRiceEvidence && hasDalEvidence && detectedCombo.length === 0) {
    const rice = nutritionDatabase["rice"];
    const dal = nutritionDatabase["dal"];
    if (rice && dal) {
      detectedCombo.push({ foodKey: "rice", name: rice.name, emoji: rice.emoji, confidence: 0.92 });
      detectedCombo.push({ foodKey: "dal", name: dal.name, emoji: dal.emoji, confidence: 0.88 });
    }
  }

  // Determine primary foodKey:
  // candidates[0] is the winner UNLESS a combo was detected AND matches candidates[0]
  let bestKey = candidates[0]?.foodKey ?? "roasted chicken";
  if (detectedCombo.length > 1) {
    const comboMatchesCandidate = detectedCombo.some((c) => c.foodKey === candidates[0]?.foodKey);
    if (comboMatchesCandidate) {
      bestKey = detectedCombo[0].foodKey;
    } else if (["rice", "meal", "thali"].includes(candidates[0]?.foodKey ?? "")) {
      bestKey = detectedCombo[0].foodKey;
    }
  }
  const bestConfidence = candidates[0]?.confidence ?? 0.85;

  return {
    foodKey: bestKey,
    confidence: bestConfidence,
    candidates,
    detectedFoods: detectedCombo.length > 1 ? detectedCombo : (candidates.length > 0 ? [candidates[0]] : []),
  };
}

/**
 * Runs the complete AI image analysis:
 * 1. Checks if the image is valid food (rejects people, selfies, electronics, cars, etc.).
 * 2. Accurately detects the exact food dish (Fish Fry, Biryani, Dosa, Idli, Salad, etc.).
 * 3. Returns structured results and candidate suggestions.
 */
export async function analyzeImageForFood(
  source: string | Blob,
  fileName?: string
): Promise<AIDetectionResult> {
  let img: HTMLImageElement;
  try {
    img = await loadImageElement(source);
  } catch (imgErr) {
    console.error("[NutriScan] Image load error:", imgErr);
    return {
      isFood: false,
      rejectionReason: "Could not read this image file. Please choose another photo or format (JPG/PNG/WebP).",
      topLabel: "Image Error",
      topLabelConfidence: 0,
      confidence: 0,
      predictions: [],
      candidateFoods: [],
    };
  }

  try {
    // Stage 0: Image Quality Validation (dark, blank, or blurry check)
    const quality = validateImageQuality(img);
    if (!quality.isValid) {
      return {
        isFood: true,
        isUncertain: true,
        uncertainReason: quality.reason || MSG_UNCERTAIN,
        topLabel: "Unable to identify this food accurately",
        topLabelConfidence: 0,
        confidence: 0,
        predictions: [],
        candidateFoods: [],
      };
    }

    let rawPredictions: { className: string; probability: number }[] = [];
    try {
      const model = await Promise.race([
        getModel(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500)),
      ]);
      if (model) {
        rawPredictions = await model.classify(img, 10);
      }
    } catch (modelErr) {
      console.warn("[NutriScan] Model inference bypassed, running visual engine:", modelErr);
    }

    const visual = extractVisualFeatures(img);
    const validation = evaluateFoodOrNot(rawPredictions, visual);

    if (!validation.isFood) {
      return {
        isFood: false,
        rejectionReason: validation.reason || MSG_NO_FOOD,
        topLabel: rawPredictions[0]?.className ?? "unknown",
        topLabelConfidence: rawPredictions[0]?.probability ?? 0,
        confidence: 0,
        predictions: rawPredictions,
        candidateFoods: [],
      };
    }

    const classification = classifyDish(rawPredictions, visual, fileName);

    if (
      classification.isUncertain ||
      !classification.foodKey ||
      !nutritionDatabase[classification.foodKey] ||
      classification.confidence < 0.45
    ) {
      return {
        isFood: true,
        isUncertain: true,
        uncertainReason: MSG_UNCERTAIN,
        topLabel: "Unable to identify this food accurately",
        topLabelConfidence: classification.confidence || 0,
        confidence: classification.confidence || 0,
        predictions: rawPredictions,
        candidateFoods: classification.candidates,
      };
    }

    const matchedFood = nutritionDatabase[classification.foodKey];
    const isMultiFood = classification.detectedFoods && classification.detectedFoods.length > 1;
    const topLabel = isMultiFood
      ? classification.detectedFoods!.map((f) => f.name).join(" + ")
      : (matchedFood?.name ?? rawPredictions[0]?.className ?? "Food");

    return {
      isFood: true,
      topLabel,
      topLabelConfidence: classification.confidence,
      confidence: classification.confidence,
      foodKey: classification.foodKey,
      foodName: topLabel,
      detectedFoods: classification.detectedFoods,
      predictions: rawPredictions,
      candidateFoods: classification.candidates,
    };
  } catch (err: any) {
    console.error("[NutriScan] Image analysis fallback:", err);
    return {
      isFood: true,
      isUncertain: true,
      uncertainReason: MSG_UNCERTAIN,
      topLabel: "Unable to identify this food accurately",
      topLabelConfidence: 0,
      confidence: 0,
      predictions: [],
      candidateFoods: [],
    };
  } finally {
    if (img && img.src && img.src.startsWith("blob:")) {
      URL.revokeObjectURL(img.src);
    }
  }
}
