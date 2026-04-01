import { motion, AnimatePresence } from "framer-motion";
import { Trash, Clock, BookOpen } from "@phosphor-icons/react";
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
  return (
    <motion.div
      key={note.id}
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`
        group p-3 mb-1 cursor-pointer transition-colors rounded-sm
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
          <span className="font-mono text-[10px] text-muted-foreground mt-1 block">
            {formatDate(note.created_at)}
          </span>
        </div>

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-testid={`delete-note-${note.id}`}
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-sm shrink-0 text-muted-foreground hover:text-destructive"
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
  return (
    <div
      data-testid="saved-notes-panel"
      className="h-full flex flex-col border-l border-border bg-card"
    >
      <div className="p-4 border-b border-border">
        <div className="overline text-muted-foreground flex items-center gap-2">
          <Clock weight="bold" className="w-3.5 h-3.5" />
          History
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          <AnimatePresence>
            {notes.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground text-center py-8 px-4"
              >
                No saved notes yet. Generate your first note!
              </motion.p>
            )}
            {notes.map((note) => (
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
