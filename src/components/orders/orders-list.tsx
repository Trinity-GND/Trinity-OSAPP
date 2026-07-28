"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Order, OrderType, STAGES, STAGE_LABELS, Stage } from "@/types/order";
import { nextStage, statusLabel, delayLabel } from "@/lib/orders/pipeline";
import ReturnModal from "./return-modal";
import FinalWeightModal from "./final-weight-modal";
import DeleteOrderModal from "./delete-order-modal";
import ConfirmModal from "@/components/ui/confirm-modal";
import CsvTools from "./csv-tools";
import OrdersReportButton from "./orders-report-button";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  ...STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] })),
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersList({ role, orderType }: { role: "owner" | "employee"; orderType: OrderType }) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [printingCards, setPrintingCards] = useState(false);

  const [advancing, setAdvancing] = useState<{ order: Order; stage: Stage } | null>(null);
  const [confirming, setConfirming] = useState<{ order: Order; stage: Stage } | null>(null);
  const [returning, setReturning] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState<Order | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("orderType", orderType);
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    try {
      const res = await fetch(`/api/orders?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load orders");
      const body = await res.json();
      setOrders(body.orders);
      setLoadError(null);
    } catch {
      // Keep showing the last-known-good list; never treat a failed fetch as "no orders."
      setLoadError("Couldn't refresh orders — showing the last loaded list. Retrying...");
    } finally {
      setLoading(false);
    }
  }, [orderType, search, status, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function handleAdvance(order: Order, stage: Stage, finalWeight?: number) {
    setActionError(null);
    const res = await fetch(`/api/orders/${order.id}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, finalWeight }),
    });
    const body = await res.json();
    if (!res.ok) {
      setActionError(body.error ?? "Failed to advance stage");
      throw new Error(body.error);
    }
    setOrders((prev) => prev.map((o) => (o.id === order.id ? body.order : o)));
  }

  function requestAdvance(order: Order) {
    const stage = nextStage(order);
    if (!stage) return;
    if (stage === "readyToDispatch") {
      setAdvancing({ order, stage });
      return;
    }
    setConfirming({ order, stage });
  }

  async function submitReturn(data: { returnReason: string; refundType: string; refundAmount?: number }) {
    if (!returning) return;
    const res = await fetch(`/api/orders/${returning.id}/return`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Failed to save return");
    setOrders((prev) => prev.map((o) => (o.id === returning.id ? body.order : o)));
    setReturning(null);
  }

  async function printSelectedJobCards() {
    setPrintingCards(true);
    setActionError(null);
    try {
      const res = await fetch("/api/job-cards/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to build job cards");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      // A real anchor click, not window.open() -- the spec flagged past
      // breakage from window.open()/print() being restricted in sandboxed
      // contexts, and this is the same pattern already proven reliable
      // for the Shipping Sheet download above.
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.download = "trinity-os-job-cards.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to build job cards");
    } finally {
      setPrintingCards(false);
    }
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const allSelected = orders.length > 0 && orders.every((o) => selected.has(o.id));
    setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.id)));
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">
          {orderType === "online" ? "Online Orders" : "Offline Orders"}
        </h1>
        <button
          onClick={() => router.push(`/orders/new?orderType=${orderType}`)}
          className="px-4 py-2 rounded-lg bg-gold text-navy text-sm font-medium hover:bg-gold-dark"
        >
          + New Order
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-muted mb-1">Search</label>
          <input
            className="border border-border-warm bg-card rounded-md px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-gold"
            placeholder="Job ID, buyer, brand, platform order #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Status</label>
          <select
            className="border border-border-warm bg-card rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Order date from</label>
          <input
            type="date"
            className="border border-border-warm bg-card rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">to</label>
          <input
            type="date"
            className="border border-border-warm bg-card rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        {selected.size > 0 && (
          <>
            <span className="text-sm text-muted">{selected.size} selected</span>
            <button
              onClick={printSelectedJobCards}
              disabled={printingCards}
              className="text-xs px-3 py-1.5 rounded-md border border-border-warm bg-card hover:bg-cream disabled:opacity-50"
            >
              {printingCards ? "Preparing..." : "Print Selected Job Cards"}
            </button>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <OrdersReportButton selectedIds={Array.from(selected)} />
          <CsvTools onImported={load} selectedIds={Array.from(selected)} />
        </div>
      </div>

      {loadError && (
        <p className="text-sm text-danger bg-danger-bg border border-danger/30 rounded-md px-3 py-2">
          {loadError}
        </p>
      )}
      {actionError && (
        <p className="text-sm text-danger bg-danger-bg border border-danger/30 rounded-md px-3 py-2">
          {actionError}
        </p>
      )}

      <div className="overflow-x-auto border border-border-warm rounded-lg bg-card">
        <table className="w-full text-sm">
          <thead className="bg-cream text-left text-xs text-muted uppercase tracking-wide">
            <tr>
              <th className="p-2 w-8">
                <input
                  type="checkbox"
                  checked={orders.length > 0 && orders.every((o) => selected.has(o.id))}
                  onChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th className="p-2 w-14">Photo</th>
              <th className="p-2">Job ID</th>
              <th className="p-2">Platform Order #</th>
              <th className="p-2">Brand</th>
              <th className="p-2">Buyer</th>
              <th className="p-2">Order Date</th>
              <th className="p-2">Ship By</th>
              <th className="p-2">Status</th>
              <th className="p-2">Return</th>
              <th className="p-2">Delay</th>
              <th className="p-2">Next Step</th>
              <th className="p-2"></th>
              {role === "owner" && <th className="p-2"></th>}
            </tr>
          </thead>
          <tbody>
            {loading && orders.length === 0 && (
              <tr>
                <td colSpan={14} className="p-4 text-center text-muted">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={14} className="p-4 text-center text-muted">
                  No orders yet.
                </td>
              </tr>
            )}
            {orders.map((order) => {
              const next = nextStage(order);
              return (
                <tr key={order.id} className="border-t border-border-warm">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selected.has(order.id)}
                      onChange={() => toggleSelected(order.id)}
                    />
                  </td>
                  <td className="p-2">
                    {order.imagePath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={order.imagePath} alt="" className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-cream" />
                    )}
                  </td>
                  <td className="p-2 font-medium">
                    <Link href={`/orders/${order.id}`} className="hover:underline text-ink">
                      {order.id}
                    </Link>
                  </td>
                  <td className="p-2">{order.platformOrderNumber ?? "—"}</td>
                  <td className="p-2">{order.brand ?? "—"}</td>
                  <td className="p-2">{order.buyerName ?? "—"}</td>
                  <td className="p-2">{formatDate(order.orderDate)}</td>
                  <td className="p-2">{order.shipBy ? formatDate(order.shipBy) : "—"}</td>
                  <td className="p-2">{statusLabel(order)}</td>
                  <td className="p-2">
                    {!order.returned && !order.cancelled ? (
                      <button
                        onClick={() => setReturning(order)}
                        className="text-xs px-2 py-1 rounded-md border border-border-warm hover:bg-cream"
                      >
                        Mark Returned
                      </button>
                    ) : order.returned ? (
                      <span className="text-xs text-muted">Returned</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-2">
                    <span
                      className={
                        delayLabel(order) === "Overdue" || delayLabel(order).includes("late")
                          ? "text-danger font-medium"
                          : ""
                      }
                    >
                      {delayLabel(order)}
                    </span>
                  </td>
                  <td className="p-2">
                    {next && !order.returned ? (
                      <button
                        onClick={() => requestAdvance(order)}
                        className="text-xs px-2 py-1 rounded-md bg-gold text-navy font-medium hover:bg-gold-dark"
                      >
                        → {STAGE_LABELS[next]}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-xs px-2 py-1 rounded-md border border-border-warm hover:bg-cream"
                    >
                      View
                    </Link>
                  </td>
                  {role === "owner" && (
                    <td className="p-2">
                      <button
                        onClick={() => setDeleting(order)}
                        className="text-xs px-2 py-1 rounded-md border border-danger/30 text-danger hover:bg-danger-bg"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {advancing && (
        <FinalWeightModal
          jobId={advancing.order.id}
          onClose={() => setAdvancing(null)}
          onSubmit={async (finalWeight) => {
            await handleAdvance(advancing.order, advancing.stage, finalWeight);
            setAdvancing(null);
          }}
        />
      )}

      {confirming && (
        <ConfirmModal
          message={`Move ${confirming.order.id} to ${STAGE_LABELS[confirming.stage]}?`}
          onClose={() => setConfirming(null)}
          onConfirm={async () => {
            await handleAdvance(confirming.order, confirming.stage);
            setConfirming(null);
          }}
        />
      )}

      {returning && (
        <ReturnModal
          jobId={returning.id}
          soldPrice={returning.soldPrice}
          onClose={() => setReturning(null)}
          onSubmit={submitReturn}
        />
      )}

      {deleting && (
        <DeleteOrderModal
          jobId={deleting.id}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            const res = await fetch(`/api/orders/${deleting.id}`, { method: "DELETE" });
            if (!res.ok) {
              const body = await res.json();
              throw new Error(body.error ?? "Failed to delete order");
            }
            setOrders((prev) => prev.filter((o) => o.id !== deleting.id));
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
