import { useState, useEffect } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import Header from "../components/Header";
import NoteForm from "../components/NoteForm";
import NoteDisplay from "../components/NoteDisplay";
import SavedNotes from "../components/SavedNotes";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import { AnimatePresence, motion } from "framer-motion";
import { sendToWebhook } from "../lib/webhook";

const API = "/api";

const SKELETON_SPANS = [
  { span: 8, id: "hero-1" },
  { span: 4, id: "square-1" },
  { span: 8, id: "wide-1" },
  { span: 4, id: "square-2" },
];

function LoadingSkeleton() {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mt-0"
      data-testid="loading-skeleton"
    >
      <div className="border border-border bg-card p-6">
        <div className="space-y-3">
          <div className="h-3 bg-muted rounded w-1/4 loading-bar" />
          <div className="h-6 bg-muted rounded w-2/3 loading-bar" style={{ animationDelay: "0.1s" }} />
        </div>
      </div>
      <div className="bento-grid">
        {SKELETON_SPANS.map(({ span, id }, i) => (
          <div
            key={id}
            className={`${span === 8 ? "bento-hero" : "bento-square"} border border-border bg-card p-6`}
          >
            <div className="space-y-3">
              <div className="h-2.5 bg-muted rounded w-24 loading-bar" style={{ animationDelay: `${i * 0.15}s` }} />
              {Array.from({ length: span === 8 ? 5 : 3 }).map((_, j) => (
                <div
                  key={`${id}-line-${j}`}
                  className="h-3 bg-muted rounded loading-bar"
                  style={{
                    width: `${65 + j * 5}%`,
                    animationDelay: `${(i * 0.15) + (j * 0.08)}s`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, bulk: false, ids: [] });

  useEffect(() => {
    async function loadNotes() {
      try {
        const res = await api.get(`${API}/notes`);
        setNotes(res.data);
      } catch {
        /* silent on initial load */
      }
    }
    loadNotes();
  }, []);

  const handleGenerate = async (subject, chapter, noteType) => {
    setIsLoading(true);
    try {
      const res = await api.post(`${API}/notes/generate`, {
        subject,
        chapter,
        note_type: noteType,
      });
      setActiveNote(res.data);
      setNotes((prev) => [res.data, ...prev]);
      toast.success("Notes generated successfully!");
      sendToWebhook({
        type: "notes",
        subject,
        topic: chapter,
        note_type: noteType,
        content: res.data.content,
        timestamp: new Date().toISOString(),
      });
    } catch {
      toast.error("Failed to generate notes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteConfirm({ open: true, id, bulk: false, ids: [] });
  };

  const handleConfirmDelete = async () => {
    const { id, bulk, ids } = deleteConfirm;
    setDeleteConfirm({ open: false, id: null, bulk: false, ids: [] });
    if (bulk) {
      try {
        await Promise.all(ids.map((i) => api.delete(`${API}/notes/${i}`)));
        setNotes((prev) => prev.filter((n) => !ids.includes(n.id)));
        if (activeNote && ids.includes(activeNote.id)) setActiveNote(null);
        toast.success(`${ids.length} note(s) deleted`);
      } catch {
        toast.error("Failed to delete some notes");
      }
    } else {
      try {
        await api.delete(`${API}/notes/${id}`);
        setNotes((prev) => prev.filter((n) => n.id !== id));
        if (activeNote?.id === id) setActiveNote(null);
        toast.success("Note deleted");
      } catch {
        toast.error("Failed to delete note");
      }
    }
  };

  const handleNoteUpdate = (updatedNote) => {
    setActiveNote(updatedNote);
    setNotes((prev) => prev.map((n) => n.id === updatedNote.id ? updatedNote : n));
  };

  const handleBulkDelete = async (ids) => {
    setDeleteConfirm({ open: true, id: null, bulk: true, ids });
  };

  const handleBulkTag = async (ids, tag) => {
    try {
      await Promise.all(ids.map(async (id) => {
        const note = notes.find((n) => n.id === id);
        const existingTags = note?.tags || [];
        if (!existingTags.includes(tag)) {
          await api.put(`${API}/notes/${id}`, { tags: [...existingTags, tag] });
        }
      }));
      setNotes((prev) => prev.map((n) => {
        if (ids.includes(n.id) && !(n.tags || []).includes(tag)) {
          return { ...n, tags: [...(n.tags || []), tag] };
        }
        return n;
      }));
      toast.success(`Tag "${tag}" added to ${ids.length} note(s)`);
    } catch {
      toast.error("Failed to tag some notes");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onToggleSidebar={() => setSidebarOpen((p) => !p)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        <main
          className="flex-1 overflow-y-auto"
          data-testid="main-content"
        >
          <div className="max-w-[960px] mx-auto py-6 px-4 md:px-6">
            <NoteForm onGenerate={handleGenerate} isLoading={isLoading} />

            <AnimatePresence mode="wait">
              {isLoading && <LoadingSkeleton />}

              {!isLoading && activeNote && (
                <motion.div
                  key="display"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-0"
                >
                  <NoteDisplay note={activeNote} onNoteUpdate={handleNoteUpdate} />
                </motion.div>
              )}

              {!isLoading && !activeNote && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <EmptyState />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              data-testid="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="hidden md:block overflow-hidden shrink-0"
            >
              <SavedNotes
                notes={notes}
                onSelect={setActiveNote}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                onBulkTag={handleBulkTag}
                activeId={activeNote?.id}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => !open && setDeleteConfirm({ open: false, id: null, bulk: false, ids: [] })}
        title={deleteConfirm.bulk ? `Delete ${deleteConfirm.ids.length} note(s)?` : "Delete this note?"}
        description="This will permanently remove the selected note(s). This action cannot be undone."
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
