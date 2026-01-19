export type CsvItem = {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
};

/**
 * Generates a CSV template for invoice/delivery note items
 */
export function generateCsvTemplate(type: 'invoice' | 'delivery_note'): string {
  if (type === 'delivery_note') {
    return `Artikelname;Menge;Einheit
Kartoffeln Belana;25;kg
Zwiebeln;10;kg
Möhren gewaschen;2;Kiste
Rotkohl frisch;10;kg
Hähnchenbrust;5;kg`;
  }

  return `Artikelname;Menge;Einheit;Einzelpreis
Kartoffeln Belana;25;kg;1,20
Zwiebeln;10;kg;0,90
Möhren gewaschen;2;Kiste;6,50
Rotkohl frisch;10;kg;1,40
Hähnchenbrust;5;kg;8,50`;
}

/**
 * Downloads a CSV template file
 */
export function downloadCsvTemplate(type: 'invoice' | 'delivery_note'): void {
  const content = generateCsvTemplate(type);
  const filename = type === 'delivery_note'
    ? 'vorlage_lieferschein.csv'
    : 'vorlage_rechnung.csv';

  // Add BOM for Excel compatibility with German umlauts
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses a CSV file and returns items
 */
export async function parseCsvFile(
  file: File,
  type: 'invoice' | 'delivery_note'
): Promise<CsvItem[]> {
  const text = await file.text();
  return parseCsvText(text, type);
}

/**
 * Parses CSV text content and returns items
 */
export function parseCsvText(
  text: string,
  type: 'invoice' | 'delivery_note'
): CsvItem[] {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    throw new Error('CSV-Datei ist leer');
  }

  // Detect delimiter (semicolon or comma)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  // Check if first line is header
  const headerPatterns = ['artikel', 'name', 'bezeichnung', 'menge', 'einheit'];
  const isHeader = headerPatterns.some(pattern =>
    firstLine.toLowerCase().includes(pattern)
  );

  const dataLines = isHeader ? lines.slice(1) : lines;
  const items: CsvItem[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const parts = parseCsvLine(line, delimiter);

    if (parts.length < 3) {
      console.warn(`Zeile ${i + 1} übersprungen: nicht genug Spalten`);
      continue;
    }

    const name = parts[0].trim();
    const quantity = parseGermanNumber(parts[1]);
    const unit = parts[2].trim();

    let unitPrice = 0;
    if (type === 'invoice' && parts.length >= 4) {
      unitPrice = parseGermanNumber(parts[3]);
    }

    if (!name) {
      console.warn(`Zeile ${i + 1} übersprungen: kein Artikelname`);
      continue;
    }

    items.push({
      name,
      quantity,
      unit: normalizeUnit(unit),
      unitPrice,
      totalPrice: Math.round(quantity * unitPrice * 100) / 100,
    });
  }

  if (items.length === 0) {
    throw new Error('Keine gültigen Positionen in der CSV-Datei gefunden');
  }

  return items;
}

/**
 * Parses a single CSV line, handling quoted values
 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result.map(s => s.trim().replace(/^"|"$/g, ''));
}

/**
 * Parses a German number format (1.234,56 or 1234,56)
 */
function parseGermanNumber(str: string): number {
  if (!str) return 0;

  const cleaned = str.trim();

  // Handle German format: 1.234,56 -> 1234.56
  // Also handle: 1234,56 -> 1234.56
  // And standard: 1234.56 -> 1234.56

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    // German format with thousands separator: 1.234,56
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  } else if (hasComma) {
    // German format without thousands: 1234,56
    return parseFloat(cleaned.replace(',', '.'));
  } else {
    // Standard format: 1234.56 or 1234
    return parseFloat(cleaned) || 0;
  }
}

/**
 * Normalizes unit strings to consistent format
 */
function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase().trim();

  const unitMap: Record<string, string> = {
    'stk': 'Stk',
    'stück': 'Stk',
    'st': 'Stk',
    'stuck': 'Stk',
    'kg': 'kg',
    'kilogramm': 'kg',
    'g': 'g',
    'gramm': 'g',
    'l': 'L',
    'liter': 'L',
    'ml': 'ml',
    'milliliter': 'ml',
    'pck': 'Pkg',
    'pkg': 'Pkg',
    'pckg': 'Pkg',
    'packung': 'Pkg',
    'paket': 'Pkg',
    'kiste': 'Kiste',
    'krt': 'Kiste',
    'karton': 'Kiste',
    'fl': 'Fl',
    'flasche': 'Fl',
    'btl': 'Btl',
    'beutel': 'Btl',
    'bund': 'Bund',
    'dose': 'Dose',
    'glas': 'Glas',
  };

  return unitMap[lower] || unit;
}

/**
 * Exports items to CSV format
 */
export function exportItemsToCsv(
  items: CsvItem[],
  type: 'invoice' | 'delivery_note'
): string {
  const bom = '\uFEFF';

  if (type === 'delivery_note') {
    const header = 'Artikelname;Menge;Einheit';
    const rows = items.map(item =>
      `${escapeCSVValue(item.name)};${formatGermanNumber(item.quantity)};${item.unit}`
    );
    return bom + [header, ...rows].join('\n');
  }

  const header = 'Artikelname;Menge;Einheit;Einzelpreis';
  const rows = items.map(item =>
    `${escapeCSVValue(item.name)};${formatGermanNumber(item.quantity)};${item.unit};${formatGermanNumber(item.unitPrice)}`
  );
  return bom + [header, ...rows].join('\n');
}

/**
 * Escapes a value for CSV (adds quotes if needed)
 */
function escapeCSVValue(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Formats a number in German format
 */
function formatGermanNumber(num: number): string {
  return num.toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}
