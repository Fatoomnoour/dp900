import { useState, useEffect } from "react";
import { Check, X, Clock, RotateCcw, Trophy, Layers } from "lucide-react";
import Navbar from "@/components/Navbar";
import flashcardsRaw from "@/data/dp900_flashcards.json";

interface Flashcard {
  id: string;
  topic: string;
  front: string;
  back: string;
}

type CardState = "known" | "unknown" | "review" | null;

const flashcards = flashcardsRaw as Flashcard[];
const ALL_TOPICS = ["الكل", ...Array.from(new Set(flashcards.map((f) => f.topic)))];

const STATE_STORAGE_KEY = "dp900_flashcard_progress";

export default function Flashcards() {
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [topicFilter, setTopicFilter] = useState("الكل");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<"all" | "review">("all");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STATE_STORAGE_KEY);
      if (raw) setCardStates(JSON.parse(raw));
    } catch {}
  }, []);

  function saveStates(next: Record<string, CardState>) {
    setCardStates(next);
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(next));
  }

  const baseCards =
    mode === "review"
      ? flashcards.filter((f) => cardStates[f.id] === "unknown" || cardStates[f.id] === "review")
      : flashcards;

  const cards =
    topicFilter === "الكل"
      ? baseCards
      : baseCards.filter((f) => f.topic === topicFilter);

  const card = cards[currentIdx] ?? null;

  function go(dir: 1 | -1) {
    setFlipped(false);
    setTimeout(() => setCurrentIdx((i) => Math.max(0, Math.min(cards.length - 1, i + dir))), 80);
  }

  function markCard(state: "known" | "unknown" | "review") {
    if (!card) return;
    const next = { ...cardStates, [card.id]: state };
    saveStates(next);
    setFlipped(false);
    setTimeout(() => {
      if (currentIdx < cards.length - 1) setCurrentIdx((i) => i + 1);
    }, 150);
  }

  function resetAll() {
    if (!confirm("إعادة ضبط كل الفلاش كاردز؟")) return;
    saveStates({});
    setCurrentIdx(0);
    setFlipped(false);
  }

  const knownCount = flashcards.filter((f) => cardStates[f.id] === "known").length;
  const unknownCount = flashcards.filter((f) => cardStates[f.id] === "unknown" || cardStates[f.id] === "review").length;
  const pct = flashcards.length > 0 ? Math.round((knownCount / flashcards.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">فلاش كاردز</h1>
          <p className="text-muted-foreground text-sm">راجع القواعد والمصطلحات السريعة</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <div className="text-xl font-bold text-green-400">{knownCount}</div>
            <div className="text-xs text-muted-foreground">أعرفها</div>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <div className="text-xl font-bold text-red-400">{unknownCount}</div>
            <div className="text-xs text-muted-foreground">تحتاج مراجعة</div>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <div className="text-xl font-bold text-primary">{pct}%</div>
            <div className="text-xs text-muted-foreground">مكتمل</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
          <button
            onClick={() => { setMode(mode === "review" ? "all" : "review"); setCurrentIdx(0); setFlipped(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${mode === "review" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            <Clock className="w-3.5 h-3.5" />
            المراجعة فقط ({unknownCount})
          </button>
          <div className="w-px h-5 bg-border" />
          {ALL_TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => { setTopicFilter(t); setCurrentIdx(0); setFlipped(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${topicFilter === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Card */}
        {card ? (
          <>
            <div className="text-center text-xs text-muted-foreground mb-3">
              <span dir="ltr">{currentIdx + 1} / {cards.length}</span>{" "}بطاقة
            </div>

            {/* Flashcard flip */}
            <button
              onClick={() => setFlipped(!flipped)}
              className="w-full"
            >
              <div
                className={`relative rounded-2xl border-2 min-h-[220px] flex items-center justify-center p-8 text-center transition-all duration-300 cursor-pointer select-none ${
                  flipped
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div>
                  {!flipped ? (
                    <>
                      <div className="text-xs text-muted-foreground mb-4 font-medium uppercase tracking-wider">السؤال</div>
                      <p className="text-lg font-semibold text-foreground leading-relaxed font-mono">{card.front}</p>
                      <p className="text-xs text-muted-foreground mt-6">اضغط لكشف الإجابة</p>
                    </>
                  ) : (
                    <>
                      <div className="text-xs text-primary mb-4 font-medium uppercase tracking-wider">الإجابة</div>
                      <p className="text-xl font-bold text-primary leading-relaxed">{card.back}</p>
                    </>
                  )}
                </div>
              </div>
            </button>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => markCard("unknown")}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
              >
                <X className="w-4 h-4" />
                مش عارفها
              </button>
              <button
                onClick={() => markCard("review")}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors"
              >
                <Clock className="w-4 h-4" />
                راجعها
              </button>
              <button
                onClick={() => markCard("known")}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors"
              >
                <Check className="w-4 h-4" />
                أعرفها
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => go(-1)}
                disabled={currentIdx === 0}
                className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                السابق
              </button>
              <button
                onClick={() => go(1)}
                disabled={currentIdx === cards.length - 1}
                className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                التالي
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
            <p className="text-lg font-semibold text-foreground mb-2">أنهيت كل البطاقات! 🎉</p>
            <p className="text-sm mb-6">خلصت كل بطاقات هذا الفلتر</p>
            <button onClick={() => { setCurrentIdx(0); setFlipped(false); }} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              ابدأ من الأول
            </button>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button onClick={resetAll} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
            إعادة ضبط الكل
          </button>
        </div>
      </main>
    </div>
  );
}
