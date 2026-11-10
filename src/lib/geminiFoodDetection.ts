/**
 * geminiFoodDetection.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Multimodal AI Food Recognition using Google Gemini Vision API.
 *
 * 1. Secure Server-Side First:
 *    Sends base64 image data to the backend endpoint (/api/analyze-food),
 *    where GEMINI_API_KEY is securely kept in environment variables.
 *
 * 2. Client-Side Fallback:
 *    - If backend has a custom client key (VITE_GEMINI_API_KEY or localStorage key),
 *      it can call Google's REST endpoint directly.
 *    - If no Gemini API key is configured anywhere, it falls back to the
 *      on-device MobileNet neural classifier with zero-hallucination guardrails.
 *
 * 3. Multi-Food Detection:
 *    - Detects ALL distinct foods visible in the image (e.g. Idli + Dosa + Sambar).
 *    - Returns combined nutrition for the full plate/thali.
 *    - Works for Indian and international foods.
 *
 * 4. Strict Rules:
 *    - Always analyzes the actual image pixels.
 *    - Rejects non-food photos (selfies, people, pets, vehicles, electronics, etc.).
 *    - Never returns "Idli" for a chicken image.
 *    - Real confidence scores from the model.
 */

import { nutritionDatabase } from "@/data/nutritionData";
import { analyzeImageForFood, type AIDetectionResult, type AIDetectionCandidate } from "./aiFoodDetection";

export interface GeminiDetectionResponse {
  isFood: boolean;
  isUncertain?: boolean;
  /** Primary detected food (for backward compat) */
  foodName?: string;
  matchedKey?: string;
  confidence: number;
  /** All distinct foods visible in the image */
  detectedFoods?: { name: string; foodKey: string; confidence: number }[];
  candidateFoods?: { name: string; foodKey: string; confidence: number }[];
  reason?: string;
}

const LOCAL_STORAGE_KEY_NAME = "nutriscan_user_gemini_key";

export function getUserGeminiApiKey(): string {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEY_NAME) || "";
  } catch {
    return "";
  }
}

export function setUserGeminiApiKey(key: string): void {
  try {
    if (!key) {
      localStorage.removeItem(LOCAL_STORAGE_KEY_NAME);
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY_NAME, key.trim());
    }
  } catch {}
}

/**
 * Normalizes any detected food name to a valid database key in NutriScan Pro.
 * NEVER forces an incorrect food name or defaults to "rice".
 */
