"use client";

import { useEffect, useState } from "react";

type Entry = { id: number; name: string; role: string; logged_in_at: string };

export default function AccessLogPanel() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    fetch("/api/access-log")
      .then((r) => r.json())
      .then((body) => setEntries(body.entries ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="border border-border-warm rounded-lg overflow-x-auto max-h-80 overflow-y-auto bg-card">
      <table className="w-full text-sm">
        <thead className="bg-cream text-left text-xs text-muted uppercase tracking-wide sticky top-0">
          <tr>
            <th className="p-2">Name</th>
            <th className="p-2">Role</th>
            <th className="p-2">Logged in</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-t border-border-warm">
              <td className="p-2">{e.name}</td>
              <td className="p-2">{e.role}</td>
              <td className="p-2">{new Date(e.logged_in_at).toLocaleString()}</td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={3} className="p-4 text-center text-muted">
                No logins yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
