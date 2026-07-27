import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import AppShell from "@/components/app-shell";
import DashboardView from "@/components/dashboard/dashboard-view";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <AppShell>
      <DashboardView />
    </AppShell>
  );
}
