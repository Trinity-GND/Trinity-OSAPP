import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import AppShell from "@/components/app-shell";
import OrdersList from "@/components/orders/orders-list";
import { OrderType } from "@/types/order";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ orderType?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const orderType: OrderType = params.orderType === "offline" ? "offline" : "online";

  return (
    <AppShell>
      <OrdersList role={session.role} orderType={orderType} />
    </AppShell>
  );
}
