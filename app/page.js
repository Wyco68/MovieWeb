import Movies from "@/components/Movies";
import Image from "next/image";
import Link from "next/link";
import {
  getConfiguredImageUrl,
  getTmdbImageConfig,
  tmdbFetch,
} from "@/lib/tmdb";

export default async function Home() {
  const [popular, trending, tvPopular, peoplePopular, imageConfig] = await Promise.all([
    tmdbFetch("/movie/popular"),
    tmdbFetch("/trending/movie/day"),
    tmdbFetch("/tv/popular"),
    tmdbFetch("/person/popular"),
    getTmdbImageConfig(),
  ]);

  const featured = popular?.results?.[0];
  const featuredBackdrop = getConfiguredImageUrl(featured?.backdrop_path, {
    config: imageConfig,
    type: "backdrop",
    variant: "lg",
  });
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
                <span className="inline-flex items-center rounded-[4px] bg-[#533afd] px-4 py-2 text-[14px] text-white">
                  View Details
                </span>
              </Link>
              <Link href="/search">
                <span className="hero-cta-soft inline-flex items-center rounded-[4px] border px-4 py-2 text-[14px] backdrop-blur-sm">
                  Explore More
                </span>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <h3 className="section-title">Popular</h3>
      <Movies movies={popular?.results ?? []} imageConfig={imageConfig} />

      <h3 className="section-title mt-8">Trending</h3>
      <Movies movies={trending?.results ?? []} imageConfig={imageConfig} />

      <h3 className="section-title mt-8">Popular TV Shows</h3>
      <Movies movies={tvPopular?.results ?? []} mediaType="tv" imageConfig={imageConfig} />

      <h3 className="section-title mt-8">Popular People</h3>
      <Movies movies={peoplePopular?.results ?? []} mediaType="person" imageConfig={imageConfig} />
    </div>
  );
}
