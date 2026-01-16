import { db } from "@/db";
import { CompetitionForm } from "../_components/competition-form";
import { notFound } from "next/navigation";

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

  const availableDates = [] as Date[];

  // Transform competition data to match the expected format
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
          availableDates={availableDates}
          delegates={delegates}
          competition={formattedCompetition}
        />
      </div>
    </main>
  );
}
