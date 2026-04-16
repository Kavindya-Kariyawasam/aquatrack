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
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200/85">
                {item.year} • {item.team}
              </p>
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
            Meet Day Moments
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleGalleryItems.map((item) => (
            <figure
              key={item.id}
              className="overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-900/60"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={item.imageUrl}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition duration-300 hover:scale-105"
                />
              </div>
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
