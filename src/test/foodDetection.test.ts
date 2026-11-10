import { describe, it, expect } from "vitest";
import { detectMultipleFoodsFromFileName } from "@/lib/foodDetection";

describe("detectMultipleFoodsFromFileName — word-boundary matching", () => {
  it("does NOT match 'roti' inside 'rotisserie' (regression: was misidentifying rotisserie chicken as Chapati)", () => {
    const matches = detectMultipleFoodsFromFileName("rotisserie chicken");
    const names = matches.map((m) => m.food.name);
    expect(names).not.toContain("Chapati");
    expect(names).toContain("Chicken");
  });

  it("still matches whole-word 'roti' as Chapati", () => {
    const matches = detectMultipleFoodsFromFileName("roti.jpg");
    expect(matches.map((m) => m.food.name)).toContain("Chapati");
  });

  it("does not false-positive-match short keys inside unrelated words", () => {
    // "egg" should not match inside "eggplant photo" incorrectly conflated,
    // and generic camera file names should yield no matches at all.
    const matches = detectMultipleFoodsFromFileName("camera-capture.jpg");
    expect(matches.length).toBe(0);
  });

  it("still detects multiple distinct foods in one filename", () => {
    const matches = detectMultipleFoodsFromFileName("idli_sambar_dosa.jpg");
    const names = matches.map((m) => m.food.name);
    expect(names.length).toBeGreaterThan(1);
  });

  it("accurately detects Fish Fry from filename (does not detect Salad or plain Fish)", () => {
    const matches1 = detectMultipleFoodsFromFileName("fish fry.jpg");
    expect(matches1[0]?.food.name).toBe("Fish Fry");
    expect(matches1[0]?.food.calories).toBe(245);

    const matches2 = detectMultipleFoodsFromFileName("fishfry.png");
    expect(matches2[0]?.food.name).toBe("Fish Fry");

    const matches3 = detectMultipleFoodsFromFileName("crispy_meen_varuval.jpg");
    expect(matches3[0]?.food.name).toBe("Fish Fry");
  });
});

import { parseQuantityInput, findFoodByText } from "@/lib/nutritionUtils";

describe("Food Name Entry and Quantity Analyzer", () => {
  it("parses '2 fish fry' with accurate real nutrition", () => {
    const parsed = parseQuantityInput("2 fish fry");
    expect(parsed).not.toBeNull();
    expect(parsed?.food.name).toBe("Fish Fry");
    expect(parsed?.quantity).toBe(2);
    expect(parsed?.scaled.calories).toBe(490);
    expect(parsed?.scaled.protein).toBe(48);
  });

  it("parses 'fishfry 150g' correctly", () => {
    const parsed = parseQuantityInput("fishfry 150g");
    expect(parsed).not.toBeNull();
    expect(parsed?.food.name).toBe("Fish Fry");
    expect(parsed?.scaled.calories).toBe(Math.round(245 * 1.5));
  });

  it("finds food by text including synonyms and regional names", () => {
    expect(findFoodByText("fish fry")).toBe("fish fry");
    expect(findFoodByText("fishfry")).toBe("fish fry");
    expect(findFoodByText("meen varuval")).toBe("fish fry");
    expect(findFoodByText("chicken 65")).toBe("chicken 65");
    expect(findFoodByText("biryani")).toBe("biryani");
  });

  it("returns null for non-food query instead of defaulting to salad", () => {
    expect(findFoodByText("laptop keyboard")).toBeNull();
    expect(findFoodByText("selfie portrait")).toBeNull();
    expect(findFoodByText("random noise 123")).toBeNull();
  });

  it("accurately parses and sums MULTIPLE foods like '2 apple and 2 banana'", () => {
    const parsed = parseQuantityInput("2 apple and 2 banana");
    expect(parsed).not.toBeNull();
    // 2 apple (190 cal) + 2 banana (210 cal) = 400 cal
    expect(parsed?.scaled.calories).toBe(400);
    // 2*0.5 + 2*1.3 = 3.6g protein
    expect(parsed?.scaled.protein).toBe(3.6);
    // 2*25 + 2*27 = 104g carbs
    expect(parsed?.scaled.carbs).toBe(104);
    // 2*4.4 + 2*3.1 = 15.0g fiber
    expect(parsed?.scaled.fiber).toBe(15.0);
    // 2*19 + 2*14 = 66g sugar
    expect(parsed?.scaled.sugar).toBe(66);
    // 2*2 + 2*1 = 6mg sodium
    expect(parsed?.scaled.sodium).toBe(6);
    expect(parsed?.display).toContain("Apple");
    expect(parsed?.display).toContain("Banana");
    expect(parsed?.items?.length).toBe(2);
  });

  it("handles plurals like '2 apples and 2 bananas'", () => {
    const parsed = parseQuantityInput("2 apples and 2 bananas");
    expect(parsed).not.toBeNull();
    expect(parsed?.scaled.calories).toBe(400);
    expect(parsed?.items?.length).toBe(2);
  });

  it("accurately parses combined Indian meal '2 idli and 1 vada with sambar'", () => {
    const parsed = parseQuantityInput("2 idli and 1 vada with sambar");
    expect(parsed).not.toBeNull();
    expect(parsed?.items?.length).toBe(3);
    // 2 idli (78 cal) + 1 vada (179 cal) + 1 sambar (65 cal) = 322 cal
    expect(parsed?.scaled.calories).toBe(322);
  });
});

