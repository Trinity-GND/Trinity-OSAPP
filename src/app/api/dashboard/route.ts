import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/require";
import { rowToOrder } from "@/lib/orders/map";
import { presentOrders } from "@/lib/orders/present";
import { getDelayInfo } from "@/lib/orders/delay";

export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const orderType = new URL(req.url).searchParams.get("orderType");

  const supabase = getServiceSupabase();
  let query = supabase.from("orders").select("*").eq("cancelled", false);
  if (orderType === "online" || orderType === "offline") {
    query = query.eq("order_type", orderType);
  }
  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = presentOrders((data ?? []).map(rowToOrder), session.role);
  const today = new Date().toISOString().slice(0, 10);

  const todaysOrders = orders.filter((o) => o.orderDate === today).length;
  const inProduction = orders.filter(
    (o) => o.stage && ["cad", "cam", "casting", "inProduction"].includes(o.stage),
  ).length;
  const readyToDispatch = orders.filter((o) => o.stage === "readyToDispatch").length;

  const overdueOrders = orders.filter((o) => getDelayInfo(o).status === "overdue");

  const board: Record<string, typeof orders> = {
    pending: [],
    cad: [],
    cam: [],
    casting: [],
    inProduction: [],
    readyToDispatch: [],
    dispatched: [],
  };
  for (const order of orders) {
    const key = order.stage ?? "pending";
    board[key]?.push(order);
  }

  return NextResponse.json({
    stats: {
      todaysOrders,
      inProduction,
      readyToDispatch,
      overdue: overdueOrders.length,
    },
    overdueOrders,
    board,
  });
}
