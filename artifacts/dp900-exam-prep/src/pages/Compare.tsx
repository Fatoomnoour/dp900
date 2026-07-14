import { useState } from "react";
import { useLocation } from "wouter";
import { Search, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";

interface Service {
  name: string;
  nameAr: string;
  category: "relational" | "nonrelational" | "analytics" | "storage" | "etl";
  categoryAr: string;
  type: string;
  model: string;
  useCase: string;
  structured: string;
  key: string[];
  examTip: string;
  color: string;
}

const SERVICES: Service[] = [
  {
    name: "Azure SQL Database",
    nameAr: "قاعدة بيانات Azure SQL",
    category: "relational",
    categoryAr: "علائقي",
    type: "PaaS",
    model: "Relational / SQL",
    useCase: "OLTP — تطبيقات الويب والموبايل",
    structured: "منظمة بالكامل",
    key: ["Serverless خيار", "Elastic Pools", "Built-in HA", "Geo-replication"],
    examTip: "🎯 الخيار الافتراضي لـ SQL في السحابة — PaaS بدون إدارة",
    color: "blue",
  },
  {
    name: "Azure SQL Managed Instance",
    nameAr: "مثيل Azure SQL المُدار",
    category: "relational",
    categoryAr: "علائقي",
    type: "PaaS",
    model: "Relational / SQL",
    useCase: "Lift-and-shift من SQL Server محلي",
    structured: "منظمة بالكامل",
    key: ["99.9% SQL Server compatibility", "VNet integration", "SQL Agent", "Cross-database queries"],
    examTip: "🎯 عندما تحتاج تشغيل SQL Server قديم في السحابة بدون تغيير",
    color: "blue",
  },
  {
    name: "SQL Server on Azure VMs",
    nameAr: "SQL Server على أجهزة VM",
    category: "relational",
    categoryAr: "علائقي",
    type: "IaaS",
    model: "Relational / SQL",
    useCase: "تحكم كامل في OS + SQL",
    structured: "منظمة بالكامل",
    key: ["100% SQL Server compatibility", "Full OS access", "Self-managed", "Any SQL version"],
    examTip: "🎯 IaaS = أنت مسؤول عن patches والـ backups",
    color: "blue",
  },
  {
    name: "Azure Cosmos DB",
    nameAr: "Azure Cosmos DB",
    category: "nonrelational",
    categoryAr: "غير علائقي",
    type: "PaaS",
    model: "NoSQL / Multi-model",
    useCase: "تطبيقات عالمية بزمن استجابة منخفض",
    structured: "شبه منظمة / غير منظمة",
    key: ["5 APIs: SQL, MongoDB, Cassandra, Table, Gremlin", "Global distribution", "< 10ms latency", "Serverless option"],
    examTip: "🎯 اذكر: multi-model، globally distributed، < 10ms",
    color: "purple",
  },
  {
    name: "Azure Blob Storage",
    nameAr: "Azure Blob Storage",
    category: "storage",
    categoryAr: "تخزين",
    type: "PaaS",
    model: "Object Storage",
    useCase: "ملفات كبيرة، صور، فيديو، backups",
    structured: "غير منظمة",
    key: ["Hot / Cool / Archive tiers", "Immutable storage", "Lifecycle policies", "Up to 190.7 TB per blob"],
    examTip: "🎯 للملفات الكبيرة غير المنظمة — ليس لـ SQL",
    color: "teal",
  },
  {
    name: "Azure Data Lake Storage Gen2",
    nameAr: "Azure Data Lake Gen2",
    category: "storage",
    categoryAr: "تخزين",
    type: "PaaS",
    model: "Hierarchical Object Storage",
    useCase: "Big Data Analytics — Spark / Hadoop",
    structured: "شبه منظمة",
    key: ["Hierarchical namespace", "HDFS compatible", "Built on Blob Storage", "Fine-grained ACLs"],
    examTip: "🎯 فرق عن Blob: Hierarchical namespace للمسارات",
    color: "teal",
  },
  {
    name: "Azure Table Storage",
    nameAr: "Azure Table Storage",
    category: "nonrelational",
    categoryAr: "غير علائقي",
    type: "PaaS",
    model: "Key-Value NoSQL",
    useCase: "بيانات شبه منظمة بسيطة وزهيدة",
    structured: "شبه منظمة",
    key: ["Partition key + Row key", "Schemaless", "Low cost", "Legacy — prefer Cosmos DB Table API"],
    examTip: "🎯 قديم ورخيص — Cosmos DB Table API أفضل منه الآن",
    color: "gray",
  },
  {
    name: "Azure Files",
    nameAr: "Azure Files",
    category: "storage",
    categoryAr: "تخزين",
    type: "PaaS",
    model: "File Share (SMB/NFS)",
    useCase: "مشاركة ملفات للتطبيقات والـ VMs",
    structured: "غير منظمة",
    key: ["SMB & NFS protocols", "Lift-and-shift file servers", "Mount on Windows/Linux/Mac", "Snapshots"],
    examTip: "🎯 بروتوكول SMB/NFS = Azure Files وليس Blob",
    color: "gray",
  },
  {
    name: "Azure Synapse Analytics",
    nameAr: "Azure Synapse Analytics",
    category: "analytics",
    categoryAr: "تحليلات",
    type: "PaaS",
    model: "Enterprise Analytics Platform",
    useCase: "Data Warehouse + Big Data + BI في منصة واحدة",
    structured: "منظمة + شبه منظمة",
    key: ["Dedicated SQL Pool (DW)", "Serverless SQL Pool", "Spark Pools", "Synapse Link", "Azure Monitor integration"],
    examTip: "🎯 الـ all-in-one لـ analytics — SQL + Spark + Pipelines",
    color: "orange",
  },
  {
    name: "Azure Data Factory",
    nameAr: "Azure Data Factory",
    category: "etl",
    categoryAr: "ETL/ELT",
    type: "PaaS",
    model: "ETL/ELT Orchestration",
    useCase: "نقل وتحويل البيانات بين المصادر",
    structured: "أي نوع",
    key: ["90+ connectors", "Code-free pipelines", "Data flows", "Trigger scheduling", "Integration Runtime"],
    examTip: "🎯 لما تسمع ETL أو 'move data' فكر ADF",
    color: "green",
  },
  {
    name: "Azure Databricks",
    nameAr: "Azure Databricks",
    category: "analytics",
    categoryAr: "تحليلات",
    type: "PaaS",
    model: "Apache Spark Platform",
    useCase: "Machine Learning + Data Engineering + Big Data",
    structured: "أي نوع",
    key: ["Collaborative notebooks", "MLflow integration", "Delta Lake", "Auto-scaling clusters", "Unity Catalog"],
    examTip: "🎯 Spark + ML + Data Engineering — أفضل من HDInsight للـ Spark",
    color: "red",
  },
  {
    name: "Power BI",
    nameAr: "Power BI",
    category: "analytics",
    categoryAr: "تحليلات",
    type: "SaaS",
    model: "Business Intelligence",
    useCase: "تصور البيانات وإنشاء التقارير للمستخدمين",
    structured: "منظمة",
    key: ["Desktop (authoring) vs Service (sharing)", "Dashboard vs Report", "Dataflows", "DirectQuery vs Import", "Power BI Embedded"],
    examTip: "🎯 فرق: Report = detailed, Dashboard = high-level tiles",
    color: "yellow",
  },
  {
    name: "Azure Stream Analytics",
    nameAr: "Azure Stream Analytics",
    category: "analytics",
    categoryAr: "تحليلات",
    type: "PaaS",
    model: "Real-time Stream Processing",
    useCase: "تحليل بيانات في الوقت الفعلي (IoT، logs)",
    structured: "streaming",
    key: ["SQL-like query language", "IoT Hub / Event Hubs input", "Sub-second latency", "Tumbling/Hopping/Sliding windows"],
    examTip: "🎯 Streaming = Stream Analytics — SQL على بيانات متدفقة",
    color: "cyan",
  },
  {
    name: "Azure HDInsight",
    nameAr: "Azure HDInsight",
    category: "analytics",
    categoryAr: "تحليلات",
    type: "PaaS",
    model: "Managed Hadoop/Spark Clusters",
    useCase: "Open-source big data frameworks",
    structured: "شبه منظمة + كبيرة",
    key: ["Hadoop, Spark, Hive, Kafka, HBase", "HDFS compatible", "Legacy open-source workloads", "More manual than Databricks"],
    examTip: "🎯 Hadoop/Hive/open-source = HDInsight. للـ Spark الحديث Databricks أفضل",
    color: "pink",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  teal: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  green: "bg-green-500/10 text-green-400 border-green-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  gray: "bg-muted/50 text-muted-foreground border-border",
};

const FILTER_TABS = [
  { key: "all", label: "الكل" },
  { key: "relational", label: "علائقي" },
  { key: "nonrelational", label: "غير علائقي" },
  { key: "storage", label: "تخزين" },
  { key: "analytics", label: "تحليلات" },
  { key: "etl", label: "ETL/ELT" },
];

export default function Compare() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = SERVICES.filter((s) => {
    const matchesCat = filter === "all" || s.category === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.nameAr.includes(q) ||
      s.useCase.includes(q) || s.model.toLowerCase().includes(q) || s.key.some((k) => k.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setLocation("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">مقارنة خدمات Azure</h1>
            <p className="text-xs text-muted-foreground">{SERVICES.length} خدمة — نقاط مميزة لكل خدمة وتلميح الامتحان</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في الخدمات..."
            className="w-full bg-card border border-border rounded-xl px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-5 pb-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                filter === tab.key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Services grid */}
        <div className="flex flex-col gap-3">
          {filtered.map((s) => {
            const isExp = expanded === s.name;
            return (
              <div
                key={s.name}
                className="rounded-xl border border-border bg-card overflow-hidden cursor-pointer hover:border-primary/30 transition-all"
                onClick={() => setExpanded(isExp ? null : s.name)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-foreground text-sm">{s.name}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${CATEGORY_COLORS[s.color]}`}>{s.type}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{s.categoryAr}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{s.useCase}</p>
                    </div>
                    <span className="text-muted-foreground text-sm shrink-0">{isExp ? "▲" : "▼"}</span>
                  </div>

                  {/* Quick info row - always visible */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{s.model}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{s.structured}</span>
                  </div>
                </div>

                {/* Expanded details */}
                {isExp && (
                  <div className="border-t border-border bg-muted/20 p-4">
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-foreground mb-2">الميزات الرئيسية:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {s.key.map((k) => (
                          <span key={k} className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[s.color]}`}>{k}</span>
                        ))}
                      </div>
                    </div>
                    <div className={`rounded-lg p-3 text-xs font-medium ${CATEGORY_COLORS[s.color]}`}>
                      {s.examTip}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p>لا توجد نتائج — جرب كلمة أخرى</p>
          </div>
        )}
      </main>
    </div>
  );
}
