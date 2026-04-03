import { jsPDF } from "jspdf";

const DIFFICULTY_LABELS = { easy: "Easy", medium: "Medium", hard: "Hard" };
const TYPE_LABELS = { quick_revision: "Quick Revision", detailed: "Detailed", exam_focused: "Exam-Focused" };

export function exportAsText(note) {
  const { subject, chapter, content, difficulty, note_type } = note;
  const diffLabel = DIFFICULTY_LABELS[difficulty] || difficulty || "Medium";
  const typeLabel = TYPE_LABELS[note_type] || note_type || "Detailed";

  let text = `STUDY NOTES\n`;
  text += `${"=".repeat(50)}\n`;
  text += `Subject: ${subject}\n`;
  text += `Topic: ${chapter}\n`;
  text += `Difficulty: ${diffLabel}\n`;
  text += `Note Type: ${typeLabel}\n`;
  text += `${"=".repeat(50)}\n\n`;

  if (content.title) {
    text += `${content.title}\n${"-".repeat(30)}\n\n`;
  }

  if (content.introduction) {
    text += `INTRODUCTION\n${"-".repeat(30)}\n`;
    text += `  ${content.introduction}\n\n`;
  }

  if (content.main_content && content.main_content.length > 0) {
    text += `MAIN CONTENT\n${"-".repeat(30)}\n`;
    content.main_content.forEach((section, i) => {
      text += `\n  ${i + 1}. ${section.heading}\n`;
      section.points.forEach((p) => {
        text += `     - ${p}\n`;
      });
    });
    text += `\n`;
  }

  if (content.examples && content.examples.length > 0) {
    text += `EXAMPLES\n${"-".repeat(30)}\n`;
    content.examples.forEach((ex, i) => {
      text += `  ${i + 1}. ${ex}\n`;
    });
    text += `\n`;
  }

  if (content.key_points && content.key_points.length > 0) {
    text += `KEY POINTS\n${"-".repeat(30)}\n`;
    content.key_points.forEach((kp, i) => {
      text += `  ${i + 1}. ${kp}\n`;
    });
    text += `\n`;
  }

  if (content.summary) {
    text += `SUMMARY\n${"-".repeat(30)}\n`;
    text += `  ${content.summary}\n`;
  }

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

function writePDFParagraph(doc, text, pageWidth, y) {
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(text, pageWidth - 45);
  y = ensurePageSpace(doc, y, lines.length * 5);
  doc.text(lines, 25, y);
  return y + lines.length * 5 + 4;
}

export function exportAsPDF(note) {
  const { subject, chapter, content, difficulty, note_type } = note;
  const diffLabel = DIFFICULTY_LABELS[difficulty] || difficulty || "Medium";
  const typeLabel = TYPE_LABELS[note_type] || note_type || "Detailed";
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(content.title || "STUDY NOTES", pageWidth / 2, y, { align: "center" });
  y += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Subject: ${subject}`, 20, y);
  y += 6;
  doc.text(`Topic: ${chapter}`, 20, y);
  y += 6;
  doc.text(`Difficulty: ${diffLabel}  |  Type: ${typeLabel}`, 20, y);
  y += 8;
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);
  y += 8;

  // Introduction
  if (content.introduction) {
    y = writePDFHeading(doc, "Introduction", y);
    y = writePDFParagraph(doc, content.introduction, pageWidth, y);
    y += 2;
  }

  // Main Content
  if (content.main_content && content.main_content.length > 0) {
    y = writePDFHeading(doc, "Main Content", y);
    for (const section of content.main_content) {
      y = ensurePageSpace(doc, y, 12);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(section.heading, 25, y);
      y += 6;
      y = writePDFBulletList(doc, section.points.map((p) => `\u2022 ${p}`), pageWidth, y);
      y += 2;
    }
    y += 2;
  }

  // Examples
  if (content.examples && content.examples.length > 0) {
    y = writePDFHeading(doc, "Examples", y);
    y = writePDFBulletList(doc, content.examples.map((e, i) => `${i + 1}. ${e}`), pageWidth, y);
    y += 4;
  }

  // Key Points
  if (content.key_points && content.key_points.length > 0) {
    y = writePDFHeading(doc, "Key Points", y);
    y = writePDFBulletList(doc, content.key_points.map((kp, i) => `${i + 1}. ${kp}`), pageWidth, y);
    y += 4;
  }

  // Summary
  if (content.summary) {
    y = writePDFHeading(doc, "Summary", y);
    y = writePDFParagraph(doc, content.summary, pageWidth, y);
  }

  doc.save(`${subject} - ${chapter}.pdf`);
}
