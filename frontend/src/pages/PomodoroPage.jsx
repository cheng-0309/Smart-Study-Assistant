import { useState, useEffect, useRef, useCallback } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import Header from "../components/Header";
import { motion } from "framer-motion";
import { Timer, Play, Pause, Stop, Clock, Lightning } from "@phosphor-icons/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PomodoroPage() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => { api.get("/pomodoro").then((r) => setSessions(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft]);

  // Timer complete
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      handleComplete();
    }
  }, [timeLeft, isRunning]);

  const handleComplete = async () => {
    if (!subject.trim()) { toast.info("Session complete! (not logged — no subject)"); return; }
    try {
      const res = await api.post("/pomodoro", { subject: subject.trim(), topic: topic.trim(), duration_minutes: duration });
      setSessions((prev) => [res.data, ...prev]);
      toast.success(`${duration}min session logged for ${subject}!`);
    } catch { toast.error("Failed to log session"); }
  };

  const startTimer = () => {
    if (!isRunning) {
      setTimeLeft(duration * 60);
      setIsRunning(true);
    }
  };

  const togglePause = () => setIsRunning((r) => !r);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
  };

  const pct = ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const todaySessions = sessions.filter((s) => s.created_at?.slice(0, 10) === new Date().toISOString().slice(0, 10));
  const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  return (
    <div className="min-h-screen flex flex-col" data-testid="pomodoro-page">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-8 px-4 md:px-6">
          <div className="flex items-center gap-3 mb-8">
            <Timer weight="duotone" className="w-5 h-5 text-[hsl(var(--primary))]" />
            <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              Pomodoro <span className="gradient-text">Timer</span>
            </h1>
          </div>

          {/* Timer circle */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-56 h-56 mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                <motion.circle cx="100" cy="100" r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
                  strokeLinecap="round" strokeDasharray={circumference} animate={{ strokeDashoffset: offset }} transition={{ duration: 0.3 }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black font-mono" data-testid="timer-display">{formatTime(timeLeft)}</span>
                <span className="text-xs text-muted-foreground mt-1">{isRunning ? "Focus Time" : "Ready"}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {!isRunning && timeLeft === duration * 60 ? (
                <Button data-testid="timer-start" onClick={startTimer} className="rounded-full h-12 px-8 gradient-btn gap-2">
                  <Play weight="fill" className="w-5 h-5" /> Start
                </Button>
              ) : (
                <>
                  <Button data-testid="timer-pause" onClick={togglePause} variant="outline" className="rounded-full h-12 px-6 gap-2">
                    {isRunning ? <Pause weight="fill" className="w-4 h-4" /> : <Play weight="fill" className="w-4 h-4" />}
                    {isRunning ? "Pause" : "Resume"}
                  </Button>
                  <Button data-testid="timer-reset" onClick={resetTimer} variant="outline" className="rounded-full h-12 px-6 gap-2">
                    <Stop weight="fill" className="w-4 h-4" /> Reset
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="glass-card p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Subject</Label>
                <Input data-testid="pomo-subject" placeholder="e.g. Math" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={50} className="rounded-lg h-10 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Topic (optional)</Label>
                <Input data-testid="pomo-topic" placeholder="e.g. Calculus" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={50} className="rounded-lg h-10 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duration (min)</Label>
                <Input data-testid="pomo-duration" type="number" min={1} max={120} value={duration} onChange={(e) => { setDuration(parseInt(e.target.value) || 25); if (!isRunning) setTimeLeft((parseInt(e.target.value) || 25) * 60); }} className="rounded-lg h-10 text-sm" />
              </div>
            </div>
          </div>

          {/* Today's stats */}
          <div className="glass-card p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightning weight="duotone" className="w-4 h-4 text-[hsl(var(--primary))]" />
              <span className="text-sm font-bold" style={{ fontFamily: "var(--font-heading)" }}>Today</span>
            </div>
            <div className="flex gap-6">
              <div>
                <div className="text-xl font-black" style={{ fontFamily: "var(--font-heading)" }}>{todaySessions.length}</div>
                <div className="text-[10px] text-muted-foreground">Sessions</div>
              </div>
              <div>
                <div className="text-xl font-black" style={{ fontFamily: "var(--font-heading)" }}>{todayMinutes}</div>
                <div className="text-[10px] text-muted-foreground">Minutes</div>
              </div>
            </div>
          </div>

          {/* Recent sessions */}
          {sessions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock weight="duotone" className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-bold text-muted-foreground">Recent Sessions</span>
              </div>
              <div className="space-y-2">
                {sessions.slice(0, 10).map((s) => (
                  <div key={s.id} className="glass-card p-3 flex items-center justify-between" data-testid={`session-${s.id}`}>
                    <div>
                      <span className="text-sm font-medium">{s.subject}</span>
                      {s.topic && <span className="text-xs text-muted-foreground ml-2">{s.topic}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground">{s.duration_minutes}min</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
