// Reference serving sizes for each food in the nutrition database.
// Existing NutritionInfo values are stored "per serving" — this map records
// how many grams that serving is, and whether it's normally counted as
// pieces (idli, egg, chapati) so the text-quantity parser can scale correctly.

export interface ServingMeta {
  grams: number;          // weight of one default serving
  unit: "g" | "ml" | "piece";
  pieceLabel?: string;    // e.g. "idli", "egg"
}

const DEFAULT: ServingMeta = { grams: 100, unit: "g" };

export const servingSizes: Record<string, ServingMeta> = {
  // pieces
  apple: { grams: 180, unit: "piece", pieceLabel: "apple" },
  banana: { grams: 120, unit: "piece", pieceLabel: "banana" },
  orange: { grams: 130, unit: "piece", pieceLabel: "orange" },
  mango: { grams: 200, unit: "piece", pieceLabel: "mango" },
  guava: { grams: 120, unit: "piece", pieceLabel: "guava" },
  egg: { grams: 50, unit: "piece", pieceLabel: "egg" },
  idli: { grams: 35, unit: "piece", pieceLabel: "idli" },
  dosa: { grams: 80, unit: "piece", pieceLabel: "dosa" },
  vada: { grams: 50, unit: "piece", pieceLabel: "vada" },
  chapati: { grams: 40, unit: "piece", pieceLabel: "chapati" },
  parotta: { grams: 80, unit: "piece", pieceLabel: "parotta" },
  naan: { grams: 90, unit: "piece", pieceLabel: "naan" },
  poori: { grams: 40, unit: "piece", pieceLabel: "poori" },
  uttapam: { grams: 100, unit: "piece", pieceLabel: "uttapam" },
  appam: { grams: 60, unit: "piece", pieceLabel: "appam" },
  kozhukattai: { grams: 40, unit: "piece", pieceLabel: "kozhukattai" },
  samosa: { grams: 90, unit: "piece", pieceLabel: "samosa" },
  burger: { grams: 220, unit: "piece", pieceLabel: "burger" },
  pizza: { grams: 110, unit: "piece", pieceLabel: "slice" },
  sandwich: { grams: 130, unit: "piece", pieceLabel: "sandwich" },
  bread: { grams: 30, unit: "piece", pieceLabel: "slice" },

  // ml
  milk: { grams: 240, unit: "ml" },
  buttermilk: { grams: 240, unit: "ml" },
  tea: { grams: 150, unit: "ml" },
  coffee: { grams: 150, unit: "ml" },
  "fruit juice": { grams: 240, unit: "ml" },
  "coconut water": { grams: 240, unit: "ml" },
  lassi: { grams: 240, unit: "ml" },

  // grams (defaults to 100g)
  rice: { grams: 100, unit: "g" },
  biryani: { grams: 150, unit: "g" },
  chicken: { grams: 100, unit: "g" },
  fish: { grams: 100, unit: "g" },
  mutton: { grams: 100, unit: "g" },
  prawns: { grams: 100, unit: "g" },
  paneer: { grams: 100, unit: "g" },
  tofu: { grams: 100, unit: "g" },
};

export function getServing(foodKey: string): ServingMeta {
  return servingSizes[foodKey] ?? DEFAULT;
}
