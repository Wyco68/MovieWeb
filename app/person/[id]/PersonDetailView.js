"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import BackButton from "@/components/BackButton";
import HorizontalMediaRow from "@/components/HorizontalMediaRow";
import Loading from "@/app/loading";
import { fetchTmdb } from "@/lib/api";
import { isValidId } from "@/lib/search-params";
import { getConfiguredImageUrl } from "@/lib/tmdb-image";
import { routeId } from "@/lib/route-params";

const imageConfig = null;

function buildFilmography(items) {
  const seen = new Set();

  return (items ?? [])
    .filter((item) => item?.id && (item?.media_type === "movie" || item?.media_type === "tv"))
    .filter((item) => {
      const key = `${item.media_type}:${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const popularityDelta = Number(b?.popularity || 0) - Number(a?.popularity || 0);
      if (popularityDelta !== 0) return popularityDelta;

      const dateA = a?.release_date || a?.first_air_date || "";
      const dateB = b?.release_date || b?.first_air_date || "";
      return dateB.localeCompare(dateA);
    });
}

function NotFound() {
  return (
    <>
      <div className="mb-4">
        <BackButton fallbackHref="/people" label="Back" />
      </div>
      <h2 className="text-2xl font-semibold">Person not found</h2>
      <p className="mt-2 muted-label">This profile could not be loaded.</p>
    </>
  );
}

export default function PersonDetailView() {
  const [state, setState] = useState({ status: "loading", person: null, credits: null });

  useEffect(() => {
    let active = true;
    const id = routeId();

    if (!isValidId(id)) {
      setState({ status: "notfound", person: null, credits: null });
      return undefined;
    }

    Promise.all([
      fetchTmdb({ key: "person_detail", personId: id }),
      fetchTmdb({ key: "person_credits", personId: id }).catch(() => ({ cast: [] })),
    ])
      .then(([person, credits]) => {
        if (!person?.id) throw new Error("not found");
        if (active) setState({ status: "ready", person, credits });
      })
      .catch(() => {
        if (active) setState({ status: "notfound", person: null, credits: null });
      });

    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") return <Loading />;
  if (state.status === "notfound") return <NotFound />;

  const person = state.person;
  const profileUrl = getConfiguredImageUrl(person.profile_path, {
    config: imageConfig,
    type: "profile",
    variant: "lg",
  });
  const filmography = buildFilmography(state.credits?.cast);

  return (
    <>
      <div className="mb-4">
        <BackButton fallbackHref="/people" label="Back" />
      </div>

      <h2 className="text-[clamp(2rem,3vw,3.5rem)] leading-[1.08] font-semibold tracking-[-0.28px]">
        {person.name}
      </h2>

      <div className="mt-4 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div>
          {profileUrl ? (
            <Image
              src={profileUrl}
              alt={`${person.name} profile`}
              width={500}
              height={750}
              sizes="(max-width: 1024px) 70vw, 280px"
              className="w-full h-auto rounded-[8px] border border-[var(--app-panel-border)]"
              priority
            />
          ) : (
            <div className="w-full min-h-[360px] rounded-[8px] border border-[var(--app-panel-border)] bg-slate-100 dark:bg-[#232435]" />
          )}
        </div>

        <div>
          <div className="grid gap-2 text-[14px] text-[rgba(0,0,0,0.78)] dark:text-white/80 sm:grid-cols-2">
            <div>
              <span className="font-medium">Known For:</span>{" "}
              {person.known_for_department || "N/A"}
            </div>
            <div>
              <span className="font-medium">Birthday:</span> {person.birthday || "N/A"}
            </div>
            <div>
              <span className="font-medium">Place of Birth:</span>{" "}
              {person.place_of_birth || "N/A"}
            </div>
            <div>
              <span className="font-medium">Popularity:</span>{" "}
              {person.popularity?.toFixed?.(1) || "N/A"}
            </div>
          </div>

          <h3 className="section-title mt-6">Biography</h3>
          <p className="text-[16px] leading-[1.5] text-[rgba(0,0,0,0.82)] dark:text-white/88">
            {person.biography || "No biography available."}
          </p>
        </div>
      </div>

      {filmography.length > 0 && (
        <div className="mt-8">
          <HorizontalMediaRow
            title="Known For Filmography"
            items={filmography}
            imageConfig={imageConfig}
            emptyLabel="No filmography available."
          />
        </div>
      )}
    </>
  );
}
