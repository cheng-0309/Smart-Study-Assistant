import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "./components/ui/sonner";
import HomePage from "./pages/HomePage";
import NotesPage from "./pages/NotesPage";
import PlannerPage from "./pages/PlannerPage";
import PracticePage from "./pages/PracticePage";
import HistoryPage from "./pages/HistoryPage";
import AnalyticsPage from "./pages/AnalyticsPage";

function BackgroundBlobs() {
  return (
    <div className="bg-blobs" aria-hidden="true">
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <BackgroundBlobs />
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </div>
      </BrowserRouter>
      <Toaster position="bottom-right" richColors />
    </ThemeProvider>
  );
}

export default App;
