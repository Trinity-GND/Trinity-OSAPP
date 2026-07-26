import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import Nav from "@/components/nav";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <Nav />
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2 text-center px-4">
        <p className="text-lg">
          Logged in as <span className="font-semibold">{session.name}</span> ({session.role})
        </p>
        <p className="text-sm text-gray-500">
          This is a placeholder — the real dashboard (stat cards, production board) comes next.
        </p>
      </div>
    </div>
  );
}
