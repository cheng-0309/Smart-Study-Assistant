import { motion } from "framer-motion";
import {
  DownloadSimple,
  FileText,
  FilePdf,
  Lightbulb,
  Article,
  ListChecks,
  BookOpenText,
  Star,
  TextAlignLeft,
  Code,
} from "@phosphor-icons/react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
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

const DIFFICULTY_LABELS = { easy: "Easy", medium: "Medium", hard: "Hard" };
const TYPE_LABELS = { quick_revision: "Quick Revision", detailed: "Detailed", exam_focused: "Exam-Focused" };

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
  const diffLabel = DIFFICULTY_LABELS[note.difficulty] || note.difficulty;
  const typeLabel = TYPE_LABELS[note.note_type] || note.note_type;

  return (
    <div className="border border-border bg-card p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpenText weight="bold" className="w-5 h-5 text-[hsl(var(--primary))]" />
            <h2 className="text-lg font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              {note.content.title || "Notes"}
            </h2>
          </div>
          <div className="overline text-muted-foreground mb-1">{subject}</div>
          <h3
            className="text-xl md:text-2xl font-black tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {chapter}
          </h3>
          <div className="flex items-center gap-2 mt-2.5">
            <Badge variant="outline" className="rounded-sm text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5" data-testid="difficulty-badge">
              {diffLabel}
            </Badge>
            <Badge variant="outline" className="rounded-sm text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.05)]" data-testid="note-type-badge">
              {typeLabel}
            </Badge>
          </div>
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

function IntroductionSection({ text }) {
  if (!text) return null;
  return (
    <motion.div custom={0} initial="hidden" animate="visible" variants={fadeIn} className="bento-full border border-border bg-card p-6" data-testid="introduction-section">
      <SectionLabel icon={Article} label="Introduction" number="01" />
      <p className="text-sm leading-relaxed text-foreground">{text}</p>
    </motion.div>
  );
}

function MainContentSection({ sections }) {
  if (!sections || sections.length === 0) return null;
  return (
    <motion.div custom={1} initial="hidden" animate="visible" variants={fadeIn} className="bento-hero border border-border bg-card p-6" data-testid="main-content-section">
      <SectionLabel icon={TextAlignLeft} label="Main Content" number="02" />
      <div className="space-y-5">
        {sections.map((section, si) => (
          <div key={`section-${section.heading}-${si}`}>
            <h4 className="text-sm font-bold mb-2.5 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-sm bg-[hsl(var(--primary)/0.08)] font-mono text-[10px] font-bold text-[hsl(var(--primary))] shrink-0">
                {String(si + 1).padStart(2, "0")}
              </span>
              {section.heading}
            </h4>
            <ul className="space-y-2 pl-7">
              {section.points.map((point, pi) => (
                <li key={`pt-${si}-${pi}`} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary)/0.4)] mt-2 shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ExamplesSection({ examples }) {
  if (!examples || examples.length === 0) return null;
  return (
    <motion.div custom={2} initial="hidden" animate="visible" variants={fadeIn} className="bento-square border border-border bg-card p-6" data-testid="examples-section">
      <SectionLabel icon={Code} label="Examples" number="03" />
      <div className="space-y-3">
        {examples.map((ex, i) => (
          <div key={`example-${i}`} className="border border-border p-3 bg-background rounded-sm">
            <div className="flex items-start gap-2.5 text-sm">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-sm bg-[hsl(var(--primary)/0.08)] font-mono text-[10px] font-bold text-[hsl(var(--primary))] mt-0.5 shrink-0">
                {i + 1}
              </span>
              <span className="leading-relaxed">{ex}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function KeyPointsSection({ points }) {
  if (!points || points.length === 0) return null;
  return (
    <motion.div custom={3} initial="hidden" animate="visible" variants={fadeIn} className="bento-full border border-border bg-card p-6" data-testid="key-points-section">
      <SectionLabel icon={Star} label="Key Points" number="04" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
        {points.map((point, i) => (
          <div key={`kp-${point.slice(0, 20)}-${i}`} className="flex items-start gap-3 text-sm leading-relaxed p-2 rounded-sm hover:bg-muted/30 transition-colors">
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

function SummarySection({ text }) {
  if (!text) return null;
  return (
    <motion.div custom={4} initial="hidden" animate="visible" variants={fadeIn} className="bento-full border border-border bg-card p-6" data-testid="summary-section">
      <SectionLabel icon={ListChecks} label="Summary" number="05" />
      <p className="text-sm leading-relaxed text-foreground">{text}</p>
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
        <IntroductionSection text={content.introduction} />
        <MainContentSection sections={content.main_content} />
        <ExamplesSection examples={content.examples} />
        <KeyPointsSection points={content.key_points} />
        <SummarySection text={content.summary} />
      </div>
    </div>
  );
}
