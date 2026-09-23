import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Check, X } from "lucide-react";
import { nutritionDatabase, foodCategories, portionMultipliers, type PortionSize } from "@/data/nutritionData";

interface FoodSelectorProps {
  selectedFood: string | null;
  onSelectFood: (food: string | null) => void;
  portionSize: PortionSize;
  onPortionChange: (size: PortionSize) => void;
  onAnalyze: () => void;
}

export default function FoodSelector({
  selectedFood,
  onSelectFood,
  portionSize,
  onPortionChange,
  onAnalyze,
}: FoodSelectorProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFoods = useMemo(() => {
    return Object.entries(nutritionDatabase).filter(([, food]) => {
      const matchCategory = activeCategory === "all" || food.category === activeCategory;
      const matchSearch =
        !searchQuery ||
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const activeFoodObj = selectedFood ? nutritionDatabase[selectedFood] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass-card p-3.5 sm:p-5 rounded-2xl space-y-3.5 sm:space-y-4 w-full border border-border/60 shadow-sm"
    >
      {/* ── 1. PORTION SIZE SELECTOR ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-heading font-semibold text-foreground text-xs sm:text-sm flex items-center gap-1.5">
            <span>📏</span> Portion Size
          </h3>
          <span className="text-[11px] text-muted-foreground">Adjust serving size</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {(Object.entries(portionMultipliers) as [PortionSize, typeof portionMultipliers[PortionSize]][]).map(([key, p]) => (
            <button
              key={key}
              type="button"
              onClick={() => onPortionChange(key)}
              className={`min-h-[44px] py-2 px-1 rounded-xl text-center transition-all font-medium text-xs sm:text-sm flex flex-col items-center justify-center ${
                portionSize === key
                  ? "gradient-warm text-secondary-foreground shadow-md font-bold ring-2 ring-secondary/70"
                  : "bg-background/60 hover:bg-muted/70 text-foreground border border-border/50"
              }`}
            >
              <span className="text-base sm:text-lg block leading-none mb-0.5">{p.emoji}</span>
              <span className="leading-tight">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. PRIMARY ANALYZE BUTTON (ALWAYS VISIBLE & TAPPABLE ON MOBILE) ── */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={onAnalyze}
        className="w-full min-h-[48px] py-3 px-4 rounded-xl gradient-primary text-primary-foreground font-heading font-bold text-sm sm:text-base transition-all glow shadow-md flex items-center justify-center gap-2 cursor-pointer active:opacity-90"
        aria-label="Analyze nutrition"
      >
        <Sparkles size={18} />
        <span>
          {activeFoodObj ? `Analyze ${activeFoodObj.name}` : "Analyze Nutrition"}
        </span>
      </motion.button>

      {/* ── 3. OPTIONAL FOOD CARD SELECTION SECTION ── */}
      <div className="pt-2 border-t border-border/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-semibold text-foreground">🍽️ Choose Food Match</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full font-medium">
              Optional
            </span>
          </div>
          {selectedFood && (
            <button
              type="button"
              onClick={() => onSelectFood(null)}
              className="text-[11px] text-destructive hover:underline font-medium flex items-center gap-1"
            >
              <X size={12} /> Clear selection
            </button>
          )}
        </div>

        <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">
          Tap Analyze above to inspect the photo, or tap a specific dish below to customize:
        </p>

        {/* Search */}
        <div className="bg-background/80 border border-border/60 p-2 sm:p-2.5 rounded-xl flex items-center gap-2 min-h-[44px]">
          <Search size={16} className="text-muted-foreground ml-1 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish (e.g. biryani, apple, chicken)..."
            className="bg-transparent flex-1 outline-none text-xs sm:text-sm text-foreground placeholder:text-muted-foreground font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground p-1 hover:text-foreground"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {foodCategories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 shadow-sm shrink-0 ${
                activeCategory === cat.key
                  ? "gradient-primary text-primary-foreground shadow-md"
                  : "bg-background/60 border border-border/50 text-foreground hover:bg-muted/70"
              }`}
            >
              <span>{cat.emoji}</span> <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Food grid with controlled height and clean scrolling */}
        <div className="max-h-48 sm:max-h-60 overflow-y-auto pr-1 scrollbar-hide overscroll-contain">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
            <AnimatePresence mode="popLayout">
              {filteredFoods.map(([key, food], i) => {
                const isSelected = selectedFood === key;
                return (
                  <motion.button
                    key={key}
                    type="button"
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: Math.min(i * 0.015, 0.2) }}
                    onClick={() => onSelectFood(isSelected ? null : key)}
                    className={`p-2 rounded-xl text-center transition-all text-xs font-medium min-h-[44px] flex flex-col items-center justify-center border relative ${
                      isSelected
                        ? "gradient-primary text-primary-foreground shadow-lg border-primary ring-2 ring-primary/40 font-bold scale-[1.02]"
                        : "bg-background/60 border-border/50 text-foreground hover:bg-muted/70 hover:scale-[1.02]"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-1 right-1 bg-white/30 rounded-full p-0.5">
                        <Check size={10} />
                      </span>
                    )}
                    <span className="text-lg sm:text-xl block mb-0.5 leading-none">{food.emoji}</span>
                    <span className="line-clamp-1 w-full text-[11px] sm:text-xs">{food.name}</span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
          {filteredFoods.length === 0 && (
            <p className="text-center text-muted-foreground text-xs sm:text-sm py-4">No food items found.</p>
          )}
        </div>

        {/* Secondary bottom Analyze button (for users who scrolled down through the grid) */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={onAnalyze}
          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl gradient-primary text-primary-foreground font-heading font-bold text-xs sm:text-sm transition-all glow shadow-sm flex items-center justify-center gap-2 cursor-pointer active:opacity-90"
          aria-label="Analyze nutrition"
        >
          <Sparkles size={16} />
          <span>
            {activeFoodObj ? `Analyze ${activeFoodObj.name}` : "Analyze Nutrition"}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}
