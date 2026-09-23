import { motion } from "framer-motion";

const stats = [
  { num: "1 in 4", text: "Indians suffer lifestyle disease due to poor diet" },
  { num: "60%", text: "of daily calories should come from whole foods" },
  { num: "30 g", text: "of fiber a day keeps your gut healthy" },
];

const tips = [
  { emoji: "🥗", title: "Fill half your plate with vegetables", desc: "Vitamins, minerals and fibre with very few calories." },
  { emoji: "💧", title: "Drink 2-3 litres of water daily", desc: "Hydration boosts metabolism and skin health." },
  { emoji: "🚫", title: "Limit fried & ultra-processed food", desc: "These raise bad cholesterol and inflammation." },
  { emoji: "🌾", title: "Choose whole grains over refined", desc: "Brown rice, oats and millets keep sugar steady." },
];

export default function HealthAwareness() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Hero */}
      <div className="relative glass-card overflow-hidden p-6 text-center">
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{ background: "linear-gradient(135deg, hsl(145 65% 42%), hsl(30 90% 55%), hsl(270 55% 55%))" }}
          animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <div className="relative z-10 space-y-2">
          <motion.h2
            className="font-heading font-bold text-2xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            style={{ backgroundSize: "200% 200%" }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            Eat Smart. Live Strong.
          </motion.h2>
          <p className="text-sm text-foreground/80">
            Are the foods on your plate actually keeping you healthy? <br />
            <b>NutriScan Pro</b> turns every meal into clear, honest nutrition insight — no guesswork.
          </p>
          <div className="flex justify-center gap-2 pt-2 text-2xl">
            {["🥗", "🍎", "💪", "🧠", "❤️"].map((e, i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              >{e}</motion.span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="glass-card p-3.5 text-center"
          >
            <p className="font-heading font-bold text-xl text-primary">{s.num}</p>
            <p className="text-xs text-muted-foreground leading-tight mt-1">{s.text}</p>
          </motion.div>
        ))}
      </div>

      {/* Tips */}
      <div className="space-y-2.5">
        <h3 className="font-heading font-semibold text-foreground text-sm px-1">🌟 Daily Healthy Habits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {tips.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              className="glass-card p-3.5 flex items-start gap-3"
            >
              <span className="text-2xl shrink-0">{t.emoji}</span>
              <div>
                <p className="font-semibold text-sm text-foreground">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
