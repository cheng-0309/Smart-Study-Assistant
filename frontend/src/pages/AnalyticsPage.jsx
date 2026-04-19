import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import { motion } from "framer-motion";
import { ChartBar, NotePencil, CalendarDots, Exam, Brain, TrendUp, Books, Lightning } from "@phosphor-icons/react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/analytics`)
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const t = data?.totals || {};

  return (
    <div className="min-h-screen flex flex-col" data-testid="analytics-page">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto py-8 px-4 md:px-6">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="mb-8">
              <div className="flex items-center gap-3 mb-1">
                <ChartBar weight="duotone" className="w-5 h-5 text-[hsl(var(--primary))]" />
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                  Study <span className="gradient-text">Analytics</span>
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">Track your study progress and activity.</p>
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
                <ActivityTimeline data={data?.activity_timeline} />
              </>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
