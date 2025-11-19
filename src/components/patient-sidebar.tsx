"use client";

import { usePathname, useRouter } from "next/navigation";
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
  FileText,
  Calendar,
  Settings,
  LogOut,
  User as UserIcon,
  Activity,
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
import { patientTheme } from "@/lib/theme/patient";
import { Patient } from "@/app/actions/patient";
interface PatientSidebarProps {
  patient: Patient;
}

export function PatientSidebar({ patient }: PatientSidebarProps) {
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
      href: "/patient/dashboard",
    },
    {
      icon: FileText,
      label: "My Records",
      href: "/patient/records",
    },
    {
      icon: Calendar,
      label: "Appointments",
      href: "/patient/appointments",
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/patient/settings",
    },
  ];

  return (
    <Sidebar
      className={`
        border-r
        ${patientTheme.cardBorder}
        ${patientTheme.cardBg}
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
                    ${patientTheme.brandAccentBg}
                    ${patientTheme.brandAccentBorder}
                    border
                  `}
                >
                  <Activity className={`h-4 w-4 ${patientTheme.brandSoft}`} />
                </div>
                <div className="leading-tight">
                  <span
                    className={`font-semibold text-sm ${patientTheme.textMain}`}
                  >
                    LiveAD
                  </span>
                  <p className={`text-xs ${patientTheme.textSubtle}`}>
                    Patient Portal
                  </p>
                </div>
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
                  rounded-lg
                  text-sm
                  cursor-pointer
                  transition-colors
                  ${
                    isActive
                      ? `${patientTheme.brandAccentBg} ${patientTheme.brand} border ${patientTheme.brandAccentBorder}`
                      : `text-sm ${patientTheme.textMuted} hover:bg-[#FFF3E5]`
                  }
                `}
              >
                <Icon
                  className={`
                    h-5
                    w-5
                    ${
                      isActive
                        ? patientTheme.brandSoft
                        : patientTheme.textSubtle
                    }
                  `}
                />
                {!collapsed && (
                  <span
                    className={`
                      truncate
                      ${isActive ? patientTheme.brand : patientTheme.textMuted}
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
        {patient && (
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
                  hover:bg-[#FFF3E5]
                  rounded-none
                  ${patientTheme.textMain}
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
                        ${patientTheme.brandAccentBg}
                        flex-shrink-0
                        mr-2
                      `}
                    >
                      <UserIcon className={`h-3.5 w-3.5 ${patientTheme.brandSoft}`} />
                    </div>
                    <span className={`text-sm font-medium truncate flex-1 text-left ${patientTheme.textMain}`}>
                      {patient.name || "Patient"}
                    </span>
                    <ChevronUp className={`h-3.5 w-3.5 ${patientTheme.textSubtle} flex-shrink-0 ml-1`} />
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
                      ${patientTheme.brandAccentBg}
                      mx-auto
                    `}
                  >
                    <UserIcon className={`h-3.5 w-3.5 ${patientTheme.brandSoft}`} />
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
                  <p className="text-sm font-medium">{patient.name || "Patient"}</p>
                  <p className="text-xs text-muted-foreground">{patient.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/patient/settings")}
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
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
