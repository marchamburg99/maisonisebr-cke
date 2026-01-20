import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Generate upload URL for file storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get file URL for download/preview
export const getFileUrl = query({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.fileId);
  },
});

const documentStatus = v.union(
  v.literal("pending"),
  v.literal("analyzed"),
  v.literal("approved"),
  v.literal("rejected")
);

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("documents").order("desc").collect();
  },
});

export const listByStatus = query({
  args: { status: documentStatus },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getWithItems = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document) return null;

    const items = await ctx.db
      .query("documentItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.id))
      .collect();

    return { ...document, items };
  },
});

export const listWithItems = query({
  args: {},
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").order("desc").collect();

    const documentsWithItems = await Promise.all(
      documents.map(async (doc) => {
        const items = await ctx.db
          .query("documentItems")
          .withIndex("by_document", (q) => q.eq("documentId", doc._id))
          .collect();
        return { ...doc, items };
      })
    );

    return documentsWithItems;
  },
});

// Helper function to guess product category from name
function guessCategory(name: string): "fleisch" | "fisch" | "gemuese" | "obst" | "milchprodukte" | "getraenke" | "gewuerze" | "backwaren" | "sonstiges" {
  const nameLower = name.toLowerCase();

  // Fleisch (100+ Begriffe)
  if (/rind|schwein|hähnchen|huhn|pute|lamm|kalb|wurst|schinken|speck|filet|steak|hack|braten|gulasch|schnitzel|kotelett|rippchen|bauch|leber|niere|zunge|herz|brust|keule|flügel|innereien|fleisch|salami|mortadella|leberwurst|blutwurst|weißwurst|bratwurst|bockwurst|wiener|frankfurter|knacker|landjäger|mettwurst|teewurst|cervelat|chorizo|pancetta|prosciutto|coppa|bresaola|pastrami|corned|beef|entrecôte|roastbeef|tafelspitz|sauerbraten|roulade|frikadelle|bulette|fleischkäse|leberkäse|aufschnitt|bacon|kassler|eisbein|haxe|ochsenschwanz|bäckchen|nacken|schulter|hüfte|oberschale|unterschale|kugel|nuss|bugstück|false|filet|dicke|rippe|hohe|rippe|flache|schulterfilet|medaillons|geschnetzeltes|pulled|pork|spare|ribs|t-bone|porterhouse|ribeye|tenderloin|sirloin|flank|brisket|chuck|ente|gans|wachtel|fasan|rehkeule|hirsch|wildschwein|hase|kaninchen|wild|strauß|büffel|wagyu|dry|aged/.test(nameLower)) {
    return "fleisch";
  }

  // Fisch & Meeresfrüchte (80+ Begriffe)
  if (/lachs|fisch|dorade|forelle|thunfisch|garnele|shrimp|muschel|tintenfisch|kabeljau|hering|makrele|sardine|sardelle|anchovi|scholle|seezunge|steinbutt|heilbutt|zander|barsch|karpfen|wels|aal|rotbarsch|seeteufel|wolfsbarsch|branzino|goldbrasse|meerbrasse|schwertfisch|marlin|hai|rochen|seelachs|pangasius|tilapia|viktoriabarsch|waller|hecht|schleie|flunder|seehecht|lengfisch|schellfisch|dorsch|skrei|klippfisch|stockfisch|matjes|bismarckhering|rollmops|brathering|räucherlachs|graved|lox|kaviar|rogen|sushi|sashimi|ceviche|krebs|languste|hummer|lobster|krabben|krebsfleisch|scampi|gambas|crevetten|königskrabbe|flusskrebse|austern|jakobsmuscheln|miesmuscheln|venusmuscheln|herzmuscheln|grünlippmuscheln|calamari|pulpo|oktopus|sepia|tintenfischringe|surimi|fischstäbchen|backfisch|kieler|sprotten|sardellen|anchovis|bottarga/.test(nameLower)) {
    return "fisch";
  }

  // Gemüse (120+ Begriffe)
  if (/kartoffel|tomate|zwiebel|paprika|gurke|salat|möhre|karotte|kohl|rotkohl|spinat|zucchini|aubergine|brokkoli|blumenkohl|lauch|sellerie|champignon|pilz|spargel|erbse|bohne|mais|kürbis|fenchel|artischocke|radieschen|rettich|rübe|pastinake|petersilienwurzel|schwarzwurzel|topinambur|knollensellerie|stangensellerie|staudensellerie|mangold|grünkohl|palmkohl|chinakohl|weißkohl|wirsing|rosenkohl|pak choi|bok choy|kohlrabi|rucola|radicchio|chicorée|endivie|feldsalat|kopfsalat|eisbergsalat|lollo|romano|batavia|eichblatt|frisée|kresse|portulak|vogelmiere|bärlauch|schnittlauch|frühlingszwiebel|schalotte|knoblauch|ingwer|kurkuma|galgant|meerrettich|wasabi|süßkartoffel|yams|maniok|taro|okra|jalapeno|chili|peperoni|pfefferoni|poblano|habanero|serrano|cayenne|tabasco|ancho|chipotle|kirschtomate|cocktailtomate|rispentomate|ochsenherz|roma|san marzano|fleischtomate|datteltomate|cherrytomaten|snackgurke|salatgurke|einlegegurke|schmorgurke|cornichon|gewürzgurke|senfgurke|pfifferling|steinpilz|austernpilz|shiitake|portobello|kräuterseitling|enoki|maitake|morchel|trüffel|egerlinge|wiesenchampignon|riesenchampignon|brauner|champignon|gemüse|grünzeug/.test(nameLower)) {
    return "gemuese";
  }

  // Obst (100+ Begriffe)
  if (/apfel|birne|banane|orange|zitrone|lime|limette|erdbeere|himbeere|traube|melone|ananas|mango|kiwi|pfirsich|nektarine|aprikose|pflaume|zwetschge|kirsche|johannisbeere|stachelbeere|heidelbeere|blaubeere|brombeere|preiselbeere|cranberry|goji|acai|aronia|holunder|sanddorn|hagebutte|quitte|granatapfel|feige|dattel|rosine|sultanine|korinthe|weintraube|tafeltraube|clementine|mandarine|satsuma|tangerin|pomelo|grapefruit|blutorange|kumquat|yuzu|bergamotte|limone|cedrat|zitrusfrucht|citrus|litschi|lychee|rambutan|longan|drachenfrucht|pitaya|papaya|maracuja|passionsfrucht|guave|cherimoya|kaktusfeige|sternfrucht|karambole|jackfruit|durian|physalis|kapstachelbeere|sharon|kaki|persimone|wassermelone|honigmelone|cantaloup|galiamelone|netzmelone|charentais|cavaillon|zuckermelone|grüne|banane|kochbanane|babybanane|plantain|rote|banane|obst|früchte|frucht|beere|beeren|kernobst|steinobst|südfrüchte|exoten|trockenobst|dörrobs/.test(nameLower)) {
    return "obst";
  }

  // Milchprodukte (80+ Begriffe)
  if (/milch|sahne|butter|käse|joghurt|quark|parmesan|mozzarella|gouda|emmentaler|schmand|crème|créme|creme|rahm|mascarpone|ricotta|burrata|feta|halloumi|ziegenkäse|schafskäse|frischkäse|hüttenkäse|cottage|skyr|kefir|buttermilch|dickmilch|sauerrahm|crème fraîche|schmand|schlagsahne|kaffeesahne|kondensmilch|evaporierte|milchpulver|molke|molkepulver|lactose|laktose|vollmilch|fettarme|halbfett|magermilch|rohmilch|heumilch|weidemilch|biomilch|h-milch|frischmilch|eiscreme|speiseeis|gelato|sorbet|frozen|yogurt|pudding|grieß|milchreis|flammeri|blanc|mange|tilsiter|appenzeller|gruyère|comté|brie|camembert|gorgonzola|roquefort|stilton|blauschimmel|edelpilzkäse|bergkäse|almkäse|raclette|fondue|reibekäse|streukäse|scheibletten|schmelzkäse|streichkäse|kräuterbutter|süßrahmbutter|sauerrahmbutter|ghee|butterschmalz|butterfett|topfen|germknödel|kaiserschmarrn|pfannkuchen/.test(nameLower)) {
    return "milchprodukte";
  }

  // Getränke (100+ Begriffe)
  if (/wasser|cola|saft|bier|wein|schnaps|likör|kaffee|tee|limonade|sprite|fanta|mineralwasser|sprudel|selters|tafelwasser|quellwasser|heilwasser|sodawasser|tonic|bitter|lemon|ginger|ale|energy|drink|red bull|monster|rockstar|apfelsaft|orangensaft|traubensaft|kirschsaft|johannisbeersaft|multivitamin|acerola|smoothie|nektar|direktsaft|konzentrat|schorle|apfelschorle|weinschorle|radler|alster|diesel|shandy|pilsner|pils|lager|weizen|weißbier|hefeweizen|kristallweizen|altbier|kölsch|export|märzen|bock|doppelbock|starkbier|schwarzbier|porter|stout|ale|ipa|pale|craft|rotwein|weißwein|rosé|sekt|champagner|prosecco|cava|crémant|schaumwein|perlwein|glühwein|federweißer|eiswein|dessertwein|portwein|sherry|madeira|marsala|vermouth|wermut|cognac|brandy|weinbrand|grappa|obstler|obstbrand|williams|kirschwasser|zwetschgenwasser|mirabelle|gin|vodka|wodka|rum|whisky|whiskey|bourbon|tequila|mezcal|sake|soju|baijiu|ouzo|raki|pastis|absinth|sambuca|amaretto|kahlua|baileys|cointreau|grand|marnier|curaçao|triple|sec|espresso|cappuccino|latte|macchiato|americano|filterkaffee|mokka|türkischer|entkoffeiniert|instant|schwarztee|grüntee|weißer|tee|oolong|pu-erh|rooibos|mate|chai|früchtetee|kräutertee|pfefferminz|kamille|fenchel|eistee|kakao|heiße|schokolade|ovomaltine|malz|getränk|drink|beverag/.test(nameLower)) {
    return "getraenke";
  }

  // Gewürze & Zutaten (120+ Begriffe)
  if (/salz|pfeffer|öl|olivenöl|essig|zucker|mehl|gewürz|oregano|basilikum|thymian|rosmarin|curry|paprikapulver|zimt|muskat|vanille|safran|kurkuma|koriander|kreuzkümmel|kümmel|anis|sternanis|fenchelsamen|kardamom|nelke|piment|wacholder|lorbeer|majoran|estragon|dill|petersilie|schnittlauch|minze|salbei|bohnenkraut|liebstöckel|kerbel|beifuß|lavendel|zitronengras|galangal|ingwerpulver|knoblauchpulver|zwiebelpulver|selleriesalz|kräutersalz|meersalz|himalayasalz|fleur de sel|steinsalz|rauchsalz|schwarzer pfeffer|weißer pfeffer|grüner pfeffer|rosa pfeffer|szechuan|cayennepfeffer|chilipulver|chiliflocken|sambal|harissa|tabascosauce|sriracha|wasabipaste|senfpulver|senf|dijon|bauernsenf|süßer senf|meerrettichpaste|essigessenz|balsamico|aceto|weißweinessig|rotweinessig|apfelessig|reisessig|sherryessig|branntweinessig|sonnenblumenöl|rapsöl|maiskeimöl|erdnussöl|sesamöl|walnussöl|haselnussöl|traubenkernöl|kürbiskernöl|leinöl|hanföl|kokosöl|palmöl|butterschmalz|schmalz|trüffelöl|chiliöl|knoblauchöl|kräuteröl|weizenmehl|dinkelmehl|roggenmehl|vollkornmehl|maismehl|reismehl|buchweizenmehl|kichererbsenmehl|mandelmehl|kokosmehl|kartoffelstärke|maisstärke|speisestärke|backpulver|natron|hefe|trockenhefe|frischhefe|gelatine|agar|pektin|xanthan|guarkern|johannisbrotkern|puderzucker|rohrzucker|brauner zucker|muscovado|kokosblütenzucker|ahornsirup|agavensirup|honig|melasse|glukose|maltose|isomalt|stevia|erythrit|xylit|süßstoff|bouillon|brühe|fond|demi-glace|jus|sojasauce|tamari|fischsauce|austernsauce|hoisin|teriyaki|miso|tahini|sesammus|erdnussbutter|mandelmus|nussmus/.test(nameLower)) {
    return "gewuerze";
  }

  // Backwaren (60+ Begriffe)
  if (/brot|brötchen|baguette|ciabatta|croissant|kuchen|torte|gebäck|semmel|weck|schrippe|rundstück|kaisersemmel|laugenbretzel|brezel|laugengebäck|laugenstange|vollkornbrot|mischbrot|weißbrot|schwarzbrot|pumpernickel|roggenbrot|dinkelbrot|sauerteig|toastbrot|sandwich|tramezzini|focaccia|fladenbrot|pita|naan|chapati|tortilla|wrap|knäckebrot|zwieback|cracker|grissini|biscotti|keks|cookie|plätzchen|waffel|pfannkuchen|crêpe|blini|donut|berliner|krapfen|strudel|plunder|blätterteig|hefeteig|mürbeteig|brandteig|biskuit|rührkuchen|gugelhupf|marmorkuchen|zitronenkuchen|käsekuchen|schwarzwälder|sachertorte|tiramisu|brownie|muffin|cupcake|eclair|windbeutel|baiser|meringue|macaron|praline|konfekt|lebkuchen|stollen|panettone|brioche|franzbrötchen|zimtschnecke|nussschnecke|mohnschnecke|rosinenschnecke|teilchen|hörnchen|backware|teigware|gebäckstück/.test(nameLower)) {
    return "backwaren";
  }

  return "sonstiges";
}

