/**
 * i18n.ts - Internationalization & High-Reliability Text-to-Speech Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Supports fully independent English ("en-IN" / "en-US") and Tamil ("ta-IN")
 * voice synthesis and Tamil Unicode display with graceful offline/device fallbacks.
 */

export type Lang = "en" | "ta";

export const t = {
  scan: { en: "Scan", ta: "ஸ்கேன்" },
  text: { en: "Text", ta: "எழுத்து" },
  compare: { en: "Compare", ta: "ஒப்பிடு" },
  recipe: { en: "Recipe", ta: "சமையல்" },
  tools: { en: "Health Tools", ta: "ஆரோக்கிய கருவிகள்" },
  tracker: { en: "Tracker", ta: "டிராக்கர்" },
  analysisResults: { en: "Nutrition Analysis Results", ta: "ஊட்டச்சத்து பகுப்பாய்வு முடிவுகள்" },
  healthScore: { en: "Health Score", ta: "ஆரோக்கிய மதிப்பீடு" },
  serving: { en: "Serving", ta: "பரிமாறல்" },
  caloriesPerServing: { en: "Calories per serving", ta: "ஒரு பரிமாறலுக்கான கலோரிகள்" },
  macroBreakdown: { en: "Macro Breakdown", ta: "மேக்ரோ ஊட்டச்சத்து விவரம்" },
  calories: { en: "Calories", ta: "கலோரிகள்" },
  protein: { en: "Protein", ta: "புரதம்" },
  carbs: { en: "Carbs", ta: "கார்போஹைட்ரேட்" },
  totalFat: { en: "Total Fat", ta: "மொத்த கொழுப்பு" },
  goodFat: { en: "Good Fat", ta: "நல்ல கொழுப்பு" },
  badFat: { en: "Bad Fat", ta: "கெட்ட கொழுப்பு" },
  fiber: { en: "Fiber", ta: "நார்ச்சத்து" },
  sugar: { en: "Sugar", ta: "சர்க்கரை" },
  sodium: { en: "Sodium", ta: "சோடியம்" },
  vitamins: { en: "Vitamins", ta: "வைட்டமின்கள்" },
  minerals: { en: "Minerals", ta: "தாதுக்கள்" },
  healthTip: { en: "Health Tip", ta: "ஆரோக்கிய குறிப்பு" },
  addToTracker: { en: "Add to Tracker", ta: "டிராக்கரில் சேர்" },
  voice: { en: "Voice", ta: "குரல்" },
  stop: { en: "Stop", ta: "நிறுத்து" },
  speaking: { en: "Speaking nutrition info...", ta: "ஊட்டச்சத்து விவரம் ஒலிக்கிறது..." },
  excellent: { en: "Excellent", ta: "மிகச் சிறந்தது" },
  good: { en: "Good", ta: "நல்லது" },
  average: { en: "Average", ta: "சராசரி" },
  poor: { en: "Poor", ta: "மோசமானது" },
} as const;

