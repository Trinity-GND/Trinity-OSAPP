import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import AppShell from "@/components/app-shell";
import OrdersList from "@/components/orders/orders-list";

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <AppShell>
      <OrdersList role={session.role} />
    </AppShell>
  );
}
