import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"

export default function PatientAppointmentsPage() {
  return (
    <div className="p-8 space-y-6">
      <DashboardHeader 
        title="My Appointments"
        description="Schedule and manage your appointments"
      />

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>
            Your scheduled visits with your doctor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No upcoming appointments
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

