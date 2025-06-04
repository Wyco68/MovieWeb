import Link from "next/link";

export default async function Header() {
  return (
    <nav className="flex justify-between items-center border rounded border-slate-500 px-4 py-2 my-4">
      <h1 className="font-bold text-xl">
        <Link href="/" className="font-bold text-lg">
          Next Movies
        </Link>
      </h1>
    </nav>
  );
}
