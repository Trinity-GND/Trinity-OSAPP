"use client";

import { useEffect, useState } from "react";
import ConfirmModal from "@/components/ui/confirm-modal";

type Member = { id: string; name: string; role: "owner" | "employee"; active: boolean; created_at: string };

export default function TeamPanel() {
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<"owner" | "employee">("employee");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/team");
      if (!res.ok) throw new Error();
      const body = await res.json();
      setMembers(body.members);
      setError(null);
    } catch {
      setError("Couldn't load team members.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be 4 digits");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pin, role }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to add member");
      setName("");
      setPin("");
      setRole("employee");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add member");
    } finally {
      setAdding(false);
    }
  }

  async function updateMember(id: string, patch: Record<string, unknown>) {
    setError(null);
    const res = await fetch(`/api/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to update member");
      return;
    }
    await load();
  }

  async function removeMember(id: string) {
    setError(null);
    const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? "Failed to remove member");
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
              <th className="p-2">Name</th>
              <th className="p-2">Role</th>
              <th className="p-2">Status</th>
              <th className="p-2">Reset PIN</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t border-border-warm">
                <td className="p-2">{m.name}</td>
                <td className="p-2">
                  <select
                    className="border border-border-warm bg-cream rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gold"
                    value={m.role}
                    onChange={(e) => updateMember(m.id, { role: e.target.value })}
                  >
                    <option value="owner">Owner</option>
                    <option value="employee">Employee</option>
                  </select>
                </td>
                <td className="p-2">
                  <button
                    onClick={() => updateMember(m.id, { active: !m.active })}
                    className="text-xs px-2 py-1 rounded-md border border-border-warm hover:bg-cream"
                  >
                    {m.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-2">
                  <ResetPin onReset={(newPin) => updateMember(m.id, { pin: newPin })} />
                </td>
                <td className="p-2">
                  <button
                    onClick={() => setRemoving(m)}
                    className="text-xs px-2 py-1 rounded-md border border-danger/30 hover:bg-danger-bg text-danger"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={addMember}
        className="flex flex-wrap items-end gap-2 border border-border-warm bg-card rounded-lg p-3"
      >
        <div>
          <label className="block text-xs text-muted">Name</label>
          <input
            className="border border-border-warm bg-cream rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-muted">4-digit PIN</label>
          <input
            className="border border-border-warm bg-cream rounded-md px-2 py-1 text-sm w-24 focus:outline-none focus:ring-1 focus:ring-gold"
            value={pin}
            maxLength={4}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div>
          <label className="block text-xs text-muted">Role</label>
          <select
            className="border border-border-warm bg-cream rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            value={role}
            onChange={(e) => setRole(e.target.value as "owner" | "employee")}
          >
            <option value="employee">Employee</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={adding}
          className="text-sm px-3 py-1.5 rounded-md bg-gold text-navy font-medium hover:bg-gold-dark disabled:opacity-50"
        >
          {adding ? "Adding..." : "Add Team Member"}
        </button>
      </form>

      {removing && (
        <ConfirmModal
          message={`Remove ${removing.name}? Their login history is kept.`}
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            await removeMember(removing.id);
            setRemoving(null);
          }}
        />
      )}
    </div>
  );
}

function ResetPin({ onReset }: { onReset: (pin: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-xs px-2 py-1 rounded-md border border-border-warm hover:bg-cream"
      >
        Set new PIN
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        className="border border-border-warm bg-cream rounded-md px-2 py-1 text-xs w-16 focus:outline-none focus:ring-1 focus:ring-gold"
        value={value}
        maxLength={4}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
      />
      <button
        onClick={() => {
          if (/^\d{4}$/.test(value)) {
            onReset(value);
            setEditing(false);
            setValue("");
          }
        }}
        className="text-xs px-2 py-1 rounded-md bg-gold text-navy font-medium"
      >
        Save
      </button>
    </div>
  );
}
