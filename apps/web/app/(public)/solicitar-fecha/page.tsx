import { auth } from "@/auth";
import { DateRequestForm } from "./_components/date-request-form";

export default async function Page() {
  const session = await auth();

  return (
    <main className="p-6">
      {session ? (
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Solicitar Fecha de Competencia</h1>
            <p className="text-muted-foreground mt-2">
              Complete el formulario para solicitar una fecha para su competencia.
              El delegado será asignado automáticamente según la ubicación.
            </p>
          </div>
          <DateRequestForm />
        </div>
      ) : (
        <div>
          Inicia sesión para solicitar una fecha de competencia.
        </div>
      )}
    </main>
  );
}
