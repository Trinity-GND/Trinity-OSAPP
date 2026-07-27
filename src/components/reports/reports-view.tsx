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
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all");

  async function load() {
    try {
      const params = filter !== "all" ? `?orderType=${filter}` : "";
      const res = await fetch(`/api/reports${params}`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

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
    return <p className="p-6 text-muted">{error ?? "Loading..."}</p>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">Reports</h1>
        <div className="inline-flex rounded-md border border-border-warm overflow-hidden">
          {(["all", "online", "offline"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm capitalize ${
                filter === f ? "bg-gold text-navy font-medium" : "bg-card text-ink hover:bg-cream"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-danger bg-danger-bg border border-danger/30 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card label="Total Revenue" value={`$${data.summary.totalRevenue.toFixed(2)}`} accent="gold" />
        <Card label="Total Cost" value={`$${data.summary.totalCost.toFixed(2)}`} accent="gold" />
        <Card
          label="Total Profit"
          value={`$${data.summary.totalProfit.toFixed(2)}`}
          accent={data.summary.totalProfit < 0 ? "danger" : "success"}
        />
        <Card label="Total Refunded" value={`$${data.summary.totalRefunded.toFixed(2)}`} accent="gold" />
        <Card
          label="Orders Overdue"
          value={String(data.summary.ordersOverdue)}
          accent={data.summary.ordersOverdue > 0 ? "danger" : "success"}
        />
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Labor Rate</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">$</span>
          <input
            type="number"
            step="0.01"
            className="border border-border-warm bg-card rounded-md px-2 py-1 text-sm w-32 focus:outline-none focus:ring-1 focus:ring-gold"
            value={laborRateInput}
            onChange={(e) => setLaborRateInput(e.target.value)}
          />
          <span className="text-sm text-muted">per gram</span>
          <button
            onClick={saveLaborRate}
            disabled={savingRate}
            className="text-sm px-3 py-1.5 rounded-md bg-gold text-navy font-medium hover:bg-gold-dark disabled:opacity-50"
          >
            {savingRate ? "Saving..." : "Save"}
          </button>
          {rateSaved && <span className="text-sm text-success">Saved.</span>}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Profit by SKU/Category</h2>
        <div className="border border-border-warm rounded-lg overflow-x-auto bg-card">
          <table className="w-full text-sm">
            <thead className="bg-cream text-left text-xs text-muted uppercase tracking-wide">
              <tr>
                <th className="p-2">Item</th>
                <th className="p-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {data.profitByItem.map((row) => (
                <tr key={row.label} className="border-t border-border-warm">
                  <td className="p-2">{row.label}</td>
                  <td
                    className={`p-2 ${
                      row.profit != null ? (row.profit < 0 ? "text-danger" : "text-success") : "text-muted"
                    }`}
                  >
                    {row.profit != null ? `$${row.profit.toFixed(2)}` : "not set"}
                  </td>
                </tr>
              ))}
              {data.profitByItem.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-4 text-center text-muted">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
          Production Delay {data.delay.averageDelayDays != null && `(avg ${data.delay.averageDelayDays.toFixed(1)}d)`}
        </h2>
        <div className="border border-border-warm rounded-lg overflow-x-auto bg-card">
          <table className="w-full text-sm">
            <thead className="bg-cream text-left text-xs text-muted uppercase tracking-wide">
              <tr>
                <th className="p-2">Job ID</th>
                <th className="p-2">Buyer</th>
                <th className="p-2">Ship By</th>
                <th className="p-2">Delay</th>
              </tr>
            </thead>
            <tbody>
              {data.delay.rows.map((row) => (
                <tr key={row.id} className="border-t border-border-warm">
                  <td className="p-2">{row.id}</td>
                  <td className="p-2">{row.buyerName ?? "—"}</td>
                  <td className="p-2">{row.shipBy}</td>
                  <td className={`p-2 ${row.days > 0 ? "text-danger" : ""}`}>
                    {row.days > 0 ? `${row.days}d late` : row.days < 0 ? `${-row.days}d early` : "On time"}
                  </td>
                </tr>
              ))}
              {data.delay.rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted">
                    No dispatched orders with a ship-by date yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Returns &amp; Refunds</h2>
        <div className="border border-border-warm rounded-lg overflow-x-auto bg-card">
          <table className="w-full text-sm">
            <thead className="bg-cream text-left text-xs text-muted uppercase tracking-wide">
              <tr>
                <th className="p-2">Job ID</th>
                <th className="p-2">Buyer</th>
                <th className="p-2">Reason</th>
                <th className="p-2">Refund</th>
              </tr>
            </thead>
            <tbody>
              {data.returns.map((row) => (
                <tr key={row.id} className="border-t border-border-warm">
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
                  <td colSpan={4} className="p-4 text-center text-muted">
                    No returns yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
          Monthly Expenses &amp; Payroll
        </h2>
        <PayrollPanel />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Team Access</h2>
        <TeamPanel />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Recent Access Log</h2>
        <AccessLogPanel />
      </section>
    </div>
  );
}

const ACCENT_BORDER: Record<string, string> = {
  gold: "border-l-gold",
  success: "border-l-success",
  danger: "border-l-danger",
};

function Card({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "gold" | "success" | "danger";
}) {
  return (
    <div className={`bg-card border border-border-warm border-l-4 ${ACCENT_BORDER[accent]} rounded-lg p-4`}>
      <p className="text-xs text-muted uppercase tracking-wide font-medium">{label}</p>
      <p className="font-display text-xl font-bold text-ink mt-1">{value}</p>
    </div>
  );
}
