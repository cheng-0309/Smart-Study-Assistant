import { useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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
  PencilSimple,
  ShareNetwork,
  CardsThree,
  Printer,
  Tag,
  Check,
  X,
  FloppyDisk,
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
import FlashcardViewer from "./FlashcardViewer";

const API = "/api";

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" },
  }),
};

const TYPE_LABELS = { quick_revision: "Quick Revision", detailed: "Detailed", exam_focused: "Exam-Focused" };

function SectionLabel({ icon: Icon, label, number }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-7 h-7 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center shrink-0">
        <Icon weight="bold" className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
      </div>
      <div>
        {number && <span className="font-mono text-[10px] text-muted-foreground block leading-none mb-0.5">Section {number}</span>}
        <span className="overline text-foreground">{label}</span>
      </div>
    </div>
  );
}

function TagEditor({ tags, noteId, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [localTags, setLocalTags] = useState(tags || []);

  const addTag = () => {
    const t = input.trim().toLowerCase();
    if (t && !localTags.includes(t)) {
      const updated = [...localTags, t];
      setLocalTags(updated);
      setInput("");
      saveTag(updated);
    }
  };

  const removeTag = (tag) => {
    const updated = localTags.filter((t) => t !== tag);
    setLocalTags(updated);
    saveTag(updated);
  };

  const saveTag = async (newTags) => {
    try {
      await api.put(`${API}/notes/${noteId}`, { tags: newTags });
      onUpdate?.(newTags);
    } catch {
      toast.error("Failed to update tags");
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid="tag-editor">
      {localTags.map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          className="rounded-full text-[10px] px-2.5 py-0.5 border-[hsl(var(--primary)/0.2)] bg-[hsl(var(--primary)/0.05)] text-[hsl(var(--primary))] gap-1 cursor-default"
          data-testid={`tag-${tag}`}
        >
          <Tag weight="bold" className="w-2.5 h-2.5" />
          {tag}
          <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive">
            <X weight="bold" className="w-2.5 h-2.5" />
          </button>
        </Badge>
      ))}
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            data-testid="tag-input"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addTag(); if (e.key === "Escape") setEditing(false); }}
            placeholder="Add tag..."
            className="h-6 w-24 text-[10px] px-2 rounded-md bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--primary)/0.3)] outline-none"
          />
          <button onClick={addTag} className="text-[hsl(var(--primary))]"><Check weight="bold" className="w-3.5 h-3.5" /></button>
          <button onClick={() => setEditing(false)} className="text-muted-foreground"><X weight="bold" className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <button
          data-testid="add-tag-btn"
          onClick={() => setEditing(true)}
          className="text-[10px] text-muted-foreground hover:text-[hsl(var(--primary))] flex items-center gap-1 transition-colors"
        >
          <Tag weight="bold" className="w-3 h-3" /> Add tag
        </button>
      )}
    </div>
  );
}

function EditableField({ value, onSave, className, inputClassName, testId }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  const save = () => {
    if (val.trim() && val !== value) onSave(val.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        data-testid={`${testId}-input`}
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setVal(value); setEditing(false); }}}
        className={`bg-transparent border-b-2 border-[hsl(var(--primary)/0.4)] outline-none ${inputClassName || className || ""}`}
      />
    );
  }

  return (
    <span
      data-testid={testId}
      className={`cursor-pointer hover:text-[hsl(var(--primary))] transition-colors ${className || ""}`}
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {value}
    </span>
  );
}

