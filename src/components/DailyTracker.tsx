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
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: "Calories", val: `${totals.calories}`, emoji: "🔥" },
            { label: "Protein", val: `${totals.protein.toFixed(1)}g`, emoji: "💪" },
            { label: "Carbs", val: `${totals.carbs.toFixed(1)}g`, emoji: "🍞" },
            { label: "Fat", val: `${totals.fat.toFixed(1)}g`, emoji: "🧈" },
          ].map((t) => (
            <div key={t.label} className="p-2 rounded-lg bg-muted/50">
              <span className="text-lg">{t.emoji}</span>
              <p className="font-bold text-foreground text-sm">{t.val}</p>
              <p className="text-muted-foreground text-[10px]">{t.label}</p>
            </div>
          ))}
        </div>
        {totals.calories > 2000 && (
          <p className="text-destructive text-xs mt-2 font-medium">⚠️ You've exceeded 2000 kcal today. Consider lighter meals.</p>
        )}
      </motion.div>

      {/* Entries */}
      <AnimatePresence>
        {entries.map((entry, i) => (
          <motion.div
            key={`${entry.food.name}-${entry.time}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass-card p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{entry.food.emoji}</span>
              <div>
                <p className="font-semibold text-foreground text-sm">{entry.food.name}</p>
                <p className="text-muted-foreground text-xs">{entry.food.calories} kcal · {entry.time}</p>
              </div>
            </div>
            <button onClick={() => onRemove(i)} className="p-2 rounded-full hover:bg-destructive/10 text-destructive transition-colors">
              <Trash2 size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
