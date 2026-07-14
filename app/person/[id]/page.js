import { Suspense } from "react";
import Loading from "@/app/loading";
import PersonDetailView from "./PersonDetailView";

// Static export prerenders one placeholder; Cloudflare _redirects serves this
// shell for any /person/:id and PersonDetailView reads the real id on the client.
export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function PersonPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PersonDetailView />
    </Suspense>
  );
}