// Comprehensive Tamil Food Name Translation Dictionary
const foodNameTamilMap: Record<string, string> = {
  // Fruits
  apple: "ஆப்பிள்",
  banana: "வாழைப்பழம்",
  orange: "ஆரஞ்சு",
  mango: "மாம்பழம்",
  grapes: "திராட்சை",
  watermelon: "தர்பூசணி",
  papaya: "பப்பாளி",
  pomegranate: "மாதுளை",
  pineapple: "அன்னாசிப்பழம்",
  guava: "கொய்யாப்பழம்",
  coconut: "தேங்காய்",

  // Vegetables
  carrot: "கேரட்",
  tomato: "தக்காளி",
  potato: "உருளைக்கிழங்கு",
  onion: "வெங்காயம்",
  broccoli: "ப்ரோக்கோலி",
  spinach: "கீரை",
  beetroot: "பீட்ரூட்",
  cabbage: "முட்டைக்கோஸ்",
  cucumber: "வெள்ளரிக்காய்",
  mushroom: "காளான்",
  "ladies finger": "வெண்டைக்காய்",
  "ladies finger (okra)": "வெண்டைக்காய்",
  okra: "வெண்டைக்காய்",
  "bitter gourd": "பாகற்காய்",
  drumstick: "முருங்கைக்காய்",
  "drumstick (moringa)": "முருங்கைக்காய்",

  // Grains
  rice: "சாதம்",
  chapati: "சப்பாத்தி",
  bread: "ரொட்டி",
  oats: "ஓட்ஸ்",
  corn: "மக்காச்சோளம்",

  // Protein
  egg: "முட்டை",
  chicken: "சிக்கன்",
  fish: "மீன்",
  mutton: "ஆட்டு இறைச்சி",
  prawns: "இறால்",
  "soya chunks": "சோயா சங்ஸ்",
  paneer: "பன்னீர்",
  tofu: "டோஃபு",
  dal: "பருப்பு",
  "dal (lentils)": "பருப்பு",

  // Dairy
  milk: "பால்",
  curd: "தயிர்",
  "curd / yogurt": "தயிர்",
  yogurt: "தயிர்",
  buttermilk: "மோர்",
  ghee: "நெய்",
  cheese: "சீஸ்",

  // South Indian
  dosa: "தோசை",
  idli: "இட்லி",
  vada: "வடை",
  pongal: "பொங்கல்",
  upma: "உப்மா",
  uttapam: "ஊத்தப்பம்",
  sambar: "சாம்பார்",
  rasam: "ரசம்",
  puttu: "புட்டு",
  appam: "ஆப்பம்",
  poori: "பூரி",
  parotta: "பரோட்டா",
  biryani: "பிரியாணி",
  "chicken biryani": "சிக்கன் பிரியாணி",
  "mutton biryani": "மட்டன் பிரியாணி",
  "veg biryani": "வெஜ் பிரியாணி",
  "curd rice": "தயிர் சாதம்",
  "lemon rice": "எலுமிச்சை சாதம்",
  "sambar rice": "சாம்பார் சாதம்",

  // Snacks & Others
  samosa: "சமோசா",
  bajji: "பஜ்ஜி",
  pakoda: "பக்கோடா",
  pizza: "பீட்சா",
  burger: "பர்கர்",
  sandwich: "சாண்ட்விச்",
  noodles: "நூடுல்ஸ்",
  pasta: "பாஸ்தா",
  salad: "சாலட்",
  tea: "தேநீர்",
  coffee: "காபி",
  "combined meal": "கூட்டு உணவு",
  total: "மொத்தம்",
};

/** Translates food name into Tamil Unicode */
export function translateFoodName(name: string): string {
  if (!name) return "";
  const trimmed = name.trim();

  // If combined foods like "Idli + Sambar"
  if (trimmed.includes("+")) {
    return trimmed
      .split("+")
      .map((part) => translateFoodName(part.trim()))
      .join(" + ");
  }

  const lower = trimmed.toLowerCase();
  if (foodNameTamilMap[lower]) {
    return foodNameTamilMap[lower];
  }

  // Look for partial match
  for (const [key, val] of Object.entries(foodNameTamilMap)) {
    if (lower.includes(key)) {
      return val;
    }
  }

  return trimmed;
}

/** Translates health rating score label to Tamil */
export function translateHealthLabel(label: string, lang: Lang): string {
  if (lang === "en") return label;
  const l = (label || "").toLowerCase();
  if (l.includes("excellent")) return "மிகச் சிறந்தது";
  if (l.includes("good")) return "நல்லது";
  if (l.includes("average")) return "சராசரி";
  if (l.includes("poor")) return "மோசமானது";
  return label;
}

/** Translates serving label into Tamil Unicode */
export function translateServing(label?: string, lang?: Lang): string {
  if (!label) return "";
  if (lang !== "ta") return label;

  return label
    .replace(/pieces?/gi, "துண்டு")
    .replace(/piece/gi, "துண்டு")
    .replace(/serving/gi, "பரிமாறல்")
    .replace(/cups?/gi, "கப்")
    .replace(/of/gi, "இல்");
}

