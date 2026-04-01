import { jsPDF } from "jspdf";

export function exportAsText(note) {
  const { subject, chapter, content } = note;
  let text = `STUDY NOTES\n`;
  text += `${"=".repeat(50)}\n`;
  text += `Subject: ${subject}\n`;
  text += `Chapter: ${chapter}\n`;
  text += `${"=".repeat(50)}\n\n`;

  text += `KEY CONCEPTS\n${"-".repeat(30)}\n`;
  content.key_concepts.forEach((c, i) => {
    text += `  ${i + 1}. ${c}\n`;
  });

  text += `\nIMPORTANT FORMULAS\n${"-".repeat(30)}\n`;
  if (content.formulas.length > 0) {
    content.formulas.forEach((f) => {
      text += `  ${f.formula}  —  ${f.meaning}\n`;
    });
  } else {
    text += `  (No formulas for this chapter)\n`;
  }

  text += `\nEXPLANATION\n${"-".repeat(30)}\n`;
  text += `  ${content.explanation}\n`;

  text += `\nQUICK REVISION\n${"-".repeat(30)}\n`;
  content.quick_revision.forEach((r, i) => {
    text += `  ${i + 1}. ${r}\n`;
  });

  downloadBlob(new Blob([text], { type: "text/plain" }), `${subject} - ${chapter}.txt`);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ensurePageSpace(doc, y, needed) {
  if (y + needed > 280) {
    doc.addPage();
    return 20;
  }
  return y;
}

function writePDFHeading(doc, title, y) {
  y = ensurePageSpace(doc, y, 15);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, y);
  return y + 7;
}

function writePDFBulletList(doc, items, pageWidth, y) {
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  for (const item of items) {
    const lines = doc.splitTextToSize(item, pageWidth - 45);
    y = ensurePageSpace(doc, y, lines.length * 5 + 2);
    doc.text(lines, 25, y);
    y += lines.length * 5 + 2;
  }
  return y;
}

export function exportAsPDF(note) {
  const { subject, chapter, content } = note;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("STUDY NOTES", pageWidth / 2, y, { align: "center" });
  y += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Subject: ${subject}`, 20, y);
  y += 6;
  doc.text(`Chapter: ${chapter}`, 20, y);
  y += 10;
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);
  y += 8;

  // Key Concepts
  y = writePDFHeading(doc, "Key Concepts", y);
  y = writePDFBulletList(doc, content.key_concepts.map((c) => `\u2022 ${c}`), pageWidth, y);
  y += 4;

  // Formulas
  y = writePDFHeading(doc, "Important Formulas", y);
  if (content.formulas.length > 0) {
    y = writePDFBulletList(doc, content.formulas.map((f) => `${f.formula}  \u2014  ${f.meaning}`), pageWidth, y);
  } else {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("(No formulas for this chapter)", 25, y);
    y += 7;
  }
  y += 4;

  // Explanation
  y = writePDFHeading(doc, "Explanation", y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const expLines = doc.splitTextToSize(content.explanation, pageWidth - 45);
  y = ensurePageSpace(doc, y, expLines.length * 5);
  doc.text(expLines, 25, y);
  y += expLines.length * 5 + 6;

  // Quick Revision
  y = writePDFHeading(doc, "Quick Revision", y);
  y = writePDFBulletList(doc, content.quick_revision.map((r, i) => `${i + 1}. ${r}`), pageWidth, y);

  doc.save(`${subject} - ${chapter}.pdf`);
}
