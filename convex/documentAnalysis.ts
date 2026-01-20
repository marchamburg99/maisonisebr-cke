"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import Anthropic from "@anthropic-ai/sdk";

const EXTRACTION_PROMPT = `Du bist ein Experte für die Extraktion von Rechnungsdaten. Analysiere das folgende Dokument (Rechnung oder Lieferschein) und extrahiere alle relevanten Informationen.

WICHTIG: Gib NUR gültiges JSON zurück, ohne Markdown-Formatierung, ohne Codeblöcke, ohne Erklärungen.

Extrahiere folgende Daten:

1. KOPFDATEN:
   - Dokumenttyp (invoice = Rechnung, delivery_note = Lieferschein)
   - Rechnungs-/Lieferscheinnummer
   - Lieferant (Name und Adresse)
   - Dokumentdatum (Format: YYYY-MM-DD)
   - Fälligkeitsdatum falls vorhanden (Format: YYYY-MM-DD)

2. WARENARTIKEL (items):
   - Nur echte Produkte/Waren, KEINE Pfandartikel
   - Artikelname (bereinigt, ohne Artikelnummer am Anfang)
   - Menge (als Zahl)
   - Einheit (kg, g, L, ml, Stk, Pkg, Kasten, Fass, Bund, Fl, Dose)
   - Einzelpreis (als Zahl)
   - Gesamtpreis (als Zahl)

3. PFAND/LEERGUT (depositItems):
   - Alle Pfand-/Leergutpositionen separat
   - Name des Pfandartikels
   - Differenz (Lieferung minus Rückgabe, kann negativ sein)
   - Pfandwert pro Einheit
   - Gesamtwert (Differenz × Pfandwert, kann negativ sein bei Rückgabe)

4. ZUSCHLÄGE & ABSCHLÄGE (fees):
   - Lieferpauschale, Mindermengenzuschlag, Rabatte, etc.
   - Name der Position
   - Betrag (positiv = Zuschlag, negativ = Abschlag/Rabatt)

5. BETRÄGE:
   - Warenwert (Summe der Warenartikel)
   - Pfandwert (Summe der Pfandpositionen, oft negativ)
   - Gebühren (Summe der Zuschläge/Abschläge)
   - Nettobetrag (Basis für MwSt-Berechnung)
   - MwSt-Satz (als Zahl, z.B. 19)
   - MwSt-Betrag
   - Gesamtbetrag (finale Rechnungssumme)

Antwortformat (NUR dieses JSON, nichts anderes):
{
  "type": "invoice" | "delivery_note",
  "invoiceNumber": "string",
  "supplierName": "string",
  "supplierAddress": "string",
  "documentDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD" | null,
  "items": [
    {
      "name": "string",
      "quantity": number,
      "unit": "string",
      "unitPrice": number,
      "totalPrice": number
    }
  ],
  "depositItems": [
    {
      "name": "string",
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number
    }
  ],
  "fees": [
    {
      "name": "string",
      "amount": number
    }
  ],
  "itemsTotal": number,
  "depositTotal": number,
  "feesTotal": number,
  "netAmount": number,
  "taxRate": number,
  "taxAmount": number,
  "totalAmount": number
}`;

