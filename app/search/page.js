import { Suspense } from "react";
import Loading from "@/app/loading";
import SearchView from "./SearchView";

// Server shell (prerendered to static HTML). The Suspense boundary is required
// because SearchView reads the URL query with useSearchParams on the client.
export default function SearchPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchView />
    </Suspense>
  );
}
