import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { nutritionDatabase } from "@/data/nutritionData";
import { healthScore } from "@/lib/nutritionUtils";

const foodList = Object.entries(nutritionDatabase).map(([k, v]) => ({ key: k, label: `${v.emoji} ${v.name}` }));

export default function FoodComparison() {
  const [a, setA] = useState("apple");
  const [b, setB] = useState("burger");

  const fa = nutritionDatabase[a];
  const fb = nutritionDatabase[b];

  const data = [
    { metric: "Calories", A: fa.calories, B: fb.calories },
    { metric: "Protein", A: fa.protein, B: fb.protein },
    { metric: "Carbs", A: fa.carbs, B: fb.carbs },
    { metric: "Fat", A: fa.fat, B: fb.fat },
    { metric: "Bad Fat", A: fa.badFat, B: fb.badFat },
  ];

  const sa = healthScore(fa);
  const sb = healthScore(fb);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5 sm:space-y-4 w-full">
      <div className="glass-card p-3.5 sm:p-5 rounded-2xl">
        <h3 className="font-heading font-bold text-foreground text-sm sm:text-base mb-2.5 sm:mb-3">⚖️ Compare Two Foods</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FoodPicker label="Food A" value={a} onChange={setA} list={foodList} />
          <FoodPicker label="Food B" value={b} onChange={setB} list={foodList} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <ScoreCard food={fa} score={sa} />
        <ScoreCard food={fb} score={sb} />
      </div>

      <div className="glass-card p-3.5 sm:p-5 rounded-2xl">
        <h4 className="text-sm sm:text-base font-semibold text-foreground mb-3 text-center">📊 Nutrient Comparison</h4>
        <div className="h-60 sm:h-72 md:h-80">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ left: -10 }}>
              <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="A" name={fa.name} fill="hsl(145 65% 42%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="B" name={fb.name} fill="hsl(30 90% 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-3.5 sm:p-4 rounded-2xl border-l-4 border-primary">
        <p className="text-xs sm:text-sm text-foreground">
          🏆 <b>Healthier choice:</b>{" "}
          {sa.score >= sb.score ? `${fa.emoji} ${fa.name}` : `${fb.emoji} ${fb.name}`} — better balance of macros and micronutrients.
        </p>
      </div>
    </motion.div>
  );
}

function FoodPicker({ label, value, onChange, list }: { label: string; value: string; onChange: (v: string) => void; list: { key: string; label: string }[] }) {
  return (
    <label className="space-y-1 block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[44px] px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {list.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
      </select>
    </label>
  );
}

function ScoreCard({ food, score }: { food: { name: string; emoji: string; calories: number }; score: { score: number; label: string; color: string } }) {
  return (
    <div className="glass-card p-4 rounded-2xl text-center">
      <p className="text-2xl">{food.emoji}</p>
      <p className="text-sm font-bold text-foreground truncate mt-0.5">{food.name}</p>
      <p className="text-3xl font-heading font-bold mt-1" style={{ color: score.color }}>{score.score}</p>
      <p className="text-xs font-semibold" style={{ color: score.color }}>{score.label}</p>
      <p className="text-[11px] text-muted-foreground mt-1 font-medium">{food.calories} kcal</p>
    </div>
  );
}
