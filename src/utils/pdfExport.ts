import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export interface PdfExportOptions {
  title: string;
  markdown: string;
  routeDetected?: "chef" | "general" | string;
  tags?: string[];
  servings?: number;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    estimatedCost?: string;
  } | null;
  readingStats?: {
    words: number;
    readingTime: string;
    complexity?: string;
  };
  elementToCapture?: HTMLElement | null;
}

/**
 * Clean filename generator
 */
export function sanitizeFilename(title: string, extension: string = "pdf"): string {
  const clean = title
    .replace(/^[#\s🍳DORMCHEF:🧠UNTANGLEDNOTES]+/, "")
    .replace(/[^a-zA-Z0-9_\-\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 50);
  return `${clean || "skrible_document"}.${extension}`;
}

/**
 * High-fidelity Vector PDF generator.
 * Produces crisp, searchable, selectable vector text with pagination, headers, and footers.
 */
export async function exportToVectorPdf(options: PdfExportOptions): Promise<Blob> {
  const {
    title,
    markdown,
    routeDetected = "general",
    tags = [],
    servings,
    nutrition,
    readingStats,
  } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2;
  const marginTop = 22;
  const marginBottom = 20;

  let cursorY = marginTop;

  const isChef = routeDetected === "chef";
  const cleanTitle =
    title.replace(/^[#\s🍳DORMCHEF:🧠UNTANGLEDNOTES]+/, "").trim() ||
    (isChef ? "Dorm Chef Recipe" : "Untangled Notes");

  // Helper: check page break
  const ensureSpace = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      cursorY = marginTop;
      drawHeader();
    }
  };

  // Helper: draw running header on pages
  const drawHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(236, 72, 153); // #ec4899
    doc.text("skrible", marginX, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const subheader = isChef
      ? "/ dorm chef recipe & budget plan"
      : "/ untangled study notes";
    doc.text(subheader, marginX + 13, 12);

    const dateStr = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    doc.text(dateStr, pageWidth - marginX, 12, { align: "right" });

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(marginX, 15, pageWidth - marginX, 15);
  };

  // Draw initial header
  drawHeader();

  // Document Title
  cursorY += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize(cleanTitle, contentWidth);
  ensureSpace(titleLines.length * 8 + 4);
  doc.text(titleLines, marginX, cursorY);
  cursorY += titleLines.length * 8;

  // Metadata sub-bar: Reading stats, Servings, Date
  const metaParts: string[] = [];
  if (readingStats) {
    metaParts.push(`${readingStats.words.toLocaleString()} words`);
    metaParts.push(`${readingStats.readingTime} read`);
    if (readingStats.complexity) {
      metaParts.push(`${readingStats.complexity} complexity`);
    }
  }
  if (isChef && servings) {
    metaParts.push(`Yield: ${servings} serving${servings > 1 ? "s" : ""}`);
  }

  if (metaParts.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(110, 110, 110);
    doc.text(metaParts.join("  •  "), marginX, cursorY);
    cursorY += 5;
  }

  // Tags row if present
  if (tags && tags.length > 0) {
    let currentX = marginX;
    ensureSpace(8);
    for (const tag of tags.slice(0, 6)) {
      const tagText = `#${tag}`;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      const tagWidth = doc.getTextWidth(tagText) + 5;
      if (currentX + tagWidth > pageWidth - marginX) {
        currentX = marginX;
        cursorY += 6;
        ensureSpace(6);
      }
      // Draw tag pill background
      doc.setFillColor(250, 240, 245);
      doc.setDrawColor(240, 180, 210);
      doc.setLineWidth(0.2);
      doc.roundedRect(currentX, cursorY - 3.5, tagWidth, 4.8, 1.2, 1.2, "FD");

      // Draw tag text
      doc.setTextColor(219, 39, 119); // pink-600
      doc.text(tagText, currentX + 2.5, cursorY);
      currentX += tagWidth + 2.5;
    }
    cursorY += 7;
  }

  // Nutrition & Budget Callout Box if chef route and data present
  if (isChef && nutrition && (nutrition.calories || nutrition.protein || nutrition.estimatedCost)) {
    ensureSpace(18);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, cursorY, contentWidth, 14, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("Estimated Nutrition & Pantry Info:", marginX + 3.5, cursorY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    const nutParts: string[] = [];
    if (nutrition.calories) nutParts.push(`Calories: ~${nutrition.calories} kcal`);
    if (nutrition.protein) nutParts.push(`Protein: ~${nutrition.protein}g`);
    if (nutrition.carbs) nutParts.push(`Carbs: ~${nutrition.carbs}g`);
    if (nutrition.fat) nutParts.push(`Fat: ~${nutrition.fat}g`);
    if (nutrition.estimatedCost) nutParts.push(`Est. Cost: ${nutrition.estimatedCost}`);

    doc.text(nutParts.join("   |   "), marginX + 3.5, cursorY + 10);
    cursorY += 19;
  }

  // Divider line before content
  ensureSpace(4);
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.4);
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
  cursorY += 6;

  // Parse markdown content line by line
  const lines = markdown.split(/\r?\n/);
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  const flushCodeBuffer = () => {
    if (codeBuffer.length === 0) return;
    const codeText = codeBuffer.join("\n");
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    const splitCode = doc.splitTextToSize(codeText, contentWidth - 8);
    const boxHeight = splitCode.length * 3.8 + 4;
    ensureSpace(boxHeight);

    doc.setFillColor(245, 245, 245);
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.2);
    doc.roundedRect(marginX, cursorY, contentWidth, boxHeight, 1.5, 1.5, "FD");

    doc.setTextColor(40, 40, 40);
    doc.text(splitCode, marginX + 4, cursorY + 4);
    cursorY += boxHeight + 4;
    codeBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check code blocks
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        flushCodeBuffer();
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Skip empty lines
    if (trimmed.length === 0) {
      cursorY += 2.5;
      continue;
    }

    // Skip title if it duplicates cleanTitle
    if (i < 3 && trimmed.startsWith("# ") && trimmed.replace(/^#\s+/, "").trim() === cleanTitle) {
      continue;
    }

    // Headings
    if (trimmed.startsWith("# ")) {
      const heading = trimmed.replace(/^#\s+/, "").trim();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(20, 20, 20);
      const splitHeading = doc.splitTextToSize(heading, contentWidth);
      ensureSpace(splitHeading.length * 6.5 + 4);
      cursorY += 3;
      doc.text(splitHeading, marginX, cursorY);
      cursorY += splitHeading.length * 6.5 + 2;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      const heading = trimmed.replace(/^##\s+/, "").trim();
      const isIngredients = /ingredient/i.test(heading);
      const isSteps = /step|instruction|method|prep|direction/i.test(heading);

      ensureSpace(12);
      cursorY += 4;

      // Draw subtle accent bar on the left
      doc.setFillColor(
        isIngredients ? 16 : isSteps ? 236 : 236,
        isIngredients ? 185 : isSteps ? 72 : 72,
        isIngredients ? 129 : isSteps ? 153 : 153
      );
      doc.rect(marginX, cursorY - 4.5, 2.5, 6.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(15, 23, 42);
      const splitHeading = doc.splitTextToSize(heading, contentWidth - 6);
      doc.text(splitHeading, marginX + 5, cursorY);
      cursorY += splitHeading.length * 5.5 + 2;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      const heading = trimmed.replace(/^###\s+/, "").trim();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      const splitHeading = doc.splitTextToSize(heading, contentWidth);
      ensureSpace(splitHeading.length * 5 + 3);
      cursorY += 2;
      doc.text(splitHeading, marginX, cursorY);
      cursorY += splitHeading.length * 5 + 1.5;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const quote = trimmed.replace(/^>\s*/, "").trim();
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const splitQuote = doc.splitTextToSize(quote, contentWidth - 8);
      const quoteHeight = splitQuote.length * 4.2 + 3;
      ensureSpace(quoteHeight);

      doc.setFillColor(250, 248, 245);
      doc.rect(marginX, cursorY - 3, contentWidth, quoteHeight, "F");

      doc.setDrawColor(236, 72, 153);
      doc.setLineWidth(1);
      doc.line(marginX, cursorY - 3, marginX, cursorY - 3 + quoteHeight);

      doc.text(splitQuote, marginX + 4, cursorY);
      cursorY += quoteHeight + 1;
      continue;
    }

    // Numbered step / list item (e.g., "1.", "Step 1:", etc.)
    const stepMatch = trimmed.match(/^(\d+[\.\)]|Step\s+\d+[:\.]?)\s*(.*)/i);
    if (stepMatch) {
      const stepBadge = stepMatch[1];
      const stepText = stepMatch[2].replace(/\*\*/g, "");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      const badgeWidth = doc.getTextWidth(stepBadge) + 3;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const splitStep = doc.splitTextToSize(stepText, contentWidth - badgeWidth - 4);
      ensureSpace(splitStep.length * 4.4 + 2);

      // Draw step pill
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(marginX, cursorY - 3.2, badgeWidth, 4.4, 0.8, 0.8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      doc.text(stepBadge, marginX + 1.5, cursorY);

      // Draw step text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      doc.text(splitStep, marginX + badgeWidth + 3, cursorY);

      cursorY += splitStep.length * 4.4 + 2;
      continue;
    }

    // Unordered bullet item ("- ", "* ")
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const bulletText = trimmed.replace(/^[\-\*]\s+/, "").replace(/\*\*/g, "");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const splitBullet = doc.splitTextToSize(bulletText, contentWidth - 6);
      ensureSpace(splitBullet.length * 4.3 + 1.5);

      // Bullet dot
      doc.setFillColor(236, 72, 153);
      doc.circle(marginX + 2, cursorY - 1, 0.9, "F");

      doc.setTextColor(35, 35, 35);
      doc.text(splitBullet, marginX + 5, cursorY);
      cursorY += splitBullet.length * 4.3 + 1.5;
      continue;
    }

    // Regular paragraph text
    const cleanParagraph = trimmed.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(45, 45, 45);
    const splitParagraph = doc.splitTextToSize(cleanParagraph, contentWidth);
    ensureSpace(splitParagraph.length * 4.4 + 2);
    doc.text(splitParagraph, marginX, cursorY);
    cursorY += splitParagraph.length * 4.4 + 2;
  }

  if (inCodeBlock) {
    flushCodeBuffer();
  }

  // Add Page Numbers & Footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.text("Generated by skrible • untangled study notes & dorm chef", marginX, pageHeight - 8);

    const pageStr = `Page ${p} of ${totalPages}`;
    doc.text(pageStr, pageWidth - marginX, pageHeight - 8, { align: "right" });
  }

  return doc.output("blob");
}

/**
 * HTML2Canvas DOM snapshot PDF generator.
 * Accurately captures rendered charts, visual formatting, and layout.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: { title: string; routeDetected?: string }
): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    ignoreElements: (el) => {
      // Ignore interactive toolbars and hidden print elements
      const id = el.id;
      const classList = el.className || "";
      if (typeof classList === "string" && classList.includes("print:hidden")) return true;
      if (id === "output-toolbar" || id === "category-tags-bar") return false;
      return false;
    },
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth - 20; // 10mm margins
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 10; // 10mm top margin

  pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight, undefined, "FAST");
  heightLeft -= pdfHeight - 20;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 10;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pdfHeight - 20;
  }

  return pdf.output("blob");
}

/**
 * Triggers browser download of the generated PDF file.
 */
export function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Primary convenience function for downloading a clean PDF note
 */
export async function downloadNotePdf(options: PdfExportOptions): Promise<void> {
  const blob = await exportToVectorPdf(options);
  const filename = sanitizeFilename(options.title, "pdf");
  downloadPdfBlob(blob, filename);
}
