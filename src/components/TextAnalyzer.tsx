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
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <h3 className="font-heading font-bold text-foreground">Text & Quantity Analyzer</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Type a food with quantity — e.g. <b>2 idli</b>, <b>chicken biryani 250g</b>, <b>150 ml milk</b>, <b>1 cup rice</b>.
        </p>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={text}
            onChange={(e) => { setText(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. 2 idli with sambar"
            className="w-full pl-9 pr-3 py-3 rounded-lg bg-background/80 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="text-xs px-2.5 py-1.5 rounded-full bg-muted hover:bg-primary/10 text-foreground transition-colors"
                  >
                    {f.emoji} {f.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => submit()}
          className="w-full py-3 rounded-lg gradient-primary text-primary-foreground font-semibold"
        >
          🔍 Analyze Nutrition
        </motion.button>
      </div>
    </div>
  );
}
