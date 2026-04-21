import { useState, useEffect } from "react";
import api from "../lib/api";
import AppLayout from "../components/AppLayout";
import { motion } from "framer-motion";
import { ChartBar, NotePencil, CalendarDots, Exam, Brain, TrendUp, Books, Lightning, Trophy, Target, Fire, DownloadSimple, Lightbulb, ArrowRight, Warning, Sparkle, Barbell } from "@phosphor-icons/react";


const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function StatCard({ icon: Icon, label, value, accent = "primary", sub }) {
  return (
    <motion.div variants={fadeUp} className="glass-card p-5 flex items-start gap-4" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `hsl(var(--${accent}) / 0.1)` }}
      >
        <Icon weight="duotone" className="w-5 h-5" style={{ color: `hsl(var(--${accent}))` }} />
      </div>
      <div>
        <p className="text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>{value}</p>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-1 font-mono">{sub}</p>}
      </div>
    </motion.div>
  );
}

function BarChart({ data, labelKey, valueKey, title, accent = "primary" }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d[valueKey]), 1);

  return (
    <motion.div variants={fadeUp} className="glass-card p-5" data-testid={`chart-${title.toLowerCase().replace(/\s/g, "-")}`}>
      <h3 className="text-sm font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>{title}</h3>
      <div className="space-y-2.5">
        {data.slice(0, 8).map((item) => (
          <div key={item[labelKey]} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium w-24 truncate shrink-0">{item[labelKey]}</span>
            <div className="flex-1 h-6 rounded-md bg-[hsl(var(--muted))] overflow-hidden">
              <motion.div
                className="h-full rounded-md"
                style={{ background: `hsl(var(--${accent}) / 0.6)` }}
                initial={{ width: 0 }}
                animate={{ width: `${(item[valueKey] / max) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs font-bold w-8 text-right font-mono">{item[valueKey]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ActivityTimeline({ data }) {
  if (!data || data.length === 0) {
    return (
      <motion.div variants={fadeUp} className="glass-card p-5" data-testid="chart-activity">
        <h3 className="text-sm font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>Activity (Last 30 Days)</h3>
        <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
      </motion.div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.notes + d.plans + d.exam_plans + d.quizzes), 1);

  return (
    <motion.div variants={fadeUp} className="glass-card p-5" data-testid="chart-activity">
      <h3 className="text-sm font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>Activity (Last 30 Days)</h3>
      <div className="flex items-end gap-[3px] h-32">
        {data.map((d) => {
          const total = d.notes + d.plans + d.exam_plans + d.quizzes;
          const pct = (total / maxVal) * 100;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <motion.div
                className="w-full rounded-t-sm min-h-[2px]"
                style={{ background: "hsl(var(--primary) / 0.5)" }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(pct, 2)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              <div className="absolute -top-8 bg-card border border-border px-2 py-1 rounded text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-sm">
                {d.date.slice(5)}: {total} items
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[9px] text-muted-foreground font-mono">{data[0]?.date.slice(5)}</span>
        <span className="text-[9px] text-muted-foreground font-mono">{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </motion.div>
  );
}

function NoteTypeBreakdown({ data }) {
  if (!data || data.length === 0) return null;
  const typeLabels = { quick_revision: "Quick Revision", detailed: "Detailed", exam_focused: "Exam Focused" };
  const mapped = data.map((d) => ({ type: typeLabels[d.type] || d.type, count: d.count }));

  return (
    <motion.div variants={fadeUp} className="glass-card p-5" data-testid="chart-note-types">
      <h3 className="text-sm font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>Note Types</h3>
      <div className="flex gap-3">
        {mapped.map((item) => {
          const total = mapped.reduce((s, i) => s + i.count, 0);
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div key={item.type} className="flex-1 text-center">
              <div className="text-lg font-black" style={{ fontFamily: "var(--font-heading)" }}>{pct}%</div>
              <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{item.type}</div>
              <div className="text-[9px] text-muted-foreground font-mono">{item.count}</div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function AccuracyGauge({ pct, attempts }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 70 ? "hsl(var(--primary))" : pct >= 40 ? "hsl(45, 90%, 50%)" : "hsl(0, 70%, 55%)";

  return (
    <motion.div variants={fadeUp} className="glass-card p-5 flex flex-col items-center" data-testid="accuracy-gauge">
      <h3 className="text-sm font-bold mb-4 self-start" style={{ fontFamily: "var(--font-heading)" }}>Overall Accuracy</h3>
      {attempts === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No quiz scores yet. Complete a quiz to see your accuracy.</p>
      ) : (
        <>
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="8"
                strokeLinecap="round" strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black" style={{ fontFamily: "var(--font-heading)" }}>{pct}%</span>
              <span className="text-[9px] text-muted-foreground font-mono">{attempts} quiz{attempts !== 1 ? "zes" : ""}</span>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

function SubjectAccuracy({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <motion.div variants={fadeUp} className="glass-card p-5" data-testid="subject-accuracy">
      <h3 className="text-sm font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>Accuracy by Subject</h3>
      <div className="space-y-3">
        {data.slice(0, 8).map((item) => {
          const color = item.avg_score >= 70 ? "hsl(var(--primary))" : item.avg_score >= 40 ? "hsl(45, 90%, 50%)" : "hsl(0, 70%, 55%)";
          return (
            <div key={item.subject} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium w-20 truncate shrink-0">{item.subject}</span>
              <div className="flex-1 h-6 rounded-md bg-[hsl(var(--muted))] overflow-hidden">
                <motion.div
                  className="h-full rounded-md"
                  style={{ background: color, opacity: 0.6 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.avg_score}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs font-bold w-12 text-right font-mono">{item.avg_score}%</span>
              <span className="text-[9px] text-muted-foreground font-mono w-16 text-right">{item.correct}/{item.total}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function ScoreTrend({ data }) {
  if (!data || data.length === 0) {
    return (
      <motion.div variants={fadeUp} className="glass-card p-5" data-testid="score-trend">
        <h3 className="text-sm font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>Score Trend</h3>
        <p className="text-sm text-muted-foreground text-center py-6">Complete quizzes to see your score trend over time.</p>
      </motion.div>
    );
  }

  const maxVal = 100;

  return (
    <motion.div variants={fadeUp} className="glass-card p-5" data-testid="score-trend">
      <h3 className="text-sm font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>Score Trend</h3>
      <div className="flex items-end gap-1 h-28">
        {data.map((d) => {
          const pct = d.avg_score;
          const color = pct >= 70 ? "hsl(var(--primary) / 0.6)" : pct >= 40 ? "hsl(45, 90%, 50%, 0.6)" : "hsl(0, 70%, 55%, 0.6)";
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <motion.div
                className="w-full rounded-t-sm min-h-[2px]"
                style={{ background: color }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(pct, 3)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              <div className="absolute -top-8 bg-card border border-border px-2 py-1 rounded text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-sm">
                {d.date.slice(5)}: {d.avg_score}%
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[9px] text-muted-foreground font-mono">{data[0]?.date.slice(5)}</span>
        <span className="text-[9px] text-muted-foreground font-mono">{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </motion.div>
  );
}

function StreakSection({ streaks }) {
  if (!streaks) return null;
  const { current_streak, longest_streak, total_active_days, weekly_heatmap } = streaks;
  const maxCount = Math.max(...(weekly_heatmap || []).map((d) => d.count), 1);
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <motion.div variants={fadeUp} className="glass-card p-5" data-testid="streak-section">
      <h3 className="text-sm font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>Study Streaks</h3>
      <div className="flex items-center gap-6 mb-5">
        <div className="flex items-center gap-2">
          <Fire weight="fill" className={`w-6 h-6 ${current_streak > 0 ? "text-orange-500" : "text-muted-foreground/30"}`} />
          <div>
            <div className="text-2xl font-black" style={{ fontFamily: "var(--font-heading)" }}>{current_streak}</div>
            <div className="text-[10px] text-muted-foreground">Current Streak</div>
          </div>
        </div>
        <div className="w-px h-10 bg-border" />
        <div>
          <div className="text-lg font-black" style={{ fontFamily: "var(--font-heading)" }}>{longest_streak}</div>
          <div className="text-[10px] text-muted-foreground">Longest Streak</div>
        </div>
        <div className="w-px h-10 bg-border" />
        <div>
          <div className="text-lg font-black" style={{ fontFamily: "var(--font-heading)" }}>{total_active_days}</div>
          <div className="text-[10px] text-muted-foreground">Active Days</div>
        </div>
      </div>

      {/* Heatmap */}
      {weekly_heatmap && weekly_heatmap.length > 0 && (
        <div>
          <div className="text-[10px] text-muted-foreground mb-2 font-mono">Last 7 Weeks</div>
          <div className="flex gap-[3px]">
            <div className="flex flex-col gap-[3px] mr-1">
              {dayLabels.map((l, i) => (
                <div key={i} className="text-[8px] text-muted-foreground w-3 h-3 flex items-center justify-center">{l}</div>
              ))}
            </div>
            {Array.from({ length: 7 }).map((_, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const idx = weekIdx * 7 + dayIdx;
                  const cell = weekly_heatmap[idx];
                  if (!cell) return <div key={dayIdx} className="w-3 h-3" />;
                  const intensity = cell.count > 0 ? Math.max(0.15, cell.count / maxCount) : 0;
                  return (
                    <div
                      key={dayIdx}
                      className="w-3 h-3 rounded-[2px] group relative"
                      style={{
                        background: cell.count > 0
                          ? `hsl(var(--primary) / ${intensity})`
                          : "hsl(var(--muted))",
                      }}
                      data-testid={`heatmap-${cell.date}`}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-card border border-border px-1.5 py-0.5 rounded text-[8px] font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-sm">
                        {cell.date.slice(5)}: {cell.count}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-2 justify-end">
            <span className="text-[8px] text-muted-foreground">Less</span>
            {[0, 0.15, 0.35, 0.6, 1].map((op, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-[2px]" style={{ background: op === 0 ? "hsl(var(--muted))" : `hsl(var(--primary) / ${op})` }} />
            ))}
            <span className="text-[8px] text-muted-foreground">More</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [recs, setRecs] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);

  useEffect(() => {
    api.get("/analytics")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadRecommendations = () => {
    setRecsLoading(true);
    api.get("/analytics/recommendations")
      .then((res) => setRecs(res.data.recommendations))
      .catch(() => setRecs([]))
      .finally(() => setRecsLoading(false));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get("/analytics/export");
      const blob = new Blob([res.data.report], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `StudyForge_Report_${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    } finally {
      setExporting(false);
    }
  };

  const t = data?.totals || {};

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto" data-testid="analytics-page">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <ChartBar weight="duotone" className="w-5 h-5 text-[hsl(var(--primary))]" />
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                      Study <span className="gradient-text">Analytics</span>
                    </h1>
                  </div>
                  <p className="text-sm text-muted-foreground">Track your study progress and activity.</p>
                </div>
                {!loading && (
                  <button
                    data-testid="export-report-btn"
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg border border-border hover:border-[hsl(var(--primary)/0.3)] hover:bg-[hsl(var(--primary)/0.04)] transition-all text-muted-foreground hover:text-foreground"
                  >
                    <DownloadSimple weight="bold" className="w-3.5 h-3.5" />
                    {exporting ? "Exporting..." : "Export Report"}
                  </button>
                )}
              </div>
            </motion.div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="glass-card p-5 animate-pulse">
                    <div className="h-8 bg-muted rounded w-16 mb-2" />
                    <div className="h-3 bg-muted rounded w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <StatCard icon={NotePencil} label="Notes Generated" value={t.notes || 0} accent="primary" />
                  <StatCard icon={CalendarDots} label="Study Plans" value={(t.plans || 0) + (t.exam_plans || 0)} accent="accent" sub={t.exam_plans ? `${t.exam_plans} exam plans` : undefined} />
                  <StatCard icon={Exam} label="Quizzes Taken" value={t.quizzes || 0} accent="primary" />
                  <StatCard icon={Brain} label="Questions Practiced" value={t.total_questions || 0} accent="accent" />
                </div>

                {/* Streak section */}
                <div className="mb-6">
                  <StreakSection streaks={data?.streaks} />
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <BarChart
                    data={data?.subject_breakdown}
                    labelKey="subject"
                    valueKey="count"
                    title="Top Subjects"
                    accent="primary"
                  />
                  <NoteTypeBreakdown data={data?.note_type_breakdown} />
                </div>

                {/* Activity timeline */}
                <div className="mb-6">
                  <ActivityTimeline data={data?.activity_timeline} />
                </div>

                {/* Quiz Score Tracking Section */}
                <motion.div variants={fadeUp} className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy weight="duotone" className="w-4 h-4 text-[hsl(var(--primary))]" />
                    <h2 className="text-lg font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                      Quiz <span className="gradient-text">Performance</span>
                    </h2>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <AccuracyGauge pct={data?.quiz_scores?.avg_accuracy || 0} attempts={data?.quiz_scores?.total_attempts || 0} />
                  <SubjectAccuracy data={data?.quiz_scores?.subject_accuracy} />
                </div>

                <ScoreTrend data={data?.quiz_scores?.score_trend} />

                {/* AI Recommendations Section */}
                <motion.div variants={fadeUp} className="mt-8 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb weight="duotone" className="w-4 h-4 text-[hsl(var(--accent))]" />
                      <h2 className="text-lg font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                        AI <span className="gradient-text">Recommendations</span>
                      </h2>
                    </div>
                    {!recs && (
                      <button
                        data-testid="load-recommendations-btn"
                        onClick={loadRecommendations}
                        disabled={recsLoading}
                        className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg gradient-btn text-white"
                      >
                        <Sparkle weight="bold" className="w-3.5 h-3.5" />
                        {recsLoading ? "Analyzing..." : "Get Recommendations"}
                      </button>
                    )}
                  </div>
                </motion.div>

                {recsLoading && (
                  <div className="glass-card p-6 space-y-3">
                    {[1,2,3].map((i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 bg-muted rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-muted rounded w-1/3" />
                          <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {recs && recs.length > 0 && (
                  <div className="space-y-3" data-testid="recommendations-list">
                    {recs.map((rec, i) => {
                      const icons = { weakness: Warning, strength: Trophy, reminder: CalendarDots, motivation: Fire };
                      const colors = { weakness: "destructive", strength: "primary", reminder: "accent", motivation: "primary" };
                      const Icon = icons[rec.type] || Lightbulb;
                      const accent = colors[rec.type] || "primary";
                      return (
                        <motion.div
                          key={i}
                          variants={fadeUp}
                          initial="hidden"
                          animate="visible"
                          className="glass-card p-4 flex items-start gap-3"
                          data-testid={`recommendation-${i}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0`} style={{ background: `hsl(var(--${accent}) / 0.1)` }}>
                            <Icon weight="duotone" className="w-4 h-4" style={{ color: `hsl(var(--${accent}))` }} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold mb-0.5" style={{ fontFamily: "var(--font-heading)" }}>{rec.title}</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">{rec.message}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {recs && recs.length === 0 && (
                  <div className="glass-card p-6 text-center">
                    <p className="text-sm text-muted-foreground">Not enough data for recommendations yet. Keep studying!</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
    </AppLayout>
  );
}
