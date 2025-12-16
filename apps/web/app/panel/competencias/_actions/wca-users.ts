"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, ilike, or } from "drizzle-orm";

type WCAPerson = {
  person: {
    wca_id: string;
    name: string;
    avatar: {
      url: string;
      thumb_url: string;
    };
  };
};

export async function fetchAndCreateWCAUser(wcaId: string) {
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.wcaId, wcaId),
    });

    if (existingUser) {
      return {
        success: true,
        user: existingUser,
        message: "Usuario ya existe en la base de datos",
      };
    }

    const response = await fetch(
      `https://www.worldcubeassociation.org/api/v0/persons/${wcaId}`,
    );

    if (!response.ok) {
      return {
        success: false,
        message: "No se encontró el usuario en la WCA",
      };
    }

    const data: WCAPerson = await response.json();

    const [newUser] = await db
      .insert(users)
      .values({
        wcaId: data.person.wca_id,
        name: data.person.name,
        email: `${data.person.wca_id}@wca.placeholder`, // Placeholder email
        avatarUrl: data.person.avatar.url,
        role: "user",
      })
      .returning();

    return {
      success: true,
      user: newUser,
      message: "Usuario creado exitosamente",
    };
  } catch (error) {
    console.error("Error fetching WCA person:", error);
    return {
      success: false,
      message: "Error al obtener datos del usuario",
    };
  }
}

export async function searchUsers(query: string) {
  try {
    if (!query) {
      const allUsers = await db
        .select({
          wcaId: users.wcaId,
          name: users.name,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .limit(5);

      return allUsers;
    }

    const searchResults = await db
      .select({
        wcaId: users.wcaId,
        name: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(
        or(ilike(users.name, `%${query}%`), ilike(users.wcaId, `%${query}%`)),
      )
      .limit(5);

    return searchResults;
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
}
