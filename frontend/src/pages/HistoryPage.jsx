import { useState, useEffect } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  NotePencil,
  CalendarDots,
  Exam,
  Trash,
  Eye,
  EyeSlash,
  Clock,
  Lightbulb,
  MathOperations,
  ListChecks,
  CheckCircle,
  XCircle,
  GraduationCap,
  Target,
  Fire,
  Minus,
  ArrowDown,
  Star,
  TextAlignLeft,
  Code,
  Article,
} from "@phosphor-icons/react";
import AppLayout from "../components/AppLayout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";


const TYPE_CONFIG = {
  note: { label: "Notes", icon: NotePencil, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  plan: { label: "Study Plan", icon: CalendarDots, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  practice: { label: "Quiz", icon: Exam, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  exam_plan: { label: "Exam Prep", icon: GraduationCap, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
};

const FILTERS = [
  { key: null, label: "All" },
  { key: "note", label: "Notes" },
  { key: "plan", label: "Plans" },
  { key: "exam_plan", label: "Exam Prep" },
  { key: "practice", label: "Quizzes" },
];

function formatTimestamp(isoStr) {
  const d = new Date(isoStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago · ${timeStr}`;
  if (diffDays < 7) return `${diffDays}d ago · ${timeStr}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${timeStr}`;
}

function TypeBadge({ type }) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`rounded-lg gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${config.color} ${config.bg} ${config.border}`}>
      <Icon weight="bold" className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

/* ---------- Note Detail ---------- */
const NTYPE_LABELS = { quick_revision: "Quick Revision", detailed: "Detailed", exam_focused: "Exam-Focused" };

function NoteDetail({ data }) {
  const { content } = data;
  const typeLabel = NTYPE_LABELS[data.note_type] || data.note_type || "Detailed";

  return (
    <div className="space-y-5">
      {/* Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="rounded-lg text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.05)]">
          {typeLabel}
        </Badge>
      </div>

      {/* Introduction */}
      {content.introduction && (
        <div>
          <div className="overline text-muted-foreground flex items-center gap-1.5 mb-2.5">
            <Article weight="bold" className="w-3 h-3" /> Introduction
          </div>
          <p className="text-sm leading-relaxed">{content.introduction}</p>
        </div>
      )}

      {/* Main Content */}
      {content.main_content && content.main_content.length > 0 && (
        <div>
          <div className="overline text-muted-foreground flex items-center gap-1.5 mb-2.5">
            <TextAlignLeft weight="bold" className="w-3 h-3" /> Main Content
          </div>
          <div className="space-y-4">
            {content.main_content.map((section, si) => (
              <div key={`hmc-${si}`}>
                <h4 className="text-sm font-bold mb-1.5">{section.heading}</h4>
                <ul className="space-y-1.5 pl-2">
                  {section.points.map((p, pi) => (
                    <li key={`hmp-${si}-${pi}`} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary)/0.4)] mt-2 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Examples */}
      {content.examples && content.examples.length > 0 && (
        <div>
          <div className="overline text-muted-foreground flex items-center gap-1.5 mb-2.5">
            <Code weight="bold" className="w-3 h-3" /> Examples
          </div>
          <div className="space-y-2">
            {content.examples.map((ex, i) => (
              <div key={`hex-${i}`} className="p-3 border border-border bg-background rounded-lg text-sm">
                <span className="font-mono text-[hsl(var(--primary))] mr-1.5">{i + 1}.</span> {ex}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Points */}
      {content.key_points && content.key_points.length > 0 && (
        <div>
          <div className="overline text-muted-foreground flex items-center gap-1.5 mb-2.5">
            <Star weight="bold" className="w-3 h-3" /> Key Points
          </div>
          <ul className="space-y-2">
            {content.key_points.map((kp, i) => (
              <li key={`hkp-${kp.slice(0, 15)}-${i}`} className="flex items-start gap-2.5 text-sm">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-lg bg-[hsl(var(--primary)/0.08)] font-mono text-[10px] font-bold text-[hsl(var(--primary))] mt-0.5 shrink-0">
                  {i + 1}
                </span>
                {kp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      {content.summary && (
        <div>
          <div className="overline text-muted-foreground flex items-center gap-1.5 mb-2.5">
            <ListChecks weight="bold" className="w-3 h-3" /> Summary
          </div>
          <p className="text-sm leading-relaxed">{content.summary}</p>
        </div>
      )}

      {/* Backward compat: old notes with key_concepts/explanation/formulas/quick_revision */}
      {!content.key_points && content.key_concepts && content.key_concepts.length > 0 && (
        <div>
          <div className="overline text-muted-foreground flex items-center gap-1.5 mb-2.5">
            <Lightbulb weight="bold" className="w-3 h-3" /> Key Concepts
          </div>
          <ul className="space-y-2">
            {content.key_concepts.map((c, i) => (
              <li key={`kc-${i}`} className="flex items-start gap-2.5 text-sm">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-lg bg-[hsl(var(--primary)/0.08)] font-mono text-[10px] font-bold text-[hsl(var(--primary))] mt-0.5 shrink-0">
                  {i + 1}
                </span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!content.introduction && content.explanation && (
        <div>
          <div className="overline text-muted-foreground mb-2.5">Explanation</div>
          <p className="text-sm leading-relaxed">{content.explanation}</p>
        </div>
      )}
    </div>
  );
}

/* ---------- Plan Detail ---------- */
function PlanDetail({ data }) {
  const totalHours = data.days.reduce((sum, d) => sum + d.duration_hours, 0);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="text-center flex-1">
          <div className="font-mono text-base font-bold">{data.num_days}</div>
          <div className="font-mono text-[10px] text-muted-foreground uppercase">Days</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center flex-1">
          <div className="font-mono text-base font-bold">{totalHours}h</div>
          <div className="font-mono text-[10px] text-muted-foreground uppercase">Total</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center flex-1">
          <div className="font-mono text-base font-bold">{data.hours_per_day}h</div>
          <div className="font-mono text-[10px] text-muted-foreground uppercase">Per Day</div>
        </div>
      </div>

      {data.days.map((day) => (
        <div key={`day-${day.day}`} className="flex gap-3 p-3 border border-border bg-background rounded-lg">
          <div className="w-9 h-9 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center shrink-0">
            <span className="font-mono text-[10px] font-bold text-[hsl(var(--primary))]">D{String(day.day).padStart(2, "0")}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold truncate">{day.topic}</span>
              <span className="font-mono text-[10px] text-muted-foreground shrink-0">{day.duration_hours}h</span>
            </div>
            <ul className="mt-1.5 space-y-1">
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
const Q_TYPE_LABELS = { mcq: "MCQ", true_false: "T/F", numerical: "Num", short_answer: "Short", long_answer: "Long" };

function PracticeDetail({ data }) {
  return (
    <div className="space-y-3">
      {data.question_type && (
        <Badge variant="outline" className="rounded-lg text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.05)]">
          {Q_TYPE_LABELS[data.question_type] || data.question_type || "MCQ"}
        </Badge>
      )}
      {data.questions.map((q, i) => {
        const qt = q.question_type || "mcq";
        return (
          <div key={`q-${i}`} className="p-4 border border-border bg-background rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-lg bg-muted text-muted-foreground">
                {Q_TYPE_LABELS[qt] || qt}
              </span>
            </div>
            <p className="text-sm font-medium mb-3">
              <span className="font-mono text-[hsl(var(--primary))] mr-1.5">Q{i + 1}.</span>
              {q.question}
            </p>

            {/* MCQ options */}
            {qt === "mcq" && q.options && q.options.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {q.options.map((opt) => {
                  const isCorrect = opt.label === q.correct_answer;
                  return (
                    <div
                      key={opt.label}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg text-xs border ${
                        isCorrect ? "border-green-500/40 bg-green-500/5" : "border-border"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold ${
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
            )}

            {/* True/False answer */}
            {qt === "true_false" && q.correct_answer && (
              <div className="mb-3 text-xs font-mono">
                Answer: <span className="font-bold text-green-500">{q.correct_answer}</span>
              </div>
            )}

            {/* Numerical answer */}
            {qt === "numerical" && q.correct_answer && (
              <div className="mb-3 text-xs font-mono">
                Answer: <span className="font-bold text-green-500">{q.correct_answer}</span>
              </div>
            )}

            {/* Model answer for subjective */}
            {(qt === "short_answer" || qt === "long_answer") && q.model_answer && (
              <div className="mb-3 p-3 bg-muted/20 border border-border rounded-lg">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Model Answer</div>
                <p className="text-xs leading-relaxed">{q.model_answer}</p>
                {q.key_points && q.key_points.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {q.key_points.map((kp, j) => (
                      <li key={`kp-${j}`} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <Star weight="bold" className="w-3 h-3 mt-0.5 shrink-0 text-[hsl(var(--primary)/0.5)]" />
                        {kp}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Explanation */}
            {q.explanation && (
              <div className="text-xs text-muted-foreground p-2.5 bg-muted/30 rounded-lg">
                <span className="font-bold">Explanation:</span> {q.explanation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Exam Plan Detail ---------- */
const examPriorityConfig = {
  high: { icon: Fire, color: "text-red-500", bg: "bg-red-500/10", label: "High" },
  medium: { icon: Minus, color: "text-amber-500", bg: "bg-amber-500/10", label: "Med" },
  low: { icon: ArrowDown, color: "text-blue-500", bg: "bg-blue-500/10", label: "Low" },
};

function ExamPlanDetail({ data }) {
  const totalHours = data.days.reduce((sum, d) => sum + d.duration_hours, 0);
  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="text-center flex-1">
          <div className="font-mono text-base font-bold">{data.days_until_exam}</div>
          <div className="font-mono text-[10px] text-muted-foreground uppercase">Days Left</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center flex-1">
          <div className="font-mono text-base font-bold">{totalHours}h</div>
          <div className="font-mono text-[10px] text-muted-foreground uppercase">Total</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center flex-1">
          <div className="font-mono text-base font-bold">{data.topics?.length || 0}</div>
          <div className="font-mono text-[10px] text-muted-foreground uppercase">Topics</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center flex-1">
          <div className="font-mono text-base font-bold">{data.hours_per_day}h</div>
          <div className="font-mono text-[10px] text-muted-foreground uppercase">Per Day</div>
        </div>
      </div>

      {/* Topics chips */}
      {data.topics && data.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.topics.map((t) => (
            <span key={`ep-t-${t}`} className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-500 border border-violet-500/20 rounded-lg">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Day-wise breakdown */}
      {data.days.map((day) => {
        const pCfg = examPriorityConfig[day.priority] || examPriorityConfig.medium;
        const PIcon = pCfg.icon;
        return (
          <div key={`ep-day-${day.day}`} className="flex gap-3 p-3 border border-border bg-background rounded-lg">
            <div className="w-9 h-9 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center shrink-0">
              <span className="font-mono text-[10px] font-bold text-[hsl(var(--primary))]">D{String(day.day).padStart(2, "0")}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[9px] font-bold uppercase ${pCfg.bg} ${pCfg.color}`}>
                    <PIcon weight="bold" className="w-2.5 h-2.5" />
                    {pCfg.label}
                  </span>
                  {day.date && <span className="font-mono text-[10px] text-muted-foreground">{day.date}</span>}
                </div>
                <span className="font-mono text-[10px] text-muted-foreground shrink-0">{day.duration_hours}h</span>
              </div>
              {day.topics && day.topics.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {day.topics.map((t) => (
                    <span key={`edt-${day.day}-${t}`} className="text-[10px] font-medium px-2 py-0.5 bg-muted rounded-lg">{t}</span>
                  ))}
                </div>
              )}
              <ul className="mt-1.5 space-y-1">
                {day.tasks.map((task, j) => (
                  <li key={`et-${day.day}-${j}`} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <CheckCircle weight="bold" className="w-3 h-3 mt-0.5 shrink-0 text-[hsl(var(--primary)/0.5)]" />
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
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
    if (item.type === "exam_plan") return <ExamPlanDetail data={item.data} />;
    return null;
  }

  function renderPreview() {
    if (item.type === "note") {
      const snippet = item.preview.introduction_snippet || "";
      const ntype = NTYPE_LABELS[item.preview.note_type] || item.preview.note_type || "";
      return `${ntype} · ${item.preview.key_points_count || 0} key points · ${snippet.slice(0, 80)}${snippet.length > 80 ? "..." : ""}`;
    }
    if (item.type === "plan") {
      return `${item.preview.total_days} days · ${item.preview.hours_per_day}h/day · First: ${item.preview.first_day_topic}`;
    }
    if (item.type === "practice") {
      const qType = Q_TYPE_LABELS[item.preview.question_type] || item.preview.question_type || "MCQ";
      return `${qType} · ${item.preview.num_questions} questions · ${item.preview.first_question}`;
    }
    if (item.type === "exam_plan") {
      return `${item.preview.days_until_exam} days left · ${item.preview.topics_count} topics · ${item.preview.topics_summary}`;
    }
    return "";
  }

  return (
    <div
      className="border border-border bg-card card-lift rounded-lg"
      data-testid={`history-card-${item.id}`}
    >
      {/* Card Header */}
      <div className="flex items-start gap-4 p-5">
        {/* Type icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
          {(() => { const Icon = config.icon; return <Icon weight="bold" className={`w-5 h-5 ${config.color}`} />; })()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <TypeBadge type={item.type} />
            <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock weight="regular" className="w-3 h-3" />
              {formatTimestamp(item.created_at)}
            </span>
          </div>
          <h3 className="text-base font-bold tracking-tight truncate" style={{ fontFamily: "var(--font-heading)" }}>
            {item.title}
          </h3>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
          {!expanded && (
            <p className="text-xs text-muted-foreground mt-2.5 line-clamp-2 leading-relaxed">{renderPreview()}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid={`expand-${item.id}`}
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg gap-1.5 text-xs px-3"
                  onClick={() => setExpanded((p) => !p)}
                >
                  {expanded ? (
                    <><EyeSlash className="w-3.5 h-3.5" /> Hide</>
                  ) : (
                    <><Eye className="w-3.5 h-3.5" /> View Full</>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{expanded ? "Collapse details" : "View full content"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid={`delete-history-${item.id}`}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(item.type, item.id)}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Delete</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border pt-5" data-testid={`detail-${item.id}`}>
              {renderDetail()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
        const url = filter ? `/history?item_type=${filter}` : `/history`;
        const res = await api.get(url);
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
      await api.delete(`/history/${type}/${id}`);
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
    exam_plan: items.filter((i) => i.type === "exam_plan").length,
    practice: items.filter((i) => i.type === "practice").length,
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-[960px] mx-auto" data-testid="history-content">
          {/* Page Header */}
          <div className="mb-8">
            <div className="overline text-muted-foreground flex items-center gap-2 mb-2">
              <Clock weight="bold" className="w-3.5 h-3.5" />
              Activity Log
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              History
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">All your generated notes, study plans, and quizzes in one place.</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 mb-8 border-b border-border pb-3" data-testid="history-filters">
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
                  className={`rounded-lg h-8 gap-1.5 text-xs font-medium ${
                    isActive
                      ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {label}
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-lg ${
                    isActive ? "bg-[hsl(var(--primary)/0.15)]" : "bg-muted"
                  }`}>
                    {count}
                  </span>
                </Button>
              );
            })}
          </div>

          {/* Items */}
          <div className="space-y-4">
            <AnimatePresence>
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={`skel-h-${i}`} className="border border-border bg-card p-5 mb-4 rounded-lg">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 bg-muted rounded-lg loading-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                        <div className="flex-1 space-y-2.5">
                          <div className="h-3 bg-muted rounded w-24 loading-bar" style={{ animationDelay: `${i * 0.1 + 0.05}s` }} />
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
                    Start generating notes, plans, or quizzes — they'll all show up here.
                  </p>
                </motion.div>
              )}

              {!isLoading && items.map((item) => (
                <HistoryCard key={item.id} item={item} onDelete={handleDelete} />
              ))}
            </AnimatePresence>
          </div>
      </div>
    </AppLayout>
  );
}
