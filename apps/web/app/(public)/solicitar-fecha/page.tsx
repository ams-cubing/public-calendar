import { availability, regions, states, user } from "@/db/schema";
import { DateRequestForm } from "./_components/date-request-form";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { formatDistance } from "date-fns";
import { es } from "date-fns/locale";
import { headers } from "next/headers";
import { Mail } from "lucide-react";

interface PageProps {
  searchParams?: Promise<{
    estado?: string;
  }>;
}

export default async function Page(props: PageProps) {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    return (
      <main className="p-6">
        <div>Inicia sesión para solicitar una fecha de competencia.</div>
      </main>
    );
  }

  const recentRequestsCount = await db.query.competitions.findMany({
    where: (competitions, { and, gte, eq }) =>
      and(
        eq(competitions.requestedBy, session.user.wcaId),
        gte(
          competitions.createdAt,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        ),
      ),
  });

  const MAX_REQUESTS_PER_WEEK = 3;
  const canSubmit = recentRequestsCount.length < MAX_REQUESTS_PER_WEEK;

  if (!canSubmit) {
    return (
      <main className="p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">
              Solicitar Fecha de Competencia
            </h1>
            <p className="text-muted-foreground mt-2">
              Complete el formulario para solicitar una fecha para su
              competencia. El delegado será asignado automáticamente según la
              ubicación.
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 dark:border-yellow-700 dark:bg-yellow-900 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-300">
              Has alcanzado el límite de solicitudes por semana (
              {MAX_REQUESTS_PER_WEEK}). Por favor, intenta nuevamente en{" "}
              {formatDistance(
                new Date(
                  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
                  recentRequestsCount[0]?.createdAt?.getTime()! +
                    7 * 24 * 60 * 60 * 1000,
                ),
                new Date(),
                {
                  locale: es,
                },
              )}
              .
            </p>
          </div>
        </div>
      </main>
    );
  }

  const searchParams = await props.searchParams;

  const stateFilter = searchParams?.estado;

  const delegates = stateFilter
    ? await db
        .select({
          name: user.name,
          email: user.email,
        })
        .from(user)
        .innerJoin(regions, eq(user.regionId, regions.id))
        .innerJoin(states, eq(regions.id, states.regionId))
        .where(eq(states.id, stateFilter))
    : [];

  const availabilityData = stateFilter
    ? delegates.length > 0
      ? await db
          .select({
            date: availability.date,
          })
          .from(availability)
          .innerJoin(user, eq(availability.userWcaId, user.wcaId))
          .innerJoin(regions, eq(user.regionId, regions.id))
          .innerJoin(states, eq(regions.id, states.regionId))
          .where(eq(states.id, stateFilter))
          .orderBy(availability.date)
          .groupBy(availability.date)
      : await db
          .select({
            date: availability.date,
          })
          .from(availability)
          .orderBy(availability.date)
          .groupBy(availability.date)
    : [];

  const regionsData = stateFilter
    ? await db
        .select({
          regionName: regions.displayName,
        })
        .from(regions)
        .innerJoin(states, eq(regions.id, states.regionId))
        .where(eq(states.id, stateFilter))
        .limit(1)
    : [];

  const regionName = regionsData.length > 0 ? regionsData[0]?.regionName : null;

  return (
    <main className="p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Solicitar Fecha de Competencia</h1>
          <p className="text-muted-foreground mt-2">
            Complete el formulario para solicitar una fecha para su competencia.
            El delegado será asignado automáticamente según la ubicación.
          </p>
        </div>
        <DateRequestForm availability={availabilityData} />
        {availabilityData.length === 0 && stateFilter && (
          <div className="text-sm text-muted-foreground">
            No hay fechas disponibles para la región seleccionada. Por favor,
            considere seleccionar otra región o contactar a un delegado
            directamente.
          </div>
        )}
        {stateFilter && (
          <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-2">
              Región:{" "}
              <span className="font-normal text-muted-foreground">
                {regionName ?? "—"}
              </span>
            </h2>

            {delegates.length > 0 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Mostrando fechas disponibles de los delegados de dicha región:
                </p>

                <ul className="grid gap-2">
                  {delegates.map((delegate) => (
                    <li
                      key={delegate.email}
                      className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-md px-3 py-2"
                    >
                      <div className="text-sm">
                        <div className="font-medium">{delegate.name}</div>
                        <div className="text-xs text-muted-foreground">
                          <a
                            href={`mailto:${delegate.email}`}
                            className="hover:underline"
                          >
                            <Mail className="inline-block mr-1 h-3 w-3" />
                            {delegate.email}
                          </a>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No hay delegados disponibles para esta región, se mostrarán las
                fechas disponibles de todos los delegados.
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
