import { db } from "@/db";
import {
  competitions,
  states,
  regions,
  competitionDelegates,
  competitionOrganizers,
  user,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  getPublicStatusColor,
  formatPublicStatus,
  getInternalStatusColor,
  formatInternalStatus,
} from "@/lib/utils";
import { cn } from "@workspace/ui/lib/utils";
import { eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { unauthorized } from "next/navigation";

export default async function Page() {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    unauthorized();
  }

  // Get competition IDs where user is an organizer
  const userOrganizerCompetitions = await db
    .select({ competitionId: competitionOrganizers.competitionId })
    .from(competitionOrganizers)
    .where(eq(competitionOrganizers.organizerWcaId, session.user.wcaId));

  const competitionIds = userOrganizerCompetitions.map((c) => c.competitionId);

  if (competitionIds.length === 0) {
    return (
      <main className="p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Tus competencias</h1>
            <p className="text-muted-foreground mt-2">
              Aquí puedes ver las competencias que tienes programadas.
            </p>
          </div>
          <p className="text-muted-foreground">
            No tienes competencias solicitadas.
          </p>
        </div>
      </main>
    );
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
    .where(inArray(competitions.id, competitionIds));

  // Fetch delegates for each competition
  const delegates = await db
    .select({
      competitionId: competitionDelegates.competitionId,
      delegateName: user.name,
      delegateWcaId: user.wcaId,
      isPrimary: competitionDelegates.isPrimary,
    })
    .from(competitionDelegates)
    .leftJoin(user, eq(competitionDelegates.delegateWcaId, user.wcaId))
    .where(inArray(competitionDelegates.competitionId, competitionIds));

  // Fetch organizers for each competition
  const organizers = await db
    .select({
      competitionId: competitionOrganizers.competitionId,
      organizerName: user.name,
      organizerWcaId: user.wcaId,
      isPrimary: competitionOrganizers.isPrimary,
    })
    .from(competitionOrganizers)
    .leftJoin(user, eq(competitionOrganizers.organizerWcaId, user.wcaId))
    .where(inArray(competitionOrganizers.competitionId, competitionIds));

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

  // Group organizers by competition
  const organizersByCompetition = organizers.reduce(
    (acc, organizer) => {
      if (!acc[organizer.competitionId]) {
        acc[organizer.competitionId] = [];
      }
      acc[organizer.competitionId]?.push(organizer);
      return acc;
    },
    {} as Record<number, typeof organizers>,
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
              const compOrganizers = organizersByCompetition[comp.id] || [];
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
                  {compOrganizers.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">
                        {compOrganizers.length === 1
                          ? "Organizador:"
                          : "Organizadores:"}
                      </span>{" "}
                      {compOrganizers.map((o, i) => (
                        <span key={o.organizerWcaId}>
                          {o.organizerName} ({o.organizerWcaId})
                          {o.isPrimary && " (Principal)"}
                          {i < compOrganizers.length - 1 && ", "}
                        </span>
                      ))}
                    </div>
                  )}
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
