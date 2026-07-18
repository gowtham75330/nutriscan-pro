import { useState } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, FileDown, Languages } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { NutritionInfo } from "@/data/nutritionData";
import { healthScore } from "@/lib/nutritionUtils";
import { exportNutritionPDF } from "@/lib/pdfExport";
import { nutritionScript, speakText, type Lang } from "@/lib/i18n";

interface Props {
  nutrition: NutritionInfo;
  onAddToTracker: () => void;
}

const nutrientBars: { key: keyof NutritionInfo; label: string; emoji: string; color: string; max: number }[] = [
  { key: "calories", label: "Calories", emoji: "🔥", color: "bg-nutrient-calories", max: 500 },
  { key: "protein", label: "Protein", emoji: "💪", color: "bg-nutrient-protein", max: 30 },
  { key: "carbs", label: "Carbs", emoji: "🍞", color: "bg-nutrient-carbs", max: 60 },
  { key: "fat", label: "Total Fat", emoji: "🧈", color: "bg-nutrient-fat", max: 25 },
  { key: "goodFat", label: "Good Fat", emoji: "✅", color: "bg-nutrient-goodfat", max: 15 },
  { key: "badFat", label: "Bad Fat", emoji: "❌", color: "bg-nutrient-badfat", max: 15 },
];

const PIE_COLORS = ["hsl(210,70%,50%)", "hsl(45,90%,50%)", "hsl(0,70%,55%)"];

