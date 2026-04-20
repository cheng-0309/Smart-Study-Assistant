import { useState } from "react";
import { Lightning, Spinner, WarningCircle } from "@phosphor-icons/react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const NOTE_TYPES = [
  { value: "quick_revision", label: "Quick Revision" },
  { value: "detailed", label: "Detailed" },
  { value: "exam_focused", label: "Exam-Focused" },
];

export default function NoteForm({ onGenerate, isLoading }) {
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [noteType, setNoteType] = useState("detailed");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() && !chapter.trim()) {
      setError("Please enter subject and topic");
      return;
    }
    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }
    if (!chapter.trim()) {
      setError("Please enter a topic");
      return;
    }
    setError("");
    onGenerate(subject.trim(), chapter.trim(), noteType);
  };

  const clearError = () => { if (error) setError(""); };

  return (
    <form
      data-testid="note-form"
      onSubmit={handleSubmit}
      className="border border-border bg-card p-6 md:p-8"
    >
      <div className="overline text-muted-foreground mb-6">
        Generate Notes
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="subject" className="text-sm font-medium">
            Subject <span className="text-[hsl(var(--primary))]">*</span>
          </Label>
          <Input
            data-testid="subject-input"
            id="subject"
            placeholder="e.g. Physics, History, Biology"
            value={subject}
            onChange={(e) => { setSubject(e.target.value); clearError(); }}
            maxLength={80}
            className={`rounded-lg border-border h-11 bg-background focus:ring-1 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] ${
              error && !subject.trim() ? "border-destructive ring-1 ring-destructive" : ""
            }`}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="chapter" className="text-sm font-medium">
            Topic <span className="text-[hsl(var(--primary))]">*</span>
          </Label>
          <Input
            data-testid="chapter-input"
            id="chapter"
            placeholder="e.g. Newton's Laws of Motion"
            value={chapter}
            onChange={(e) => { setChapter(e.target.value); clearError(); }}
            maxLength={120}
            className={`rounded-lg border-border h-11 bg-background focus:ring-1 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] ${
              error && !chapter.trim() ? "border-destructive ring-1 ring-destructive" : ""
            }`}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Note Type <span className="text-[hsl(var(--primary))]">*</span>
          </Label>
          <Select value={noteType} onValueChange={setNoteType} disabled={isLoading}>
            <SelectTrigger data-testid="note-type-select" className="rounded-lg h-11 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {NOTE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div data-testid="note-form-error" className="flex items-center gap-2 text-destructive text-sm mb-4 p-2.5 bg-destructive/5 border border-destructive/20 rounded-lg">
          <WarningCircle weight="bold" className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <Button
        data-testid="generate-btn"
        type="submit"
        disabled={isLoading}
        className="rounded-lg h-11 px-8 gradient-btn tracking-wide"
      >
        {isLoading ? (
          <>
            <Spinner className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Lightning weight="bold" className="w-4 h-4 mr-2" />
            Generate Notes
          </>
        )}
      </Button>
    </form>
  );
}
