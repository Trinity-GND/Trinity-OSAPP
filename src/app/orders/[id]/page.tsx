import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import AppShell from "@/components/app-shell";
import OrderDetail from "@/components/orders/order-detail";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  return (
    <AppShell>
      <OrderDetail orderId={id} role={session.role} defaultEmployee={session.name} />
    </AppShell>
  );
}
