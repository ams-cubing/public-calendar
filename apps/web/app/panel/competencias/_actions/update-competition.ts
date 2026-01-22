"use server";

import { db } from "@/db";
import {
  competitions,
  competitionDelegates,
  competitionOrganizers,
  logs,
  availability,
} from "@/db/schema";
import { Resend } from "resend";
import { z } from "zod";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const resend = new Resend(process.env.RESEND_API_KEY!);

const updateCompetitionSchema = z
  .object({
    name: z.string().min(2).optional().or(z.literal("")),
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
    trelloUrl: z.url().optional().or(z.literal("")),
    wcaCompetitionUrl: z.url("URL inválida").optional().or(z.literal("")),
    capacity: z.number().min(2, "La capacidad debe ser al menos 2").optional(),
    statusPublic: z.enum([
      "open",
      "reserved",
      "confirmed",
      "announced",
      "suspended",
      "unavailable",
    ]),
    statusInternal: z.enum([
      "asked_for_help",
      "looking_for_venue",
      "venue_found",
      "wca_approved",
      "registration_open",
      "celebrated",
      "cancelled",
    ]),
    delegateWcaIds: z
      .array(z.string())
      .min(1, "Selecciona al menos un delegado"),
    primaryDelegateWcaId: z.string().min(1, "Selecciona un delegado principal"),
    organizerWcaIds: z
      .array(z.string())
      .min(1, "Selecciona al menos un organizador"),
    primaryOrganizerWcaId: z
      .string()
      .min(1, "Selecciona un organizador principal"),
    notes: z.string().optional().or(z.literal("")),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .refine((data) => data.delegateWcaIds.includes(data.primaryDelegateWcaId), {
    message: "El delegado principal debe estar en la lista de delegados",
    path: ["primaryDelegateWcaId"],
  })
  .refine((data) => data.organizerWcaIds.includes(data.primaryOrganizerWcaId), {
    message: "El organizador principal debe estar en la lista de organizadores",
    path: ["primaryOrganizerWcaId"],
  });

export async function updateCompetition(
  competitionId: number,
  data: z.infer<typeof updateCompetitionSchema>,
): Promise<{
  success: boolean;
  message: string;
  competitionId?: number;
}> {
  try {
    const headersList = await headers();

    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user?.wcaId) {
      return {
        success: false,
        message: "No autenticado",
      };
    }

    // Validate input
    const validatedData = updateCompetitionSchema.parse(data);

    const startDateStr = validatedData.startDate.toISOString().split("T")[0];
    const endDateStr = validatedData.endDate.toISOString().split("T")[0];

    // Fetch existing delegate assignments so we can detect added/removed delegates
    const existingDelegatesRows = await db.query.competitionDelegates.findMany({
      where: (cd, { eq }) => eq(cd.competitionId, competitionId),
      columns: { delegateWcaId: true },
    });

    const previousDelegateWcaIds = existingDelegatesRows.map(
      (r) => r.delegateWcaId,
    );
    const newDelegateWcaIds = validatedData.delegateWcaIds;
    const addedDelegateWcaIds = newDelegateWcaIds.filter(
      (id) => !previousDelegateWcaIds.includes(id),
    );
    const removedDelegateWcaIds = previousDelegateWcaIds.filter(
      (id) => !newDelegateWcaIds.includes(id),
    );

    // Use a transaction for all DB changes
    await db.transaction(async (tx) => {
      // Update the competition
      await tx
        .update(competitions)
        .set({
          name: validatedData.name || null,
          city: validatedData.city,
          stateId: validatedData.stateId,
          trelloUrl: validatedData.trelloUrl || null,
          wcaCompetitionUrl: validatedData.wcaCompetitionUrl || null,
          capacity: validatedData.capacity || 0,
          startDate: startDateStr!,
          endDate: endDateStr!,
          statusPublic: validatedData.statusPublic,
          statusInternal: validatedData.statusInternal,
          notes: validatedData.notes || null,
          updatedAt: new Date(),
        })
        .where(eq(competitions.id, competitionId));

      // Delete existing delegate assignments
      await tx
        .delete(competitionDelegates)
        .where(eq(competitionDelegates.competitionId, competitionId));

      // Insert new delegate assignments
      const delegateAssignments = validatedData.delegateWcaIds.map((wcaId) => ({
        competitionId: competitionId,
        delegateWcaId: wcaId,
        isPrimary: wcaId === validatedData.primaryDelegateWcaId,
      }));

      if (delegateAssignments.length > 0) {
        await tx.insert(competitionDelegates).values(delegateAssignments);

        // Remove availability entries for assigned delegates for the competition date range
        await tx
          .delete(availability)
          .where(
            and(
              inArray(availability.userWcaId, validatedData.delegateWcaIds),
              gte(availability.date, startDateStr!),
              lte(availability.date, endDateStr!),
            ),
          );
      }

      // Delete existing organizer assignments
      await tx
        .delete(competitionOrganizers)
        .where(eq(competitionOrganizers.competitionId, competitionId));

      // Insert new organizer assignments
      const organizerAssignments = validatedData.organizerWcaIds.map(
        (wcaId) => ({
          competitionId: competitionId,
          organizerWcaId: wcaId,
          isPrimary: wcaId === validatedData.primaryOrganizerWcaId,
        }),
      );

      if (organizerAssignments.length > 0) {
        await tx.insert(competitionOrganizers).values(organizerAssignments);
      }

      if (session?.user?.id) {
        await tx.insert(logs).values({
          action: "update_competition",
          targetType: "competition",
          targetId: String(competitionId),
          actorId: session.user.id,
          details: validatedData,
        });
      }
    });

    // Notify newly added delegates
    try {
      if (addedDelegateWcaIds.length > 0) {
        const addedUsers = await db.query.user.findMany({
          where: (u, { inArray }) => inArray(u.wcaId, addedDelegateWcaIds),
          columns: { email: true, name: true },
        });

        for (const a of addedUsers) {
          if (!a.email) continue;
          try {
            await resend.emails.send({
              from: "Asociación Mexicana de Speedcubing <no-reply@cubingmexico.net>",
              to: a.email,
              subject: `Asignación como delegado: ${validatedData.city} (${startDateStr} - ${endDateStr})`,
              html: `<p>Hola ${a.name},</p><p>Has sido asignado como delegado para la competencia en ${validatedData.city} (${startDateStr} - ${endDateStr}).</p><p>Revisa el panel de competencias para más detalles.</p>`,
            });
          } catch (err) {
            console.error(
              "Error sending added delegate email via Resend:",
              err,
            );
          }
        }
      }

      // Notify removed delegates
      if (removedDelegateWcaIds.length > 0) {
        const removedUsers = await db.query.user.findMany({
          where: (u, { inArray }) => inArray(u.wcaId, removedDelegateWcaIds),
          columns: { email: true, name: true },
        });

        for (const r of removedUsers) {
          if (!r.email) continue;
          try {
            await resend.emails.send({
              from: "Asociación Mexicana de Speedcubing <no-reply@cubingmexico.net>",
              to: r.email,
              subject: `Remoción como delegado: ${validatedData.city} (${startDateStr} - ${endDateStr})`,
              html: `<p>Hola ${r.name},</p><p>Has sido removido como delegado de una competencia en ${validatedData.city} (${startDateStr} - ${endDateStr}).</p><p>Si crees que esto es un error, revisa el panel de competencias para más detalles.</p>`,
            });
          } catch (err) {
            console.error(
              "Error sending removed delegate email via Resend:",
              err,
            );
          }
        }
      }
    } catch (err) {
      console.error("Error notifying delegates:", err);
    }

    return {
      success: true,
      message: "Competencia actualizada exitosamente",
    };
  } catch (error) {
    console.error("Error updating competition:", error);
    return {
      success: false,
      message: "Error al actualizar la competencia",
    };
  }
}
