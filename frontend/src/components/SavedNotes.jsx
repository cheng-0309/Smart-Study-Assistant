import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash, Clock, BookOpen, MagnifyingGlass, X } from "@phosphor-icons/react";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NoteItem({ note, isActive, onSelect, onDelete }) {
  const typeLabel = { quick_revision: "QR", detailed: "DT", exam_focused: "EF" }[note.note_type] || "";

  return (
    <motion.div
      key={note.id}
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`
        group p-3 mb-1 cursor-pointer transition-colors rounded-lg
        ${isActive
          ? "bg-[hsl(var(--primary)/0.08)] border border-[hsl(var(--primary)/0.2)]"
          : "hover:bg-muted border border-transparent"
        }
      `}
      onClick={() => onSelect(note)}
      data-testid={`saved-note-${note.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <BookOpen weight="bold" className="w-3 h-3 text-[hsl(var(--primary))] shrink-0" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground truncate">
              {note.subject}
            </span>
          </div>
          <p className="text-sm font-medium truncate leading-tight">{note.chapter}</p>
          <div className="flex items-center gap-1.5 mt-1">
            {typeLabel && (
              <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-lg bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]">
                {typeLabel}
              </span>
            )}
            <span className="font-mono text-[10px] text-muted-foreground">
              {formatDate(note.created_at)}
            </span>
          </div>
        </div>

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-testid={`delete-note-${note.id}`}
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-lg shrink-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
              >
                <Trash className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Delete</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.div>
  );
}

export default function SavedNotes({ notes, onSelect, onDelete, activeId }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return notes;
    const q = search.toLowerCase();
    return notes.filter(
      (n) =>
        n.subject?.toLowerCase().includes(q) ||
        n.chapter?.toLowerCase().includes(q) ||
        n.note_type?.toLowerCase().includes(q)
    );
  }, [notes, search]);

  return (
    <div
      data-testid="saved-notes-panel"
      className="h-full flex flex-col border-l border-border bg-card"
    >
      <div className="p-4 border-b border-border">
        <div className="overline text-muted-foreground flex items-center gap-2 mb-3">
          <Clock weight="bold" className="w-3.5 h-3.5" />
          History
        </div>
        <div className="relative">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            data-testid="notes-search-input"
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-8 text-xs rounded-lg bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--primary)/0.3)] outline-none placeholder:text-muted-foreground transition-colors"
          />
          {search && (
            <button
              data-testid="notes-search-clear"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          <AnimatePresence>
            {filtered.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground text-center py-8 px-4"
              >
                {search ? "No notes match your search." : "No saved notes yet. Generate your first note!"}
              </motion.p>
            )}
            {filtered.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                isActive={activeId === note.id}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
