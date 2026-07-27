import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import AppShell from "@/components/app-shell";
import ReportsView from "@/components/reports/reports-view";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "owner") redirect("/dashboard");

  return (
    <AppShell>
      <ReportsView />
    </AppShell>
  );
}
