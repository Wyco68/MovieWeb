import "./globals.css";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  title: "NextFlix",
  description: "Movie Search App using Next.js",
  metadataBase: new URL(siteUrl),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Header />
          <section className="app-content">
            <Sidebar />
            <main className="content-panel">{children}</main>
          </section>
        </div>
      </body>
    </html>
  );
}
