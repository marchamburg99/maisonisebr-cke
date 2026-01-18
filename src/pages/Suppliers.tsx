import { useState } from 'react';
import {
    Truck,
    Search,
    Plus,
    Edit,
    Star,
    Phone,
    Mail,
    MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DEMO_SUPPLIERS } from '@/lib/mockData';
import type { Supplier } from '@/types';

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState(DEMO_SUPPLIERS);
    const [searchQuery, setSearchQuery] = useState('');
    const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const { toast } = useToast();

    const filteredSuppliers = suppliers.filter((supplier) =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSaveSupplier = (updatedSupplier: Supplier) => {
        setSuppliers(suppliers.map(s =>
            s.id === updatedSupplier.id ? updatedSupplier : s
        ));
        setEditSupplier(null);
        toast({
            title: 'Lieferant aktualisiert',
            description: `${updatedSupplier.name} wurde erfolgreich gespeichert.`,
        });
    };

    const handleAddSupplier = (newSupplier: Omit<Supplier, 'id' | 'createdAt'>) => {
        const supplier: Supplier = {
            ...newSupplier,
            id: String(suppliers.length + 1),
            createdAt: new Date().toISOString().split('T')[0],
        };
        setSuppliers([...suppliers, supplier]);
        setIsAddDialogOpen(false);
        toast({
            title: 'Lieferant hinzugefügt',
            description: `${supplier.name} wurde erfolgreich angelegt.`,
        });
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                            }`}
                    />
                ))}
                <span className="ml-1 text-sm text-slate-500">{rating.toFixed(1)}</span>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Lieferanten</h1>
                    <p className="text-slate-500 mt-1">Lieferantenstammdaten verwalten</p>
                </div>
                <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-amber-500 hover:bg-amber-600"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Lieferant hinzufügen
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Lieferant suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Supplier Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSuppliers.map((supplier) => (
                    <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-slate-100">
                                        <Truck className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{supplier.name}</CardTitle>
                                        <Badge variant="secondary" className="mt-1">{supplier.category}</Badge>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditSupplier(supplier)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Rating */}
                            <div>{renderStars(supplier.rating)}</div>

                            {/* Contact Info */}
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Mail className="h-4 w-4" />
                                    <a href={`mailto:${supplier.email}`} className="hover:text-amber-600">
                                        {supplier.email}
                                    </a>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Phone className="h-4 w-4" />
                                    <a href={`tel:${supplier.phone}`} className="hover:text-amber-600">
                                        {supplier.phone}
                                    </a>
                                </div>
                                <div className="flex items-start gap-2 text-slate-600">
                                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>{supplier.address}</span>
                                </div>
                            </div>

                            {/* Contact Person */}
                            <div className="pt-3 border-t text-sm">
                                <span className="text-slate-500">Ansprechpartner:</span>{' '}
                                <span className="font-medium">{supplier.contactPerson}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredSuppliers.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center text-slate-500">
                        <Truck className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                        <p>Keine Lieferanten gefunden</p>
                    </CardContent>
                </Card>
            )}

            {/* Edit Supplier Dialog */}
            <SupplierDialog
                supplier={editSupplier}
                onClose={() => setEditSupplier(null)}
                onSave={handleSaveSupplier}
            />

            {/* Add Supplier Dialog */}
            <SupplierDialog
                supplier={null}
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onSave={(supplier) => handleAddSupplier(supplier as Omit<Supplier, 'id' | 'createdAt'>)}
                isNew
            />
        </div>
    );
}

interface SupplierDialogProps {
    supplier: Supplier | null;
    isOpen?: boolean;
    onClose: () => void;
    onSave: (supplier: Supplier) => void;
    isNew?: boolean;
}

function SupplierDialog({ supplier, isOpen, onClose, onSave, isNew }: SupplierDialogProps) {
    const [formData, setFormData] = useState<Partial<Supplier>>(supplier || {
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        category: '',
        rating: 3,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Supplier);
    };

    // Update form when supplier changes
    if (supplier && formData.id !== supplier.id) {
        setFormData(supplier);
    }

    const open = isOpen !== undefined ? isOpen : !!supplier;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isNew ? 'Neuer Lieferant' : 'Lieferant bearbeiten'}</DialogTitle>
                    <DialogDescription>
                        {isNew ? 'Neuen Lieferanten hinzufügen' : 'Lieferantendaten aktualisieren'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label htmlFor="name">Firmenname</Label>
                            <Input
                                id="name"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="contactPerson">Ansprechpartner</Label>
                            <Input
                                id="contactPerson"
                                value={formData.contactPerson || ''}
                                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="category">Kategorie</Label>
                            <Input
                                id="category"
                                value={formData.category || ''}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="z.B. Großhandel, Getränke..."
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">E-Mail</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="phone">Telefon</Label>
                            <Input
                                id="phone"
                                value={formData.phone || ''}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                        </div>
                        <div className="col-span-2">
                            <Label htmlFor="address">Adresse</Label>
                            <Textarea
                                id="address"
                                value={formData.address || ''}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="rating">Bewertung (1-5)</Label>
                            <Input
                                id="rating"
                                type="number"
                                min="1"
                                max="5"
                                step="0.1"
                                value={formData.rating || 3}
                                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                                required
                            />
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
