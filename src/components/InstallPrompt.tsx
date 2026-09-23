import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Share, PlusSquare } from "lucide-react";
import { isStandalone, isIOS } from "@/serviceWorkerRegistration";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = "nutriscan_pwa_dismissed";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const checkDismissed = () => {
      try {
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt) {
          const timePassed = Date.now() - parseInt(dismissedAt, 10);
          if (timePassed < DISMISS_DURATION_MS) {
            return true;
          }
        }
      } catch {}
      return false;
    };

    const isDismissed = checkDismissed();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);

      if (!isDismissed) {
        setShowBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setShowBanner(false);
      setShowIosGuide(false);
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch {}
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (isIOS() && !isStandalone() && !isDismissed) {
      const timer = setTimeout(() => {
        setShowIosGuide(true);
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowBanner(false);
        setDeferredPrompt(null);
      } else {
        handleDismiss();
      }
    } catch (err) {
      console.warn("PWA install error:", err);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setShowIosGuide(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {}
  }, []);

  if (installed) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {showBanner && deferredPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-3 sm:bottom-4 left-2.5 right-2.5 sm:left-4 sm:right-4 z-50 max-w-md mx-auto"
          >
            <div className="glass-card p-3 sm:p-4 shadow-2xl border-primary/30 bg-background/95 backdrop-blur-md rounded-2xl flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-md">
                  <Smartphone className="text-white" size={22} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-heading font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5 truncate">
                    <span>Install NutriScan</span>
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                      App
                    </span>
                  </h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                    1-tap food nutrition scanning
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleInstallClick}
                  className="px-3 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-bold shadow-md flex items-center gap-1.5 min-h-[36px]"
                >
                  <Download size={14} />
                  <span>Install</span>
                </motion.button>
                <button
                  onClick={handleDismiss}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Dismiss install banner"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIosGuide && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
          >
            <div className="glass-card p-4 shadow-2xl border-primary/30 bg-background/95 backdrop-blur-md rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                  <Smartphone className="text-primary" size={18} />
                  Install NutriScan on iPhone
                </h4>
                <button
                  onClick={handleDismiss}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                To install this app on your device:
              </p>
              <div className="flex items-center gap-3 text-xs bg-muted/50 p-2.5 rounded-xl text-foreground">
                <span className="flex items-center gap-1 font-semibold text-primary">
                  1. Tap <Share size={14} className="inline mx-0.5" />
                </span>
                <span>→</span>
                <span className="flex items-center gap-1 font-semibold text-primary">
                  2. Select <PlusSquare size={14} className="inline mx-0.5" /> Add to Home Screen
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function HeaderInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (installed || !deferredPrompt) {
    return null;
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } catch {}
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleInstall}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full gradient-primary text-primary-foreground text-xs font-semibold shadow-sm hover:shadow transition-all"
      title="Install NutriScan App"
    >
      <Download size={13} />
      <span className="hidden sm:inline">Install</span> App
    </motion.button>
  );
}

