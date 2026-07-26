import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import Nav from "@/components/nav";
import OrderForm from "@/components/orders/order-form";

export default async function NewOrderPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <Nav />
      <OrderForm role={session.role} defaultEmployee={session.name} />
    </div>
  );
}
