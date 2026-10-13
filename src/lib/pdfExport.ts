import jsPDF from "jspdf";
import type { NutritionInfo } from "@/data/nutritionData";
import { healthScore } from "./nutritionUtils";

/**
 * Exports a clean, NutriScan-branded nutrition report PDF.
 * Contains ONLY nutrition-relevant data.
 * No external links or unrelated content.
 */
export function exportNutritionPDF(n: NutritionInfo) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const score = healthScore(n);
  const W = 210;
  const margin = 14;
  const colLabel = margin + 4;
  const colValue = margin + 90;

  // HEADER
  doc.setFillColor(38, 177, 94);
  doc.rect(0, 0, W, 16, "F");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("NutriScan Pro", margin, 10);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Smart Food Nutrition Analyzer", margin, 14.5);
  doc.setFontSize(9);
  doc.setTextColor(220, 255, 230);
  doc.text("NUTRITION REPORT", W - margin, 10, { align: "right" });

  // FOOD NAME
  let y = 26;
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.text(`${n.emoji ?? ""} ${n.name}`, margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, margin, y);
  if (n.servingLabel) {
    y += 5;
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "bold");
    doc.text("Serving Size: ", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(n.servingLabel, margin + 30, y);
  }

  // DIVIDER
  y += 5;
  doc.setDrawColor(38, 177, 94);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);

  // NUTRITION BREAKDOWN
  y += 7;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(38, 130, 70);
  doc.text("Nutrition Breakdown", margin, y);

  const nutrients: { label: string; value: string; highlight?: boolean }[] = [
    { label: "Calories", value: `${n.calories} kcal`, highlight: true },
    { label: "Protein", value: `${n.protein} g` },
    { label: "Carbohydrates", value: `${n.carbs} g` },
    { label: "Total Fat", value: `${n.fat} g` },
    { label: "  Good Fat (Unsaturated)", value: `${n.goodFat} g` },
    { label: "  Bad Fat (Saturated)", value: `${n.badFat} g` },
  ];
  if (n.fiber !== undefined) nutrients.push({ label: "Dietary Fiber", value: `${n.fiber} g` });
  if (n.sugar !== undefined) nutrients.push({ label: "Total Sugar", value: `${n.sugar} g` });
  if (n.sodium !== undefined) nutrients.push({ label: "Sodium", value: `${n.sodium} mg` });

  nutrients.forEach(({ label, value, highlight }) => {
    y += 7;
    if (highlight) {
      doc.setFillColor(240, 252, 244);
      doc.roundedRect(margin, y - 5, W - margin * 2, 7, 1.5, 1.5, "F");
    }
    doc.setFont("helvetica", highlight ? "bold" : "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(label, colLabel, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(highlight ? 38 : 20, highlight ? 130 : 20, highlight ? 70 : 20);
    doc.text(value, colValue, y);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 2, W - margin, y + 2);
  });

  // HEALTH SCORE
  y += 10;
  doc.setDrawColor(38, 177, 94);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 7;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(38, 130, 70);
  doc.text("Health Score", margin, y);
  y += 7;
  doc.setFillColor(38, 177, 94);
  doc.roundedRect(margin, y - 5, 40, 9, 3, 3, "F");
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`${score.score} / 100`, margin + 4, y + 1);
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");
  doc.text(`— ${score.label}`, margin + 45, y + 1);

  // VITAMINS & MINERALS
  y += 10;
  doc.setDrawColor(38, 177, 94);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 7;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(38, 130, 70);
  doc.text("Vitamins & Minerals", margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("Vitamins:", colLabel, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  const vitText = n.vitamins.length > 0 ? n.vitamins.join(", ") : "Not specified";
  const vitLines = doc.splitTextToSize(vitText, W - colLabel - 30);
  doc.text(vitLines, colLabel + 22, y);

  y += Math.max(6, vitLines.length * 5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("Minerals:", colLabel, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  const minText = n.minerals.length > 0 ? n.minerals.join(", ") : "Not specified";
  const minLines = doc.splitTextToSize(minText, W - colLabel - 30);
  doc.text(minLines, colLabel + 22, y);

  // HEALTH TIP
  y += Math.max(10, minLines.length * 5 + 4);
  doc.setDrawColor(38, 177, 94);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 7;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(38, 130, 70);
  doc.text("Health Tip", margin, y);
  y += 6;
  doc.setFillColor(245, 255, 248);
  const tipLines = doc.splitTextToSize(n.healthTip || "", W - margin * 2 - 6);
  const tipBoxH = tipLines.length * 5 + 6;
  doc.roundedRect(margin, y - 4, W - margin * 2, tipBoxH, 2, 2, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 80, 50);
  doc.text(tipLines, margin + 3, y);

  // FOOTER
  const footerY = 287;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 3, W - margin, footerY - 3);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text("NutriScan Pro  |  Smart Food Nutrition Analyzer  |  Eat Smart, Live Strong.", margin, footerY);
  doc.text(new Date().toLocaleDateString("en-IN"), W - margin, footerY, { align: "right" });

  // SAVE
  const safeName = n.name.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_").slice(0, 40);
  doc.save(`NutriScan_${safeName}_Report.pdf`);
}
