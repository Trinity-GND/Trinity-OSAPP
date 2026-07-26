import { Order, STAGES, STAGE_LABELS, Stage } from "@/types/order";
import { getDelayInfo } from "./delay";

export function nextStage(order: Order): Stage | null {
  if (order.cancelled) return null;
  const pipeline: (Stage | null)[] = [null, ...STAGES];
  const idx = pipeline.indexOf(order.stage);
  if (idx === -1 || idx === pipeline.length - 1) return null;
  return pipeline[idx + 1];
}

export function statusLabel(order: Order): string {
  if (order.cancelled) return "Cancelled";
  if (!order.stage) return "Pending";
  return STAGE_LABELS[order.stage];
}

export function delayLabel(order: Order): string {
  const info = getDelayInfo(order);
  switch (info.status) {
    case "cancelled":
      return "—";
    case "pending":
      return "—";
    case "overdue":
      return "Overdue";
    case "onTime":
      return "On time";
    case "early":
      return `${Math.abs(info.days)}d early`;
    case "late":
      return `${info.days}d late`;
  }
}
