import Link from "next/link";
import { Orbitron, Space_Grotesk } from "next/font/google";
import { Waves, Sparkles } from "lucide-react";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["700", "800"] });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default function Home() {
  return (
    <main
      className={`${spaceGrotesk.className} relative min-h-[var(--content-height)] overflow-hidden`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1600965962361-9035dbfd1c50?auto=format&fit=crop&w=2000&q=80')",
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.35),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.4),transparent_40%),linear-gradient(to_bottom,rgba(2,6,23,0.55),rgba(2,6,23,0.86))]" />

      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-[var(--content-height)] w-full max-w-6xl items-center px-6 py-14 sm:px-10">
        <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-slate-950/35 p-8 shadow-[0_20px_70px_rgba(8,47,73,0.45)] backdrop-blur-md sm:p-12">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-300/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
            <Sparkles size={14} />
            Future of Team Swimming
          </p>

          <h1
            className={`${orbitron.className} text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl`}
          >
            AquaTrack
            <span className="mt-2 block bg-gradient-to-r from-cyan-200 via-sky-300 to-teal-200 bg-clip-text text-transparent">
              Command The Water
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-100/90 sm:text-lg">
            A futuristic workspace for university swim teams. Plan sessions,
            request leave, and track progress in one secure platform.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-cyan-300/40 bg-cyan-300/25 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-cyan-300/35"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/20"
            >
              Create Account
            </Link>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 text-sm text-cyan-100/90">
            <Waves size={18} />
            Private by design. Team data is visible only after authentication.
          </div>
        </div>
      </section>
    </main>
  );
}