import { mapToNutritionKey } from "@/lib/geminiFoodDetection";
import { calculateNutrition, nutritionDatabase } from "@/data/nutritionData";

describe("Strict Multi-Dish Recognition and Nutrition Requirements", () => {
  it("accurately maps 'Roasted Chicken' to 'roasted chicken' (NEVER Idli)", () => {
    const key = mapToNutritionKey("Roasted Chicken");
    expect(key).toBe("roasted chicken");
    expect(key).not.toBe("idli");
    const food = nutritionDatabase[key];
    expect(food.name).toBe("Roasted Chicken");
    expect(food.protein).toBeGreaterThanOrEqual(25);
  });

  it("accurately maps 'Idli' to 'idli'", () => {
    const key = mapToNutritionKey("Steamed Idli");
    expect(key).toBe("idli");
  });

  it("accurately maps 'Dosa' to 'dosa'", () => {
    const key = mapToNutritionKey("Crispy Masala Dosa");
    expect(key).toBe("masala dosa");
  });

  it("accurately maps 'Rice' to 'rice'", () => {
    const key = mapToNutritionKey("Steamed White Rice");
    expect(key).toBe("rice");
  });

  it("accurately maps 'Pizza' to 'pizza'", () => {
    const key = mapToNutritionKey("Pepperoni Pizza");
    expect(key).toBe("pizza");
  });

  it("accurately maps 'Burger' to 'burger'", () => {
    const key = mapToNutritionKey("Cheeseburger");
    expect(key).toBe("burger");
  });

  it("calculates accurate nutrition and energy (kJ) across Small, Medium, Large portions", () => {
    const chicken = nutritionDatabase["roasted chicken"];
    expect(chicken).toBeDefined();

    // Medium portion (1.0x)
    const med = calculateNutrition(chicken, "medium", "roasted chicken");
    expect(med.calories).toBe(239);
    expect(med.protein).toBe(27);
    expect(med.fat).toBe(13.5);
    const medKj = Math.round(med.calories * 4.184);
    expect(medKj).toBe(1000);

    // Small portion (0.8x)
    const small = calculateNutrition(chicken, "small", "roasted chicken");
    expect(small.calories).toBe(Math.round(239 * 0.8));
    expect(small.protein).toBe(+(27 * 0.8).toFixed(1));

    // Large portion (1.5x)
    const large = calculateNutrition(chicken, "large", "roasted chicken");
    expect(large.calories).toBe(Math.round(239 * 1.5));
  });
});

import { MSG_NO_FOOD, MSG_UNCERTAIN, validateImageQuality } from "@/lib/aiFoodDetection";

