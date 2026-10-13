import { motion } from "framer-motion";

export const stats = [
  { num: "1 in 4", text: "Diet-linked lifestyle risks" },
  { num: "60%", text: "Daily whole food calories" },
  { num: "30 g", text: "Daily fiber for gut health" },
];

export const tips = [
  { emoji: "🥗", title: "Fill half your plate with vegetables", desc: "Vitamins, minerals and fibre with very few calories." },
  { emoji: "💧", title: "Drink 2-3 litres of water daily", desc: "Hydration boosts metabolism, energy and skin health." },
  { emoji: "🚫", title: "Limit fried & ultra-processed food", desc: "These raise bad cholesterol and systemic inflammation." },
  { emoji: "🌾", title: "Choose whole grains over refined", desc: "Brown rice, oats and millets keep sugar levels steady." },
];

export function HealthHero() {
  return (
    <div className="relative glass-card overflow-hidden p-4 sm:p-6 text-center">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: "linear-gradient(135deg, hsl(145 65% 42%), hsl(30 90% 55%), hsl(270 55% 55%))" }}
      />
      <div className="relative z-10 space-y-1.5 sm:space-y-2">
        <h2 className="font-heading font-bold text-xl sm:text-2xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Eat Smart. Live Strong.
        </h2>
        <p className="text-xs sm:text-sm text-foreground/85 max-w-lg mx-auto leading-relaxed">
          Are the foods on your plate actually keeping you healthy? <br className="hidden sm:inline" />
          <b className="font-semibold text-foreground">NutriScan Pro</b> turns every meal into clear, honest nutrition insight.
        </p>
        <div className="flex justify-center gap-2 pt-1 text-xl sm:text-2xl">
          {["🥗", "🍎", "💪", "🧠", "❤️"].map((e, i) => (
            <motion.span
              key={i}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            >{e}</motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HealthStats() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {stats.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i }}
          className="glass-card p-2.5 sm:p-3.5 text-center flex flex-col justify-center"
        >
          <p className="font-heading font-bold text-base sm:text-xl text-primary">{s.num}</p>
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight mt-0.5">{s.text}</p>
        </motion.div>
      ))}
    </div>
  );
}

export function HealthyHabits() {
  return (
    <div className="space-y-2 sm:space-y-2.5">
      <h3 className="font-heading font-semibold text-foreground text-xs sm:text-sm px-1">🌟 Daily Healthy Habits</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
        {tips.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
            className="glass-card p-3 sm:p-3.5 flex items-start gap-2.5 sm:gap-3 rounded-xl"
          >
            <span className="text-xl sm:text-2xl shrink-0 p-1 rounded-lg bg-muted/40">{t.emoji}</span>
            <div className="min-w-0">
              <p className="font-semibold text-xs sm:text-sm text-foreground truncate">{t.title}</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug mt-0.5">{t.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function HealthAwareness() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <HealthHero />
      <HealthStats />
      <HealthyHabits />
    </div>
  );
}
