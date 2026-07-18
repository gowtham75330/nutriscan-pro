// Curated fiber (g), sugar (g), sodium (mg) per current serving in nutritionDatabase.
// Sources: USDA FoodData Central + IFCT 2017 (Indian Food Composition Tables).
// Only foods with reliable reference data are included — others are intentionally
// left undefined so the UI shows nothing rather than fabricated numbers.

export interface ExtraNutrients {
  fiber: number;   // grams
  sugar: number;   // grams
  sodium: number;  // milligrams
}

export const nutritionExtras: Record<string, ExtraNutrients> = {
  // Fruits (per serving as defined in nutritionDatabase)
  apple: { fiber: 4.4, sugar: 19, sodium: 2 },
  banana: { fiber: 3.1, sugar: 14, sodium: 1 },
  orange: { fiber: 3.1, sugar: 12, sodium: 0 },
  mango: { fiber: 2.6, sugar: 23, sodium: 2 },
  grapes: { fiber: 0.9, sugar: 16, sodium: 2 },
  watermelon: { fiber: 0.6, sugar: 9.4, sodium: 2 },
  papaya: { fiber: 2.5, sugar: 11, sodium: 13 },
  pomegranate: { fiber: 4, sugar: 14, sodium: 3 },
  pineapple: { fiber: 2.3, sugar: 16, sodium: 2 },
  guava: { fiber: 5.4, sugar: 8.9, sodium: 2 },
  coconut: { fiber: 9, sugar: 6.2, sodium: 20 },

  // Vegetables
  carrot: { fiber: 2.8, sugar: 4.7, sodium: 69 },
  tomato: { fiber: 1.2, sugar: 2.6, sodium: 5 },
  potato: { fiber: 2.2, sugar: 1.7, sodium: 17 },
  onion: { fiber: 1.7, sugar: 4.2, sodium: 4 },
  broccoli: { fiber: 5.1, sugar: 2.6, sodium: 64 },
  spinach: { fiber: 2.2, sugar: 0.4, sodium: 79 },
  beetroot: { fiber: 2.8, sugar: 6.8, sodium: 78 },
  cabbage: { fiber: 2.5, sugar: 3.2, sodium: 18 },
  cucumber: { fiber: 0.5, sugar: 1.7, sodium: 2 },
  mushroom: { fiber: 1, sugar: 2, sodium: 5 },
  "ladies finger": { fiber: 3.2, sugar: 1.5, sodium: 7 },
  "bitter gourd": { fiber: 2.8, sugar: 0, sodium: 5 },
  drumstick: { fiber: 3.2, sugar: 1.6, sodium: 42 },

  // Grains
  rice: { fiber: 0.4, sugar: 0.1, sodium: 1 },
  chapati: { fiber: 2.7, sugar: 0.4, sodium: 190 },
  bread: { fiber: 1.1, sugar: 1.4, sodium: 152 },
  oats: { fiber: 4, sugar: 0.6, sodium: 2 },
  corn: { fiber: 2.4, sugar: 4.5, sodium: 15 },

  // Protein
  egg: { fiber: 0, sugar: 0.6, sodium: 62 },
  chicken: { fiber: 0, sugar: 0, sodium: 82 },
  fish: { fiber: 0, sugar: 0, sodium: 59 },
  mutton: { fiber: 0, sugar: 0, sodium: 72 },
  prawns: { fiber: 0, sugar: 0, sodium: 111 },
  "soya chunks": { fiber: 13, sugar: 7.3, sodium: 2 },
  paneer: { fiber: 0, sugar: 1.2, sodium: 18 },
  tofu: { fiber: 0.3, sugar: 0.7, sodium: 7 },
  dal: { fiber: 7.9, sugar: 1.8, sodium: 238 },

  // Dairy
  milk: { fiber: 0, sugar: 12, sodium: 105 },
  curd: { fiber: 0, sugar: 3.2, sodium: 36 },
  buttermilk: { fiber: 0, sugar: 4.8, sodium: 105 },
  ghee: { fiber: 0, sugar: 0, sodium: 0 },
  cheese: { fiber: 0, sugar: 0.1, sodium: 174 },

  // South Indian
  dosa: { fiber: 1.2, sugar: 0.5, sodium: 240 },
  idli: { fiber: 0.4, sugar: 0.1, sodium: 110 },
  vada: { fiber: 1.6, sugar: 0.3, sodium: 220 },
  pongal: { fiber: 1.4, sugar: 0.4, sodium: 320 },
  upma: { fiber: 1.8, sugar: 0.7, sodium: 350 },
  uttapam: { fiber: 1.5, sugar: 0.6, sodium: 280 },
  sambar: { fiber: 2.6, sugar: 1.4, sodium: 410 },
  rasam: { fiber: 0.8, sugar: 0.5, sodium: 380 },
  puttu: { fiber: 1.5, sugar: 1.2, sodium: 95 },
  appam: { fiber: 0.6, sugar: 0.8, sodium: 130 },
  kozhukattai: { fiber: 1, sugar: 4, sodium: 60 },
  "lemon rice": { fiber: 0.9, sugar: 0.4, sodium: 320 },
  "curd rice": { fiber: 0.6, sugar: 2.5, sodium: 240 },

  // North Indian
  biryani: { fiber: 2.5, sugar: 2, sodium: 620 },
  parotta: { fiber: 1.8, sugar: 1, sodium: 380 },
  "butter chicken": { fiber: 1.2, sugar: 4.8, sodium: 560 },
  "palak paneer": { fiber: 2.8, sugar: 2.5, sodium: 450 },
  chole: { fiber: 6.2, sugar: 3.4, sodium: 480 },
  naan: { fiber: 2, sugar: 3.6, sodium: 380 },
  rajma: { fiber: 7.4, sugar: 2.1, sodium: 420 },
  "aloo gobi": { fiber: 3.1, sugar: 3.2, sodium: 290 },

  // Snacks
  pizza: { fiber: 2.3, sugar: 3.6, sodium: 640 },
  burger: { fiber: 1.6, sugar: 6, sodium: 497 },
  samosa: { fiber: 2.4, sugar: 1.8, sodium: 420 },
  pasta: { fiber: 2.5, sugar: 1.5, sodium: 230 },
  poori: { fiber: 1.4, sugar: 0.3, sodium: 180 },
  "french fries": { fiber: 3.8, sugar: 0.3, sodium: 210 },
  sandwich: { fiber: 2.4, sugar: 3.5, sodium: 480 },
  cake: { fiber: 0.9, sugar: 35, sodium: 320 },
  "ice cream": { fiber: 0.7, sugar: 21, sodium: 80 },
  chocolate: { fiber: 7, sugar: 48, sodium: 24 },
  salad: { fiber: 2.6, sugar: 3.1, sodium: 145 },

  // Drinks
  tea: { fiber: 0, sugar: 8, sodium: 8 },
  coffee: { fiber: 0, sugar: 8, sodium: 12 },
  "fruit juice": { fiber: 0.5, sugar: 24, sodium: 10 },
  "coconut water": { fiber: 2.6, sugar: 6.3, sodium: 252 },
  lassi: { fiber: 0, sugar: 18, sodium: 95 },
};

export function getExtras(foodKey: string): ExtraNutrients | null {
  return nutritionExtras[foodKey] ?? null;
}
