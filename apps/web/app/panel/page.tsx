import { db } from "@/db";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { buttonVariants } from "@workspace/ui/components/button";
import { DataTable } from "./_components/data-table";

export default async function Page() {
  const allComps = await db.query.competitions.findMany({
    orderBy: (t, { asc }) => [asc(t.startDate)],
    with: {
      state: {
        with: {
          region: true,
        },
      },
      delegates: {
        with: {
          delegate: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vista Privada de Delegado</h1>
        <Link
          href="/panel/competencias/nueva"
          className={buttonVariants({ variant: "default" })}
        >
          <PlusCircle size={18} />
          Nueva Competencia
        </Link>
      </div>

      <DataTable data={allComps} />
    </div>
  );
}
