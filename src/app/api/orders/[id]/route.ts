import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/require";
import { rowToOrder, orderToRow } from "@/lib/orders/map";
import { presentOrder } from "@/lib/orders/present";
import { parseShippingAddress } from "@/lib/address-parser";
import { computeCosting } from "@/lib/costing";
import { getLaborRate } from "@/lib/settings";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();

  if (error || !data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = rowToOrder(data);
  let costing = null;
  if (session.role === "owner") {
    const laborRate = await getLaborRate(supabase);
    costing = computeCosting(order, laborRate);
  }

  return NextResponse.json({ order: presentOrder(order, session.role), costing });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
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

  if (session.role !== "owner") {
    delete body.materialCost;
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("orders")
    .update({ ...orderToRow(body), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ order: presentOrder(rowToOrder(data), session.role) });
}
