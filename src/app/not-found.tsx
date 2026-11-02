import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { UI } from "@/lib/ui-strings";

/** A16: a real 404 in Indonesian instead of the framework's English default. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-2xl font-bold">{UI.notFound}</h1>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        {UI.nav.dashboard}
      </Link>
    </main>
  );
}
