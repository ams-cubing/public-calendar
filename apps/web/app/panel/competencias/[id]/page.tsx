import { db } from "@/db";
import { CompetitionForm } from "../_components/competition-form";
import { notFound } from "next/navigation";
import { DeleteCompetitionDialog } from "../_components/delete-competition";
import { formatAction } from "@/lib/utils";
import { DetailsDialog } from "./_components/details-dialog";

type Params = Promise<{ id: string }>;

export default async function Page({
  params,
}: {
  params: Params;
}): Promise<React.JSX.Element> {
  const { id } = await params;

  const competition = await db.query.competitions.findFirst({
    where: (competition, { eq }) => eq(competition.id, Number(id)),
    with: {
      delegates: {
        with: {
          delegate: true,
        },
      },
      organizers: {
        with: {
          organizer: true,
        },
      },
    },
  });

  if (!competition) {
    notFound();
  }

  const delegates = await db.query.user.findMany({
    where: (user, { eq }) => eq(user.role, "delegate"),
    orderBy: (user, { asc }) => asc(user.name),
  });

  const formattedCompetition = {
    ...competition,
    delegates: competition.delegates.map((d) => ({
      delegateWcaId: d.delegateWcaId,
      isPrimary: d.isPrimary,
    })),
    organizers: competition.organizers.map((o) => ({
      organizerWcaId: o.organizerWcaId,
      isPrimary: o.isPrimary,
    })),
  };

  const competitionLogs = await db.query.logs.findMany({
    where: (log, { eq }) => eq(log.targetId, String(competition.id)),
    with: { actor: true },
    orderBy: (log, { desc }) => desc(log.createdAt),
  });

  return (
    <main className="p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Editar Competencia</h1>
          <p className="text-muted-foreground mt-2">
            Modifica los detalles de la competencia según sea necesario.
          </p>
        </div>
        <CompetitionForm
          delegates={delegates}
          competition={formattedCompetition}
        />
        <DeleteCompetitionDialog competitionId={competition.id} />

        <div>
          <h2 className="text-2xl font-bold mb-4">Registro de Actividades</h2>
          <ul className="space-y-2">
            {competitionLogs.map((log) => (
              <li key={log.id} className="p-4 border rounded-md">
                <p className="text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
                <p>
                  {log.actor
                    ? `${log.actor.name} (${log.actor.wcaId})`
                    : "Usuario eliminado"}{" "}
                  realizó la siguiente acción:{" "}
                  <strong>{formatAction(log.action)}</strong>
                </p>
                <DetailsDialog details={log.details} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
