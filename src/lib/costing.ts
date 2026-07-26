import { Order } from "@/types/order";

export type Costing = {
  unitCost: number;
  totalCost: number;
  profit: number;
  marginPct: number | null;
};

/**
 * Unit Cost = (Labor Rate per gram × effective weight) + Material Cost
 * Effective weight = finalWeight if set, otherwise weight (estimate)
 * Total Cost = Unit Cost × quantity
 * Profit = (soldPrice − refundAmount if refunded) − Total Cost
 * Margin % = Profit / (soldPrice − refundAmount) × 100
 *
 * Returns null when cost data isn't set yet, so callers can show
 * "not set" instead of a misleading $0.
 */
export function computeCosting(order: Order, laborRatePerGram: number): Costing | null {
  if (order.materialCost == null) return null;
  const effectiveWeight = order.finalWeight ?? order.weight;
  if (effectiveWeight == null) return null;

  const unitCost = laborRatePerGram * effectiveWeight + order.materialCost;
  const totalCost = unitCost * order.quantity;

  const soldPrice = order.soldPrice ?? 0;
  const netRevenue =
    order.refundType !== "none" && order.refundAmount != null ? soldPrice - order.refundAmount : soldPrice;

  const profit = netRevenue - totalCost;
  const marginPct = netRevenue !== 0 ? (profit / netRevenue) * 100 : null;

  return { unitCost, totalCost, profit, marginPct };
}
