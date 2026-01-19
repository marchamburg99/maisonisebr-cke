"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  Search,
  X,
  Eye,
  AlertTriangle,
  FileUp,
  Check,
  Loader2,
  Plus,
  Trash2,
  Edit,
  Download,
  FileIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Id } from "@/convex/_generated/dataModel";

type Anomaly = {
  _id: Id<"anomalies">;
  type: string;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  documentId?: Id<"documents">;
  productId?: Id<"products">;
  supplierId?: Id<"suppliers">;
  detectedAt: number;
  resolved: boolean;
  resolvedAt?: number;
  resolvedBy?: Id<"users">;
};

type DocumentWithItems = {
  _id: Id<"documents">;
  type: "invoice" | "delivery_note";
  fileName: string;
  fileId?: Id<"_storage">;
  invoiceNumber?: string;
  uploadDate: number;
  supplierName: string;
  supplierAddress?: string;
  supplierId?: Id<"suppliers">;
  documentDate: number;
  dueDate?: number;
  netAmount?: number;
  taxAmount?: number;
  taxRate?: number;
  totalAmount: number;
  status: "pending" | "analyzed" | "approved" | "rejected";
  uploadedBy: Id<"users">;
  items: {
    _id: Id<"documentItems">;
    documentId: Id<"documents">;
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }[];
};

type ExtractedItem = {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
};

type ExtractedInvoiceData = {
  fileName: string;
  type: "invoice" | "delivery_note";
  invoiceNumber: string;
  supplierName: string;
  supplierAddress: string;
  documentDate: string;
  dueDate: string;
  netAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  items: ExtractedItem[];
};

