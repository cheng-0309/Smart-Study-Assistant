import { motion } from "framer-motion";
import {
  CalendarDots,
  Clock,
  CheckCircle,
  ListBullets,
  HourglassHigh,
  ArrowsClockwise,
  Target,
  Fire,
  Minus,
  ArrowDown,
} from "@phosphor-icons/react";

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.3, ease: "easeOut" },
  }),
};

const priorityConfig = {
  high: { icon: Fire, color: "text-red-500", bg: "bg-red-500/10", label: "High" },
  medium: { icon: Minus, color: "text-amber-500", bg: "bg-amber-500/10", label: "Medium" },
  low: { icon: ArrowDown, color: "text-blue-500", bg: "bg-blue-500/10", label: "Low" },
};

function ExamPlanSummary({ plan }) {
  const totalHours = plan.days.reduce((sum, d) => sum + d.duration_hours, 0);
  const highPriorityDays = plan.days.filter((d) => d.priority === "high").length;
  const revisionDays = plan.days.filter(
    (d) =>
      d.topics.some((t) => t.toLowerCase().includes("revis")) ||
      d.tasks.some((t) => t.toLowerCase().includes("revis"))
  ).length;

  return (
    <div className="grid grid-cols-4 divide-x divide-border border-b border-border" data-testid="exam-plan-summary">
      <div className="p-4 text-center">
        <HourglassHigh weight="bold" className="w-4 h-4 text-[hsl(var(--primary))] mx-auto mb-1" />
        <div className="font-mono text-lg font-bold">{totalHours}h</div>
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Total Hours</div>
      </div>
      <div className="p-4 text-center">
        <CalendarDots weight="bold" className="w-4 h-4 text-[hsl(var(--primary))] mx-auto mb-1" />
        <div className="font-mono text-lg font-bold">{plan.days_until_exam}</div>
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Days Left</div>
      </div>
      <div className="p-4 text-center">
        <Target weight="bold" className="w-4 h-4 text-[hsl(var(--primary))] mx-auto mb-1" />
        <div className="font-mono text-lg font-bold">{plan.topics.length}</div>
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Topics</div>
      </div>
      <div className="p-4 text-center">
        <ArrowsClockwise weight="bold" className="w-4 h-4 text-[hsl(var(--primary))] mx-auto mb-1" />
        <div className="font-mono text-lg font-bold">{revisionDays || highPriorityDays}</div>
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
          {revisionDays > 0 ? "Revision" : "Priority"}
        </div>
      </div>
    </div>
  );
}

export default function ExamPlanDisplay({ plan }) {
  if (!plan) return null;

  return (
    <div data-testid="exam-plan-display" className="border border-border bg-card">
      {/* Title */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDots weight="bold" className="w-5 h-5 text-[hsl(var(--primary))]" />
          <h2 className="text-lg font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Exam Preparation Plan
          </h2>
        </div>
        <div className="overline text-muted-foreground mb-1">
          {plan.days_until_exam} days · {plan.hours_per_day}h/day · Exam: {plan.exam_date}
        </div>
        <h3
          className="text-xl md:text-2xl font-black tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {plan.subject}
        </h3>
        {/* Topics chips */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {plan.topics.map((t) => (
            <span
              key={`chip-${t}`}
              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.2)] rounded-sm"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      <ExamPlanSummary plan={plan} />

      {/* Daily Breakdown heading */}
      <div className="px-6 pt-5 pb-2">
        <div className="overline text-muted-foreground flex items-center gap-2">
          <ListBullets weight="bold" className="w-3.5 h-3.5" />
          Daily Schedule
        </div>
      </div>

      {/* Timeline */}
      <div className="divide-y divide-border">
        {plan.days.map((day, i) => {
          const pConfig = priorityConfig[day.priority] || priorityConfig.medium;
          const PriorityIcon = pConfig.icon;

          return (
            <motion.div
              key={`exam-day-${day.day}`}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="flex gap-4 p-5 hover:bg-muted/30 transition-colors"
              data-testid={`exam-day-${day.day}`}
            >
              <div className="shrink-0 flex flex-col items-center">
                <div className="w-10 h-10 rounded-sm bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                  <span className="font-mono text-xs font-bold text-[hsl(var(--primary))]">
                    D{String(day.day).padStart(2, "0")}
                  </span>
                </div>
                {i < plan.days.length - 1 && (
                  <div className="w-px flex-1 bg-border mt-2" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase ${pConfig.bg} ${pConfig.color}`}>
                      <PriorityIcon weight="bold" className="w-3 h-3" />
                      {pConfig.label}
                    </span>
                    {day.date && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {day.date}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                    <Clock weight="bold" className="w-3 h-3" />
                    {day.duration_hours}h
                  </span>
                </div>

                {/* Day topics */}
                {day.topics && day.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {day.topics.map((t) => (
                      <span
                        key={`dt-${day.day}-${t}`}
                        className="text-[10px] font-medium px-2 py-0.5 bg-muted rounded-sm text-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <ul className="space-y-1">
                  {day.tasks.map((task, j) => (
                    <li
                      key={`task-${day.day}-${j}`}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle weight="bold" className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[hsl(var(--primary)/0.5)]" />
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
