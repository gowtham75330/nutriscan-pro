import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export default function BMICalculator() {
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(65);

  const heightM = height / 100;
  const bmi = heightM > 0 ? +(weight / (heightM * heightM)).toFixed(1) : 0;

  let category = "Underweight", color = "hsl(220 70% 55%)", tip = "Eat more protein and complex carbs.";
  if (bmi >= 18.5 && bmi < 25) { category = "Healthy"; color = "hsl(145 65% 42%)"; tip = "Great! Maintain your balanced diet and exercise."; }
  else if (bmi >= 25 && bmi < 30) { category = "Overweight"; color = "hsl(30 90% 55%)"; tip = "Cut refined carbs, walk daily, add protein."; }
  else if (bmi >= 30) { category = "Obese"; color = "hsl(0 70% 55%)"; tip = "Consult a doctor. Focus on whole foods and movement."; }

  // Position 0–100 on the BMI scale (visual gauge).
  const pos = Math.min(100, Math.max(0, ((bmi - 12) / (40 - 12)) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 sm:p-5 space-y-4 rounded-2xl w-full"
    >
      <div className="flex items-center gap-2">
        <Heart size={20} className="text-primary" />
        <h3 className="font-heading font-bold text-foreground text-base sm:text-lg">BMI Calculator</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">Height (cm)</span>
          <input
            type="number" min={100} max={230} value={height}
            onChange={(e) => setHeight(+e.target.value || 0)}
            className="w-full min-h-[44px] px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">Weight (kg)</span>
          <input
            type="number" min={20} max={250} value={weight}
            onChange={(e) => setWeight(+e.target.value || 0)}
            className="w-full min-h-[44px] px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
      </div>

      <div className="text-center space-y-1">
        <p className="text-5xl font-heading font-bold" style={{ color }}>{bmi || "—"}</p>
        <p className="text-sm font-semibold" style={{ color }}>{category}</p>
      </div>

      <div className="relative h-3 rounded-full overflow-hidden"
        style={{ background: "linear-gradient(90deg, hsl(220 70% 55%), hsl(145 65% 42%), hsl(30 90% 55%), hsl(0 70% 55%))" }}>
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-5 bg-foreground rounded-sm border-2 border-background"
          animate={{ left: `${pos}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Under</span><span>Healthy</span><span>Over</span><span>Obese</span>
      </div>

      <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">💡 {tip}</p>
    </motion.div>
  );
}
