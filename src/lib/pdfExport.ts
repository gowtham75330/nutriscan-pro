import jsPDF from "jspdf";
import type { NutritionInfo } from "@/data/nutritionData";
import { healthScore } from "./nutritionUtils";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;
const COL_LABEL_X = MARGIN + 6;         // nutrient name, left-aligned
const COL_VALUE_X = PAGE_W - MARGIN - 6; // nutrient value, right-aligned
const ROW_H = 9;
const SECTION_PADDING = 5;
const OVERFLOW_THRESHOLD = 270;

// Brand colours
const GREEN: [number, number, number] = [38, 177, 94];
const GREEN_DARK: [number, number, number] = [28, 130, 70];
const GREEN_BG: [number, number, number] = [240, 252, 244];
const GRAY_LIGHT: [number, number, number] = [250, 250, 250];
const GRAY_ROW: [number, number, number] = [245, 245, 245];
const GRAY_LINE: [number, number, number] = [215, 215, 215];
const GRAY_TEXT: [number, number, number] = [100, 100, 100];
const DARK_TEXT: [number, number, number] = [30, 30, 30];
const MID_TEXT: [number, number, number] = [60, 60, 60];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Clean string for jsPDF Helvetica font — removes emoji and non-printable characters. */
function cleanForPdf(text: string): string {
  if (!text) return "";
  return text
    // Remove all emojis and pictographs
    .replace(
      /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2B00}-\u{2BFF}]|[\u{FE00}-\u{FEFF}]|[\u{1F300}-\u{1F9FF}]|\p{Emoji_Presentation}/gu,
      ""
    )
    // Only allow safe Latin / ASCII printable characters for standard Helvetica font
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Guard: if y would overflow the usable area, add a new page and reset y. */
function checkOverflow(doc: jsPDF, y: number, needed = 0): number {
  if (y + needed > OVERFLOW_THRESHOLD) {
    doc.addPage();
    return 20;
  }
  return y;
}

/** Draw a light card background behind a section. */
function drawCard(
  doc: jsPDF,
  y: number,
  height: number,
  fillColor: [number, number, number] = GRAY_LIGHT
): void {
  doc.setFillColor(...fillColor);
  doc.setDrawColor(...GRAY_LINE);
  doc.setLineWidth(0.2);
  doc.roundedRect(MARGIN, y, CONTENT_W, height, 2, 2, "FD");
}

/** Draw a section heading with a green accent bar. */
function drawSectionTitle(doc: jsPDF, title: string, y: number): void {
  // Green left accent bar
  doc.setFillColor(...GREEN);
  doc.rect(MARGIN, y - 3.5, 2.5, 7, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GREEN_DARK);
  doc.text(title, MARGIN + 5, y + 0.5);
}

/** Draw the green page header band. */
function drawHeader(doc: jsPDF): void {
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, PAGE_W, 20, "F");

  // Brand name
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("NutriScan Pro", MARGIN, 11);

  // Sub-tagline
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(210, 245, 220);
  doc.text("Smart Food Nutrition Analyzer", MARGIN, 16.5);

  // Right label
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("NUTRITION REPORT", PAGE_W - MARGIN, 11, { align: "right" });
}

/** Draw the footer on the current page. */
function drawFooter(doc: jsPDF, dateStr: string): void {
  const footerY = PAGE_H - 8;
  doc.setDrawColor(...GRAY_LINE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, footerY - 3, PAGE_W - MARGIN, footerY - 3);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 160, 160);
  doc.text(
    `NutriScan Pro  |  AI Nutrition Analysis  |  Generated: ${dateStr}`,
    PAGE_W / 2,
    footerY,
    { align: "center" }
  );
}

// ─── Main export function ─────────────────────────────────────────────────────

/**
 * Exports a clean, professional NutriScan-branded nutrition report PDF.
 * Uses only built-in jsPDF methods (no jsPDF-autotable).
 * Emoji are stripped from all text because jsPDF Helvetica cannot render them.
 */
