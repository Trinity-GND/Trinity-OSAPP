"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-100"
    >
      Log out
    </button>
  );
}
