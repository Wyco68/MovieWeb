import "./globals.css";
import Script from "next/script";
import { Suspense } from "react";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MobileSidebarDrawer from "@/components/MobileSidebarDrawer";
import ScrollToTopOnRouteChange from "@/components/ScrollToTopOnRouteChange";
import ThemeToggle from "@/components/ThemeToggle";

// The layout's Sidebar fetches TMDB data, so no page can be prerendered
// without TMDB_TOKEN. Rendering everything on demand lets the Docker image
// build without secrets; responses stay cached (lib/tmdb.js + Cloudflare).
export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  title: "NextFlix",
  description: "Movie and TV Show explorer powered by TMDB",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="" />
        <link rel="preconnect" href="https://www.youtube.com" crossOrigin="" />
        <link rel="preconnect" href="https://i.ytimg.com" crossOrigin="" />
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        <Script src="/scroll-top-on-reload.js" strategy="beforeInteractive" />
      </head>
      <body>
        <Suspense fallback={null}>
          <ScrollToTopOnRouteChange />
        </Suspense>
        <div className="app-shell">
          <Suspense fallback={<div className="app-nav mt-4 h-[68px]" />}>
            <Header />
          </Suspense>
          <section className="app-content">
            <MobileSidebarDrawer>
              <Sidebar />
            </MobileSidebarDrawer>
            <main className="content-panel">{children}</main>
          </section>
        </div>
        <div className="theme-fab">
          <ThemeToggle />
        </div>
      </body>
    </html>
  );
}
