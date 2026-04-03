import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Exam,
  Lightning,
  Spinner,
  Trash,
  CheckCircle,
  XCircle,
  ArrowRight,
  Trophy,
  ListBullets,
  WarningCircle,
} from "@phosphor-icons/react";
import Header from "../components/Header";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function PracticeForm({ onGenerate, isLoading }) {
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [numQuestions, setNumQuestions] = useState("5");
  const [error, setError] = useState("");

  const clearError = () => { if (error) setError(""); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() && !chapter.trim()) {
      setError("Please enter subject and chapter");
      return;
    }
    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }
    if (!chapter.trim()) {
      setError("Please enter a chapter");
      return;
    }
    setError("");
    onGenerate(subject.trim(), chapter.trim(), parseInt(numQuestions));
  };

  return (
    <form
      data-testid="practice-form"
      onSubmit={handleSubmit}
      className="border border-border bg-card p-6 md:p-8"
    >
      <div className="overline text-muted-foreground mb-6">
        Generate Practice Test
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="practice-subject" className="text-sm font-medium">
            Subject <span className="text-[hsl(var(--primary))]">*</span>
          </Label>
          <Input
            data-testid="practice-subject-input"
            id="practice-subject"
            placeholder="e.g. Physics, History"
            value={subject}
            onChange={(e) => { setSubject(e.target.value); clearError(); }}
            className={`rounded-sm border-border h-11 bg-background ${
              error && !subject.trim() ? "border-destructive ring-1 ring-destructive" : ""
            }`}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="practice-chapter" className="text-sm font-medium">
            Chapter <span className="text-[hsl(var(--primary))]">*</span>
          </Label>
          <Input
            data-testid="practice-chapter-input"
            id="practice-chapter"
            placeholder="e.g. Newton's Laws"
            value={chapter}
            onChange={(e) => { setChapter(e.target.value); clearError(); }}
            className={`rounded-sm border-border h-11 bg-background ${
              error && !chapter.trim() ? "border-destructive ring-1 ring-destructive" : ""
            }`}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Questions</Label>
          <Select value={numQuestions} onValueChange={setNumQuestions} disabled={isLoading}>
            <SelectTrigger data-testid="practice-num-select" className="rounded-sm h-11 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-sm">
              {[3, 5, 7, 10].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} questions
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div data-testid="practice-form-error" className="flex items-center gap-2 text-destructive text-sm mb-4 p-2.5 bg-destructive/5 border border-destructive/20 rounded-sm">
          <WarningCircle weight="bold" className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <Button
        data-testid="generate-practice-btn"
        type="submit"
        disabled={isLoading}
        className="rounded-sm h-11 px-8 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 font-bold tracking-wide transition-opacity"
      >
        {isLoading ? (
          <>
            <Spinner className="w-4 h-4 mr-2 animate-spin" />
            Generating Test...
          </>
        ) : (
          <>
            <Lightning weight="bold" className="w-4 h-4 mr-2" />
            Generate Test
          </>
        )}
      </Button>
    </form>
  );
}

function getOptionLabelStyle(isSelected, isCorrect, isWrong, submitted) {
  if (isSelected && !submitted) return "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]";
  if (isCorrect) return "bg-green-500 text-white";
  if (isWrong) return "bg-red-500 text-white";
  return "bg-muted text-muted-foreground";
}

function getOptionBorderStyle(isSelected, isCorrect, isWrong, submitted) {
  if (submitted) {
    if (isCorrect) return { border: "border-green-500", bg: "bg-green-500/5" };
    if (isWrong) return { border: "border-red-500", bg: "bg-red-500/5" };
    return { border: "border-border opacity-50", bg: "bg-background" };
  }
  if (isSelected) return { border: "border-[hsl(var(--primary))]", bg: "bg-[hsl(var(--primary)/0.05)]" };
  return { border: "border-border hover:border-[hsl(var(--primary)/0.4)]", bg: "bg-background" };
}

