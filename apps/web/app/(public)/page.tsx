import { db } from "@/db";
import { eq, asc } from "drizzle-orm";
import { CalendarView } from "./_components/calendar-view";
import { RegionFilter } from "./_components/region-filter";
import { competitions, regions, states } from "@/db/schema";

interface PageProps {
  searchParams?: Promise<{
    region?: string;
  }>;
}

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;

  const regionFilter = searchParams?.region;

  const compsRaw = await db.select()
    .from(competitions)
    .innerJoin(
      states, eq(competitions.stateId, states.id))
    .innerJoin(
      regions, eq(states.regionId, regions.id))
    .where(
      regionFilter
        ? eq(regions.id, regionFilter)
        : undefined)
    .orderBy(asc(competitions.startDate));

  const comps = compsRaw.map((row) => {
    const c = row.competition;
    const s = row.state;
    const r = row.region;

    return {
      id: c.id,
      name: c.name ?? null,
      city: c.city,
      stateId: c.stateId,
      requestedBy: c.requestedBy ?? null,
      trelloUrl: c.trelloUrl ?? null,
      startDate: c.startDate,
      endDate: c.endDate,
      statusPublic: c.statusPublic,
      statusInternal: c.statusInternal,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      state: {
        id: s.id,
        name: s.name,
        regionId: s.regionId,
        region: {
          id: r.id,
          displayName: r.displayName,
          mapColor: r.mapColor,
        },
      },
    };
  });

  const availability = await db.query.availability.findMany({
    orderBy: (t, { asc }) => [asc(t.date)],
    columns: {
      date: true,
    },
  });

  const holidays = await db.query.holidays.findMany();

  const reg = await db.query.regions.findMany({
    orderBy: (t, { asc }) => [asc(t.displayName)],
  });

  return (
    <main className="sm:p-6 py-6 px-2">
      <div className="max-w-6xl mx-auto space-y-8">
        <RegionFilter regions={reg} selected={regionFilter ?? ""} />
        <CalendarView
          competitions={comps}
          holidays={holidays}
          availability={availability}
        />
      </div>
    </main>
  );
}
