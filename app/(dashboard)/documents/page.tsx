"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  FileText,
  Search,
  X,
  Eye,
  AlertTriangle,
  Check,
  Loader2,
  Plus,
  Trash2,
  Edit,
  Download,
  FileIcon,
  Upload,
  FileSpreadsheet,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  Camera,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Id } from "@/convex/_generated/dataModel";
import { downloadCsvTemplate, parseCsvFile, CsvItem } from "@/lib/csv-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams } from "next/navigation";
import { FAB, SwipeableCard, EmptyDocumentsState } from "@/components/mobile/primitives";
import { triggerHaptic } from "@/components/layout/mobile-nav";

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

type DepositItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type FeeItem = {
  name: string;
  amount: number;
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
  depositItems: DepositItem[];
  fees: FeeItem[];
  itemsTotal: number;
  depositTotal: number;
  feesTotal: number;
};

export default function DocumentsPage() {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const documents = useQuery(api.documents.listWithItems) ?? [];
  const anomalies = useQuery(api.anomalies.list) ?? [];
  const updateStatus = useMutation(api.documents.updateStatus);
  const createDocument = useMutation(api.documents.create);
  const updateDocument = useMutation(api.documents.update);
  const deleteDocument = useMutation(api.documents.remove);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const analyzeDocument = useAction(api.documentAnalysis.analyzeDocument);
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState<DocumentWithItems | null>(null);
  const [isViewMode, setIsViewMode] = useState(true);
  const [editingDoc, setEditingDoc] = useState<ExtractedInvoiceData | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDocData, setNewDocData] = useState<ExtractedInvoiceData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<Id<"_storage"> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DocumentWithItems | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle URL action parameter (for FAB navigation)
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "upload" && isMobile && cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  }, [searchParams, isMobile]);

  // Swipe handlers for mobile
  const handleSwipeDelete = useCallback((doc: DocumentWithItems) => {
    triggerHaptic("medium");
    setDeleteConfirm(doc);
  }, []);

  const handleSwipeApprove = useCallback(async (doc: DocumentWithItems) => {
    triggerHaptic("light");
    if (doc.status === "analyzed" || doc.status === "pending") {
      await updateStatus({ id: doc._id, status: "approved" });
      toast({
        title: "Dokument genehmigt",
        description: `${doc.fileName} wurde genehmigt.`,
      });
    }
  }, [updateStatus, toast]);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDocument({ id: deleteConfirm._id });
      toast({
        title: "Dokument gelöscht",
        description: `${deleteConfirm.fileName} wurde entfernt.`,
      });
    } catch {
      toast({
        title: "Fehler",
        description: "Dokument konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteDocument, toast]);

  // Handle camera capture
  const handleCameraCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reuse the same logic as PDF select
    setIsAnalyzing(true);
    setSelectedFile(file);

    try {
      // Upload the image
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) throw new Error("Upload fehlgeschlagen");

      const { storageId } = await response.json();
      setUploadedFileId(storageId);

      // Analyze with AI
      const result = await analyzeDocument({ fileId: storageId });

      if (result.success && result.data && result.data.items.length > 0) {
        const data = result.data;
        const items = data.items.map((item: { name: string; quantity: number; unit: string; unitPrice: number; totalPrice: number }) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        }));

        const depositItems = data.depositItems?.map((item: { name: string; quantity: number; unitPrice: number; totalPrice: number }) => ({
          name: item.name,
          quantity: item.quantity,
          unit: "Stk",
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })) || [];

        const fees = data.fees?.map((fee: { name: string; amount: number }) => ({
          name: fee.name,
          amount: fee.amount,
        })) || [];

        const itemsTotal = items.reduce((sum: number, item: { totalPrice: number }) => sum + item.totalPrice, 0);
        const depositTotal = depositItems.reduce((sum: number, item: { totalPrice: number }) => sum + item.totalPrice, 0);
        const feesTotal = fees.reduce((sum: number, fee: { amount: number }) => sum + fee.amount, 0);
        const netAmount = itemsTotal + depositTotal + feesTotal;

        setNewDocData(prev => prev ? {
          ...prev,
          supplierName: data.supplierName || prev.supplierName,
          supplierAddress: data.supplierAddress || prev.supplierAddress,
          invoiceNumber: data.invoiceNumber || prev.invoiceNumber,
          documentDate: data.documentDate || prev.documentDate,
          dueDate: data.dueDate || prev.dueDate,
          items,
          depositItems,
          fees,
          itemsTotal: Math.round(itemsTotal * 100) / 100,
          depositTotal: Math.round(depositTotal * 100) / 100,
          feesTotal: Math.round(feesTotal * 100) / 100,
          netAmount: Math.round(netAmount * 100) / 100,
          taxRate: data.taxRate || 19,
          taxAmount: Math.round(netAmount * (data.taxRate || 19) / 100 * 100) / 100,
          totalAmount: data.totalAmount || Math.round((netAmount + netAmount * (data.taxRate || 19) / 100) * 100) / 100,
        } : prev);

        toast({
          title: "Foto analysiert",
          description: `${items.length} Positionen erkannt`,
        });
      }
    } catch (error) {
      console.error("Camera capture error:", error);
      toast({
        title: "Fehler bei der Analyse",
        description: "Das Foto konnte nicht analysiert werden.",
        variant: "destructive",
      });
      setSelectedFile(null);
      setUploadedFileId(null);
    } finally {
      setIsAnalyzing(false);
      // Reset input
      if (cameraInputRef.current) {
        cameraInputRef.current.value = "";
      }
    }
  }, [generateUploadUrl, analyzeDocument, toast]);

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

  // Initialize new document form
  const openCreateDialog = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    setNewDocData({
      fileName: "",
      type: "invoice",
      invoiceNumber: "",
      supplierName: "",
      supplierAddress: "",
      documentDate: today,
      dueDate: "",
      netAmount: 0,
      taxRate: 19,
      taxAmount: 0,
      totalAmount: 0,
      items: [{ name: "", quantity: 0, unit: "kg", unitPrice: 0, totalPrice: 0 }],
      depositItems: [],
      fees: [],
      itemsTotal: 0,
      depositTotal: 0,
      feesTotal: 0,
    });
    setSelectedFile(null);
    setUploadedFileId(null);
    setIsAnalyzing(false);
    setIsCreateDialogOpen(true);
  }, []);

  // Handle CSV import
  const handleCsvImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !newDocData) return;

    try {
      const items = await parseCsvFile(file, newDocData.type);

      // Convert CsvItem to ExtractedItem
      const extractedItems: ExtractedItem[] = items.map((item: CsvItem) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      }));

      // Recalculate totals
      const netAmount = extractedItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const taxAmount = netAmount * (newDocData.taxRate / 100);
      const totalAmount = netAmount + taxAmount;

      setNewDocData({
        ...newDocData,
        items: extractedItems,
        netAmount: Math.round(netAmount * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
      });

      toast({
        title: "CSV importiert",
        description: `${extractedItems.length} Positionen wurden importiert.`,
      });
    } catch (error) {
      toast({
        title: "Fehler beim Import",
        description: error instanceof Error ? error.message : "CSV konnte nicht gelesen werden.",
        variant: "destructive",
      });
    }

    // Reset input
    if (csvInputRef.current) {
      csvInputRef.current.value = "";
    }
  }, [newDocData, toast]);

  // Handle PDF file selection and auto-analyze
  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setIsAnalyzing(true);

    try {
      // 1. Upload the file to Convex storage
      const uploadUrl = await generateUploadUrl();
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Datei konnte nicht hochgeladen werden.");
      }

      const { storageId } = await uploadResponse.json();
      setUploadedFileId(storageId);

      // 2. Call the AI analysis action
      const result = await analyzeDocument({ fileId: storageId });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Analyse fehlgeschlagen.");
      }

      // 3. Fill the form with extracted data
      const data = result.data;
      setNewDocData({
        fileName: file.name,
        type: data.type,
        invoiceNumber: data.invoiceNumber,
        supplierName: data.supplierName,
        supplierAddress: data.supplierAddress,
        documentDate: data.documentDate,
        dueDate: data.dueDate || "",
        netAmount: data.netAmount,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        items: data.items.length > 0 ? data.items : [{ name: "", quantity: 0, unit: "kg", unitPrice: 0, totalPrice: 0 }],
        depositItems: data.depositItems || [],
        fees: data.fees || [],
        itemsTotal: data.itemsTotal || 0,
        depositTotal: data.depositTotal || 0,
        feesTotal: data.feesTotal || 0,
      });

      const depositInfo = data.depositItems?.length ? `, ${data.depositItems.length} Pfandpositionen` : "";
      const feesInfo = data.fees?.length ? `, ${data.fees.length} Gebühren/Rabatte` : "";
      toast({
        title: "Dokument analysiert",
        description: `${data.items.length} Artikel${depositInfo}${feesInfo} erkannt.`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Fehler bei der Analyse",
        description: error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [generateUploadUrl, analyzeDocument, toast]);

  // Handle file input change
  const handlePdfSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "application/pdf" || file.type.startsWith("image/"))) {
      handleFileSelect(file);
    } else {
      toast({
        title: "Ungültiges Dateiformat",
        description: "Bitte laden Sie eine PDF-Datei oder ein Bild hoch.",
        variant: "destructive",
      });
    }
  }, [handleFileSelect, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Handle PDF analysis with AI
  const handlePdfAnalysis = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: "Keine Datei ausgewählt",
        description: "Bitte wählen Sie zuerst eine PDF-Datei aus.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // 1. Upload the file to Convex storage
      console.log("Starting upload...");
      const uploadUrl = await generateUploadUrl();
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("Datei konnte nicht hochgeladen werden.");
      }

      const { storageId } = await uploadResponse.json();
      console.log("Upload complete, storageId:", storageId);
      setUploadedFileId(storageId);

      // 2. Call the AI analysis action
      console.log("Starting AI analysis...");
      const result = await analyzeDocument({ fileId: storageId });
      console.log("AI result:", result);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Analyse fehlgeschlagen.");
      }

      // 3. Fill the form with extracted data
      const data = result.data;
      setNewDocData({
        fileName: selectedFile.name,
        type: data.type,
        invoiceNumber: data.invoiceNumber,
        supplierName: data.supplierName,
        supplierAddress: data.supplierAddress,
        documentDate: data.documentDate,
        dueDate: data.dueDate || "",
        netAmount: data.netAmount,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        items: data.items.length > 0 ? data.items : [{ name: "", quantity: 0, unit: "kg", unitPrice: 0, totalPrice: 0 }],
        depositItems: data.depositItems || [],
        fees: data.fees || [],
        itemsTotal: data.itemsTotal || 0,
        depositTotal: data.depositTotal || 0,
        feesTotal: data.feesTotal || 0,
      });

      const depositInfo = data.depositItems?.length ? `, ${data.depositItems.length} Pfandpositionen` : "";
      const feesInfo = data.fees?.length ? `, ${data.fees.length} Gebühren/Rabatte` : "";
      toast({
        title: "Dokument analysiert",
        description: `${data.items.length} Artikel${depositInfo}${feesInfo} erkannt.`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Fehler bei der Analyse",
        description: error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile, generateUploadUrl, analyzeDocument, toast]);

  // Update new document field
  const updateNewDocField = useCallback((field: keyof ExtractedInvoiceData, value: string | number) => {
    if (!newDocData) return;

    // Handle type change - reset items if switching to/from delivery note
    if (field === "type") {
      const newType = value as "invoice" | "delivery_note";
      if (newType === "delivery_note") {
        // Clear prices for delivery note
        const updatedItems = newDocData.items.map(item => ({
          ...item,
          unitPrice: 0,
          totalPrice: 0,
        }));
        setNewDocData({
          ...newDocData,
          type: newType,
          items: updatedItems,
          netAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          totalAmount: 0,
        });
        return;
      } else if (newDocData.type === "delivery_note" && newType === "invoice") {
        // Switching to invoice, set default tax rate
        setNewDocData({
          ...newDocData,
          type: newType,
          taxRate: 7,
        });
        return;
      }
    }

    setNewDocData({ ...newDocData, [field]: value });
  }, [newDocData]);

  // Update new document item
  const updateNewDocItem = useCallback((index: number, field: keyof ExtractedItem, value: string | number) => {
    if (!newDocData) return;
    const newItems = [...newDocData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "quantity" || field === "unitPrice") {
      newItems[index].totalPrice = Math.round(Number(newItems[index].quantity) * Number(newItems[index].unitPrice) * 100) / 100;
    }

    const netAmount = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = newDocData.type === "invoice" ? netAmount * (newDocData.taxRate / 100) : 0;
    const totalAmount = netAmount + taxAmount;

    setNewDocData({
      ...newDocData,
      items: newItems,
      netAmount: Math.round(netAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    });
  }, [newDocData]);

  // Add item to new document
  const addNewDocItem = useCallback(() => {
    if (!newDocData) return;
    setNewDocData({
      ...newDocData,
      items: [
        ...newDocData.items,
        { name: "", quantity: 0, unit: "kg", unitPrice: 0, totalPrice: 0 },
      ],
    });
  }, [newDocData]);

  // Remove item from new document
  const removeNewDocItem = useCallback((index: number) => {
    if (!newDocData || newDocData.items.length <= 1) return;
    const newItems = newDocData.items.filter((_, i) => i !== index);

    const netAmount = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = newDocData.type === "invoice" ? netAmount * (newDocData.taxRate / 100) : 0;
    const totalAmount = netAmount + taxAmount;

    setNewDocData({
      ...newDocData,
      items: newItems,
      netAmount: Math.round(netAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    });
  }, [newDocData]);

  // Save new document
  const handleSaveNewDocument = useCallback(async () => {
    if (!newDocData || !user) return;

    // Validation
    if (!newDocData.supplierName.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Lieferanten an.",
        variant: "destructive",
      });
      return;
    }

    if (newDocData.items.length === 0 || !newDocData.items.some(item => item.name.trim())) {
      toast({
        title: "Fehler",
        description: "Bitte fügen Sie mindestens eine Position hinzu.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const documentDate = new Date(newDocData.documentDate).getTime();
      const dueDate = newDocData.dueDate ? new Date(newDocData.dueDate).getTime() : undefined;

      // Generate filename - use original filename if from PDF, otherwise generate
      const typeLabel = newDocData.type === "invoice" ? "Rechnung" : "Lieferschein";
      const dateStr = new Date(newDocData.documentDate).toLocaleDateString("de-DE").replace(/\./g, "-");
      const fileName = newDocData.fileName && newDocData.fileName.endsWith(".pdf")
        ? newDocData.fileName
        : newDocData.invoiceNumber
          ? `${typeLabel}_${newDocData.invoiceNumber}_${newDocData.supplierName}.csv`
          : `${typeLabel}_${dateStr}_${newDocData.supplierName}.csv`;

      // Filter out empty items
      const validItems = newDocData.items.filter(item => item.name.trim());

      await createDocument({
        type: newDocData.type,
        fileName,
        fileId: uploadedFileId || undefined,
        invoiceNumber: newDocData.invoiceNumber || undefined,
        supplierName: newDocData.supplierName,
        supplierAddress: newDocData.supplierAddress || undefined,
        documentDate,
        dueDate,
        netAmount: newDocData.netAmount,
        taxAmount: newDocData.taxAmount,
        taxRate: newDocData.taxRate,
        totalAmount: newDocData.totalAmount,
        uploadedBy: user._id,
        items: validItems,
      });

      toast({
        title: "Dokument erstellt",
        description: `${typeLabel} wurde erfolgreich gespeichert.`,
      });

      setIsCreateDialogOpen(false);
      setNewDocData(null);
      setSelectedFile(null);
      setUploadedFileId(null);
    } catch {
      toast({
        title: "Fehler beim Speichern",
        description: "Das Dokument konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [newDocData, user, createDocument, toast, uploadedFileId]);

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
      taxRate: doc.taxRate || 19,
      taxAmount: doc.taxAmount || 0,
      totalAmount: doc.totalAmount,
      items: doc.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      depositItems: [],
      fees: [],
      itemsTotal: doc.netAmount || 0,
      depositTotal: 0,
      feesTotal: 0,
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
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Dokumente</h1>
          <p className="text-slate-500 text-sm md:text-base mt-0.5 md:mt-1">
            {documents.length} Dokumente
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-amber-500 hover:bg-amber-600 h-10 px-3 md:px-4"
        >
          <Plus className="h-5 w-5 md:mr-2" />
          <span className="hidden md:inline">Neues Dokument</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Suche nach Dateiname oder Lieferant..."
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

      {/* Tabs - Scrollable on mobile */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="-mx-4 md:mx-0">
          <div className="overflow-x-auto px-4 md:px-0 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <TabsList className="inline-flex w-auto min-w-full md:w-auto">
              <TabsTrigger value="all" className="text-xs md:text-sm px-3 md:px-4">
                Alle ({documents.length})
              </TabsTrigger>
              <TabsTrigger value="invoices" className="text-xs md:text-sm px-3 md:px-4">
                Rechnungen ({documents.filter((d: DocumentWithItems) => d.type === "invoice").length})
              </TabsTrigger>
              <TabsTrigger value="delivery" className="text-xs md:text-sm px-3 md:px-4 whitespace-nowrap">
                Lieferscheine ({documents.filter((d: DocumentWithItems) => d.type === "delivery_note").length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs md:text-sm px-3 md:px-4">
                Offen ({documents.filter((d: DocumentWithItems) => d.status === "pending").length})
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          {/* Mobile Card View with Swipeable Cards */}
          <div className="md:hidden space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredDocuments.map((doc: DocumentWithItems, index: number) => {
                const docAnomalies = getDocumentAnomalies(doc._id);
                const canApprove = doc.status === "pending" || doc.status === "analyzed";
                return (
                  <motion.div
                    key={doc._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
                    layout
                  >
                    <SwipeableCard
                      onSwipeLeft={() => handleSwipeDelete(doc)}
                      onSwipeRight={canApprove ? () => handleSwipeApprove(doc) : undefined}
                      leftAction={{
                        icon: Trash2,
                        label: "Löschen",
                        color: "text-white",
                        bgColor: "bg-red-500",
                      }}
                      rightAction={canApprove ? {
                        icon: Check,
                        label: "Genehmigen",
                        color: "text-white",
                        bgColor: "bg-emerald-500",
                      } : undefined}
                    >
                      <Card
                        className="overflow-hidden active:bg-slate-50 transition-colors border-0 shadow-none"
                        onClick={() => {
                          setSelectedDoc(doc);
                          setIsViewMode(true);
                          setEditingDoc(null);
                          setFileUrl(null);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(doc.status)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900 truncate text-sm">
                                  {doc.fileName}
                                </h3>
                                {docAnomalies.length > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="bg-red-50 text-red-700 border-red-200 text-[10px] px-1.5 py-0"
                                  >
                                    <AlertTriangle className="h-3 w-3 mr-0.5" />
                                    {docAnomalies.length}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mb-2">
                                {doc.supplierName} • {formatDate(doc.documentDate)}
                              </p>
                              <div className="flex items-center justify-between">
                                {doc.type === "invoice" ? (
                                  <span className="font-semibold text-slate-900">
                                    €{doc.totalAmount.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-sm">Lieferschein</span>
                                )}
                                {getStatusBadge(doc.status)}
                              </div>
                            </div>
                          </div>
                          {/* Quick Actions - shown on tap for non-swipe users */}
                          {canApprove && (
                            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(doc._id);
                                }}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                OK
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReject(doc._id);
                                }}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Ablehnen
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </SwipeableCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filteredDocuments.length === 0 && (
              searchQuery ? (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p>Keine Dokumente gefunden</p>
                </div>
              ) : (
                <EmptyDocumentsState onUpload={() => cameraInputRef.current?.click()} />
              )
            )}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dokument</TableHead>
                  <TableHead className="hidden md:table-cell">Lieferant</TableHead>
                  <TableHead className="hidden md:table-cell">Datum</TableHead>
                  <TableHead>Betrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Auffälligkeiten</TableHead>
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
                          <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="font-medium truncate max-w-[150px] md:max-w-none">{doc.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{doc.supplierName}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(doc.documentDate)}</TableCell>
                      <TableCell>
                        {doc.type === "invoice"
                          ? `€${doc.totalAmount.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`
                          : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell className="hidden md:table-cell">
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
                            className="h-11 w-11 md:h-8 md:w-8 touch-manipulation"
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
                                className="h-11 w-11 md:h-8 md:w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 touch-manipulation"
                                onClick={() => handleApprove(doc._id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-11 w-11 md:h-8 md:w-8 text-red-600 hover:text-red-700 hover:bg-red-50 touch-manipulation"
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

      {/* Create New Document Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        if (!open && !isSaving) {
          setIsCreateDialogOpen(false);
          setNewDocData(null);
          setSelectedFile(null);
          setUploadedFileId(null);
        }
      }}>
        <DialogContent className="max-w-4xl w-[calc(100vw-2rem)] md:w-full max-h-[90vh] md:max-h-[90vh] h-[90vh] md:h-auto overflow-hidden flex flex-col p-0 md:p-6 gap-0">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => {
                if (!isSaving) {
                  setIsCreateDialogOpen(false);
                  setNewDocData(null);
                  setSelectedFile(null);
                  setUploadedFileId(null);
                }
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h2 className="font-semibold text-lg">Neues Dokument</h2>
            <div className="w-10" />
          </div>

          {/* Desktop Header */}
          <DialogHeader className="hidden md:block p-0 md:pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-amber-600" />
              Neues Dokument erfassen
            </DialogTitle>
            <DialogDescription>
              Erfassen Sie eine neue Rechnung oder einen Lieferschein.
            </DialogDescription>
          </DialogHeader>

          {/* Hidden camera input */}
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleCameraCapture}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {newDocData && (
            <div className="flex-1 overflow-y-auto p-4 md:p-0 space-y-4 md:space-y-6">
              {/* Quick Capture Buttons for Mobile */}
              <div className="md:hidden grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isAnalyzing}
                >
                  <Camera className="h-6 w-6 text-amber-600" />
                  <span className="text-sm">Foto aufnehmen</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => pdfInputRef.current?.click()}
                  disabled={isAnalyzing}
                >
                  <Upload className="h-6 w-6 text-blue-600" />
                  <span className="text-sm">Datei wählen</span>
                </Button>
              </div>

              {/* Analysis Status */}
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3"
                >
                  <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />
                  <div>
                    <p className="font-medium text-amber-900">KI analysiert...</p>
                    <p className="text-sm text-amber-700">Positionen werden extrahiert</p>
                  </div>
                </motion.div>
              )}

              {/* Success Status */}
              {selectedFile && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Check className="h-6 w-6 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-900 truncate max-w-[200px]">{selectedFile.name}</p>
                      <p className="text-sm text-emerald-700">Erfolgreich analysiert</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setUploadedFileId(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {/* Document Type & Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Dokumenttyp</Label>
                  <Select
                    value={newDocData.type}
                    onValueChange={(v) => updateNewDocField("type", v as "invoice" | "delivery_note")}
                  >
                    <SelectTrigger className="h-11 md:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Rechnung</SelectItem>
                      <SelectItem value="delivery_note">Lieferschein</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">{newDocData.type === "invoice" ? "Rechnungsnummer" : "Lieferscheinnummer"}</Label>
                  <Input
                    value={newDocData.invoiceNumber}
                    onChange={(e) => updateNewDocField("invoiceNumber", e.target.value)}
                    placeholder={newDocData.type === "invoice" ? "z.B. 2024-1234" : "z.B. LS-2024-5678"}
                    className="h-11 md:h-10"
                  />
                </div>
              </div>

              <Separator className="hidden md:block" />

              {/* Supplier Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Lieferant *</Label>
                  <Input
                    value={newDocData.supplierName}
                    onChange={(e) => updateNewDocField("supplierName", e.target.value)}
                    placeholder="z.B. Frischehof Müller GmbH"
                    className="h-11 md:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Adresse</Label>
                  <Input
                    value={newDocData.supplierAddress}
                    onChange={(e) => updateNewDocField("supplierAddress", e.target.value)}
                    placeholder="z.B. Ackerstraße 12, 20457 Hamburg"
                    className="h-11 md:h-10"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">{newDocData.type === "invoice" ? "Rechnungsdatum" : "Lieferdatum"}</Label>
                  <Input
                    type="date"
                    value={newDocData.documentDate}
                    onChange={(e) => updateNewDocField("documentDate", e.target.value)}
                    className="h-11 md:h-10"
                  />
                </div>
                {newDocData.type === "invoice" && (
                  <div className="space-y-2">
                    <Label className="text-sm">Fälligkeitsdatum</Label>
                    <Input
                      type="date"
                      value={newDocData.dueDate}
                      onChange={(e) => updateNewDocField("dueDate", e.target.value)}
                      className="h-11 md:h-10"
                    />
                  </div>
                )}
              </div>

              <Separator className="hidden md:block" />

              {/* Drag & Drop Upload Zone - Desktop only */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`hidden md:block relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  isAnalyzing
                    ? "border-amber-400 bg-amber-50"
                    : selectedFile
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-slate-300 hover:border-amber-400 hover:bg-amber-50/50"
                }`}
              >
                <input
                  type="file"
                  ref={pdfInputRef}
                  onChange={handlePdfSelect}
                  accept=".pdf,image/*"
                  className="hidden"
                />

                {isAnalyzing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 text-amber-600 animate-spin" />
                    <div>
                      <p className="font-medium text-slate-900">KI analysiert Dokument...</p>
                      <p className="text-sm text-slate-500 mt-1">Positionen, Pfand und Gebühren werden extrahiert</p>
                    </div>
                  </div>
                ) : selectedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{selectedFile.name}</p>
                      <p className="text-sm text-slate-500 mt-1">Dokument analysiert</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => pdfInputRef.current?.click()}
                    >
                      Andere Datei wählen
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center gap-3 cursor-pointer"
                    onClick={() => pdfInputRef.current?.click()}
                  >
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">PDF oder Bild hierher ziehen</p>
                      <p className="text-sm text-slate-500 mt-1">oder klicken zum Auswählen - wird automatisch mit KI analysiert</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-900">Positionen ({newDocData.items.length})</h4>
                  <Button variant="outline" size="sm" onClick={addNewDocItem} className="h-9">
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Zeile</span> hinzufügen
                  </Button>
                </div>

                {/* Mobile Card View for Items */}
                <div className="md:hidden space-y-3">
                  {newDocData.items.map((item, index) => (
                    <Card key={index} className="p-3">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <Input
                            value={item.name}
                            onChange={(e) => updateNewDocItem(index, "name", e.target.value)}
                            placeholder="Artikelname"
                            className="h-10 flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                            onClick={() => removeNewDocItem(index)}
                            disabled={newDocData.items.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs text-slate-500">Menge</Label>
                            <Input
                              type="number"
                              value={item.quantity || ""}
                              onChange={(e) => updateNewDocItem(index, "quantity", parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="h-10 mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Einheit</Label>
                            <Select
                              value={item.unit}
                              onValueChange={(v) => updateNewDocItem(index, "unit", v)}
                            >
                              <SelectTrigger className="h-10 mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="g">g</SelectItem>
                                <SelectItem value="L">L</SelectItem>
                                <SelectItem value="ml">ml</SelectItem>
                                <SelectItem value="Stk">Stk</SelectItem>
                                <SelectItem value="Pkg">Pkg</SelectItem>
                                <SelectItem value="Kiste">Kiste</SelectItem>
                                <SelectItem value="Bund">Bund</SelectItem>
                                <SelectItem value="Fl">Fl</SelectItem>
                                <SelectItem value="Dose">Dose</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {newDocData.type === "invoice" && (
                            <div>
                              <Label className="text-xs text-slate-500">Preis</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unitPrice || ""}
                                onChange={(e) => updateNewDocItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                placeholder="0,00"
                                className="h-10 mt-1"
                              />
                            </div>
                          )}
                        </div>
                        {newDocData.type === "invoice" && (
                          <div className="text-right text-sm font-medium text-slate-900">
                            Gesamt: €{item.totalPrice.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View for Items */}
                <div className="hidden md:block border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className={newDocData.type === "invoice" ? "w-[35%]" : "w-[50%]"}>Artikel</TableHead>
                        <TableHead className="w-[15%]">Menge</TableHead>
                        <TableHead className="w-[12%]">Einheit</TableHead>
                        {newDocData.type === "invoice" && (
                          <>
                            <TableHead className="w-[15%]">Einzelpreis</TableHead>
                            <TableHead className="w-[13%] text-right">Gesamt</TableHead>
                          </>
                        )}
                        <TableHead className="w-[5%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newDocData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="p-2">
                            <Input
                              value={item.name}
                              onChange={(e) => updateNewDocItem(index, "name", e.target.value)}
                              placeholder="Artikelname"
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              value={item.quantity || ""}
                              onChange={(e) => updateNewDocItem(index, "quantity", parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Select
                              value={item.unit}
                              onValueChange={(v) => updateNewDocItem(index, "unit", v)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="g">g</SelectItem>
                                <SelectItem value="L">L</SelectItem>
                                <SelectItem value="ml">ml</SelectItem>
                                <SelectItem value="Stk">Stk</SelectItem>
                                <SelectItem value="Pkg">Pkg</SelectItem>
                                <SelectItem value="Kiste">Kiste</SelectItem>
                                <SelectItem value="Bund">Bund</SelectItem>
                                <SelectItem value="Fl">Fl</SelectItem>
                                <SelectItem value="Dose">Dose</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          {newDocData.type === "invoice" && (
                            <>
                              <TableCell className="p-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.unitPrice || ""}
                                  onChange={(e) => updateNewDocItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                  placeholder="0,00"
                                  className="h-8"
                                />
                              </TableCell>
                              <TableCell className="p-2 text-right font-medium">
                                €{item.totalPrice.toFixed(2)}
                              </TableCell>
                            </>
                          )}
                          <TableCell className="p-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => removeNewDocItem(index)}
                              disabled={newDocData.items.length <= 1}
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

              {/* Deposit Items - Pfand / Leergut */}
              {newDocData.depositItems && newDocData.depositItems.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">
                    {newDocData.type === "invoice" ? "Pfand / Leergut" : "Leergut (Rückgabe)"}
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-orange-50">
                          <TableHead className={newDocData.type === "invoice" ? "w-[50%]" : "w-[70%]"}>Artikel</TableHead>
                          <TableHead className={newDocData.type === "invoice" ? "w-[15%]" : "w-[30%]"}>
                            {newDocData.type === "invoice" ? "Differenz" : "Anzahl"}
                          </TableHead>
                          {newDocData.type === "invoice" && (
                            <>
                              <TableHead className="w-[15%]">Pfandwert</TableHead>
                              <TableHead className="w-[20%] text-right">Gesamt</TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newDocData.depositItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            {newDocData.type === "invoice" && (
                              <>
                                <TableCell>€{item.unitPrice.toFixed(2)}</TableCell>
                                <TableCell className={`text-right font-medium ${item.totalPrice < 0 ? "text-red-600" : "text-emerald-600"}`}>
                                  {item.totalPrice >= 0 ? "+" : ""}€{item.totalPrice.toFixed(2)}
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {newDocData.type === "invoice" && (
                    <div className="mt-2 text-right">
                      <span className="text-sm text-slate-500">Pfand gesamt: </span>
                      <span className={`font-medium ${newDocData.depositTotal < 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {newDocData.depositTotal >= 0 ? "+" : ""}€{newDocData.depositTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Fees - Gebühren & Rabatte - only for invoices */}
              {newDocData.type === "invoice" && newDocData.fees && newDocData.fees.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Gebühren & Rabatte</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-blue-50">
                          <TableHead className="w-[70%]">Beschreibung</TableHead>
                          <TableHead className="w-[30%] text-right">Betrag</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newDocData.fees.map((fee, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{fee.name}</TableCell>
                            <TableCell className={`text-right font-medium ${fee.amount < 0 ? "text-red-600" : "text-slate-900"}`}>
                              {fee.amount >= 0 ? "+" : ""}€{fee.amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-sm text-slate-500">Gebühren gesamt: </span>
                    <span className={`font-medium ${newDocData.feesTotal < 0 ? "text-red-600" : "text-slate-900"}`}>
                      {newDocData.feesTotal >= 0 ? "+" : ""}€{newDocData.feesTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Totals - only for invoices */}
              {newDocData.type === "invoice" && (
                <>
                  <Separator />
                  <div className="bg-slate-50 rounded-lg p-4">
                    {/* Summary breakdown */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Warenwert:</span>
                        <span className="font-medium">€{newDocData.itemsTotal.toFixed(2)}</span>
                      </div>
                      {newDocData.depositItems && newDocData.depositItems.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Pfand:</span>
                          <span className={`font-medium ${newDocData.depositTotal < 0 ? "text-red-600" : "text-emerald-600"}`}>
                            {newDocData.depositTotal >= 0 ? "+" : ""}€{newDocData.depositTotal.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {newDocData.fees && newDocData.fees.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Gebühren:</span>
                          <span className={`font-medium ${newDocData.feesTotal < 0 ? "text-red-600" : ""}`}>
                            {newDocData.feesTotal >= 0 ? "+" : ""}€{newDocData.feesTotal.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                      <div className="space-y-2">
                        <Label>MwSt-Satz (%)</Label>
                        <Select
                          value={newDocData.taxRate.toString()}
                          onValueChange={(v) => {
                            const newTaxRate = parseFloat(v);
                            const taxAmount = newDocData.netAmount * (newTaxRate / 100);
                            const totalAmount = newDocData.netAmount + taxAmount;
                            setNewDocData({
                              ...newDocData,
                              taxRate: newTaxRate,
                              taxAmount: Math.round(taxAmount * 100) / 100,
                              totalAmount: Math.round(totalAmount * 100) / 100,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="7">7%</SelectItem>
                            <SelectItem value="19">19%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col justify-end">
                        <div className="text-sm text-slate-500">Netto</div>
                        <div className="text-lg font-medium">€{newDocData.netAmount.toFixed(2)}</div>
                      </div>
                      <div className="flex flex-col justify-end">
                        <div className="text-sm text-slate-500">MwSt ({newDocData.taxRate}%)</div>
                        <div className="text-lg font-medium">€{newDocData.taxAmount.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-lg font-medium text-slate-900">Gesamtbetrag</span>
                      <span className="text-2xl font-bold text-amber-600">€{newDocData.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setNewDocData(null);
                  }}
                  disabled={isSaving}
                >
                  Abbrechen
                </Button>
                <Button
                  className="bg-amber-500 hover:bg-amber-600"
                  onClick={handleSaveNewDocument}
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
                        {selectedDoc.type === "invoice" && (
                          <>
                            <TableHead className="text-right">Einzelpreis</TableHead>
                            <TableHead className="text-right">Gesamt</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDoc.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">
                            {item.quantity} {item.unit}
                          </TableCell>
                          {selectedDoc.type === "invoice" && (
                            <>
                              <TableCell className="text-right">
                                €{item.unitPrice.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                €{item.totalPrice.toFixed(2)}
                              </TableCell>
                            </>
                          )}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Dokument löschen
            </DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie &quot;{deleteConfirm?.fileName}&quot; löschen möchten?
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

      {/* Mobile FAB - Camera first */}
      {isMobile && (
        <FAB
          icon={Camera}
          onClick={() => cameraInputRef.current?.click()}
          badge={documents.filter((d: DocumentWithItems) => d.status === "pending").length || undefined}
        />
      )}
    </motion.div>
  );
}
