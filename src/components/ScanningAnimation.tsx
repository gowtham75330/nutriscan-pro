import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const scanTexts = [
  "Scanning image...",
  "Detecting food items...",
  "Analyzing colors & textures...",
  "Identifying food type...",
  "Estimating nutrients...",
  "Almost done...",
];

interface Props {
  onComplete: () => void;
}

export default function ScanningAnimation({ onComplete }: Props) {
  const [textIndex, setTextIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((i) => {
        if (i >= scanTexts.length - 1) {
          clearInterval(interval);
          return i;
        }
        return i + 1;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return p + 2.5;
      });
    }, 75);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card p-6 space-y-4"
    >
      {/* Scanning circle */}
      <div className="flex justify-center">
        <div className="relative w-24 h-24">
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-primary/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-1 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-3 rounded-full border-4 border-t-transparent border-r-secondary border-b-transparent border-l-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="text-2xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              🔍
            </motion.span>
          </div>
        </div>
      </div>

      {/* Status text */}
      <motion.p
        key={textIndex}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center font-heading font-semibold text-foreground"
      >
        {scanTexts[textIndex]}
      </motion.p>

      {/* Progress bar */}
      <div className="nutrient-bar h-2">
        <motion.div
          className="h-full rounded-full gradient-primary"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      <p className="text-center text-xs text-muted-foreground">{Math.round(progress)}%</p>
    </motion.div>
  );
}
