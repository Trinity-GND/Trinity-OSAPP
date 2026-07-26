"use client";

import { useState } from "react";

const PRESETS = [
  { value: "today", label: "Today's Orders" },
  { value: "delayed", label: "Delayed / Overdue" },
  { value: "inCad", label: "In CAD" },
  { value: "inProduction", label: "In Production" },
];

export default function OrdersReportButton({ selectedIds }: { selectedIds: string[] }) {
  const [preset, setPreset] = useState("today");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setLoading(true);
    setError(null);
    try {
      const body =
        preset === "selected" ? { preset: "selected", ids: selectedIds } : { preset };
      const res = await fetch("/api/orders-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const b = await res.json();
        throw new Error(b.error ?? "Failed to build report");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "trinity-os-orders-report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to build report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="border rounded px-2 py-1.5 text-xs"
        value={preset}
        onChange={(e) => setPreset(e.target.value)}
      >
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
        {selectedIds.length > 0 && <option value="selected">Selected Orders ({selectedIds.length})</option>}
      </select>
      <button
        onClick={download}
        disabled={loading}
        className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
      >
        {loading ? "Building..." : "Orders Report"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
