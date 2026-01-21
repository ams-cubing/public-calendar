"use server";

import { db } from "@/db";
import {
  competitions,
  competitionDelegates,
  competitionOrganizers,
} from "@/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
) {
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

    // Update the competition
    await db
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
    await db
      .delete(competitionDelegates)
      .where(eq(competitionDelegates.competitionId, competitionId));

    // Insert new delegate assignments
    const delegateAssignments = validatedData.delegateWcaIds.map((wcaId) => ({
      competitionId: competitionId,
      delegateWcaId: wcaId,
      isPrimary: wcaId === validatedData.primaryDelegateWcaId,
    }));

    await db.insert(competitionDelegates).values(delegateAssignments);

    // Delete existing organizer assignments
    await db
      .delete(competitionOrganizers)
      .where(eq(competitionOrganizers.competitionId, competitionId));

    // Insert new organizer assignments
    const organizerAssignments = validatedData.organizerWcaIds.map((wcaId) => ({
      competitionId: competitionId,
      organizerWcaId: wcaId,
      isPrimary: wcaId === validatedData.primaryOrganizerWcaId,
    }));

    await db.insert(competitionOrganizers).values(organizerAssignments);

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
