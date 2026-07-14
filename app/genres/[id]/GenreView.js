"use client";

import { useEffect, useState } from "react";
import InfiniteMoviesGrid from "@/components/InfiniteMoviesGrid";
import Loading from "@/app/loading";
import { fetchTmdb } from "@/lib/api";
import { getGenreNameById } from "@/lib/genres";
import { isValidId } from "@/lib/search-params";
import { routeId } from "@/lib/route-params";

export default function GenreView() {
  const [state, setState] = useState({ status: "loading", id: null, data: null });

  useEffect(() => {
    let active = true;
    const id = routeId();

    if (!isValidId(id)) {
      setState({ status: "invalid", id, data: null });
      return undefined;
    }

    fetchTmdb({ key: "genre_movies", genreId: id })
      .then((data) => {
        if (active) setState({ status: "ready", id, data });
      })
      .catch(() => {
        if (active) setState({ status: "ready", id, data: { results: [], page: 1, total_pages: 1 } });
      });

    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") return <Loading />;
  if (state.status === "invalid") {
    return <h3 className="section-title">Genre not found</h3>;
  }

  const genreName = getGenreNameById(state.id) || `Genre ${state.id}`;

  return (
    <>
      <h3 className="section-title">{genreName}</h3>
      <InfiniteMoviesGrid
        initialItems={state.data?.results ?? []}
        imageConfig={null}
        priorityFirstImage
        priorityImageCount={6}
        fetchKey="genre_movies"
        fetchParams={{ genreId: state.id }}
        initialPage={state.data?.page ?? 1}
        initialTotalPages={state.data?.total_pages ?? 1}
      />
    </>
  );
}
