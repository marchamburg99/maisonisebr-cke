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
import { cn } from "@/lib/utils";
import { ANOMALY_LABELS } from "@/types";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import type { AnomalyType, ProductCategory } from "@/types";

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

export default function DashboardPage() {
  const products = useQuery(api.products.list);
  const documents = useQuery(api.documents.listWithItems);
  const anomalies = useQuery(api.anomalies.listOpen);
  const suppliers = useQuery(api.suppliers.list);
  const spendingData = useQuery(api.spending.list);

  const isLoading =
    !products || !documents || !anomalies || !suppliers || !spendingData;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
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

  const pendingDocuments = documents.filter((d: DocumentWithItems) => d.status === "pending");
  const lowStockProducts = products.filter((p: Product) => p.currentStock < p.minStock);

  const stats = [
    {
      title: "Monatliche Ausgaben",
      value: `€${currentMonthSpending.toLocaleString("de-DE")}`,
      change: spendingChange,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Offene Dokumente",
      value: pendingDocuments.length.toString(),
      subtitle: "zur Prüfung",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Niedriger Bestand",
      value: lowStockProducts.length.toString(),
      subtitle: "Artikel",
      icon: Package,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Offene Auffälligkeiten",
      value: anomalies.length.toString(),
      subtitle: "zu prüfen",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Übersicht und Auffälligkeiten</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {stat.value}
                  </p>
                  {stat.change !== undefined && (
                    <div className="flex items-center mt-1">
                      {stat.change >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-emerald-500 mr-1" />
                      )}
                      <span
                        className={cn(
                          "text-sm font-medium",
                          stat.change >= 0 ? "text-red-500" : "text-emerald-500"
                        )}
                      >
                        {Math.abs(stat.change).toFixed(1)}%
                      </span>
                      <span className="text-sm text-slate-500 ml-1">
                        vs. Vormonat
                      </span>
                    </div>
                  )}
                  {stat.subtitle && (
                    <p className="text-sm text-slate-500 mt-1">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                <div className={cn("p-3 rounded-full", stat.bgColor)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Anomalies Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ausgaben-Trend</CardTitle>
            <CardDescription>
              Monatliche Ausgaben der letzten 6 Monate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={sortedSpending}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => `€${v / 1000}k`}
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

        {/* Anomalies List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Auffälligkeiten</CardTitle>
              <CardDescription>
                Erkannte Anomalien und Warnungen
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/documents">
                Alle anzeigen <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.slice(0, 4).map((anomaly: Anomaly) => (
                <div
                  key={anomaly._id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <AlertTriangle
                    className={cn(
                      "h-5 w-5 mt-0.5",
                      anomaly.severity === "high"
                        ? "text-red-500"
                        : anomaly.severity === "medium"
                          ? "text-amber-500"
                          : "text-blue-500"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 text-sm">
                        {anomaly.title}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
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
                    <p className="text-sm text-slate-500 mt-0.5">
                      {anomaly.description}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {ANOMALY_LABELS[anomaly.type]} •{" "}
                      {formatDate(anomaly.detectedAt)}
                    </p>
                  </div>
                </div>
              ))}
              {anomalies.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="h-12 w-12 mx-auto text-emerald-300 mb-2" />
                  <p>Keine offenen Auffälligkeiten</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock and Recent Documents Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Niedriger Bestand</CardTitle>
              <CardDescription>Artikel unter Mindestbestand</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/inventory">
                Zum Bestand <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.slice(0, 4).map((product: Product) => {
                const stockPercent =
                  (product.currentStock / product.minStock) * 100;
                return (
                  <div key={product._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">
                        {product.name}
                      </span>
                      <span className="text-sm text-slate-500">
                        {product.currentStock} / {product.minStock}{" "}
                        {product.unit}
                      </span>
                    </div>
                    <Progress value={stockPercent} className="h-2" />
                  </div>
                );
              })}
              {lowStockProducts.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Package className="h-12 w-12 mx-auto text-emerald-300 mb-2" />
                  <p>Alle Bestände ausreichend</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Letzte Dokumente</CardTitle>
              <CardDescription>
                Kürzlich hochgeladene Rechnungen & Lieferscheine
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/documents">
                Alle Dokumente <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.slice(0, 4).map((doc: DocumentWithItems) => (
                <div
                  key={doc._id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                >
                  {getStatusIcon(doc.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">
                      {doc.fileName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {doc.supplierName} • {formatDate(doc.uploadDate)}
                    </p>
                  </div>
                  {doc.type === "invoice" && (
                    <span className="font-medium text-slate-900">
                      €
                      {doc.totalAmount.toLocaleString("de-DE", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
