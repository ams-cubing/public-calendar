import NextAuth, { type NextAuthResult } from "next-auth";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "./db/schema";
import type { DefaultJWT } from "next-auth/jwt";
import { authConfig } from "./auth.config";

interface WCAProfile {
  me: {
    id: number;
    created_at: string;
    updated_at: string;
    name: string;
    wca_id: string;
    gender: string;
    country_iso2: string;
    url: string;
    country: {
      id: string;
      name: string;
      continentId: string;
      iso2: string;
    };
    delegate_status: string | null;
    // teams: any[];
    avatar: {
      id: number;
      status: string;
      thumbnail_crop_x: null;
      thumbnail_crop_y: null;
      thumbnail_crop_w: null;
      thumbnail_crop_h: null;
      url: string;
      thumb_url: string;
      is_default: boolean;
      can_edit_thumbnail: boolean;
    };
    email: string;
  };
}

const result = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
  },
  providers: [
    {
      id: "wca",
      name: "World Cube Association",
      type: "oauth",
      issuer: "https://www.worldcubeassociation.org",
      authorization: {
        url: "https://www.worldcubeassociation.org/oauth/authorize",
        params: { scope: "public email" },
      },
      token: "https://www.worldcubeassociation.org/oauth/token",
      userinfo: "https://www.worldcubeassociation.org/api/v0/me",
      profile(profile: WCAProfile) {
        return {
          id: profile.me.wca_id,
          name: profile.me.name,
          email: profile.me.email,
          image: profile.me.avatar.thumb_url ?? undefined,
          // Custom fields
          wcaId: profile.me.wca_id,
          // role: profile.me.delegate_status ? "delegate" : "user",
          role: "delegate", // Temporary: everyone is delegate for now
        };
      },
      clientId: process.env.WCA_CLIENT_ID,
      clientSecret: process.env.WCA_CLIENT_SECRET,
    },
  ],
  // debug: process.env.NODE_ENV !== "production",
  callbacks: {
    async signIn({ user }) {
      // 2. The "Sync" Logic
      try {
        const existingUser = await db.query.users.findFirst({
          where: eq(users.wcaId, user.wcaId as string),
        });

        if (!existingUser) {
          // CREATE
          await db.insert(users).values({
            wcaId: user.wcaId as string,
            name: user.name!,
            email: user.email!,
            avatarUrl: user.image,
            role: user.role as string,
          });
        } else {
          // UPDATE (Sync latest role/avatar from WCA)
          await db
            .update(users)
            .set({
              lastLogin: new Date(),
              name: user.name!,
              email: user.email!,
              avatarUrl: user.image, // In case they changed it on WCA
              role: user.role as string, // In case they were promoted
            })
            .where(eq(users.wcaId, user.wcaId as string));
        }
        return true;
      } catch (error) {
        console.error("Database sync failed", error);
        return false; // Deny login if DB is down
      }
    },
    async jwt({ token, user }) {
      // Persist the custom fields to the token
      if (user) {
        token.role = user.role;
        token.wcaId = user.wcaId;
      }
      return token;
    },
    async session({ session, token }) {
      // Make them available in the client
      session.user.role = token.role;
      session.user.wcaId = token.wcaId;
      return session;
    },
  },
});

export const handlers: NextAuthResult["handlers"] = result.handlers;
export const auth: NextAuthResult["auth"] = result.auth;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;

declare module "next-auth" {
  interface Session {
    user: {
      role: "delegate" | "user";
      wcaId: string;
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  export interface User {
    role: "delegate" | "user";
    wcaId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: "delegate" | "user";
    wcaId: string;
  }
}
