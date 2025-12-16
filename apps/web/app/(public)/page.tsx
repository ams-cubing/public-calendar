import { db } from "@/db";
import { not, eq } from "drizzle-orm";
import { CalendarView } from "./_components/calendar-view";

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
        <CalendarView competitions={competitions} />
      </div>
    </main>
  );
}
