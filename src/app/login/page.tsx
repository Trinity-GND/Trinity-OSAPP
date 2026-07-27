"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(fullPin: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: fullPin }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Login failed");
        setPin("");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setPin("");
    } finally {
      setSubmitting(false);
    }
  }

  function press(key: string) {
    if (submitting) return;
    if (key === "back") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (key === "") return;
    if (pin.length >= 4) return;

    const next = pin + key;
    setPin(next);
    if (next.length === 4) submit(next);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-4">
      <div className="bg-card border border-border-warm rounded-2xl shadow-sm px-8 py-10 w-full max-w-sm flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-ink">Trinity OS</h1>
          <p className="text-sm text-muted mt-1">Enter your 4-digit PIN</p>
        </div>

        <div className="flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border border-gold transition-colors ${
                i < pin.length ? "bg-gold" : "bg-transparent"
              }`}
            />
          ))}
        </div>

        {error && <p className="text-danger text-sm -mt-2">{error}</p>}

        <div className="grid grid-cols-3 gap-3 w-56">
          {KEYS.map((key, i) =>
            key === "" ? (
              <div key={i} />
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => press(key)}
                disabled={submitting}
                className="h-14 rounded-lg border border-border-warm text-lg font-medium text-ink hover:bg-cream hover:border-gold disabled:opacity-50 transition-colors"
              >
                {key === "back" ? "⌫" : key}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
