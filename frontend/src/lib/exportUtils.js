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

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${subject} - ${chapter}.txt`;
  a.click();
  URL.revokeObjectURL(url);
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

  // Line
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);
  y += 8;

  // Key Concepts
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Key Concepts", 20, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  content.key_concepts.forEach((c) => {
    const lines = doc.splitTextToSize(`• ${c}`, pageWidth - 45);
    if (y + lines.length * 5 > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, 25, y);
    y += lines.length * 5 + 2;
  });
  y += 4;

  // Formulas
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  if (y > 260) { doc.addPage(); y = 20; }
  doc.text("Important Formulas", 20, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (content.formulas.length > 0) {
    content.formulas.forEach((f) => {
      const text = `${f.formula}  —  ${f.meaning}`;
      const lines = doc.splitTextToSize(text, pageWidth - 45);
      if (y + lines.length * 5 > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(lines, 25, y);
      y += lines.length * 5 + 2;
    });
  } else {
    doc.text("(No formulas for this chapter)", 25, y);
    y += 7;
  }
  y += 4;

  // Explanation
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  if (y > 260) { doc.addPage(); y = 20; }
  doc.text("Explanation", 20, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const expLines = doc.splitTextToSize(content.explanation, pageWidth - 45);
  if (y + expLines.length * 5 > 280) {
    doc.addPage();
    y = 20;
  }
  doc.text(expLines, 25, y);
  y += expLines.length * 5 + 6;

  // Quick Revision
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  if (y > 260) { doc.addPage(); y = 20; }
  doc.text("Quick Revision", 20, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  content.quick_revision.forEach((r, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${r}`, pageWidth - 45);
    if (y + lines.length * 5 > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, 25, y);
    y += lines.length * 5 + 2;
  });

  doc.save(`${subject} - ${chapter}.pdf`);
}
