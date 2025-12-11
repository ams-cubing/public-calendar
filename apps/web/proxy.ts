import NextAuth, { type NextAuthResult } from "next-auth";
import { authConfig } from "./auth.config";

const result = NextAuth(authConfig);
const auth: NextAuthResult["auth"] = result.auth;

export default auth;

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
