import { DateRequestForm } from "./_components/date-request-form";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { formatDistance } from "date-fns";
import { es } from "date-fns/locale";
import { headers } from "next/headers";

export default async function Page() {
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

  // Check recent requests (e.g., last 24 hours)
  const recentRequestsCount = await db.query.competitions.findMany({
    where: (competitions, { and, gte, eq }) =>
      and(
        eq(competitions.requestedBy, session.user.wcaId),
        gte(competitions.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
      ),
  });

  const MAX_REQUESTS_PER_DAY = 3;
  const canSubmit = recentRequestsCount.length < MAX_REQUESTS_PER_DAY;

  const unavailableDates = [] as Date[];

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
        {canSubmit ? (
          <DateRequestForm unavailableDates={unavailableDates} />
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 dark:border-yellow-700 dark:bg-yellow-900 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-300">
              Has alcanzado el límite de solicitudes por día (
              {MAX_REQUESTS_PER_DAY}). Por favor, intenta nuevamente en{" "}
              {formatDistance(
                new Date(
                  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
                  recentRequestsCount[0]?.createdAt?.getTime()! +
                    24 * 60 * 60 * 1000,
                ),
                new Date(),
                {
                  locale: es,
                },
              )}
              .
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
