"use server";

import { db } from "@/db";
import {
  competitions,
  user,
  states,
  competitionDelegates,
  competitionOrganizers,
  availability,
} from "@/db/schema";
import { z } from "zod";
import { eq, and, lte, gte, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

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

    const msPerDay = 24 * 60 * 60 * 1000;
    const expectedDays =
      Math.floor(
        (validatedData.endDate.getTime() - validatedData.startDate.getTime()) /
          msPerDay,
      ) + 1;

    let assignedDelegate = null;

    for (const delegate of delegatesInRegion) {
      // New: ensure delegate has availability entries for every date in the range
      const availabilities = await db.query.availability.findMany({
        where: and(
          eq(availability.userWcaId, delegate.wcaId),
          gte(availability.date, startDateStr!),
          lte(availability.date, endDateStr!),
        ),
      });

      if (availabilities.length < expectedDays) {
        // Delegate is not available for all requested days
        continue;
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

    let newCompetition;
    try {
      const result = await db.transaction(async (tx) => {
        const [comp] = await tx
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
          return { comp };
        }

        await tx.insert(competitionDelegates).values({
          competitionId: comp?.id,
          delegateWcaId: assignedDelegate.wcaId,
          isPrimary: true,
        });

        await tx
          .delete(availability)
          .where(
            and(
              eq(availability.userWcaId, assignedDelegate.wcaId),
              gte(availability.date, startDateStr!),
              lte(availability.date, endDateStr!),
            ),
          );

        if (session?.user?.wcaId) {
          await tx.insert(competitionOrganizers).values({
            competitionId: comp?.id,
            organizerWcaId: session.user.wcaId,
            isPrimary: true,
          });
        }

        return { comp };
      });

      newCompetition = result.comp;
    } catch (err) {
      console.error("Transaction failed:", err);
      throw err;
    }

    if (!assignedDelegate) {
      return {
        success: true,
        message:
          "Solicitud creada. No hay delegados disponibles, se asignará manualmente.",
      };
    }

    try {
      await resend.emails.send({
        from: "Asociación Mexicana de Speedcubing <no-reply@cubingmexico.net>",
        to: assignedDelegate.email,
        subject: `Nueva asignación: ${newCompetition?.city} (${startDateStr} - ${endDateStr})`,
        html: `
          <p>Hola ${assignedDelegate.name},</p>
          <p>Se te ha asignado como delegado para la competencia en ${newCompetition?.city} (${startDateStr} - ${endDateStr}).</p>
          <p>Mira los detalles en el panel de competencias.</p>
        `,
      });
    } catch (err) {
      console.error("Error sending delegate email via Resend:", err);
    }

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
