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

  const handleImageCaptured = useCallback((url: string, fileName?: string, isFood?: boolean, aiLabel?: string, aiLabelConfidence?: number) => {
    // If explicitly marked as not food (validated by real AI image-content
    // analysis in ImageUploader), do nothing — ImageUploader already shows
    // the rejection message, and no manual food selection is offered.
    if (isFood === false) return;
    setImagePreview(url);
    setResult(null);
    setShowManualSelect(false);
    setSelectedFood(null);
    setPendingFileName(fileName);
    setPendingAiLabel(aiLabel);
    setPendingAiLabelConfidence(aiLabelConfidence ?? 0);
    setIsScanning(true);
  }, []);

  // Minimum confidence the AI must have in its OWN top guess before we trust
  // that specific label enough to auto-fill nutrition from it. Below this,
  // we'd rather ask the person to confirm than silently show a wrong dish.
  const AI_LABEL_TRUST_THRESHOLD = 0.3;

  const handleScanComplete = useCallback(() => {
    setIsScanning(false);
    // Only fold the AI's guessed label into the search text when the model
    // is actually confident about it. A low-confidence guess is exactly what
    // produced wrong results before (e.g. an ambiguous label loosely matching
    // an unrelated dish) — better to fall back to the file name / manual
    // selection than to silently show a shaky guess as if it were certain.
    const trustworthyAiLabel = pendingAiLabelConfidence >= AI_LABEL_TRUST_THRESHOLD ? pendingAiLabel : undefined;
    const searchText = [trustworthyAiLabel, pendingFileName].filter(Boolean).join(" ");
    if (searchText) {
      const detections = detectMultipleFoodsFromFileName(searchText);
      if (detections.length > 0) {
        const scaledItems = detections.map((d) => {
          const calc = calculateNutrition(d.food, portionSize, d.foodKey);
          const serving = getServing(d.foodKey);
          calc.servingLabel = serving.unit === "piece"
            ? `1 ${serving.pieceLabel ?? "piece"} (~${serving.grams}g)`
            : `${serving.grams}${serving.unit} serving`;
          return calc;
        });

        if (scaledItems.length === 1) {
          setResult(scaledItems[0]);
          setDetectedLabel(detections[0].detectedLabel);
          setConfidence(detections[0].confidence);
          toast({ title: `${detections[0].food.emoji} ${detections[0].food.name} detected!`, description: `Confidence: ${(detections[0].confidence * 100).toFixed(1)}%` });
        } else {
          const combined = sumNutrition(scaledItems);
          combined.name = detections.map((d) => d.food.name).join(" + ");
          combined.emoji = "🍱";
          combined.healthTip = `Combined meal of ${detections.length} items. Balance portions for variety.`;
          combined.servingLabel = scaledItems.map((s) => s.servingLabel).filter(Boolean).join(" + ");
          setResult(combined);
          setDetectedLabel(combined.name);
          setConfidence(0.9);
          toast({ title: `🍱 ${detections.length} foods detected!`, description: combined.name });
        }
        return;
      }
    }
    setShowManualSelect(true);
    toast({ title: "Photo captured!", description: "Tap Analyze Nutrition or choose a food match below." });
  }, [pendingFileName, pendingAiLabel, pendingAiLabelConfidence, portionSize, toast]);

  const handleManualAnalyze = useCallback(() => {
    let foodKeyToUse = selectedFood;

    // If user did not manually pick a food card, detect from AI label or file name
    if (!foodKeyToUse) {
      if (pendingAiLabel) {
        const matches = detectMultipleFoodsFromFileName(pendingAiLabel);
        if (matches.length > 0) foodKeyToUse = matches[0].foodKey;
      }
      if (!foodKeyToUse && pendingFileName) {
        const matches = detectMultipleFoodsFromFileName(pendingFileName);
        if (matches.length > 0) foodKeyToUse = matches[0].foodKey;
      }
      if (!foodKeyToUse && pendingAiLabel) {
        const lower = pendingAiLabel.toLowerCase();
        for (const [k] of Object.entries(nutritionDatabase)) {
          if (lower.includes(k) || k.includes(lower)) {
            foodKeyToUse = k;
            break;
          }
        }
      }
      // If still no direct match, fall back to a balanced healthy dish
      if (!foodKeyToUse) {
        foodKeyToUse = "salad";
      }
    }

    const food = nutritionDatabase[foodKeyToUse];
    if (food) {
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
        description: selectedFood ? "Manual selection confirmed" : "Analyzed from food image",
      });
    }
  }, [selectedFood, pendingAiLabel, pendingAiLabelConfidence, pendingFileName, portionSize, toast]);

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

      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm transform-gpu will-change-transform isolate">
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

      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
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
  result, label, confidence, portionSize, onPortionChange, onAdd, onReset, hidePortion, imagePreview,
}: {
  result: NutritionInfo; label: string; confidence: number;
  portionSize: PortionSize; onPortionChange: (s: PortionSize) => void;
  onAdd: () => void; onReset: () => void; hidePortion?: boolean;
  imagePreview?: string | null;
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
              Analyzing: <span className="font-bold text-foreground text-sm sm:text-base">{label}</span>
            </p>
            {confidence > 0 && confidence < 1 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Confidence: <span className="font-bold text-primary">{(confidence * 100).toFixed(0)}%</span>
              </p>
            )}
          </div>
        </motion.div>

        {!hidePortion && (
          <div className="glass-card p-3.5 sm:p-4 rounded-2xl">
            <h3 className="font-heading font-semibold text-foreground mb-2 sm:mb-3 text-xs sm:text-sm">📏 Portion Size</h3>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(portionMultipliers) as [PortionSize, typeof portionMultipliers[PortionSize]][]).map(([key, p]) => (
                <motion.button key={key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => onPortionChange(key)}
                  className={`min-h-[44px] py-2.5 px-1 rounded-xl text-center transition-all font-medium text-xs sm:text-sm flex flex-col items-center justify-center ${
                    portionSize === key ? "gradient-warm text-secondary-foreground shadow-md font-bold" : "bg-muted/60 text-foreground hover:bg-muted"
                  }`}>
                  <span className="text-base sm:text-lg block">{p.emoji}</span>
                  <span>{p.label}</span>
                </motion.button>
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
