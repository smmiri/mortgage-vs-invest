import { THEME_OPTIONS } from "../lib/theme.js";
import { useTheme } from "./ThemeProvider.jsx";

const LABELS = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

export default function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex shrink-0 rounded-full border border-default bg-surface-card p-0.5 text-xs"
    >
      {THEME_OPTIONS.map((mode) => {
        const active = preference === mode;
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={active}
            onClick={() => setPreference(mode)}
            className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
              active
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted hover:bg-surface-inset hover:text-heading"
            }`}
          >
            {LABELS[mode]}
          </button>
        );
      })}
    </div>
  );
}
