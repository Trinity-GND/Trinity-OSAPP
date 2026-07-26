import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import LogoutButton from "@/app/dashboard/logout-button";

export default async function Nav() {
  const session = await getSession();
  if (!session) return null;

  return (
    <nav className="border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-semibold">Trinity OS</span>
        <Link href="/dashboard" className="text-sm hover:underline">
          Dashboard
        </Link>
        <Link href="/orders" className="text-sm hover:underline">
          Orders
        </Link>
        <Link href="/orders/new" className="text-sm hover:underline">
          New Order
        </Link>
        {session.role === "owner" && (
          <Link href="/reports" className="text-sm hover:underline">
            Reports
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">
          {session.name} ({session.role})
        </span>
        <LogoutButton />
      </div>
    </nav>
  );
}
