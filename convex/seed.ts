import { mutation } from "./_generated/server";

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingUsers = await ctx.db.query("users").first();
    if (existingUsers) {
      return { success: false, message: "Database already seeded" };
    }

    // Demo-Benutzer
    const adminId = await ctx.db.insert("users", {
      email: "admin@restaurant.de",
      name: "Max Mustermann",
      role: "admin",
      passwordHash: "admin123",
      createdAt: Date.now(),
    });

    await ctx.db.insert("users", {
      email: "manager@restaurant.de",
      name: "Anna Schmidt",
      role: "manager",
      passwordHash: "manager123",
      createdAt: Date.now(),
    });

    await ctx.db.insert("users", {
      email: "mitarbeiter@restaurant.de",
      name: "Thomas Weber",
      role: "staff",
      passwordHash: "staff123",
      createdAt: Date.now(),
    });

    // Lieferanten
    const metroId = await ctx.db.insert("suppliers", {
      name: "Metro Cash & Carry",
      contactPerson: "Herr Müller",
      email: "bestellung@metro.de",
      phone: "+49 211 12345-0",
      address: "Metro-Straße 1, 40235 Düsseldorf",
      category: "Großhandel",
      rating: 4.5,
      createdAt: Date.now(),
    });

    const edekaId = await ctx.db.insert("suppliers", {
      name: "EDEKA Foodservice",
      contactPerson: "Frau Schneider",
      email: "foodservice@edeka.de",
      phone: "+49 40 6377-0",
      address: "New-York-Ring 6, 22297 Hamburg",
      category: "Lebensmittel",
      rating: 4.2,
      createdAt: Date.now(),
    });

    const transgourmetId = await ctx.db.insert("suppliers", {
      name: "Transgourmet",
      contactPerson: "Herr Fischer",
      email: "kontakt@transgourmet.de",
      phone: "+49 6107 7590-0",
      address: "Max-Planck-Straße 5, 63128 Dietzenbach",
      category: "Großhandel",
      rating: 4.0,
      createdAt: Date.now(),
    });

    const frischeParadiesId = await ctx.db.insert("suppliers", {
      name: "Frische Paradies",
      contactPerson: "Herr Becker",
      email: "info@frischeparadies.de",
      phone: "+49 30 347005-0",
      address: "Morsestraße 2, 10587 Berlin",
      category: "Frische Produkte",
      rating: 4.8,
      createdAt: Date.now(),
    });

    const getraenkeHoffmannId = await ctx.db.insert("suppliers", {
      name: "Getränke Hoffmann",
      contactPerson: "Frau Hoffmann",
      email: "bestellung@getraenke-hoffmann.de",
      phone: "+49 30 123456-0",
      address: "Berliner Str. 100, 10713 Berlin",
      category: "Getränke",
      rating: 4.3,
      createdAt: Date.now(),
    });

    // Produkte - Fleisch
    await ctx.db.insert("products", {
      name: "Rinderfilet",
      category: "fleisch",
      unit: "kg",
      currentStock: 15,
      minStock: 10,
      avgPrice: 42.5,
      supplierId: metroId,
    });

    await ctx.db.insert("products", {
      name: "Schweinebauch",
      category: "fleisch",
      unit: "kg",
      currentStock: 8,
      minStock: 5,
      avgPrice: 12.8,
      supplierId: metroId,
    });

    const haehnchenbrust = await ctx.db.insert("products", {
      name: "Hähnchenbrust",
      category: "fleisch",
      unit: "kg",
      currentStock: 3,
      minStock: 8,
      avgPrice: 8.9,
      supplierId: edekaId,
    });

    // Produkte - Fisch
    await ctx.db.insert("products", {
      name: "Lachs frisch",
      category: "fisch",
      unit: "kg",
      currentStock: 5,
      minStock: 3,
      avgPrice: 28.0,
      supplierId: frischeParadiesId,
    });

    await ctx.db.insert("products", {
      name: "Dorade",
      category: "fisch",
      unit: "kg",
      currentStock: 2,
      minStock: 2,
      avgPrice: 18.5,
      supplierId: frischeParadiesId,
    });

    // Produkte - Gemüse
    await ctx.db.insert("products", {
      name: "Tomaten",
      category: "gemuese",
      unit: "kg",
      currentStock: 20,
      minStock: 10,
      avgPrice: 3.5,
      supplierId: edekaId,
    });

    await ctx.db.insert("products", {
      name: "Zwiebeln",
      category: "gemuese",
      unit: "kg",
      currentStock: 25,
      minStock: 15,
      avgPrice: 1.8,
      supplierId: edekaId,
    });

    const paprika = await ctx.db.insert("products", {
      name: "Paprika mix",
      category: "gemuese",
      unit: "kg",
      currentStock: 4,
      minStock: 8,
      avgPrice: 4.2,
      supplierId: edekaId,
    });

    await ctx.db.insert("products", {
      name: "Salat Kopf",
      category: "gemuese",
      unit: "Stück",
      currentStock: 30,
      minStock: 20,
      avgPrice: 1.5,
      supplierId: edekaId,
    });

    // Produkte - Milchprodukte
    await ctx.db.insert("products", {
      name: "Butter",
      category: "milchprodukte",
      unit: "kg",
      currentStock: 10,
      minStock: 5,
      avgPrice: 8.5,
      supplierId: transgourmetId,
    });

    await ctx.db.insert("products", {
      name: "Sahne 30%",
      category: "milchprodukte",
      unit: "Liter",
      currentStock: 15,
      minStock: 10,
      avgPrice: 3.2,
      supplierId: transgourmetId,
    });

    await ctx.db.insert("products", {
      name: "Parmesan",
      category: "milchprodukte",
      unit: "kg",
      currentStock: 3,
      minStock: 2,
      avgPrice: 22.0,
      supplierId: frischeParadiesId,
    });

    // Produkte - Getränke
    await ctx.db.insert("products", {
      name: "Mineralwasser",
      category: "getraenke",
      unit: "Kiste",
      currentStock: 50,
      minStock: 30,
      avgPrice: 8.5,
      supplierId: getraenkeHoffmannId,
    });

    await ctx.db.insert("products", {
      name: "Cola 0.33l",
      category: "getraenke",
      unit: "Kiste",
      currentStock: 20,
      minStock: 15,
      avgPrice: 18.0,
      supplierId: getraenkeHoffmannId,
    });

    await ctx.db.insert("products", {
      name: "Weißwein Haus",
      category: "getraenke",
      unit: "Flasche",
      currentStock: 24,
      minStock: 12,
      avgPrice: 6.5,
      supplierId: getraenkeHoffmannId,
    });

    // Produkte - Gewürze
    await ctx.db.insert("products", {
      name: "Olivenöl Extra",
      category: "gewuerze",
      unit: "Liter",
      currentStock: 8,
      minStock: 5,
      avgPrice: 12.0,
      supplierId: frischeParadiesId,
    });

    await ctx.db.insert("products", {
      name: "Salz grob",
      category: "gewuerze",
      unit: "kg",
      currentStock: 5,
      minStock: 3,
      avgPrice: 2.5,
      supplierId: transgourmetId,
    });

    await ctx.db.insert("products", {
      name: "Pfeffer schwarz",
      category: "gewuerze",
      unit: "kg",
      currentStock: 2,
      minStock: 1,
      avgPrice: 18.0,
      supplierId: transgourmetId,
    });

    // Produkte - Backwaren
    await ctx.db.insert("products", {
      name: "Baguette",
      category: "backwaren",
      unit: "Stück",
      currentStock: 10,
      minStock: 8,
      avgPrice: 1.2,
      supplierId: edekaId,
    });

    await ctx.db.insert("products", {
      name: "Ciabatta",
      category: "backwaren",
      unit: "Stück",
      currentStock: 6,
      minStock: 5,
      avgPrice: 1.8,
      supplierId: edekaId,
    });

    // Dokumente
    const doc1 = await ctx.db.insert("documents", {
      type: "invoice",
      fileName: "Rechnung_Metro_2024-01-15.pdf",
      uploadDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
      supplierName: "Metro Cash & Carry",
      supplierId: metroId,
      documentDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
      totalAmount: 1250.8,
      status: "approved",
      uploadedBy: adminId,
    });

    await ctx.db.insert("documentItems", {
      documentId: doc1,
      name: "Rinderfilet",
      quantity: 10,
      unit: "kg",
      unitPrice: 45.0,
      totalPrice: 450.0,
    });

    await ctx.db.insert("documentItems", {
      documentId: doc1,
      name: "Schweinebauch",
      quantity: 15,
      unit: "kg",
      unitPrice: 12.8,
      totalPrice: 192.0,
    });

    const doc2 = await ctx.db.insert("documents", {
      type: "invoice",
      fileName: "Rechnung_Metro_2024-01-22.pdf",
      uploadDate: Date.now() - 23 * 24 * 60 * 60 * 1000,
      supplierName: "Metro Cash & Carry",
      supplierId: metroId,
      documentDate: Date.now() - 23 * 24 * 60 * 60 * 1000,
      totalAmount: 980.5,
      status: "analyzed",
      uploadedBy: adminId,
    });

    await ctx.db.insert("documentItems", {
      documentId: doc2,
      name: "Rinderfilet",
      quantity: 8,
      unit: "kg",
      unitPrice: 52.0,
      totalPrice: 416.0,
    });

    const doc3 = await ctx.db.insert("documents", {
      type: "delivery_note",
      fileName: "Lieferschein_EDEKA_2024-01-18.pdf",
      uploadDate: Date.now() - 27 * 24 * 60 * 60 * 1000,
      supplierName: "EDEKA Foodservice",
      supplierId: edekaId,
      documentDate: Date.now() - 27 * 24 * 60 * 60 * 1000,
      totalAmount: 0,
      status: "approved",
      uploadedBy: adminId,
    });

    await ctx.db.insert("documentItems", {
      documentId: doc3,
      name: "Tomaten",
      quantity: 30,
      unit: "kg",
      unitPrice: 0,
      totalPrice: 0,
    });

    const doc4 = await ctx.db.insert("documents", {
      type: "invoice",
      fileName: "Rechnung_Transgourmet_2024-01-20.pdf",
      uploadDate: Date.now() - 25 * 24 * 60 * 60 * 1000,
      supplierName: "Transgourmet",
      supplierId: transgourmetId,
      documentDate: Date.now() - 25 * 24 * 60 * 60 * 1000,
      totalAmount: 456.3,
      status: "pending",
      uploadedBy: adminId,
    });

    await ctx.db.insert("documentItems", {
      documentId: doc4,
      name: "Butter",
      quantity: 20,
      unit: "kg",
      unitPrice: 8.5,
      totalPrice: 170.0,
    });

    // Anomalien
    await ctx.db.insert("anomalies", {
      type: "price_increase",
      severity: "high",
      title: "Rinderfilet: +15.5% Preiserhöhung",
      description:
        "Der Preis für Rinderfilet ist von €45.00 auf €52.00 pro kg gestiegen.",
      documentId: doc2,
      supplierId: metroId,
      detectedAt: Date.now() - 23 * 24 * 60 * 60 * 1000,
      resolved: false,
    });

    await ctx.db.insert("anomalies", {
      type: "missing_delivery_note",
      severity: "medium",
      title: "Transgourmet: Lieferschein fehlt",
      description: "Rechnung vom 20.01.2024 ohne zugehörigen Lieferschein.",
      documentId: doc4,
      supplierId: transgourmetId,
      detectedAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
      resolved: false,
    });

    await ctx.db.insert("anomalies", {
      type: "low_stock",
      severity: "medium",
      title: "Hähnchenbrust: Niedriger Bestand",
      description:
        "Aktueller Bestand (3 kg) liegt unter dem Mindestbestand (8 kg).",
      productId: haehnchenbrust,
      detectedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      resolved: false,
    });

    await ctx.db.insert("anomalies", {
      type: "low_stock",
      severity: "medium",
      title: "Paprika mix: Niedriger Bestand",
      description:
        "Aktueller Bestand (4 kg) liegt unter dem Mindestbestand (8 kg).",
      productId: paprika,
      detectedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      resolved: false,
    });

    // Spending Data
    const months = ["Aug", "Sep", "Okt", "Nov", "Dez", "Jan"];
    const amounts = [12500, 14200, 13800, 15600, 18200, 14800];
    const year = 2024;

    for (let i = 0; i < months.length; i++) {
      await ctx.db.insert("spendingRecords", {
        month: months[i],
        year: year,
        monthIndex: i + 7, // Aug = 7, Sep = 8, etc.
        amount: amounts[i],
      });
    }

    return { success: true, message: "Database seeded successfully" };
  },
});