export default function NutritionDashboard({ nutrition, onAddToTracker }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const score = healthScore(nutrition);
  const hasExtras = nutrition.fiber !== undefined || nutrition.sugar !== undefined || nutrition.sodium !== undefined;

  const toggleVoice = () => {
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const script = nutritionScript(
      nutrition.name, nutrition.calories, nutrition.protein, nutrition.carbs, nutrition.fat, lang
    );
    const tipScript = lang === "ta"
      ? `ஆரோக்கிய குறிப்பு: ${nutrition.healthTip}`
      : `Health tip: ${nutrition.healthTip}`;
    const utter = speakText(`${script} ${tipScript}`, lang);
    if (utter) {
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      setSpeaking(true);
    }
  };

  const pieData = [
    { name: "Protein", value: nutrition.protein, unit: "g" },
    { name: "Carbs", value: nutrition.carbs, unit: "g" },
    { name: "Fat", value: nutrition.fat, unit: "g" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-5"
    >
      {/* Header with voice */}
      <div className="glass-card p-5 flex items-center justify-between">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-heading font-bold text-2xl text-foreground"
          >
            {nutrition.emoji} {nutrition.name}
          </motion.h2>
          <p className="text-muted-foreground text-sm mt-1">Nutrition Analysis Results</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setLang((l) => (l === "en" ? "ta" : "en"))}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-muted text-foreground text-xs font-semibold"
            title="Toggle language"
          >
            <Languages size={14} /> {lang === "en" ? "EN" : "த"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={toggleVoice}
            className={`p-2.5 rounded-full transition-all ${
              speaking ? "bg-destructive text-destructive-foreground animate-pulse" : "gradient-cool text-accent-foreground hover:opacity-90"
            }`}
            title={speaking ? "Stop voice" : "Listen to nutrition info"}
          >
            {speaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => exportNutritionPDF(nutrition)}
            className="p-2.5 rounded-full bg-secondary text-secondary-foreground hover:opacity-90"
            title="Download PDF report"
          >
            <FileDown size={20} />
          </motion.button>
        </div>
      </div>

      {/* Health Score */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 flex items-center gap-4"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center font-heading font-bold text-2xl shadow-lg"
          style={{ background: `conic-gradient(${score.color} ${score.score * 3.6}deg, hsl(var(--muted)) 0deg)` }}
        >
          <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center" style={{ color: score.color }}>
            {score.score}
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Health Score</p>
          <p className="font-heading font-bold text-xl" style={{ color: score.color }}>{score.label}</p>
          {nutrition.servingLabel && (
            <p className="text-xs text-muted-foreground mt-0.5">Serving: <span className="font-semibold text-foreground">{nutrition.servingLabel}</span></p>
          )}
        </div>
      </motion.div>

      {/* Fiber / Sugar / Sodium — real values only */}
      {hasExtras && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
          {nutrition.fiber !== undefined && (
            <div className="glass-card p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Fiber</p>
              <p className="font-heading font-bold text-lg text-foreground">{nutrition.fiber}<span className="text-xs font-normal text-muted-foreground ml-0.5">g</span></p>
            </div>
          )}
          {nutrition.sugar !== undefined && (
            <div className="glass-card p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Sugar</p>
              <p className="font-heading font-bold text-lg text-foreground">{nutrition.sugar}<span className="text-xs font-normal text-muted-foreground ml-0.5">g</span></p>
            </div>
          )}
          {nutrition.sodium !== undefined && (
            <div className="glass-card p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Sodium</p>
              <p className="font-heading font-bold text-lg text-foreground">{nutrition.sodium}<span className="text-xs font-normal text-muted-foreground ml-0.5">mg</span></p>
            </div>
          )}
        </motion.div>
      )}

      {/* Voice indicator */}
      {speaking && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="glass-card p-3 flex items-center gap-3 border-l-4 border-accent"
        >
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-accent rounded-full"
                animate={{ height: [8, 20, 8] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
          <span className="text-sm text-foreground font-medium">🔊 Speaking nutrition info...</span>
          <button onClick={toggleVoice} className="ml-auto text-xs font-semibold text-destructive">Stop</button>
        </motion.div>
      )}

      {/* Calories highlight */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-5 text-center"
      >
        <motion.p
          className="text-5xl font-heading font-bold text-foreground"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
        >
          {nutrition.calories}
        </motion.p>
        <p className="text-muted-foreground text-sm mt-1">🔥 Calories per serving</p>
      </motion.div>

      {/* Macro Pie Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-4"
      >
        <h4 className="font-heading font-semibold text-foreground mb-2 text-center">📊 Macro Breakdown</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
                animationBegin={300}
                animationDuration={800}
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value}g`, name]}
                contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-1">
          {pieData.map((d, i) => (
            <span key={d.name} className="text-xs font-medium text-foreground flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: PIE_COLORS[i] }} />
              {d.name}: {d.value}g
            </span>
          ))}
        </div>
      </motion.div>

      {/* Nutrient Bars */}
      <div className="glass-card p-5 space-y-4">
        {nutrientBars.map((n, i) => {
          const value = nutrition[n.key] as number;
          const pct = Math.min((value / n.max) * 100, 100);
          return (
            <motion.div
              key={n.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-foreground">{n.emoji} {n.label}</span>
                <span className="font-semibold text-foreground">
                  {value}{n.key === "calories" ? " kcal" : "g"}
                </span>
              </div>
              <div className="nutrient-bar">
                <motion.div
                  className={`nutrient-bar-fill ${n.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Vitamins & Minerals */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }} className="glass-card p-4">
          <h4 className="font-heading font-semibold text-foreground mb-2">🥦 Vitamins</h4>
          <div className="flex flex-wrap gap-1.5">
            {nutrition.vitamins.map((v) => (
              <motion.span
                key={v}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 }}
                className="px-2.5 py-1 rounded-full text-xs font-medium gradient-cool text-accent-foreground"
              >
                {v}
              </motion.span>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 }} className="glass-card p-4">
          <h4 className="font-heading font-semibold text-foreground mb-2">🧂 Minerals</h4>
          <div className="flex flex-wrap gap-1.5">
            {nutrition.minerals.map((m) => (
              <motion.span
                key={m}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
                className="px-2.5 py-1 rounded-full text-xs font-medium gradient-warm text-secondary-foreground"
              >
                {m}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Health Tip */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="glass-card p-4 border-l-4 border-primary">
        <h4 className="font-heading font-semibold text-foreground mb-1">💡 Health Tip</h4>
        <p className="text-muted-foreground text-sm">{nutrition.healthTip}</p>
      </motion.div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddToTracker}
          className="flex-1 py-3 rounded-lg gradient-primary text-primary-foreground font-semibold"
        >
          📅 Add to Tracker
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleVoice}
          className={`px-6 py-3 rounded-lg font-semibold ${
            speaking ? "bg-destructive text-destructive-foreground" : "gradient-cool text-accent-foreground"
          }`}
        >
          {speaking ? "🔇 Stop" : "🔊 Voice"}
        </motion.button>
      </div>
    </motion.div>
  );
}
