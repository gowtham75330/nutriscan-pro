import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ChefHat } from "lucide-react";
import { nutritionDatabase } from "@/data/nutritionData";
import { getServing } from "@/data/servingSizes";
import { scaleNutrition, sumNutrition, healthScore } from "@/lib/nutritionUtils";

interface Ingredient { key: string; grams: number; }

export default function RecipeCalculator() {
  const [items, setItems] = useState<Ingredient[]>([
    { key: "rice", grams: 150 },
    { key: "dal", grams: 80 },
  ]);
  const [pick, setPick] = useState("chicken");
  const [grams, setGrams] = useState(100);

  const totals = useMemo(() => {
    const scaled = items.map(({ key, grams: g }) => {
      const serving = getServing(key);
      // For piece foods we still treat the entered "grams" as weight.
      const factor = g / serving.grams;
      return scaleNutrition(nutritionDatabase[key], factor, key);
    });
    return sumNutrition(scaled);
  }, [items]);

  const score = healthScore(totals);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={items.length > 0 ? "grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start w-full" : "space-y-4 w-full"}
    >
      <div className={`glass-card p-3.5 sm:p-5 space-y-3.5 rounded-2xl w-full ${items.length > 0 ? "lg:col-span-7" : ""}`}>
        <div className="flex items-center gap-2">
          <ChefHat size={20} className="text-secondary" />
          <h3 className="font-heading font-bold text-foreground text-base sm:text-lg">Recipe Nutrition Calculator</h3>
        </div>
        <p className="text-xs text-muted-foreground">Add every ingredient with its weight (in grams) — we'll total the nutrition for the full recipe.</p>

        <div className="flex gap-2">
          <select
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            className="flex-1 min-h-[44px] px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {Object.entries(nutritionDatabase).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.name}</option>
            ))}
          </select>
          <input
            type="number" min={1} value={grams}
            onChange={(e) => setGrams(+e.target.value || 0)}
            className="w-20 min-h-[44px] px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => { if (grams > 0) setItems([...items, { key: pick, grams }]); }}
            className="min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl gradient-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center shadow-md shrink-0"
            aria-label="Add ingredient"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {items.map((it, idx) => {
              const f = nutritionDatabase[it.key];
              return (
                <motion.div
                  key={`${it.key}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2"
                >
                  <span className="text-lg">{f.emoji}</span>
                  <span className="flex-1 text-sm font-medium text-foreground">{f.name}</span>
                  <span className="text-xs text-muted-foreground">{it.grams}g</span>
                  <button
                    onClick={() => setItems(items.filter((_, i) => i !== idx))}
                    className="text-destructive hover:opacity-70 p-1"
                    aria-label="Remove"
                  ><X size={14} /></button>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {items.length === 0 && (
            <p className="text-xs text-center text-muted-foreground py-3">No ingredients yet.</p>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="glass-card p-5 space-y-4 lg:col-span-5 lg:sticky lg:top-24">
          <h4 className="font-heading font-semibold text-foreground text-center">🍲 Recipe Total</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 text-center">
            <Stat label="Calories" value={`${totals.calories}`} unit="kcal" />
            <Stat label="Protein" value={`${totals.protein}`} unit="g" />
            <Stat label="Carbs" value={`${totals.carbs}`} unit="g" />
            <Stat label="Fat" value={`${totals.fat}`} unit="g" />
          </div>
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">Health Score</p>
            <p className="text-3xl font-heading font-bold" style={{ color: score.color }}>{score.score}</p>
            <p className="text-xs font-medium" style={{ color: score.color }}>{score.label}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-background/60 rounded-lg p-2">
      <p className="text-lg font-heading font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label} ({unit})</p>
    </div>
  );
}
