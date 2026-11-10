import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  maxDuration: 30,
};

interface RequestBody {
  image?: string;
  mimeType?: string;
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      success: false,
      error: "NO_API_KEY",
      message: "GEMINI_API_KEY is not configured in backend environment variables.",
    });
  }

  try {
    const body: RequestBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    let base64Image = body.image || "";
    let mimeType = body.mimeType || "image/jpeg";

    if (!base64Image) {
      return res.status(400).json({ error: "Missing image in request body." });
    }

    // Strip data URL prefix if present (e.g. data:image/jpeg;base64,...)
    if (base64Image.includes(",")) {
      const parts = base64Image.split(",");
      const mimeMatch = parts[0].match(/:(.*?);/);
      if (mimeMatch) mimeType = mimeMatch[1];
      base64Image = parts[1];
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = [
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
- Only reject if the image is 100% pitch black or completely blank with zero visible content. Do NOT reject steamed white foods like Idli!
- If image is completely unusable:
  Set "isFood": true
  Set "isUncertain": true
  Set "reason": "Unable to identify this food accurately. Please capture another image."

STAGE 3: ACCURATE MULTI-FOOD IDENTIFICATION
- If the image contains food, identify the dish or all distinct items on the plate/tray.
- Read any visible titles, recipe names, or caption text displayed on screens or packaging (e.g. "Curd Rice", "Crispy Masala Dosa", "Chicken") to ensure exact identification.
- South Indian & Indian cuisine specifics:
  * Steamed white circular/round cakes are Idli (இட்லி) — usually served with sambar or chutney. NEVER reject Idli!
  * White rice mixed with yogurt/curd, tempered with mustard seeds, curry leaves, and dried chillies / pomegranate is Curd Rice (Thayir Sadam) — NOT fish fry!
  * Rolled or flat crispy golden crepe served with sambar and chutney is Dosa / Masala Dosa.
  * Whole or cut roast/grilled chicken is Roasted Chicken / Chicken.
  * Fish fry is a piece of fish with spicy red coating — NEVER creamy white rice or idli!
  * Pongal is soft savory rice and yellow moong dal cooked with cumin, pepper, and cashews.
  * Vada / Medu Vada is a golden doughnut-shaped fried lentil fritter.
  * Poori is puffy deep-fried whole wheat bread.
  * Chapati / Roti is flat unleavened wheat bread.
  * Parotta is layered flaky South Indian flatbread.
  * Chicken Biryani is aromatic spiced basmati rice with chicken pieces.
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

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    let responseText = "";
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        });
        const result = await model.generateContent([prompt, imagePart]);
        responseText = result.response.text();
        if (responseText) break;
      } catch (modelErr: any) {
        lastError = modelErr;
        console.warn(`[Gemini API] Model ${modelName} error:`, modelErr?.message);
      }
    }

    if (!responseText) {
      throw lastError || new Error("All Gemini vision models failed to respond.");
    }

    let clean = responseText.trim();
    if (clean.startsWith("```json")) {
      clean = clean.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    } else if (clean.startsWith("```")) {
      clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      clean = clean.substring(start, end + 1);
    }
    const parsed = JSON.parse(clean);

    return res.status(200).json({
      success: true,
      data: parsed,
    });
  } catch (err: any) {
    console.error("[NutriScan Gemini API Error]:", err);
    return res.status(500).json({
      success: false,
      error: "ANALYSIS_FAILED",
      message: err?.message || "Failed to analyze image with Gemini Vision.",
    });
  }
}

