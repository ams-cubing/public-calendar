import { db } from "@/db";
import { CompetitionForm } from "../_components/competition-form";
import { Suspense } from "react";

export default async function Page() {
  const unavailableDates = [] as Date[];

  const delegates = await db.query.users.findMany({
    where: (user, { eq }) => eq(user.role, "delegate"),
    orderBy: (user, { asc }) => asc(user.name),
  });

  return (
    <main className="p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Crear nueva Competencia</h1>
          <p className="text-muted-foreground mt-2">
            Usa el formulario a continuación para crear una nueva competencia.
          </p>
        </div>
        <Suspense>
          <CompetitionForm
            unavailableDates={unavailableDates}
            delegates={delegates}
          />
        </Suspense>
      </div>
    </main>
  );
}
