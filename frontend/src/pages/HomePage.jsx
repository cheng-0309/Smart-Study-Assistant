import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { motion } from "framer-motion";
import {
  NotePencil, CalendarDots, Exam, Timer, Fire, Target,
  TrendUp, Brain, ChartBar, ArrowRight, Lightning, Clock,
} from "@phosphor-icons/react";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

const QUICK_ACTIONS = [
  { label: "New Note", icon: NotePencil, path: "/notes", testId: "dashboard-new-note-btn" },
  { label: "Start Timer", icon: Timer, path: "/pomodoro", testId: "dashboard-start-timer-btn" },
  { label: "Practice Quiz", icon: Exam, path: "/practice", testId: "dashboard-practice-btn" },
  { label: "Study Plan", icon: CalendarDots, path: "/planner", testId: "dashboard-planner-btn" },
];

function QuickActions() {
  const navigate = useNavigate();
  return (
    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            data-testid={a.testId}
            onClick={() => navigate(a.path)}
            className="flex items-center gap-2.5 px-4 py-3 border border-border rounded-xl bg-card hover:border-[hsl(var(--primary)/0.3)] hover:text-[hsl(var(--primary))] transition-all text-sm font-medium text-muted-foreground"
          >
            <a.icon weight="duotone" className="w-4 h-4 shrink-0" /> {a.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, accent = "primary", index }) {
  return (
    <motion.div custom={index + 1} variants={fadeUp} initial="hidden" animate="visible"
      className="border border-border rounded-xl bg-card p-5 flex items-start gap-4 hover:-translate-y-0.5 transition-transform" data-testid={`metric-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `hsl(var(--${accent}) / 0.1)` }}>
        <Icon weight="duotone" className="w-4.5 h-4.5" style={{ color: `hsl(var(--${accent}))` }} />
      </div>
      <div>
        <p className="text-2xl font-black tracking-tight leading-none" style={{ fontFamily: "var(--font-heading)" }}>{value}</p>
        <p className="text-[11px] text-muted-foreground font-medium mt-1">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

function ActiveGoals({ goals }) {
  const navigate = useNavigate();
  const active = (goals || []).filter((g) => g.current < g.target).slice(0, 4);

  return (
    <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible"
      className="border border-border rounded-xl bg-card p-5" data-testid="dashboard-goals">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target weight="duotone" className="w-4 h-4 text-[hsl(var(--primary))]" />
          <h3 className="text-sm font-bold" style={{ fontFamily: "var(--font-heading)" }}>Active Goals</h3>
        </div>
        <button onClick={() => navigate("/goals")} className="text-[10px] font-bold text-[hsl(var(--primary))] flex items-center gap-1 hover:underline">
          View All <ArrowRight weight="bold" className="w-3 h-3" />
        </button>
      </div>
      {active.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No active goals. <button onClick={() => navigate("/goals")} className="text-[hsl(var(--primary))] hover:underline">Create one</button></p>
      ) : (
        <div className="space-y-3">
          {active.map((g) => {
            const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
            return (
              <div key={g.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium truncate">{g.title}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                  <div className="h-full rounded-full bg-[hsl(var(--primary))] transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function RecentActivity({ data }) {
  const navigate = useNavigate();
  const items = (data?.activity_timeline || []).slice(-7).reverse();

  return (
    <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible"
      className="border border-border rounded-xl bg-card p-5" data-testid="dashboard-activity">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock weight="duotone" className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-bold" style={{ fontFamily: "var(--font-heading)" }}>Recent Activity</h3>
        </div>
        <button onClick={() => navigate("/history")} className="text-[10px] font-bold text-[hsl(var(--primary))] flex items-center gap-1 hover:underline">
          Full History <ArrowRight weight="bold" className="w-3 h-3" />
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No recent activity yet.</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((d, i) => {
            const total = d.notes + d.plans + d.exam_plans + d.quizzes;
            return (
              <div key={d.date} className="flex items-center gap-3 text-xs">
                <span className="font-mono text-muted-foreground w-14 shrink-0">{d.date.slice(5)}</span>
                <div className="flex-1 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                  <div className="h-full rounded-full bg-[hsl(var(--primary)/0.5)]" style={{ width: `${Math.min(100, total * 15)}%` }} />
                </div>
                <span className="font-mono text-muted-foreground w-6 text-right">{total}</span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/analytics").then((r) => setAnalytics(r.data)).catch(() => {}),
      api.get("/goals").then((r) => setGoals(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const t = analytics?.totals || {};
  const streak = analytics?.streaks || {};
  const quizPct = analytics?.quiz_scores?.avg_accuracy || 0;
  const name = user?.name || user?.email?.split("@")[0] || "Student";

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto" data-testid="dashboard-page">
        {/* Greeting */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Welcome back, <span className="gradient-text">{name}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Here's your study overview.</p>
        </motion.div>

        {/* Quick actions */}
        <div className="mb-6">
          <QuickActions />
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MetricCard icon={NotePencil} label="Notes" value={t.notes || 0} index={1} />
          <MetricCard icon={Fire} label="Day Streak" value={streak.current_streak || 0} sub={streak.longest_streak ? `Best: ${streak.longest_streak}` : undefined} accent="accent" index={2} />
          <MetricCard icon={Brain} label="Questions" value={t.total_questions || 0} index={3} />
          <MetricCard icon={TrendUp} label="Quiz Accuracy" value={`${quizPct}%`} sub={analytics?.quiz_scores?.total_attempts ? `${analytics.quiz_scores.total_attempts} quizzes` : undefined} accent="primary" index={4} />
        </div>

        {/* Goals + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ActiveGoals goals={goals} />
          <RecentActivity data={analytics} />
        </div>
      </div>
    </AppLayout>
  );
}
