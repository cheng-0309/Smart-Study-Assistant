import { motion } from "framer-motion";
import {
  DownloadSimple,
  FileText,
  FilePdf,
  Lightbulb,
  MathOperations,
  Article,
  ListChecks,
  BookOpenText,
  Separator,
} from "@phosphor-icons/react";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { exportAsText, exportAsPDF } from "../lib/exportUtils";

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" },
  }),
};

function SectionLabel({ icon: Icon, label, number }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-7 h-7 rounded-sm bg-[hsl(var(--primary)/0.1)] flex items-center justify-center shrink-0">
        <Icon weight="bold" className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
      </div>
      <div>
        {number && <span className="font-mono text-[10px] text-muted-foreground block leading-none mb-0.5">Section {number}</span>}
        <span className="overline text-foreground">{label}</span>
      </div>
    </div>
  );
}

function NoteTitle({ subject, chapter, note }) {
  return (
    <div className="border border-border bg-card p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpenText weight="bold" className="w-5 h-5 text-[hsl(var(--primary))]" />
            <h2 className="text-lg font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              Notes
            </h2>
          </div>
          <div className="overline text-muted-foreground mb-1">{subject}</div>
          <h3
            className="text-xl md:text-2xl font-black tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {chapter}
          </h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button data-testid="export-btn" variant="outline" className="rounded-sm h-9 gap-2 border-border">
              <DownloadSimple weight="bold" className="w-4 h-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-sm">
            <DropdownMenuItem data-testid="export-text-btn" onClick={() => exportAsText(note)} className="gap-2 cursor-pointer">
              <FileText className="w-4 h-4" /> Text File
            </DropdownMenuItem>
            <DropdownMenuItem data-testid="export-pdf-btn" onClick={() => exportAsPDF(note)} className="gap-2 cursor-pointer">
              <FilePdf className="w-4 h-4" /> PDF File
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function OverviewSection({ explanation }) {
  return (
    <motion.div custom={0} initial="hidden" animate="visible" variants={fadeIn} className="bento-full border border-border bg-card p-6" data-testid="overview-section">
      <SectionLabel icon={Article} label="Overview" number="01" />
      <p className="text-sm leading-relaxed text-foreground">{explanation}</p>
    </motion.div>
  );
}

function KeyConceptsSection({ concepts }) {
  return (
    <motion.div custom={1} initial="hidden" animate="visible" variants={fadeIn} className="bento-hero border border-border bg-card p-6" data-testid="key-concepts-section">
      <SectionLabel icon={Lightbulb} label="Key Concepts" number="02" />
      <ul className="space-y-2.5">
        {concepts.map((concept, i) => (
          <li key={`concept-${concept.slice(0, 20)}-${i}`} className="flex items-start gap-3 text-sm leading-relaxed">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-sm bg-[hsl(var(--primary)/0.08)] font-mono text-[10px] font-bold text-[hsl(var(--primary))] mt-0.5 shrink-0">
              {i + 1}
            </span>
            {concept}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function FormulasSection({ formulas }) {
  return (
    <motion.div custom={2} initial="hidden" animate="visible" variants={fadeIn} className="bento-square border border-border bg-card p-6" data-testid="formulas-section">
      <SectionLabel icon={MathOperations} label="Important Formulas" number="03" />
      {formulas.length > 0 ? (
        <div className="space-y-3">
          {formulas.map((f) => (
            <div key={`formula-${f.formula}`} className="border border-border p-3 bg-background rounded-sm">
              <code className="text-sm font-bold font-mono text-[hsl(var(--primary))] block mb-1">{f.formula}</code>
              <span className="text-xs text-muted-foreground">{f.meaning}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">No formulas for this chapter.</p>
      )}
    </motion.div>
  );
}

function QuickRevisionSection({ points }) {
  return (
    <motion.div custom={3} initial="hidden" animate="visible" variants={fadeIn} className="bento-full border border-border bg-card p-6" data-testid="quick-revision-section">
      <SectionLabel icon={ListChecks} label="Quick Revision" number="04" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
        {points.map((point, i) => (
          <div key={`rev-${point.slice(0, 20)}-${i}`} className="flex items-start gap-3 text-sm leading-relaxed p-2 rounded-sm hover:bg-muted/30 transition-colors">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-sm bg-[hsl(var(--primary)/0.08)] font-mono text-[10px] font-bold text-[hsl(var(--primary))] mt-0.5 shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
            {point}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function NoteDisplay({ note }) {
  if (!note) return null;

  const { subject, chapter, content } = note;

  return (
    <div data-testid="note-display" className="space-y-0">
      <NoteTitle subject={subject} chapter={chapter} note={note} />

      <div className="bento-grid">
        <OverviewSection explanation={content.explanation} />
        <KeyConceptsSection concepts={content.key_concepts} />
        <FormulasSection formulas={content.formulas} />
        <QuickRevisionSection points={content.quick_revision} />
      </div>
    </div>
  );
}
