import { auth } from "@/auth";
import { db } from "@/db";
import {
  competitions,
  states,
  regions,
  competitionDelegates,
  users,
} from "@/db/schema";
import {
  getPublicStatusColor,
  formatPublicStatus,
  getInternalStatusColor,
  formatInternalStatus,
} from "@/lib/utils";
import { cn } from "@workspace/ui/lib/utils";
import { eq, inArray } from "drizzle-orm";
import { unauthorized } from "next/navigation";

export default async function Page() {
  const session = await auth();

  if (!session) {
    unauthorized();
  }

  const userCompetitions = await db
    .select({
      id: competitions.id,
      name: competitions.name,
      city: competitions.city,
      startDate: competitions.startDate,
      endDate: competitions.endDate,
      trelloUrl: competitions.trelloUrl,
      statusPublic: competitions.statusPublic,
      statusInternal: competitions.statusInternal,
      stateName: states.name,
      regionName: regions.displayName,
    })
    .from(competitions)
    .leftJoin(states, eq(competitions.stateId, states.id))
    .leftJoin(regions, eq(states.regionId, regions.id))
    .where(eq(competitions.requestedBy, session.user.wcaId));

  // Fetch delegates for each competition
  const competitionIds = userCompetitions.map((c) => c.id);
  const delegates = await db
    .select({
      competitionId: competitionDelegates.competitionId,
      delegateName: users.name,
      delegateWcaId: users.wcaId,
      isPrimary: competitionDelegates.isPrimary,
    })
    .from(competitionDelegates)
    .leftJoin(users, eq(competitionDelegates.delegateWcaId, users.wcaId))
    .where(inArray(competitionDelegates.competitionId, competitionIds)); // You'll need to use `inArray` for multiple IDs

  // Group delegates by competition
  const delegatesByCompetition = delegates.reduce(
    (acc, delegate) => {
      if (!acc[delegate.competitionId]) {
        acc[delegate.competitionId] = [];
      }
      acc[delegate.competitionId]?.push(delegate);
      return acc;
    },
    {} as Record<number, typeof delegates>,
  );

  return (
    <main className="p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Tus competencias</h1>
          <p className="text-muted-foreground mt-2">
            Aquí puedes ver las competencias que tienes programadas.
          </p>
        </div>

        <div className="space-y-4">
          {userCompetitions.length === 0 ? (
            <p className="text-muted-foreground">
              No tienes competencias solicitadas.
            </p>
          ) : (
            userCompetitions.map((comp) => {
              const compDelegates = delegatesByCompetition[comp.id] || [];
              return (
                <div key={comp.id} className="border rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-lg">
                    {comp.name || "Competencia sin nombre"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {comp.city}, {comp.stateName} ({comp.regionName})
                  </p>
                  <p className="text-sm">
                    {new Date(comp.startDate).toLocaleDateString("es-MX")} -{" "}
                    {new Date(comp.endDate).toLocaleDateString("es-MX")}
                  </p>
                  {compDelegates.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">
                        {compDelegates.length === 1
                          ? "Delegado:"
                          : "Delegados:"}
                      </span>{" "}
                      {compDelegates.map((d, i) => (
                        <span key={d.delegateWcaId}>
                          {d.delegateName} ({d.delegateWcaId})
                          {d.isPrimary && " (Principal)"}
                          {i < compDelegates.length - 1 && ", "}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded",
                        getPublicStatusColor(comp.statusPublic),
                      )}
                    >
                      {formatPublicStatus(comp.statusPublic)}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded",
                        getInternalStatusColor(comp.statusInternal),
                      )}
                    >
                      {formatInternalStatus(comp.statusInternal)}
                    </span>
                  </div>
                  {comp.trelloUrl && (
                    <a
                      href={comp.trelloUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline"
                    >
                      Ver en Trello
                    </a>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
