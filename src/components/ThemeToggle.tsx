import React from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  isDark?: boolean;
  onToggle?: () => void;
  // Backward compatibility props
  effectiveIsDark?: boolean;
  themeMode?: string;
  onSelectThemeMode?: (mode: any) => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isDark,
  onToggle,
  effectiveIsDark,
  className = "",
}) => {
  const activeDark = isDark !== undefined ? isDark : Boolean(effectiveIsDark);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`p-2 rounded-lg border border-black/15 dark:border-white/20 bg-white dark:bg-[#2a2a2a] text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center shadow-2xs group ${className}`}
      title={activeDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle light and dark theme"
    >
      {activeDark ? (
        <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 group-hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
};
