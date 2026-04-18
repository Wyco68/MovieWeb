import Movies from "@/components/Movies";
import Image from "next/image";
import Link from "next/link";
import { tmdbFetch } from "@/lib/tmdb";
import { getImageUrl } from "@/lib/tmdb";

export default async function Home() {
  const [popular, trending] = await Promise.all([
    tmdbFetch("/movie/popular"),
    tmdbFetch("/trending/movie/day"),
  ]);

  const featured = popular?.results?.[0];
  const featuredBackdrop = getImageUrl(featured?.backdrop_path, "w1280");
  const featuredYear = featured?.release_date?.split("-")[0] ?? "N/A";

  return (
    <div>
      {featured && featuredBackdrop ? (
        <section className="hero-panel">
          <Image
            src={featuredBackdrop}
            alt={`${featured.title} backdrop`}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 960px"
          />
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="hero-kicker">Featured Tonight</p>
            <h2 className="hero-title">{featured.title}</h2>
            <p className="hero-meta">
              {featuredYear} • Rating {featured.vote_average?.toFixed?.(1) || "-"}
            </p>
            <p className="hero-copy">
              {featured.overview ||
                "Explore one of the most talked-about titles right now and dive into a complete cast and detail view."}
            </p>
            <div className="mt-5 flex gap-2">
              <Link href={`/movie/${featured.id}`}>
                <span className="inline-flex items-center rounded-[980px] bg-[#0071e3] px-4 py-2 text-[14px] text-white tracking-[-0.22px]">
                  View Details
                </span>
              </Link>
              <Link href="/search">
                <span className="inline-flex items-center rounded-[980px] border border-white/35 bg-white/10 px-4 py-2 text-[14px] text-white tracking-[-0.22px] backdrop-blur-sm">
                  Explore More
                </span>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <h3 className="section-title">Popular</h3>
      <Movies movies={popular?.results ?? []} />

      <h3 className="section-title mt-8">Trending</h3>
      <Movies movies={trending?.results ?? []} />
    </div>
  );
}