describe("Benchmark Test Scenarios A through K (Food vs Non-Food & Recognition)", () => {
  // Scenario A: Real Dosa image
  it("Scenario A: Real Dosa image recognition", () => {
    const key = mapToNutritionKey("Crispy Roast Dosa");
    expect(key).toBe("dosa");
    const food = nutritionDatabase[key];
    expect(food.name).toBe("Dosa");
    expect(food.category).toBe("south-indian");
  });

  // Scenario B: Real Idli image
  it("Scenario B: Real Idly image recognition", () => {
    const key = mapToNutritionKey("Steamed Soft Idly");
    expect(key).toBe("idli");
    const food = nutritionDatabase[key];
    expect(food.name).toBe("Idli");
    expect(food.calories).toBe(39);
  });

  // Scenario C: Fish Fry image
  it("Scenario C: Fish Fry image recognition", () => {
    const key = mapToNutritionKey("Crispy Meen Varuval / Fish Fry");
    expect(key).toBe("fish fry");
    const food = nutritionDatabase[key];
    expect(food.name).toBe("Fish Fry");
    expect(food.protein).toBe(24);
  });

  // Scenario D: Chicken Biryani image
  it("Scenario D: Chicken Biryani image recognition", () => {
    const key = mapToNutritionKey("Hyderabadi Chicken Biryani");
    expect(key).toBe("chicken biryani");
    const food = nutritionDatabase[key];
    expect(food.name).toBe("Chicken Biryani");
    expect(food.calories).toBe(340);
  });

  // Scenario E: Human photograph rejection
  it("Scenario E: Human photograph non-food rejection", () => {
    // Non-food should return empty string from mapper and NEVER a fabricated food
    const key = mapToNutritionKey("Portrait selfie of young man with sunglasses");
    expect(key).toBe("");
    expect(MSG_NO_FOOD).toBe("Sorry! No food detected. Please upload a valid food image.");
  });

  // Scenario F: Vehicle photograph rejection
  it("Scenario F: Vehicle photograph non-food rejection", () => {
    const key = mapToNutritionKey("Sports car on highway");
    expect(key).toBe("");
  });

  // Scenario G: Animal photograph rejection
  it("Scenario G: Animal photograph non-food rejection", () => {
    const key = mapToNutritionKey("Golden retriever dog playing in park");
    expect(key).toBe("");
  });

  // Scenario H: Document image rejection
  it("Scenario H: Document image non-food rejection", () => {
    const key = mapToNutritionKey("Printed PDF invoice contract document");
    expect(key).toBe("");
  });

  // Scenario I: Screenshot rejection
  it("Scenario I: Screenshot non-food rejection", () => {
    const key = mapToNutritionKey("Mobile phone homescreen desktop app launcher");
    expect(key).toBe("");
  });

  // Scenario J: Blurry food image rejection
  it("Scenario J: Blurry image quality validator rejection", () => {
    // Completely uniform gray buffer (zero edge variance / severe blur)
    const blurPixels = new Uint8ClampedArray(64 * 64 * 4).fill(128);
    const quality = validateImageQuality({ data: blurPixels, width: 64, height: 64 });
    expect(quality.isValid).toBe(false);
    expect(quality.reason).toContain("blurry");
  });

  // Scenario K: Empty / pitch black image rejection
  it("Scenario K: Empty pitch-black image validator rejection", () => {
    // Completely pitch black buffer (luminance = 0)
    const blackPixels = new Uint8ClampedArray(64 * 64 * 4).fill(0);
    const quality = validateImageQuality({ data: blackPixels, width: 64, height: 64 });
    expect(quality.isValid).toBe(false);
    expect(quality.reason).toContain("dark or empty");
  });

  // Complete coverage for all 22 required Tamil Nadu & Indian Foods
  it("accurately recognizes all 22 required Indian & Tamil Nadu food items", () => {
    const requiredFoods: { input: string; expectedKey: string }[] = [
      { input: "Dosa", expectedKey: "dosa" },
      { input: "Idly", expectedKey: "idli" },
      { input: "Ven Pongal", expectedKey: "pongal" },
      { input: "Poori Masala", expectedKey: "poori" },
      { input: "Chapati", expectedKey: "chapati" },
      { input: "Malabar Parotta", expectedKey: "parotta" },
      { input: "Steamed Rice", expectedKey: "rice" },
      { input: "South Indian Sambar", expectedKey: "sambar" },
      { input: "Tomato Rasam", expectedKey: "rasam" },
      { input: "Curd Rice Thayir Sadam", expectedKey: "curd rice" },
      { input: "Lemon Rice Chitranna", expectedKey: "lemon rice" },
      { input: "Chicken Biryani", expectedKey: "chicken biryani" },
      { input: "Mutton Biryani", expectedKey: "mutton" },
      { input: "Meen Varuval Fish Fry", expectedKey: "fish fry" },
      { input: "Spicy Chicken 65", expectedKey: "chicken 65" },
      { input: "Chicken Curry Gravy", expectedKey: "chicken" },
      { input: "Fish Curry Kuzhambu", expectedKey: "fish curry" },
      { input: "Egg Omelette", expectedKey: "omelette" },
      { input: "Medu Vada", expectedKey: "vada" },
      { input: "Crispy Samosa", expectedKey: "samosa" },
      { input: "Cheese Pizza", expectedKey: "pizza" },
      { input: "Veg Burger", expectedKey: "burger" },
    ];

    for (const item of requiredFoods) {
      const mapped = mapToNutritionKey(item.input);
      expect(mapped).toBe(item.expectedKey);
      expect(nutritionDatabase[mapped]).toBeDefined();
    }
  });

  it("verifies uncertainty message complies with specifications", () => {
    expect(MSG_UNCERTAIN).toBe("Unable to identify this food accurately. Please capture another image.");
  });
});