export function exportNutritionPDF(n: NutritionInfo): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const score = healthScore(n);
  const dateStr = new Date().toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const foodName = cleanForPdf(n.name) || "Food Nutrition Report";

  // ── HEADER ────────────────────────────────────────────────────────────────
  drawHeader(doc);

  // ── FOOD NAME CARD ────────────────────────────────────────────────────────
  let y = 28;
  drawCard(doc, y, 18, GREEN_BG);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_TEXT);
  doc.text(foodName, MARGIN + 4, y + 8);

  if (n.servingLabel) {
    const safeServing = cleanForPdf(n.servingLabel);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_TEXT);
    doc.text(`Serving: ${safeServing}`, MARGIN + 4, y + 14);
  }

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY_TEXT);
  doc.text(dateStr, PAGE_W - MARGIN - 4, y + 8, { align: "right" });

  y += 24;

  // ── NUTRITION BREAKDOWN ───────────────────────────────────────────────────
  const nutrients: { label: string; value: string; unit: string; highlight?: boolean }[] = [
    { label: "Calories", value: `${n.calories}`, unit: "kcal", highlight: true },
    { label: "Protein", value: `${n.protein}`, unit: "g" },
    { label: "Carbohydrates", value: `${n.carbs}`, unit: "g" },
    { label: "Total Fat", value: `${n.fat}`, unit: "g" },
    { label: "Good Fat (Unsaturated)", value: `${n.goodFat}`, unit: "g" },
    { label: "Bad Fat (Saturated)", value: `${n.badFat}`, unit: "g" },
  ];
  if (n.fiber !== undefined)
    nutrients.push({ label: "Dietary Fiber", value: `${n.fiber}`, unit: "g" });
  if (n.sugar !== undefined)
    nutrients.push({ label: "Total Sugar", value: `${n.sugar}`, unit: "g" });
  if (n.sodium !== undefined)
    nutrients.push({ label: "Sodium", value: `${n.sodium}`, unit: "mg" });

  // Table dimensions
  const tableHeaderH = 9;
  const tableBodyH = nutrients.length * ROW_H;
  const tableH = tableHeaderH + tableBodyH + 18;
  y = checkOverflow(doc, y, tableH);
  if (y === 20) drawHeader(doc);

  // Section title
  drawSectionTitle(doc, "Nutrition Breakdown", y + 6);
  y += 12;

  // Table coordinates
  const tableLeft = MARGIN;
  const tableRight = PAGE_W - MARGIN;
  const tableTop = y;

  // Header row
  doc.setFillColor(...GREEN);
  doc.rect(tableLeft, tableTop, CONTENT_W, tableHeaderH, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("NUTRIENT", tableLeft + 5, tableTop + 6);
  doc.text("AMOUNT", tableRight - 5, tableTop + 6, { align: "right" });

  let curRowTop = tableTop + tableHeaderH;

  // Table body rows
  nutrients.forEach(({ label, value, unit, highlight }, idx) => {
    // Alternating row backgrounds
    if (highlight) {
      doc.setFillColor(...GREEN_BG);
      doc.rect(tableLeft, curRowTop, CONTENT_W, ROW_H, "F");
    } else if (idx % 2 === 0) {
      doc.setFillColor(...GRAY_ROW);
      doc.rect(tableLeft, curRowTop, CONTENT_W, ROW_H, "F");
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(tableLeft, curRowTop, CONTENT_W, ROW_H, "F");
    }

    // Bottom divider line for every row
    doc.setDrawColor(...GRAY_LINE);
    doc.setLineWidth(0.2);
    doc.line(tableLeft, curRowTop + ROW_H, tableRight, curRowTop + ROW_H);

    // Label text — all aligned to exact same left margin (tableLeft + 5)
    doc.setFontSize(9.5);
    doc.setFont("helvetica", highlight ? "bold" : "normal");
    doc.setTextColor(...(highlight ? GREEN_DARK : MID_TEXT));
    doc.text(label, tableLeft + 5, curRowTop + 5.8);

    // Value + Unit (right-aligned)
    const displayValue = `${value} ${unit}`;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...(highlight ? GREEN_DARK : DARK_TEXT));
    doc.text(displayValue, tableRight - 5, curRowTop + 5.8, { align: "right" });

    curRowTop += ROW_H;
  });

  // Table outer border
  const totalTableH = curRowTop - tableTop;
  doc.setDrawColor(...GRAY_LINE);
  doc.setLineWidth(0.3);
  doc.rect(tableLeft, tableTop, CONTENT_W, totalTableH, "S");

  y = curRowTop + 8;

  // ── HEALTH SCORE ──────────────────────────────────────────────────────────
  y = checkOverflow(doc, y, 30);
  if (y === 20) drawHeader(doc);

  drawCard(doc, y, 30);
  drawSectionTitle(doc, "Health Score", y + 8);
  y += 16;

  // Score badge — centered pill
  const badgeW = 44;
  const badgeH = 10;
  doc.setFillColor(...GREEN);
  doc.roundedRect(COL_LABEL_X, y - 5.5, badgeW, badgeH, 3, 3, "F");
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`${score.score} / 100`, COL_LABEL_X + badgeW / 2, y + 1.5, { align: "center" });

  // Label text beside badge
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_TEXT);
  doc.text(score.label, COL_LABEL_X + badgeW + 6, y + 1.5);

  y += 18;

  // ── VITAMINS & MINERALS ───────────────────────────────────────────────────
  const vitText =
    n.vitamins.length > 0 ? n.vitamins.join(", ") : "Not specified";
  const minText =
    n.minerals.length > 0 ? n.minerals.join(", ") : "Not specified";
  const wrapWidth = CONTENT_W - 42;
  const vitLines = doc.splitTextToSize(vitText, wrapWidth);
  const minLines = doc.splitTextToSize(minText, wrapWidth);
  const vmCardH =
    SECTION_PADDING * 2 +
    14 +
    vitLines.length * 5.5 +
    minLines.length * 5.5 +
    6;

  y = checkOverflow(doc, y, vmCardH);
  if (y === 20) drawHeader(doc);

  drawCard(doc, y, vmCardH);
  drawSectionTitle(doc, "Vitamins & Minerals", y + 8);
  y += 16;

  // Vitamins row
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GREEN_DARK);
  doc.text("Vitamins:", COL_LABEL_X, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);
  doc.text(vitLines, COL_LABEL_X + 28, y);
  y += Math.max(7, vitLines.length * 5.5) + 3;

  // Minerals row
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GREEN_DARK);
  doc.text("Minerals:", COL_LABEL_X, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);
  doc.text(minLines, COL_LABEL_X + 28, y);
  y += Math.max(7, minLines.length * 5.5) + SECTION_PADDING;

  // ── HEALTH TIP ────────────────────────────────────────────────────────────
  const tipText = cleanForPdf(n.healthTip || "");
  if (tipText) {
    const tipLines = doc.splitTextToSize(tipText, CONTENT_W - 16);
    const tipCardH = tipLines.length * 5.5 + SECTION_PADDING * 2 + 12;

    y = checkOverflow(doc, y, tipCardH);
    if (y === 20) drawHeader(doc);

    drawCard(doc, y, tipCardH, [245, 255, 248]);
    drawSectionTitle(doc, "Health Tip", y + 8);
    y += 16;

    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(30, 80, 50);
    doc.text(tipLines, COL_LABEL_X + 2, y);
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  drawFooter(doc, dateStr);

  // ── SAVE ──────────────────────────────────────────────────────────────────
  const safeName = foodName
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 40);
  doc.save(`NutriScan_${safeName}_Report.pdf`);
}
