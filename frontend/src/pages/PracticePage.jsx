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
  TextT,
  Hash,
  CheckSquare,
  PencilSimpleLine,
  Article,
  Eye,
  Star,
} from "@phosphor-icons/react";
import Header from "../components/Header";
import { sendToWebhook } from "../lib/webhook";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const QUESTION_TYPES = [
  { value: "mixed", label: "Mixed" },
  { value: "mcq", label: "MCQ" },
  { value: "true_false", label: "True / False" },
  { value: "numerical", label: "Numerical" },
  { value: "short_answer", label: "Short Answer" },
  { value: "long_answer", label: "Long Answer" },
];

const DIFFICULTY_LEVELS = [
  { value: "mixed", label: "Mixed" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const TYPE_LABELS = {
  mixed: "Mixed",
  mcq: "MCQ",
  true_false: "T/F",
  numerical: "Num",
  short_answer: "Short",
  long_answer: "Long",
};

const TYPE_ICONS = {
  mcq: CheckSquare,
  true_false: CheckCircle,
  numerical: Hash,
  short_answer: PencilSimpleLine,
  long_answer: Article,
};

function isAutoGradable(qt) {
  return ["mcq", "true_false", "numerical"].includes(qt);
}

/* ============== FORM ============== */
function PracticeForm({ onGenerate, isLoading }) {
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [numQuestions, setNumQuestions] = useState("5");
  const [questionType, setQuestionType] = useState("mixed");
  const [difficulty, setDifficulty] = useState("mixed");
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
    onGenerate(subject.trim(), chapter.trim(), parseInt(numQuestions), questionType, difficulty);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            className={`rounded-lg border-border h-11 bg-background ${
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
            className={`rounded-lg border-border h-11 bg-background ${
              error && !chapter.trim() ? "border-destructive ring-1 ring-destructive" : ""
            }`}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Question Type</Label>
          <Select value={questionType} onValueChange={setQuestionType} disabled={isLoading}>
            <SelectTrigger data-testid="practice-type-select" className="rounded-lg h-11 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {QUESTION_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Difficulty</Label>
          <Select value={difficulty} onValueChange={setDifficulty} disabled={isLoading}>
            <SelectTrigger data-testid="practice-difficulty-select" className="rounded-lg h-11 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {DIFFICULTY_LEVELS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Questions</Label>
          <Select value={numQuestions} onValueChange={setNumQuestions} disabled={isLoading}>
            <SelectTrigger data-testid="practice-num-select" className="rounded-lg h-11 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
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
        <div data-testid="practice-form-error" className="flex items-center gap-2 text-destructive text-sm mb-4 p-2.5 bg-destructive/5 border border-destructive/20 rounded-lg">
          <WarningCircle weight="bold" className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <Button
        data-testid="generate-practice-btn"
        type="submit"
        disabled={isLoading}
        className="rounded-lg h-11 px-8 gradient-btn tracking-wide"
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

/* ============== QUESTION TYPE BADGE ============== */
function QTypeBadge({ type }) {
  const Icon = TYPE_ICONS[type] || Exam;
  const label = TYPE_LABELS[type] || type;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
      <Icon weight="bold" className="w-3 h-3" />
      {label}
    </span>
  );
}

function DifficultyBadge({ difficulty }) {
  const styles = {
    easy: "bg-green-500/10 text-green-600 dark:text-green-400",
    medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    hard: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  const cls = styles[difficulty] || styles.medium;
  return (
    <span data-testid={`difficulty-badge-${difficulty}`} className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {difficulty || "medium"}
    </span>
  );
}

/* ============== MCQ OPTION HELPERS ============== */
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
      className={`flex items-start gap-3 p-4 border rounded-lg text-left transition-all ${border} ${bg} ${
        !submitted ? "cursor-pointer" : "cursor-default"
      }`}
    >
      <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${labelStyle}`}>
        {opt.label}
      </span>
      <span className="text-sm leading-relaxed flex-1">{opt.text}</span>
      {submitted && isCorrect && <CheckCircle weight="bold" className="w-5 h-5 text-green-500 shrink-0" />}
      {submitted && isWrong && <XCircle weight="bold" className="w-5 h-5 text-red-500 shrink-0" />}
    </button>
  );
}

/* ============== MCQ QUESTION ============== */
function MCQQuestion({ q, answer, submitted, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {q.options.map((opt) => (
        <OptionButton
          key={opt.label}
          opt={opt}
          isSelected={answer === opt.label}
          isCorrect={submitted && opt.label === q.correct_answer}
          isWrong={submitted && answer === opt.label && opt.label !== q.correct_answer}
          submitted={submitted}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

/* ============== TRUE/FALSE QUESTION ============== */
function TrueFalseQuestion({ q, answer, submitted, onSelect }) {
  const options = ["True", "False"];
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt) => {
        const isSelected = answer === opt;
        const isCorrect = submitted && opt === q.correct_answer;
        const isWrong = submitted && isSelected && opt !== q.correct_answer;
        const { border, bg } = getOptionBorderStyle(isSelected, isCorrect, isWrong, submitted);
        const labelStyle = getOptionLabelStyle(isSelected, isCorrect, isWrong, submitted);

        return (
          <button
            key={opt}
            data-testid={`tf-option-${opt.toLowerCase()}`}
            onClick={() => onSelect(opt)}
            disabled={submitted}
            className={`flex items-center justify-center gap-3 p-5 border rounded-lg transition-all ${border} ${bg} ${
              !submitted ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm font-bold ${labelStyle}`}>
              {opt === "True" ? "T" : "F"}
            </span>
            <span className="text-sm font-bold">{opt}</span>
            {submitted && isCorrect && <CheckCircle weight="bold" className="w-5 h-5 text-green-500" />}
            {submitted && isWrong && <XCircle weight="bold" className="w-5 h-5 text-red-500" />}
          </button>
        );
      })}
    </div>
  );
}

/* ============== NUMERICAL QUESTION ============== */
function NumericalQuestion({ q, answer, submitted, onAnswer }) {
  const isCorrect = submitted && String(answer).trim() === String(q.correct_answer).trim();
  const isWrong = submitted && !isCorrect && answer;

  return (
    <div className="max-w-sm">
      <div className={`border rounded-lg transition-all ${
        submitted
          ? isCorrect ? "border-green-500 bg-green-500/5" : isWrong ? "border-red-500 bg-red-500/5" : "border-border"
          : answer ? "border-[hsl(var(--primary))]" : "border-border"
      }`}>
        <div className="flex items-center gap-2 p-3">
          <Hash weight="bold" className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            data-testid="numerical-input"
            type="text"
            inputMode="numeric"
            placeholder="Enter your answer"
            value={answer || ""}
            onChange={(e) => onAnswer(e.target.value)}
            disabled={submitted}
            className="border-0 h-auto p-0 bg-transparent focus-visible:ring-0 font-mono"
          />
          {submitted && isCorrect && <CheckCircle weight="bold" className="w-5 h-5 text-green-500 shrink-0" />}
          {submitted && isWrong && <XCircle weight="bold" className="w-5 h-5 text-red-500 shrink-0" />}
        </div>
      </div>
      {submitted && (
        <div className="mt-2 text-xs font-mono text-muted-foreground">
          Correct answer: <span className="font-bold text-foreground">{q.correct_answer}</span>
        </div>
      )}
    </div>
  );
}

/* ============== SHORT ANSWER QUESTION ============== */
function ShortAnswerQuestion({ q, answer, submitted, onAnswer, showModel }) {
  return (
    <div className="space-y-3">
      <Textarea
        data-testid="short-answer-input"
        placeholder="Write your answer (2-3 sentences)..."
        value={answer || ""}
        onChange={(e) => onAnswer(e.target.value)}
        disabled={submitted}
        rows={3}
        className="rounded-lg bg-background resize-none"
      />
      {submitted && answer && (
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="rounded-lg text-[10px] font-bold uppercase tracking-widest text-amber-500 border-amber-500/30 bg-amber-500/5">
            Practice Attempted
          </Badge>
        </div>
      )}
      {submitted && showModel && q.model_answer && (
        <ModelAnswerPanel q={q} />
      )}
    </div>
  );
}

/* ============== LONG ANSWER QUESTION ============== */
function LongAnswerQuestion({ q, answer, submitted, onAnswer, showModel }) {
  return (
    <div className="space-y-3">
      <Textarea
        data-testid="long-answer-input"
        placeholder="Write a detailed response..."
        value={answer || ""}
        onChange={(e) => onAnswer(e.target.value)}
        disabled={submitted}
        rows={6}
        className="rounded-lg bg-background resize-none"
      />
      {submitted && answer && (
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="rounded-lg text-[10px] font-bold uppercase tracking-widest text-amber-500 border-amber-500/30 bg-amber-500/5">
            Practice Attempted
          </Badge>
        </div>
      )}
      {submitted && showModel && q.model_answer && (
        <ModelAnswerPanel q={q} />
      )}
    </div>
  );
}

/* ============== MODEL ANSWER PANEL ============== */
function ModelAnswerPanel({ q }) {
  return (
    <div className="border border-border bg-muted/20 rounded-lg p-4 space-y-3" data-testid="model-answer-panel">
      <div className="overline text-muted-foreground flex items-center gap-1.5">
        <Eye weight="bold" className="w-3 h-3" /> Model Answer
      </div>
      <p className="text-sm leading-relaxed">{q.model_answer}</p>
      {q.key_points && q.key_points.length > 0 && (
        <div>
          <div className="overline text-muted-foreground flex items-center gap-1.5 mb-2">
            <Star weight="bold" className="w-3 h-3" /> Key Points
          </div>
          <ul className="space-y-1.5">
            {q.key_points.map((kp, i) => (
              <li key={`kp-${i}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-lg bg-[hsl(var(--primary)/0.08)] font-mono text-[9px] font-bold text-[hsl(var(--primary))] mt-0.5 shrink-0">
                  {i + 1}
                </span>
                {kp}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ============== QUIZ NAVIGATION ============== */
function QuizNavigation({ currentQ, totalQ, answers, submitted, onPrev, onNext, onSubmit, onReset, onDotClick, questions }) {
  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== undefined && answers[k] !== "").length;

  return (
    <div className="p-4 border-t border-border flex items-center justify-between">
      <Button
        data-testid="prev-question-btn"
        variant="outline"
        size="sm"
        className="rounded-lg"
        disabled={currentQ === 0}
        onClick={onPrev}
      >
        Previous
      </Button>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalQ }).map((_, i) => {
          const qt = questions[i]?.question_type || "mcq";
          const hasAnswer = answers[i] !== undefined && answers[i] !== "";
          return (
            <button
              key={`dot-${i}`}
              onClick={() => onDotClick(i)}
              data-testid={`question-dot-${i}`}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === currentQ
                  ? "bg-[hsl(var(--primary))]"
                  : hasAnswer
                  ? isAutoGradable(qt) ? "bg-[hsl(var(--primary)/0.4)]" : "bg-amber-500/50"
                  : "bg-muted-foreground/20"
              }`}
            />
          );
        })}
      </div>

      {submitted ? (
        <Button data-testid="retake-quiz-btn" variant="outline" size="sm" className="rounded-lg" onClick={onReset}>
          Retake Test
        </Button>
      ) : currentQ < totalQ - 1 ? (
        <Button data-testid="next-question-btn" variant="outline" size="sm" className="rounded-lg gap-1" onClick={onNext}>
          Next <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      ) : (
        <Button
          data-testid="submit-quiz-btn"
          size="sm"
          className="rounded-lg gradient-btn"
          onClick={onSubmit}
          disabled={answeredCount < totalQ}
        >
          Submit Answers
        </Button>
      )}
    </div>
  );
}

/* ============== QUIZ VIEW ============== */
function QuizView({ test }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showModels, setShowModels] = useState({});

  const questions = test.questions;
  const q = questions[currentQ];
  const totalQ = questions.length;
  const qt = q.question_type || "mcq";

  const gradableQs = questions.filter((qu) => isAutoGradable(qu.question_type || "mcq"));
  const subjectiveQs = questions.filter((qu) => !isAutoGradable(qu.question_type || "mcq"));
  const score = submitted
    ? gradableQs.filter((qu, origIdx) => {
        const idx = questions.indexOf(qu);
        return String(answers[idx]).trim() === String(qu.correct_answer).trim();
      }).length
    : 0;
  const attempted = submitted
    ? subjectiveQs.filter((qu) => {
        const idx = questions.indexOf(qu);
        return answers[idx] !== undefined && answers[idx] !== "";
      }).length
    : 0;

  const handleSelect = (val) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [currentQ]: val }));
  };

  const toggleModel = (idx) => {
    setShowModels((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  function renderQuestion() {
    switch (qt) {
      case "mcq":
        return <MCQQuestion q={q} answer={answers[currentQ]} submitted={submitted} onSelect={handleSelect} />;
      case "true_false":
        return <TrueFalseQuestion q={q} answer={answers[currentQ]} submitted={submitted} onSelect={handleSelect} />;
      case "numerical":
        return <NumericalQuestion q={q} answer={answers[currentQ]} submitted={submitted} onAnswer={handleSelect} />;
      case "short_answer":
        return <ShortAnswerQuestion q={q} answer={answers[currentQ]} submitted={submitted} onAnswer={handleSelect} showModel={showModels[currentQ]} />;
      case "long_answer":
        return <LongAnswerQuestion q={q} answer={answers[currentQ]} submitted={submitted} onAnswer={handleSelect} showModel={showModels[currentQ]} />;
      default:
        return <MCQQuestion q={q} answer={answers[currentQ]} submitted={submitted} onSelect={handleSelect} />;
    }
  }

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
          {submitted && gradableQs.length > 0 && (
            <Badge data-testid="quiz-score" variant="outline" className="rounded-lg px-3 py-1.5 text-sm font-bold gap-1.5">
              <Trophy weight="bold" className="w-4 h-4 text-[hsl(var(--primary))]" />
              {score}/{gradableQs.length}
            </Badge>
          )}
          {submitted && subjectiveQs.length > 0 && (
            <Badge data-testid="quiz-attempted" variant="outline" className="rounded-lg px-3 py-1.5 text-sm font-bold gap-1.5 text-amber-500 border-amber-500/30">
              <PencilSimpleLine weight="bold" className="w-4 h-4" />
              {attempted} practiced
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
          <div className="flex items-center gap-2 mb-4">
            <QTypeBadge type={qt} />
            <DifficultyBadge difficulty={q.difficulty} />
            {!isAutoGradable(qt) && (
              <span className="text-[10px] font-medium text-muted-foreground">Self-evaluated</span>
            )}
          </div>

          <p className="text-base font-medium mb-6" data-testid={`question-${currentQ}`}>
            <span className="font-mono text-[hsl(var(--primary))] mr-2">Q{currentQ + 1}.</span>
            {q.question}
          </p>

          {renderQuestion()}

          {/* Explanation for auto-gradable */}
          {submitted && isAutoGradable(qt) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 border border-border bg-muted/30 rounded-lg"
              data-testid={`explanation-${currentQ}`}
            >
              <div className="overline text-muted-foreground mb-1">Explanation</div>
              <p className="text-sm">{q.explanation}</p>
            </motion.div>
          )}

          {/* Show/hide model answer for subjective */}
          {submitted && !isAutoGradable(qt) && (
            <div className="mt-4">
              <Button
                data-testid={`toggle-model-${currentQ}`}
                variant="outline"
                size="sm"
                className="rounded-lg gap-1.5 text-xs"
                onClick={() => toggleModel(currentQ)}
              >
                <Eye weight="bold" className="w-3.5 h-3.5" />
                {showModels[currentQ] ? "Hide" : "Show"} Model Answer
              </Button>
              {showModels[currentQ] && q.model_answer && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                  <ModelAnswerPanel q={q} />
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <QuizNavigation
        currentQ={currentQ}
        totalQ={totalQ}
        answers={answers}
        submitted={submitted}
        questions={questions}
        onPrev={() => setCurrentQ((p) => p - 1)}
        onNext={() => setCurrentQ((p) => p + 1)}
        onSubmit={() => { setSubmitted(true); setCurrentQ(0); 
          // Save quiz score
          const gradable = questions.filter((qu) => isAutoGradable(qu.question_type || "mcq"));
          const subjective = questions.filter((qu) => !isAutoGradable(qu.question_type || "mcq"));
          const correct = gradable.filter((qu) => {
            const idx = questions.indexOf(qu);
            return String(answers[idx]).trim() === String(qu.correct_answer).trim();
          }).length;
          const attemptedSubj = subjective.filter((qu) => {
            const idx = questions.indexOf(qu);
            return answers[idx] !== undefined && answers[idx] !== "";
          }).length;
          axios.post(`${API}/quiz-scores`, {
            test_id: test.id,
            subject: test.subject,
            chapter: test.chapter,
            total_gradable: gradable.length,
            correct,
            total_subjective: subjective.length,
            attempted_subjective: attemptedSubj,
          }).catch(() => {});
        }}
        onReset={() => { setAnswers({}); setSubmitted(false); setShowModels({}); setCurrentQ(0); }}
        onDotClick={setCurrentQ}
      />
    </div>
  );
}

/* ============== SIDEBAR ============== */
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

          {tests.map((test) => {
            const typeLabel = TYPE_LABELS[test.question_type] || "MCQ";
            return (
              <div
                key={test.id}
                className={`group p-3 mb-1 cursor-pointer transition-colors rounded-lg ${
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
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-lg bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]">
                        {typeLabel}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {test.num_questions} Qs
                      </span>
                    </div>
                  </div>
                  <Button
                    data-testid={`delete-test-${test.id}`}
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-lg shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(test.id);
                    }}
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ============== MAIN PAGE ============== */
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

  const handleGenerate = async (subject, chapter, numQuestions, questionType, difficulty) => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API}/practice/generate`, {
        subject,
        chapter,
        num_questions: numQuestions,
        question_type: questionType,
        difficulty,
      });
      setActiveTest(res.data);
      setTests((prev) => [res.data, ...prev]);
      toast.success("Practice test generated!");
      sendToWebhook({
        type: "quiz",
        subject,
        topic: chapter,
        question_type: questionType,
        question_count: numQuestions,
        questions: res.data.questions,
        timestamp: new Date().toISOString(),
      });
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
                    Generate practice tests with MCQs, True/False, Numerical, Short and Long Answer questions.
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
