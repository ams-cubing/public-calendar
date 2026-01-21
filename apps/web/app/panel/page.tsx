import { db } from "@/db";
import Link from "next/link";
import { PlusCircle, Pencil } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { buttonVariants } from "@workspace/ui/components/button";
import {
  getPublicStatusColor,
  formatPublicStatus,
  formatInternalStatus,
  getInternalStatusColor,
} from "@/lib/utils";
import { cn } from "@workspace/ui/lib/utils";
import { AvatarGroup } from "@workspace/ui/components/avatar-group";

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

      <div className="rounded-lg border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fechas</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Semáforo</TableHead>
                <TableHead>Estado Interno</TableHead>
                <TableHead>Delegado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allComps.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono">
                    {new Date(row.startDate).toISOString().split("T")[0]} -{" "}
                    {new Date(row.endDate).toISOString().split("T")[0]}
                  </TableCell>
                  <TableCell>
                    {row.name || "Sin nombre"}
                  </TableCell>
                  <TableCell>
                    {row.city}, {row.state.name}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded",
                        getPublicStatusColor(row.statusPublic),
                      )}
                    >
                      {formatPublicStatus(row.statusPublic)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded",
                        getInternalStatusColor(row.statusInternal),
                      )}
                    >
                      {formatInternalStatus(row.statusInternal)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {row.delegates.length > 0 ? (
                      <AvatarGroup size={24}>
                        {row.delegates
                          .sort(
                            (a, b) =>
                              (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0),
                          )
                          .map((d) => (
                            <Avatar
                              key={d.delegateWcaId}
                              title={`${d.delegate.name}${d.isPrimary ? " (Principal)" : ""}`}
                            >
                              <AvatarImage
                                src={d.delegate.image || undefined}
                                alt={d.delegate.name}
                              />
                              <AvatarFallback>
                                {d.delegate.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                      </AvatarGroup>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Sin asignar
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/panel/competencias/${row.id}`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "icon",
                      })}
                    >
                      <Pencil size={16} />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {allComps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No hay competencias disponibles.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
