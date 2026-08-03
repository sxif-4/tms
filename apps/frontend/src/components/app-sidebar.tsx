"use client";

import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "~/lib/utils";
import { LogoIcon } from "~/components/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import {
  footerNavLinks,
  getNavGroups,
  isNavPathActive,
} from "~/components/app-shared";
import { NavGroup } from "~/components/nav-group";
import { useCurrentUser, landingPathForRole } from "~/features/auth";

export function AppSidebar() {
  const user = useCurrentUser();
  const navGroups = getNavGroups(user?.role);
  const { pathname } = useLocation();

  return (
    <Sidebar
      className={cn(
        // Active destination reads as a filled tint of the action colour.
        "**:data-[slot=sidebar-menu-button]:data-active:bg-primary/35",
        "**:data-[slot=sidebar-menu-button]:data-active:text-foreground",
      )}
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarHeader className="h-16 justify-center px-4">
        <SidebarMenuButton
          asChild
          size="lg"
          className="gap-3 group-data-[collapsible=icon]:justify-center"
        >
          <Link to={user ? landingPathForRole(user.role) : "/"}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground group-data-[collapsible=icon]:size-8">
              <LogoIcon className="size-4.5" />
            </span>
            <span className="font-heading text-lg font-bold tracking-tight">
              FUNISLAND
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent className="gap-0 px-2">
        {navGroups.map((group, index) => (
          <NavGroup key={`sidebar-group-${index}`} {...group} />
        ))}
      </SidebarContent>
      <SidebarFooter className="gap-0 p-0">
        <SidebarMenu className="gap-1 px-4 py-2">
          {footerNavLinks.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                className="text-muted-foreground"
                isActive={isNavPathActive(pathname, item.path)}
                size="sm"
                tooltip={item.title}
              >
                <a href={item.path}>
                  {item.icon}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="px-4 pt-1 pb-3 transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0">
          <p className="text-nowrap text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} FUNISLAND LLC
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
