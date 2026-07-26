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
    return <p className="p-6 text-gray-400">{error ?? "Loading..."}</p>;
  }

  return (
    <div className="p-6 space-y-6">
      {error && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's Orders" value={data.stats.todaysOrders} />
        <StatCard label="In Production" value={data.stats.inProduction} />
        <StatCard label="Ready to Dispatch" value={data.stats.readyToDispatch} />
        <StatCard label="Overdue" value={data.stats.overdue} highlight={data.stats.overdue > 0} />
      </div>

      {data.overdueOrders.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Needs Attention
          </h2>
          <div className="border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="p-2">Job ID</th>
                  <th className="p-2">Buyer</th>
                  <th className="p-2">Ship By</th>
                </tr>
              </thead>
              <tbody>
                {data.overdueOrders.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-2">
                      <Link href={`/orders/${o.id}`} className="hover:underline font-medium">
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
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Production Board
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {BOARD_COLUMNS.map((col) => (
            <div key={col.key} className="border rounded bg-gray-50 p-2 min-h-[120px]">
              <p className="text-xs font-medium text-gray-500 mb-2">
                {col.label} ({data.board[col.key]?.length ?? 0})
              </p>
              <div className="space-y-2">
                {(data.board[col.key] ?? []).map((o) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="block bg-white border rounded p-2 text-xs hover:shadow"
                  >
                    <div className="flex items-center gap-2">
                      {o.imagePath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.imagePath} alt="" className="w-6 h-6 object-cover rounded" />
                      ) : (
                        <div className="w-6 h-6 rounded bg-gray-100" />
                      )}
                      <div>
                        <p className="font-medium">{o.id}</p>
                        <p className="text-gray-500">{o.buyerName ?? "—"}</p>
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

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`border rounded p-4 ${highlight ? "bg-red-50 border-red-200" : ""}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-semibold ${highlight ? "text-red-700" : ""}`}>{value}</p>
    </div>
  );
}
