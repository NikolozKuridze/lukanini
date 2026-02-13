"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  from: string;
};

export function AccessDeniedClient({ from }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      if (!res.ok) {
        setError("პაროლი არასწორია. სცადე თავიდან.");
        return;
      }

      router.replace(from as never);
      router.refresh();
    } catch {
      setError("პაროლის გადამოწმება ვერ მოხერხდა.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="soft-grid min-h-screen px-4 py-8">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <section className="glass w-full rounded-3xl p-6 shadow-glow">
          <p className="font-display text-xs uppercase tracking-[0.24em] text-peach">პირადი სიყვარულის სივრცე</p>
          <h1 className="mt-2 font-display text-3xl">წვდომა შეზღუდულია</h1>
          <p className="mt-2 text-sm text-white/80">ეს საიტი მხოლოდ ნინისა და ლუკასთვისაა. გასაგრძელებლად შეიყვანე პაროლი.</p>

          <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
            <label className="block text-sm">
              პაროლი
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 outline-none ring-cherry/50 focus:ring"
                placeholder="შეიყვანე საიდუმლო პაროლი"
              />
            </label>
            {error ? <p className="text-xs text-rose-300">{error}</p> : null}
            <button
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-cherry to-peach px-4 py-2.5 font-display text-sm disabled:opacity-60"
            >
              {loading ? "მოწმდება..." : "სივრცის გახსნა"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
