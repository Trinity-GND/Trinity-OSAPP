import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/require";
import { rowToOrder, orderToRow } from "@/lib/orders/map";
import { presentOrders, presentOrder } from "@/lib/orders/present";
import { parseShippingAddress } from "@/lib/address-parser";

export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status"); // stage value, "cancelled", "all", or null
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const supabase = getServiceSupabase();
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });

  if (search) {
    const like = `%${search}%`;
    query = query.or(
      `id.ilike.${like},buyer_name.ilike.${like},brand.ilike.${like},platform_order_number.ilike.${like}`,
    );
  }
  if (status === "cancelled") {
    query = query.eq("cancelled", true);
  } else if (status && status !== "all") {
    query = query.eq("stage", status).eq("cancelled", false);
  }
  if (dateFrom) query = query.gte("order_date", dateFrom);
  if (dateTo) query = query.lte("order_date", dateTo);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = presentOrders((data ?? []).map(rowToOrder), session.role);
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const body = await req.json();

  if (typeof body.shippingAddress === "string" && body.shippingAddress.trim()) {
    const parsed = parseShippingAddress(body.shippingAddress);
    body.addressLine = parsed.addressLine;
    body.city = parsed.city;
    body.state = parsed.state;
    body.zip = parsed.zip;
    body.country = parsed.country;
    body.contactNo = parsed.contactNo;
  }

  if (!body.employee) body.employee = session.name;
  if (!body.quantity) body.quantity = 1;
  if (!body.priority) body.priority = "Normal";

  // materialCost must never be settable by an employee session, even if sent.
  if (session.role !== "owner") {
    delete body.materialCost;
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("orders")
    .insert(orderToRow(body))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ order: presentOrder(rowToOrder(data), session.role) }, { status: 201 });
}
