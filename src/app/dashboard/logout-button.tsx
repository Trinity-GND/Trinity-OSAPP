"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton({ variant = "light" }: { variant?: "light" | "dark" }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className={
        variant === "dark"
          ? "text-sm text-gold hover:text-gold-dark underline underline-offset-2"
          : "px-4 py-2 rounded-lg border border-border-warm text-sm hover:bg-cream"
      }
    >
      Log out
    </button>
  );
}