export const analyzeDocument = action({
  args: {
    fileId: v.id("_storage"),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    data?: {
      type: "invoice" | "delivery_note";
      invoiceNumber: string;
      supplierName: string;
      supplierAddress: string;
      documentDate: string;
      dueDate: string | null;
      items: Array<{
        name: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        totalPrice: number;
      }>;
      depositItems: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }>;
      fees: Array<{
        name: string;
        amount: number;
      }>;
      itemsTotal: number;
      depositTotal: number;
      feesTotal: number;
      netAmount: number;
      taxRate: number;
      taxAmount: number;
      totalAmount: number;
    };
    error?: string;
  }> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "ANTHROPIC_API_KEY ist nicht konfiguriert. Bitte in den Convex Environment Variables hinzufügen.",
      };
    }

    // Get the file URL from storage
    const fileUrl = await ctx.storage.getUrl(args.fileId);
    if (!fileUrl) {
      return {
        success: false,
        error: "Datei konnte nicht gefunden werden.",
      };
    }

    // Fetch the file content
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return {
        success: false,
        error: "Datei konnte nicht geladen werden.",
      };
    }

    const contentType = response.headers.get("content-type") || "";
    const fileBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(fileBuffer).toString("base64");

    // Determine if it's a PDF or image
    const isPdf = contentType.includes("pdf");

    // Initialize Anthropic client
    const anthropic = new Anthropic({ apiKey });

    try {
      // Build content based on file type
      type ContentBlock =
        | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
        | { type: "image"; source: { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp"; data: string } }
        | { type: "text"; text: string };

      let fileContent: ContentBlock;

      if (isPdf) {
        fileContent = {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64Data,
          },
        };
      } else {
        // Determine image media type
        let imageMediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";
        if (contentType.includes("png")) {
          imageMediaType = "image/png";
        } else if (contentType.includes("gif")) {
          imageMediaType = "image/gif";
        } else if (contentType.includes("webp")) {
          imageMediaType = "image/webp";
        }

        fileContent = {
          type: "image",
          source: {
            type: "base64",
            media_type: imageMediaType,
            data: base64Data,
          },
        };
      }

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              fileContent,
              {
                type: "text",
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      });

      // Extract text content from response
      const textContent = message.content.find((block) => block.type === "text");
      if (!textContent || textContent.type !== "text") {
        return {
          success: false,
          error: "Keine Textantwort vom AI-Modell erhalten.",
        };
      }

      // Parse the JSON response
      let extractedData;
      try {
        // Clean up the response - remove markdown code blocks if present
        let jsonText = textContent.text.trim();
        if (jsonText.startsWith("```json")) {
          jsonText = jsonText.slice(7);
        } else if (jsonText.startsWith("```")) {
          jsonText = jsonText.slice(3);
        }
        if (jsonText.endsWith("```")) {
          jsonText = jsonText.slice(0, -3);
        }
        jsonText = jsonText.trim();

        extractedData = JSON.parse(jsonText);
      } catch {
        return {
          success: false,
          error: "AI-Antwort konnte nicht als JSON geparst werden: " + textContent.text.substring(0, 200),
        };
      }

      // Validate and normalize the data
      const normalizedData = {
        type: extractedData.type === "delivery_note" ? "delivery_note" as const : "invoice" as const,
        invoiceNumber: String(extractedData.invoiceNumber || ""),
        supplierName: String(extractedData.supplierName || ""),
        supplierAddress: String(extractedData.supplierAddress || ""),
        documentDate: String(extractedData.documentDate || new Date().toISOString().split("T")[0]),
        dueDate: extractedData.dueDate ? String(extractedData.dueDate) : null,
        items: (extractedData.items || []).map((item: {
          name?: string;
          quantity?: number;
          unit?: string;
          unitPrice?: number;
          totalPrice?: number;
        }) => ({
          name: String(item.name || ""),
          quantity: Number(item.quantity) || 0,
          unit: normalizeUnit(String(item.unit || "Stk")),
          unitPrice: Number(item.unitPrice) || 0,
          totalPrice: Number(item.totalPrice) || 0,
        })),
        depositItems: (extractedData.depositItems || []).map((item: {
          name?: string;
          quantity?: number;
          unitPrice?: number;
          totalPrice?: number;
        }) => ({
          name: String(item.name || ""),
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          totalPrice: Number(item.totalPrice) || 0,
        })),
        fees: (extractedData.fees || []).map((fee: {
          name?: string;
          amount?: number;
        }) => ({
          name: String(fee.name || ""),
          amount: Number(fee.amount) || 0,
        })),
        itemsTotal: Number(extractedData.itemsTotal) || 0,
        depositTotal: Number(extractedData.depositTotal) || 0,
        feesTotal: Number(extractedData.feesTotal) || 0,
        netAmount: Number(extractedData.netAmount) || 0,
        taxRate: Number(extractedData.taxRate) || 19,
        taxAmount: Number(extractedData.taxAmount) || 0,
        totalAmount: Number(extractedData.totalAmount) || 0,
      };

      return {
        success: true,
        data: normalizedData,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
      return {
        success: false,
        error: "Fehler bei der AI-Analyse: " + errorMessage,
      };
    }
  },
});

// Helper function to normalize unit strings
function normalizeUnit(unit: string): string {
  const unitLower = unit.toLowerCase().trim();

  const unitMap: Record<string, string> = {
    "stück": "Stk",
    "stk": "Stk",
    "st": "Stk",
    "stck": "Stk",
    "piece": "Stk",
    "pcs": "Stk",
    "kilogramm": "kg",
    "kilo": "kg",
    "kg": "kg",
    "gramm": "g",
    "gr": "g",
    "g": "g",
    "liter": "L",
    "l": "L",
    "lt": "L",
    "milliliter": "ml",
    "ml": "ml",
    "packung": "Pkg",
    "pkg": "Pkg",
    "pack": "Pkg",
    "paket": "Pkg",
    "kiste": "Kasten",
    "kisten": "Kasten",
    "kasten": "Kasten",
    "kästen": "Kasten",
    "kst": "Kasten",
    "ka": "Kasten",
    "kas": "Kasten",
    "fass": "Fass",
    "fa": "Fass",
    "fässer": "Fass",
    "bund": "Bund",
    "bd": "Bund",
    "flasche": "Fl",
    "fl": "Fl",
    "flaschen": "Fl",
    "dose": "Dose",
    "dosen": "Dose",
  };

  return unitMap[unitLower] || unit;
}
