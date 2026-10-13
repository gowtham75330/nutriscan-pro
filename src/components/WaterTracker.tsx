import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Droplet, Plus, Minus, RotateCcw } from "lucide-react";

const KEY = "water-tracker";
const GOAL = 8; // 8 glasses (~2L)

export default function WaterTracker() {
  const [glasses, setGlasses] = useState(0);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
      const today = new Date().toDateString();
      if (saved.date === today) setGlasses(saved.count || 0);
    } catch {}
  }, []);

  const save = (n: number) => {
    setGlasses(n);
    localStorage.setItem(KEY, JSON.stringify({ date: new Date().toDateString(), count: n }));
  };

  const pct = Math.min(100, (glasses / GOAL) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 sm:p-5 space-y-4 rounded-2xl w-full"
    >
      <div className="flex items-center gap-2">
        <Droplet size={20} className="text-accent" />
        <h3 className="font-heading font-bold text-foreground text-base sm:text-lg">Water Intake Tracker</h3>
      </div>

      <div className="text-center">
        <p className="text-4xl font-heading font-bold text-foreground">
          {glasses} <span className="text-base text-muted-foreground">/ {GOAL} glasses</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">≈ {(glasses * 250)} ml of {GOAL * 250} ml goal</p>
      </div>

      <div className="grid grid-cols-8 gap-1.5">
        {Array.from({ length: GOAL }).map((_, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.9 }}
            onClick={() => save(i < glasses ? i : i + 1)}
            className={`aspect-square rounded-lg border-2 flex items-center justify-center text-lg transition-colors ${
              i < glasses ? "bg-accent/20 border-accent" : "bg-muted border-border"
            }`}
          >
            {i < glasses ? "💧" : "○"}
          </motion.button>
        ))}
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full"
          style={{ background: "linear-gradient(90deg, hsl(200 80% 55%), hsl(180 70% 50%))" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex gap-2 sm:gap-3">
        <button
          onClick={() => save(Math.max(0, glasses - 1))}
          className="flex-1 min-h-[44px] py-2.5 rounded-xl glass-card font-bold text-sm text-foreground flex items-center justify-center gap-1.5 shadow-sm hover:bg-muted/80 transition-colors"
        >
          <Minus size={16} /> Remove
        </button>
        <button
          onClick={() => save(Math.min(20, glasses + 1))}
          className="flex-1 min-h-[44px] py-2.5 rounded-xl gradient-cool text-accent-foreground font-bold text-sm flex items-center justify-center gap-1.5 shadow-md hover:opacity-95 transition-opacity"
        >
          <Plus size={16} /> Add Glass
        </button>
        <button
          onClick={() => save(0)}
          className="min-h-[44px] px-3.5 py-2.5 rounded-xl glass-card text-muted-foreground hover:text-foreground shadow-sm transition-colors"
          title="Reset"
          aria-label="Reset water intake"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {glasses >= GOAL && (
        <motion.p
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="text-center text-sm font-semibold text-primary"
        >
          🎉 Daily goal reached! Stay hydrated.
        </motion.p>
      )}
    </motion.div>
  );
}