function OptionButton({ opt, isSelected, isCorrect, isWrong, submitted, onSelect }) {
  const { border, bg } = getOptionBorderStyle(isSelected, isCorrect, isWrong, submitted);
  const labelStyle = getOptionLabelStyle(isSelected, isCorrect, isWrong, submitted);

  return (
    <button
      data-testid={`option-${opt.label}`}
      onClick={() => onSelect(opt.label)}
      disabled={submitted}
      className={`flex items-start gap-3 p-4 border rounded-sm text-left transition-all ${border} ${bg} ${
        !submitted ? "cursor-pointer" : "cursor-default"
      }`}
    >
      <span className={`shrink-0 w-7 h-7 rounded-sm flex items-center justify-center font-mono text-xs font-bold ${labelStyle}`}>
        {opt.label}
      </span>
      <span className="text-sm leading-relaxed flex-1">{opt.text}</span>
      {submitted && isCorrect && <CheckCircle weight="bold" className="w-5 h-5 text-green-500 shrink-0" />}
      {submitted && isWrong && <XCircle weight="bold" className="w-5 h-5 text-red-500 shrink-0" />}
    </button>
  );
}

function QuizNavigation({ currentQ, totalQ, answers, submitted, onPrev, onNext, onSubmit, onReset, onDotClick }) {
  return (
    <div className="p-4 border-t border-border flex items-center justify-between">
      <Button
        data-testid="prev-question-btn"
        variant="outline"
        size="sm"
        className="rounded-sm"
        disabled={currentQ === 0}
        onClick={onPrev}
      >
        Previous
      </Button>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalQ }).map((_, i) => (
          <button
            key={`dot-${i}`}
            onClick={() => onDotClick(i)}
            data-testid={`question-dot-${i}`}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === currentQ
                ? "bg-[hsl(var(--primary))]"
                : answers[i]
                ? "bg-[hsl(var(--primary)/0.4)]"
                : "bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>

      {submitted ? (
        <Button data-testid="retake-quiz-btn" variant="outline" size="sm" className="rounded-sm" onClick={onReset}>
          Retake Test
        </Button>
      ) : currentQ < totalQ - 1 ? (
        <Button data-testid="next-question-btn" variant="outline" size="sm" className="rounded-sm gap-1" onClick={onNext}>
          Next <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      ) : (
        <Button
          data-testid="submit-quiz-btn"
          size="sm"
          className="rounded-sm bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 font-bold"
          onClick={onSubmit}
          disabled={Object.keys(answers).length < totalQ}
        >
          Submit Answers
        </Button>
      )}
    </div>
  );
}