export default function DocumentsPage() {
  const documents = useQuery(api.documents.listWithItems) ?? [];
  const anomalies = useQuery(api.anomalies.list) ?? [];
  const updateStatus = useMutation(api.documents.updateStatus);
  const createDocument = useMutation(api.documents.create);
  const updateDocument = useMutation(api.documents.update);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState<DocumentWithItems | null>(null);
  const [isViewMode, setIsViewMode] = useState(true);
  const [editingDoc, setEditingDoc] = useState<ExtractedInvoiceData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get file URL when document is selected
  const selectedDocFileId = selectedDoc?.fileId;
  const fetchedFileUrl = useQuery(
    api.documents.getFileUrl,
    selectedDocFileId ? { fileId: selectedDocFileId } : "skip"
  );

  // Update fileUrl when fetchedFileUrl changes
  if (fetchedFileUrl !== undefined && fetchedFileUrl !== fileUrl) {
    setFileUrl(fetchedFileUrl);
  }

  const filteredDocuments = documents.filter((doc: DocumentWithItems) => {
    const matchesSearch =
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.supplierName.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "invoices")
      return matchesSearch && doc.type === "invoice";
    if (activeTab === "delivery")
      return matchesSearch && doc.type === "delivery_note";
    if (activeTab === "pending")
      return matchesSearch && doc.status === "pending";
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-emerald-100 text-emerald-800">Genehmigt</Badge>
        );
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Abgelehnt</Badge>;
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800">Ausstehend</Badge>
        );
      case "analyzed":
        return <Badge className="bg-blue-100 text-blue-800">Analysiert</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Simulated PDF extraction - in production, this would use OCR/AI service
  const extractInvoiceData = useCallback(async (file: File): Promise<ExtractedInvoiceData> => {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // For demo: detect document type based on filename
    // In production, this would call an OCR service like Google Cloud Vision, AWS Textract, etc.
    const fileName = file.name.toLowerCase();
    const isDeliveryNote = fileName.includes("delivery") || fileName.includes("lieferschein");

    if (isDeliveryNote) {
      // Lieferschein - no prices, just quantities
      return {
        fileName: file.name,
        type: "delivery_note",
        invoiceNumber: "LS-2024-8921",
        supplierName: "Frischehof Müller GmbH",
        supplierAddress: "Ackerstraße 12, 20457 Hamburg",
        documentDate: "2024-01-25",
        dueDate: "",
        netAmount: 0,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: 0,
        items: [
          {
            name: 'Kartoffeln "Belana" festkochend',
            quantity: 25,
            unit: "kg",
            unitPrice: 0,
            totalPrice: 0,
          },
          {
            name: "Speisezwiebeln Metzger",
            quantity: 10,
            unit: "kg",
            unitPrice: 0,
            totalPrice: 0,
          },
          {
            name: "Möhren gewaschen, Kiste",
            quantity: 2,
            unit: "Stk",
            unitPrice: 0,
            totalPrice: 0,
          },
          {
            name: "Rotkohl frisch",
            quantity: 10,
            unit: "kg",
            unitPrice: 0,
            totalPrice: 0,
          },
          {
            name: "Hähnchenbrust",
            quantity: 10,
            unit: "kg",
            unitPrice: 0,
            totalPrice: 0,
          },
        ],
      };
    }

    // Rechnung - with prices
    return {
      fileName: file.name,
      type: "invoice",
      invoiceNumber: "2024-8921",
      supplierName: "Frischehof Müller GmbH",
      supplierAddress: "Ackerstraße 12, 20457 Hamburg",
      documentDate: "2024-01-25",
      dueDate: "2024-02-04",
      netAmount: 66.00,
      taxRate: 7,
      taxAmount: 4.62,
      totalAmount: 70.62,
      items: [
        {
          name: 'Kartoffeln "Belana" festkochend',
          quantity: 25,
          unit: "kg",
          unitPrice: 1.20,
          totalPrice: 30.00,
        },
        {
          name: "Speisezwiebeln Metzger",
          quantity: 10,
          unit: "kg",
          unitPrice: 0.90,
          totalPrice: 9.00,
        },
        {
          name: "Möhren gewaschen, Kiste",
          quantity: 2,
          unit: "Stk",
          unitPrice: 6.50,
          totalPrice: 13.00,
        },
        {
          name: "Rotkohl frisch",
          quantity: 10,
          unit: "kg",
          unitPrice: 1.40,
          totalPrice: 14.00,
        },
      ],
    };
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!user) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte laden Sie eine PDF, JPG oder PNG Datei hoch.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setPendingFile(file);

    try {
      // Extract data from the document
      const data = await extractInvoiceData(file);
      setExtractedData(data);
      setIsVerifyDialogOpen(true);
    } catch {
      toast({
        title: "Fehler bei der Analyse",
        description: "Das Dokument konnte nicht analysiert werden.",
        variant: "destructive",
      });
      setPendingFile(null);
    } finally {
      setIsUploading(false);
    }
  }, [user, extractInvoiceData, toast]);

  const handleSaveDocument = useCallback(async () => {
    if (!extractedData || !user) return;

    setIsSaving(true);

    try {
      // Upload file to storage if we have a pending file
      let fileId: Id<"_storage"> | undefined;
      if (pendingFile) {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": pendingFile.type },
          body: pendingFile,
        });
        if (!response.ok) {
          throw new Error("File upload failed");
        }
        const { storageId } = await response.json();
        fileId = storageId;
      }

      // Parse dates
      const documentDate = new Date(extractedData.documentDate).getTime();
      const dueDate = extractedData.dueDate ? new Date(extractedData.dueDate).getTime() : undefined;

      await createDocument({
        type: extractedData.type,
        fileName: extractedData.fileName,
        fileId,
        invoiceNumber: extractedData.invoiceNumber || undefined,
        supplierName: extractedData.supplierName,
        supplierAddress: extractedData.supplierAddress || undefined,
        documentDate,
        dueDate,
        netAmount: extractedData.netAmount,
        taxAmount: extractedData.taxAmount,
        taxRate: extractedData.taxRate,
        totalAmount: extractedData.totalAmount,
        uploadedBy: user._id,
        items: extractedData.items,
      });

      toast({
        title: "Dokument gespeichert",
        description: `${extractedData.fileName} wurde erfolgreich hinzugefügt.`,
      });

      setIsVerifyDialogOpen(false);
      setExtractedData(null);
      setPendingFile(null);
    } catch {
      toast({
        title: "Fehler beim Speichern",
        description: "Das Dokument konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [extractedData, user, pendingFile, generateUploadUrl, createDocument, toast]);

  const updateExtractedField = useCallback((field: keyof ExtractedInvoiceData, value: string | number) => {
    if (!extractedData) return;
    setExtractedData({ ...extractedData, [field]: value });
  }, [extractedData]);

  const updateExtractedItem = useCallback((index: number, field: keyof ExtractedItem, value: string | number) => {
    if (!extractedData) return;
    const newItems = [...extractedData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate total price if quantity or unit price changed
    if (field === "quantity" || field === "unitPrice") {
      newItems[index].totalPrice = Number(newItems[index].quantity) * Number(newItems[index].unitPrice);
    }

    // Recalculate totals
    const netAmount = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = netAmount * (extractedData.taxRate / 100);
    const totalAmount = netAmount + taxAmount;

    setExtractedData({
      ...extractedData,
      items: newItems,
      netAmount: Math.round(netAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    });
  }, [extractedData]);

  const addItem = useCallback(() => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      items: [
        ...extractedData.items,
        { name: "", quantity: 0, unit: "Stk", unitPrice: 0, totalPrice: 0 },
      ],
    });
  }, [extractedData]);

  const removeItem = useCallback((index: number) => {
    if (!extractedData) return;
    const newItems = extractedData.items.filter((_, i) => i !== index);

    // Recalculate totals
    const netAmount = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = netAmount * (extractedData.taxRate / 100);
    const totalAmount = netAmount + taxAmount;

    setExtractedData({
      ...extractedData,
      items: newItems,
      netAmount: Math.round(netAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    });
  }, [extractedData]);

  // Start editing an existing document
  const startEditingDocument = useCallback((doc: DocumentWithItems) => {
    setEditingDoc({
      fileName: doc.fileName,
      type: doc.type,
      invoiceNumber: doc.invoiceNumber || "",
      supplierName: doc.supplierName,
      supplierAddress: doc.supplierAddress || "",
      documentDate: new Date(doc.documentDate).toISOString().split("T")[0],
      dueDate: doc.dueDate ? new Date(doc.dueDate).toISOString().split("T")[0] : "",
      netAmount: doc.netAmount || 0,
      taxRate: doc.taxRate || 7,
      taxAmount: doc.taxAmount || 0,
      totalAmount: doc.totalAmount,
      items: doc.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    });
    setIsViewMode(false);
  }, []);

  // Update editing document field
  const updateEditingField = useCallback((field: keyof ExtractedInvoiceData, value: string | number) => {
    if (!editingDoc) return;
    setEditingDoc({ ...editingDoc, [field]: value });
  }, [editingDoc]);

  // Update editing document item
  const updateEditingItem = useCallback((index: number, field: keyof ExtractedItem, value: string | number) => {
    if (!editingDoc) return;
    const newItems = [...editingDoc.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "quantity" || field === "unitPrice") {
      newItems[index].totalPrice = Number(newItems[index].quantity) * Number(newItems[index].unitPrice);
    }

    const netAmount = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = netAmount * (editingDoc.taxRate / 100);
    const totalAmount = netAmount + taxAmount;

    setEditingDoc({
      ...editingDoc,
      items: newItems,
      netAmount: Math.round(netAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    });
  }, [editingDoc]);

  // Add item to editing document
  const addEditingItem = useCallback(() => {
    if (!editingDoc) return;
    setEditingDoc({
      ...editingDoc,
      items: [
        ...editingDoc.items,
        { name: "", quantity: 0, unit: "Stk", unitPrice: 0, totalPrice: 0 },
      ],
    });
  }, [editingDoc]);

  // Remove item from editing document
  const removeEditingItem = useCallback((index: number) => {
    if (!editingDoc) return;
    const newItems = editingDoc.items.filter((_, i) => i !== index);

    const netAmount = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = netAmount * (editingDoc.taxRate / 100);
    const totalAmount = netAmount + taxAmount;

    setEditingDoc({
      ...editingDoc,
      items: newItems,
      netAmount: Math.round(netAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    });
  }, [editingDoc]);

  // Save edited document
  const handleSaveEditedDocument = useCallback(async () => {
    if (!editingDoc || !selectedDoc) return;

    setIsSaving(true);

    try {
      const documentDate = new Date(editingDoc.documentDate).getTime();
      const dueDate = editingDoc.dueDate ? new Date(editingDoc.dueDate).getTime() : undefined;

      await updateDocument({
        id: selectedDoc._id,
        type: editingDoc.type,
        invoiceNumber: editingDoc.invoiceNumber || undefined,
        supplierName: editingDoc.supplierName,
        supplierAddress: editingDoc.supplierAddress || undefined,
        documentDate,
        dueDate,
        netAmount: editingDoc.netAmount,
        taxAmount: editingDoc.taxAmount,
        taxRate: editingDoc.taxRate,
        totalAmount: editingDoc.totalAmount,
        items: editingDoc.items,
      });

      toast({
        title: "Dokument aktualisiert",
        description: "Die Änderungen wurden gespeichert.",
      });

      setIsViewMode(true);
      setEditingDoc(null);
      setSelectedDoc(null);
    } catch {
      toast({
        title: "Fehler beim Speichern",
        description: "Die Änderungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [editingDoc, selectedDoc, updateDocument, toast]);

  // Download PDF
  const handleDownloadPdf = useCallback(() => {
    if (fileUrl && selectedDoc) {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = selectedDoc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [fileUrl, selectedDoc]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  }, [processFile]);

  const handleApprove = async (docId: Id<"documents">) => {
    await updateStatus({ id: docId, status: "approved" });
    toast({
      title: "Dokument genehmigt",
      description: "Das Dokument wurde als genehmigt markiert.",
    });
  };

  const handleReject = async (docId: Id<"documents">) => {
    await updateStatus({ id: docId, status: "rejected" });
    toast({
      title: "Dokument abgelehnt",
      description: "Das Dokument wurde als abgelehnt markiert.",
      variant: "destructive",
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("de-DE");
  };

  const getDocumentAnomalies = (docId: Id<"documents">) => {
    return anomalies.filter((a: Anomaly) => a.documentId === docId);
  };

  if (!documents) {
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
          <h1 className="text-2xl font-bold text-slate-900">Dokumente</h1>
          <p className="text-slate-500 mt-1">
            Rechnungen und Lieferscheine verwalten
          </p>
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
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
      <Card
        className={`border-dashed border-2 transition-all duration-200 ${
          isDragging
            ? "border-amber-500 bg-amber-50 scale-[1.02] shadow-lg"
            : isUploading
            ? "border-amber-300 bg-amber-50"
            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardContent className="py-8">
          <div
            className={`flex flex-col items-center justify-center text-center cursor-pointer transition-transform duration-200 ${
              isDragging ? "scale-105" : ""
            }`}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <div className={`p-4 rounded-full mb-4 transition-all duration-200 ${
              isDragging
                ? "bg-amber-200 scale-110"
                : isUploading
                ? "bg-amber-100"
                : "bg-amber-100"
            }`}>
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
              ) : (
                <FileUp className={`h-8 w-8 text-amber-600 transition-transform duration-200 ${
                  isDragging ? "animate-bounce" : ""
                }`} />
              )}
            </div>
            <h3 className={`font-medium mb-1 transition-colors duration-200 ${
              isDragging ? "text-amber-700" : "text-slate-900"
            }`}>
              {isUploading
                ? "Dokument wird analysiert..."
                : isDragging
                ? "Dokument hier ablegen"
                : "Dokument hier ablegen oder klicken zum Hochladen"
              }
            </h3>
            <p className={`text-sm transition-colors duration-200 ${
              isDragging ? "text-amber-600" : "text-slate-500"
            }`}>
              {isUploading
                ? "Bitte warten..."
                : "PDF, JPG oder PNG"
              }
            </p>
            {isDragging && (
              <div className="mt-3 px-4 py-2 bg-amber-200 rounded-full">
                <span className="text-sm font-medium text-amber-800">
                  Loslassen zum Hochladen
                </span>
              </div>
            )}
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
          <TabsTrigger value="all">Alle ({documents.length})</TabsTrigger>
          <TabsTrigger value="invoices">
            Rechnungen ({documents.filter((d: DocumentWithItems) => d.type === "invoice").length})
          </TabsTrigger>
          <TabsTrigger value="delivery">
            Lieferscheine (
            {documents.filter((d: DocumentWithItems) => d.type === "delivery_note").length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Ausstehend (
            {documents.filter((d: DocumentWithItems) => d.status === "pending").length})
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
                {filteredDocuments.map((doc: DocumentWithItems) => {
                  const docAnomalies = getDocumentAnomalies(doc._id);
                  return (
                    <TableRow key={doc._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{doc.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{doc.supplierName}</TableCell>
                      <TableCell>{formatDate(doc.documentDate)}</TableCell>
                      <TableCell>
                        {doc.type === "invoice"
                          ? `€${doc.totalAmount.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`
                          : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell>
                        {docAnomalies.length > 0 ? (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {docAnomalies.length}
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
                            onClick={() => {
                              setSelectedDoc(doc);
                              setIsViewMode(true);
                              setEditingDoc(null);
                              setFileUrl(null);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(doc.status === "pending" ||
                            doc.status === "analyzed") && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleApprove(doc._id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleReject(doc._id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredDocuments.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-slate-500"
                    >
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
      <Dialog open={!!selectedDoc} onOpenChange={(open) => {
        if (!open) {
          setSelectedDoc(null);
          setIsViewMode(true);
          setEditingDoc(null);
          setFileUrl(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileIcon className="h-5 w-5 text-amber-600" />
                  {selectedDoc?.fileName}
                </DialogTitle>
                <DialogDescription>
                  {selectedDoc?.invoiceNumber && `Nr. ${selectedDoc.invoiceNumber} • `}
                  {selectedDoc?.supplierName} • {selectedDoc && formatDate(selectedDoc.documentDate)}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {selectedDoc?.fileId && fileUrl && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </>
                )}
                {isViewMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedDoc && startEditingDocument(selectedDoc)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Bearbeiten
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {selectedDoc && isViewMode && (
            <div className="space-y-4">
              {/* PDF Preview */}
              {selectedDoc.fileId && fileUrl && (
                <div className="border rounded-lg overflow-hidden bg-slate-100">
                  <iframe
                    src={fileUrl}
                    className="w-full h-[400px]"
                    title="PDF Preview"
                  />
                </div>
              )}

              {/* Status and Amount */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  {getStatusBadge(selectedDoc.status)}
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500">Lieferant</p>
                  <p className="font-medium">{selectedDoc.supplierName}</p>
                  {selectedDoc.supplierAddress && (
                    <p className="text-xs text-slate-500">{selectedDoc.supplierAddress}</p>
                  )}
                </div>
                {selectedDoc.type === "invoice" && (
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Gesamtbetrag</p>
                    <p className="text-2xl font-bold text-amber-600">
                      €{selectedDoc.totalAmount.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                    </p>
                    {selectedDoc.netAmount && selectedDoc.taxAmount && (
                      <p className="text-xs text-slate-500">
                        Netto €{selectedDoc.netAmount.toFixed(2)} + MwSt €{selectedDoc.taxAmount.toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Dates */}
              {selectedDoc.dueDate && (
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Rechnungsdatum:</span>{" "}
                    <span className="font-medium">{formatDate(selectedDoc.documentDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Fällig:</span>{" "}
                    <span className="font-medium">{formatDate(selectedDoc.dueDate)}</span>
                  </div>
                </div>
              )}

              {/* Anomalies */}
              {getDocumentAnomalies(selectedDoc._id).length > 0 && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                  <h4 className="font-medium text-red-800 flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Erkannte Auffälligkeiten
                  </h4>
                  {getDocumentAnomalies(selectedDoc._id).map((anomaly: Anomaly) => (
                    <div key={anomaly._id} className="text-sm text-red-700">
                      <p className="font-medium">{anomaly.title}</p>
                      <p className="text-red-600">{anomaly.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Items */}
              <div>
                <h4 className="font-medium text-slate-900 mb-2">Positionen</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
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
                          <TableCell className="text-right">
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            €{item.unitPrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            €{item.totalPrice.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Actions */}
              {(selectedDoc.status === "pending" || selectedDoc.status === "analyzed") && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleReject(selectedDoc._id);
                      setSelectedDoc(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Ablehnen
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      handleApprove(selectedDoc._id);
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

          {/* Edit Mode */}
          {selectedDoc && !isViewMode && editingDoc && (
            <div className="space-y-6">
              {/* PDF Preview in Edit Mode */}
              {selectedDoc.fileId && fileUrl && (
                <div className="border rounded-lg overflow-hidden bg-slate-100">
                  <iframe
                    src={fileUrl}
                    className="w-full h-[300px]"
                    title="PDF Preview"
                  />
                </div>
              )}

              {/* Document Type & Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dokumenttyp</Label>
                  <Select
                    value={editingDoc.type}
                    onValueChange={(v) => updateEditingField("type", v as "invoice" | "delivery_note")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Rechnung</SelectItem>
                      <SelectItem value="delivery_note">Lieferschein</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rechnungsnummer</Label>
                  <Input
                    value={editingDoc.invoiceNumber}
                    onChange={(e) => updateEditingField("invoiceNumber", e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* Supplier Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lieferant</Label>
                  <Input
                    value={editingDoc.supplierName}
                    onChange={(e) => updateEditingField("supplierName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input
                    value={editingDoc.supplierAddress}
                    onChange={(e) => updateEditingField("supplierAddress", e.target.value)}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rechnungsdatum</Label>
                  <Input
                    type="date"
                    value={editingDoc.documentDate}
                    onChange={(e) => updateEditingField("documentDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fälligkeitsdatum</Label>
                  <Input
                    type="date"
                    value={editingDoc.dueDate}
                    onChange={(e) => updateEditingField("dueDate", e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-900">Positionen</h4>
                  <Button variant="outline" size="sm" onClick={addEditingItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Position hinzufügen
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-[40%]">Artikel</TableHead>
                        <TableHead className="w-[15%]">Menge</TableHead>
                        <TableHead className="w-[12%]">Einheit</TableHead>
                        <TableHead className="w-[15%]">Einzelpreis</TableHead>
                        <TableHead className="w-[13%] text-right">Gesamt</TableHead>
                        <TableHead className="w-[5%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editingDoc.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="p-2">
                            <Input
                              value={item.name}
                              onChange={(e) => updateEditingItem(index, "name", e.target.value)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateEditingItem(index, "quantity", parseFloat(e.target.value) || 0)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              value={item.unit}
                              onChange={(e) => updateEditingItem(index, "unit", e.target.value)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateEditingItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="p-2 text-right font-medium">
                            €{item.totalPrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="p-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => removeEditingItem(index)}
                              disabled={editingDoc.items.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>MwSt-Satz (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editingDoc.taxRate}
                      onChange={(e) => {
                        const newTaxRate = parseFloat(e.target.value) || 0;
                        const taxAmount = editingDoc.netAmount * (newTaxRate / 100);
                        const totalAmount = editingDoc.netAmount + taxAmount;
                        setEditingDoc({
                          ...editingDoc,
                          taxRate: newTaxRate,
                          taxAmount: Math.round(taxAmount * 100) / 100,
                          totalAmount: Math.round(totalAmount * 100) / 100,
                        });
                      }}
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="text-sm text-slate-500">Netto</div>
                    <div className="text-lg font-medium">€{editingDoc.netAmount.toFixed(2)}</div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="text-sm text-slate-500">MwSt ({editingDoc.taxRate}%)</div>
                    <div className="text-lg font-medium">€{editingDoc.taxAmount.toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-lg font-medium text-slate-900">Gesamtbetrag</span>
                  <span className="text-2xl font-bold text-amber-600">€{editingDoc.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewMode(true);
                    setEditingDoc(null);
                  }}
                  disabled={isSaving}
                >
                  Abbrechen
                </Button>
                <Button
                  className="bg-amber-500 hover:bg-amber-600"
                  onClick={handleSaveEditedDocument}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Wird gespeichert...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Änderungen speichern
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verify Extracted Data Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={(open) => {
        if (!open && !isSaving) {
          setIsVerifyDialogOpen(false);
          setExtractedData(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-amber-600" />
              Dokument überprüfen
            </DialogTitle>
            <DialogDescription>
              Bitte überprüfen Sie die extrahierten Daten und korrigieren Sie diese bei Bedarf.
            </DialogDescription>
          </DialogHeader>

          {extractedData && (
            <div className="space-y-6">
              {/* Document Type & Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="docType">Dokumenttyp</Label>
                  <Select
                    value={extractedData.type}
                    onValueChange={(v) => updateExtractedField("type", v as "invoice" | "delivery_note")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Rechnung</SelectItem>
                      <SelectItem value="delivery_note">Lieferschein</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Rechnungsnummer</Label>
                  <Input
                    id="invoiceNumber"
                    value={extractedData.invoiceNumber}
                    onChange={(e) => updateExtractedField("invoiceNumber", e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* Supplier Info */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Lieferant</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplierName">Name</Label>
                    <Input
                      id="supplierName"
                      value={extractedData.supplierName}
                      onChange={(e) => updateExtractedField("supplierName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplierAddress">Adresse</Label>
                    <Input
                      id="supplierAddress"
                      value={extractedData.supplierAddress}
                      onChange={(e) => updateExtractedField("supplierAddress", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dates */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Datum</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documentDate">Rechnungsdatum</Label>
                    <Input
                      id="documentDate"
                      type="date"
                      value={extractedData.documentDate}
                      onChange={(e) => updateExtractedField("documentDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={extractedData.dueDate}
                      onChange={(e) => updateExtractedField("dueDate", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-900">Positionen</h4>
                  <Button variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Position hinzufügen
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-[40%]">Artikel</TableHead>
                        <TableHead className="w-[15%]">Menge</TableHead>
                        <TableHead className="w-[12%]">Einheit</TableHead>
                        <TableHead className="w-[15%]">Einzelpreis</TableHead>
                        <TableHead className="w-[13%] text-right">Gesamt</TableHead>
                        <TableHead className="w-[5%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="p-2">
                            <Input
                              value={item.name}
                              onChange={(e) => updateExtractedItem(index, "name", e.target.value)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateExtractedItem(index, "quantity", parseFloat(e.target.value) || 0)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              value={item.unit}
                              onChange={(e) => updateExtractedItem(index, "unit", e.target.value)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateExtractedItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="p-2 text-right font-medium">
                            €{item.totalPrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="p-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => removeItem(index)}
                              disabled={extractedData.items.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">MwSt-Satz (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.1"
                      value={extractedData.taxRate}
                      onChange={(e) => {
                        const newTaxRate = parseFloat(e.target.value) || 0;
                        const taxAmount = extractedData.netAmount * (newTaxRate / 100);
                        const totalAmount = extractedData.netAmount + taxAmount;
                        setExtractedData({
                          ...extractedData,
                          taxRate: newTaxRate,
                          taxAmount: Math.round(taxAmount * 100) / 100,
                          totalAmount: Math.round(totalAmount * 100) / 100,
                        });
                      }}
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="text-sm text-slate-500">Netto</div>
                    <div className="text-lg font-medium">€{extractedData.netAmount.toFixed(2)}</div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="text-sm text-slate-500">MwSt ({extractedData.taxRate}%)</div>
                    <div className="text-lg font-medium">€{extractedData.taxAmount.toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-lg font-medium text-slate-900">Gesamtbetrag</span>
                  <span className="text-2xl font-bold text-amber-600">€{extractedData.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsVerifyDialogOpen(false);
                    setExtractedData(null);
                  }}
                  disabled={isSaving}
                >
                  Abbrechen
                </Button>
                <Button
                  className="bg-amber-500 hover:bg-amber-600"
                  onClick={handleSaveDocument}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Wird gespeichert...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Dokument speichern
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
