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
    },
  });

  if (!competition) {
    notFound();
  }

  const delegates = await db.query.users.findMany({
    where: (user, { eq }) => eq(user.role, "delegate"),
    orderBy: (user, { asc }) => asc(user.name),
  });

  const unavailableDates = [] as Date[];

  return (
    <main className="p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Crear nueva Competencia</h1>
          <p className="text-muted-foreground mt-2">
            Usa el formulario a continuación para crear una nueva competencia.
          </p>
        </div>
        <CompetitionForm
          unavailableDates={unavailableDates}
          delegates={delegates}
          competition={competition}
        />
      </div>
    </main>
  );
}
