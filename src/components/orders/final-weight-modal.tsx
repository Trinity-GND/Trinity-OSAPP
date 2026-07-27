"use client";

import { useState } from "react";

export default function FinalWeightModal({
  jobId,
  onClose,
  onSubmit,
}: {
  jobId: string;
  onClose: () => void;
  onSubmit: (finalWeight: number) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const num = Number(value);
    if (!num || num <= 0) {
      setError("Enter the final weight in grams");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(num);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg p-6 w-full max-w-sm space-y-4 border border-border-warm">
        <h2 className="font-display text-lg font-bold text-ink">Move {jobId} to Ready to Dispatch</h2>
        <p className="text-sm text-muted">Enter the final production weight to continue.</p>

        <div>
          <label className="text-sm font-medium text-ink">Final weight (grams)</label>
          <input
            type="number"
            autoFocus
            className="w-full border border-border-warm bg-cream rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

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
            className="px-4 py-2 text-sm rounded-md bg-gold text-navy font-medium hover:bg-gold-dark disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
