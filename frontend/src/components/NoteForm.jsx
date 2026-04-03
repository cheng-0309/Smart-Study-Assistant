import { useState } from "react";
import { Lightning, Spinner, WarningCircle } from "@phosphor-icons/react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";

export default function NoteForm({ onGenerate, isLoading }) {
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [error, setError] = useState("");

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
    onGenerate(subject.trim(), chapter.trim());
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            className={`rounded-sm border-border h-11 bg-background focus:ring-1 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] ${
              error && !subject.trim() ? "border-destructive ring-1 ring-destructive" : ""
            }`}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="chapter" className="text-sm font-medium">
            Chapter <span className="text-[hsl(var(--primary))]">*</span>
          </Label>
          <Input
            data-testid="chapter-input"
            id="chapter"
            placeholder="e.g. Newton's Laws of Motion"
            value={chapter}
            onChange={(e) => { setChapter(e.target.value); clearError(); }}
            className={`rounded-sm border-border h-11 bg-background focus:ring-1 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] ${
              error && !chapter.trim() ? "border-destructive ring-1 ring-destructive" : ""
            }`}
            disabled={isLoading}
          />
        </div>
      </div>

      {error && (
        <div data-testid="note-form-error" className="flex items-center gap-2 text-destructive text-sm mb-4 p-2.5 bg-destructive/5 border border-destructive/20 rounded-sm">
          <WarningCircle weight="bold" className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <Button
        data-testid="generate-btn"
        type="submit"
        disabled={isLoading}
        className="rounded-sm h-11 px-8 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 font-bold tracking-wide transition-opacity"
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
