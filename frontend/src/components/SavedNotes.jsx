import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash, Clock, BookOpen, MagnifyingGlass, X, CheckSquare, Square, Tag, DownloadSimple } from "@phosphor-icons/react";
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

function NoteItem({ note, isActive, onSelect, onDelete, bulkMode, isSelected, onToggleSelect }) {
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
        ${isActive && !bulkMode
          ? "bg-[hsl(var(--primary)/0.08)] border border-[hsl(var(--primary)/0.2)]"
          : isSelected
          ? "bg-[hsl(var(--primary)/0.06)] border border-[hsl(var(--primary)/0.15)]"
          : "hover:bg-muted border border-transparent"
        }
      `}
      onClick={() => bulkMode ? onToggleSelect(note.id) : onSelect(note)}
      data-testid={`saved-note-${note.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        {bulkMode && (
          <div className="mt-0.5 shrink-0">
            {isSelected
              ? <CheckSquare weight="fill" className="w-4 h-4 text-[hsl(var(--primary))]" />
              : <Square weight="regular" className="w-4 h-4 text-muted-foreground" />
            }
          </div>
        )}
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

        {!bulkMode && (
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
        )}
      </div>
    </motion.div>
  );
}

export default function SavedNotes({ notes, onSelect, onDelete, onBulkDelete, onBulkTag, activeId }) {
  const [search, setSearch] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

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

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((n) => n.id)));
    }
  };

  const exitBulk = () => {
    setBulkMode(false);
    setSelected(new Set());
    setShowTagInput(false);
    setTagInput("");
  };

  const handleBulkDelete = () => {
    if (selected.size === 0) return;
    onBulkDelete?.(Array.from(selected));
    setSelected(new Set());
  };

  const handleBulkTag = () => {
    if (!tagInput.trim() || selected.size === 0) return;
    onBulkTag?.(Array.from(selected), tagInput.trim().toLowerCase());
    setTagInput("");
    setShowTagInput(false);
  };

  return (
    <div
      data-testid="saved-notes-panel"
      className="h-full flex flex-col border-l border-border bg-card"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="overline text-muted-foreground flex items-center gap-2">
            <Clock weight="bold" className="w-3.5 h-3.5" />
            History
          </div>
          <button
            data-testid="bulk-mode-toggle"
            onClick={() => bulkMode ? exitBulk() : setBulkMode(true)}
            className="text-[10px] font-bold text-muted-foreground hover:text-[hsl(var(--primary))] transition-colors"
          >
            {bulkMode ? "Cancel" : "Select"}
          </button>
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

      {/* Bulk actions bar */}
      <AnimatePresence>
        {bulkMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border overflow-hidden"
          >
            <div className="p-3 space-y-2" data-testid="bulk-actions-bar">
              <div className="flex items-center justify-between">
                <button
                  data-testid="bulk-select-all"
                  onClick={selectAll}
                  className="text-[10px] font-bold text-[hsl(var(--primary))]"
                >
                  {selected.size === filtered.length ? "Deselect All" : "Select All"}
                </button>
                <span className="text-[10px] text-muted-foreground font-mono">{selected.size} selected</span>
              </div>
              <div className="flex gap-1.5">
                <Button
                  data-testid="bulk-delete-btn"
                  variant="outline"
                  size="sm"
                  disabled={selected.size === 0}
                  onClick={handleBulkDelete}
                  className="rounded-lg h-7 text-[10px] gap-1 flex-1 text-destructive hover:text-destructive"
                >
                  <Trash weight="bold" className="w-3 h-3" /> Delete
                </Button>
                <Button
                  data-testid="bulk-tag-btn"
                  variant="outline"
                  size="sm"
                  disabled={selected.size === 0}
                  onClick={() => setShowTagInput((s) => !s)}
                  className="rounded-lg h-7 text-[10px] gap-1 flex-1"
                >
                  <Tag weight="bold" className="w-3 h-3" /> Tag
                </Button>
              </div>
              {showTagInput && (
                <div className="flex gap-1">
                  <input
                    data-testid="bulk-tag-input"
                    autoFocus
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleBulkTag(); }}
                    placeholder="Tag name..."
                    className="flex-1 h-7 px-2 text-[10px] rounded-md bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--primary)/0.3)] outline-none"
                  />
                  <Button size="sm" onClick={handleBulkTag} className="rounded-lg h-7 text-[10px] gradient-btn">Apply</Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                bulkMode={bulkMode}
                isSelected={selected.has(note.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
