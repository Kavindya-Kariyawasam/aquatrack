"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Trophy } from "lucide-react";
import type { GalleryItem, Milestone } from "@/lib/landingContent";

type LandingHighlightsProps = {
  milestones: Milestone[];
  galleryItems: GalleryItem[];
  headingClassName: string;
};

const MILESTONES_STEP = 6;
const GALLERY_STEP = 6;

function getResultColorClasses(result: string): string {
  const normalized = result.toLowerCase();

  if (normalized.includes("champion")) {
    return "text-amber-300 bg-amber-300/10 border-amber-300/35";
  }

  if (normalized.includes("1st runner-up")) {
    return "text-slate-200 bg-slate-200/10 border-slate-200/35";
  }

  if (normalized.includes("2nd runner-up")) {
    return "text-orange-300 bg-orange-300/10 border-orange-300/35";
  }

  return "text-cyan-300 bg-cyan-300/10 border-cyan-300/35";
}

function getTeamBadgeClasses(team: string): string {
  const normalized = team.toLowerCase();

  if (normalized === "men") {
    return "text-sky-200 bg-sky-300/10 border-sky-300/35";
  }

  if (normalized === "women") {
    return "text-rose-200 bg-rose-300/10 border-rose-300/35";
  }

  return "text-cyan-100 bg-cyan-300/10 border-cyan-300/30";
}

export default function LandingHighlights({
  milestones,
  galleryItems,
  headingClassName,
}: LandingHighlightsProps) {
  const [milestoneCount, setMilestoneCount] = useState(MILESTONES_STEP);
  const [galleryCount, setGalleryCount] = useState(GALLERY_STEP);

  const visibleMilestones = useMemo(
    () => milestones.slice(0, milestoneCount),
    [milestones, milestoneCount],
  );
  const visibleGalleryItems = useMemo(
    () => galleryItems.slice(0, galleryCount),
    [galleryItems, galleryCount],
  );

  const canLoadMoreMilestones = milestoneCount < milestones.length;
  const canLoadMoreGallery = galleryCount < galleryItems.length;

  return (
    <>
      <section className="relative mx-auto w-full max-w-6xl px-6 py-16 sm:px-10">
        <div className="mb-8 flex items-center gap-3">
          <Trophy className="text-cyan-300" size={24} />
          <div>
            <h2
              className={`${headingClassName} text-2xl font-bold text-white sm:text-3xl`}
            >
              Recent Milestones
            </h2>
            <p className="text-sm text-slate-300">
              Competitive highlights from recent university championship
              seasons.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleMilestones.map((item) => (
            <article
              key={`${item.year}-${item.event}-${item.team}-${item.result}`}
              className="rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.4)] backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                <span className="text-cyan-200/85">{item.year}</span>
                <span
                  className={`rounded-md border px-2 py-0.5 ${getTeamBadgeClasses(
                    item.team,
                  )}`}
                >
                  {item.team}
                </span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-white">
                {item.event}
              </h3>
              <p
                className={`mt-2 inline-flex rounded-lg border px-2.5 py-1 text-sm font-semibold ${getResultColorClasses(
                  item.result,
                )}`}
              >
                {item.result}
              </p>
            </article>
          ))}
        </div>

        {canLoadMoreMilestones ? (
          <div className="mt-7 flex justify-center">
            <button
              type="button"
              onClick={() =>
                setMilestoneCount((prev) =>
                  Math.min(prev + MILESTONES_STEP, milestones.length),
                )
              }
              className="rounded-xl border border-cyan-300/40 bg-cyan-300/15 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:-translate-y-0.5 hover:bg-cyan-300/25"
            >
              Load More Milestones
            </button>
          </div>
        ) : null}
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-8 sm:px-10">
        <div className="mb-6">
          <h2
            className={`${headingClassName} text-2xl font-bold text-white sm:text-3xl`}
          >
            Team Gallery
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Moments that shaped our journey.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleGalleryItems.map((item) => (
            <figure
              key={item.id}
              className="overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-900/60"
            >
              <a
                href={item.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
                aria-label={`Open full image: ${item.title}`}
              >
                <div className="relative aspect-[4/3] bg-slate-950/70 p-2">
                  <Image
                    src={item.imageUrl}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain transition duration-300 group-hover:scale-[1.02]"
                  />
                  <span className="pointer-events-none absolute right-3 top-3 rounded-full border border-cyan-200/40 bg-slate-950/65 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-100 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    View Full
                  </span>
                </div>
              </a>
              <figcaption className="space-y-1 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200/85">
                  {item.category} • {item.year} • {item.team}
                </p>
                <p className="text-base font-semibold text-white">
                  {item.title}
                </p>
                <p className="text-sm text-slate-300">{item.event}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        {canLoadMoreGallery ? (
          <div className="mt-7 flex justify-center">
            <button
              type="button"
              onClick={() =>
                setGalleryCount((prev) =>
                  Math.min(prev + GALLERY_STEP, galleryItems.length),
                )
              }
              className="rounded-xl border border-cyan-300/40 bg-cyan-300/15 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:-translate-y-0.5 hover:bg-cyan-300/25"
            >
              Load More Moments
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
}
