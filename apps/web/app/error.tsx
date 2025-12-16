"use client";

import { buttonVariants } from "@workspace/ui/components/button";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold">500</h1>
          <h2 className="text-2xl font-semibold">Algo salió mal</h2>
        </div>

        <p className="text-muted-foreground">
          Lo sentimos, ha ocurrido un error inesperado. Por favor, intenta de
          nuevo.
        </p>

        <div className="flex gap-4 justify-center pt-4">
          <button
            onClick={reset}
            className={buttonVariants({ variant: "default" })}
          >
            Intentar de nuevo
          </button>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Ir al Inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
