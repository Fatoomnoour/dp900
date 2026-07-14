import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { BookOpen, CheckCircle2, Clock, ChevronLeft, Search, Filter } from "lucide-react";
import Navbar from "@/components/Navbar";
import lessonsRaw from "@/data/dp900_lessons.json";
import type { Lesson } from "@/types/study";

const lessons = lessonsRaw as Lesson[];

const MODULES = [
  { id: "all", label: "الكل" },
  { id: "core-data-concepts", label: "Core Data Concepts" },
  { id: "relational-data", label: "Relational Data" },
  { id: "non-relational-data", label: "Non-Relational Data" },
  { id: "analytics-azure", label: "Analytics on Azure" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-green-400 bg-green-500/10 border-green-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  hard: "text-red-400 bg-red-500/10 border-red-500/20",
};
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
};

export default function StudyHub() {
  const [, setLocation] = useLocation();
  const [completed, setCompleted] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dp900_lesson_completed");
      if (raw) setCompleted(JSON.parse(raw));
    } catch {}
  }, []);

  const filtered = lessons.filter((l) => {
    const matchModule = moduleFilter === "all" || l.moduleId === moduleFilter;
    const matchSearch =
      !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.titleAr.includes(search) ||
      l.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase()));
    return matchModule && matchSearch;
  });

  const totalLessons = lessons.length;
  const completedCount = completed.length;
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">مركز المذاكرة</h1>
          <p className="text-muted-foreground text-sm">افهم كل مفهوم وراجع فخاخ الامتحان</p>
        </div>

        {/* Progress bar */}
        <div className="p-4 rounded-xl bg-card border border-border mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">تقدم المذاكرة</span>
            <span className="text-sm font-semibold text-foreground">{completedCount} / {totalLessons} درس</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{pct}% مكتمل</p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث في الدروس أو الكلمات المفتاحية..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-lg pr-10 pl-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            {MODULES.map((m) => (
              <button
                key={m.id}
                onClick={() => setModuleFilter(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  moduleFilter === m.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lessons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((lesson) => {
            const isDone = completed.includes(lesson.id);
            return (
              <button
                key={lesson.id}
                onClick={() => setLocation(`/study/${lesson.id}`)}
                className="text-right rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-all group flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {lesson.titleAr}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{lesson.title}</p>
                  </div>
                  {isDone && (
                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  )}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {lesson.concept}
                </p>

                <div className="flex items-center gap-2 mt-auto">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[lesson.difficulty] ?? ""}`}>
                    {DIFFICULTY_LABELS[lesson.difficulty] ?? lesson.difficulty}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {lesson.estimatedMinutes} دقيقة
                  </span>
                  <span className="mr-auto flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" />
                    ابدأ الدرس
                  </span>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>لا توجد نتائج</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
