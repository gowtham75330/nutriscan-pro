import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { nutritionDatabase } from "@/data/nutritionData";
import { parseQuantityInput, type ParsedInput } from "@/lib/nutritionUtils";

interface Props {
  onAnalyze: (parsed: ParsedInput) => void;
}

export default function TextAnalyzer({ onAnalyze }: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const suggestions = useMemo(() => {
    const q = text.toLowerCase().trim();
    if (q.length < 2) return [];
    return Object.entries(nutritionDatabase)
      .filter(([key, f]) => key.includes(q) || f.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [text]);

  const submit = (val?: string) => {
    const input = val ?? text;
    const parsed = parseQuantityInput(input);
    if (!parsed) {
      setError("Food not found. Try '2 idli', 'biryani 250g', or 'apple'.");
      return;
    }
    setError("");
    onAnalyze(parsed);
  };

  return (
    <div className="space-y-3">
      <div className="glass-card p-3.5 sm:p-5 space-y-3.5 rounded-2xl w-full">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <h3 className="font-heading font-bold text-foreground text-base sm:text-lg">Text & Quantity Analyzer</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Type a food with quantity — e.g. <b>2 idli</b>, <b>chicken biryani 250g</b>, <b>150 ml milk</b>, <b>1 cup rice</b>.
        </p>
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={text}
            onChange={(e) => { setText(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. 2 idli with sambar"
            className="w-full min-h-[48px] pl-10 pr-3.5 py-3 rounded-xl bg-background/80 border border-border text-foreground placeholder:text-muted-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map(([key, f]) => (
                  <button
                    key={key}
                    onClick={() => { setText(f.name); submit(f.name); }}
                    className="min-h-[36px] text-xs px-3 py-1.5 rounded-xl bg-muted hover:bg-primary/10 text-foreground font-medium transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <span>{f.emoji}</span> <span>{f.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="text-xs text-destructive font-medium">{error}</p>}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => submit()}
          className="w-full min-h-[48px] py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm sm:text-base shadow-md flex items-center justify-center gap-2"
        >
          🔍 Analyze Nutrition
        </motion.button>
      </div>
    </div>
  );
}
