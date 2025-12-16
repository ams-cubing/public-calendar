import { auth } from "@/auth";
import { unauthorized } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user.role !== "delegate") {
    unauthorized();
  }

  return <main className="p-6">{children}</main>;
}
