"use server";

import { db } from "@/db";
import { unavailability } from "@/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function submitUnavailability(data: { dates: Date[] }) {
  try {
    const headersList = await headers();

    const session = await auth.api.getSession({
      headers: headersList,
    });

    const userWcaId = session?.user?.wcaId;

    if (!userWcaId) {
      return {
        success: false,
        message: "Debes iniciar sesión para registrar indisponibilidad",
      };
    }

    if (!data.dates || data.dates.length === 0) {
      return {
        success: false,
        message: "No se seleccionaron fechas",
      };
    }

    // Prepare records for batch insertion
    // Each selected date creates a record where startDate == endDate (single day)
    const values = data.dates.map((date) => ({
      userWcaId: userWcaId,
      date: date.toISOString().split("T")[0]!,
    }));

    // Insert all unavailability records
    await db.insert(unavailability).values(values);

    revalidatePath("/solicitar-fecha");

    return {
      success: true,
      message: "Indisponibilidad registrada exitosamente",
    };
  } catch (error) {
    console.error("Error submitting unavailability:", error);
    return {
      success: false,
      message: "Error al registrar la indisponibilidad",
    };
  }
}
