import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import Header from "../components/Header";
import NoteForm from "../components/NoteForm";
import NoteDisplay from "../components/NoteDisplay";
import SavedNotes from "../components/SavedNotes";
import EmptyState from "../components/EmptyState";
import { AnimatePresence, motion } from "framer-motion";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HomePage() {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/notes`);
      setNotes(res.data);
    } catch (err) {
      console.error("Failed to fetch notes", err);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleGenerate = async (subject, chapter) => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API}/notes/generate`, {
        subject,
        chapter,
      });
      setActiveNote(res.data);
      setNotes((prev) => [res.data, ...prev]);
      toast.success("Notes generated successfully!");
    } catch (err) {
      console.error("Failed to generate notes", err);
      toast.error("Failed to generate notes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (activeNote?.id === id) setActiveNote(null);
      toast.success("Note deleted");
    } catch (err) {
      console.error("Failed to delete note", err);
      toast.error("Failed to delete note");
    }
  };

  const handleSelect = (note) => {
    setActiveNote(note);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onToggleSidebar={() => setSidebarOpen((p) => !p)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <main
          className="flex-1 overflow-y-auto"
          data-testid="main-content"
        >
          <div className="max-w-[960px] mx-auto py-6 px-4 md:px-6">
            <NoteForm onGenerate={handleGenerate} isLoading={isLoading} />

            {/* Loading skeleton */}
            <AnimatePresence mode="wait">
              {isLoading && (
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
                    {[8, 4, 8, 4].map((span, i) => (
                      <div
                        key={i}
                        className={`${span === 8 ? "bento-hero" : "bento-square"} border border-border bg-card p-6`}
                      >
                        <div className="space-y-3">
                          <div className="h-2.5 bg-muted rounded w-24 loading-bar" style={{ animationDelay: `${i * 0.15}s` }} />
                          {Array.from({ length: span === 8 ? 5 : 3 }).map((_, j) => (
                            <div
                              key={j}
                              className="h-3 bg-muted rounded loading-bar"
                              style={{
                                width: `${60 + Math.random() * 30}%`,
                                animationDelay: `${(i * 0.15) + (j * 0.08)}s`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {!isLoading && activeNote && (
                <motion.div
                  key="display"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-0"
                >
                  <NoteDisplay note={activeNote} />
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

        {/* Sidebar */}
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
                onSelect={handleSelect}
                onDelete={handleDelete}
                activeId={activeNote?.id}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
