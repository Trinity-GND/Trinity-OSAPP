import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import Nav from "@/components/nav";
import OrdersList from "@/components/orders/orders-list";

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <Nav />
      <OrdersList role={session.role} />
    </div>
  );
}
