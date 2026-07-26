import { Order } from "@/types/order";
import { getDelayInfo } from "./delay";

export type ReportPreset = "today" | "delayed" | "inCad" | "inProduction" | "selected";

export function filterOrdersForReport(
  orders: Order[],
  preset: ReportPreset,
  selectedIds?: string[],
): Order[] {
  const today = new Date().toISOString().slice(0, 10);

  switch (preset) {
    case "today":
      return orders.filter((o) => o.orderDate === today);
    case "delayed":
      return orders.filter((o) => {
        const info = getDelayInfo(o);
        return info.status === "overdue" || (info.status === "late" && info.days > 0);
      });
    case "inCad":
      return orders.filter((o) => o.stage === "cad");
    case "inProduction":
      return orders.filter((o) => o.stage === "inProduction");
    case "selected":
      return orders.filter((o) => selectedIds?.includes(o.id));
    default:
      return orders;
  }
}
