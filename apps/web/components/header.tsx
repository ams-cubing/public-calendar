import Link from "next/link";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";

export function Header() {
  return (
    <header className="body-font top-0 z-50 bg-card">
      <div className="mx-auto flex flex-col sm:flex-row items-center gap-4 justify-start p-5">
        <SidebarTrigger />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
          <Link href="/">Calendario Público de Competencias en México</Link>
        </div>
      </div>
    </header>
  );
}
