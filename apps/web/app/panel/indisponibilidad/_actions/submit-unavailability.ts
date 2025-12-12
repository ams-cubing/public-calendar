"use server";

import { db } from "@/db";
import { unavailability } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function submitUnavailability(data: {
  startDate: Date;
  endDate: Date;
  note?: string;
}) {
  try {
    const session = await auth();

    if (!session?.user?.wcaId) {
      return {
        success: false,
        message: "Debes iniciar sesión para registrar indisponibilidad",
      };
    }

    // Insert unavailability record
    await db.insert(unavailability).values({
      userWcaId: session.user.wcaId,
      startDate: data.startDate.toISOString().split("T")[0]!,
      endDate: data.endDate.toISOString().split("T")[0]!,
      note: data.note || null,
    });

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
