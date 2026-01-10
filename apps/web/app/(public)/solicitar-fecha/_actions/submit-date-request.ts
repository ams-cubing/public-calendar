"use server";

import { db } from "@/db";
import {
  competitions,
  unavailability,
  user,
  states,
  competitionDelegates,
  competitionOrganizers,
} from "@/db/schema";
import { z } from "zod";
import { eq, and, lte, gte, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const dateRequestSchema = z
  .object({
    city: z.string().min(2),
    stateId: z.string().min(1),
    startDate: z.date({
      error: (issue) =>
        issue.input === undefined
          ? "Fecha de inicio requerida"
          : "Fecha inválida",
    }),
    endDate: z.date({
      error: (issue) =>
        issue.input === undefined ? "Fecha de fin requerida" : "Fecha inválida",
    }),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be after start date",
  });

export async function submitDateRequest(
  data: z.infer<typeof dateRequestSchema>,
) {
  try {
    const headersList = await headers();

    const session = await auth.api.getSession({
      headers: headersList,
    });

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
    const delegatesInRegion = await db.query.user.findMany({
      where: and(eq(user.regionId, state.regionId), eq(user.role, "delegate")),
    });

    // 3. Check delegate availability for the requested dates
    const startDateStr = validatedData.startDate.toISOString().split("T")[0];
    const endDateStr = validatedData.endDate.toISOString().split("T")[0];

    let assignedDelegate = null;

    for (const delegate of delegatesInRegion) {
      // Check if delegate has marked themselves as unavailable for this period
      const unavailabilityResult = await db.query.unavailability.findFirst({
        where: and(
          eq(unavailability.userWcaId, delegate.wcaId),
          // Check if the requested dates overlap with unavailable periods
          eq(unavailability.date, startDateStr!),
          eq(unavailability.date, endDateStr!),
        ),
      });

      if (unavailabilityResult) {
        continue; // Skip this delegate, they're unavailable
      }

      // Check if delegate is already assigned to another competition during these dates
      const delegateCompetitionIds = await db
        .select({ competitionId: competitionDelegates.competitionId })
        .from(competitionDelegates)
        .where(eq(competitionDelegates.delegateWcaId, delegate.wcaId));

      if (delegateCompetitionIds.length > 0) {
        const conflictingCompetition = await db.query.competitions.findFirst({
          where: and(
            inArray(
              competitions.id,
              delegateCompetitionIds.map((d) => d.competitionId),
            ),
            // Check for date overlap: competitions that start before our end date AND end after our start date
            lte(competitions.startDate, endDateStr!),
            gte(competitions.endDate, startDateStr!),
          ),
        });

        if (conflictingCompetition) {
          continue; // Skip this delegate, they have a conflicting competition
        }
      }

      assignedDelegate = delegate;
      break;
    }

    // 4. Create the competition
    const [newCompetition] = await db
      .insert(competitions)
      .values({
        city: validatedData.city,
        stateId: validatedData.stateId,
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        requestedBy: session?.user?.wcaId!,
        startDate: startDateStr!,
        endDate: endDateStr!,
        statusPublic: "reserved",
        statusInternal: "draft",
      })
      .returning();

    if (!assignedDelegate) {
      revalidatePath("/solicitar-fecha");

      return {
        success: true,
        message:
          "Solicitud creada. No hay delegados disponibles, se asignará manualmente.",
      };
    }

    // 5. Assign the delegate to the competition
    await db.insert(competitionDelegates).values({
      competitionId: newCompetition!.id,
      delegateWcaId: assignedDelegate.wcaId,
      isPrimary: true,
    });

    // 6. Assign the requesting user as organizer if authenticated
    if (session?.user?.wcaId) {
      await db.insert(competitionOrganizers).values({
        competitionId: newCompetition!.id,
        organizerWcaId: session.user.wcaId,
        isPrimary: true,
      });
    }

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