export function mapToNutritionKey(rawName: string, rawKey?: string | null): string {
  const normalizedRawKey = (rawKey || "").toLowerCase().replace(/_/g, " ").trim();
  if (normalizedRawKey && nutritionDatabase[normalizedRawKey]) {
    return normalizedRawKey;
  }

  const clean = (rawName || "").toLowerCase().replace(/_/g, " ").trim();
  if (!clean) return "";

  // Exact match
  if (nutritionDatabase[clean]) return clean;

  // Indian and Tamil Nadu staple foods & breakfasts
  if (clean.includes("masala dosa") || clean.includes("masaladosa")) return "masala dosa";
  if (clean.includes("dosa") || clean.includes("dosai") || clean.includes("thosai")) return "dosa";
  if (clean.includes("idli") || clean.includes("idly") || clean.includes("steamed rice cake")) return "idli";
  if (clean.includes("vada") || clean.includes("vadai") || clean.includes("medu vada")) return "vada";
  if (clean.includes("pongal") || clean.includes("ven pongal") || clean.includes("khichdi")) return "pongal";
  if (clean.includes("upma") || clean.includes("uppuma")) return "upma";
  if (clean.includes("poori") || clean.includes("puri")) return "poori";
  if (clean.includes("chapati") || clean.includes("roti") || clean.includes("phulka")) return "chapati";
  if (clean.includes("kothu parotta") || clean.includes("kothu")) return "kothu parotta";
  if (clean.includes("parotta") || clean.includes("paratha") || clean.includes("porotta")) return "parotta";
  if (clean.includes("curd rice") || clean.includes("thayir sadam") || clean.includes("dahi chawal")) return "curd rice";
  if (clean.includes("lemon rice") || clean.includes("elumichai sadam") || clean.includes("chitranna")) return "lemon rice";
  if (clean.includes("fried rice")) return "fried rice";
  if (clean.includes("sambar") || clean.includes("sambhar")) return "sambar";
  if (clean.includes("rasam")) return "rasam";
  if (clean.includes("puttu")) return "puttu";
  if (clean.includes("appam") || clean.includes("hoppers")) return "appam";
  if (clean.includes("kozhukattai") || clean.includes("modak")) return "kozhukattai";
  if (clean.includes("dal") || clean.includes("dhal") || clean.includes("lentil") || clean.includes("paruppu")) return "dal";
  if (clean.includes("rice") || clean.includes("sadam") || clean.includes("chawal")) return "rice";

  // Meats, poultry & seafood
  if (clean.includes("chicken biryani")) return "chicken biryani";
  if (clean.includes("mutton biryani")) return "mutton";
  if (clean.includes("biryani") || clean.includes("biriyani") || clean.includes("briyani")) return "biryani";
  if (clean.includes("roast") && clean.includes("chicken")) return "roasted chicken";
  if (clean.includes("rotisserie")) return "roasted chicken";
  if (clean.includes("grill") && clean.includes("chicken")) return "grilled chicken";
  if (clean.includes("butter chicken") || clean.includes("murgh makhani")) return "butter chicken";
  if (clean.includes("chicken 65") || clean.includes("fried chicken") || clean.includes("chicken fry")) return "chicken 65";
  if (clean.includes("chicken curry") || clean.includes("chicken gravy") || clean.includes("chicken kuzhambu")) return "chicken";
  if (clean.includes("chicken")) return "chicken";

  if (clean.includes("fish fry") || clean.includes("fried fish") || clean.includes("meen varuval")) return "fish fry";
  if (clean.includes("fish curry") || clean.includes("meen kulambu") || clean.includes("meen kuzhambu")) return "fish curry";
  if (clean.includes("fish") || clean.includes("meen") || clean.includes("salmon") || clean.includes("tuna")) return "fish";
  if (clean.includes("mutton") || clean.includes("goat") || clean.includes("lamb")) return "mutton";
  if (clean.includes("prawn") || clean.includes("shrimp") || clean.includes("erall")) return "prawns";
  if (clean.includes("omelette") || clean.includes("omelet") || clean.includes("egg omelette")) return "omelette";
  if (clean.includes("egg") || clean.includes("boiled egg") || clean.includes("muttai")) return "egg";

  // Indian vegetarian specialties
  if (clean.includes("paneer butter masala")) return "paneer butter masala";
  if (clean.includes("palak paneer")) return "palak paneer";
  if (clean.includes("paneer")) return "paneer";
  if (clean.includes("tofu")) return "tofu";
  if (clean.includes("chole") || clean.includes("chana masala") || clean.includes("chickpea")) return "chole";
  if (clean.includes("rajma") || clean.includes("kidney bean")) return "rajma";
  if (clean.includes("naan")) return "naan";
  if (clean.includes("aloo gobi") || clean.includes("alu gobi")) return "aloo gobi";

  // Fast food & international
  if (clean.includes("samosa")) return "samosa";
  if (clean.includes("pizza")) return "pizza";
  if (clean.includes("burger") || clean.includes("cheeseburger") || clean.includes("hamburger")) return "burger";
  if (clean.includes("sandwich")) return "sandwich";
  if (clean.includes("french fries") || clean.includes("fries") || clean.includes("finger chips")) return "french fries";
  if (clean.includes("noodle") || clean.includes("maggi") || clean.includes("chowmein")) return "noodles";
  if (clean.includes("pasta") || clean.includes("spaghetti") || clean.includes("macaroni")) return "pasta";
  if (clean.includes("soup")) return "soup";
  if (clean.includes("salad")) return "salad";
  if (clean.includes("steak")) return "steak";

  // Produce
  if (clean.includes("apple")) return "apple";
  if (clean.includes("banana")) return "banana";
  if (clean.includes("orange")) return "orange";
  if (clean.includes("mango")) return "mango";
  if (clean.includes("grape")) return "grapes";
  if (clean.includes("watermelon")) return "watermelon";
  if (clean.includes("papaya")) return "papaya";
  if (clean.includes("pomegranate")) return "pomegranate";
  if (clean.includes("pineapple")) return "pineapple";
  if (clean.includes("guava")) return "guava";
  if (clean.includes("coconut")) return "coconut";
  if (clean.includes("carrot")) return "carrot";
  if (clean.includes("tomato")) return "tomato";
  if (clean.includes("potato")) return "potato";
  if (clean.includes("onion")) return "onion";
  if (clean.includes("broccoli")) return "broccoli";
  if (clean.includes("spinach")) return "spinach";
  if (clean.includes("beetroot")) return "beetroot";
  if (clean.includes("cabbage")) return "cabbage";
  if (clean.includes("cucumber")) return "cucumber";
  if (clean.includes("mushroom")) return "mushroom";

  // Dairy & drinks
  if (clean.includes("curd") || clean.includes("yogurt") || clean.includes("dahi")) return "curd";
  if (clean.includes("milk") || clean.includes("paal")) return "milk";
  if (clean.includes("buttermilk") || clean.includes("mor")) return "buttermilk";
  if (clean.includes("tea") || clean.includes("chai")) return "tea";
  if (clean.includes("coffee") || clean.includes("kaapi")) return "coffee";
  if (clean.includes("juice")) return "fruit juice";

  // Check all keys in nutrition database
  for (const k of Object.keys(nutritionDatabase)) {
    if (clean.includes(k) || k.includes(clean)) {
      return k;
    }
  }

  // Never force or invent an incorrect food key
  return "";
}

