import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"

export default function SchedulePage() {
  return (
    <div className="p-8 space-y-6">
      <DashboardHeader 
        title="Schedule"
        description="Plan your workouts and health activities"
      />

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>
            Organize your fitness routine throughout the week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Schedule management features coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

