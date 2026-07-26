import { Order } from "@/types/order";
import { Role } from "@/lib/auth/session";

/**
 * Strips owner-only fields before an order ever leaves the server.
 * Applied to every API response — never rely on the frontend to hide this.
 */
export function presentOrder(order: Order, role: Role): Order {
  if (role === "owner") return order;
  const { materialCost: _materialCost, ...rest } = order;
  return { ...rest, materialCost: null };
}

export function presentOrders(orders: Order[], role: Role): Order[] {
  return orders.map((o) => presentOrder(o, role));
}
