import { Sun, Moon, BookOpenText, ClockCounterClockwise } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

export default function Header({ onToggleSidebar, sidebarOpen }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-50 glass-header border-b border-border"
      style={{
        backgroundColor:
          theme === "dark" ? "rgba(12,12,12,0.7)" : "rgba(255,255,255,0.7)",
      }}
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 h-14">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <BookOpenText
            weight="bold"
            className="w-6 h-6 text-[hsl(var(--primary))]"
          />
          <span
            data-testid="app-logo"
            className="text-lg font-black tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            StudyForge
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="toggle-sidebar-btn"
                  variant="ghost"
                  size="icon"
                  onClick={onToggleSidebar}
                  className="rounded-sm h-9 w-9"
                >
                  <ClockCounterClockwise className="w-[18px] h-[18px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {sidebarOpen ? "Hide" : "Show"} History
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="theme-toggle"
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-sm h-9 w-9"
                >
                  {theme === "dark" ? (
                    <Sun className="w-[18px] h-[18px]" />
                  ) : (
                    <Moon className="w-[18px] h-[18px]" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Switch to {theme === "dark" ? "Light" : "Dark"} mode
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
