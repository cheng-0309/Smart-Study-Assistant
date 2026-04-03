import { useState } from "react";
import { format } from "date-fns";
import {
  Lightning,
  Spinner,
  CalendarBlank,
  X,
  Plus,
  WarningCircle,
  GraduationCap,
} from "@phosphor-icons/react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export default function ExamPlanForm({ onGenerate, isLoading }) {
  const [subject, setSubject] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [topics, setTopics] = useState([]);
  const [examDate, setExamDate] = useState(null);
  const [hoursPerDay, setHoursPerDay] = useState("3");
  const [error, setError] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const addTopic = () => {
    const trimmed = topicInput.trim();
    if (!trimmed) return;
    if (topics.includes(trimmed)) {
      setError("Topic already added");
      return;
    }
    setTopics((prev) => [...prev, trimmed]);
    setTopicInput("");
    if (error) setError("");
  };

  const removeTopic = (idx) => {
    setTopics((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTopic();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }
    if (topics.length === 0) {
      setError("Please add at least one topic");
      return;
    }
    if (!examDate) {
      setError("Please select an exam date");
      return;
    }
    setError("");
    onGenerate(subject.trim(), topics, examDate.toISOString().split("T")[0], parseFloat(hoursPerDay));
  };

  return (
    <form
      data-testid="exam-plan-form"
      onSubmit={handleSubmit}
      className="border border-border bg-card p-6 md:p-8"
    >
      <div className="overline text-muted-foreground mb-6 flex items-center gap-2">
        <GraduationCap weight="bold" className="w-3.5 h-3.5" />
        Exam Preparation Planner
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Subject */}
        <div className="space-y-2">
          <Label htmlFor="exam-subject" className="text-sm font-medium">
            Subject <span className="text-[hsl(var(--primary))]">*</span>
          </Label>
          <Input
            data-testid="exam-subject-input"
            id="exam-subject"
            placeholder="e.g. Mathematics, Physics"
            value={subject}
            onChange={(e) => { setSubject(e.target.value); if (error) setError(""); }}
            className="rounded-sm border-border h-11 bg-background"
            disabled={isLoading}
          />
        </div>

        {/* Hours per day */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Study Hours / Day <span className="text-[hsl(var(--primary))]">*</span>
          </Label>
          <Select value={hoursPerDay} onValueChange={setHoursPerDay} disabled={isLoading}>
            <SelectTrigger data-testid="exam-hours-select" className="rounded-sm h-11 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-sm">
              {[1, 1.5, 2, 2.5, 3, 4, 5, 6, 8].map((h) => (
                <SelectItem key={h} value={String(h)}>
                  {h} {h === 1 ? "hour" : "hours"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Exam Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Exam Date <span className="text-[hsl(var(--primary))]">*</span>
          </Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                data-testid="exam-date-picker"
                variant="outline"
                className={`rounded-sm h-11 w-full justify-start text-left font-normal bg-background ${
                  !examDate ? "text-muted-foreground" : ""
                }`}
                disabled={isLoading}
              >
                <CalendarBlank weight="bold" className="w-4 h-4 mr-2" />
                {examDate ? format(examDate, "PPP") : "Pick exam date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={examDate}
                onSelect={(date) => {
                  setExamDate(date);
                  setCalendarOpen(false);
                  if (error) setError("");
                }}
                disabled={(date) => date < tomorrow}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {examDate && (
            <p className="text-xs text-muted-foreground font-mono">
              {Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24))} days from now
            </p>
          )}
        </div>

        {/* Topics Input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Topics <span className="text-[hsl(var(--primary))]">*</span>
            <span className="text-muted-foreground font-normal ml-1">({topics.length} added)</span>
          </Label>
          <div className="flex gap-2">
            <Input
              data-testid="exam-topic-input"
              placeholder="Type a topic and press Enter"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="rounded-sm border-border h-11 bg-background flex-1"
              disabled={isLoading}
            />
            <Button
              data-testid="add-topic-btn"
              type="button"
              variant="outline"
              className="rounded-sm h-11 px-3"
              onClick={addTopic}
              disabled={isLoading || !topicInput.trim()}
            >
              <Plus weight="bold" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Topics Tags */}
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4" data-testid="exam-topics-list">
          {topics.map((t, i) => (
            <span
              key={`topic-${t}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.2)] rounded-sm"
            >
              {t}
              <button
                type="button"
                onClick={() => removeTopic(i)}
                className="hover:text-destructive transition-colors"
                disabled={isLoading}
                data-testid={`remove-topic-${i}`}
              >
                <X weight="bold" className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div data-testid="exam-form-error" className="flex items-center gap-2 text-destructive text-sm mb-4 p-2.5 bg-destructive/5 border border-destructive/20 rounded-sm">
          <WarningCircle weight="bold" className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <Button
        data-testid="generate-exam-plan-btn"
        type="submit"
        disabled={isLoading}
        className="rounded-sm h-11 px-8 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 font-bold tracking-wide transition-opacity"
      >
        {isLoading ? (
          <>
            <Spinner className="w-4 h-4 mr-2 animate-spin" />
            Generating Exam Plan...
          </>
        ) : (
          <>
            <Lightning weight="bold" className="w-4 h-4 mr-2" />
            Generate Exam Plan
          </>
        )}
      </Button>
    </form>
  );
}
