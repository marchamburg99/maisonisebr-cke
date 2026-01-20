"use client";

import {
  TrendingUp,
  TrendingDown,
  FileText,
  Package,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  Plus,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ANOMALY_LABELS } from "@/types";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import type { AnomalyType, ProductCategory } from "@/types";
import { motion } from "framer-motion";
import { useRef, useCallback } from "react";
import { FAB } from "@/components/mobile/primitives";
import { useIsMobile } from "@/hooks/use-mobile";

type Product = {
  _id: Id<"products">;
  name: string;
  category: ProductCategory;
  unit: string;
  currentStock: number;
  minStock: number;
  avgPrice: number;
  supplierId: Id<"suppliers">;
};

type DocumentWithItems = {
  _id: Id<"documents">;
  type: "invoice" | "delivery_note";
  fileName: string;
  uploadDate: number;
  supplierName: string;
  documentDate: number;
  totalAmount: number;
  status: "pending" | "analyzed" | "approved" | "rejected";
};

type Anomaly = {
  _id: Id<"anomalies">;
  type: AnomalyType;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  detectedAt: number;
  resolved: boolean;
};

type SpendingRecord = {
  _id: Id<"spendingRecords">;
  month: string;
  year: number;
  monthIndex: number;
  amount: number;
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

const cardHoverVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

export default function DashboardPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const products = useQuery(api.products.list);
  const documents = useQuery(api.documents.listWithItems);
  const anomalies = useQuery(api.anomalies.listOpen);
  const suppliers = useQuery(api.suppliers.list);
  const spendingData = useQuery(api.spending.list);
  const statsScrollRef = useRef<HTMLDivElement>(null);

  // Quick action handlers for FAB
  const handleScanDocument = useCallback(() => {
    router.push("/documents?action=upload");
  }, [router]);

  const handleQuickStock = useCallback(() => {
    router.push("/inventory");
  }, [router]);

  const handleViewAnomalies = useCallback(() => {
    router.push("/documents?tab=anomalies");
  }, [router]);

  const fabActions = [
    { icon: Camera, label: "Dokument scannen", onClick: handleScanDocument },
    { icon: Package, label: "Bestand prüfen", onClick: handleQuickStock },
    { icon: AlertTriangle, label: "Auffälligkeiten", onClick: handleViewAnomalies },
  ];

  const isLoading =
    !products || !documents || !anomalies || !suppliers || !spendingData;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-amber-500" />
        </motion.div>
      </div>
    );
  }

  // Calculate stats
  const sortedSpending = [...spendingData].sort(
    (a: SpendingRecord, b: SpendingRecord) => a.monthIndex - b.monthIndex
  );
  const currentMonthSpending =
    sortedSpending[sortedSpending.length - 1]?.amount ?? 0;
  const lastMonthSpending =
    sortedSpending[sortedSpending.length - 2]?.amount ?? currentMonthSpending;
  const spendingChange =
    lastMonthSpending > 0
      ? ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100
      : 0;

  const pendingDocuments = documents.filter(
    (d: DocumentWithItems) => d.status === "pending"
  );
  const lowStockProducts = products.filter(
    (p: Product) => p.currentStock < p.minStock
  );

  const stats = [
    {
      title: "Monatliche Ausgaben",
      value: `€${currentMonthSpending.toLocaleString("de-DE")}`,
      change: spendingChange,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      title: "Offene Dokumente",
      value: pendingDocuments.length.toString(),
      subtitle: "zur Prüfung",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      title: "Niedriger Bestand",
      value: lowStockProducts.length.toString(),
      subtitle: "Artikel",
      icon: Package,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      gradient: "from-amber-500 to-orange-600",
    },
    {
      title: "Auffälligkeiten",
      value: anomalies.length.toString(),
      subtitle: "zu prüfen",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      gradient: "from-red-500 to-rose-600",
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("de-DE");
  };

  return (
    <motion.div
      className="space-y-4 md:space-y-6 pb-20 md:pb-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">
          Dashboard
        </h1>
        <p className="text-slate-500 text-sm md:text-base mt-1">
          Übersicht und Auffälligkeiten
        </p>
      </motion.div>

      {/* Stats Grid - Horizontal scroll on mobile */}
      <motion.div variants={itemVariants} className="-mx-4 md:mx-0">
        <div
          ref={statsScrollRef}
          className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 overflow-x-auto pb-2 px-4 md:px-0 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              variants={cardHoverVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              className="snap-start"
            >
              <Card className="min-w-[160px] md:min-w-0 overflow-hidden">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium text-slate-500 truncate">
                        {stat.title}
                      </p>
                      <p className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
                        {stat.value}
                      </p>
                      {stat.change !== undefined && (
                        <div className="flex items-center mt-1">
                          {stat.change >= 0 ? (
                            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-red-500 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-emerald-500 mr-1" />
                          )}
                          <span
                            className={cn(
                              "text-xs md:text-sm font-medium",
                              stat.change >= 0
                                ? "text-red-500"
                                : "text-emerald-500"
                            )}
                          >
                            {Math.abs(stat.change).toFixed(1)}%
                          </span>
                        </div>
                      )}
                      {stat.subtitle && (
                        <p className="text-xs md:text-sm text-slate-500 mt-1">
                          {stat.subtitle}
                        </p>
                      )}
                    </div>
                    <div
                      className={cn(
                        "p-2 md:p-3 rounded-xl bg-gradient-to-br text-white",
                        stat.gradient
                      )}
                    >
                      <stat.icon className="h-4 w-4 md:h-6 md:w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        {/* Scroll indicator dots on mobile */}
        <div className="flex justify-center gap-1.5 mt-2 md:hidden">
          {stats.map((_, index) => (
            <div
              key={index}
              className="h-1.5 w-1.5 rounded-full bg-slate-300"
            />
          ))}
        </div>
      </motion.div>

      {/* Charts and Anomalies Row */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Spending Chart */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="text-base md:text-lg">
                Ausgaben-Trend
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Monatliche Ausgaben der letzten 6 Monate
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 md:p-6 pt-0">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={sortedSpending}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="month"
                    stroke="#64748b"
                    fontSize={10}
                    tickMargin={8}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickFormatter={(v) => `€${v / 1000}k`}
                    width={45}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `€${Number(value).toLocaleString("de-DE")}`,
                      "Ausgaben",
                    ]}
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Anomalies List */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 md:pb-4">
              <div>
                <CardTitle className="text-base md:text-lg">
                  Auffälligkeiten
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Erkannte Anomalien
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 text-xs md:text-sm"
              >
                <Link href="/documents">
                  Alle <ArrowRight className="ml-1 h-3 w-3 md:h-4 md:w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="space-y-2 md:space-y-3">
                {anomalies.slice(0, 3).map((anomaly: Anomaly, index: number) => (
                  <motion.div
                    key={anomaly._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-slate-50 border border-slate-100 active:bg-slate-100 transition-colors"
                  >
                    <AlertTriangle
                      className={cn(
                        "h-4 w-4 md:h-5 md:w-5 mt-0.5 flex-shrink-0",
                        anomaly.severity === "high"
                          ? "text-red-500"
                          : anomaly.severity === "medium"
                            ? "text-amber-500"
                            : "text-blue-500"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-900 text-xs md:text-sm">
                          {anomaly.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] md:text-xs px-1.5 py-0",
                            getSeverityColor(anomaly.severity)
                          )}
                        >
                          {anomaly.severity === "high"
                            ? "Hoch"
                            : anomaly.severity === "medium"
                              ? "Mittel"
                              : "Niedrig"}
                        </Badge>
                      </div>
                      <p className="text-xs md:text-sm text-slate-500 mt-0.5 line-clamp-1">
                        {anomaly.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {anomalies.length === 0 && (
                  <div className="text-center py-6 md:py-8 text-slate-500">
                    <CheckCircle className="h-10 w-10 md:h-12 md:w-12 mx-auto text-emerald-300 mb-2" />
                    <p className="text-sm">Keine offenen Auffälligkeiten</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Low Stock and Recent Documents Row */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Low Stock Items */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 md:pb-4">
              <div>
                <CardTitle className="text-base md:text-lg">
                  Niedriger Bestand
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Unter Mindestbestand
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 text-xs md:text-sm"
              >
                <Link href="/inventory">
                  Bestand <ArrowRight className="ml-1 h-3 w-3 md:h-4 md:w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="space-y-3 md:space-y-4">
                {lowStockProducts
                  .slice(0, 4)
                  .map((product: Product, index: number) => {
                    const stockPercent =
                      (product.currentStock / product.minStock) * 100;
                    return (
                      <motion.div
                        key={product._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-1.5 md:space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900 text-sm truncate mr-2">
                            {product.name}
                          </span>
                          <span className="text-xs md:text-sm text-slate-500 whitespace-nowrap">
                            {product.currentStock}/{product.minStock}{" "}
                            {product.unit}
                          </span>
                        </div>
                        <Progress value={stockPercent} className="h-1.5 md:h-2" />
                      </motion.div>
                    );
                  })}
                {lowStockProducts.length === 0 && (
                  <div className="text-center py-6 md:py-8 text-slate-500">
                    <Package className="h-10 w-10 md:h-12 md:w-12 mx-auto text-emerald-300 mb-2" />
                    <p className="text-sm">Alle Bestände OK</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Documents */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 md:pb-4">
              <div>
                <CardTitle className="text-base md:text-lg">
                  Letzte Dokumente
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Kürzlich hochgeladen
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 text-xs md:text-sm"
              >
                <Link href="/documents">
                  Alle <ArrowRight className="ml-1 h-3 w-3 md:h-4 md:w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="space-y-2 md:space-y-3">
                {documents
                  .slice(0, 4)
                  .map((doc: DocumentWithItems, index: number) => (
                    <motion.div
                      key={doc._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-slate-50 border border-slate-100 active:bg-slate-100 transition-colors"
                    >
                      {getStatusIcon(doc.status)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-xs md:text-sm truncate">
                          {doc.fileName}
                        </p>
                        <p className="text-[10px] md:text-xs text-slate-500">
                          {doc.supplierName} • {formatDate(doc.uploadDate)}
                        </p>
                      </div>
                      {doc.type === "invoice" && (
                        <span className="font-semibold text-slate-900 text-xs md:text-sm whitespace-nowrap">
                          €
                          {doc.totalAmount.toLocaleString("de-DE", {
                            minimumFractionDigits: 0,
                          })}
                        </span>
                      )}
                    </motion.div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Mobile FAB with Quick Actions */}
      {isMobile && (
        <FAB
          icon={Plus}
          actions={fabActions}
          badge={anomalies.length > 0 ? anomalies.length : undefined}
        />
      )}
    </motion.div>
  );
}
