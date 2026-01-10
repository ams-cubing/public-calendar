import { auth } from "@/lib/auth";
import { UnavailabilityForm } from "./_components/unavailability";
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

  return (
    <main className="p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Registrar Indisponibilidad</h1>
          <p className="text-muted-foreground mt-2">
            Complete el formulario para registrar su indisponibilidad.
          </p>
        </div>
        <UnavailabilityForm />
      </div>
    </main>
  );
}
