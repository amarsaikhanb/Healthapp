import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"

export default function PatientRecordsPage() {
  return (
    <div className="p-8 space-y-6">
      <DashboardHeader 
        title="My Medical Records"
        description="View and manage your health records"
      />

      <Card>
        <CardHeader>
          <CardTitle>Health Records</CardTitle>
          <CardDescription>
            Your medical history and documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No medical records available yet
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

