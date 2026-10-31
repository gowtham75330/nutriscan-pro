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
    // Use gemini-2.0-flash or gemini-1.5-flash
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const prompt = `You are a world-class food nutrition vision specialist for "NutriScan Pro".
Analyze this image with extreme accuracy.

TASK:
1. Determine if this image is a genuine, recognizable food dish, meal, drink, fruit, or vegetable.
   - If the image contains people, selfies, faces, pets/animals, vehicles, electronics, furniture, clothing, documents, or non-food objects, set "isFood": false.
   - If the image is food, set "isFood": true.

2. If isFood is true:
   - Identify the EXACT dish. For example: "Roasted Chicken", "Idli", "Dosa", "Biryani", "Chicken Biryani", "Grilled Chicken", "Pizza", "Burger", "Fish Fry", "Sambar", "Curd Rice", "Chapati", "Pasta", "Noodles", "French Fries", "Salad", "Steak", "Soup", etc.
   - NEVER confuse poultry/roasted chicken with idli, bread, or rice.
   - Pick the best matched key from the following supported database keys:
     ["apple", "banana", "orange", "mango", "grapes", "watermelon", "papaya", "pomegranate", "pineapple", "guava", "coconut", "carrot", "tomato", "potato", "onion", "broccoli", "spinach", "beetroot", "cabbage", "cucumber", "mushroom", "ladies finger", "bitter gourd", "drumstick", "rice", "chapati", "bread", "oats", "corn", "egg", "omelette", "chicken", "roasted chicken", "grilled chicken", "steak", "chicken 65", "fish", "fish fry", "fish curry", "mutton", "prawns", "soya chunks", "paneer", "tofu", "dal", "milk", "curd", "buttermilk", "ghee", "cheese", "dosa", "masala dosa", "idli", "vada", "pongal", "upma", "uttapam", "sambar", "rasam", "puttu", "appam", "kozhukattai", "lemon rice", "curd rice", "kothu parotta", "biryani", "chicken biryani", "parotta", "butter chicken", "paneer butter masala", "palak paneer", "chole", "naan", "rajma", "aloo gobi", "fried rice", "noodles", "pizza", "burger", "samosa", "pasta", "poori", "french fries", "sandwich", "cake", "ice cream", "chocolate", "salad", "soup", "tea", "coffee", "fruit juice", "coconut water", "lassi"]
   - Provide an actual model confidence score between 0.00 and 1.00.
   - Provide up to 3 relevant alternative candidate matches with their respective confidence scores.

OUTPUT FORMAT:
Respond with ONLY valid JSON:
{
  "isFood": boolean,
  "foodName": string | null,
  "matchedKey": string | null,
  "confidence": number,
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

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

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

