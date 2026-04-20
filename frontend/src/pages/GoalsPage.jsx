import { useState, useEffect, useCallback } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import ConfirmDialog from "../components/ConfirmDialog";
import { sendToWebhook } from "../lib/webhook";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Target,
  Plus,
  Trash,
  Trophy,
  TrendUp,
  CalendarCheck,
  BookOpen,
  Brain,
  Timer,
  CheckCircle,
  XCircle,
  Clock,
} from "@phosphor-icons/react";

const API = "/api";

const GOAL_TYPES = [
  { value: "notes_count", label: "Generate Notes", icon: BookOpen, unit: "notes" },
  { value: "quiz_count", label: "Complete Quizzes", icon: Brain, unit: "quizzes" },
  { value: "quiz_score_avg", label: "Quiz Avg Score", icon: TrendUp, unit: "%" },
  { value: "study_days", label: "Study Days", icon: CalendarCheck, unit: "days" },
  { value: "plans_count", label: "Create Plans", icon: Target, unit: "plans" },
  { value: "pomodoro_minutes", label: "Pomodoro Time", icon: Timer, unit: "min" },
];

const PERIODS = [
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
];

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });

  // Form state
  const [title, setTitle] = useState("");
  const [goalType, setGoalType] = useState("notes_count");
  const [targetValue, setTargetValue] = useState("");
  const [subject, setSubject] = useState("");
  const [period, setPeriod] = useState("weekly");
  const [creating, setCreating] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await api.get(`${API}/goals`);
      setGoals(res.data);
    } catch {
      toast.error("Failed to load goals");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !targetValue) {
      toast.error("Please fill in title and target value");
      return;
    }
    setCreating(true);
    try {
      const res = await api.post(`${API}/goals`, {
        title: title.trim(),
        goal_type: goalType,
        target_value: parseFloat(targetValue),
        subject: subject.trim(),
        period,
      });
      setGoals((prev) => [res.data, ...prev]);
      toast.success("Goal created!");
      sendToWebhook({
        type: "goal_created",
        title: title.trim(),
        goal_type: goalType,
        target_value: parseFloat(targetValue),
        subject: subject.trim(),
        period,
        timestamp: new Date().toISOString(),
      });
      setTitle("");
      setTargetValue("");
      setSubject("");
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create goal");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id) => setDeleteConfirm({ open: true, id });

  const confirmDelete = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm({ open: false, id: null });
    try {
      await api.delete(`${API}/goals/${id}`);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      toast.success("Goal deleted");
    } catch {
      toast.error("Failed to delete goal");
    }
  };

  const getGoalMeta = (type) => GOAL_TYPES.find((g) => g.value === type) || GOAL_TYPES[0];

  const getProgressPct = (current, target) => Math.min(100, Math.round((current / Math.max(target, 1)) * 100));

  const getStatusColor = (status) => {
    if (status === "completed") return "text-emerald-500";
    if (status === "expired") return "text-red-400";
    return "text-[hsl(var(--primary))]";
  };

  const getStatusIcon = (status) => {
    if (status === "completed") return <CheckCircle className="w-5 h-5 text-emerald-500" weight="fill" />;
    if (status === "expired") return <XCircle className="w-5 h-5 text-red-400" weight="fill" />;
    return <Clock className="w-5 h-5 text-[hsl(var(--primary))]" weight="fill" />;
  };

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const expiredGoals = goals.filter((g) => g.status === "expired");

  return (
    <div className="min-h-screen">
      <Header showNav currentPage="goals" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="w-7 h-7 text-[hsl(var(--primary))]" weight="duotone" />
              Study Goals
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Set targets and track your progress</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="gap-2 rounded-xl"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus weight="bold" size={16} />
            New Goal
          </Button>
        </div>

        {/* Create Goal Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <form onSubmit={handleCreate} className="glass-card p-6 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Goal Title</Label>
                    <Input
                      placeholder='e.g. "Complete 10 Physics notes this week"'
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                      className="h-11 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Goal Type</Label>
                    <Select value={goalType} onValueChange={setGoalType}>
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GOAL_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target ({getGoalMeta(goalType).unit})</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="e.g. 10"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      className="h-11 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject (optional)</Label>
                    <Input
                      placeholder="e.g. Physics"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      maxLength={80}
                      className="h-11 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Period</Label>
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIODS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={creating} className="gap-2 rounded-xl" style={{ background: "var(--gradient-primary)" }}>
                    {creating ? "Creating..." : "Create Goal"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="rounded-xl">
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats summary */}
        {goals.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass-card p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-[hsl(var(--primary))]">{activeGoals.length}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="glass-card p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-emerald-500">{completedGoals.length}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="glass-card p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-red-400">{expiredGoals.length}</div>
              <div className="text-xs text-muted-foreground">Expired</div>
            </div>
          </div>
        )}

        {/* Goals List */}
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading goals...</div>
        ) : goals.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" weight="duotone" />
            <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Set your first study goal to start tracking progress</p>
            <Button onClick={() => setShowForm(true)} className="gap-2 rounded-xl" style={{ background: "var(--gradient-primary)" }}>
              <Plus weight="bold" size={16} /> Create First Goal
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const meta = getGoalMeta(goal.goal_type);
              const pct = getProgressPct(goal.current_value, goal.target_value);
              const Icon = meta.icon;
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-5 rounded-2xl"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${goal.status === "completed" ? "bg-emerald-500/10" : "bg-[hsl(var(--primary)/0.08)]"}`}>
                        <Icon className={`w-5 h-5 ${goal.status === "completed" ? "text-emerald-500" : "text-[hsl(var(--primary))]"}`} weight="duotone" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{goal.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{meta.label}</Badge>
                          {goal.subject && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{goal.subject}</Badge>}
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{goal.period}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(goal.status)}
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10" onClick={() => handleDelete(goal.id)}>
                        <Trash className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className={getStatusColor(goal.status)}>
                        {goal.current_value} / {goal.target_value} {meta.unit}
                      </span>
                      <span className={`font-semibold ${getStatusColor(goal.status)}`}>{pct}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          goal.status === "completed"
                            ? "bg-emerald-500"
                            : goal.status === "expired"
                            ? "bg-red-400"
                            : ""
                        }`}
                        style={goal.status === "active" ? { background: "var(--gradient-primary)" } : {}}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => !open && setDeleteConfirm({ open: false, id: null })}
        title="Delete this goal?"
        description="This will permanently remove this goal. This action cannot be undone."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
