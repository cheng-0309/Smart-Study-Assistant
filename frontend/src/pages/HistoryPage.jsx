import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  NotePencil,
  CalendarDots,
  Exam,
  Trash,
  CaretDown,
  CaretUp,
  Clock,
  Lightbulb,
  MathOperations,
  ListChecks,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TYPE_CONFIG = {
  note: { label: "Note", icon: NotePencil, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  plan: { label: "Plan", icon: CalendarDots, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  practice: { label: "Practice", icon: Exam, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
};

const FILTERS = [
  { key: null, label: "All" },
  { key: "note", label: "Notes" },
  { key: "plan", label: "Plans" },
  { key: "practice", label: "Practice" },
];

function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TypeBadge({ type }) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`rounded-sm gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${config.color} ${config.bg} ${config.border}`}>
      <Icon weight="bold" className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

/* ---------- Note Detail ---------- */
function NoteDetail({ data }) {
  const { content } = data;
  return (
    <div className="space-y-4">
      <div>
        <div className="overline text-muted-foreground flex items-center gap-1.5 mb-2">
          <Lightbulb weight="bold" className="w-3 h-3" /> Key Concepts
        </div>
        <ul className="space-y-1.5">
          {content.key_concepts.map((c, i) => (
            <li key={`kc-${c.slice(0, 15)}-${i}`} className="flex items-start gap-2 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] mt-1.5 shrink-0" />
              {c}
            </li>
          ))}
        </ul>
      </div>

      {content.formulas.length > 0 && (
        <div>
          <div className="overline text-muted-foreground flex items-center gap-1.5 mb-2">
            <MathOperations weight="bold" className="w-3 h-3" /> Formulas
          </div>
          <div className="space-y-2">
            {content.formulas.map((f) => (
              <div key={`f-${f.formula}`} className="p-2 border border-border bg-background rounded-sm">
                <code className="text-xs font-bold font-mono text-[hsl(var(--primary))]">{f.formula}</code>
                <span className="text-xs text-muted-foreground ml-2">{f.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="overline text-muted-foreground mb-2">Explanation</div>
        <p className="text-sm leading-relaxed">{content.explanation}</p>
      </div>

      <div>
        <div className="overline text-muted-foreground flex items-center gap-1.5 mb-2">
          <ListChecks weight="bold" className="w-3 h-3" /> Quick Revision
        </div>
        <ol className="space-y-1">
          {content.quick_revision.map((r, i) => (
            <li key={`qr-${r.slice(0, 15)}-${i}`} className="text-sm flex items-start gap-2">
              <span className="font-mono text-[10px] font-bold text-[hsl(var(--primary))] mt-0.5">{String(i + 1).padStart(2, "0")}</span>
              {r}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ---------- Plan Detail ---------- */
function PlanDetail({ data }) {
  return (
    <div className="space-y-2">
      {data.days.map((day) => (
        <div key={`day-${day.day}`} className="flex gap-3 p-3 border border-border bg-background rounded-sm">
          <div className="w-9 h-9 rounded-sm bg-[hsl(var(--primary)/0.1)] flex items-center justify-center shrink-0">
            <span className="font-mono text-[10px] font-bold text-[hsl(var(--primary))]">D{String(day.day).padStart(2, "0")}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold truncate">{day.topic}</span>
              <span className="font-mono text-[10px] text-muted-foreground shrink-0">{day.duration_hours}h</span>
            </div>
            <ul className="mt-1 space-y-0.5">
              {day.tasks.map((task, j) => (
                <li key={`t-${day.day}-${j}`} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <CheckCircle weight="bold" className="w-3 h-3 mt-0.5 shrink-0 text-[hsl(var(--primary)/0.5)]" />
                  {task}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Practice Detail ---------- */
function PracticeDetail({ data }) {
  return (
    <div className="space-y-3">
      {data.questions.map((q, i) => (
        <div key={`q-${i}`} className="p-3 border border-border bg-background rounded-sm">
          <p className="text-sm font-medium mb-2">
            <span className="font-mono text-[hsl(var(--primary))] mr-1.5">Q{i + 1}.</span>
            {q.question}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
            {q.options.map((opt) => {
              const isCorrect = opt.label === q.correct_answer;
              return (
                <div
                  key={opt.label}
                  className={`flex items-center gap-2 p-2 rounded-sm text-xs border ${
                    isCorrect ? "border-green-500/40 bg-green-500/5" : "border-border"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-sm flex items-center justify-center font-mono text-[10px] font-bold ${
                    isCorrect ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {opt.label}
                  </span>
                  <span className="flex-1">{opt.text}</span>
                  {isCorrect && <CheckCircle weight="bold" className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                </div>
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded-sm">
            <span className="font-bold">Explanation:</span> {q.explanation}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- History Card ---------- */
function HistoryCard({ item, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const config = TYPE_CONFIG[item.type];

  function renderDetail() {
    if (item.type === "note") return <NoteDetail data={item.data} />;
    if (item.type === "plan") return <PlanDetail data={item.data} />;
    if (item.type === "practice") return <PracticeDetail data={item.data} />;
    return null;
  }

  function renderPreview() {
    if (item.type === "note") {
      return `${item.preview.key_concepts_count} concepts · ${item.preview.has_formulas ? "Has formulas" : "No formulas"} · ${item.preview.explanation_snippet}...`;
    }
    if (item.type === "plan") {
      return `${item.preview.total_days} days · ${item.preview.hours_per_day}h/day · Starts with: ${item.preview.first_day_topic}`;
    }
    if (item.type === "practice") {
      return `${item.preview.num_questions} questions · ${item.preview.first_question}`;
    }
    return "";
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="border border-border bg-card card-lift"
      data-testid={`history-card-${item.id}`}
    >
      {/* Card Header */}
      <div className="flex items-start gap-4 p-5">
        {/* Type icon */}
        <div className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 ${config.bg}`}>
          {(() => { const Icon = config.icon; return <Icon weight="bold" className={`w-5 h-5 ${config.color}`} />; })()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TypeBadge type={item.type} />
            <span className="font-mono text-[10px] text-muted-foreground">{formatDate(item.created_at)}</span>
          </div>
          <h3 className="text-base font-bold tracking-tight truncate" style={{ fontFamily: "var(--font-heading)" }}>
            {item.title}
          </h3>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
          {!expanded && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{renderPreview()}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            data-testid={`expand-${item.id}`}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-sm"
            onClick={() => setExpanded((p) => !p)}
          >
            {expanded ? <CaretUp className="w-4 h-4" /> : <CaretDown className="w-4 h-4" />}
          </Button>
          <Button
            data-testid={`delete-history-${item.id}`}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-sm text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(item.type, item.id)}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 border-t border-border mt-0 pt-4" data-testid={`detail-${item.id}`}>
              {renderDetail()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------- History Page ---------- */
export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true);
      try {
        const url = filter ? `${API}/history?item_type=${filter}` : `${API}/history`;
        const res = await axios.get(url);
        setItems(res.data);
      } catch {
        toast.error("Failed to load history");
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, [filter]);

  const handleDelete = async (type, id) => {
    try {
      await axios.delete(`${API}/history/${type}/${id}`);
      setItems((prev) => prev.filter((it) => it.id !== id));
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const counts = {
    all: items.length,
    note: items.filter((i) => i.type === "note").length,
    plan: items.filter((i) => i.type === "plan").length,
    practice: items.filter((i) => i.type === "practice").length,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 overflow-y-auto" data-testid="history-content">
        <div className="max-w-[960px] mx-auto py-6 px-4 md:px-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="overline text-muted-foreground flex items-center gap-2 mb-2">
              <Clock weight="bold" className="w-3.5 h-3.5" />
              Activity Log
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              History
            </h1>
            <p className="text-sm text-muted-foreground mt-1">All your generated notes, plans, and practice tests in one place.</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 mb-6 border-b border-border pb-3" data-testid="history-filters">
            {FILTERS.map(({ key, label }) => {
              const isActive = filter === key;
              const count = key === null ? counts.all : counts[key];
              return (
                <Button
                  key={label}
                  data-testid={`filter-${label.toLowerCase()}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilter(key)}
                  className={`rounded-sm h-8 gap-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm ${
                    isActive ? "bg-[hsl(var(--primary)/0.15)]" : "bg-muted"
                  }`}>
                    {count}
                  </span>
                </Button>
              );
            })}
          </div>

          {/* Items */}
          <ScrollArea className="h-[calc(100vh-240px)]">
            <div className="space-y-3">
              <AnimatePresence>
                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={`skel-h-${i}`} className="border border-border bg-card p-5 mb-3">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-muted rounded-sm loading-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-muted rounded w-20 loading-bar" style={{ animationDelay: `${i * 0.1 + 0.05}s` }} />
                            <div className="h-4 bg-muted rounded w-2/3 loading-bar" style={{ animationDelay: `${i * 0.1 + 0.1}s` }} />
                            <div className="h-2.5 bg-muted rounded w-1/2 loading-bar" style={{ animationDelay: `${i * 0.1 + 0.15}s` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {!isLoading && items.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20"
                  >
                    <Clock weight="thin" className="w-20 h-20 text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-black tracking-tight mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                      No history yet
                    </h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      Start generating notes, plans, or practice tests — they'll all show up here.
                    </p>
                  </motion.div>
                )}

                {!isLoading && items.map((item) => (
                  <HistoryCard key={item.id} item={item} onDelete={handleDelete} />
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}
