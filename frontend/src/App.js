import "@/App.css";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import NotesPage from "./pages/NotesPage";
import PlannerPage from "./pages/PlannerPage";
import PracticePage from "./pages/PracticePage";
import HistoryPage from "./pages/HistoryPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import GoalsPage from "./pages/GoalsPage";
import PomodoroPage from "./pages/PomodoroPage";
import SharedNotePage from "./pages/SharedNotePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="bg-blobs">
          <div className="bg-blob bg-blob-1" />
          <div className="bg-blob bg-blob-2" />
          <div className="bg-blob bg-blob-3" />
        </div>
        <Toaster richColors position="top-right" />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/shared/:shareId" element={<SharedNotePage />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
            <Route path="/planner" element={<ProtectedRoute><PlannerPage /></ProtectedRoute>} />
            <Route path="/practice" element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
            <Route path="/pomodoro" element={<ProtectedRoute><PomodoroPage /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
