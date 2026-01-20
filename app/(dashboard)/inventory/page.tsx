"use client";

import { useState, useCallback } from "react";
import {
  Package,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  Edit,
  Loader2,
  Mail,
  Phone,
  User,
  Building2,
  ShoppingCart,
  Filter,
  X,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PRODUCT_CATEGORIES, type ProductCategory } from "@/types";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useIsMobile } from "@/hooks/use-mobile";
import { SwipeableCard, FAB, BottomSheet, BottomSheetBody, BottomSheetFooter, EmptyProductsState } from "@/components/mobile/primitives";
import { triggerHaptic } from "@/components/layout/mobile-nav";

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

type Supplier = {
  _id: Id<"suppliers">;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
};

type StockAdjustment = {
  product: Product;
  type: "add" | "remove";
};

export default function InventoryPage() {
  const isMobile = useIsMobile();
  const products = useQuery(api.products.list) ?? [];
  const suppliers = useQuery(api.suppliers.list) ?? [];
  const updateProduct = useMutation(api.products.update);
  const createProduct = useMutation(api.products.create);
  const adjustStock = useMutation(api.products.adjustStock);
  const deleteProduct = useMutation(api.products.remove);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showLowStock, setShowLowStock] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState<StockAdjustment | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const { toast } = useToast();

  // Swipe handlers for mobile
  const handleSwipeDelete = useCallback((product: Product) => {
    triggerHaptic("medium");
    setDeleteConfirm(product);
  }, []);

  const handleSwipeEdit = useCallback((product: Product) => {
    triggerHaptic("light");
    setEditProduct(product);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    try {
      await deleteProduct({ id: deleteConfirm._id });
      toast({
        title: "Produkt gelöscht",
        description: `${deleteConfirm.name} wurde entfernt.`,
      });
    } catch {
      toast({
        title: "Fehler",
        description: "Produkt konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteProduct, toast]);

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    const matchesLowStock =
      !showLowStock || product.currentStock < product.minStock;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockCount = products.filter(
    (p: Product) => p.currentStock < p.minStock
  ).length;

  const getStockStatus = (product: Product) => {
    const ratio = product.currentStock / product.minStock;
    if (ratio < 0.5)
      return { label: "Kritisch", color: "text-red-600 bg-red-100" };
    if (ratio < 1)
      return { label: "Niedrig", color: "text-amber-600 bg-amber-100" };
    return { label: "OK", color: "text-emerald-600 bg-emerald-100" };
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (editProduct) {
      await updateProduct({
        id: editProduct._id,
        name: productData.name,
        category: productData.category,
        unit: productData.unit,
        currentStock: productData.currentStock,
        minStock: productData.minStock,
        avgPrice: productData.avgPrice,
        supplierId: productData.supplierId,
      });
      setEditProduct(null);
      toast({
        title: "Produkt aktualisiert",
        description: `${productData.name} wurde erfolgreich gespeichert.`,
      });
    }
  };

  const handleAddProduct = async (
    productData: Partial<Product>
  ) => {
    if (!productData.name || !productData.category || !productData.unit || !productData.supplierId) {
      return;
    }
    await createProduct({
      name: productData.name,
      category: productData.category,
      unit: productData.unit,
      currentStock: productData.currentStock ?? 0,
      minStock: productData.minStock ?? 0,
      avgPrice: productData.avgPrice ?? 0,
      supplierId: productData.supplierId,
    });
    setIsAddDialogOpen(false);
    toast({
      title: "Produkt hinzugefügt",
      description: `${productData.name} wurde erfolgreich angelegt.`,
    });
  };

  const handleStockAdjustment = async (amount: number, reason: string) => {
    if (!stockAdjustment) return;

    const delta = stockAdjustment.type === "add" ? amount : -amount;
    await adjustStock({
      id: stockAdjustment.product._id,
      delta,
      reason,
    });

    setStockAdjustment(null);
    toast({
      title: stockAdjustment.type === "add" ? "Bestand erhöht" : "Bestand reduziert",
      description: `${stockAdjustment.product.name}: ${delta > 0 ? "+" : ""}${delta} ${stockAdjustment.product.unit}`,
    });
  };

  const supplierMap = suppliers.reduce(
    (acc: Record<string, Supplier>, s: Supplier) => {
      acc[s._id] = s;
      return acc;
    },
    {} as Record<string, Supplier>
  );

  if (!products || !suppliers) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>

        {/* Table Skeleton */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produkt</TableHead>
                <TableHead className="hidden md:table-cell">Kategorie</TableHead>
                <TableHead className="hidden md:table-cell">Lieferant</TableHead>
                <TableHead>Bestand</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Ø Preis</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell>
                    <div className="space-y-1 w-32">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-1.5 w-full" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Skeleton className="h-11 w-11 md:h-8 md:w-8" />
                      <Skeleton className="h-11 w-11 md:h-8 md:w-8" />
                      <Skeleton className="h-11 w-11 md:h-8 md:w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  }

  const activeFilters = (categoryFilter !== "all" ? 1 : 0) + (showLowStock ? 1 : 0);

  return (
    <motion.div
      className="space-y-4 md:space-y-6 pb-20 md:pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Warenbestand</h1>
          <p className="text-slate-500 text-sm md:text-base mt-0.5 md:mt-1">
            {products.length} Produkte
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 h-10 md:h-10 px-3 md:px-4"
        >
          <Plus className="h-5 w-5 md:mr-2" />
          <span className="hidden md:inline">Produkt hinzufügen</span>
        </Button>
      </div>

      {/* Stats Cards - Horizontal scroll on mobile */}
      <div className="-mx-4 md:mx-0">
        <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 overflow-x-auto pb-2 px-4 md:px-0 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <motion.div
            className="snap-start min-w-[140px] md:min-w-0"
            whileTap={{ scale: 0.98 }}
          >
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-slate-500">Produkte</p>
                    <p className="text-xl md:text-2xl font-bold text-slate-900">
                      {products.length}
                    </p>
                  </div>
                  <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 text-white">
                    <Package className="h-4 w-4 md:h-6 md:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            className="snap-start min-w-[140px] md:min-w-0"
            whileTap={{ scale: 0.98 }}
          >
            <Card className={cn(lowStockCount > 0 && "border-amber-200 bg-amber-50")}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-slate-500">Niedrig</p>
                    <p className="text-xl md:text-2xl font-bold text-amber-600">
                      {lowStockCount}
                    </p>
                  </div>
                  <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                    <AlertTriangle className="h-4 w-4 md:h-6 md:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            className="snap-start min-w-[140px] md:min-w-0"
            whileTap={{ scale: 0.98 }}
          >
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-slate-500">Kategorien</p>
                    <p className="text-xl md:text-2xl font-bold text-slate-900">
                      {new Set(products.map((p: Product) => p.category)).size}
                    </p>
                  </div>
                  <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <Package className="h-4 w-4 md:h-6 md:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search Bar with Filter Toggle on Mobile */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Produkt suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 md:h-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            size="icon"
            className="md:hidden h-11 w-11 relative"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-5 w-5" />
            {activeFilters > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </Button>
        </div>

        {/* Desktop Filters */}
        <div className="hidden md:flex gap-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {Object.entries(PRODUCT_CATEGORIES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showLowStock ? "default" : "outline"}
            onClick={() => setShowLowStock(!showLowStock)}
            className={showLowStock ? "bg-amber-500 hover:bg-amber-600" : ""}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Nur niedriger Bestand
          </Button>
        </div>

        {/* Mobile Filters Dropdown */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div className="flex flex-col gap-3 p-3 bg-slate-50 rounded-lg">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Kategorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    {Object.entries(PRODUCT_CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={showLowStock ? "default" : "outline"}
                  onClick={() => setShowLowStock(!showLowStock)}
                  className={cn("h-11 justify-start", showLowStock && "bg-amber-500 hover:bg-amber-600")}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Nur niedriger Bestand
                </Button>
                {activeFilters > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setCategoryFilter("all");
                      setShowLowStock(false);
                    }}
                    className="h-11 text-slate-500"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Filter zurücksetzen
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Card View with Swipeable Cards */}
      <div className="md:hidden space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product: Product, index: number) => {
            const status = getStockStatus(product);
            const stockPercent = Math.min(
              (product.currentStock / product.minStock) * 100,
              100
            );
            return (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                layout
              >
                <SwipeableCard
                  onSwipeLeft={() => handleSwipeDelete(product)}
                  onSwipeRight={() => handleSwipeEdit(product)}
                  leftAction={{
                    icon: Trash2,
                    label: "Löschen",
                    color: "text-white",
                    bgColor: "bg-red-500",
                  }}
                  rightAction={{
                    icon: Edit,
                    label: "Bearbeiten",
                    color: "text-white",
                    bgColor: "bg-amber-500",
                  }}
                >
                  <Card
                    className="overflow-hidden active:bg-slate-50 transition-colors border-0 shadow-none"
                    onClick={() => setDetailProduct(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 truncate">
                              {product.name}
                            </h3>
                            <Badge className={cn("text-[10px] px-1.5 py-0", status.color)}>
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mb-2">
                            {PRODUCT_CATEGORIES[product.category]} • {supplierMap[product.supplierId]?.name || "-"}
                          </p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">{product.currentStock} / {product.minStock} {product.unit}</span>
                              <span className="font-medium">€{product.avgPrice.toFixed(2)}</span>
                            </div>
                            <Progress value={stockPercent} className="h-1.5" />
                          </div>
                        </div>
                      </div>
                      {/* Quick Stock Actions */}
                      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
                        <div className="flex gap-1">
                          {[-10, -1, 1, 10].map((delta) => (
                            <Button
                              key={delta}
                              variant="outline"
                              size="sm"
                              className={cn(
                                "h-9 w-11 p-0",
                                delta < 0
                                  ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic("light");
                                adjustStock({
                                  id: product._id,
                                  delta,
                                  reason: delta > 0 ? "Quick Zugang" : "Quick Abzug",
                                }).then(() => {
                                  toast({
                                    title: delta > 0 ? "Bestand erhöht" : "Bestand reduziert",
                                    description: `${product.name}: ${delta > 0 ? "+" : ""}${delta} ${product.unit}`,
                                  });
                                });
                              }}
                            >
                              {delta > 0 ? `+${delta}` : delta}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 px-2 text-slate-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStockAdjustment({ product, type: "add" });
                          }}
                        >
                          Mehr...
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </SwipeableCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filteredProducts.length === 0 && (
          searchQuery ? (
            <div className="text-center py-12 text-slate-500">
              <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p>Keine Produkte gefunden</p>
            </div>
          ) : (
            <EmptyProductsState onAdd={() => setIsAddDialogOpen(true)} />
          )
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
            <TableRow>
              <TableHead>Produkt</TableHead>
              <TableHead className="hidden md:table-cell">Kategorie</TableHead>
              <TableHead className="hidden md:table-cell">Lieferant</TableHead>
              <TableHead>Bestand</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Ø Preis</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product: Product) => {
              const status = getStockStatus(product);
              const stockPercent = Math.min(
                (product.currentStock / product.minStock) * 100,
                100
              );
              return (
                <TableRow
                  key={product._id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => setDetailProduct(product)}
                >
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary">
                      {PRODUCT_CATEGORIES[product.category]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {supplierMap[product.supplierId]?.name || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 w-24 md:w-32">
                      <div className="flex justify-between text-sm">
                        <span>{product.currentStock}</span>
                        <span className="text-slate-400">
                          / {product.minStock} {product.unit}
                        </span>
                      </div>
                      <Progress value={stockPercent} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={status.color}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">€{product.avgPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 md:h-8 md:w-8 text-red-600 hover:text-red-700 hover:bg-red-50 touch-manipulation"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStockAdjustment({ product, type: "remove" });
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 md:h-8 md:w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 touch-manipulation"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStockAdjustment({ product, type: "add" });
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 md:h-8 md:w-8 touch-manipulation"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditProduct(product);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-slate-500"
                >
                  Keine Produkte gefunden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>

      {/* Edit Product Dialog */}
      <ProductDialog
        product={editProduct}
        onClose={() => setEditProduct(null)}
        onSave={handleSaveProduct}
        suppliers={suppliers}
      />

      {/* Add Product Dialog */}
      <ProductDialog
        product={null}
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleAddProduct}
        suppliers={suppliers}
        isNew
      />

      {/* Stock Adjustment Dialog */}
      <StockAdjustmentDialog
        adjustment={stockAdjustment}
        onClose={() => setStockAdjustment(null)}
        onSave={handleStockAdjustment}
      />

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        product={detailProduct}
        supplier={detailProduct ? supplierMap[detailProduct.supplierId] : null}
        onClose={() => setDetailProduct(null)}
        isMobile={isMobile}
        onStockAdjust={(type) => {
          if (detailProduct) {
            setDetailProduct(null);
            setStockAdjustment({ product: detailProduct, type });
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Produkt löschen
            </DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie &quot;{deleteConfirm?.name}&quot; löschen möchten?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile FAB */}
      {isMobile && (
        <FAB
          icon={Plus}
          onClick={() => setIsAddDialogOpen(true)}
          badge={lowStockCount > 0 ? lowStockCount : undefined}
        />
      )}
    </motion.div>
  );
}

interface ProductDialogProps {
  product: Product | null;
  isOpen?: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
  suppliers: Supplier[];
  isNew?: boolean;
}

function ProductDialog({
  product,
  isOpen,
  onClose,
  onSave,
  suppliers,
  isNew,
}: ProductDialogProps) {
  const [formData, setFormData] = useState<Partial<Product>>(
    product || {
      name: "",
      category: "sonstiges",
      unit: "Stück",
      currentStock: 0,
      minStock: 0,
      avgPrice: 0,
      supplierId: suppliers[0]?._id,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Update form when product changes
  if (product && formData._id !== product._id) {
    setFormData(product);
  }

  const open = isOpen !== undefined ? isOpen : !!product;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isNew ? "Neues Produkt" : "Produkt bearbeiten"}
          </DialogTitle>
          <DialogDescription>
            {isNew
              ? "Neues Produkt zum Bestand hinzufügen"
              : "Produktdaten aktualisieren"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Produktname</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Kategorie</Label>
              <Select
                value={formData.category}
                onValueChange={(v) =>
                  setFormData({ ...formData, category: v as ProductCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRODUCT_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="unit">Einheit</Label>
              <Input
                id="unit"
                value={formData.unit || ""}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="currentStock">Aktueller Bestand</Label>
              <Input
                id="currentStock"
                type="number"
                value={formData.currentStock || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentStock: Number(e.target.value),
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="minStock">Mindestbestand</Label>
              <Input
                id="minStock"
                type="number"
                value={formData.minStock || 0}
                onChange={(e) =>
                  setFormData({ ...formData, minStock: Number(e.target.value) })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="avgPrice">Durchschnittspreis (€)</Label>
              <Input
                id="avgPrice"
                type="number"
                step="0.01"
                value={formData.avgPrice || 0}
                onChange={(e) =>
                  setFormData({ ...formData, avgPrice: Number(e.target.value) })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="supplier">Lieferant</Label>
              <Select
                value={formData.supplierId}
                onValueChange={(v) =>
                  setFormData({ ...formData, supplierId: v as Id<"suppliers"> })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-600">
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface StockAdjustmentDialogProps {
  adjustment: StockAdjustment | null;
  onClose: () => void;
  onSave: (amount: number, reason: string) => void;
}

function StockAdjustmentDialog({
  adjustment,
  onClose,
  onSave,
}: StockAdjustmentDialogProps) {
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount > 0) {
      onSave(amount, reason);
      setAmount(1);
      setReason("");
    }
  };

  const isRemove = adjustment?.type === "remove";
  const presetReasons = isRemove
    ? ["Inventur", "Verbrauch", "Beschädigt", "Rückgabe an Lieferant", "Leergut-Rücknahme"]
    : ["Inventur", "Korrektur", "Lieferung ohne Dokument", "Leergut-Zugang"];

  return (
    <Dialog open={!!adjustment} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={isRemove ? "text-red-600" : "text-emerald-600"}>
            {isRemove ? (
              <span className="flex items-center gap-2">
                <Minus className="h-5 w-5" /> Bestand reduzieren
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="h-5 w-5" /> Bestand erhöhen
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {adjustment?.product.name} - Aktueller Bestand: {adjustment?.product.currentStock} {adjustment?.product.unit}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Menge</Label>
            <Input
              id="amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="mt-1"
            />
            {isRemove && adjustment && amount > adjustment.product.currentStock && (
              <p className="text-sm text-red-500 mt-1">
                Warnung: Menge übersteigt aktuellen Bestand
              </p>
            )}
          </div>

          <div>
            <Label>Schnellauswahl Grund</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {presetReasons.map((r) => (
                <Button
                  key={r}
                  type="button"
                  variant={reason === r ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReason(r)}
                  className={reason === r ? "bg-amber-500 hover:bg-amber-600" : ""}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Grund (optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Eigener Grund..."
              className="mt-1"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button
              type="submit"
              className={isRemove ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"}
            >
              {isRemove ? "Abziehen" : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ProductDetailDialogProps {
  product: Product | null;
  supplier: Supplier | null | undefined;
  onClose: () => void;
  isMobile?: boolean;
  onStockAdjust?: (type: "add" | "remove") => void;
}

function ProductDetailDialog({
  product,
  supplier,
  onClose,
  isMobile = false,
  onStockAdjust,
}: ProductDetailDialogProps) {
  if (!product) return null;

  const stockPercent = Math.min(
    (product.currentStock / product.minStock) * 100,
    100
  );

  const getStockStatus = () => {
    const ratio = product.currentStock / product.minStock;
    if (ratio < 0.5)
      return { label: "Kritisch", color: "text-red-600 bg-red-100" };
    if (ratio < 1)
      return { label: "Niedrig", color: "text-amber-600 bg-amber-100" };
    return { label: "OK", color: "text-emerald-600 bg-emerald-100" };
  };

  const status = getStockStatus();

  const generateMailtoLink = () => {
    if (!supplier?.email) return null;

    const subject = encodeURIComponent(`Nachbestellung: ${product.name}`);
    const body = encodeURIComponent(
      `Sehr geehrte Damen und Herren,

wir möchten gerne folgendes Produkt nachbestellen:

Produkt: ${product.name}
Kategorie: ${PRODUCT_CATEGORIES[product.category]}
Aktuelle Menge: ${product.currentStock} ${product.unit}
Benötigte Menge: [BITTE EINTRAGEN]

Mit freundlichen Grüßen,
Maison Isebr CKE`
    );

    return `mailto:${supplier.email}?subject=${subject}&body=${body}`;
  };

  const mailtoLink = generateMailtoLink();

  // Content shared between Dialog and BottomSheet
  const DetailContent = () => (
    <div className="space-y-6">
      {/* Header badges */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {PRODUCT_CATEGORIES[product.category]}
        </Badge>
        <Badge className={status.color}>{status.label}</Badge>
      </div>

      {/* Stock Display - Mobile optimized */}
      <div className="space-y-4">
        <div className="text-center p-6 bg-slate-50 rounded-xl">
          <div className="text-4xl font-bold text-slate-900 mb-1">
            {product.currentStock}
            <span className="text-lg font-normal text-slate-500 ml-1">
              / {product.minStock} {product.unit}
            </span>
          </div>
          <Progress value={stockPercent} className="h-3 mt-3" />
        </div>

        {/* Quick Stock Buttons - Mobile only */}
        {isMobile && onStockAdjust && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="lg"
              className="h-14 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={() => onStockAdjust("remove")}
            >
              <Minus className="h-5 w-5 mr-2" />
              Abzug
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
              onClick={() => onStockAdjust("add")}
            >
              <Plus className="h-5 w-5 mr-2" />
              Zugang
            </Button>
          </div>
        )}

        <Separator />

        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Durchschnittspreis</span>
          <span className="font-semibold">€{product.avgPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Supplier Section */}
      {supplier && (
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Lieferant
          </h4>
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="font-medium text-slate-900">{supplier.name}</div>
            {supplier.contactPerson && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="h-4 w-4" />
                <span>{supplier.contactPerson}</span>
              </div>
            )}

            {/* Contact buttons - more prominent on mobile */}
            <div className={cn("flex gap-2", isMobile ? "flex-col" : "flex-row")}>
              {supplier.phone && (
                <Button
                  asChild
                  variant="outline"
                  size={isMobile ? "lg" : "sm"}
                  className={cn("flex-1", isMobile && "h-12")}
                >
                  <a href={`tel:${supplier.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    {isMobile ? "Anrufen" : supplier.phone}
                  </a>
                </Button>
              )}
              {supplier.email && (
                <Button
                  asChild
                  variant="outline"
                  size={isMobile ? "lg" : "sm"}
                  className={cn("flex-1", isMobile && "h-12")}
                >
                  <a href={`mailto:${supplier.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    {isMobile ? "E-Mail" : supplier.email}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {!supplier && (
        <div className="text-sm text-slate-500 italic text-center py-4">
          Kein Lieferant zugeordnet
        </div>
      )}
    </div>
  );

  // Use BottomSheet on mobile
  if (isMobile) {
    return (
      <BottomSheet
        open={!!product}
        onOpenChange={onClose}
        title={product.name}
      >
        <BottomSheetBody>
          <DetailContent />
        </BottomSheetBody>
        <BottomSheetFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Schließen
          </Button>
          {mailtoLink ? (
            <Button
              asChild
              className="bg-amber-500 hover:bg-amber-600 flex-1"
            >
              <a href={mailtoLink}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Nachbestellen
              </a>
            </Button>
          ) : (
            <Button disabled className="flex-1">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Nachbestellen
            </Button>
          )}
        </BottomSheetFooter>
      </BottomSheet>
    );
  }

  // Desktop Dialog
  return (
    <Dialog open={!!product} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.name}</DialogTitle>
        </DialogHeader>

        <DetailContent />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="sm:flex-1">
            Schließen
          </Button>
          {mailtoLink ? (
            <Button
              asChild
              className="bg-amber-500 hover:bg-amber-600 sm:flex-1"
            >
              <a href={mailtoLink}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Nachbestellen
              </a>
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="sm:flex-1">
                    <Button disabled className="w-full">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Nachbestellen
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{!supplier ? "Kein Lieferant zugeordnet" : "Keine E-Mail beim Lieferanten hinterlegt"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