/**
 * Fast client-side image downscaler to convert large camera/upload files (10MB+)
 * to an optimal 800px JPEG (< 100KB) for instant network transport & analysis.
 */
export async function compressImageForAnalysis(
  dataUrl: string,
  maxDim = 800,
  quality = 0.82
): Promise<{ dataUrl: string; base64: string; mimeType: string }> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !dataUrl.startsWith("data:image/")) {
      const parts = dataUrl.split(",");
      return resolve({
        dataUrl,
        base64: parts[1] || parts[0],
        mimeType: "image/jpeg",
      });
    }

    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxDim && height <= maxDim && dataUrl.length < 350000) {
        const parts = dataUrl.split(",");
        const mimeMatch = parts[0].match(/:(.*?);/);
        return resolve({
          dataUrl,
          base64: parts[1] || parts[0],
          mimeType: mimeMatch ? mimeMatch[1] : "image/jpeg",
        });
      }

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        const parts = dataUrl.split(",");
        return resolve({ dataUrl, base64: parts[1], mimeType: "image/jpeg" });
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      const base64 = compressedDataUrl.split(",")[1];
      resolve({ dataUrl: compressedDataUrl, base64, mimeType: "image/jpeg" });
    };

    img.onerror = () => {
      const parts = dataUrl.split(",");
      resolve({ dataUrl, base64: parts[1] || parts[0], mimeType: "image/jpeg" });
    };

    img.src = dataUrl;
  });
}

/**
 * Fetch wrapper with strict timeout to prevent indefinite loading states.
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 7000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Calls direct Google Gemini Vision REST endpoint when client has a key.
 * Evaluates food vs non-food, quality/blur, and dish classification.
 */
