import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import AppShell from "@/components/app-shell";
import OrderForm from "@/components/orders/order-form";

export default async function NewOrderPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <AppShell>
      <OrderForm role={session.role} defaultEmployee={session.name} />
    </AppShell>
  );
}
