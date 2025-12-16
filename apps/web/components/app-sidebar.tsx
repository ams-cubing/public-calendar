"use client";

import * as React from "react";
import { Frame, Map, PieChart } from "lucide-react";

import { NavCalendar } from "@/components/nav-calendar";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import Image from "next/image";
import { NavDelegate } from "./nav-delegate";
import { User } from "next-auth";

const data = {
  calendar: [
    {
      name: "Inicio",
      url: "/",
      icon: PieChart,
    },
    {
      name: "Mis competencias",
      url: "/mis-competencias",
      icon: Frame,
    },
    {
      name: "Solicitar fecha",
      url: "/solicitar-fecha",
      icon: Map,
    },
  ],
  delegate: [
    {
      name: "Panel de delegado",
      url: "/panel",
      icon: Frame,
    },
    {
      name: "Nueva competencia",
      url: "/panel/competencias/nueva",
      icon: PieChart,
    },
    {
      name: "Indisponibilidad",
      url: "/panel/indisponibilidad",
      icon: Map,
    },
  ],
};

export function AppSidebar({
  user,
  ...props
}: {
  user: User;
} & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="https://amscubing.org/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image src="/icon.png" alt="Logo" width={24} height={24} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    Asociación Mexicana de Speedcubing
                  </span>
                  <span className="truncate text-xs">Calendario público</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavCalendar calendar={data.calendar} />
        <NavDelegate delegate={data.delegate} user={user} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
