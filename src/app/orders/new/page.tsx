import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import AppShell from "@/components/app-shell";
import OrderForm from "@/components/orders/order-form";
import { OrderType } from "@/types/order";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ orderType?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const defaultOrderType: OrderType = params.orderType === "offline" ? "offline" : "online";

  return (
    <AppShell>
      <OrderForm role={session.role} defaultEmployee={session.name} defaultOrderType={defaultOrderType} />
    </AppShell>
  );
}
