import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";

export function SemaphoreLegend() {
  const rows = [
    {
      label: "Fecha Abierta",
      color: "bg-pink-300 dark:bg-pink-600",
      desc: "La fecha no tiene ninguna organización activa. Te invitamos a ponerte en contacto con tu delegado disponible más cercano.",
    },
    {
      label: "Fecha Reservada",
      color: "bg-yellow-300 dark:bg-yellow-600",
      desc: "La fecha ha sido reservada por un equipo organizador, puedes consultar la disponibilidad de los demás delegados.",
    },
    {
      label: "Sede Confirmada",
      color: "bg-orange-300 dark:bg-orange-600",
      desc: "El organizador o equipo organizador cuenta con el oficio de sede, puedes consultar la disponibilidad de los demás delegados.",
    },
    {
      label: "Suspendida",
      color: "bg-red-400 dark:bg-red-700",
      desc: "Por razones ajenas tanto a la WCA como a los organizadores la competencia ha sido suspendida. Esta suspensión implica que existe la posibilidad de reprogramar el evento en una fecha posterior.",
    },
    {
      label: "Inhábil",
      color: "bg-gray-400 dark:bg-gray-700",
      desc: "Imposible de organizar debido a la política de 3 meses de anticipación o porque no hay delegados disponibles.",
    },
  ];

  return (
    <section className="w-full overflow-hidden">
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead colSpan={2} className="text-center">
              Explicación de colores en el semáforo
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.label}>
              <TableCell className={cn(r.color, "text-center")}>
                <span className="font-semibold">{r.label}</span>
              </TableCell>
              <TableCell className="p-6 text-sm leading-relaxed whitespace-normal wrap-break-word">
                {r.desc}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
