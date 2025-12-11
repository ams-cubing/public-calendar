import { db } from "@/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";
import { PlusCircle, Pencil } from "lucide-react";

export default async function Page() {
  const session = await auth();

  // Double-check security (Middleware handles this, but safe to keep)
  // if (session?.user?.role !== 'delegate') {
  //   redirect("/");
  // }

  // Fetch EVERYTHING needed for the private view
  const allComps = await db.query.competitions.findMany({
    orderBy: (t, { asc }) => [asc(t.startDate)],
    with: {
      state: true,
      delegate: true, // The primary delegate
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Vista Privada de Delegado
        </h1>
        <Link
          href="/dashboard/competitions/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <PlusCircle size={18} />
          Nueva Competencia
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4 whitespace-nowrap">Fecha</th>
                <th className="p-4 whitespace-nowrap">Nombre / Estado</th>
                <th className="p-4 whitespace-nowrap">Semáforo (Público)</th>
                <th className="p-4 whitespace-nowrap">Estado Interno</th>
                <th className="p-4 whitespace-nowrap">Delegado</th>
                <th className="p-4 whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allComps.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono text-slate-600">
                    {new Date(row.startDate).toLocaleDateString("es-MX")}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-900">
                      {row.name || "Sin nombre"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {row.city}, {row.state.id}
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={row.statusPublic} />
                  </td>
                  <td className="p-4">
                    {/* Show internal tracking status */}
                    <StatusBadge status={row.statusInternal} />
                  </td>
                  <td className="p-4">
                    {row.delegate?.name ? (
                      <span className="flex items-center gap-2">
                        <img
                          src={row.delegate.avatarUrl || ""}
                          className="w-5 h-5 rounded-full"
                        />
                        {row.delegate.name.split(" ")[0]}{" "}
                        {/* First name only for compactness */}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">--</span>
                    )}
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/dashboard/competitions/${row.id}`}
                      className="text-slate-500 hover:text-blue-600"
                    >
                      <Pencil size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
