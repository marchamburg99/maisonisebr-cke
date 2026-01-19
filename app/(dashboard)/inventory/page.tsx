"use client";

import { useState } from "react";
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  Edit,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PRODUCT_CATEGORIES, type ProductCategory } from "@/types";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

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
};

export default function InventoryPage() {
  const products = useQuery(api.products.list) ?? [];
  const suppliers = useQuery(api.suppliers.list) ?? [];
  const updateProduct = useMutation(api.products.update);
  const createProduct = useMutation(api.products.create);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showLowStock, setShowLowStock] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

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

  const supplierMap = suppliers.reduce(
    (acc: Record<string, string>, s: Supplier) => {
      acc[s._id] = s.name;
      return acc;
    },
    {} as Record<string, string>
  );

  if (!products || !suppliers) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Warenbestand</h1>
          <p className="text-slate-500 mt-1">
            Produkte und Lagerbestände verwalten
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-amber-500 hover:bg-amber-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Produkt hinzufügen
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Produkte gesamt</p>
                <p className="text-2xl font-bold text-slate-900">
                  {products.length}
                </p>
              </div>
              <Package className="h-8 w-8 text-slate-300" />
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(lowStockCount > 0 && "border-amber-200 bg-amber-50")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Niedriger Bestand</p>
                <p className="text-2xl font-bold text-amber-600">
                  {lowStockCount}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-slate-500">Kategorien</p>
              <p className="text-2xl font-bold text-slate-900">
                {new Set(products.map((p: Product) => p.category)).size}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Produkt suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
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

      {/* Products Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produkt</TableHead>
              <TableHead>Kategorie</TableHead>
              <TableHead>Lieferant</TableHead>
              <TableHead>Bestand</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ø Preis</TableHead>
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
                <TableRow key={product._id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {PRODUCT_CATEGORIES[product.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {supplierMap[product.supplierId] || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 w-32">
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
                  <TableCell>€{product.avgPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditProduct(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
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
    </div>
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
