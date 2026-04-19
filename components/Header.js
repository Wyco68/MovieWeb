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
      <Link href="/" className="no-underline hover:opacity-90 flex flex-col">
        <span className="nav-brand-title font-semibold text-[18px] tracking-[-0.26px]">
          NextFlix
        </span>
        <span className="nav-brand-subtitle text-[11px] uppercase tracking-[0.14em]">
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
