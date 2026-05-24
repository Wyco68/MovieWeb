import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, Info } from "lucide-react";

export default function HeroSection({ featured, featuredBackdrop, featuredYear }) {
  if (!featured || !featuredBackdrop) return null;

  return (
    <section className="hero-panel mb-8 border-0 md:border md:border-[var(--app-panel-border)] shadow-none md:shadow-[rgba(50,50,93,0.25)_0_30px_45px_-30px,rgba(0,0,0,0.1)_0_18px_36px_-18px] md:rounded-[8px]">
      <Image
        src={featuredBackdrop}
        alt={`${featured.title || featured.name} backdrop`}
        fill
        priority
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 960px"
      />
      <div className="hero-overlay" />
      <div className="hero-content p-4 md:p-8">
        <p className="hero-kicker mb-2 text-[10px] md:text-[12px]">Featured Tonight</p>
        <h2 className="hero-title text-3xl md:text-5xl font-light tracking-tight">{featured.title || featured.name}</h2>
        <p className="hero-meta mt-3 text-sm md:text-base opacity-90">
          {featuredYear} &bull; Rating {featured.vote_average?.toFixed?.(1) || "-"}
        </p>
        <p className="hero-copy mt-4 text-sm md:text-[15px] max-w-[58ch] leading-relaxed opacity-95">
          {featured.overview ||
            "Explore one of the most talked-about titles right now and dive into a complete cast and detail view."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-[#533afd] text-white hover:bg-[#4434d4] border-0">
            <Link href={`/movie/${featured.id}`}>
              <Play className="w-4 h-4 mr-2 fill-current" />
              Watch Trailer
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm">
            <Link href={`/movie/${featured.id}`}>
              <Info className="w-4 h-4 mr-2" />
              More Info
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
