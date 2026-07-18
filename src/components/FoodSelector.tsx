import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { nutritionDatabase, foodCategories, portionMultipliers, type PortionSize } from "@/data/nutritionData";

interface FoodSelectorProps {
  selectedFood: string | null;
  onSelectFood: (food: string) => void;
  portionSize: PortionSize;
  onPortionChange: (size: PortionSize) => void;
  onAnalyze: () => void;
}

export default function FoodSelector({ selectedFood, onSelectFood, portionSize, onPortionChange, onAnalyze }: FoodSelectorProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFoods = useMemo(() => {
    return Object.entries(nutritionDatabase).filter(([, food]) => {
      const matchCategory = activeCategory === "all" || food.category === activeCategory;
      const matchSearch = !searchQuery || food.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      {/* Search */}
      <div className="glass-card p-3 flex items-center gap-2">
        <Search size={18} className="text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search food... (e.g. biryani, apple, chicken)"
          className="bg-transparent flex-1 outline-none text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {foodCategories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.key
                ? "gradient-primary text-primary-foreground shadow-md"
                : "glass-card text-foreground hover:scale-105"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Food grid */}
      <div className="max-h-64 overflow-y-auto pr-1 scrollbar-hide">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          <AnimatePresence mode="popLayout">
            {filteredFoods.map(([key, food], i) => (
              <motion.button
                key={key}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                onClick={() => onSelectFood(key)}
                className={`p-2.5 rounded-lg text-center transition-all text-xs font-medium ${
                  selectedFood === key
                    ? "gradient-primary text-primary-foreground scale-105 shadow-lg"
                    : "glass-card text-foreground hover:scale-105"
                }`}
              >
                <span className="text-xl block mb-0.5">{food.emoji}</span>
                {food.name}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
        {filteredFoods.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-6">No food items found. Try a different search.</p>
        )}
      </div>

      {/* Portion Size */}
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-2 text-sm">📏 Portion Size</h3>
        <div className="flex gap-3">
          {(Object.entries(portionMultipliers) as [PortionSize, typeof portionMultipliers[PortionSize]][]).map(([key, p]) => (
            <button
              key={key}
              onClick={() => onPortionChange(key)}
              className={`flex-1 py-2.5 rounded-lg text-center transition-all font-medium text-sm ${
                portionSize === key
                  ? "gradient-warm text-secondary-foreground shadow-lg"
                  : "glass-card text-foreground hover:scale-105"
              }`}
            >
              <span className="text-lg block">{p.emoji}</span>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Analyze button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onAnalyze}
        disabled={!selectedFood}
        className="w-full py-4 rounded-lg gradient-primary text-primary-foreground font-heading font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity glow"
      >
        🔍 Analyze Nutrition
      </motion.button>
    </motion.div>
  );
}
