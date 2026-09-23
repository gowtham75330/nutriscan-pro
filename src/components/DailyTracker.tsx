import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import type { NutritionInfo } from "@/data/nutritionData";

interface TrackerEntry {
  food: NutritionInfo;
  time: string;
}

interface Props {
  entries: TrackerEntry[];
  onRemove: (index: number) => void;
}

export default function DailyTracker({ entries, onRemove }: Props) {
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.food.calories,
      protein: acc.protein + e.food.protein,
      carbs: acc.carbs + e.food.carbs,
      fat: acc.fat + e.food.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  if (entries.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-3xl mb-2">📅</p>
        <p className="text-muted-foreground text-sm">No meals tracked today. Analyze food and add it here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Totals */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4">
        <h3 className="font-heading font-bold text-foreground mb-3">📊 Today's Totals</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
          {[
            { label: "Calories", val: `${totals.calories}`, emoji: "🔥" },
            { label: "Protein", val: `${totals.protein.toFixed(1)}g`, emoji: "💪" },
            { label: "Carbs", val: `${totals.carbs.toFixed(1)}g`, emoji: "🍞" },
            { label: "Fat", val: `${totals.fat.toFixed(1)}g`, emoji: "🧈" },
          ].map((t) => (
            <div key={t.label} className="p-2.5 sm:p-3 rounded-xl bg-muted/50 border border-border/40">
              <span className="text-xl sm:text-2xl">{t.emoji}</span>
              <p className="font-bold text-foreground text-sm sm:text-base mt-0.5">{t.val}</p>
              <p className="text-muted-foreground text-[10px] sm:text-xs">{t.label}</p>
            </div>
          ))}
        </div>
        {totals.calories > 2000 && (
          <p className="text-destructive text-xs mt-2.5 font-medium text-center">⚠️ You've exceeded 2000 kcal today. Consider lighter meals.</p>
        )}
      </motion.div>

      {/* Entries Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AnimatePresence>
          {entries.map((entry, i) => (
            <motion.div
              key={`${entry.food.name}-${entry.time}-${i}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-3 sm:p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl sm:text-3xl shrink-0">{entry.food.emoji}</span>
                <div>
                  <p className="font-semibold text-foreground text-sm sm:text-base">{entry.food.name}</p>
                  <p className="text-muted-foreground text-xs">{entry.food.calories} kcal · {entry.time}</p>
                </div>
              </div>
              <button
                onClick={() => onRemove(i)}
                className="p-2 rounded-full hover:bg-destructive/10 text-destructive transition-colors shrink-0"
                title="Remove entry"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
