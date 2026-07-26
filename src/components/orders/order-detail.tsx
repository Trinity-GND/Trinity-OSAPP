"use client";

import { useCallback, useEffect, useState } from "react";
import { Order, Stage, STAGE_LABELS } from "@/types/order";
import { Costing } from "@/lib/costing";
import { nextStage, statusLabel, delayLabel } from "@/lib/orders/pipeline";
import OrderForm from "./order-form";
import ReturnModal from "./return-modal";
import FinalWeightModal from "./final-weight-modal";
import ConfirmModal from "@/components/ui/confirm-modal";

export default function OrderDetail({
  orderId,
  role,
  defaultEmployee,
}: {
  orderId: string;
  role: "owner" | "employee";
  defaultEmployee: string;
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [costing, setCosting] = useState<Costing | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [advancing, setAdvancing] = useState<Stage | null>(null);
  const [confirming, setConfirming] = useState<Stage | null>(null);
  const [returning, setReturning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to load order");
      const body = await res.json();
      setOrder(body.order);
      setCosting(body.costing ?? null);
      setLoadError(null);
    } catch {
      setLoadError("Couldn't refresh this order — showing the last loaded version. Retrying...");
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  async function advanceTo(stage: Stage, finalWeight?: number) {
    setActionError(null);
    const res = await fetch(`/api/orders/${orderId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, finalWeight }),
    });
    const body = await res.json();
    if (!res.ok) {
      setActionError(body.error ?? "Failed to advance stage");
      throw new Error(body.error);
    }
    await load();
  }

  function requestAdvance() {
    if (!order) return;
    const stage = nextStage(order);
    if (!stage) return;
    if (stage === "readyToDispatch") {
      setAdvancing(stage);
    } else {
      setConfirming(stage);
    }
  }

  async function toggleCancel() {
    if (!order) return;
    setActionError(null);
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancelled: !order.cancelled }),
    });
    const body = await res.json();
    if (!res.ok) {
      setActionError(body.error ?? "Failed to update order");
      return;
    }
    await load();
  }

  if (notFound) {
    return <p className="p-6 text-gray-500">Order {orderId} not found.</p>;
  }

  if (!order) {
    return <p className="p-6 text-gray-400">{loadError ?? "Loading..."}</p>;
  }

  const next = nextStage(order);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{order.id}</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {statusLabel(order)} · Delay: {delayLabel(order)}
          </span>
        </div>
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

      <div className="flex flex-wrap gap-2 border rounded p-3">
        {next && !order.returned && (
          <button
            onClick={requestAdvance}
            className="text-sm px-3 py-1.5 rounded bg-black text-white hover:bg-gray-800"
          >
            → {STAGE_LABELS[next]}
          </button>
        )}
        {!order.returned && (
          <button
            onClick={() => setReturning(true)}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100"
          >
            Mark Returned
          </button>
        )}
        <button
          onClick={toggleCancel}
          className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100"
        >
          {order.cancelled ? "Un-cancel Order" : "Cancel Order"}
        </button>
      </div>

      {order.returned && (
        <div className="text-sm border rounded p-3 bg-gray-50 space-y-1">
          <p className="font-medium">Returned</p>
          <p>Reason: {order.returnReason}</p>
          <p>Refund: {order.refundType}{order.refundAmount != null ? ` — $${order.refundAmount}` : ""}</p>
        </div>
      )}

      {role === "owner" && (
        <div className="text-sm border rounded p-3 space-y-1">
          <p className="font-medium">Costing</p>
          {costing ? (
            <>
              <p>Unit Cost: ${costing.unitCost.toFixed(2)}</p>
              <p>Total Cost: ${costing.totalCost.toFixed(2)}</p>
              <p>Profit: ${costing.profit.toFixed(2)}</p>
              <p>Margin: {costing.marginPct != null ? `${costing.marginPct.toFixed(1)}%` : "not set"}</p>
            </>
          ) : (
            <p className="text-gray-500">not set</p>
          )}
        </div>
      )}

      <OrderForm
        role={role}
        defaultEmployee={defaultEmployee}
        mode="edit"
        orderId={order.id}
        initialOrder={order}
        onSaved={(updated) => setOrder(updated)}
      />

      {advancing && (
        <FinalWeightModal
          jobId={order.id}
          onClose={() => setAdvancing(null)}
          onSubmit={async (finalWeight) => {
            await advanceTo(advancing, finalWeight);
            setAdvancing(null);
          }}
        />
      )}

      {confirming && (
        <ConfirmModal
          message={`Move ${order.id} to ${STAGE_LABELS[confirming]}?`}
          onClose={() => setConfirming(null)}
          onConfirm={async () => {
            await advanceTo(confirming);
            setConfirming(null);
          }}
        />
      )}

      {returning && (
        <ReturnModal
          jobId={order.id}
          soldPrice={order.soldPrice}
          onClose={() => setReturning(false)}
          onSubmit={async (data) => {
            const res = await fetch(`/api/orders/${orderId}/return`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error ?? "Failed to save return");
            setOrder(body.order);
            setReturning(false);
          }}
        />
      )}
    </div>
  );
}