export const create = mutation({
  args: {
    type: v.union(v.literal("invoice"), v.literal("delivery_note")),
    fileName: v.string(),
    fileId: v.optional(v.id("_storage")),
    invoiceNumber: v.optional(v.string()),
    supplierName: v.string(),
    supplierAddress: v.optional(v.string()),
    supplierId: v.optional(v.id("suppliers")),
    documentDate: v.number(),
    dueDate: v.optional(v.number()),
    netAmount: v.optional(v.number()),
    taxAmount: v.optional(v.number()),
    taxRate: v.optional(v.number()),
    totalAmount: v.number(),
    uploadedBy: v.id("users"),
    items: v.array(
      v.object({
        name: v.string(),
        quantity: v.number(),
        unit: v.string(),
        unitPrice: v.number(),
        totalPrice: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { items, supplierName, supplierAddress, ...docData } = args;

    // Find or create supplier
    let supplierId = docData.supplierId;
    let isNewSupplier = false;

    if (!supplierId) {
      // Try to find existing supplier by name
      const existingSupplier = await ctx.db
        .query("suppliers")
        .withIndex("by_name", (q) => q.eq("name", supplierName))
        .first();

      if (existingSupplier) {
        supplierId = existingSupplier._id;
      } else {
        // Create new supplier
        supplierId = await ctx.db.insert("suppliers", {
          name: supplierName,
          contactPerson: "",
          email: "",
          phone: "",
          address: supplierAddress || "",
          category: "Sonstiges",
          rating: 3,
          createdAt: Date.now(),
        });
        isNewSupplier = true;
      }
    }

    const documentId = await ctx.db.insert("documents", {
      ...docData,
      supplierName,
      supplierAddress,
      supplierId,
      uploadDate: Date.now(),
      status: "analyzed",
    });

    for (const item of items) {
      await ctx.db.insert("documentItems", { documentId, ...item });
    }

    // Anomaly detection: duplicate invoice
    if (docData.type === "invoice" && docData.invoiceNumber) {
      await ctx.scheduler.runAfter(0, internal.anomalyDetection.detectDuplicateInvoice, {
        documentId,
        invoiceNumber: docData.invoiceNumber,
        supplierId,
        supplierName,
      });
    }

    // Anomaly detection: new supplier
    if (isNewSupplier) {
      await ctx.scheduler.runAfter(0, internal.anomalyDetection.detectNewSupplier, {
        supplierId,
        supplierName,
        documentId,
      });
    }

    return documentId;
  },
});

export const update = mutation({
  args: {
    id: v.id("documents"),
    type: v.optional(v.union(v.literal("invoice"), v.literal("delivery_note"))),
    invoiceNumber: v.optional(v.string()),
    supplierName: v.optional(v.string()),
    supplierAddress: v.optional(v.string()),
    documentDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    netAmount: v.optional(v.number()),
    taxAmount: v.optional(v.number()),
    taxRate: v.optional(v.number()),
    totalAmount: v.optional(v.number()),
    items: v.optional(v.array(
      v.object({
        name: v.string(),
        quantity: v.number(),
        unit: v.string(),
        unitPrice: v.number(),
        totalPrice: v.number(),
      })
    )),
  },
  handler: async (ctx, args) => {
    const { id, items, ...updates } = args;

    // Update document
    await ctx.db.patch(id, updates);

    // If items provided, replace all items
    if (items) {
      // Delete existing items
      const existingItems = await ctx.db
        .query("documentItems")
        .withIndex("by_document", (q) => q.eq("documentId", id))
        .collect();

      for (const item of existingItems) {
        await ctx.db.delete(item._id);
      }

      // Insert new items
      for (const item of items) {
        await ctx.db.insert("documentItems", { documentId: id, ...item });
      }
    }

    return await ctx.db.get(id);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("documents"),
    status: documentStatus,
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document) {
      throw new Error("Document not found");
    }

    // Update the document status
    await ctx.db.patch(args.id, { status: args.status });

    // If the document is being approved, handle based on document type
    if (args.status === "approved" && document.status !== "approved") {
      // Get document items
      const items = await ctx.db
        .query("documentItems")
        .withIndex("by_document", (q) => q.eq("documentId", args.id))
        .collect();

      // Make sure we have a supplier ID
      let supplierId = document.supplierId;
      if (!supplierId) {
        // Try to find or create the supplier
        const existingSupplier = await ctx.db
          .query("suppliers")
          .withIndex("by_name", (q) => q.eq("name", document.supplierName))
          .first();

        if (existingSupplier) {
          supplierId = existingSupplier._id;
        } else {
          supplierId = await ctx.db.insert("suppliers", {
            name: document.supplierName,
            contactPerson: "",
            email: "",
            phone: "",
            address: document.supplierAddress || "",
            category: "Sonstiges",
            rating: 3,
            createdAt: Date.now(),
          });
        }

        // Update document with supplier ID
        await ctx.db.patch(args.id, { supplierId });
      }

      // ONLY update inventory for DELIVERY NOTES (Lieferschein)
      // Invoices are for accounting only - stock is updated when goods arrive (delivery note)
      if (document.type === "delivery_note") {
        const updatedProductIds: Array<{ productId: Id<"products">; wasLowStock: boolean }> = [];

        // Process each item and update/create products
        for (const item of items) {
          // Try to find existing product by name (case-insensitive)
          const allProducts = await ctx.db.query("products").collect();
          const existingProduct = allProducts.find(
            (p) => p.name.toLowerCase() === item.name.toLowerCase()
          );

          if (existingProduct) {
            // Track if product was below minimum stock before update
            const wasLowStock = existingProduct.currentStock < existingProduct.minStock;

            // Update existing product: add to stock
            const newStock = existingProduct.currentStock + item.quantity;
            // For delivery notes without prices, keep the existing avgPrice
            const newAvgPrice = item.unitPrice > 0
              ? (existingProduct.currentStock * existingProduct.avgPrice + item.quantity * item.unitPrice) / newStock
              : existingProduct.avgPrice;

            await ctx.db.patch(existingProduct._id, {
              currentStock: newStock,
              avgPrice: Math.round(newAvgPrice * 100) / 100,
              lastOrderDate: document.documentDate,
            });

            updatedProductIds.push({ productId: existingProduct._id, wasLowStock });
          } else {
            // Create new product
            const category = guessCategory(item.name);
            const newProductId = await ctx.db.insert("products", {
              name: item.name,
              category,
              unit: item.unit,
              currentStock: item.quantity,
              minStock: Math.ceil(item.quantity * 0.3), // Default min stock to 30% of initial quantity
              avgPrice: item.unitPrice || 0, // May be 0 for delivery notes
              supplierId: supplierId!,
              lastOrderDate: document.documentDate,
            });

            // Check if new product is already below min stock (unlikely but possible)
            updatedProductIds.push({ productId: newProductId, wasLowStock: false });
          }
        }

        // Anomaly detection: auto-resolve low stock anomalies for products that received stock
        // and detect any new low stock situations
        for (const { productId, wasLowStock } of updatedProductIds) {
          if (wasLowStock) {
            // Try to auto-resolve if stock was replenished
            await ctx.scheduler.runAfter(0, internal.anomalyDetection.autoResolveLowStockAnomalies, {
              productId,
            });
          }
          // Also check if product is still below minimum (detect low stock)
          await ctx.scheduler.runAfter(0, internal.anomalyDetection.detectLowStock, {
            productId,
          });
        }
      }

      // Update spending records ONLY for INVOICES (Rechnung)
      // Delivery notes don't have financial amounts
      if (document.type === "invoice") {
        const date = new Date(document.documentDate);
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
        const month = monthNames[monthIndex];

        const existingRecord = await ctx.db
          .query("spendingRecords")
          .withIndex("by_year_month", (q) => q.eq("year", year).eq("monthIndex", monthIndex))
          .first();

        if (existingRecord) {
          await ctx.db.patch(existingRecord._id, {
            amount: existingRecord.amount + document.totalAmount,
          });
        } else {
          await ctx.db.insert("spendingRecords", {
            month,
            year,
            monthIndex,
            amount: document.totalAmount,
          });
        }

        // Anomaly detection: detect price changes and record price history
        if (supplierId) {
          await ctx.scheduler.runAfter(0, internal.anomalyDetection.detectPriceChanges, {
            documentId: args.id,
            supplierId,
            items: items.map((item) => ({
              name: item.name,
              unitPrice: item.unitPrice,
              unit: item.unit,
            })),
            documentDate: document.documentDate,
          });
        }
      }
    }
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    // Delete associated items first
    const items = await ctx.db
      .query("documentItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.id))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.id);
  },
});
