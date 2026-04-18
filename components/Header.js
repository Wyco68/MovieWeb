import Link from "next/link";
import { redirect } from "next/navigation";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export default async function Header() {
  async function search(formData) {
    "use server";

    const q = String(formData.get("q") ?? "").trim();

    if (!q) {
      redirect("/");
    }

    const query = new URLSearchParams({ q }).toString();
    redirect(`/search?${query}`);
  }

  return (
    <nav className="app-nav mt-4 px-4 py-3 flex items-center justify-between gap-3">
      <Link href="/" className="text-white no-underline hover:opacity-90 flex flex-col">
        <span className="font-semibold text-[18px] tracking-[-0.26px]">NextFlix</span>
        <span className="text-[11px] uppercase tracking-[0.14em] text-white/60">
          Cinematic Explorer
        </span>
      </Link>
      <form action={search} className="flex gap-2 w-full max-w-[460px] items-center">
        <Input type="text" name="q" placeholder="Search movies, actors, keywords" />
        <Button type="submit" className="min-w-[104px] font-medium">
          Find
        </Button>
      </form>
    </nav>
  );
}
