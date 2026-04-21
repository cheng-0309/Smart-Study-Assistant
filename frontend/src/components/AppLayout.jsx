import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpenText, NotePencil, CalendarDots, Exam, Target, Timer,
  Clock, ChartBar, SignOut, Sun, Moon, User, List, X,
} from "@phosphor-icons/react";
import { Button } from "../components/ui/button";
import { useState } from "react";

const NAV_GROUPS = [
  {
    label: "Create",
    items: [
      { path: "/notes", label: "Notes", icon: NotePencil },
      { path: "/planner", label: "Planner", icon: CalendarDots },
      { path: "/practice", label: "Practice", icon: Exam },
    ],
  },
  {
    label: "Track",
    items: [
      { path: "/goals", label: "Goals", icon: Target },
      { path: "/pomodoro", label: "Timer", icon: Timer },
    ],
  },
  {
    label: "Review",
    items: [
      { path: "/history", label: "History", icon: Clock },
      { path: "/analytics", label: "Analytics", icon: ChartBar },
    ],
  },
];

function NavItem({ path, label, icon: Icon, isActive, onClick }) {
  return (
    <button
      data-testid={`sidebar-${label.toLowerCase()}-link`}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] border-l-[3px] border-[hsl(var(--primary))] pl-[9px]"
          : "text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted)/0.5)]"
      }`}
    >
      <Icon weight={isActive ? "bold" : "regular"} className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside
      data-testid="sidebar-nav"
      className="hidden md:flex w-60 flex-col border-r border-border bg-card h-screen sticky top-0 shrink-0"
    >
      {/* Logo */}
      <div className="px-5 h-14 flex items-center gap-2.5 border-b border-border shrink-0 cursor-pointer" onClick={() => navigate("/")} data-testid="logo-home-link">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
          <BookOpenText weight="bold" className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-base font-black tracking-tight gradient-text" style={{ fontFamily: "var(--font-heading)" }}>StudyForge</span>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-3 mb-2 block">{group.label}</span>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.path}
                  {...item}
                  isActive={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-3 border-t border-border space-y-2 shrink-0">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center shrink-0">
              <User weight="bold" className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate">{user.name || user.email?.split("@")[0]}</div>
              <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Button
            data-testid="theme-toggle-btn"
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="flex-1 rounded-lg h-8 gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            {theme === "dark" ? "Light" : "Dark"}
          </Button>
          <Button
            data-testid="logout-btn"
            variant="ghost"
            size="sm"
            onClick={() => { logout(); navigate("/login"); }}
            className="flex-1 rounded-lg h-8 gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <SignOut className="w-3.5 h-3.5" /> Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <header className="md:hidden sticky top-0 z-50 h-12 flex items-center justify-between px-4 border-b border-border bg-card" data-testid="mobile-header">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
            <BookOpenText weight="bold" className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-black gradient-text" style={{ fontFamily: "var(--font-heading)" }}>StudyForge</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="h-8 w-8" data-testid="mobile-menu-btn">
          <List weight="bold" className="w-5 h-5" />
        </Button>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 md:hidden" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-64 z-50 bg-card border-l border-border flex flex-col md:hidden"
              data-testid="mobile-drawer"
            >
              <div className="flex items-center justify-between px-4 h-12 border-b border-border">
                <span className="text-sm font-bold">Menu</span>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8"><X weight="bold" className="w-4 h-4" /></Button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
                {NAV_GROUPS.map((group) => (
                  <div key={group.label}>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-3 mb-1.5 block">{group.label}</span>
                    {group.items.map((item) => (
                      <NavItem key={item.path} {...item} isActive={location.pathname === item.path} onClick={() => { navigate(item.path); setOpen(false); }} />
                    ))}
                  </div>
                ))}
              </nav>
              <div className="px-3 py-3 border-t border-border space-y-2">
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={toggleTheme} className="flex-1 h-8 text-xs gap-1.5">
                    {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />} {theme === "dark" ? "Light" : "Dark"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/login"); }} className="flex-1 h-8 text-xs gap-1.5">
                    <SignOut className="w-3.5 h-3.5" /> Logout
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
