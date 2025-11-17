import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"

export default function ActivitiesPage() {
  return (
    <div className="p-8 space-y-6">
      <DashboardHeader 
        title="Activities"
        description="Track and manage your fitness activities"
      />

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Your recent workout and exercise sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Activity tracking features coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

