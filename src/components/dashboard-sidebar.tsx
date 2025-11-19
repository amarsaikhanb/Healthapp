"use client";

import { usePathname, useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  Home,
  Activity,
  Calendar,
  Settings,
  LogOut,
  User as UserIcon,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { doctorTheme } from "@/lib/theme/doctor";
import { Doctor } from "@/app/actions/doctor";

interface DashboardSidebarProps {
  user: User;
  doctor: Doctor;
}

export function DashboardSidebar({ user, doctor }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed } = useSidebar();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const menuItems = [
    {
      icon: Home,
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      icon: Activity,
      label: "Activities",
      href: "/dashboard/activities",
    },
    {
      icon: Calendar,
      label: "Schedule",
      href: "/dashboard/schedule",
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/dashboard/settings",
    },
  ];

  return (
    <Sidebar
      className={`
        ${doctorTheme.cardBg}
        ${doctorTheme.cardBorder}
        border-r
      `}
    >
      <SidebarHeader>
        <div className="flex items-center justify-between w-full px-2 py-2">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2">
                <div
                  className={`
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-lg
                    ${doctorTheme.brandAccentBg}
                    ${doctorTheme.brandAccentBorder}
                    border
                  `}
                >
                  <Activity className={`h-4 w-4 ${doctorTheme.brandSoft}`} />
                </div>
                <span
                  className={`
                    font-semibold
                    text-sm
                    ${doctorTheme.textMain}
                  `}
                >
                  LiveAD
                </span>
              </div>
              <SidebarTrigger />
            </>
          ) : (
            <SidebarTrigger className="mx-auto" />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="mt-2">
        <SidebarMenu>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <SidebarMenuItem
                key={item.href}
                isActive={isActive}
                onClick={() => router.push(item.href)}
                className={`
                  flex
                  items-center
                  gap-2
                  px-3
                  py-2
                  rounded-md
                  text-sm
                  cursor-pointer
                  transition-colors
                  ${
                    isActive
                      ? `${doctorTheme.brandAccentBg} ${doctorTheme.brand} border ${doctorTheme.brandAccentBorder}`
                      : `${doctorTheme.textMuted} hover:bg-[#F3F6FF]`
                  }
                `}
              >
                <Icon
                  className={`
                    h-5
                    w-5
                    ${isActive ? doctorTheme.brandSoft : doctorTheme.textSubtle}
                  `}
                />
                {!collapsed && (
                  <span
                    className={`
                      truncate
                      ${isActive ? doctorTheme.brand : doctorTheme.textMuted}
                    `}
                  >
                    {item.label}
                  </span>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`
                  w-full
                  justify-start
                  px-2
                  py-1.5
                  h-auto
                  hover:bg-[#F3F6FF]
                  rounded-none
                  ${doctorTheme.textMain}
                `}
              >
              {!collapsed ? (
                <>
                  <div
                    className={`
                      flex
                      h-7
                      w-7
                      items-center
                      justify-center
                      rounded-full
                      ${doctorTheme.brandAccentBg}
                      flex-shrink-0
                      mr-2
                    `}
                  >
                    <UserIcon className={`h-3.5 w-3.5 ${doctorTheme.brandSoft}`} />
                  </div>
                  <span className={`text-sm font-medium truncate flex-1 text-left ${doctorTheme.textMain}`}>
                    {doctor?.name || "Doctor"}
                  </span>
                  <ChevronUp className={`h-3.5 w-3.5 ${doctorTheme.textSubtle} flex-shrink-0 ml-1`} />
                </>
              ) : (
                <div
                  className={`
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center
                    rounded-full
                    ${doctorTheme.brandAccentBg}
                    mx-auto
                  `}
                >
                  <UserIcon className={`h-3.5 w-3.5 ${doctorTheme.brandSoft}`} />
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="end"
            className="w-56 mb-2"
          >
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <p className="text-sm font-medium">{doctor?.name || "Doctor"}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings")}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
