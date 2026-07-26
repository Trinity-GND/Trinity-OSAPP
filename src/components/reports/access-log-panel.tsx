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
    <div className="border rounded overflow-x-auto max-h-80 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-500 sticky top-0">
          <tr>
            <th className="p-2">Name</th>
            <th className="p-2">Role</th>
            <th className="p-2">Logged in</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="p-2">{e.name}</td>
              <td className="p-2">{e.role}</td>
              <td className="p-2">{new Date(e.logged_in_at).toLocaleString()}</td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={3} className="p-4 text-center text-gray-400">
                No logins yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
