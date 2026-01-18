import { useState, useRef } from 'react';
import {
    Upload,
    FileText,
    Search,
    X,
    Eye,
    AlertTriangle,
    FileUp,
    Check
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DEMO_DOCUMENTS } from '@/lib/mockData';
import type { UploadedDocument } from '@/types';

export default function Documents() {
    const [documents, setDocuments] = useState(DEMO_DOCUMENTS);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [selectedDoc, setSelectedDoc] = useState<UploadedDocument | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const filteredDocuments = documents.filter((doc) => {
        const matchesSearch =
            doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.supplierName.toLowerCase().includes(searchQuery.toLowerCase());

        if (activeTab === 'all') return matchesSearch;
        if (activeTab === 'invoices') return matchesSearch && doc.type === 'invoice';
        if (activeTab === 'delivery') return matchesSearch && doc.type === 'delivery_note';
        if (activeTab === 'pending') return matchesSearch && doc.status === 'pending';
        return matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-emerald-100 text-emerald-800">Genehmigt</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-800">Abgelehnt</Badge>;
            case 'pending':
                return <Badge className="bg-amber-100 text-amber-800">Ausstehend</Badge>;
            case 'analyzed':
                return <Badge className="bg-blue-100 text-blue-800">Analysiert</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        // Simulate upload and analysis
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const newDoc: UploadedDocument = {
            id: String(documents.length + 1),
            type: 'invoice',
            fileName: file.name,
            uploadDate: new Date().toISOString().split('T')[0],
            supplierName: 'Unbekannt',
            documentDate: new Date().toISOString().split('T')[0],
            totalAmount: Math.random() * 1000 + 100,
            status: 'analyzed',
            items: [
                { name: 'Position 1', quantity: 10, unit: 'Stück', unitPrice: 5.00, totalPrice: 50.00 },
                { name: 'Position 2', quantity: 5, unit: 'kg', unitPrice: 12.00, totalPrice: 60.00 },
            ],
            anomalies: [],
        };

        setDocuments([newDoc, ...documents]);
        setIsUploading(false);

        toast({
            title: 'Dokument hochgeladen',
            description: `${file.name} wurde erfolgreich analysiert.`,
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleApprove = (docId: string) => {
        setDocuments(docs =>
            docs.map(d => d.id === docId ? { ...d, status: 'approved' as const } : d)
        );
        toast({
            title: 'Dokument genehmigt',
            description: 'Das Dokument wurde als genehmigt markiert.',
        });
    };

    const handleReject = (docId: string) => {
        setDocuments(docs =>
            docs.map(d => d.id === docId ? { ...d, status: 'rejected' as const } : d)
        );
        toast({
            title: 'Dokument abgelehnt',
            description: 'Das Dokument wurde als abgelehnt markiert.',
            variant: 'destructive',
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dokumente</h1>
                    <p className="text-slate-500 mt-1">Rechnungen und Lieferscheine verwalten</p>
                </div>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-amber-500 hover:bg-amber-600"
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Wird analysiert...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Dokument hochladen
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Upload Area */}
            <Card className="border-dashed border-2 border-slate-200 bg-slate-50">
                <CardContent className="py-8">
                    <div
                        className="flex flex-col items-center justify-center text-center cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="p-4 rounded-full bg-amber-100 mb-4">
                            <FileUp className="h-8 w-8 text-amber-600" />
                        </div>
                        <h3 className="font-medium text-slate-900 mb-1">
                            Dokument hier ablegen oder klicken zum Hochladen
                        </h3>
                        <p className="text-sm text-slate-500">
                            PDF, JPG oder PNG • Max. 10MB
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Suche nach Dateiname oder Lieferant..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">
                        Alle ({documents.length})
                    </TabsTrigger>
                    <TabsTrigger value="invoices">
                        Rechnungen ({documents.filter(d => d.type === 'invoice').length})
                    </TabsTrigger>
                    <TabsTrigger value="delivery">
                        Lieferscheine ({documents.filter(d => d.type === 'delivery_note').length})
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                        Ausstehend ({documents.filter(d => d.status === 'pending').length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Dokument</TableHead>
                                    <TableHead>Lieferant</TableHead>
                                    <TableHead>Datum</TableHead>
                                    <TableHead>Betrag</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Auffälligkeiten</TableHead>
                                    <TableHead className="text-right">Aktionen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDocuments.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-slate-400" />
                                                <span className="font-medium">{doc.fileName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{doc.supplierName}</TableCell>
                                        <TableCell>{doc.documentDate}</TableCell>
                                        <TableCell>
                                            {doc.type === 'invoice'
                                                ? `€${doc.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`
                                                : '-'
                                            }
                                        </TableCell>
                                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                                        <TableCell>
                                            {doc.anomalies.length > 0 ? (
                                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                    {doc.anomalies.length}
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setSelectedDoc(doc)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {(doc.status === 'pending' || doc.status === 'analyzed') && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                            onClick={() => handleApprove(doc.id)}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleReject(doc.id)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredDocuments.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                            Keine Dokumente gefunden
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Document Detail Dialog */}
            <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedDoc?.fileName}</DialogTitle>
                        <DialogDescription>
                            {selectedDoc?.supplierName} • {selectedDoc?.documentDate}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedDoc && (
                        <div className="space-y-4">
                            {/* Status and Amount */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-slate-500">Status</p>
                                    {getStatusBadge(selectedDoc.status)}
                                </div>
                                {selectedDoc.type === 'invoice' && (
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500">Gesamtbetrag</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            €{selectedDoc.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Anomalies */}
                            {selectedDoc.anomalies.length > 0 && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                                    <h4 className="font-medium text-red-800 flex items-center gap-2 mb-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Erkannte Auffälligkeiten
                                    </h4>
                                    {selectedDoc.anomalies.map((anomaly) => (
                                        <div key={anomaly.id} className="text-sm text-red-700">
                                            <p className="font-medium">{anomaly.title}</p>
                                            <p className="text-red-600">{anomaly.description}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Items */}
                            <div>
                                <h4 className="font-medium text-slate-900 mb-2">Positionen</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Artikel</TableHead>
                                            <TableHead className="text-right">Menge</TableHead>
                                            <TableHead className="text-right">Einzelpreis</TableHead>
                                            <TableHead className="text-right">Gesamt</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedDoc.items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                                                <TableCell className="text-right">
                                                    {item.unitPrice > 0 ? `€${item.unitPrice.toFixed(2)}` : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {item.totalPrice > 0 ? `€${item.totalPrice.toFixed(2)}` : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Actions */}
                            {(selectedDoc.status === 'pending' || selectedDoc.status === 'analyzed') && (
                                <div className="flex justify-end gap-2 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            handleReject(selectedDoc.id);
                                            setSelectedDoc(null);
                                        }}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Ablehnen
                                    </Button>
                                    <Button
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                        onClick={() => {
                                            handleApprove(selectedDoc.id);
                                            setSelectedDoc(null);
                                        }}
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        Genehmigen
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
