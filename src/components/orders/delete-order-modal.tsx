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
      <div className="bg-white rounded-lg p-6 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-semibold text-red-700">Permanently delete {jobId}?</h2>
        <p className="text-sm text-gray-600">
          This cannot be undone — the order, its history, and its photo will be gone for good.
          This is meant for cleaning up test/trial orders, not real customer orders.
        </p>
        <div>
          <label className="text-sm font-medium">
            Type <span className="font-mono">{jobId}</span> to confirm
          </label>
          <input
            autoFocus
            className="w-full border rounded px-3 py-2 mt-1 text-sm font-mono"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={!matches || submitting}
            className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
          >
            {submitting ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
