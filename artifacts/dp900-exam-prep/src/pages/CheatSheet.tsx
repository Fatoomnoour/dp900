import { useState } from "react";
import { Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import cheatsheetsRaw from "@/data/dp900_cheatsheets.json";

interface CheatRule { keyword: string; answer: string; }
interface CheatCard { id: string; topic: string; color: string; rules: CheatRule[]; }

const cheatsheets = cheatsheetsRaw as CheatCard[];

const COLOR_MAP: Record<string, string> = {
  blue: "border-blue-500/30 bg-blue-500/5",
  purple: "border-purple-500/30 bg-purple-500/5",
  green: "border-green-500/30 bg-green-500/5",
  orange: "border-orange-500/30 bg-orange-500/5",
  cyan: "border-cyan-500/30 bg-cyan-500/5",
  indigo: "border-indigo-500/30 bg-indigo-500/5",
  teal: "border-teal-500/30 bg-teal-500/5",
  emerald: "border-emerald-500/30 bg-emerald-500/5",
  yellow: "border-yellow-500/30 bg-yellow-500/5",
  pink: "border-pink-500/30 bg-pink-500/5",
  red: "border-red-500/30 bg-red-500/5",
  violet: "border-violet-500/30 bg-violet-500/5",
};
const BADGE_MAP: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  green: "bg-green-500/10 text-green-400 border-green-500/20",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  teal: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

export default function CheatSheet() {
  const [search, setSearch] = useState("");

  const filtered = cheatsheets
    .map((card) => {
      if (!search) return card;
      const q = search.toLowerCase();
      const rules = card.rules.filter(
        (r) =>
          r.keyword.toLowerCase().includes(q) ||
          r.answer.toLowerCase().includes(q)
      );
      if (rules.length === 0 && !card.topic.toLowerCase().includes(q)) return null;
      return { ...card, rules: rules.length > 0 ? rules : card.rules };
    })
    .filter(Boolean) as CheatCard[];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">ورقة القواعد</h1>
          <p className="text-muted-foreground text-sm">كل قواعد الامتحان في مكان واحد — ابحث عن أي كلمة</p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث: OLTP, JSON, DDL, Blob, Structured..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pr-11 pl-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((card) => (
            <div
              key={card.id}
              className={`rounded-xl border p-5 ${COLOR_MAP[card.color] ?? "border-border bg-card"}`}
            >
              <div className={`inline-block text-xs px-2.5 py-1 rounded-full border font-semibold mb-4 ${BADGE_MAP[card.color] ?? ""}`}>
                {card.topic}
              </div>
              <div className="flex flex-col gap-3">
                {card.rules.map((rule, ri) => (
                  <div key={ri} className="flex items-start gap-2 py-2 border-b border-border/30 last:border-0 last:pb-0 last:mb-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-mono leading-relaxed">{rule.keyword}</p>
                      <p className="text-sm font-semibold text-foreground mt-1 flex items-center gap-1.5">
                        <span className="text-muted-foreground">→</span>
                        {rule.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-16 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-base">لا توجد نتائج لـ "{search}"</p>
              <p className="text-sm mt-1 opacity-70">جرب كلمة أخرى</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
