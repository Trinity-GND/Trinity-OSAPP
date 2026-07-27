"use client";

import { useState } from "react";

export default function ConfirmModal({
  message,
  onClose,
  onConfirm,
}: {
  message: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function confirm() {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg p-6 w-full max-w-sm space-y-4 border border-border-warm">
        <p className="text-sm text-ink">{message}</p>
        {error && <p className="text-danger text-sm">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-md border border-border-warm hover:bg-cream"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
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
