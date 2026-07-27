"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Order, Stage, STAGE_LABELS } from "@/types/order";
import { Costing } from "@/lib/costing";
import { nextStage, statusLabel, delayLabel } from "@/lib/orders/pipeline";
import OrderForm from "./order-form";
import ReturnModal from "./return-modal";
import FinalWeightModal from "./final-weight-modal";
import DeleteOrderModal from "./delete-order-modal";
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
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const router = useRouter();

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
    return <p className="p-6 text-muted">Order {orderId} not found.</p>;
  }

  if (!order) {
    return <p className="p-6 text-gray-400">{loadError ?? "Loading..."}</p>;
  }

  const next = nextStage(order);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-bold text-ink">{order.id}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">
            {statusLabel(order)} · Delay: {delayLabel(order)}
          </span>
          <a
            href={`/api/job-cards/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-md border border-border-warm bg-card hover:bg-cream"
          >
            Print Job Card
          </a>
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

      <div className="flex flex-wrap gap-2 border border-border-warm bg-card rounded-lg p-3">
        {next && !order.returned && (
          <button
            onClick={requestAdvance}
            className="text-sm px-3 py-1.5 rounded-md bg-gold text-navy font-medium hover:bg-gold-dark"
          >
            → {STAGE_LABELS[next]}
          </button>
        )}
        {!order.returned && (
          <button
            onClick={() => setReturning(true)}
            className="text-sm px-3 py-1.5 rounded-md border border-border-warm hover:bg-cream"
          >
            Mark Returned
          </button>
        )}
        <button
          onClick={toggleCancel}
          className="text-sm px-3 py-1.5 rounded-md border border-border-warm hover:bg-cream"
        >
          {order.cancelled ? "Un-cancel Order" : "Cancel Order"}
        </button>
      </div>

      {order.returned && (
        <div className="text-sm border border-border-warm bg-card rounded-lg p-3 space-y-1">
          <p className="font-medium text-ink">Returned</p>
          <p>Reason: {order.returnReason}</p>
          <p>Refund: {order.refundType}{order.refundAmount != null ? ` — $${order.refundAmount}` : ""}</p>
        </div>
      )}

      {role === "owner" && (
        <div className="text-sm border border-border-warm bg-card rounded-lg p-3 space-y-1">
          <p className="font-medium text-ink">Costing</p>
          {costing ? (
            <>
              <p>Unit Cost: ${costing.unitCost.toFixed(2)}</p>
              <p>Total Cost: ${costing.totalCost.toFixed(2)}</p>
              <p className={costing.profit < 0 ? "text-danger font-medium" : "text-success font-medium"}>
                Profit: ${costing.profit.toFixed(2)}
              </p>
              <p>Margin: {costing.marginPct != null ? `${costing.marginPct.toFixed(1)}%` : "not set"}</p>
            </>
          ) : (
            <p className="text-muted">not set</p>
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

      {role === "owner" && (
        <div className="border border-danger/30 bg-danger-bg rounded-lg p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-danger">Danger zone</p>
            <p className="text-xs text-muted">
              Permanently delete this order. For cleaning up test/trial orders only.
            </p>
          </div>
          <button
            onClick={() => setDeleting(true)}
            className="text-sm px-3 py-1.5 rounded-md border border-danger/40 text-danger hover:bg-danger/10"
          >
            Delete Order
          </button>
        </div>
      )}

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

      {deleting && (
        <DeleteOrderModal
          jobId={order.id}
          onClose={() => setDeleting(false)}
          onConfirm={async () => {
            const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
            if (!res.ok) {
              const body = await res.json();
              throw new Error(body.error ?? "Failed to delete order");
            }
            router.push("/orders");
          }}
        />
      )}
    </div>
  );
}
