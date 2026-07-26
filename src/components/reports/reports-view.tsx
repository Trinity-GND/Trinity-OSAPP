"use client";

import { useEffect, useState } from "react";
import TeamPanel from "./team-panel";
import AccessLogPanel from "./access-log-panel";
import PayrollPanel from "./payroll-panel";

type ReportData = {
  summary: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    totalRefunded: number;
    ordersOverdue: number;
  };
  profitByItem: { label: string; profit: number | null }[];
  delay: { rows: { id: string; buyerName: string | null; shipBy: string; days: number }[]; averageDelayDays: number | null };
  returns: { id: string; buyerName: string | null; returnReason: string | null; refundType: string; refundAmount: number | null }[];
  laborRate: number;
};

export default function ReportsView() {
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [laborRateInput, setLaborRateInput] = useState("");
  const [savingRate, setSavingRate] = useState(false);
  const [rateSaved, setRateSaved] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error();
      const body = await res.json();
      setData(body);
      setLaborRateInput(String(body.laborRate));
      setError(null);
    } catch {
      setError("Couldn't refresh reports — showing the last loaded data.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveLaborRate() {
    setSavingRate(true);
    setRateSaved(false);
    try {
      const res = await fetch("/api/settings/labor-rate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ laborRate: Number(laborRateInput) }),
      });
      if (!res.ok) throw new Error();
      setRateSaved(true);
      await load();
    } catch {
      setError("Failed to save labor rate");
    } finally {
      setSavingRate(false);
    }
  }

  if (!data) {
    return <p className="p-6 text-gray-400">{error ?? "Loading..."}</p>;
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      {error && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card label="Total Revenue" value={`$${data.summary.totalRevenue.toFixed(2)}`} />
        <Card label="Total Cost" value={`$${data.summary.totalCost.toFixed(2)}`} />
        <Card label="Total Profit" value={`$${data.summary.totalProfit.toFixed(2)}`} />
        <Card label="Total Refunded" value={`$${data.summary.totalRefunded.toFixed(2)}`} />
        <Card label="Orders Overdue" value={String(data.summary.ordersOverdue)} highlight={data.summary.ordersOverdue > 0} />
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Labor Rate</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">$</span>
          <input
            type="number"
            step="0.01"
            className="border rounded px-2 py-1 text-sm w-32"
            value={laborRateInput}
            onChange={(e) => setLaborRateInput(e.target.value)}
          />
          <span className="text-sm text-gray-500">per gram</span>
          <button
            onClick={saveLaborRate}
            disabled={savingRate}
            className="text-sm px-3 py-1.5 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {savingRate ? "Saving..." : "Save"}
          </button>
          {rateSaved && <span className="text-sm text-green-700">Saved.</span>}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Profit by SKU/Category</h2>
        <div className="border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="p-2">Item</th>
                <th className="p-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {data.profitByItem.map((row) => (
                <tr key={row.label} className="border-t">
                  <td className="p-2">{row.label}</td>
                  <td className="p-2">{row.profit != null ? `$${row.profit.toFixed(2)}` : "not set"}</td>
                </tr>
              ))}
              {data.profitByItem.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-4 text-center text-gray-400">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Production Delay {data.delay.averageDelayDays != null && `(avg ${data.delay.averageDelayDays.toFixed(1)}d)`}
        </h2>
        <div className="border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="p-2">Job ID</th>
                <th className="p-2">Buyer</th>
                <th className="p-2">Ship By</th>
                <th className="p-2">Delay</th>
              </tr>
            </thead>
            <tbody>
              {data.delay.rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-2">{row.id}</td>
                  <td className="p-2">{row.buyerName ?? "—"}</td>
                  <td className="p-2">{row.shipBy}</td>
                  <td className="p-2">{row.days > 0 ? `${row.days}d late` : row.days < 0 ? `${-row.days}d early` : "On time"}</td>
                </tr>
              ))}
              {data.delay.rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    No dispatched orders with a ship-by date yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Returns & Refunds</h2>
        <div className="border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="p-2">Job ID</th>
                <th className="p-2">Buyer</th>
                <th className="p-2">Reason</th>
                <th className="p-2">Refund</th>
              </tr>
            </thead>
            <tbody>
              {data.returns.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-2">{row.id}</td>
                  <td className="p-2">{row.buyerName ?? "—"}</td>
                  <td className="p-2">{row.returnReason}</td>
                  <td className="p-2">
                    {row.refundType}
                    {row.refundAmount != null ? ` — $${row.refundAmount}` : ""}
                  </td>
                </tr>
              ))}
              {data.returns.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    No returns yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Monthly Expenses &amp; Payroll
        </h2>
        <PayrollPanel />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Team Access</h2>
        <TeamPanel />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent Access Log</h2>
        <AccessLogPanel />
      </section>
    </div>
  );
}

function Card({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`border rounded p-4 ${highlight ? "bg-red-50 border-red-200" : ""}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-semibold ${highlight ? "text-red-700" : ""}`}>{value}</p>
    </div>
  );
}
