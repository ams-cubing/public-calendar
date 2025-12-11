import { db } from "@/db";
import { states } from "@/db/schema";
// import { createCompetitionAction } from "./actions"; // We'll define this

export default async function NewCompetitionPage() {
  // Fetch states for the dropdown
  const allStates = await db.select().from(states);

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg border shadow-sm">
      <h2 className="text-xl font-bold mb-6">Registrar Posible Competencia</h2>

      <form
        // action={createCompetitionAction}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <select name="stateId" className="w-full border p-2 rounded">
              {allStates.map((s) => (
                <option value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ciudad</label>
            <input
              name="city"
              type="text"
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
          <input
            name="startDate"
            type="date"
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Hidden default status */}
        <input type="hidden" name="statusInternal" value="draft" />

        <button
          type="submit"
          className="w-full bg-slate-900 text-white py-2 rounded"
        >
          Guardar Borrador
        </button>
      </form>
    </div>
  );
}
