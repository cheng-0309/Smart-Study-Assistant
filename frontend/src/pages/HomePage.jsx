import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import { motion } from "framer-motion";
import {
  NotePencil,
  CalendarDots,
  Exam,
  Target,
  Timer,
  ChartBar,
  Fire,
  Trophy,
  ArrowRight,
  BookOpen,
  TrendUp,
  Clock,
  Brain,
  Sparkle,
  Lightning,
} from "@phosphor-icons/react";

const API = "/api";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [goals, setGoals] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [pomodoroStats, setPomodoroStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const [analyticsRes, goalsRes, historyRes, pomoRes] = await Promise.all([
        api.get(`${API}/analytics`).catch(() => ({ data: null })),
        api.get(`${API}/goals`).catch(() => ({ data: [] })),
        api.get(`${API}/history`).catch(() => ({ data: [] })),
        api.get(`${API}/pomodoro/stats`).catch(() => ({ data: null })),
      ]);
      setStats(analyticsRes.data);
      setGoals((goalsRes.data || []).filter((g) => g.status === "active").slice(0, 3));
      setRecentItems((historyRes.data || []).slice(0, 5));
      setPomodoroStats(pomoRes.data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const quickActions = [
    { icon: NotePencil, label: "Generate Notes", desc: "AI-powered study notes", path: "/notes", color: "from-violet-500 to-purple-600" },
    { icon: CalendarDots, label: "Study Planner", desc: "Plan your schedule", path: "/planner", color: "from-blue-500 to-cyan-500" },
    { icon: Exam, label: "Practice Test", desc: "Test your knowledge", path: "/practice", color: "from-emerald-500 to-teal-500" },
    { icon: Timer, label: "Pomodoro Timer", desc: "Focus session", path: "/pomodoro", color: "from-orange-500 to-red-500" },
  ];

  const typeIcons = { note: NotePencil, plan: CalendarDots, practice: Exam, exam_plan: BookOpen };
  const typeLabels = { note: "Note", plan: "Plan", practice: "Quiz", exam_plan: "Exam Plan" };

  return (
    <div className="min-h-screen">
      <Header showNav currentPage="home" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          {/* Greeting */}
          <motion.div variants={fadeUp} className="mb-6">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              {greeting()}, <span className="gradient-text">{user?.name || user?.email?.split("@")[0]}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Here's your study overview</p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              {
                icon: Fire,
                label: "Streak",
                value: `${stats?.streaks?.current_streak || 0} day${(stats?.streaks?.current_streak || 0) !== 1 ? "s" : ""}`,
                color: "text-orange-500",
                bg: "bg-orange-500/8",
              },
              {
                icon: BookOpen,
                label: "Notes",
                value: stats?.totals?.notes || 0,
                color: "text-violet-500",
                bg: "bg-violet-500/8",
              },
              {
                icon: TrendUp,
                label: "Avg Score",
                value: `${stats?.quiz_scores?.avg_accuracy || 0}%`,
                color: "text-emerald-500",
                bg: "bg-emerald-500/8",
              },
              {
                icon: Timer,
                label: "Focus Today",
                value: `${pomodoroStats?.today_minutes || 0}m`,
                color: "text-blue-500",
                bg: "bg-blue-500/8",
              },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4 rounded-xl flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} weight="duotone" />
                </div>
                <div>
                  <div className="text-lg font-bold leading-tight">{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeUp} className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Lightning weight="fill" className="w-3.5 h-3.5" /> Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <motion.button
                  key={action.path}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(action.path)}
                  className="glass-card p-4 rounded-xl text-left group cursor-pointer transition-shadow hover:shadow-lg"
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                    <action.icon className="w-4.5 h-4.5 text-white" weight="bold" />
                  </div>
                  <div className="text-sm font-semibold mb-0.5">{action.label}</div>
                  <div className="text-[11px] text-muted-foreground">{action.desc}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Two Column: Goals + Recent Activity */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Active Goals */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Target weight="fill" className="w-3.5 h-3.5" /> Active Goals
                </h2>
                <button
                  onClick={() => navigate("/goals")}
                  className="text-[11px] text-[hsl(var(--primary))] hover:underline flex items-center gap-0.5"
                >
                  View all <ArrowRight size={10} />
                </button>
              </div>
              <div className="space-y-2.5">
                {goals.length === 0 ? (
                  <div className="glass-card p-6 rounded-xl text-center">
                    <Trophy className="w-8 h-8 mx-auto text-muted-foreground/20 mb-2" weight="duotone" />
                    <p className="text-xs text-muted-foreground mb-2">No active goals</p>
                    <button
                      onClick={() => navigate("/goals")}
                      className="text-xs text-[hsl(var(--primary))] hover:underline"
                    >
                      Set your first goal →
                    </button>
                  </div>
                ) : (
                  goals.map((goal) => {
                    const pct = Math.min(100, Math.round((goal.current_value / Math.max(goal.target_value, 1)) * 100));
                    return (
                      <div key={goal.id} className="glass-card p-3.5 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium truncate max-w-[180px]">{goal.title}</span>
                          <span className="text-[10px] font-semibold text-[hsl(var(--primary))]">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ background: "var(--gradient-primary)" }}
                          />
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {goal.current_value} / {goal.target_value} · {goal.period}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Clock weight="fill" className="w-3.5 h-3.5" /> Recent Activity
                </h2>
                <button
                  onClick={() => navigate("/history")}
                  className="text-[11px] text-[hsl(var(--primary))] hover:underline flex items-center gap-0.5"
                >
                  View all <ArrowRight size={10} />
                </button>
              </div>
              <div className="glass-card rounded-xl divide-y divide-border/50">
                {recentItems.length === 0 ? (
                  <div className="p-8 text-center">
                    <Sparkle className="w-8 h-8 mx-auto text-muted-foreground/20 mb-2" weight="duotone" />
                    <p className="text-xs text-muted-foreground">No activity yet. Start by generating some notes!</p>
                  </div>
                ) : (
                  recentItems.map((item) => {
                    const Icon = typeIcons[item.type] || Brain;
                    return (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => {
                          const pathMap = { note: "/notes", plan: "/planner", practice: "/practice", exam_plan: "/planner" };
                          navigate(pathMap[item.type] || "/history");
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary)/0.08)] flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-[hsl(var(--primary))]" weight="duotone" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{item.title}</div>
                          <div className="text-[10px] text-muted-foreground">{item.subtitle}</div>
                        </div>
                        <div className="text-[10px] text-muted-foreground shrink-0">
                          {typeLabels[item.type]}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>

          {/* Bottom row: Study insights */}
          {stats && (stats.totals?.notes > 0 || stats.totals?.quizzes > 0) && (
            <motion.div variants={fadeUp} className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Subjects studied */}
              <div className="glass-card p-4 rounded-xl">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Top Subjects</h3>
                <div className="space-y-2">
                  {(stats.subject_breakdown || []).slice(0, 4).map((s) => (
                    <div key={s.subject} className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[140px]">{s.subject}</span>
                      <span className="font-semibold text-[hsl(var(--primary))]">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quiz Performance */}
              <div className="glass-card p-4 rounded-xl">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quiz Performance</h3>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[hsl(var(--primary))]">{stats.quiz_scores?.avg_accuracy || 0}%</div>
                    <div className="text-[10px] text-muted-foreground">Avg Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.quiz_scores?.total_attempts || 0}</div>
                    <div className="text-[10px] text-muted-foreground">Quizzes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totals?.total_questions || 0}</div>
                    <div className="text-[10px] text-muted-foreground">Questions</div>
                  </div>
                </div>
              </div>

              {/* Pomodoro This Week */}
              <div className="glass-card p-4 rounded-xl">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Focus This Week</h3>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">{pomodoroStats?.week_sessions || 0}</div>
                    <div className="text-[10px] text-muted-foreground">Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">{pomodoroStats?.week_minutes || 0}m</div>
                    <div className="text-[10px] text-muted-foreground">Focus Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{Math.round((pomodoroStats?.total_minutes || 0) / 60)}h</div>
                    <div className="text-[10px] text-muted-foreground">All Time</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