/** Translates health tips into natural, fluent Tamil */
export function translateHealthTip(foodName: string, englishTip?: string): string {
  const tip = (englishTip || "").toLowerCase();
  const name = (foodName || "").toLowerCase();

  if (tip.includes("apple") || name.includes("apple")) {
    return "நார்ச்சத்து மற்றும் ஆன்டிஆக்ஸிடன்ட்கள் நிறைந்தது. தினமும் ஒரு ஆப்பிள் உண்பது மருத்துவரை தள்ளி வைக்கும்!";
  }
  if (tip.includes("banana") || name.includes("banana")) {
    return "உடற்பயிற்சிக்கு முந்தைய சிறந்த உணவு! தசை மற்றும் இதய ஆரோக்கியத்திற்கு பொட்டாசியம் நிறைந்தது.";
  }
  if (tip.includes("vitamin c") || tip.includes("immunity") || name.includes("orange") || name.includes("lemon")) {
    return "வைட்டமின் சி நிறைந்தது. நோய் எதிர்ப்பு சக்தியையும் சரும ஆரோக்கியத்தையும் அதிகரிக்கிறது.";
  }
  if (tip.includes("protein") || name.includes("egg") || name.includes("chicken") || name.includes("fish")) {
    return "அதிக புரதச்சத்து நிறைந்தது. தசை வளர்ச்சிக்கும் உடல் வலிமைக்கும் சிறந்தது.";
  }
  if (tip.includes("omega-3") || name.includes("fish")) {
    return "ஒமேகா-3 கொழுப்பு அமிலம் நிறைந்தது. இதயம் மற்றும் மூளை ஆரோக்கியத்திற்கு மிகவும் நல்லது.";
  }
  if (tip.includes("fiber") || tip.includes("cholesterol") || name.includes("oats")) {
    return "நார்ச்சத்து நிறைந்தது. கொழுப்பை குறைக்கவும் இதயத்தை ஆரோக்கியமாக வைத்திருக்கவும் உதவும்.";
  }
  if (tip.includes("probiotic") || tip.includes("digestion") || name.includes("curd") || name.includes("buttermilk")) {
    return "சிறந்த புரோபயாடிக் உணவு. செரிமானத்திற்கும் குடல் ஆரோக்கியத்திற்கும் மிகவும் நல்லது.";
  }
  if (tip.includes("fermented") || name.includes("idli") || name.includes("dosa")) {
    return "நொதிக்க வைக்கப்பட்ட உணவு. எளிதில் செரிமானமாகக்கூடியது மற்றும் உடலுக்கு உடனடி ஆற்றல் தரும்.";
  }
  if (tip.includes("water") || tip.includes("hydration") || name.includes("watermelon") || name.includes("cucumber")) {
    return "அதிக நீர்ச்சத்து நிறைந்தது. உடலுக்கு குளிர்ச்சியையும் உடனடி நீரேற்றத்தையும் தருகிறது.";
  }
  if (tip.includes("iron") || name.includes("spinach") || name.includes("beetroot")) {
    return "இரும்புச்சத்து நிறைந்தது. இரத்த ஓட்டத்தை மேம்படுத்தி உடலுக்கு புத்துணர்ச்சி தரும்.";
  }
  if (tip.includes("calcium") || name.includes("milk") || name.includes("paneer")) {
    return "கால்சியம் நிறைந்தது. எலும்புகள் மற்றும் பற்களை வலிமையாக்க உதவுகிறது.";
  }
  if (tip.includes("sugar") || tip.includes("fried") || tip.includes("moderation")) {
    return "கலோரிகள் அதிகம் உள்ளதால் அளவோடு உண்பது நல்லது.";
  }

  // Fallback natural Tamil tip
  return "ஆரோக்கியமான சமச்சீர் உணவை அளவோடு உட்கொள்வது உடலுக்கும் மனதிற்கும் புத்துணர்ச்சி தரும்.";
}

/**
 * Returns available voices from SpeechSynthesis with async fallback
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices() || [];
}

/**
 * Selects the best voice strictly matching the selected language.
 * Never crosses languages (Tamil will never use an English voice, and vice-versa).
 */
