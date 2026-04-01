import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDots,
  Lightning,
  Spinner,
  Clock,
  Trash,
  CheckCircle,
  ListBullets,
} from "@phosphor-icons/react";
import Header from "../components/Header";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.3, ease: "easeOut" },
  }),
};

function PlannerForm({ onGenerate, isLoading }) {
  const [topic, setTopic] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("2");
  const [numDays, setNumDays] = useState("7");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onGenerate(topic.trim(), parseFloat(hoursPerDay), parseInt(numDays));
  };

  return (
    <form
      data-testid="planner-form"
      onSubmit={handleSubmit}
      className="border border-border bg-card p-6 md:p-8"
    >
      <div className="overline text-muted-foreground mb-6">
        Create Study Plan
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="planner-topic" className="text-sm font-medium">
            Topic
          </Label>
          <Input
            data-testid="planner-topic-input"
            id="planner-topic"
            placeholder="e.g. Organic Chemistry, World War II"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="rounded-sm border-border h-11 bg-background"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Hours / Day</Label>
          <Select value={hoursPerDay} onValueChange={setHoursPerDay} disabled={isLoading}>
            <SelectTrigger data-testid="planner-hours-select" className="rounded-sm h-11 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-sm">
              {[1, 1.5, 2, 2.5, 3, 4, 5, 6].map((h) => (
                <SelectItem key={h} value={String(h)}>
                  {h} {h === 1 ? "hour" : "hours"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Duration (Days)</Label>
          <Select value={numDays} onValueChange={setNumDays} disabled={isLoading}>
            <SelectTrigger data-testid="planner-days-select" className="rounded-sm h-11 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-sm">
              {[3, 5, 7, 10, 14, 21, 30].map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d} days
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        data-testid="generate-plan-btn"
        type="submit"
        disabled={isLoading || !topic.trim()}
        className="rounded-sm h-11 px-8 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 font-bold tracking-wide transition-opacity"
      >
        {isLoading ? (
          <>
            <Spinner className="w-4 h-4 mr-2 animate-spin" />
            Generating Plan...
          </>
        ) : (
          <>
            <Lightning weight="bold" className="w-4 h-4 mr-2" />
            Generate Plan
          </>
        )}
      </Button>
    </form>
  );
}

function PlanDisplay({ plan }) {
  if (!plan) return null;

  return (
    <div data-testid="plan-display" className="border border-border bg-card">
      {/* Title */}
      <div className="p-6 border-b border-border">
        <div className="overline text-muted-foreground mb-1">
          {plan.num_days}-Day Plan · {plan.hours_per_day}h/day
        </div>
        <h2
          className="text-xl md:text-2xl font-black tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {plan.topic}
        </h2>
      </div>

      {/* Timeline */}
      <div className="divide-y divide-border">
        {plan.days.map((day, i) => (
          <motion.div
            key={day.day}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="flex gap-4 p-5 hover:bg-muted/30 transition-colors"
            data-testid={`plan-day-${day.day}`}
          >
            {/* Day number */}
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

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold truncate">{day.topic}</h3>
                <span className="font-mono text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                  <Clock weight="bold" className="w-3 h-3" />
                  {day.duration_hours}h
                </span>
              </div>
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
        ))}
      </div>
    </div>
  );
}

function PlannerHistory({ plans, onSelect, onDelete, activeId }) {
  return (
    <div
      data-testid="planner-history-panel"
      className="h-full flex flex-col border-l border-border bg-card"
    >
      <div className="p-4 border-b border-border">
        <div className="overline text-muted-foreground flex items-center gap-2">
          <ListBullets weight="bold" className="w-3.5 h-3.5" />
          Saved Plans
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {plans.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8 px-4">
              No saved plans yet.
            </p>
          )}

          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`group p-3 mb-1 cursor-pointer transition-colors rounded-sm ${
                activeId === plan.id
                  ? "bg-[hsl(var(--primary)/0.08)] border border-[hsl(var(--primary)/0.2)]"
                  : "hover:bg-muted border border-transparent"
              }`}
              onClick={() => onSelect(plan)}
              data-testid={`saved-plan-${plan.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{plan.topic}</p>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {plan.num_days} days · {plan.hours_per_day}h/day
                  </span>
                </div>
                <Button
                  data-testid={`delete-plan-${plan.id}`}
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-sm shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(plan.id);
                  }}
                >
                  <Trash className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function PlannerPage() {
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await axios.get(`${API}/planners`);
        setPlans(res.data);
      } catch {
        /* silent on initial load */
      }
    }
    loadPlans();
  }, []);

  const handleGenerate = async (topic, hoursPerDay, numDays) => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API}/planner/generate`, {
        topic,
        hours_per_day: hoursPerDay,
        num_days: numDays,
      });
      setActivePlan(res.data);
      setPlans((prev) => [res.data, ...prev]);
      toast.success("Study plan created!");
    } catch {
      toast.error("Failed to generate plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/planners/${id}`);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      if (activePlan?.id === id) setActivePlan(null);
      toast.success("Plan deleted");
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onToggleSidebar={() => setSidebarOpen((p) => !p)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto" data-testid="planner-content">
          <div className="max-w-[960px] mx-auto py-6 px-4 md:px-6">
            <PlannerForm onGenerate={handleGenerate} isLoading={isLoading} />

            <AnimatePresence mode="wait">
              {isLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-0 border border-border bg-card p-6"
                >
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={`skel-${i}`} className="flex gap-4">
                        <div className="w-10 h-10 bg-muted rounded-sm loading-bar" style={{ animationDelay: `${i * 0.15}s` }} />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-muted rounded w-1/3 loading-bar" style={{ animationDelay: `${i * 0.15 + 0.05}s` }} />
                          <div className="h-2.5 bg-muted rounded w-2/3 loading-bar" style={{ animationDelay: `${i * 0.15 + 0.1}s` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {!isLoading && activePlan && (
                <motion.div
                  key="display"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-0"
                >
                  <PlanDisplay plan={activePlan} />
                </motion.div>
              )}

              {!isLoading && !activePlan && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20 px-6"
                >
                  <CalendarDots weight="thin" className="w-20 h-20 text-muted-foreground/30 mb-4" />
                  <h3
                    className="text-xl font-black tracking-tight mb-2"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Plan your study
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    Enter a topic and your availability to get a personalized day-by-day study schedule.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              data-testid="planner-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="hidden md:block overflow-hidden shrink-0"
            >
              <PlannerHistory
                plans={plans}
                onSelect={setActivePlan}
                onDelete={handleDelete}
                activeId={activePlan?.id}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
