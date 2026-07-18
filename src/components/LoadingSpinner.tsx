import { motion } from "framer-motion";

export default function LoadingSpinner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4 py-12"
    >
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-muted" />
        <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin-slow" />
      </div>
      <div className="text-center">
        <p className="font-heading font-semibold text-foreground">Analyzing food...</p>
        <p className="text-muted-foreground text-sm">Processing image using CNN model</p>
      </div>
    </motion.div>
  );
}
