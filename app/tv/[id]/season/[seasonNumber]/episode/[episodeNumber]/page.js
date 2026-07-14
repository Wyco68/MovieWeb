import { Suspense } from "react";
import Loading from "@/app/loading";
import EpisodeDetailView from "./EpisodeDetailView";

// Static export prerenders one placeholder combo; Cloudflare _redirects serves
// this shell for any episode URL and EpisodeDetailView reads the real
// tvId/season/episode from the URL on the client.
export function generateStaticParams() {
  return [{ id: "placeholder", seasonNumber: "1", episodeNumber: "1" }];
}

export default function EpisodePage() {
  return (
    <Suspense fallback={<Loading />}>
      <EpisodeDetailView />
    </Suspense>
  );
}
