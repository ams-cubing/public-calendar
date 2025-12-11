import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDelegate = auth?.user?.role === "delegate";

      // Protect Delegate Dashboard
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

      // if (isOnDashboard) {
      //   if (isLoggedIn && isDelegate) return true;
      //   return false; // Redirect unauthenticated users to login
      // }
      return true;
    },
  },
  providers: [], // Configured in main auth.ts
} satisfies NextAuthConfig;
