"use client";

import { useState } from "react";

export default function ReturnModal({
  jobId,
  soldPrice,
  onClose,
  onSubmit,
}: {
  jobId: string;
  soldPrice: number | null;
  onClose: () => void;
  onSubmit: (data: { returnReason: string; refundType: string; refundAmount?: number }) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [refundType, setRefundType] = useState("none");
  const [refundAmount, setRefundAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!reason.trim()) {
      setError("Return reason is required");
      return;
    }
    if (refundType === "partial" && !(Number(refundAmount) > 0)) {
      setError("Enter a refund amount");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        returnReason: reason.trim(),
        refundType,
        refundAmount: refundType === "partial" ? Number(refundAmount) : undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save return");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg p-6 w-full max-w-md space-y-4 border border-border-warm">
        <h2 className="font-display text-lg font-bold text-ink">Mark {jobId} as returned</h2>

        <div>
          <label className="text-sm font-medium text-ink">Return reason (required)</label>
          <textarea
            className="w-full border border-border-warm bg-cream rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Refund type</label>
          <select
            className="w-full border border-border-warm bg-cream rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            value={refundType}
            onChange={(e) => setRefundType(e.target.value)}
          >
            <option value="none">None</option>
            <option value="full">Full{soldPrice != null ? ` ($${soldPrice})` : ""}</option>
            <option value="partial">Partial</option>
          </select>
        </div>

        {refundType === "partial" && (
          <div>
            <label className="text-sm font-medium text-ink">Refund amount (USD)</label>
            <input
              type="number"
              className="w-full border border-border-warm bg-cream rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
            />
          </div>
        )}

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-md border border-border-warm hover:bg-cream"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-md bg-danger text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Mark Returned"}
          </button>
        </div>
      </div>
    </div>
  );
}
