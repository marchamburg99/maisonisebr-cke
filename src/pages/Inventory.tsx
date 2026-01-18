import { useState, useEffect } from 'react';
import {
    Package,
    Search,
    Plus,
    AlertTriangle,
    Edit,
    ShoppingBag,
    Mail
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DEMO_PRODUCTS, DEMO_SUPPLIERS } from '@/lib/mockData';
import { PRODUCT_CATEGORIES, type Product, type ProductCategory } from '@/types';
import { cn } from '@/lib/utils';

export default function Inventory() {
    const [products, setProducts] = useState(DEMO_PRODUCTS);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [showLowStock, setShowLowStock] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [orderProduct, setOrderProduct] = useState<Product | null>(null);
    const { toast } = useToast();

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        const matchesLowStock = !showLowStock || product.currentStock < product.minStock;
        return matchesSearch && matchesCategory && matchesLowStock;
    });

    const lowStockCount = products.filter(p => p.currentStock < p.minStock).length;

    const getStockStatus = (product: Product) => {
        const ratio = product.currentStock / product.minStock;
        if (ratio < 0.5) return { label: 'Kritisch', color: 'text-red-600 bg-red-100' };
        if (ratio < 1) return { label: 'Niedrig', color: 'text-amber-600 bg-amber-100' };
        return { label: 'OK', color: 'text-emerald-600 bg-emerald-100' };
    };

    const handleSaveProduct = (updatedProduct: Product) => {
        setProducts(products.map(p =>
            p.id === updatedProduct.id ? updatedProduct : p
        ));
        setEditProduct(null);
        toast({
            title: 'Produkt aktualisiert',
            description: `${updatedProduct.name} wurde erfolgreich gespeichert.`,
        });
    };

    const handleAddProduct = (newProduct: Omit<Product, 'id'>) => {
        const product: Product = {
            ...newProduct,
            id: String(products.length + 1),
        };
        setProducts([...products, product]);
        setIsAddDialogOpen(false);
        toast({
            title: 'Produkt hinzugefügt',
            description: `${product.name} wurde erfolgreich angelegt.`,
        });
    };

    const supplierMap = DEMO_SUPPLIERS.reduce((acc, s) => {
        acc[s.id] = s.name;
        return acc;
    }, {} as Record<string, string>);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Warenbestand</h1>
                    <p className="text-slate-500 mt-1">Produkte und Lagerbestände verwalten</p>
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
                                <p className="text-2xl font-bold text-slate-900">{products.length}</p>
                            </div>
                            <Package className="h-8 w-8 text-slate-300" />
                        </div>
                    </CardContent>
                </Card>
                <Card className={cn(lowStockCount > 0 && "border-amber-200 bg-amber-50")}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Niedriger Bestand</p>
                                <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
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
                                {new Set(products.map(p => p.category)).size}
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
                            <SelectItem key={key} value={key}>{label}</SelectItem>
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
                        {filteredProducts.map((product) => {
                            const status = getStockStatus(product);
                            const stockPercent = Math.min((product.currentStock / product.minStock) * 100, 100);
                            return (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {PRODUCT_CATEGORIES[product.category]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{supplierMap[product.supplierId] || '-'}</TableCell>
                                    <TableCell>
                                        <div className="space-y-1 w-32">
                                            <div className="flex justify-between text-sm">
                                                <span>{product.currentStock}</span>
                                                <span className="text-slate-400">/ {product.minStock} {product.unit}</span>
                                            </div>
                                            <Progress value={stockPercent} className="h-1.5" />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={status.color}>{status.label}</Badge>
                                    </TableCell>
                                    <TableCell>€{product.avgPrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Bestellen"
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => setOrderProduct(product)}
                                            >
                                                <ShoppingBag className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditProduct(product)}
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
                                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
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
                suppliers={DEMO_SUPPLIERS}
            />

            {/* Add Product Dialog */}
            <ProductDialog
                product={null}
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onSave={(product) => handleAddProduct(product as Omit<Product, 'id'>)}
                suppliers={DEMO_SUPPLIERS}
                isNew
            />

            {/* Order Dialog */}
            <OrderDialog
                product={orderProduct}
                onClose={() => setOrderProduct(null)}
                suppliers={DEMO_SUPPLIERS}
            />
        </div>
    );
}

interface OrderDialogProps {
    product: Product | null;
    onClose: () => void;
    suppliers: typeof DEMO_SUPPLIERS;
}

function OrderDialog({ product, onClose, suppliers }: OrderDialogProps) {
    const [quantity, setQuantity] = useState(1);
    const supplier = product ? suppliers.find(s => s.id === product.supplierId) : null;

    // Calculate suggested order amount to reach minStock + buffer
    const initialQuantity = product ? Math.max(product.minStock * 2 - product.currentStock, 1) : 1;

    // Use effect to set initial quantity only when product changes
    useEffect(() => {
        setQuantity(initialQuantity);
    }, [product?.id, initialQuantity]); // Added initialQuantity to dependencies

    if (!product || !supplier) return null;

    /* Safe Mail Client Trigger */
    const handleSendMail = () => {
        const subject = `Bestellung: ${product.name} - Ihr Restaurant`;
        const body = `Sehr geehrte Damen und Herren, \nSehr geehrte(r) ${supplier.contactPerson}, \n\nbitte liefern Sie uns folgende Artikel: \n\nArtikel: ${product.name} \nMenge: ${quantity} ${product.unit} \n\nLieferdatum: schnellstmöglich\n\nMit freundlichen Grüßen, \nIhr Restaurant - Team`;

        const mailtoLink = `mailto:${supplier.email}?subject = ${encodeURIComponent(subject)}& body=${encodeURIComponent(body)} `;

        // Robust hidden link method
        const link = document.createElement('a');
        link.href = mailtoLink;
        link.target = '_self';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        onClose();
    };

    /* Copy to Clipboard Fallback */
    const handleCopyText = async () => {
        const subject = `Bestellung: ${product.name} - Ihr Restaurant`;
        const body = `Sehr geehrte Damen und Herren, \nSehr geehrte(r) ${supplier.contactPerson}, \n\nbitte liefern Sie uns folgende Artikel: \n\nArtikel: ${product.name} \nMenge: ${quantity} ${product.unit} \n\nLieferdatum: schnellstmöglich\n\nMit freundlichen Grüßen, \nIhr Restaurant - Team`;

        const fullText = `An: ${supplier.email} \nBetreff: ${subject} \n\n${body} `;

        try {
            await navigator.clipboard.writeText(fullText);
            // Small visual feedback (could use toast here if available in this scope, let's assume parent handles toast)
            // eslint-disable-next-line
            alert("Bestelltext in die Zwischenablage kopiert!");
            onClose();
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    return (
        <Dialog open={!!product} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ware nachbestellen</DialogTitle>
                    <DialogDescription>
                        Bestellung für <strong>{product.name}</strong> bei {supplier.name} vorbereiten.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Aktueller Bestand</Label>
                            <div className="text-sm font-medium">{product.currentStock} {product.unit}</div>
                        </div>
                        <div>
                            <Label>Mindestbestand</Label>
                            <div className="text-sm font-medium">{product.minStock} {product.unit}</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="orderQuantity">Bestellmenge ({product.unit})</Label>
                        <Input
                            id="orderQuantity"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                        />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-600">
                        <p className="font-medium mb-1">Empfänger:</p>
                        <p>{supplier.name} ({supplier.email})</p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>Abbrechen</Button>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={handleCopyText} title="Text kopieren">
                            <span className="mr-2">📋</span> Kopieren
                        </Button>
                        <Button onClick={handleSendMail} className="bg-blue-600 hover:bg-blue-700">
                            <Mail className="h-4 w-4 mr-2" />
                            E-Mail öffnen
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface ProductDialogProps {
    product: Product | null;
    isOpen?: boolean;
    onClose: () => void;
    onSave: (product: Product) => void;
    suppliers: typeof DEMO_SUPPLIERS;
    isNew?: boolean;
}

function ProductDialog({ product, isOpen, onClose, onSave, suppliers, isNew }: ProductDialogProps) {
    const [formData, setFormData] = useState<Partial<Product>>(product || {
        name: '',
        category: 'sonstiges',
        unit: 'Stück',
        currentStock: 0,
        minStock: 0,
        avgPrice: 0,
        supplierId: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Product);
    };

    // Update form when product changes
    if (product && formData.id !== product.id) {
        setFormData(product);
    }

    const open = isOpen !== undefined ? isOpen : !!product;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isNew ? 'Neues Produkt' : 'Produkt bearbeiten'}</DialogTitle>
                    <DialogDescription>
                        {isNew ? 'Neues Produkt zum Bestand hinzufügen' : 'Produktdaten aktualisieren'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label htmlFor="name">Produktname</Label>
                            <Input
                                id="name"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="category">Kategorie</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(v) => setFormData({ ...formData, category: v as ProductCategory })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PRODUCT_CATEGORIES).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="unit">Einheit</Label>
                            <Input
                                id="unit"
                                value={formData.unit || ''}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="currentStock">Aktueller Bestand</Label>
                            <Input
                                id="currentStock"
                                type="number"
                                value={formData.currentStock || 0}
                                onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="minStock">Mindestbestand</Label>
                            <Input
                                id="minStock"
                                type="number"
                                value={formData.minStock || 0}
                                onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
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
                                onChange={(e) => setFormData({ ...formData, avgPrice: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="supplier">Lieferant</Label>
                            <Select
                                value={formData.supplierId}
                                onValueChange={(v) => setFormData({ ...formData, supplierId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Auswählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
