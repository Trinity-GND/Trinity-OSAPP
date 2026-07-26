import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import Nav from "@/components/nav";
import DashboardView from "@/components/dashboard/dashboard-view";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <Nav />
      <DashboardView />
    </div>
  );
}
