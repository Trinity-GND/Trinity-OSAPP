"use client";

import { useRef, useState } from "react";
import { compressImage } from "@/lib/image";

export default function ReceiptScanButton({
  year,
  month,
  onSaved,
}: {
  year: number;
  month: number;
  onSaved: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [review, setReview] = useState<{
    imagePath: string;
    category: string;
    amount: string;
    warning?: string;
  } | null>(null);

  async function handleFile(file: File) {
    setScanning(true);
    setError(null);
    try {
      const compressed = await compressImage(file);
      const form = new FormData();
      form.append("file", compressed, "receipt.jpg");
      const res = await fetch("/api/expenses/scan-receipt", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to scan receipt");

      setReview({
        imagePath: body.imagePath,
        category: body.extracted?.summary || body.extracted?.vendor || "",
        amount: body.extracted?.total ? String(body.extracted.total) : "",
        warning: body.warning,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to scan receipt");
    } finally {
      setScanning(false);
    }
  }

  async function confirmSave() {
    if (!review) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          month,
          category: review.category,
          amount: Number(review.amount) || 0,
          receiptImagePath: review.imagePath,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to save expense");
      }
      setReview(null);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save expense");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={scanning}
        className="text-xs px-3 py-1.5 rounded-md border border-border-warm bg-card hover:bg-cream disabled:opacity-50"
      >
        {scanning ? "Reading receipt..." : "Scan Receipt"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {error && <p className="text-xs text-danger mt-1">{error}</p>}

      {review && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border-warm rounded-lg p-5 max-w-sm w-full space-y-3">
            <h3 className="font-display text-lg font-bold text-ink">Confirm Expense</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={review.imagePath}
              alt="Receipt"
              className="w-full max-h-48 object-contain rounded border border-border-warm bg-cream"
            />
            {review.warning && <p className="text-xs text-danger">{review.warning}</p>}
            <label className="block space-y-1">
              <span className="text-xs text-muted">Category / Note</span>
              <input
                className="w-full border border-border-warm bg-cream rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                value={review.category}
                onChange={(e) => setReview({ ...review, category: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-muted">Amount (₹)</span>
              <input
                type="number"
                className="w-full border border-border-warm bg-cream rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                value={review.amount}
                onChange={(e) => setReview({ ...review, amount: e.target.value })}
              />
            </label>
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReview(null)}
                className="px-3 py-1.5 text-sm rounded-md border border-border-warm hover:bg-cream"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSave}
                disabled={saving}
                className="px-3 py-1.5 text-sm rounded-md bg-gold text-navy font-medium hover:bg-gold-dark disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Expense"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