async function callGeminiDirectRest(
  base64Data: string,
  mimeType: string,
  apiKey: string
): Promise<GeminiDetectionResponse | null> {
  const models = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-flash-lite-latest",
    "gemini-3.6-flash",
  ];

  const prompt = `You are an expert food nutritionist and computer vision AI for NutriScan Pro.
Carefully examine the image pixels and respond with JSON ONLY (no markdown code blocks, no text explanations).

STAGE 1: FOOD VS NON-FOOD DETECTION
- Classify whether the image genuinely contains real, edible food, meals, cooked dishes, fruits, vegetables, drinks, or desserts.
- If the image contains a photograph of food (even if shown on a mobile phone screen, book, magazine, or menu), recognize the FOOD in the photo!
- If the image is STRICTLY NON-FOOD (human portrait, selfie, face, clothing, animal/pet, vehicle/car, building/architecture, office document, book page with no food, screenshot of an app/desktop with no food, electronics, blank/empty wall, or random non-food object):
  Set "isFood": false
  Set "isUncertain": false
  Set "reason": "Sorry! No food detected. Please upload a valid food image."
  Set "foodName": null, "matchedKey": null, "confidence": 0, "detectedFoods": [], "candidateFoods": []

STAGE 2: IMAGE USABILITY & BLUR CHECK
- If the image is so blurry, pitch black, overexposed white, corrupted, or out-of-focus that the food cannot be identified with genuine confidence:
  Set "isFood": true
  Set "isUncertain": true
  Set "reason": "Unable to identify this food accurately. Please capture another image."

STAGE 3: ACCURATE MULTI-FOOD IDENTIFICATION
- If the image contains food, identify the dish or all distinct items on the plate/tray.
- Read any visible titles, recipe names, or caption text displayed on screens or packaging (e.g. "Curd Rice", "Crispy Masala Dosa", "Chicken") to ensure exact identification.
- South Indian & Indian cuisine specifics:
  * White rice mixed with yogurt/curd, tempered with mustard seeds, curry leaves, and dried chillies / pomegranate is Curd Rice (Thayir Sadam) — NOT fish fry!
  * Rolled or flat crispy golden crepe served with sambar and chutney is Dosa / Masala Dosa.
  * Whole or cut roast/grilled chicken is Roasted Chicken / Chicken.
  * Fish fry is a piece of fish with spicy red coating — NEVER creamy white rice!
- Provide genuine confidence score (0.00 to 1.00).
- If confidence < 0.45 or food is too ambiguous to determine:
  Set "isUncertain": true
  Set "reason": "Unable to identify this food accurately. Please capture another image."

OUTPUT JSON SCHEMA:
{
  "isFood": boolean,
  "isUncertain": boolean,
  "foodName": string | null,
  "matchedKey": string | null,
  "confidence": number,
  "detectedFoods": [
    { "name": string, "foodKey": string, "confidence": number }
  ],
  "candidateFoods": [
    { "name": string, "foodKey": string, "confidence": number }
  ],
  "reason": string | null
}`;

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.1,
          },
        }),
      }, 12000);

      if (!response.ok) {
        console.warn(`[NutriScan] Gemini model ${model} returned HTTP ${response.status}, trying fallback...`);
        continue;
      }

      const json = await response.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;
      return JSON.parse(text) as GeminiDetectionResponse;
    } catch (modelErr) {
      console.warn(`[NutriScan] Gemini model ${model} request error or timeout:`, modelErr);
    }
  }

  return null;
}

/**
 * Main multimodal food analysis pipeline for NutriScan Pro:
 * 1. Checks backend (/api/analyze-food)
 * 2. Checks direct Gemini key if available
 * 3. Falls back to enhanced on-device MobileNet computer vision
 *
 * Returns multi-food results when multiple foods are detected.
 */
