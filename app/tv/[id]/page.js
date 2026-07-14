import { Suspense } from "react";
import Loading from "@/app/loading";
import TVDetailView from "./TVDetailView";

// Static export prerenders one placeholder; Cloudflare _redirects serves this
// shell for any /tv/:id and TVDetailView reads the real id on the client.
export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function TVPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TVDetailView />
    </Suspense>
  );
}
