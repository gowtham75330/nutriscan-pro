import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, Upload, X, Image, FlipHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { analyzeImageForFood } from "@/lib/aiFoodDetection";

interface ImageUploaderProps {
  onImageCaptured: (imageUrl: string, fileName?: string, isFood?: boolean, aiLabel?: string, aiLabelConfidence?: number) => void;
  imagePreview: string | null;
  onClear: () => void;
}

export default function ImageUploader({ onImageCaptured, imagePreview, onClear }: ImageUploaderProps) {
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const videoRef       = useRef<HTMLVideoElement>(null);
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const streamRef      = useRef<MediaStream | null>(null);

  const [cameraActive,  setCameraActive]  = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraReady,   setCameraReady]   = useState(false);
  const [facingMode,    setFacingMode]    = useState<"environment" | "user">("environment");
  const [isDragging,    setIsDragging]    = useState(false);
  const [notFoodMsg,    setNotFoodMsg]    = useState<string | null>(null);
  const [isAnalyzing,   setIsAnalyzing]   = useState(false);

  // ── Start camera ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async (mode: "environment" | "user" = "environment") => {
    try {
      // Stop existing stream first
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;

      setCameraLoading(true);
      setCameraReady(false);
      setCameraActive(true);
      setNotFoodMsg(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current!.play();
            setCameraReady(true);
            setCameraLoading(false);
          } catch {
            setCameraLoading(false);
            toast.error("Camera preview failed. Try again.");
          }
        };
      }
    } catch (err: any) {
      setCameraLoading(false);
      setCameraActive(false);
      if (err?.name === "NotAllowedError") {
        toast.error("Camera permission denied. Please allow camera access in browser settings.");
      } else if (err?.name === "NotFoundError") {
        toast.error("No camera found on this device.");
      } else {
        toast.error("Unable to open camera. Please try gallery upload instead.");
      }
    }
  }, []);

  // ── Stop camera ───────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraLoading(false);
    setCameraReady(false);
  }, []);

  // ── Flip camera ───────────────────────────────────────────────────────────
  const flipCamera = useCallback(() => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    startCamera(newMode);
  }, [facingMode, startCamera]);

  // ── Capture photo from live camera ────────────────────────────────────────
  // Runs the SAME AI image-content validation used for gallery uploads, so
  // camera capture behaves identically to gallery/drag-drop on every device.
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      toast.info("Camera not ready yet. Please wait.");
      return;
    }
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d")!;
    // Mirror if front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stopCamera();
    setNotFoodMsg(null);
    setIsAnalyzing(true);

    try {
      const result = await analyzeImageForFood(dataUrl);
      if (!result.isFood) {
        setNotFoodMsg("Invalid image. Please upload a valid food image.");
        toast.error("Not a food image! Please point the camera at food.");
        return;
      }
      onImageCaptured(dataUrl, "camera-capture.jpg", true, result.topLabel, result.topLabelConfidence);
    } catch {
      toast.error("Couldn't analyze the photo. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [cameraReady, facingMode, onImageCaptured, stopCamera]);

  // ── Handle file upload with REAL AI image-content food validation ─────────
  // This analyzes the actual pixels of the image (not the file name), so it
  // works identically for gallery uploads on laptop and mobile, regardless
  // of how generic or auto-generated the file name is (e.g. IMG_0001.jpg).
  const processFile = useCallback(async (file: File) => {
    setNotFoodMsg(null);
    const fileName = file.name;

    // Read the file into a data URL for preview/display purposes.
    const dataUrl: string = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    }).catch(() => {
      toast.error("Couldn't read that file. Please try another image.");
      return "";
    });

    if (!dataUrl) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeImageForFood(dataUrl);

      if (!result.isFood) {
        // Show rejection message — do NOT show food selector
        setNotFoodMsg("Invalid image. Please upload a valid food image.");
        toast.error("Not a food image! Please upload a food photo.");
        return;
      }

      onImageCaptured(dataUrl, fileName, true, result.topLabel, result.topLabelConfidence);
      setNotFoodMsg(null);
    } catch {
      toast.error("Couldn't analyze the image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [onImageCaptured]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }, [processFile]);

  // ── Drag and drop ─────────────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  }, [processFile]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">

        {/* ── IMAGE PREVIEW ── */}
        {imagePreview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative glass-card overflow-hidden"
          >
            <img src={imagePreview} alt="Food" className="h-64 sm:h-80 md:h-96 w-full rounded-xl object-cover" />
            <button
              onClick={() => { onClear(); stopCamera(); setNotFoodMsg(null); }}
              className="absolute right-3 top-3 rounded-full bg-foreground/70 p-1.5 text-background hover:bg-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>

        /* ── ANALYZING (AI food-content check in progress) ── */
        ) : isAnalyzing ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative glass-card overflow-hidden flex flex-col items-center justify-center gap-3 py-16"
          >
            <motion.div
              className="h-12 w-12 rounded-full gradient-primary"
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <p className="text-sm font-medium text-foreground">Checking if this is a food image...</p>
          </motion.div>

        /* ── LIVE CAMERA ── */
        ) : cameraActive ? (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative glass-card overflow-hidden"
          >
            <div className="relative w-full overflow-hidden rounded-xl bg-black h-72 sm:h-96 md:h-[420px]">
              {/* Camera viewfinder grid overlay */}
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                autoPlay
                playsInline
                muted
                style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
              />

              {/* Scanning frame overlay */}
              {cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div
                    className="w-48 h-48 border-2 border-primary rounded-lg"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {/* Corner markers */}
                    {[
                      "top-0 left-0 border-t-4 border-l-4 rounded-tl-lg",
                      "top-0 right-0 border-t-4 border-r-4 rounded-tr-lg",
                      "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg",
                      "bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg",
                    ].map((cls, i) => (
                      <div key={i} className={`absolute w-5 h-5 border-primary ${cls}`} />
                    ))}
                    {/* Scan line */}
                    <motion.div
                      className="absolute left-0 right-0 h-0.5 bg-primary/80"
                      animate={{ top: ["10%", "90%", "10%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>
                  <p className="absolute bottom-16 text-white/80 text-xs font-medium bg-black/40 px-3 py-1 rounded-full">
                    Point camera at food
                  </p>
                </div>
              )}

              {/* Loading overlay */}
              {(cameraLoading || !cameraReady) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                  <motion.div
                    className="h-12 w-12 rounded-full gradient-primary"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <p className="text-sm font-medium text-foreground">Starting camera...</p>
                </div>
              )}
            </div>

            {/* Camera controls */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3 px-4">
              {/* Flip button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={flipCamera}
                className="rounded-full bg-black/60 backdrop-blur-sm p-3 text-white hover:bg-black/80"
                title="Flip camera"
              >
                <FlipHorizontal size={18} />
              </motion.button>

              {/* Capture button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={capturePhoto}
                disabled={!cameraReady}
                className="rounded-full gradient-primary w-16 h-16 flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border-4 border-white/30"
                title="Capture photo"
              >
                <div className="w-10 h-10 rounded-full bg-white/30" />
              </motion.button>

              {/* Cancel button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={stopCamera}
                className="rounded-full bg-destructive/80 backdrop-blur-sm p-3 text-white hover:bg-destructive"
                title="Close camera"
              >
                <X size={18} />
              </motion.button>
            </div>
          </motion.div>

        /* ── UPLOAD ZONE ── */
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative glass-card cursor-pointer overflow-hidden border-2 border-dashed min-h-[220px] sm:min-h-[250px] p-6 sm:p-8 flex flex-col items-center justify-center transition-all rounded-2xl ${
              isDragging ? "border-primary bg-primary/10 scale-[1.01]" : "border-primary/40 hover:border-primary/70"
            }`}
          >
            <motion.div
              className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-10"
              style={{ background: "linear-gradient(135deg, hsl(145 65% 42%), hsl(30 90% 55%), hsl(270 55% 55%))" }}
            />
            <div className="flex flex-col items-center gap-3 text-center">
              <motion.div
                className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl gradient-primary shadow-lg"
                animate={{
                  boxShadow: [
                    "0 0 0px hsl(145 65% 42% / 0)",
                    "0 0 25px hsl(145 65% 42% / 0.4)",
                    "0 0 0px hsl(145 65% 42% / 0)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Upload className="text-primary-foreground" size={28} />
              </motion.div>
              <div className="space-y-1">
                <p className="relative z-10 text-base sm:text-xl font-bold text-foreground">
                  {isDragging ? "Drop food image here!" : "Upload Food Image"}
                </p>
                <p className="relative z-10 text-xs sm:text-sm text-muted-foreground max-w-xs sm:max-w-md mx-auto">
                  Tap to browse gallery · Take photo · Instant AI analysis
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                {["🍎", "🍕", "🥗", "🍜", "🥩"].map((emoji, index) => (
                  <motion.span
                    key={index}
                    className="text-lg sm:text-xl"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
                  >
                    {emoji}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NOT FOOD ERROR MESSAGE ── */}
      <AnimatePresence>
        {notFoodMsg && !imagePreview && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4 text-center space-y-2.5"
          >
            <p className="text-3xl sm:text-4xl">🚫</p>
            <p className="font-bold text-destructive text-sm sm:text-base">{notFoodMsg}</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Our AI analyzes the actual photo content — please provide a clear, well-lit picture of a food dish.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { setNotFoodMsg(null); fileInputRef.current?.click(); }}
              className="rounded-xl gradient-primary text-primary-foreground px-5 py-2.5 text-xs sm:text-sm font-bold shadow-md"
            >
              Try Again with Food Image
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

      {/* ── GALLERY + CAMERA BUTTONS ── */}
      {!imagePreview && !cameraActive && !notFoodMsg && !isAnalyzing && (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex items-center justify-center gap-2.5 overflow-hidden rounded-xl sm:rounded-2xl glass-card h-14 sm:h-16 font-bold text-foreground hover:glow shadow-md border-primary/20"
          >
            <motion.div className="absolute inset-0 gradient-cool opacity-0 transition-opacity group-hover:opacity-15" />
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Image size={20} className="text-primary" />
            </div>
            <div className="text-left">
              <span className="block text-sm sm:text-base font-bold leading-tight">Gallery</span>
              <span className="block text-[10px] sm:text-xs text-muted-foreground font-normal">Choose photo</span>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => startCamera("environment")}
            className="group relative flex items-center justify-center gap-2.5 overflow-hidden rounded-xl sm:rounded-2xl glass-card h-14 sm:h-16 font-bold text-foreground hover:glow shadow-md border-accent/20"
          >
            <motion.div className="absolute inset-0 gradient-warm opacity-0 transition-opacity group-hover:opacity-15" />
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Camera size={20} className="text-accent" />
            </div>
            <div className="text-left">
              <span className="block text-sm sm:text-base font-bold leading-tight">Camera</span>
              <span className="block text-[10px] sm:text-xs text-muted-foreground font-normal">Snap photo</span>
            </div>
          </motion.button>
        </div>
      )}
    </div>
  );
}
