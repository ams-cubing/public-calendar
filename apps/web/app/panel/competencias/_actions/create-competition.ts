"use server";

import { db } from "@/db";
import {
  competitions,
  competitionDelegates,
  competitionOrganizers,
} from "@/db/schema";
import { z } from "zod";
import { auth } from "@/auth";

const createCompetitionSchema = z
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
    statusPublic: z.enum([
      "open",
      "reserved",
      "confirmed",
      "announced",
      "suspended",
      "unavailable",
    ]),
    statusInternal: z.enum([
      "draft",
      "looking_for_venue",
      "ultimatum_sent",
      "ready",
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

export async function createCompetition(
  data: z.infer<typeof createCompetitionSchema>,
) {
  try {
    const session = await auth();

    if (!session?.user?.wcaId) {
      return {
        success: false,
        message: "No autenticado",
      };
    }

    // Validate input
    const validatedData = createCompetitionSchema.parse(data);

    const startDateStr = validatedData.startDate.toISOString().split("T")[0];
    const endDateStr = validatedData.endDate.toISOString().split("T")[0];

    // Create the competition
    const [newCompetition] = await db
      .insert(competitions)
      .values({
        name: validatedData.name || null,
        city: validatedData.city,
        stateId: validatedData.stateId,
        requestedBy: session.user.wcaId,
        trelloUrl: validatedData.trelloUrl || null,
        startDate: startDateStr!,
        endDate: endDateStr!,
        statusPublic: validatedData.statusPublic,
        statusInternal: validatedData.statusInternal,
      })
      .returning();

    // Assign all selected delegates
    const delegateAssignments = validatedData.delegateWcaIds.map((wcaId) => ({
      competitionId: newCompetition!.id,
      delegateWcaId: wcaId,
      isPrimary: wcaId === validatedData.primaryDelegateWcaId,
    }));

    await db.insert(competitionDelegates).values(delegateAssignments);

    // Assign all selected organizers
    const organizerAssignments = validatedData.organizerWcaIds.map((wcaId) => ({
      competitionId: newCompetition!.id,
      organizerWcaId: wcaId,
      isPrimary: wcaId === validatedData.primaryOrganizerWcaId,
    }));

    await db.insert(competitionOrganizers).values(organizerAssignments);

    return {
      success: true,
      message: "Competencia creada exitosamente",
    };
  } catch (error) {
    console.error("Error creating competition:", error);
    return {
      success: false,
      message: "Error al crear la competencia",
    };
  }
}
