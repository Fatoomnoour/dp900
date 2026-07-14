import { useLocation } from "wouter";
import {
  Brain, Home, BookOpen, Layers, GitBranch, AlertCircle, Target,
  FileText, Bookmark, Zap, Clock, BarChart3, RefreshCw, Table2, Sun, Moon, Volume2, VolumeX
} from "lucide-react";
import { STORAGE_KEYS } from "@/lib/loadQuestions";
import { useTheme } from "@/lib/theme";
import { getSoundEnabled, setSoundEnabled } from "@/lib/sounds";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/study", label: "مذاكرة", icon: BookOpen },
  { href: "/exam-sim", label: "محاكي", icon: Clock, color: "orange" },
  { href: "/quick-quiz", label: "سريع", icon: Zap, color: "yellow" },
  { href: "/dump", label: "DUMP", icon: Zap, color: "green" },
  { href: "/analytics", label: "تحليل", icon: BarChart3, color: "blue" },
  { href: "/spaced-review", label: "مراجعة ذكية", icon: RefreshCw, color: "purple" },
  { href: "/compare", label: "مقارنة", icon: Table2, color: "teal" },
  { href: "/flashcards", label: "فلاش", icon: Layers },
  { href: "/cheatsheet", label: "قواعد", icon: FileText },
  { href: "/decision-trees", label: "شجرة", icon: GitBranch },
  { href: "/bookmarks", label: "محفوظات", icon: Bookmark, isBookmarks: true },
  { href: "/mistakes", label: "أخطاء", icon: AlertCircle, isMistakes: true },
  { href: "/score-mode", label: "100%", icon: Target, color: "yellow" },
];

const COLOR_ACTIVE: Record<string, string> = {
  orange: "bg-orange-500/15 text-orange-400",
  green: "bg-green-500/15 text-green-400",
  blue: "bg-blue-500/15 text-blue-400",
  purple: "bg-purple-500/15 text-purple-400",
  yellow: "bg-yellow-500/15 text-yellow-400",
  teal: "bg-teal-500/15 text-teal-400",
};

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const { theme, toggle: toggleTheme } = useTheme();
  const [soundOn, setSoundOn] = useState(() => getSoundEnabled());

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  }

  const mistakesCount = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MISTAKES);
      if (raw) return (JSON.parse(raw) as unknown[]).length;
    } catch {}
    return 0;
  })();

  const bookmarksCount = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      if (raw) return (JSON.parse(raw) as unknown[]).length;
    } catch {}
    return 0;
  })();

  return (
    <header className="border-b border-border bg-card/90 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-3">
        <div className="flex items-center gap-2 h-11">
          {/* Logo */}
          <button onClick={() => setLocation("/")} className="flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-sm text-foreground hidden sm:block whitespace-nowrap">DP-900</span>
          </button>

          {/* Nav links — scrollable */}
          <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active =
                link.href === "/" ? location === "/" :
                  location === link.href || location.startsWith(link.href + "/");
              const badge = link.isMistakes ? mistakesCount : link.isBookmarks ? bookmarksCount : 0;
              const activeClass = active
                ? (link.color ? (COLOR_ACTIVE[link.color] ?? "bg-primary/15 text-primary") : "bg-primary/15 text-primary")
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50";

              return (
                <button
                  key={link.href}
                  onClick={() => setLocation(link.href)}
                  className={`relative flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${activeClass}`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${link.isBookmarks && bookmarksCount > 0 && !active ? "text-yellow-400" : ""}`} />
                  <span className="hidden lg:block">{link.label}</span>
                  {badge > 0 && (
                    <span className={`absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-0.5 rounded-full text-[10px] flex items-center justify-center font-bold leading-none ${
                      link.isBookmarks ? "bg-yellow-500 text-black" : "bg-destructive text-destructive-foreground"
                    }`}>
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              title={soundOn ? "كتم الصوت" : "تشغيل الصوت"}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