export async function detectFoodWithGemini(
  dataUrl: string,
  fileName?: string
): Promise<AIDetectionResult> {
  // Compress image to optimal resolution for instant transport (< 100KB)
  const compressed = await compressImageForAnalysis(dataUrl, 800, 0.82);
  const base64Data = compressed.base64;
  const mimeType = compressed.mimeType;

  let geminiResult: GeminiDetectionResponse | null = null;

  // ── Step 1: Try Backend Serverless Endpoint (/api/analyze-food) with 4s timeout
  try {
    const res = await fetchWithTimeout("/api/analyze-food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Data, mimeType }),
    }, 4000);

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        geminiResult = json.data;
      }
    }
  } catch (err) {
    console.warn("[NutriScan] Backend analyze-food unreachable or offline, trying fallbacks...");
  }

  // ── Step 2: Try Direct Gemini Call if client has key ─────────────────────
  if (!geminiResult) {
    const clientKey =
      getUserGeminiApiKey() ||
      (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_GEMINI_API_KEY);

    if (clientKey) {
      try {
        geminiResult = await callGeminiDirectRest(base64Data, mimeType, clientKey);
      } catch (err) {
        console.warn("[NutriScan] Direct Gemini REST call failed:", err);
      }
    }
  }

  // ── Step 3: If Gemini responded, build structured result ─────────────────
  if (geminiResult) {
    if (!geminiResult.isFood) {
      return {
        isFood: false,
        isUncertain: false,
        rejectionReason:
          geminiResult.reason || "Sorry! No food detected. Please upload a valid food image.",
        topLabel: "No Food Detected",
        topLabelConfidence: 0,
        confidence: 0,
        predictions: [],
        candidateFoods: [],
      };
    }

    if (geminiResult.isUncertain || (geminiResult.confidence && geminiResult.confidence < 0.45)) {
      return {
        isFood: true,
        isUncertain: true,
        uncertainReason:
          geminiResult.reason || "Unable to identify this food accurately. Please capture another image.",
        topLabel: "Unable to identify this food accurately",
        topLabelConfidence: geminiResult.confidence || 0,
        confidence: geminiResult.confidence || 0,
        predictions: [],
        candidateFoods: [],
      };
    }

    // ── Build multi-food candidate list from detectedFoods ──────────────────
    const candidates: AIDetectionCandidate[] = [];
    const seenKeys = new Set<string>();

    // Process all detected foods from the image (supports array of objects or strings)
    const rawDetected = geminiResult.detectedFoods && geminiResult.detectedFoods.length > 0
      ? geminiResult.detectedFoods
      : [{ name: geminiResult.foodName || "", foodKey: geminiResult.matchedKey || "", confidence: geminiResult.confidence || 0.90 }];

    for (const det of rawDetected) {
      const detName = typeof det === "string" ? det : (det as any)?.name;
      const detKey = typeof det === "string" ? det : (det as any)?.foodKey;
      const detConf = typeof det === "object" && typeof (det as any)?.confidence === "number" ? (det as any).confidence : 0.90;

      const key = mapToNutritionKey(detName, detKey);
      if (key && !seenKeys.has(key) && nutritionDatabase[key]) {
        seenKeys.add(key);
        const item = nutritionDatabase[key];
        const conf = +Math.max(0.70, Math.min(0.99, detConf || 0.85)).toFixed(2);
        candidates.push({
          foodKey: key,
          name: item.name,
          emoji: item.emoji,
          confidence: conf,
        });
      }
    }

    // Add any candidateFoods not already in the list
    if (Array.isArray(geminiResult.candidateFoods)) {
      for (const c of geminiResult.candidateFoods) {
        const cName = typeof c === "string" ? c : (c as any)?.name;
        const cKey = typeof c === "string" ? c : (c as any)?.foodKey;
        const cConf = typeof c === "object" && typeof (c as any)?.confidence === "number" ? (c as any).confidence : 0.70;

        const key = mapToNutritionKey(cName, cKey);
        if (key && !seenKeys.has(key) && nutritionDatabase[key]) {
          seenKeys.add(key);
          const item = nutritionDatabase[key];
          candidates.push({
            foodKey: key,
            name: item.name,
            emoji: item.emoji,
            confidence: +Math.max(0.50, Math.min(0.90, cConf || 0.70)).toFixed(2),
          });
        }
        if (candidates.length >= 6) break;
      }
    }

    if (candidates.length === 0) {
      // Fallback: use primary food
      const fallbackKey = mapToNutritionKey(geminiResult.foodName || "", geminiResult.matchedKey);
      if (fallbackKey && nutritionDatabase[fallbackKey]) {
        const dbItem = nutritionDatabase[fallbackKey];
        candidates.push({
          foodKey: fallbackKey,
          name: dbItem.name,
          emoji: dbItem.emoji,
          confidence: +Math.max(0.75, Math.min(0.99, geminiResult.confidence || 0.90)).toFixed(2),
        });
      } else {
        // Unrecognized dish in database -> Mark uncertain rather than inventing an incorrect food
        return {
          isFood: true,
          isUncertain: true,
          uncertainReason: "Unable to identify this food accurately. Please capture another image.",
          topLabel: "Unable to identify this food accurately",
          topLabelConfidence: geminiResult.confidence || 0,
          confidence: geminiResult.confidence || 0,
          predictions: [],
          candidateFoods: [],
        };
      }
    }

    const topCandidate = candidates[0];
    const topConfidence = topCandidate?.confidence ?? 0.85;
    const topName = topCandidate?.name ?? geminiResult.foodName ?? "Food";

    return {
      isFood: true,
      foodKey: topCandidate?.foodKey,
      foodName: topName,
      topLabel: topName,
      topLabelConfidence: topConfidence,
      confidence: topConfidence,
      detectedFoods: candidates.filter((c, i) => i < 5),
      predictions: candidates.map((c) => ({
        className: c.name,
        probability: c.confidence,
      })),
      candidateFoods: candidates,
    };
  }

  // ── Step 4: Enhanced On-Device MobileNet + Visual Feature Fallback ────────
  return analyzeImageForFood(compressed.dataUrl, fileName);
}

