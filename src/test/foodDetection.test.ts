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
