import { useState, useEffect } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import Header from "../components/Header";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, Trash, Check, TrendUp, Spinner } from "@phosphor-icons/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import ConfirmDialog from "../components/ConfirmDialog";

const GOAL_TYPES = [
  { value: "pages", label: "Pages" },
  { value: "hours", label: "Hours" },
  { value: "topics", label: "Topics" },
  { value: "questions", label: "Questions" },
];

function GoalCard({ goal, onUpdate, onDelete }) {
  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(goal.current));
  const [confirmOpen, setConfirmOpen] = useState(false);

  const save = async () => {
    const num = parseInt(val) || 0;
    if (num !== goal.current) {
      await onUpdate(goal.id, { current: Math.min(num, goal.target) });
    }
    setEditing(false);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="glass-card p-5 group" data-testid={`goal-${goal.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold" style={{ fontFamily: "var(--font-heading)" }}>{goal.title}</h3>
          <span className="text-[10px] text-muted-foreground font-mono uppercase">{goal.type}</span>
        </div>
        <div className="flex gap-1">
          {pct >= 100 && <Check weight="bold" className="w-4 h-4 text-green-500" />}
          <button onClick={() => setConfirmOpen(true)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all" data-testid={`delete-goal-${goal.id}`}>
            <Trash weight="bold" className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-2 rounded-full bg-[hsl(var(--muted))] mb-2 overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: pct >= 100 ? "hsl(142, 72%, 45%)" : "hsl(var(--primary))" }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
      </div>
      <div className="flex items-center justify-between">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input value={val} onChange={(e) => setVal(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === "Enter" && save()}
              autoFocus type="number" min={0} max={goal.target} className="w-20 h-7 text-xs rounded-md" data-testid="goal-edit-input" />
            <span className="text-xs text-muted-foreground">/ {goal.target}</span>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors" data-testid={`goal-progress-${goal.id}`}>
            {goal.current} / {goal.target} ({pct}%)
          </button>
        )}
        <button onClick={() => onUpdate(goal.id, { current: Math.min(goal.current + 1, goal.target) })}
          className="text-[10px] font-bold text-[hsl(var(--primary))] hover:underline" data-testid={`goal-increment-${goal.id}`}>+1</button>
      </div>
      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={() => { setConfirmOpen(false); onDelete(goal.id); }}
        title="Delete Goal?" description="This will permanently remove this goal." />
    </motion.div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("10");
  const [type, setType] = useState("pages");
  const [creating, setCreating] = useState(false);

  useEffect(() => { api.get("/goals").then((r) => setGoals(r.data)).catch(() => {}); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await api.post("/goals", { title: title.trim(), target: parseInt(target) || 10, type });
      setGoals((prev) => [res.data, ...prev]);
      setTitle("");
      toast.success("Goal created!");
    } catch { toast.error("Failed to create goal"); }
    finally { setCreating(false); }
  };

  const handleUpdate = async (id, update) => {
    try {
      const res = await api.put(`/goals/${id}`, update);
      setGoals((prev) => prev.map((g) => g.id === id ? res.data : g));
    } catch { toast.error("Failed to update goal"); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/goals/${id}`);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      toast.success("Goal deleted");
    } catch { toast.error("Failed to delete goal"); }
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="goals-page">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-8 px-4 md:px-6">
          <div className="flex items-center gap-3 mb-6">
            <Target weight="duotone" className="w-5 h-5 text-[hsl(var(--primary))]" />
            <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              Study <span className="gradient-text">Goals</span>
            </h1>
          </div>

          {/* Create form */}
          <form onSubmit={handleCreate} className="glass-card p-5 mb-6" data-testid="goal-form">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Goal Title</Label>
                <Input data-testid="goal-title-input" placeholder="e.g. Read 50 pages of Physics" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} className="rounded-lg h-10 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Target</Label>
                <Input data-testid="goal-target-input" type="number" min={1} max={1000} value={target} onChange={(e) => setTarget(e.target.value)} className="rounded-lg h-10 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger data-testid="goal-type-select" className="rounded-lg h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{GOAL_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button data-testid="create-goal-btn" type="submit" disabled={creating || !title.trim()} className="mt-3 rounded-lg h-9 gradient-btn text-sm">
              {creating ? <Spinner className="w-4 h-4 animate-spin" /> : <><Plus weight="bold" className="w-4 h-4 mr-1" /> Add Goal</>}
            </Button>
          </form>

          {/* Goals list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {goals.map((g) => <GoalCard key={g.id} goal={g} onUpdate={handleUpdate} onDelete={handleDelete} />)}
            </AnimatePresence>
          </div>
          {goals.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No goals yet. Create one above to start tracking your progress!</div>
          )}
        </div>
      </main>
    </div>
  );
}
