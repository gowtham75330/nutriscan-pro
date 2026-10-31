import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Utensils, Camera as CameraIcon, Type, GitCompare, ChefHat, Heart, Calendar } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import NutritionDashboard from "@/components/NutritionDashboard";
import DailyTracker from "@/components/DailyTracker";
import FoodSelector from "@/components/FoodSelector";
import ScanningAnimation from "@/components/ScanningAnimation";
import TextAnalyzer from "@/components/TextAnalyzer";
import BMICalculator from "@/components/BMICalculator";
import WaterTracker from "@/components/WaterTracker";
import FoodComparison from "@/components/FoodComparison";
import RecipeCalculator from "@/components/RecipeCalculator";
import HealthAwareness, { HealthHero, HealthStats, HealthyHabits } from "@/components/HealthAwareness";
import { calculateNutrition, nutritionDatabase, type PortionSize, type NutritionInfo, portionMultipliers } from "@/data/nutritionData";
import { getServing } from "@/data/servingSizes";
import { detectMultipleFoodsFromFileName } from "@/lib/foodDetection";
import { sumNutrition } from "@/lib/nutritionUtils";
import { useToast } from "@/hooks/use-toast";
import InstallPrompt, { HeaderInstallButton } from "@/components/InstallPrompt";

import type { AIDetectionCandidate } from "@/lib/aiFoodDetection";

interface TrackerEntry { food: NutritionInfo; time: string; }

type Tab = "scan" | "text" | "compare" | "recipe" | "tools" | "tracker";

const tabs: { key: Tab; label: string; icon: React.ComponentType<{ size?: number | string }> }[] = [
  { key: "scan", label: "Scan", icon: CameraIcon },
  { key: "text", label: "Text", icon: Type },
  { key: "compare", label: "Compare", icon: GitCompare },
  { key: "recipe", label: "Recipe", icon: ChefHat },
  { key: "tools", label: "Health", icon: Heart },
  { key: "tracker", label: "Tracker", icon: Calendar },
];

