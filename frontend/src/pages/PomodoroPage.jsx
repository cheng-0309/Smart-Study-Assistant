import { useState, useEffect, useRef, useCallback } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Header from "../components/Header";
import { sendToWebhook } from "../lib/webhook";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Timer,
  Play,
  Pause,
  Stop,
  Coffee,
  ArrowClockwise,
  Clock,
} from "@phosphor-icons/react";

const API = "/api";

export default function PomodoroPage() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef(null);

  const [stats, setStats] = useState(null);
  const [todaySessions, setTodaySessions] = useState([]);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        api.get(`${API}/pomodoro/stats`),
        api.get(`${API}/pomodoro/sessions`),
      ]);
      setStats(statsRes.data);
      const today = new Date().toISOString().slice(0, 10);
      setTodaySessions(sessionsRes.data.filter((s) => s.created_at?.slice(0, 10) === today));
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(intervalRef.current);
      handleTimerComplete();
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, timeLeft]);

  const handleTimerComplete = async () => {
    if (isBreak) {
      // Break finished → start new work session
      toast.success("Break over! Ready for another session?");
      setIsBreak(false);
      setTimeLeft(workMinutes * 60);
      setIsRunning(false);
    } else {
      // Work session finished
      setSessionsCompleted((prev) => prev + 1);
      toast.success("Session complete! Great work! 🎉");

      // Save session
      try {
        await api.post(`${API}/pomodoro/sessions`, {
          subject: subject || "General",
          topic: topic || "",
          duration_minutes: workMinutes,
          break_minutes: breakMinutes,
          completed: true,
        });
        sendToWebhook({
          type: "pomodoro_session",
          subject: subject || "General",
          topic: topic || "",
          duration_minutes: workMinutes,
          timestamp: new Date().toISOString(),
        });
        fetchStats();
      } catch {
        toast.error("Failed to save session");
      }

      // Switch to break
      setIsBreak(true);
      setTimeLeft(breakMinutes * 60);
      setIsRunning(false);
    }
  };

  const startTimer = () => {
    if (!isRunning && !isBreak && !subject.trim()) {
      toast.error("Please enter a subject first");
      return;
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    clearInterval(intervalRef.current);
    setTimeLeft(workMinutes * 60);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const totalSeconds = isBreak ? breakMinutes * 60 : workMinutes * 60;
  const progressPct = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  return (
    <div className="min-h-screen">
      <Header showNav currentPage="pomodoro" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Timer className="w-7 h-7 text-[hsl(var(--primary))]" weight="duotone" />
            Pomodoro Timer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Focus sessions with tracked study time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timer */}
          <div className="lg:col-span-2">
            <div className="glass-card p-8 rounded-2xl text-center">
              {/* Subject/Topic inputs */}
              {!isRunning && !isBreak && (
                <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
                  <div className="space-y-1 text-left">
                    <Label className="text-xs">Subject *</Label>
                    <Input
                      placeholder="e.g. Physics"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      maxLength={80}
                      className="h-10 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <Label className="text-xs">Topic (optional)</Label>
                    <Input
                      placeholder="e.g. Thermodynamics"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      maxLength={120}
                      className="h-10 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Timer display */}
              <div className="relative w-56 h-56 mx-auto mb-8">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke={isBreak ? "#22c55e" : "hsl(var(--primary))"}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 54}`}
                    strokeDashoffset={`${2 * Math.PI * 54 * (1 - progressPct / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-mono font-bold tracking-wider">{formatTime(timeLeft)}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {isBreak ? (
                      <><Coffee size={14} /> Break</>
                    ) : (
                      <><Clock size={14} /> Focus</>
                    )}
                  </div>
                </div>
              </div>

              {/* Badge showing subject */}
              {(isRunning || isBreak) && subject && (
                <Badge className="mb-4" variant="outline">{subject}{topic ? ` · ${topic}` : ""}</Badge>
              )}

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                {!isRunning ? (
                  <Button
                    onClick={startTimer}
                    className="gap-2 rounded-xl h-12 px-8"
                    style={{ background: isBreak ? "#22c55e" : "var(--gradient-primary)" }}
                  >
                    <Play weight="fill" size={18} />
                    {isBreak ? "Start Break" : timeLeft < totalSeconds ? "Resume" : "Start"}
                  </Button>
                ) : (
                  <Button onClick={pauseTimer} variant="outline" className="gap-2 rounded-xl h-12 px-8">
                    <Pause weight="fill" size={18} />
                    Pause
                  </Button>
                )}
                <Button onClick={resetTimer} variant="ghost" size="icon" className="rounded-xl h-12 w-12">
                  <ArrowClockwise size={20} />
                </Button>
              </div>

              {/* Duration settings (only when not running) */}
              {!isRunning && !isBreak && (
                <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Work:</Label>
                    <select
                      value={workMinutes}
                      onChange={(e) => { setWorkMinutes(+e.target.value); setTimeLeft(+e.target.value * 60); }}
                      className="bg-transparent border rounded-md px-2 py-1 text-xs"
                    >
                      {[15, 20, 25, 30, 45, 50, 60].map((m) => (
                        <option key={m} value={m}>{m} min</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Break:</Label>
                    <select
                      value={breakMinutes}
                      onChange={(e) => setBreakMinutes(+e.target.value)}
                      className="bg-transparent border rounded-md px-2 py-1 text-xs"
                    >
                      {[3, 5, 10, 15].map((m) => (
                        <option key={m} value={m}>{m} min</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Sessions count */}
              <div className="mt-6 text-xs text-muted-foreground">
                Sessions today: <span className="font-semibold text-[hsl(var(--primary))]">{todaySessions.length + sessionsCompleted}</span>
              </div>
            </div>
          </div>

          {/* Stats sidebar */}
          <div className="space-y-4">
            {/* Today */}
            <div className="glass-card p-4 rounded-xl">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[hsl(var(--primary))]" /> Today
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xl font-bold text-[hsl(var(--primary))]">{stats?.today_sessions || 0}</div>
                  <div className="text-[10px] text-muted-foreground">Sessions</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-[hsl(var(--primary))]">{stats?.today_minutes || 0}m</div>
                  <div className="text-[10px] text-muted-foreground">Focus Time</div>
                </div>
              </div>
            </div>

            {/* This Week */}
            <div className="glass-card p-4 rounded-xl">
              <h3 className="text-sm font-semibold mb-3">This Week</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xl font-bold">{stats?.week_sessions || 0}</div>
                  <div className="text-[10px] text-muted-foreground">Sessions</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{stats?.week_minutes || 0}m</div>
                  <div className="text-[10px] text-muted-foreground">Focus Time</div>
                </div>
              </div>
            </div>

            {/* All Time */}
            <div className="glass-card p-4 rounded-xl">
              <h3 className="text-sm font-semibold mb-3">All Time</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xl font-bold">{stats?.total_sessions || 0}</div>
                  <div className="text-[10px] text-muted-foreground">Sessions</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{Math.round((stats?.total_minutes || 0) / 60)}h</div>
                  <div className="text-[10px] text-muted-foreground">Total Hours</div>
                </div>
              </div>
            </div>

            {/* Subject Breakdown */}
            {stats?.subject_breakdown?.length > 0 && (
              <div className="glass-card p-4 rounded-xl">
                <h3 className="text-sm font-semibold mb-3">By Subject</h3>
                <div className="space-y-2">
                  {stats.subject_breakdown.slice(0, 5).map((s) => (
                    <div key={s.subject} className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[120px]">{s.subject}</span>
                      <span className="text-muted-foreground">{s.minutes}m · {s.sessions}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
