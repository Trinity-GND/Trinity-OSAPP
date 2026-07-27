import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import LogoutButton from "@/app/dashboard/logout-button";
import SidebarNavLink from "./sidebar-nav-link";

export default async function Sidebar() {
  const session = await getSession();
  if (!session) return null;

  return (
    <aside className="w-full sm:w-56 sm:min-h-screen bg-navy text-cream flex sm:flex-col shrink-0">
      <div className="p-5 border-b border-white/10 sm:border-b-0">
        <h1 className="font-display text-xl font-bold text-gold leading-tight">Trinity OS</h1>
        <p className="hidden sm:block text-[10px] tracking-widest text-white/40 uppercase mt-1">
          Order &amp; Production Ledger
        </p>
      </div>

      <nav className="flex sm:flex-col gap-1 p-2 sm:p-3 flex-1 overflow-x-auto sm:overflow-visible">
        <SidebarNavLink href="/dashboard">Dashboard</SidebarNavLink>
        <SidebarNavLink href="/orders?orderType=online">Online Orders</SidebarNavLink>
        <SidebarNavLink href="/orders?orderType=offline">Offline Orders</SidebarNavLink>
        {session.role === "owner" && <SidebarNavLink href="/reports">Reports</SidebarNavLink>}
      </nav>

      <div className="hidden sm:block p-4 border-t border-white/10 text-sm">
        <p className="text-white/50">
          Signed in as <span className="text-white/80 font-medium">{session.name}</span>
        </p>
        <div className="mt-2">
          <LogoutButton variant="dark" />
        </div>
      </div>
    </aside>
  );
}
