import { Order } from "@/types/order";
import { computeCosting } from "./costing";
import { getDelayInfo } from "./orders/delay";

export function buildReportsSummary(orders: Order[], laborRate: number) {
  const active = orders.filter((o) => !o.cancelled);

  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let totalRefunded = 0;
  let ordersOverdue = 0;

  const groups = new Map<string, { label: string; profit: number; hasCosting: boolean }>();

  for (const order of active) {
    totalRevenue += order.soldPrice ?? 0;
    if (order.returned) totalRefunded += order.refundAmount ?? 0;
    if (getDelayInfo(order).status === "overdue") ordersOverdue++;

    const costing = computeCosting(order, laborRate);
    const key = order.sku || order.category || "Uncategorized";
    if (!groups.has(key)) groups.set(key, { label: key, profit: 0, hasCosting: false });
    const g = groups.get(key)!;

    if (costing) {
      totalCost += costing.totalCost;
      totalProfit += costing.profit;
      g.profit += costing.profit;
      g.hasCosting = true;
    }
  }

  const profitByItem = Array.from(groups.values())
    .map((g) => ({ label: g.label, profit: g.hasCosting ? g.profit : null }))
    .sort((a, b) => (b.profit ?? -Infinity) - (a.profit ?? -Infinity));

  const withShipBy = active.filter((o) => o.shipBy);
  const delayRows = withShipBy
    .map((o) => ({ order: o, info: getDelayInfo(o) }))
    .filter((r) => r.info.status === "early" || r.info.status === "late" || r.info.status === "onTime")
    .sort((a, b) => {
      const da = "days" in a.info ? a.info.days : 0;
      const db = "days" in b.info ? b.info.days : 0;
      return db - da;
    });
  const avgDelay =
    delayRows.length > 0
      ? delayRows.reduce((sum, r) => sum + ("days" in r.info ? r.info.days : 0), 0) / delayRows.length
      : null;

  const returns = active
    .filter((o) => o.returned)
    .map((o) => ({
      id: o.id,
      buyerName: o.buyerName,
      returnReason: o.returnReason,
      refundType: o.refundType,
      refundAmount: o.refundAmount,
    }));

  return {
    summary: { totalRevenue, totalCost, totalProfit, totalRefunded, ordersOverdue },
    profitByItem,
    delay: {
      rows: delayRows.map((r) => ({
        id: r.order.id,
        buyerName: r.order.buyerName,
        shipBy: r.order.shipBy,
        days: "days" in r.info ? r.info.days : 0,
      })),
      averageDelayDays: avgDelay,
    },
    returns,
  };
}
