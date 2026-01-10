import { db } from "@/db";
import { UnavailabilityForm } from "./_components/unavailability";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const unavailabilityDates = await db.query.unavailability.findMany({
    where: (unavailability, { eq }) =>
      eq(unavailability.userWcaId, session?.user.wcaId ?? ""),
    columns: {
      date: true,
    },
  });

  return (
    <main className="p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Registrar Indisponibilidad</h1>
          <p className="text-muted-foreground mt-2">
            Complete el formulario para registrar su indisponibilidad.
          </p>
        </div>
        <UnavailabilityForm unavailabilityDates={unavailabilityDates} />
      </div>
    </main>
  );
}
