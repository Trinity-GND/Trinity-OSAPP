"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
        active
          ? "bg-gold text-navy font-medium"
          : "text-white/70 hover:text-white hover:bg-white/5"
      }`}
    >
      {children}
    </Link>
  );
}
