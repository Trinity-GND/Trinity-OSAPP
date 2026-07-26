"use client";

import { useRef, useState } from "react";

export default function CsvTools({ onImported }: { onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sheetMessage, setSheetMessage] = useState<string | null>(null);
  const [sheetLoading, setSheetLoading] = useState(false);

  async function downloadShippingSheet() {
    setSheetLoading(true);
    setSheetMessage(null);
    try {
      const res = await fetch("/api/orders/shipping-sheet");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to build shipping sheet");

      const blob = new Blob([body.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trinity-os-shipping-sheet-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      setSheetMessage(
        body.skipped > 0
          ? `Downloaded — skipped ${body.skipped} order(s) without Final Weight.`
          : `Downloaded ${body.included} order(s).`,
      );
    } catch (e) {
      setSheetMessage(e instanceof Error ? e.message : "Failed to build shipping sheet");
    } finally {
      setSheetLoading(false);
    }
  }

  async function handleFile(file: File) {
    setImporting(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/orders/import", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Import failed");
      setMessage(`Imported ${body.imported} new order(s). Skipped ${body.skipped} already present.`);
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href="/api/orders/export"
        className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100"
      >
        Export CSV
      </a>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={importing}
        className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
      >
        {importing ? "Importing..." : "Import CSV"}
      </button>
      <button
        type="button"
        onClick={downloadShippingSheet}
        disabled={sheetLoading}
        className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
      >
        {sheetLoading ? "Building..." : "Shipping Sheet"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {message && <span className="text-xs text-green-700">{message}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
      {sheetMessage && <span className="text-xs text-gray-600">{sheetMessage}</span>}
    </div>
  );
}
