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
} from "@/components/ui/dialog";
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
  uploadDate: number;
  supplierName: string;
  supplierId?: Id<"suppliers">;
  documentDate: number;
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

export default function DocumentsPage() {
  const documents = useQuery(api.documents.listWithItems) ?? [];
  const anomalies = useQuery(api.anomalies.list) ?? [];
  const updateStatus = useMutation(api.documents.updateStatus);
  const createDocument = useMutation(api.documents.create);
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState<DocumentWithItems | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

    // Simulate upload and analysis
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await createDocument({
      type: "invoice",
      fileName: file.name,
      supplierName: "Unbekannt",
      documentDate: Date.now(),
      totalAmount: Math.random() * 1000 + 100,
      uploadedBy: user._id,
      items: [
        {
          name: "Position 1",
          quantity: 10,
          unit: "Stück",
          unitPrice: 5.0,
          totalPrice: 50.0,
        },
        {
          name: "Position 2",
          quantity: 5,
          unit: "kg",
          unitPrice: 12.0,
          totalPrice: 60.0,
        },
      ],
    });

    setIsUploading(false);

    toast({
      title: "Dokument hochgeladen",
      description: `${file.name} wurde erfolgreich analysiert.`,
    });
  }, [user, createDocument, toast]);

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
                            onClick={() => setSelectedDoc(doc)}
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
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.fileName}</DialogTitle>
            <DialogDescription>
              {selectedDoc?.supplierName} •{" "}
              {selectedDoc && formatDate(selectedDoc.documentDate)}
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
                {selectedDoc.type === "invoice" && (
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Gesamtbetrag</p>
                    <p className="text-2xl font-bold text-slate-900">
                      €
                      {selectedDoc.totalAmount.toLocaleString("de-DE", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                )}
              </div>

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
                        <TableCell className="text-right">
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.unitPrice > 0
                            ? `€${item.unitPrice.toFixed(2)}`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.totalPrice > 0
                            ? `€${item.totalPrice.toFixed(2)}`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Actions */}
              {(selectedDoc.status === "pending" ||
                selectedDoc.status === "analyzed") && (
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
