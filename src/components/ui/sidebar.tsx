"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SidebarContextValue {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
  undefined
)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
  defaultCollapsed?: boolean
}

function SidebarProvider({
  children,
  defaultCollapsed = false,
}: SidebarProviderProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

function Sidebar({ className, children, ...props }: SidebarProps) {
  const { collapsed } = useSidebar()

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  )
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

function SidebarHeader({ className, children, ...props }: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        "flex h-16 items-center border-b px-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {}

function SidebarContent({
  className,
  children,
  ...props
}: SidebarContentProps) {
  return (
    <div className={cn("flex-1 overflow-auto py-4", className)} {...props}>
      {children}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

function SidebarFooter({ className, children, ...props }: SidebarFooterProps) {
  return (
    <div
      className={cn("border-t p-4", className)}
      {...props}
    >
      {children}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SidebarMenuProps extends React.HTMLAttributes<HTMLElement> {}

function SidebarMenu({ className, children, ...props }: SidebarMenuProps) {
  return (
    <nav className={cn("space-y-1 px-2", className)} {...props}>
      {children}
    </nav>
  )
}

interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  isActive?: boolean
}

function SidebarMenuItem({
  className,
  isActive,
  children,
  ...props
}: SidebarMenuItemProps) {
  const { collapsed } = useSidebar()

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
        isActive
          ? "bg-primary text-primary-foreground"
          : "hover:bg-accent hover:text-accent-foreground",
        collapsed && "justify-center",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SidebarTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

function SidebarTrigger({ className, ...props }: SidebarTriggerProps) {
  const { collapsed, setCollapsed } = useSidebar()

  return (
    <button
      onClick={() => setCollapsed(!collapsed)}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9",
        className
      )}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <line x1="9" x2="9" y1="3" y2="21" />
      </svg>
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  )
}

export {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
}

