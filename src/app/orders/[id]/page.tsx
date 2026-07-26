import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import Nav from "@/components/nav";
import OrderDetail from "@/components/orders/order-detail";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  return (
    <div>
      <Nav />
      <OrderDetail orderId={id} role={session.role} defaultEmployee={session.name} />
    </div>
  );
}
