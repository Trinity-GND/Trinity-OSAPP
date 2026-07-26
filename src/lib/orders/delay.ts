import { Order } from "@/types/order";

export type DelayInfo =
  | { status: "cancelled" }
  | { status: "overdue" }
  | { status: "pending" }
  | { status: "early" | "late" | "onTime"; days: number };

/**
 * Compares stageTimestamps.readyToDispatch (or .dispatched) against shipBy.
 * Positive days = late, negative = early.
 */
export function getDelayInfo(order: Order, today: Date = new Date()): DelayInfo {
  if (order.cancelled) return { status: "cancelled" };

  const reachedAt = order.stageTimestamps.readyToDispatch ?? order.stageTimestamps.dispatched;

  if (!reachedAt) {
    if (order.shipBy && today > new Date(order.shipBy)) {
      return { status: "overdue" };
    }
    return { status: "pending" };
  }

  if (!order.shipBy) return { status: "pending" };

  const reached = new Date(reachedAt);
  const shipBy = new Date(order.shipBy);
  const days = Math.round((reached.getTime() - shipBy.getTime()) / 86_400_000);

  return { status: days > 0 ? "late" : days < 0 ? "early" : "onTime", days };
}
