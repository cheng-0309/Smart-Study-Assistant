import { Sun, Moon, BookOpenText, ClockCounterClockwise, NotePencil, CalendarDots, Exam, Clock, ChartBar, SignOut, User } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

const NAV_ITEMS = [
  { path: "/notes", label: "Notes", icon: NotePencil },
  { path: "/planner", label: "Planner", icon: CalendarDots },
  { path: "/practice", label: "Practice", icon: Exam },
  { path: "/history", label: "History", icon: Clock },
  { path: "/analytics", label: "Analytics", icon: ChartBar },
];

function Logo() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")} data-testid="logo-home-link">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
        <BookOpenText weight="bold" className="w-4.5 h-4.5 text-white" />
      </div>
      <span data-testid="app-logo" className="text-lg font-black tracking-tight gradient-text" style={{ fontFamily: "var(--font-heading)" }}>
        StudyForge
      </span>
    </div>
  );
}

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.nav
      className="flex items-center gap-1"
      data-testid="main-nav"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {NAV_ITEMS.map(({ path, label, icon: Icon }, i) => {
        const isActive = location.pathname === path;
        return (
          <motion.div
            key={path}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
          >
            <Button
              data-testid={`nav-${label.toLowerCase()}`}
              variant="ghost"
              size="sm"
              onClick={() => navigate(path)}
              className={`rounded-lg h-9 gap-1.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] nav-active-indicator"
                  : "text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--primary)/0.05)]"
              }`}
            >
              <Icon weight={isActive ? "bold" : "regular"} className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          </motion.div>
        );
      })}
    </motion.nav>
  );
}

function HeaderActions({ onToggleSidebar, sidebarOpen }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex items-center gap-1.5">
      <TooltipProvider delayDuration={200}>
        {onToggleSidebar && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button data-testid="toggle-sidebar-btn" variant="ghost" size="icon" onClick={onToggleSidebar} className="rounded-lg h-9 w-9 hover:bg-[hsl(var(--primary)/0.05)]">
                <ClockCounterClockwise className="w-[18px] h-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{sidebarOpen ? "Hide" : "Show"} History</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="theme-toggle"
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-lg h-9 w-9 hover:bg-[hsl(var(--primary)/0.05)]"
            >
              {theme === "dark" ? (
                <Sun className="w-[18px] h-[18px] text-amber-400" />
              ) : (
                <Moon className="w-[18px] h-[18px] text-[hsl(var(--accent))]" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Switch to {theme === "dark" ? "Light" : "Dark"} mode</TooltipContent>
        </Tooltip>
        {isAuthenticated && (
          <>
            <div className="hidden sm:flex items-center gap-1.5 ml-1 px-2.5 py-1 rounded-lg bg-[hsl(var(--primary)/0.06)] border border-[hsl(var(--primary)/0.1)]">
              <User className="w-3.5 h-3.5 text-[hsl(var(--primary))]" weight="bold" />
              <span className="text-xs font-medium text-[hsl(var(--primary))] max-w-[120px] truncate">{user?.name || user?.email?.split("@")[0]}</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="logout-btn"
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="rounded-lg h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                >
                  <SignOut className="w-[18px] h-[18px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Sign out</TooltipContent>
            </Tooltip>
          </>
        )}
      </TooltipProvider>
    </div>
  );
}

export default function Header({ onToggleSidebar, sidebarOpen }) {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-50 glass-header"
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 h-14">
        <Logo />
        <AnimatePresence>
          {!isLanding && <NavBar />}
        </AnimatePresence>
        <HeaderActions onToggleSidebar={onToggleSidebar} sidebarOpen={sidebarOpen} />
      </div>
    </header>
  );
}
