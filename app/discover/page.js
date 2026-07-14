import { Suspense } from "react";
import Loading from "@/app/loading";
import DiscoverView from "./DiscoverView";

// Server shell (prerendered to static HTML). The Suspense boundary is required
// because DiscoverView reads the URL query with useSearchParams on the client.
export default function DiscoverPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DiscoverView />
    </Suspense>
  );
}