export function findBestVoice(
  lang: Lang,
  voices: SpeechSynthesisVoice[]
): { voice: SpeechSynthesisVoice | null; supported: boolean } {
  if (!voices || voices.length === 0) {
    return { voice: null, supported: false };
  }

  if (lang === "ta") {
    // 1. Exact ta-IN match
    const exactTaIn = voices.find((v) => {
      const l = (v.lang || "").toLowerCase().replace("_", "-");
      return l === "ta-in";
    });
    if (exactTaIn) return { voice: exactTaIn, supported: true };

    // 2. Any voice starting with "ta" (e.g. ta-LK, ta-SG, ta)
    const anyTa = voices.find((v) => (v.lang || "").toLowerCase().startsWith("ta"));
    if (anyTa) return { voice: anyTa, supported: true };

    // 3. Any voice where name includes "tamil" or "தமிழ்"
    const nameTa = voices.find(
      (v) =>
        (v.name || "").toLowerCase().includes("tamil") ||
        (v.name || "").includes("தமிழ்")
    );
    if (nameTa) return { voice: nameTa, supported: true };

    // STRICT: Do NOT return an English voice for Tamil
    return { voice: null, supported: false };
  } else {
    // English
    // 1. Prefer en-IN (Indian English, natural for regional food terms)
    const enIn = voices.find((v) => {
      const l = (v.lang || "").toLowerCase().replace("_", "-");
      return l === "en-in";
    });
    if (enIn) return { voice: enIn, supported: true };

    // 2. Then en-US
    const enUs = voices.find((v) => {
      const l = (v.lang || "").toLowerCase().replace("_", "-");
      return l === "en-us";
    });
    if (enUs) return { voice: enUs, supported: true };

    // 3. Then any voice starting with "en"
    const anyEn = voices.find((v) => (v.lang || "").toLowerCase().startsWith("en"));
    if (anyEn) return { voice: anyEn, supported: true };

    // Fallback to default voice if it is English
    const def = voices.find((v) => v.default && (v.lang || "").toLowerCase().startsWith("en"));
    if (def) return { voice: def, supported: true };

    return { voice: anyEn || voices[0] || null, supported: true };
  }
}

export interface SpeakResult {
  success: boolean;
  utterance?: SpeechSynthesisUtterance;
  error?: "UNSUPPORTED_BROWSER" | "NO_TAMIL_VOICE" | "SPEAK_FAILED";
  message?: string;
}

/**
 * Executes text-to-speech strictly in the chosen language.
 * Cancels any active speech before starting.
 */
export function speakText(text: string, lang: Lang): SpeakResult {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return {
      success: false,
      error: "UNSUPPORTED_BROWSER",
      message: "Text-to-speech is not supported on this browser.",
    };
  }

  // 1. Stop any currently playing speech immediately
  window.speechSynthesis.cancel();

  // 2. Refresh available voices from the browser
  const voices = window.speechSynthesis.getVoices();
  const { voice, supported } = findBestVoice(lang, voices);

  // 3. Handle missing voice gracefully (especially Tamil on devices lacking Tamil TTS)
  if (lang === "ta" && !supported) {
    return {
      success: false,
      error: "NO_TAMIL_VOICE",
      message: "Tamil voice is not available on this device. Please install or enable a Tamil text-to-speech voice in device settings.",
    };
  }

  try {
    // 4. Create a fresh utterance strictly for the current language
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === "ta" ? "ta-IN" : (voice?.lang || "en-IN");

    if (voice) {
      utter.voice = voice;
    }

    utter.rate = lang === "ta" ? 0.92 : 0.95;
    utter.pitch = 1.0;

    window.speechSynthesis.speak(utter);
    return { success: true, utterance: utter };
  } catch (err: any) {
    return {
      success: false,
      error: "SPEAK_FAILED",
      message: err?.message || "Speech synthesis failed.",
    };
  }
}

/**
 * Builds the natural-sounding speech script in English or Tamil Unicode.
 */
export function nutritionScript(
  name: string,
  cal: number,
  protein: number,
  carbs: number,
  fat: number,
  healthTip: string,
  lang: Lang
): string {
  if (lang === "ta") {
    const taName = translateFoodName(name);
    const taTip = translateHealthTip(name, healthTip);
    return `இந்த ${taName} உணவு ஒரு பரிமாறலுக்கு ${cal} கலோரிகள், ${protein} கிராம் புரதம், ${carbs} கிராம் கார்போஹைட்ரேட், மற்றும் ${fat} கிராம் கொழுப்பு கொண்டுள்ளது. ஆரோக்கிய குறிப்பு: ${taTip}`;
  }
  return `This ${name} contains ${cal} calories, ${protein} grams of protein, ${carbs} grams of carbohydrates, and ${fat} grams of fat. Health tip: ${healthTip}`;
}
