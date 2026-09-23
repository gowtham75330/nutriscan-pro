import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, FileDown, Languages } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import type { NutritionInfo } from "@/data/nutritionData";
import { healthScore } from "@/lib/nutritionUtils";
import { exportNutritionPDF } from "@/lib/pdfExport";
import {
  nutritionScript,
  speakText,
  translateFoodName,
  translateHealthLabel,
  translateServing,
  translateHealthTip,
  getAvailableVoices,
  t,
  type Lang,
} from "@/lib/i18n";

interface Props {
  nutrition: NutritionInfo;
  onAddToTracker: () => void;
}

const nutrientBarDefs: {
  key: keyof NutritionInfo;
  enLabel: string;
  taLabel: string;
  emoji: string;
  color: string;
  max: number;
}[] = [
  { key: "calories", enLabel: "Calories", taLabel: "கலோரிகள்", emoji: "🔥", color: "bg-nutrient-calories", max: 500 },
  { key: "protein", enLabel: "Protein", taLabel: "புரதம்", emoji: "💪", color: "bg-nutrient-protein", max: 30 },
  { key: "carbs", enLabel: "Carbs", taLabel: "கார்போஹைட்ரேட்", emoji: "🍞", color: "bg-nutrient-carbs", max: 60 },
  { key: "fat", enLabel: "Total Fat", taLabel: "மொத்த கொழுப்பு", emoji: "🧈", color: "bg-nutrient-fat", max: 25 },
  { key: "goodFat", enLabel: "Good Fat", taLabel: "நல்ல கொழுப்பு", emoji: "✅", color: "bg-nutrient-goodfat", max: 15 },
  { key: "badFat", enLabel: "Bad Fat", taLabel: "கெட்ட கொழுப்பு", emoji: "❌", color: "bg-nutrient-badfat", max: 15 },
];

const PIE_COLORS = ["hsl(210,70%,50%)", "hsl(45,90%,50%)", "hsl(0,70%,55%)"];

