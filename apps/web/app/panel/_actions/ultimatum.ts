"use server";

// import { db } from "@/db";
// import { ultimatums } from "@/db/schema";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createUltimatumSchema = z.object({
  competitionId: z.number(),
  organizerWcaId: z.string().min(1),
  deadline: z.date(),
  message: z.string().optional().or(z.literal("")),
});

export async function createUltimatum(data: z.infer<typeof createUltimatumSchema>) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validated = createUltimatumSchema.parse(data);

  // const [row] = await db.insert(ultimatums).values({
  //   id: undefined,
  //   competitionId: validated.competitionId,
  //   organizerWcaId: validated.organizerWcaId,
  //   sentBy: session.user.id,
  //   deadline: validated.deadline.toISOString().split("T")[0],
  //   message: validated.message || null,
  // }).returning();

  // return { success: true, ultimatum: row };
  return { success: true };
}
