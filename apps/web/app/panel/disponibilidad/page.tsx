import { db } from "@/db";
import { AvailabilityForm } from "./_components/availability-form";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const availabilityDates = await db.query.availability.findMany({
    where: (availability, { eq }) =>
      eq(availability.userWcaId, session?.user.wcaId ?? ""),
    columns: {
      date: true,
    },
  });

  return (
    <main className="p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Registrar Disponibilidad</h1>
          <p className="text-muted-foreground mt-2">
            Complete el formulario para registrar su disponibilidad.
          </p>
        </div>
        <AvailabilityForm availabilityDates={availabilityDates} />
      </div>
    </main>
  );
}
