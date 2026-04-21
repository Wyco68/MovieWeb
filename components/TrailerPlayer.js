"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

let youtubeApiPromise;

function loadYouTubeIframeApi() {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve) => {
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');

      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.head.appendChild(script);
      }

      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousReady === "function") {
          previousReady();
        }
        resolve(window.YT);
      };

      const readyCheck = window.setInterval(() => {
        if (window.YT?.Player) {
          window.clearInterval(readyCheck);
          resolve(window.YT);
        }
      }, 100);
    });
  }

  return youtubeApiPromise;
}

function sortYoutubeVideos(videos) {
  const candidates = (videos ?? []).filter((video) => {
    return video?.site === "YouTube" && video?.key;
  });

  const typeScoreMap = {
    Trailer: 4,
    Teaser: 3,
    Clip: 2,
    Featurette: 1,
  };

  const scored = candidates.map((video) => {
    let score = 0;

    if (video.official) {
      score += 50;
    }

    score += (typeScoreMap[video.type] ?? 0) * 10;

    if (video.iso_639_1 === "en") {
      score += 8;
    }

    if (!video.iso_639_1) {
      score += 3;
    }

    score += Math.min(Number(video.size) || 0, 2160) / 240;

    if (typeof video.name === "string") {
      const lower = video.name.toLowerCase();

      if (lower.includes("official")) {
        score += 10;
      }

      if (lower.includes("trailer")) {
        score += 6;
      }
    }

    const publishedAt = Date.parse(video.published_at || "") || 0;
    score += publishedAt / 1e12;

    return { video, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((item) => item.video);
}

export default function TrailerPlayer({
  videos,
  title,
  fallbackImageUrl,
  fallbackImageAlt,
  unavailableText,
}) {
  const sortedVideos = useMemo(() => sortYoutubeVideos(videos), [videos]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFallback, setShowFallback] = useState(sortedVideos.length === 0);
  const failedKeysRef = useRef(new Set());
  const playerHostRef = useRef(null);

  useEffect(() => {
    failedKeysRef.current = new Set();
    setActiveIndex(0);
    setShowFallback(sortedVideos.length === 0);
  }, [sortedVideos]);

  useEffect(() => {
    if (showFallback || sortedVideos.length === 0) {
      return undefined;
    }

    const activeVideo = sortedVideos[activeIndex];
    if (!activeVideo?.key) {
      setShowFallback(true);
      return undefined;
    }

    let cancelled = false;
    let player;

    const moveToNextCandidate = () => {
      const failedKeys = failedKeysRef.current;
      failedKeys.add(activeVideo.key);

      const nextIndex = sortedVideos.findIndex((video) => !failedKeys.has(video.key));
      if (nextIndex === -1) {
        setShowFallback(true);
        return;
      }

      setActiveIndex(nextIndex);
    };

    loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled || !YT?.Player || !playerHostRef.current) {
          return;
        }

        playerHostRef.current.innerHTML = "";
        player = new YT.Player(playerHostRef.current, {
          width: "100%",
          height: "100%",
          videoId: activeVideo.key,
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onError: () => {
              moveToNextCandidate();
            },
          },
        });
      })
      .catch(() => {
        setShowFallback(true);
      });

    return () => {
      cancelled = true;
      if (player?.destroy) {
        player.destroy();
      }
    };
  }, [activeIndex, showFallback, sortedVideos]);

  if (showFallback) {
    return (
      <>
        {fallbackImageUrl ? (
          <Image
            src={fallbackImageUrl}
            alt={fallbackImageAlt}
            width={1280}
            height={720}
            sizes="(max-width: 768px) 100vw, 900px"
            className="w-full h-auto rounded-[6px] border border-[var(--app-panel-border)]"
            priority
          />
        ) : (
          <div className="w-full min-h-[260px] rounded-[6px] border border-[var(--app-panel-border)] bg-gradient-to-br from-[#5b45ff]/25 via-[#533afd]/18 to-[#0d253d]/20 dark:from-[#5b45ff]/30 dark:via-[#2f2f75]/40 dark:to-[#0d253d]/55 flex items-center justify-center">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/80">
              No Photo
            </span>
          </div>
        )}
        <p className="mt-2 text-[13px] font-medium muted-label">{unavailableText}</p>
      </>
    );
  }

  return (
    <div className="overflow-hidden rounded-[8px] border border-[var(--app-panel-border)] bg-black">
      <div className="relative w-full pt-[56.25%]">
        <div ref={playerHostRef} className="absolute inset-0 h-full w-full" aria-label={`${title} trailer`} />
      </div>
    </div>
  );
}
