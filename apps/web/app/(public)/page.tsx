import { db } from "@/db";
import { not, eq } from "drizzle-orm";
import { CalendarView } from "./_components/calendar-view";
import Link from "next/link";
import { buttonVariants } from "@workspace/ui/components/button";

interface PageProps {
  searchParams?: Promise<{
    region?: string;
  }>;
}

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;

  const regionFilter = searchParams?.region;

  const competitions = await db.query.competitions.findMany({
    where: (t, { and }) =>
      and(
        // Hide internal drafts from public view
        not(eq(t.statusPublic, "unavailable")),
        regionFilter ? eq(t.stateId, regionFilter) : undefined,
      ),
    orderBy: (t, { asc }) => [asc(t.startDate)],
    with: {
      state: {
        with: { region: true },
      },
    },
  });

  return (
    <main className="sm:p-6 py-6 px-2">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Calendario de Competencias</h1>
          <Link
            href="/solicitar-fecha"
            className={buttonVariants({
              variant: "default",
            })}
          >
            Solicitar fecha
          </Link>
        </div>

        <CalendarView competitions={competitions} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competitions.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No hay competencias programadas en esta región.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