export default function NutritionDashboard({ nutrition, onAddToTracker }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const score = healthScore(nutrition);
  const hasExtras =
    nutrition.fiber !== undefined ||
    nutrition.sugar !== undefined ||
    nutrition.sodium !== undefined;

  // Initialize and refresh voices asynchronously
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      getAvailableVoices();
      const handleVoicesChanged = () => {
        getAvailableVoices();
      };
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
      return () => {
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  // When language changes: stop current speech immediately so language and voice always match
  const handleLanguageToggle = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setLang((prev) => (prev === "en" ? "ta" : "en"));
  }, []);

  const toggleVoice = useCallback(() => {
    // If already speaking, clicking speaker immediately stops speech
    if (speaking) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setSpeaking(false);
      return;
    }

    // Prepare speech text strictly for currently selected language
    const script = nutritionScript(
      nutrition.name,
      nutrition.calories,
      nutrition.protein,
      nutrition.carbs,
      nutrition.fat,
      nutrition.healthTip,
      lang
    );

    const res = speakText(script, lang);

    if (!res.success) {
      setSpeaking(false);
      if (res.error === "NO_TAMIL_VOICE") {
        toast.error(
          res.message ||
            "Tamil voice is not available on this device. Please install or enable a Tamil text-to-speech voice in device settings.",
          { duration: 5000 }
        );
      } else {
        toast.error(res.message || "Speech synthesis is not supported on this browser.");
      }
      return;
    }

    if (res.utterance) {
      res.utterance.onend = () => setSpeaking(false);
      res.utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
    }
  }, [speaking, nutrition, lang]);

  const displayedFoodName =
    lang === "ta" ? translateFoodName(nutrition.name) : nutrition.name;

  const displayedHealthTip =
    lang === "ta"
      ? translateHealthTip(nutrition.name, nutrition.healthTip)
      : nutrition.healthTip;

  const displayedScoreLabel = translateHealthLabel(score.label, lang);

  const displayedServingLabel = translateServing(nutrition.servingLabel, lang);

  const pieData = [
    { name: lang === "ta" ? "புரதம்" : "Protein", value: nutrition.protein, unit: "g" },
    { name: lang === "ta" ? "கார்ப்ஸ்" : "Carbs", value: nutrition.carbs, unit: "g" },
    { name: lang === "ta" ? "கொழுப்பு" : "Fat", value: nutrition.fat, unit: "g" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-5"
    >
      {/* Header with language and voice controls */}
      <div className="glass-card p-5 flex items-center justify-between">
        <div>
          <motion.h2
            key={displayedFoodName}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-heading font-bold text-2xl text-foreground"
          >
            {nutrition.emoji} {displayedFoodName}
          </motion.h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t.analysisResults[lang]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Language Toggle: English (EN) <-> Tamil (தமிழ்) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLanguageToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              lang === "ta"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
            title="Switch Language (English / தமிழ்)"
          >
            <Languages size={14} />
            <span>{lang === "en" ? "EN" : "தமிழ்"}</span>
          </motion.button>

          {/* Voice Speaker button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVoice}
            className={`p-2.5 rounded-full transition-all ${
              speaking
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "gradient-cool text-accent-foreground hover:opacity-90"
            }`}
            title={
              speaking
                ? lang === "ta"
                  ? "குரலை நிறுத்து"
                  : "Stop voice"
                : lang === "ta"
                ? "தமிழில் கேளுங்கள்"
                : "Listen in English"
            }
          >
            {speaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 flex items-center gap-4"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center font-heading font-bold text-2xl shadow-lg"
          style={{
            background: `conic-gradient(${score.color} ${score.score * 3.6}deg, hsl(var(--muted)) 0deg)`,
          }}
        >
          <div
            className="w-16 h-16 rounded-full bg-background flex items-center justify-center"
            style={{ color: score.color }}
          >
            {score.score}
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{t.healthScore[lang]}</p>
          <p className="font-heading font-bold text-xl" style={{ color: score.color }}>
            {displayedScoreLabel}
          </p>
          {nutrition.servingLabel && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.serving[lang]}:{" "}
              <span className="font-semibold text-foreground">
                {displayedServingLabel}
              </span>
            </p>
          )}
        </div>
      </motion.div>

      {/* Fiber / Sugar / Sodium */}
      {hasExtras && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          {nutrition.fiber !== undefined && (
            <div className="glass-card p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t.fiber[lang]}
              </p>
              <p className="font-heading font-bold text-lg text-foreground">
                {nutrition.fiber}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">g</span>
              </p>
            </div>
          )}
          {nutrition.sugar !== undefined && (
            <div className="glass-card p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t.sugar[lang]}
              </p>
              <p className="font-heading font-bold text-lg text-foreground">
                {nutrition.sugar}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">g</span>
              </p>
            </div>
          )}
          {nutrition.sodium !== undefined && (
            <div className="glass-card p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t.sodium[lang]}
              </p>
              <p className="font-heading font-bold text-lg text-foreground">
                {nutrition.sodium}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">mg</span>
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Speaking Active Indicator */}
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
          <span className="text-sm text-foreground font-medium">
            🔊 {t.speaking[lang]}
          </span>
          <button
            onClick={toggleVoice}
            className="ml-auto text-xs font-semibold text-destructive hover:underline"
          >
            {t.stop[lang]}
          </button>
        </motion.div>
      )}

      {/* Calories Highlight */}
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
        <p className="text-muted-foreground text-sm mt-1">
          {t.caloriesPerServing[lang]}
        </p>
      </motion.div>

      {/* Macro Breakdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-4"
      >
        <h4 className="font-heading font-semibold text-foreground mb-2 text-center">
          {t.macroBreakdown[lang]}
        </h4>
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
            <span
              key={d.name}
              className="text-xs font-medium text-foreground flex items-center gap-1"
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ background: PIE_COLORS[i] }}
              />
              {d.name}: {d.value}g
            </span>
          ))}
        </div>
      </motion.div>

      {/* Nutrient Bars */}
      <div className="glass-card p-5 space-y-4">
        {nutrientBarDefs.map((n, i) => {
          const value = nutrition[n.key] as number;
          const pct = Math.min((value / n.max) * 100, 100);
          const label = lang === "ta" ? n.taLabel : n.enLabel;
          return (
            <motion.div
              key={n.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-foreground">
                  {n.emoji} {label}
                </span>
                <span className="font-semibold text-foreground">
                  {value}
                  {n.key === "calories" ? " kcal" : "g"}
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
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="glass-card p-4"
        >
          <h4 className="font-heading font-semibold text-foreground mb-2">
            {t.vitamins[lang]}
          </h4>
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
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          className="glass-card p-4"
        >
          <h4 className="font-heading font-semibold text-foreground mb-2">
            {t.minerals[lang]}
          </h4>
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="glass-card p-4 border-l-4 border-primary"
      >
        <h4 className="font-heading font-semibold text-foreground mb-1">
          {t.healthTip[lang]}
        </h4>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {displayedHealthTip}
        </p>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddToTracker}
          className="flex-1 py-3 rounded-lg gradient-primary text-primary-foreground font-semibold"
        >
          {t.addToTracker[lang]}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleVoice}
          className={`px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 ${
            speaking
              ? "bg-destructive text-destructive-foreground animate-pulse"
              : "gradient-cool text-accent-foreground"
          }`}
        >
          {speaking ? (
            <>
              <VolumeX size={18} />
              <span>{t.stop[lang]}</span>
            </>
          ) : (
            <>
              <Volume2 size={18} />
              <span>{t.voice[lang]}</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
