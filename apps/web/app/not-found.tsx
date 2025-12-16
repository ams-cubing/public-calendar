import { buttonVariants } from "@workspace/ui/components/button";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold">404</h1>
          <h2 className="text-2xl font-semibold">Página no encontrada</h2>
        </div>

        <p className="text-muted-foreground">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>

        <div className="flex gap-4 justify-center pt-4">
          <Link href="/" className={buttonVariants({ variant: "default" })}>
            Ir al Inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
