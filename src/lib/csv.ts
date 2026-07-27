import { Order } from "@/types/order";

// All order fields except imagePath, which doesn't belong in CSV per spec.
const COLUMNS: (keyof Order)[] = [
  "id",
  "orderType",
  "employee",
  "brand",
  "marketplace",
  "platformOrderNumber",
  "orderDate",
  "buyerName",
  "shippingAddress",
  "addressLine",
  "city",
  "state",
  "zip",
  "country",
  "contactNo",
  "category",
  "sku",
  "metalKt",
  "metalColor",
  "stoneQuality",
  "size",
  "quantity",
  "weight",
  "finalWeight",
  "remark",
  "soldPrice",
  "materialCost",
  "priority",
  "shipBy",
  "stage",
  "cancelled",
  "productionNotes",
  "returned",
  "returnReason",
  "returnDate",
  "refundType",
  "refundAmount",
  "refundDate",
  "createdAt",
  "updatedAt",
];

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function ordersToCSV(orders: Order[]): string {
  const header = COLUMNS.join(",");
  const rows = orders.map((o) => COLUMNS.map((c) => escapeCell(o[c])).join(","));
  return [header, ...rows].join("\n");
}

/**
 * Parses raw CSV text into rows of cells, respecting quoted fields that
 * contain commas or literal newlines (e.g. the multi-line shipping address).
 * Splitting on \n before parsing quotes would corrupt those fields.
 */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cur);
      cur = "";
    } else if (ch === "\r") {
      // skip; \n handled below
    } else if (ch === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

const NUMERIC_FIELDS = new Set(["quantity", "weight", "finalWeight", "soldPrice", "materialCost", "refundAmount"]);
const BOOLEAN_FIELDS = new Set(["cancelled", "returned"]);

/** Parses a CSV file exported by ordersToCSV back into partial Order objects. */
export function csvToOrders(text: string): Record<string, unknown>[] {
  const parsed = parseCSV(text);
  if (parsed.length === 0) return [];

  const [header, ...dataRows] = parsed;
  return dataRows.map((cells) => {
    const row: Record<string, unknown> = {};
    header.forEach((key, idx) => {
      const raw = cells[idx];
      if (raw === undefined || raw === "") {
        row[key] = null;
        return;
      }
      if (NUMERIC_FIELDS.has(key)) {
        row[key] = Number(raw);
      } else if (BOOLEAN_FIELDS.has(key)) {
        row[key] = raw === "true";
      } else {
        row[key] = raw;
      }
    });
    return row;
  });
}
