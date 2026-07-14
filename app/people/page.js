"use client";

import { useEffect, useState } from "react";
import InfiniteMoviesGrid from "@/components/InfiniteMoviesGrid";
import Loading from "@/app/loading";
import { fetchTmdb } from "@/lib/api";

export default function PeoplePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    fetchTmdb({ key: "popular_people" })
      .catch(() => ({ results: [], page: 1, total_pages: 1 }))
      .then((result) => {
        if (active) setData(result);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!data) return <Loading />;

  return (
    <>
      <h3 className="section-title">Popular People</h3>
      <InfiniteMoviesGrid
        initialItems={data?.results ?? []}
        mediaType="person"
        imageConfig={null}
        priorityFirstImage
        priorityImageCount={6}
        fetchKey="popular_people"
        initialPage={data?.page ?? 1}
        initialTotalPages={data?.total_pages ?? 1}
      />
    </>
  );
}
