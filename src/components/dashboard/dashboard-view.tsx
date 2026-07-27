"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Order, STAGES, STAGE_LABELS } from "@/types/order";

const BOARD_COLUMNS: { key: string; label: string }[] = [
  { key: "pending", label: "Pending" },
  ...STAGES.map((s) => ({ key: s, label: STAGE_LABELS[s] })),
];

type DashboardData = {
  stats: { todaysOrders: number; inProduction: number; readyToDispatch: number; overdue: number };
  overdueOrders: Order[];
  board: Record<string, Order[]>;
};

export default function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error();
        const body = await res.json();
        if (!cancelled) {
          setData(body);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Couldn't refresh the dashboard — showing the last loaded data.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return <p className="p-6 text-muted">{error ?? "Loading..."}</p>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>

      {error && (
        <p className="text-sm text-danger bg-danger-bg border border-danger/30 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's Orders" value={data.stats.todaysOrders} accent="gold" />
        <StatCard label="In Production" value={data.stats.inProduction} accent="gold" />
        <StatCard label="Ready to Dispatch" value={data.stats.readyToDispatch} accent="success" />
        <StatCard label="Overdue" value={data.stats.overdue} accent="danger" />
      </div>

      {data.overdueOrders.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
            Needs Attention
          </h2>
          <div className="border border-border-warm rounded-lg overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-cream text-left text-xs text-muted uppercase tracking-wide">
                <tr>
                  <th className="p-2">Job ID</th>
                  <th className="p-2">Buyer</th>
                  <th className="p-2">Ship By</th>
                </tr>
              </thead>
              <tbody>
                {data.overdueOrders.map((o) => (
                  <tr key={o.id} className="border-t border-border-warm">
                    <td className="p-2">
                      <Link href={`/orders/${o.id}`} className="hover:underline font-medium text-ink">
                        {o.id}
                      </Link>
                    </td>
                    <td className="p-2">{o.buyerName ?? "—"}</td>
                    <td className="p-2">{o.shipBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
          Production Board
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {BOARD_COLUMNS.map((col) => (
            <div key={col.key} className="border border-border-warm rounded-lg bg-cream p-2 min-h-[120px]">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                {col.label} ({data.board[col.key]?.length ?? 0})
              </p>
              <div className="space-y-2">
                {(data.board[col.key] ?? []).map((o) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="block bg-card border border-border-warm rounded-md p-2 text-xs hover:shadow-sm hover:border-gold transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {o.imagePath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.imagePath} alt="" className="w-6 h-6 object-cover rounded" />
                      ) : (
                        <div className="w-6 h-6 rounded bg-cream" />
                      )}
                      <div>
                        <p className="font-medium text-ink">{o.id}</p>
                        <p className="text-muted">{o.buyerName ?? "—"}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const ACCENT_BORDER: Record<string, string> = {
  gold: "border-l-gold",
  success: "border-l-success",
  danger: "border-l-danger",
};

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "gold" | "success" | "danger";
}) {
  return (
    <div className={`bg-card border border-border-warm border-l-4 ${ACCENT_BORDER[accent]} rounded-lg p-4`}>
      <p className="text-xs text-muted uppercase tracking-wide font-medium">{label}</p>
      <p className="font-display text-3xl font-bold text-ink mt-1">{value}</p>
    </div>
  );
}
