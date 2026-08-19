"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { COLORS } from "@/lib/people";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Incorrect password");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: COLORS.paper }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm"
      >
        <div className="flex items-center gap-2" style={{ color: COLORS.navy }}>
          <Building2 className="w-5 h-5" style={{ color: COLORS.gold }} />
          <h1 className="font-bold text-lg">ASB Whistler — Meeting Prep</h1>
        </div>
        <p className="text-sm text-slate-500">Enter the team password to continue.</p>
        <input
          type="password"
          autoFocus
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <div
            className="text-sm rounded-lg p-3"
            style={{ backgroundColor: COLORS.flagBg, color: COLORS.flag }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting || !password}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: COLORS.navy }}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? "Checking..." : "Enter"}
        </button>
      </form>
    </div>
  );
}
