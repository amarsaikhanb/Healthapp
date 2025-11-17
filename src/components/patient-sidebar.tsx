"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  Home,
  FileText,
  Calendar,
  Settings,
  LogOut,
  User as UserIcon,
  Activity,
} from "lucide-react"

interface PatientSidebarProps {
  patient: any
}

export function PatientSidebar({ patient }: PatientSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { collapsed } = useSidebar()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

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
  ]

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between w-full">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold">Health App</span>
                <p className="text-xs text-muted-foreground">Patient Portal</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground mx-auto">
              <Activity className="h-4 w-4" />
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <SidebarMenuItem
                key={item.href}
                isActive={isActive}
                onClick={() => router.push(item.href)}
              >
                <Icon className="h-5 w-5" />
                {!collapsed && <span>{item.label}</span>}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <div className="space-y-2">
          {!collapsed && patient && (
            <div className="px-3 py-2 space-y-1">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium truncate">{patient.name}</p>
              </div>
              <p className="text-xs text-muted-foreground truncate">{patient.email}</p>
            </div>
          )}
          <div className="flex items-center gap-2 px-2">
            <SidebarTrigger />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

