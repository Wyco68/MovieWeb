import "./globals.css";
import Script from "next/script";
import { Suspense } from "react";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MobileSidebarDrawer from "@/components/MobileSidebarDrawer";
import ScrollToTopOnRouteChange from "@/components/ScrollToTopOnRouteChange";
import ThemeToggle from "@/components/ThemeToggle";

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
        <link rel="preconnect" href="https://api.themoviedb.org" crossOrigin="" />
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="" />
        <link rel="preconnect" href="https://www.youtube.com" crossOrigin="" />
        <link rel="preconnect" href="https://i.ytimg.com" crossOrigin="" />
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('nextflix-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d)){document.documentElement.classList.add('dark');}}catch(e){}})();`}
        </Script>
        <Script id="scroll-top-on-reload" strategy="beforeInteractive">
          {`(function(){try{var navEntry=(performance.getEntriesByType&&performance.getEntriesByType('navigation')[0])||null;var isReload=navEntry?navEntry.type==='reload':(performance.navigation&&performance.navigation.type===1);if(isReload){if('scrollRestoration' in history)history.scrollRestoration='manual';window.scrollTo(0,0);window.addEventListener('pageshow',function(){window.scrollTo(0,0);},{once:true});}}catch(e){}})();`}
        </Script>
      </head>
      <body>
        <ScrollToTopOnRouteChange />
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
