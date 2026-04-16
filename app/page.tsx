import Link from "next/link";
import { Orbitron, Space_Grotesk } from "next/font/google";
import { Waves } from "lucide-react";
import LandingHighlights from "@/components/landing/LandingHighlights";
import { cultureLines, galleryItems, milestones } from "@/lib/landingContent";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["700", "800"] });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default function Home() {
  return (
    <main className={`${spaceGrotesk.className} bg-slate-950 text-slate-100`}>
      <section className="relative min-h-[var(--content-height)] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1600965962361-9035dbfd1c50?auto=format&fit=crop&w=2200&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,6,23,0.36),rgba(2,6,23,0.82)),radial-gradient(circle_at_20%_25%,rgba(34,211,238,0.30),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.35),transparent_45%)]" />
        <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />

        <div className="relative z-10 mx-auto flex min-h-[var(--content-height)] w-full max-w-6xl items-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-slate-950/45 p-8 shadow-[0_24px_80px_rgba(15,118,110,0.35)] backdrop-blur-md sm:p-12">
            <p className="text-s font-semibold uppercase tracking-[0.24em] text-cyan-100/90">
              University of Moratuwa Swimming Team
            </p>

            <h1
              className={`${orbitron.className} mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl`}
            >
              AquaTrack
              <span className="mt-2 block bg-gradient-to-r from-cyan-200 via-sky-300 to-teal-200 bg-clip-text text-transparent">
                Compete Better. Train Smarter.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-100/90 sm:text-lg">
              Official digital home for attendance, training coordination, and
              team operations. Built for active swimmers, coaches, and admins of
              the University of Moratuwa.
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

            <p className="mt-8 inline-flex items-center gap-2 text-sm text-cyan-100/90">
              <Waves size={18} />
              Private by design. Team data is visible only after authentication.
            </p>
          </div>
        </div>
      </section>

      <LandingHighlights
        milestones={milestones}
        galleryItems={galleryItems}
        headingClassName={orbitron.className}
      />

      <section className="mx-auto w-full max-w-6xl px-6 py-14 sm:px-10">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 sm:p-10">
          <h2
            className={`${orbitron.className} text-2xl font-bold text-white sm:text-3xl`}
          >
            Trust And Culture
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            {cultureLines.map((line) => (
              <div
                key={line}
                className="rounded-xl border border-cyan-400/20 bg-slate-950/55 px-4 py-3 text-sm text-slate-200"
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16 sm:px-10">
        <div className="rounded-3xl border border-cyan-300/30 bg-[linear-gradient(120deg,rgba(8,47,73,0.9),rgba(12,74,110,0.9))] p-8 text-center shadow-[0_20px_70px_rgba(14,116,144,0.35)] sm:p-12">
          <h2
            className={`${orbitron.className} text-2xl font-bold text-white sm:text-3xl`}
          >
            Ready To Enter The Team Workspace?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-cyan-100/90 sm:text-base">
            Explore team highlights, then continue to the secure platform for
            training operations and athlete workflows.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-cyan-300/40 bg-cyan-300/20 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-cyan-300/30"
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
        </div>
      </section>
    </main>
  );
}