export const clearDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all records from all tables
    const tables = [
      "users",
      "sessions",
      "suppliers",
      "products",
      "documents",
      "documentItems",
      "anomalies",
      "spendingRecords",
    ] as const;

    for (const table of tables) {
      const records = await ctx.db.query(table).collect();
      for (const record of records) {
        await ctx.db.delete(record._id);
      }
    }

    return { success: true, message: "Database cleared successfully" };
  },
});

// Clear database but keep admin account
export const clearKeepAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    // Find admin user first
    const adminUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    // Delete all sessions
    const sessions = await ctx.db.query("sessions").collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Delete all users except admin
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      if (user.role !== "admin") {
        await ctx.db.delete(user._id);
      }
    }

    // Delete all document items first (foreign key dependency)
    const documentItems = await ctx.db.query("documentItems").collect();
    for (const item of documentItems) {
      await ctx.db.delete(item._id);
    }

    // Delete all documents
    const documents = await ctx.db.query("documents").collect();
    for (const doc of documents) {
      // Also delete associated files from storage
      if (doc.fileId) {
        await ctx.storage.delete(doc.fileId);
      }
      await ctx.db.delete(doc._id);
    }

    // Delete all products
    const products = await ctx.db.query("products").collect();
    for (const product of products) {
      await ctx.db.delete(product._id);
    }

    // Delete all suppliers
    const suppliers = await ctx.db.query("suppliers").collect();
    for (const supplier of suppliers) {
      await ctx.db.delete(supplier._id);
    }

    // Delete all anomalies
    const anomalies = await ctx.db.query("anomalies").collect();
    for (const anomaly of anomalies) {
      await ctx.db.delete(anomaly._id);
    }

    // Delete all spending records
    const spendingRecords = await ctx.db.query("spendingRecords").collect();
    for (const record of spendingRecords) {
      await ctx.db.delete(record._id);
    }

    return {
      success: true,
      message: "Database cleared, admin account preserved",
      adminEmail: adminUser?.email || "No admin found"
    };
  },
});
