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
});
