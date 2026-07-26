"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Order, STAGES, STAGE_LABELS, Stage } from "@/types/order";
import { nextStage, statusLabel, delayLabel } from "@/lib/orders/pipeline";
import ReturnModal from "./return-modal";
import FinalWeightModal from "./final-weight-modal";
import ConfirmModal from "@/components/ui/confirm-modal";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  ...STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] })),
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersList({ role }: { role: "owner" | "employee" }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [advancing, setAdvancing] = useState<{ order: Order; stage: Stage } | null>(null);
  const [confirming, setConfirming] = useState<{ order: Order; stage: Stage } | null>(null);
  const [returning, setReturning] = useState<Order | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
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
  }, [search, status, dateFrom, dateTo]);

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

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500">Search</label>
          <input
            className="border rounded px-3 py-1.5 text-sm w-64"
            placeholder="Job ID, buyer, brand, platform order #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Status</label>
          <select
            className="border rounded px-3 py-1.5 text-sm"
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
          <label className="block text-xs text-gray-500">Order date from</label>
          <input
            type="date"
            className="border rounded px-3 py-1.5 text-sm"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">to</label>
          <input
            type="date"
            className="border rounded px-3 py-1.5 text-sm"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        {selected.size > 0 && (
          <span className="text-sm text-gray-500">{selected.size} selected</span>
        )}
      </div>

      {loadError && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          {loadError}
        </p>
      )}
      {actionError && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {actionError}
        </p>
      )}

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="p-2 w-8"></th>
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
            </tr>
          </thead>
          <tbody>
            {loading && orders.length === 0 && (
              <tr>
                <td colSpan={13} className="p-4 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={13} className="p-4 text-center text-gray-400">
                  No orders yet.
                </td>
              </tr>
            )}
            {orders.map((order) => {
              const next = nextStage(order);
              return (
                <tr key={order.id} className="border-t">
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
                      <div className="w-10 h-10 rounded bg-gray-100" />
                    )}
                  </td>
                  <td className="p-2 font-medium">
                    <Link href={`/orders/${order.id}`} className="hover:underline">
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
                        className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
                      >
                        Mark Returned
                      </button>
                    ) : order.returned ? (
                      <span className="text-xs text-gray-500">Returned</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-2">{delayLabel(order)}</td>
                  <td className="p-2">
                    {next && !order.returned ? (
                      <button
                        onClick={() => requestAdvance(order)}
                        className="text-xs px-2 py-1 rounded bg-black text-white hover:bg-gray-800"
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
                      className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
                    >
                      View
                    </Link>
                  </td>
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
