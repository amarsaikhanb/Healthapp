"use client"

import { InvitePatientDialog } from "@/components/invite-patient-dialog"

interface DashboardHeaderProps {
  title: string
  description?: string
  showInviteButton?: boolean
}

export function DashboardHeader({ 
  title, 
  description, 
  showInviteButton = false 
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {showInviteButton && (
        <div>
          <InvitePatientDialog />
        </div>
      )}
    </div>
  )
}

