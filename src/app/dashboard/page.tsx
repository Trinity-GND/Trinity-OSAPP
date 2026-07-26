import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import LogoutButton from "./logout-button";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-lg">
        Logged in as <span className="font-semibold">{session.name}</span> ({session.role})
      </p>
      <p className="text-sm text-gray-500">
        This is a placeholder — the real dashboard (stat cards, production board) comes next.
      </p>
      <LogoutButton />
    </div>
  );
}
