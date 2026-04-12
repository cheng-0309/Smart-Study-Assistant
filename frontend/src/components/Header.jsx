import { Sun, Moon, BookOpenText, ClockCounterClockwise, NotePencil, CalendarDots, Exam, Clock } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

const NAV_ITEMS = [
  { path: "/", label: "Notes", icon: NotePencil },
  { path: "/planner", label: "Planner", icon: CalendarDots },
  { path: "/practice", label: "Practice", icon: Exam },
  { path: "/history", label: "History", icon: Clock },
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
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
    <nav className="flex items-center gap-1" data-testid="main-nav">
      {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
        const isActive = location.pathname === path;
        return (
          <Button
            key={path}
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
        );
      })}
    </nav>
  );
}

function HeaderActions({ onToggleSidebar, sidebarOpen }) {
  const { theme, toggleTheme } = useTheme();

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
      </TooltipProvider>
    </div>
  );
}

export default function Header({ onToggleSidebar, sidebarOpen }) {
  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-50 glass-header"
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 h-14">
        <Logo />
        <NavBar />
        <HeaderActions onToggleSidebar={onToggleSidebar} sidebarOpen={sidebarOpen} />
      </div>
    </header>
  );
}