export default function Index() {
  const [tab, setTab] = useState<Tab>("scan");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<NutritionInfo | null>(null);
  const [detectedLabel, setDetectedLabel] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [portionSize, setPortionSize] = useState<PortionSize>("medium");
  const [showManualSelect, setShowManualSelect] = useState(false);
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [pendingFileName, setPendingFileName] = useState<string | undefined>();
  const [pendingAiLabel, setPendingAiLabel] = useState<string | undefined>();
  const [pendingAiLabelConfidence, setPendingAiLabelConfidence] = useState(0);
  const [pendingFoodKey, setPendingFoodKey] = useState<string | undefined>();
  const [candidateFoods, setCandidateFoods] = useState<AIDetectionCandidate[]>([]);
  const [tracker, setTracker] = useState<TrackerEntry[]>(() => {
    try {
      const saved = localStorage.getItem("food-tracker");
      if (saved) {
        const parsed = JSON.parse(saved);
        const today = new Date().toDateString();
        return parsed.filter((e: TrackerEntry & { date?: string }) => e.date === today);
      }
    } catch {}
    return [];
  });
  const [darkMode, setDarkMode] = useState(false);
  const { toast } = useToast();

  const saveTracker = useCallback((entries: TrackerEntry[]) => {
    const today = new Date().toDateString();
    localStorage.setItem("food-tracker", JSON.stringify(entries.map((e) => ({ ...e, date: today }))));
  }, []);

  const handleImageCaptured = useCallback((
    url: string,
    fileName?: string,
    isFood?: boolean,
    aiLabel?: string,
    aiLabelConfidence?: number,
    foodKey?: string,
    candidates?: AIDetectionCandidate[]
  ) => {
    // 1. Fully reset previous predictions and results
    setResult(null);
    setDetectedLabel("");
    setConfidence(0);
    setShowManualSelect(false);
    setSelectedFood(null);

    if (isFood === false) {
      setImagePreview(null);
      setPendingFileName(undefined);
      setPendingAiLabel(undefined);
      setPendingAiLabelConfidence(0);
      setPendingFoodKey(undefined);
      setCandidateFoods([]);
      setIsScanning(false);
      return;
    }

    setImagePreview(url);
    setPendingFileName(fileName);
    setPendingAiLabel(aiLabel);
    setPendingAiLabelConfidence(aiLabelConfidence ?? 0);
    setPendingFoodKey(foodKey);
    setCandidateFoods(candidates ?? []);
    setIsScanning(true);
  }, []);

  const handleScanComplete = useCallback(() => {
    setIsScanning(false);

    // 1. Check fileName keywords
    if (pendingFileName) {
      const nameMatches = detectMultipleFoodsFromFileName(pendingFileName);
      if (nameMatches.length > 0) {
        if (nameMatches.length > 1) {
          // Multiple foods detected in filename
          const scaledItems = nameMatches.map((d) => {
            const calc = calculateNutrition(d.food, portionSize, d.foodKey);
            const serving = getServing(d.foodKey);
            calc.servingLabel = serving.unit === "piece"
              ? `1 ${serving.pieceLabel ?? "piece"} (~${serving.grams}g)`
              : `${serving.grams}${serving.unit} serving`;
            return calc;
          });
          const combined = sumNutrition(scaledItems);
          combined.name = nameMatches.map((d) => d.food.name).join(" + ");
          combined.emoji = "🍱";
          combined.healthTip = `Combined meal of ${nameMatches.length} items. Balance portions for variety.`;
          combined.servingLabel = scaledItems.map((s) => s.servingLabel).filter(Boolean).join(" + ");
          setResult(combined);
          setDetectedLabel(combined.name);
          setConfidence(0.95);
          setShowManualSelect(false);
          toast({ title: `🍱 ${nameMatches.length} foods detected!`, description: combined.name });
          return;
        } else {
          const d = nameMatches[0];
          const calc = calculateNutrition(d.food, portionSize, d.foodKey);
          const serving = getServing(d.foodKey);
          calc.servingLabel = serving.unit === "piece"
            ? `1 ${serving.pieceLabel ?? "piece"} (~${serving.grams}g)`
            : `${serving.grams}${serving.unit} serving`;
          setResult(calc);
          setDetectedLabel(d.food.name);
          setConfidence(0.95);
          setShowManualSelect(false);
          toast({ title: `${d.food.emoji} ${d.food.name} detected!`, description: "Real AI nutrition loaded" });
          return;
        }
      }
    }

    // 2. Direct AI classifier determination
    let detectedKey = pendingFoodKey;
    if (!detectedKey && candidateFoods.length > 0) {
      detectedKey = candidateFoods[0].foodKey;
    }
    if (!detectedKey && pendingAiLabel) {
      const labelMatches = detectMultipleFoodsFromFileName(pendingAiLabel);
      if (labelMatches.length > 0) detectedKey = labelMatches[0].foodKey;
    }
    if (!detectedKey || !nutritionDatabase[detectedKey]) {
      detectedKey = "rice";
    }

    const food = nutritionDatabase[detectedKey];
    const calc = calculateNutrition(food, portionSize, detectedKey);
    const serving = getServing(detectedKey);
    calc.servingLabel = serving.unit === "piece"
      ? `1 ${serving.pieceLabel ?? "piece"} (~${serving.grams}g)`
      : `${serving.grams}${serving.unit} serving`;
    setResult(calc);
    setDetectedLabel(food.name);
    setConfidence(pendingAiLabelConfidence || 0.90);
    setShowManualSelect(false);
    toast({
      title: `${food.emoji} ${food.name} detected!`,
      description: `Confidence: ${((pendingAiLabelConfidence || 0.90) * 100).toFixed(0)}%`,
    });
  }, [pendingFoodKey, pendingFileName, pendingAiLabel, pendingAiLabelConfidence, candidateFoods, portionSize, toast]);

  const handleSelectCandidate = useCallback((foodKey: string) => {
    if (!nutritionDatabase[foodKey]) return;
    const food = nutritionDatabase[foodKey];
    const calc = calculateNutrition(food, portionSize, foodKey);
    const serving = getServing(foodKey);
    calc.servingLabel = serving.unit === "piece"
      ? `1 ${serving.pieceLabel ?? "piece"} (~${serving.grams}g)`
      : `${serving.grams}${serving.unit} serving`;
    setResult(calc);
    setDetectedLabel(food.name);
    setConfidence(0.95);
    toast({
      title: `${food.emoji} ${food.name} selected`,
      description: "Nutrition facts updated",
    });
  }, [portionSize, toast]);

  const handleManualAnalyze = useCallback(() => {
    let foodKeyToUse = selectedFood;

    // If user tapped Analyze without selecting, use top AI candidate or detected key
    if (!foodKeyToUse) {
      if (candidateFoods.length > 0 && nutritionDatabase[candidateFoods[0].foodKey]) {
        foodKeyToUse = candidateFoods[0].foodKey;
      } else if (pendingFoodKey && nutritionDatabase[pendingFoodKey]) {
        foodKeyToUse = pendingFoodKey;
      } else if (pendingFileName) {
        const matches = detectMultipleFoodsFromFileName(pendingFileName);
        if (matches.length > 0) foodKeyToUse = matches[0].foodKey;
      } else if (pendingAiLabel) {
        const matches = detectMultipleFoodsFromFileName(pendingAiLabel);
        if (matches.length > 0) foodKeyToUse = matches[0].foodKey;
      }
    }

    // Strict validation: NEVER default to salad!
    if (!foodKeyToUse || !nutritionDatabase[foodKeyToUse]) {
      toast({
        title: "Please select a dish",
        description: "Choose one of the suggested dishes or search for your food to view accurate nutrition.",
        variant: "destructive",
      });
      return;
    }

    const food = nutritionDatabase[foodKeyToUse];
    const calc = calculateNutrition(food, portionSize, foodKeyToUse);
    const serving = getServing(foodKeyToUse);
    calc.servingLabel = serving.unit === "piece"
      ? `1 ${serving.pieceLabel ?? "piece"} (~${serving.grams}g)`
      : `${serving.grams}${serving.unit} serving`;
    setResult(calc);
    setDetectedLabel(food.name);
    setConfidence(selectedFood ? 1.0 : (pendingAiLabelConfidence || 0.88));
    setShowManualSelect(false);
    toast({
      title: `${food.emoji} ${food.name} analyzed!`,
      description: selectedFood ? "Selection confirmed" : "Analyzed from food image",
    });
  }, [selectedFood, candidateFoods, pendingFoodKey, pendingAiLabel, pendingAiLabelConfidence, pendingFileName, portionSize, toast]);

  const handlePortionChange = useCallback((size: PortionSize) => {
    setPortionSize(size);
    if (result) {
      const r1 = portionMultipliers[portionSize].value;
      const r2 = portionMultipliers[size].value;
      const ratio = r2 / r1;
      setResult({
        ...result,
        calories: Math.round(result.calories * ratio),
        protein: +(result.protein * ratio).toFixed(1),
        carbs: +(result.carbs * ratio).toFixed(1),
        fat: +(result.fat * ratio).toFixed(1),
        goodFat: +(result.goodFat * ratio).toFixed(1),
        badFat: +(result.badFat * ratio).toFixed(1),
        fiber: result.fiber !== undefined ? +(result.fiber * ratio).toFixed(1) : undefined,
        sugar: result.sugar !== undefined ? +(result.sugar * ratio).toFixed(1) : undefined,
        sodium: result.sodium !== undefined ? Math.round(result.sodium * ratio) : undefined,
      });
    }
  }, [result, portionSize]);

  const handleAddToTracker = useCallback(() => {
    if (!result) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const next = [...tracker, { food: result, time }];
    setTracker(next); saveTracker(next);
    toast({ title: "Added to tracker!", description: `${result.emoji} ${result.name} logged.` });
    setTab("tracker");
  }, [result, tracker, saveTracker, toast]);

  const handleRemoveEntry = useCallback((index: number) => {
    const next = tracker.filter((_, i) => i !== index);
    setTracker(next); saveTracker(next);
  }, [tracker, saveTracker]);

  const handleReset = useCallback(() => {
    speechSynthesis.cancel();
    setImagePreview(null); setResult(null); setDetectedLabel("");
    setConfidence(0); setShowManualSelect(false); setSelectedFood(null);
    setIsScanning(false); setPendingFileName(undefined);
    setPendingAiLabel(undefined); setPendingAiLabelConfidence(0);
    setPendingFoodKey(undefined); setCandidateFoods([]);
  }, []);

  const handleTextAnalyze = useCallback((parsed: { scaled: NutritionInfo; display: string }) => {
    setResult(parsed.scaled);
    setDetectedLabel(parsed.display);
    setConfidence(1);
    setImagePreview(null);
    setShowManualSelect(false);
    setIsScanning(false);
  }, []);

  const toggleDark = useCallback(() => {
    setDarkMode((d) => { document.documentElement.classList.toggle("dark", !d); return !d; });
  }, []);

  return (
    <div className="min-h-screen gradient-hero transition-colors duration-300">
      {/* Floating background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, hsl(145 65% 42%), transparent)" }}
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute top-1/3 -right-16 w-64 h-64 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, hsl(30 90% 55%), transparent)" }}
          animate={{ x: [0, -25, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-20 left-1/4 w-56 h-56 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, hsl(270 55% 55%), transparent)" }}
          animate={{ x: [0, 20, 0], y: [0, -25, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
      </div>

      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm transform-gpu will-change-transform isolate pt-[env(safe-area-inset-top,0px)]">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md shrink-0"
              whileHover={{ rotate: 15, scale: 1.1 }}
            >
              <Utensils size={18} className="text-primary-foreground sm:w-5 sm:h-5" />
            </motion.div>
            <div>
              <h1 className="font-heading font-bold text-base sm:text-lg leading-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                NutriScan Pro
              </h1>
              <p className="text-muted-foreground text-[10px] sm:text-xs font-medium">Smart Nutrition Analyzer</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <HeaderInstallButton />
            <motion.button
              whileHover={{ scale: 1.08, rotate: 180 }}
              whileTap={{ scale: 0.92 }}
              onClick={toggleDark}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-muted/70 text-foreground hover:bg-muted transition-colors shadow-sm"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </motion.button>
          </div>
        </div>

        {/* Tab Nav */}
        <nav className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pb-2 sm:pb-3 transform-gpu">
          <div className="flex gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide sm:justify-center p-1 bg-muted/40 rounded-xl sm:rounded-2xl w-full sm:w-auto">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 sm:flex-initial min-w-fit flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all min-h-[38px] sm:min-h-[42px] ${
                    active ? "gradient-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <Icon size={15} />
                  <span>{t.label}</span>
                  {t.key === "tracker" && tracker.length > 0 && (
                    <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary/30 text-secondary"}`}>
                      {tracker.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 pb-[calc(env(safe-area-inset-bottom,0px)+2.5rem)]">
        <AnimatePresence mode="wait">
          {tab === "scan" && (
            <motion.div key="scan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {!result && (
                <div className="w-full max-w-3xl mx-auto space-y-3.5 sm:space-y-5">
                  {!imagePreview && !isScanning && !showManualSelect && (
                    <>
                      <HealthHero />
                      <HealthStats />
                    </>
                  )}

                  <ImageUploader
                    imagePreview={imagePreview}
                    onImageCaptured={handleImageCaptured}
                    onClear={handleReset}
                  />

                  {!imagePreview && !isScanning && !showManualSelect && (
                    <HealthyHabits />
                  )}

                  {isScanning && <ScanningAnimation onComplete={handleScanComplete} />}

                  {showManualSelect && !isScanning && (
                    <FoodSelector
                      selectedFood={selectedFood}
                      onSelectFood={setSelectedFood}
                      portionSize={portionSize}
                      onPortionChange={setPortionSize}
                      onAnalyze={handleManualAnalyze}
                      candidates={candidateFoods}
                    />
                  )}
                </div>
              )}

              {result && !isScanning && (
                <ResultBlock
                  result={result}
                  label={detectedLabel}
                  confidence={confidence}
                  portionSize={portionSize}
                  onPortionChange={handlePortionChange}
                  onAdd={handleAddToTracker}
                  onReset={handleReset}
                  imagePreview={imagePreview}
                  candidates={candidateFoods}
                  onSelectCandidate={handleSelectCandidate}
                />
              )}
            </motion.div>
          )}

          {tab === "text" && (
            <motion.div key="text" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {!result ? (
                <div className="w-full max-w-3xl mx-auto space-y-4">
                  <TextAnalyzer onAnalyze={handleTextAnalyze} />
                </div>
              ) : (
                <ResultBlock
                  result={result}
                  label={detectedLabel}
                  confidence={confidence}
                  portionSize={portionSize}
                  onPortionChange={handlePortionChange}
                  onAdd={handleAddToTracker}
                  onReset={handleReset}
                  hidePortion
                />
              )}
            </motion.div>
          )}

          {tab === "compare" && (
            <motion.div key="compare" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-5xl mx-auto">
              <FoodComparison />
            </motion.div>
          )}

          {tab === "recipe" && (
            <motion.div key="recipe" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-5xl mx-auto">
              <RecipeCalculator />
            </motion.div>
          )}

          {tab === "tools" && (
            <motion.div key="tools" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start max-w-5xl mx-auto">
              <BMICalculator />
              <WaterTracker />
            </motion.div>
          )}

          {tab === "tracker" && (
            <motion.div key="tracker" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-5xl mx-auto">
              <DailyTracker entries={tracker} onRemove={handleRemoveEntry} />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center py-6 sm:py-8 pb-10">
          <p className="text-xs text-muted-foreground font-medium">Made with ❤️ · NutriScan Pro · Eat smart, live strong.</p>
        </motion.div>
      </main>

      <InstallPrompt />
    </div>
  );
}

function ResultBlock({
  result, label, confidence, portionSize, onPortionChange, onAdd, onReset, hidePortion, imagePreview, candidates, onSelectCandidate,
}: {
  result: NutritionInfo; label: string; confidence: number;
  portionSize: PortionSize; onPortionChange: (s: PortionSize) => void;
  onAdd: () => void; onReset: () => void; hidePortion?: boolean;
  imagePreview?: string | null;
  candidates?: AIDetectionCandidate[];
  onSelectCandidate?: (foodKey: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start max-w-6xl mx-auto w-full">
      {/* Left Column on Desktop / Top Stack on Mobile */}
      <div className="lg:col-span-5 space-y-3 sm:space-y-4 lg:sticky lg:top-24 w-full">
        {imagePreview && (
          <div className="glass-card overflow-hidden p-1.5 sm:p-2 rounded-2xl shadow-md">
            <img
              src={imagePreview}
              alt={label}
              className="w-full h-48 sm:h-56 md:h-64 object-cover rounded-xl"
            />
          </div>
        )}

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-3.5 sm:p-4 text-center relative overflow-hidden rounded-2xl">
          <motion.div className="absolute inset-0 opacity-10"
            style={{ background: "linear-gradient(135deg, hsl(145 65% 42%), hsl(30 90% 55%), hsl(270 55% 55%))" }}
            animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
          <div className="relative z-10">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Detected Food: <span className="font-bold text-foreground text-sm sm:text-base">{result.emoji} {label}</span>
            </p>
            {confidence > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                AI Match: <span className="font-bold text-primary">{(confidence * 100).toFixed(0)}%</span>
              </p>
            )}
          </div>
        </motion.div>

        {!hidePortion && (
          <div className="glass-card p-3.5 sm:p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-foreground text-xs sm:text-sm flex items-center gap-1.5">
                <span>📏</span> Portion Size
              </h3>
              <span className="text-[11px] text-muted-foreground">Tap to adjust nutrients</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(portionMultipliers) as [PortionSize, typeof portionMultipliers[PortionSize]][]).map(([key, p]) => (
                <motion.button key={key} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                  onClick={() => onPortionChange(key)}
                  className={`min-h-[46px] py-2 px-1 rounded-xl text-center transition-all font-medium text-xs sm:text-sm flex flex-col items-center justify-center ${
                    portionSize === key ? "gradient-warm text-secondary-foreground shadow-md font-bold ring-2 ring-secondary/70" : "bg-muted/60 text-foreground hover:bg-muted"
                  }`}>
                  <span className="text-base sm:text-lg block leading-none mb-0.5">{p.emoji}</span>
                  <span className="leading-tight">{p.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {candidates && candidates.filter((c) => c.name.toLowerCase() !== label.toLowerCase()).length > 0 && onSelectCandidate && (
          <div className="glass-card p-3.5 rounded-2xl space-y-2">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <span>✨</span> Other possible matches:
            </p>
            <div className="flex flex-wrap gap-2">
              {candidates
                .filter((c) => c.name.toLowerCase() !== label.toLowerCase())
                .slice(0, 3)
                .map((c) => (
                  <button
                    key={c.foodKey}
                    type="button"
                    onClick={() => onSelectCandidate(c.foodKey)}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all bg-muted/80 text-foreground hover:bg-muted border border-border/60 shadow-sm"
                  >
                    <span>{c.emoji}</span>
                    <span>{c.name}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">({(c.confidence * 100).toFixed(0)}%)</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        <div className="hidden lg:block space-y-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onReset}
            className="w-full h-12 rounded-xl glass-card font-bold text-sm text-foreground hover:glow transition-all">
            🔄 Analyze Another Food
          </motion.button>
        </div>
      </div>

      {/* Right Column on Desktop / Content on Mobile */}
      <div className="lg:col-span-7 space-y-3 sm:space-y-4 w-full">
        <NutritionDashboard nutrition={result} onAddToTracker={onAdd} />

        <div className="lg:hidden pt-1 pb-4">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onReset}
            className="w-full h-13 py-3.5 rounded-xl glass-card font-bold text-sm sm:text-base text-foreground shadow-md">
            🔄 Analyze Another Food
          </motion.button>
        </div>
      </div>
    </div>
  );
}
