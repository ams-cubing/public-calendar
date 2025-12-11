"use server";

import { db } from "@/db";
import { competitions, availability, users, states } from "@/db/schema";
import { z } from "zod";
import { eq, and, lte, gte, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const dateRequestSchema = z.object({
  city: z.string().min(2),
  stateId: z.string().min(1),
  startDate: z.date(),
  endDate: z.date(),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be after start date",
});

export async function submitDateRequest(data: z.infer<typeof dateRequestSchema>) {
  try {
    // Validate input
    const validatedData = dateRequestSchema.parse(data);

    // 1. Get the state and its region
    const state = await db.query.states.findFirst({
      where: eq(states.id, validatedData.stateId),
      with: {
        region: true,
      },
    });

    if (!state) {
      return {
        success: false,
        message: "Estado no encontrado",
      };
    }

    // 2. Find delegates in the same region
    const delegatesInRegion = await db.query.users.findMany({
      where: and(
        eq(users.regionId, state.regionId),
        eq(users.role, "delegate")
      ),
    });

    // if (delegatesInRegion.length === 0) {
    //   return {
    //     success: false,
    //     message: "No hay delegados disponibles en esta región",
    //   };
    // }

    // 3. Check delegate availability for the requested dates
    const startDateStr = validatedData.startDate.toISOString().split('T')[0];
    const endDateStr = validatedData.endDate.toISOString().split('T')[0];

    let assignedDelegate = null;

    for (const delegate of delegatesInRegion) {
      // Check if delegate has marked themselves as unavailable for this weekend
      const unavailability = await db.query.availability.findFirst({
        where: and(
          eq(availability.userWcaId, delegate.wcaId),
          eq(availability.isAvailable, false),
          or(
            // Check if the requested dates overlap with unavailable periods
            and(
              lte(availability.weekendStart, startDateStr!),
              gte(availability.weekendStart, endDateStr!)
            )
          )
        ),
      });

      if (!unavailability) {
        assignedDelegate = delegate;
        break;
      }
    }

    if (!assignedDelegate) {
      // If no delegate is available, still create the competition but without assigned delegate
      await db.insert(competitions).values({
        city: validatedData.city,
        stateId: validatedData.stateId,
        primaryDelegateId: null,
        startDate: startDateStr!,
        endDate: endDateStr!,
        statusPublic: 'reserved',
        statusInternal: 'draft',
      });

      return {
        success: true,
        message: "Solicitud creada. No hay delegados disponibles, se asignará manualmente.",
      };
    }

    // 4. Create the competition with assigned delegate
    await db.insert(competitions).values({
      city: validatedData.city,
      stateId: validatedData.stateId,
      primaryDelegateId: assignedDelegate.wcaId,
      startDate: startDateStr!,
      endDate: endDateStr!,
      statusPublic: 'reserved',
      statusInternal: 'draft',
    });

    revalidatePath("/");

    return {
      success: true,
      message: `Solicitud creada exitosamente. Delegado asignado: ${assignedDelegate.name}`,
    };
  } catch (error) {
    console.error("Error submitting date request:", error);
    return {
      success: false,
      message: "Error al procesar la solicitud",
    };
  }
}