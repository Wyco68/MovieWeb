"use client";

import { useEffect, useState } from "react";
import HorizontalMediaRow from "@/components/HorizontalMediaRow";
import Loading from "@/app/loading";
import { fetchTmdb } from "@/lib/api";

const imageConfig = null;

function section(result) {
  return {
    items: result?.results ?? [],
    page: result?.page ?? 1,
    totalPages: result?.total_pages ?? 1,
  };
}

export default function TVShowsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      fetchTmdb({ key: "popular_tv" }).catch(() => null),
      fetchTmdb({ key: "top_rated_tv" }).catch(() => null),
      fetchTmdb({ key: "airing_today_tv" }).catch(() => null),
      fetchTmdb({ key: "on_the_air_tv" }).catch(() => null),
    ]).then(([popular, topRated, airingToday, onAir]) => {
      if (!active) return;
      setData({
        popular: section(popular),
        topRated: section(topRated),
        airingToday: section(airingToday),
        onAir: section(onAir),
      });
    });

    return () => {
      active = false;
    };
  }, []);

  if (!data) return <Loading />;

  const { popular, topRated, airingToday, onAir } = data;

  return (
    <>
      <h2 className="text-[clamp(1.8rem,2.8vw,2.8rem)] leading-[1.1] font-semibold tracking-[-0.26px]">
        TV Shows
      </h2>

      <HorizontalMediaRow
        title="Popular"
        items={popular.items}
        mediaType="tv"
        imageConfig={imageConfig}
        error={false}
        priorityFirstImage
        fetchKey="popular_tv"
        initialPage={popular.page}
        initialTotalPages={popular.totalPages}
      />

      <HorizontalMediaRow
        title="Top Rated"
        items={topRated.items}
        mediaType="tv"
        imageConfig={imageConfig}
        error={false}
        fetchKey="top_rated_tv"
        initialPage={topRated.page}
        initialTotalPages={topRated.totalPages}
      />

      <HorizontalMediaRow
        title="Airing Today"
        items={airingToday.items}
        mediaType="tv"
        imageConfig={imageConfig}
        error={false}
        fetchKey="airing_today_tv"
        initialPage={airingToday.page}
        initialTotalPages={airingToday.totalPages}
      />

      <HorizontalMediaRow
        title="On The Air"
        items={onAir.items}
        mediaType="tv"
        imageConfig={imageConfig}
        error={false}
        fetchKey="on_the_air_tv"
        initialPage={onAir.page}
        initialTotalPages={onAir.totalPages}
      />
    </>
  );
}
