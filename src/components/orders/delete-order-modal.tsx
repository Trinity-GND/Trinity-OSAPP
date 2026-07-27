"use client";

import { useState } from "react";

export default function DeleteOrderModal({
  jobId,
  onClose,
  onConfirm,
}: {
  jobId: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const matches = typed === jobId;

  async function confirm() {
    if (!matches) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg p-6 w-full max-w-sm space-y-4 border border-border-warm">
        <h2 className="font-display text-lg font-bold text-danger">Permanently delete {jobId}?</h2>
        <p className="text-sm text-muted">
          This cannot be undone — the order, its history, and its photo will be gone for good.
          This is meant for cleaning up test/trial orders, not real customer orders.
        </p>
        <div>
          <label className="text-sm font-medium text-ink">
            Type <span className="font-mono">{jobId}</span> to confirm
          </label>
          <input
            autoFocus
            className="w-full border border-border-warm bg-cream rounded-md px-3 py-2 mt-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-danger"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
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
            onClick={confirm}
            disabled={!matches || submitting}
            className="px-4 py-2 text-sm rounded-md bg-danger text-white hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
