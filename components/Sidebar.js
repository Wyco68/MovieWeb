import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Sidebar() {
  return (
    <aside className="w-[220px] flex flex-col gap-1">
      <Button className="justify-start" variant="outline" asChild>
        <Link href="/genres/action/1">Action</Link>
      </Button>
      <Button className="justify-start" variant="outline" asChild>
        <Link href="/genres/drama/1">Drama</Link>
      </Button>
    </aside>
  );
}