function QuizView({ test }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const questions = test.questions;
  const q = questions[currentQ];
  const totalQ = questions.length;

  const score = submitted
    ? Object.entries(answers).filter(
        ([idx, ans]) => questions[parseInt(idx)]?.correct_answer === ans
      ).length
    : 0;

  const handleSelect = (label) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [currentQ]: label }));
  };

  return (
    <div data-testid="quiz-view" className="border border-border bg-card">
      {/* Header */}
      <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Exam weight="bold" className="w-5 h-5 text-[hsl(var(--primary))]" />
            <h2 className="text-lg font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              Practice Test
            </h2>
          </div>
          <div className="overline text-muted-foreground mb-1">{test.subject}</div>
          <h3 className="text-xl md:text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            {test.chapter}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {submitted && (
            <Badge data-testid="quiz-score" variant="outline" className="rounded-sm px-3 py-1.5 text-sm font-bold gap-1.5">
              <Trophy weight="bold" className="w-4 h-4 text-[hsl(var(--primary))]" />
              {score}/{totalQ}
            </Badge>
          )}
          <div className="font-mono text-xs text-muted-foreground">{currentQ + 1} / {totalQ}</div>
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="p-6"
        >
          <p className="text-base font-medium mb-6" data-testid={`question-${currentQ}`}>
            <span className="font-mono text-[hsl(var(--primary))] mr-2">Q{currentQ + 1}.</span>
            {q.question}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {q.options.map((opt) => (
              <OptionButton
                key={opt.label}
                opt={opt}
                isSelected={answers[currentQ] === opt.label}
                isCorrect={submitted && opt.label === q.correct_answer}
                isWrong={submitted && answers[currentQ] === opt.label && opt.label !== q.correct_answer}
                submitted={submitted}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 border border-border bg-muted/30 rounded-sm"
              data-testid={`explanation-${currentQ}`}
            >
              <div className="overline text-muted-foreground mb-1">Explanation</div>
              <p className="text-sm">{q.explanation}</p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <QuizNavigation
        currentQ={currentQ}
        totalQ={totalQ}
        answers={answers}
        submitted={submitted}
        onPrev={() => setCurrentQ((p) => p - 1)}
        onNext={() => setCurrentQ((p) => p + 1)}
        onSubmit={() => { setSubmitted(true); setCurrentQ(0); }}
        onReset={() => { setAnswers({}); setSubmitted(false); setCurrentQ(0); }}
        onDotClick={setCurrentQ}
      />
    </div>
  );
}

function PracticeHistory({ tests, onSelect, onDelete, activeId }) {
  return (
    <div
      data-testid="practice-history-panel"
      className="h-full flex flex-col border-l border-border bg-card"
    >
      <div className="p-4 border-b border-border">
        <div className="overline text-muted-foreground flex items-center gap-2">
          <ListBullets weight="bold" className="w-3.5 h-3.5" />
          Past Tests
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {tests.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8 px-4">
              No practice tests yet.
            </p>
          )}

          {tests.map((test) => (
            <div
              key={test.id}
              className={`group p-3 mb-1 cursor-pointer transition-colors rounded-sm ${
                activeId === test.id
                  ? "bg-[hsl(var(--primary)/0.08)] border border-[hsl(var(--primary)/0.2)]"
                  : "hover:bg-muted border border-transparent"
              }`}
              onClick={() => onSelect(test)}
              data-testid={`saved-test-${test.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {test.subject}
                  </span>
                  <p className="text-sm font-medium truncate">{test.chapter}</p>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {test.num_questions} Qs
                  </span>
                </div>
                <Button
                  data-testid={`delete-test-${test.id}`}
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-sm shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(test.id);
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

export default function PracticePage() {
  const [tests, setTests] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    async function loadTests() {
      try {
        const res = await axios.get(`${API}/practices`);
        setTests(res.data);
      } catch {
        /* silent on initial load */
      }
    }
    loadTests();
  }, []);

  const handleGenerate = async (subject, chapter, numQuestions) => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API}/practice/generate`, {
        subject,
        chapter,
        num_questions: numQuestions,
      });
      setActiveTest(res.data);
      setTests((prev) => [res.data, ...prev]);
      toast.success("Practice test generated!");
    } catch {
      toast.error("Failed to generate test. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/practices/${id}`);
      setTests((prev) => prev.filter((t) => t.id !== id));
      if (activeTest?.id === id) setActiveTest(null);
      toast.success("Test deleted");
    } catch {
      toast.error("Failed to delete test");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onToggleSidebar={() => setSidebarOpen((p) => !p)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto" data-testid="practice-content">
          <div className="max-w-[960px] mx-auto py-6 px-4 md:px-6">
            <PracticeForm onGenerate={handleGenerate} isLoading={isLoading} />

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
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={`skel-${i}`} className="space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4 loading-bar" style={{ animationDelay: `${i * 0.2}s` }} />
                        <div className="grid grid-cols-2 gap-2">
                          <div className="h-12 bg-muted rounded loading-bar" style={{ animationDelay: `${i * 0.2 + 0.1}s` }} />
                          <div className="h-12 bg-muted rounded loading-bar" style={{ animationDelay: `${i * 0.2 + 0.15}s` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {!isLoading && activeTest && (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-0"
                >
                  <QuizView test={activeTest} />
                </motion.div>
              )}

              {!isLoading && !activeTest && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20 px-6"
                >
                  <Exam weight="thin" className="w-20 h-20 text-muted-foreground/30 mb-4" />
                  <h3
                    className="text-xl font-black tracking-tight mb-2"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Test your knowledge
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    Generate AI-powered MCQ practice tests with instant feedback and explanations.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              data-testid="practice-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="hidden md:block overflow-hidden shrink-0"
            >
              <PracticeHistory
                tests={tests}
                onSelect={setActiveTest}
                onDelete={handleDelete}
                activeId={activeTest?.id}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
