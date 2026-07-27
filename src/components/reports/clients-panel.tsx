"use client";

import { useEffect, useState } from "react";
import ConfirmModal from "@/components/ui/confirm-modal";

type Client = { id: string; code: string; name: string };

export default function ClientsPanel() {
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Client | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error();
      const body = await res.json();
      setClients(body.clients);
      setError(null);
    } catch {
      setError("Couldn't load clients.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addClient(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!code.trim() || !name.trim()) {
      setError("Code and name are required");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to add client");
      setCode("");
      setName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add client");
    } finally {
      setAdding(false);
    }
  }

  async function removeClient(id: string) {
    setError(null);
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? "Failed to remove client");
    }
    await load();
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="border border-border-warm rounded-lg overflow-x-auto bg-card">
        <table className="w-full text-sm">
          <thead className="bg-cream text-left text-xs text-muted uppercase tracking-wide">
            <tr>
              <th className="p-2">Code</th>
              <th className="p-2">Name</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-t border-border-warm">
                <td className="p-2 font-mono">{c.code}</td>
                <td className="p-2">{c.name}</td>
                <td className="p-2">
                  <button
                    onClick={() => setRemoving(c)}
                    className="text-xs px-2 py-1 rounded-md border border-danger/30 hover:bg-danger-bg text-danger"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-muted">
                  No clients yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={addClient}
        className="flex flex-wrap items-end gap-2 border border-border-warm bg-card rounded-lg p-3"
      >
        <div>
          <label className="block text-xs text-muted">Code</label>
          <input
            className="border border-border-warm bg-cream rounded-md px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gold"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="GSC"
          />
        </div>
        <div>
          <label className="block text-xs text-muted">Full Name</label>
          <input
            className="border border-border-warm bg-cream rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Gajanan Silver"
          />
        </div>
        <button
          type="submit"
          disabled={adding}
          className="text-sm px-3 py-1.5 rounded-md bg-gold text-navy font-medium hover:bg-gold-dark disabled:opacity-50"
        >
          {adding ? "Adding..." : "Add Client"}
        </button>
      </form>

      {removing && (
        <ConfirmModal
          message={`Remove client "${removing.code} — ${removing.name}"? Existing orders keep their Brand text as-is.`}
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            await removeClient(removing.id);
            setRemoving(null);
          }}
        />
      )}
    </div>
  );
}
