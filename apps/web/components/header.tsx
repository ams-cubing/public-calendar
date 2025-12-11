import { UserDropdown } from "./user-dropdown";
import { auth } from "@/auth";
import { UserAuthForm } from "./user-auth-form";
import Link from "next/link";

export async function Header() {
  const session = await auth();

  if (!session) {
    return (
      <header className="bg-primary text-primary-foreground body-font top-0 z-50">
        <div className="mx-auto flex flex-col sm:flex-row items-center gap-8 justify-between p-5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
            <h1>
              <Link href="/">
                Asociación Mexicana de Speedcubing
              </Link>
            </h1>
          </div>
          <UserAuthForm />
        </div>
      </header>
    );
  }

  const user = session.user!;

  return (
    <header className="bg-primary text-primary-foreground body-font top-0 z-50">
      <div className="mx-auto flex flex-col sm:flex-row items-center gap-8 justify-between p-5">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
          <Link href="/">
            Asociación Mexicana de Speedcubing
          </Link>
        </div>
        <UserDropdown user={user} />
      </div>
    </header>
  );
}
