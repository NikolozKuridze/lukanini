import Link from "next/link";

export default function NotFound() {
  return (
    <main className="soft-grid min-h-screen px-4 py-8">
      <div className="mx-auto flex min-h-[80vh] max-w-xl items-center">
        <section className="glass w-full rounded-3xl p-6 text-center shadow-glow md:p-10">
          <p className="font-display text-xs uppercase tracking-[0.24em] text-peach">404</p>
          <h1 className="mt-3 font-display text-4xl">Love Page Not Found</h1>
          <p className="mt-3 text-sm text-white/80">This path escaped the love map. Head back to your arcade.</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-gradient-to-r from-cherry to-peach px-5 py-2.5 font-display text-sm"
          >
            Return Home
          </Link>
        </section>
      </div>
    </main>
  );
}
