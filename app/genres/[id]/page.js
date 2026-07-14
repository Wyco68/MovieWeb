import { Suspense } from "react";
import Loading from "@/app/loading";
import GenreView from "./GenreView";

// Static export can only prerender a single placeholder param; Cloudflare
// _redirects serves this shell for any /genres/:id and GenreView reads the
// real id from the URL on the client.
export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function GenrePage() {
  return (
    <Suspense fallback={<Loading />}>
      <GenreView />
    </Suspense>
  );
}
