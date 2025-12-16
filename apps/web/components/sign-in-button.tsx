"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle, LogIn } from "lucide-react";
import { DropdownMenuItem } from "@workspace/ui/components/dropdown-menu";

export function SignInButton() {
  const { pending } = useFormStatus();

  return (
    <DropdownMenuItem asChild disabled={pending}>
      <button type="submit" className="w-full">
        {pending ? <LoaderCircle className="animate-spin" /> : <LogIn />}
        <span>Iniciar sesión</span>
      </button>
    </DropdownMenuItem>
  );
}