function NoteTitle({ subject, chapter, note, onNoteUpdate }) {
  const typeLabel = TYPE_LABELS[note.note_type] || note.note_type;
  const [flashcards, setFlashcards] = useState(null);
  const [loadingFlash, setLoadingFlash] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);

  const handleEdit = async (field, value) => {
    try {
      const res = await api.put(`${API}/notes/${note.id}`, { [field]: value });
      onNoteUpdate?.(res.data);
      toast.success("Note updated");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleShare = async () => {
    try {
      const res = await api.post(`${API}/notes/${note.id}/share`);
      const url = `${window.location.origin}/shared/${res.data.share_id}`;
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Share link copied to clipboard!");
      } catch {
        // Fallback for restricted contexts
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        toast.success("Share link copied!");
      }
    } catch {
      toast.error("Failed to generate share link");
    }
  };

  const handleFlashcards = async () => {
    if (flashcards) {
      setShowFlashcards((s) => !s);
      return;
    }
    setLoadingFlash(true);
    try {
      const res = await api.post(`${API}/notes/${note.id}/flashcards`);
      setFlashcards(res.data);
      setShowFlashcards(true);
    } catch {
      toast.error("Failed to generate flashcards");
    } finally {
      setLoadingFlash(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const c = note.content;
    let html = `<!DOCTYPE html><html><head><title>${c.title || "Study Notes"}</title><style>
      body{font-family:'Segoe UI',sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#222;line-height:1.6}
      h1{font-size:22px;margin-bottom:4px}h2{font-size:16px;color:#555;margin-top:24px;border-bottom:1px solid #ddd;padding-bottom:4px}
      h3{font-size:14px;margin:12px 0 6px}ul{margin:0;padding-left:24px}li{margin:4px 0}
      .meta{color:#888;font-size:13px;margin-bottom:16px}.badge{display:inline-block;background:#f0f0f0;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}
      @media print{body{margin:20px}}
    </style></head><body>`;
    html += `<h1>${c.title || "Study Notes"}</h1>`;
    html += `<div class="meta">${subject} &middot; ${chapter} &middot; <span class="badge">${typeLabel}</span></div>`;
    if (c.introduction) html += `<h2>Introduction</h2><p>${c.introduction}</p>`;
    if (c.main_content?.length) {
      html += `<h2>Main Content</h2>`;
      c.main_content.forEach((s) => {
        html += `<h3>${s.heading}</h3><ul>${s.points.map((p) => `<li>${p}</li>`).join("")}</ul>`;
      });
    }
    if (c.examples?.length) html += `<h2>Examples</h2><ul>${c.examples.map((e, i) => `<li>${e}</li>`).join("")}</ul>`;
    if (c.key_points?.length) html += `<h2>Key Points</h2><ul>${c.key_points.map((k, i) => `<li>${k}</li>`).join("")}</ul>`;
    if (c.summary) html += `<h2>Summary</h2><p>${c.summary}</p>`;
    html += `</body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <>
      <div className="border border-border bg-card p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpenText weight="bold" className="w-5 h-5 text-[hsl(var(--primary))]" />
              <h2 className="text-lg font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                {note.content.title || "Notes"}
              </h2>
            </div>
            <div className="overline text-muted-foreground mb-1">
              <EditableField value={subject} onSave={(v) => handleEdit("subject", v)} testId="edit-subject" />
            </div>
            <h3 className="text-xl md:text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              <EditableField value={chapter} onSave={(v) => handleEdit("chapter", v)} testId="edit-chapter" />
            </h3>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <Badge variant="outline" className="rounded-lg text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.05)]" data-testid="note-type-badge">
                {typeLabel}
              </Badge>
              <TagEditor tags={note.tags} noteId={note.id} onUpdate={(tags) => onNoteUpdate?.({ ...note, tags })} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button data-testid="share-btn" variant="outline" size="sm" onClick={handleShare} className="rounded-lg h-8 gap-1.5 text-xs border-border">
              <ShareNetwork weight="bold" className="w-3.5 h-3.5" /> Share
            </Button>
            <Button data-testid="flashcard-btn" variant="outline" size="sm" onClick={handleFlashcards} disabled={loadingFlash} className="rounded-lg h-8 gap-1.5 text-xs border-border">
              <CardsThree weight="bold" className="w-3.5 h-3.5" /> {loadingFlash ? "..." : "Flashcards"}
            </Button>
            <Button data-testid="print-btn" variant="outline" size="sm" onClick={handlePrint} className="rounded-lg h-8 gap-1.5 text-xs border-border">
              <Printer weight="bold" className="w-3.5 h-3.5" /> Print
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button data-testid="export-btn" variant="outline" size="sm" className="rounded-lg h-8 gap-1.5 text-xs border-border">
                  <DownloadSimple weight="bold" className="w-3.5 h-3.5" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-lg">
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
      </div>

      {/* Flashcards panel */}
      <AnimatePresence>
        {showFlashcards && flashcards && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-border bg-card px-6 overflow-hidden"
          >
            <FlashcardViewer data={flashcards} onClose={() => setShowFlashcards(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
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
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-lg bg-[hsl(var(--primary)/0.08)] font-mono text-[10px] font-bold text-[hsl(var(--primary))] shrink-0">
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
          <div key={`example-${i}`} className="border border-border p-3 bg-background rounded-lg">
            <div className="flex items-start gap-2.5 text-sm">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-lg bg-[hsl(var(--primary)/0.08)] font-mono text-[10px] font-bold text-[hsl(var(--primary))] mt-0.5 shrink-0">
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
          <div key={`kp-${point.slice(0, 20)}-${i}`} className="flex items-start gap-3 text-sm leading-relaxed p-2 rounded-lg hover:bg-muted/30 transition-colors">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-lg bg-[hsl(var(--primary)/0.08)] font-mono text-[10px] font-bold text-[hsl(var(--primary))] mt-0.5 shrink-0">
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

export default function NoteDisplay({ note, onNoteUpdate }) {
  if (!note) return null;

  const { subject, chapter, content } = note;

  return (
    <div data-testid="note-display" className="space-y-0">
      <NoteTitle subject={subject} chapter={chapter} note={note} onNoteUpdate={onNoteUpdate} />

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
