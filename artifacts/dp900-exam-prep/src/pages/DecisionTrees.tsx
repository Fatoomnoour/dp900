import { BarChart3, Database, Cpu, Zap, HardDrive, Server } from "lucide-react";
import Navbar from "@/components/Navbar";
import treesRaw from "@/data/dp900_decision_trees.json";

interface Branch {
  condition: string;
  keywords: string[];
  answer: string;
  service: string;
  color: string;
}
interface Tree {
  id: string;
  title: string;
  titleEn: string;
  icon: string;
  question: string;
  branches: Branch[];
}

const trees = treesRaw as Tree[];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Database, Cpu, Zap, HardDrive, Server, BarChart3,
};

const BRANCH_COLORS: Record<string, string> = {
  blue: "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50",
  purple: "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50",
  orange: "border-orange-500/30 bg-orange-500/5 hover:border-orange-500/50",
  green: "border-green-500/30 bg-green-500/5 hover:border-green-500/50",
  amber: "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50",
  cyan: "border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/50",
  teal: "border-teal-500/30 bg-teal-500/5 hover:border-teal-500/50",
  yellow: "border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50",
  indigo: "border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/50",
};

const ANSWER_COLORS: Record<string, string> = {
  blue: "text-blue-400",
  purple: "text-purple-400",
  orange: "text-orange-400",
  green: "text-green-400",
  amber: "text-amber-400",
  cyan: "text-cyan-400",
  teal: "text-teal-400",
  yellow: "text-yellow-400",
  indigo: "text-indigo-400",
};

const KW_COLORS: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-300",
  purple: "bg-purple-500/10 text-purple-300",
  orange: "bg-orange-500/10 text-orange-300",
  green: "bg-green-500/10 text-green-300",
  amber: "bg-amber-500/10 text-amber-300",
  cyan: "bg-cyan-500/10 text-cyan-300",
  teal: "bg-teal-500/10 text-teal-300",
  yellow: "bg-yellow-500/10 text-yellow-300",
  indigo: "bg-indigo-500/10 text-indigo-300",
};

export default function DecisionTrees() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">شجرة القرار</h1>
          <p className="text-muted-foreground text-sm">لما تشوف هذه الكلمات في السؤال، اختر هذه الإجابة مباشرة</p>
        </div>

        <div className="flex flex-col gap-8">
          {trees.map((tree) => {
            const Icon = ICON_MAP[tree.icon] ?? Database;
            return (
              <div key={tree.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Tree Header */}
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">{tree.title}</h2>
                    <p className="text-xs text-muted-foreground">{tree.titleEn}</p>
                  </div>
                </div>

                <div className="p-6">
                  {/* Question */}
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-lg">🤔</span>
                    <span className="text-sm font-medium text-muted-foreground">{tree.question}</span>
                  </div>

                  {/* Branches */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tree.branches.map((branch, bi) => (
                      <div
                        key={bi}
                        className={`rounded-xl border p-4 transition-colors ${BRANCH_COLORS[branch.color] ?? "border-border bg-card"}`}
                      >
                        {/* Condition */}
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                          <span className="text-foreground font-medium">إذا: </span>
                          {branch.condition}
                        </p>

                        {/* Keywords */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {branch.keywords.slice(0, 5).map((kw) => (
                            <span
                              key={kw}
                              className={`text-xs px-2 py-0.5 rounded-md font-mono ${KW_COLORS[branch.color] ?? "bg-muted text-muted-foreground"}`}
                            >
                              {kw}
                            </span>
                          ))}
                        </div>

                        {/* Arrow + Answer */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                          <span className="text-lg">→</span>
                          <div>
                            <p className={`font-bold text-sm ${ANSWER_COLORS[branch.color] ?? "text-primary"}`}>
                              {branch.answer}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">{branch.service}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
