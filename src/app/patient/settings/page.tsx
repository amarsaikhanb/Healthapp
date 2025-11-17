import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"

export default async function PatientSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get patient data
  const { data: patient } = await supabase
    .from("patient")
    .select("*")
    .eq("id", user?.id)
    .single()

  return (
    <div className="p-8 space-y-6">
      <DashboardHeader 
        title="Settings"
        description="Manage your account and preferences"
      />

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your personal details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Name</p>
            <p className="text-sm text-muted-foreground">{patient?.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground">{patient?.email}</p>
          </div>
          {patient?.phone_number && (
            <div>
              <p className="text-sm font-medium">Phone Number</p>
              <p className="text-sm text-muted-foreground">{patient.phone_number}</p>
            </div>
          )}
          {patient?.date_of_birth && (
            <div>
              <p className="text-sm font-medium">Date of Birth</p>
              <p className="text-sm text-muted-foreground">
                {new Date(patient.date_of_birth).toLocaleDateString()}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium">Account Created</p>
            <p className="text-sm text-muted-foreground">
              {patient?.created_at ? new Date(patient.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

