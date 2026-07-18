export type Lang = "en" | "ta";

export const t = {
  scan: { en: "Scan", ta: "ஸ்கேன்" },
  text: { en: "Text", ta: "எழுத்து" },
  compare: { en: "Compare", ta: "ஒப்பிடு" },
  recipe: { en: "Recipe", ta: "சமையல்" },
  tools: { en: "Health Tools", ta: "ஆரோக்கிய கருவிகள்" },
  tracker: { en: "Tracker", ta: "டிராக்கர்" },
} as const;

export function speakText(text: string, lang: Lang) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === "ta" ? "ta-IN" : "en-US";
  utter.rate = 0.95;
  utter.pitch = 1.05;
  // Try to pick a matching voice if available.
  const voices = speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang.toLowerCase().startsWith(utter.lang.toLowerCase()));
  if (match) utter.voice = match;
  speechSynthesis.speak(utter);
  return utter;
}

export function nutritionScript(
  name: string,
  cal: number, protein: number, carbs: number, fat: number,
  lang: Lang
): string {
  if (lang === "ta") {
    return `இந்த ${name} இல் ${cal} கலோரிகள், ${protein} கிராம் புரதம், ${carbs} கிராம் கார்போஹைட்ரேட், மற்றும் ${fat} கிராம் கொழுப்பு உள்ளது.`;
  }
  return `This ${name} contains ${cal} calories, ${protein} grams of protein, ${carbs} grams of carbohydrates, and ${fat} grams of fat.`;
}
