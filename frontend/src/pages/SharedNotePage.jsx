import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import NoteDisplay from "../components/NoteDisplay";
import { Spinner } from "@phosphor-icons/react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SharedNotePage() {
  const { shareId } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axios.get(`${API}/shared/${shareId}`, { withCredentials: true })
      .then((res) => setNote(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [shareId]);

  return (
    <div className="min-h-screen flex flex-col" data-testid="shared-note-page">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[960px] mx-auto py-6 px-4 md:px-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Spinner className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
          )}
          {error && (
            <div className="text-center py-20" data-testid="shared-note-error">
              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>Note Not Found</h2>
              <p className="text-sm text-muted-foreground">This shared link may have expired or doesn't exist.</p>
            </div>
          )}
          {note && <NoteDisplay note={note} />}
        </div>
      </main>
    </div>
  );
}
