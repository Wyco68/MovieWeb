import { Suspense } from "react";
import Loading from "@/app/loading";
import MovieDetailView from "./MovieDetailView";

// Static export prerenders one placeholder; Cloudflare _redirects serves this
// shell for any /movie/:id and MovieDetailView reads the real id on the client.
export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function MoviePage() {
  return (
    <Suspense fallback={<Loading />}>
      <MovieDetailView />
    </Suspense>
  );
}
