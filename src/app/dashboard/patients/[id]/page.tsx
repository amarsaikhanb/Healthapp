import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/dashboard-header"
import { SessionsList } from "@/components/sessions-list"
import { CreateFormDialog } from "@/components/create-form-dialog"
import { PatientFormsList } from "@/components/patient-forms-list"
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock,
  Play,
  CheckCircle,
  FileText,
  Activity
} from "lucide-react"
import Link from "next/link"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PatientDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get patient data - ensure it belongs to this doctor
  const { data: patient, error } = await supabase
    .from("patient")
    .select(`
      *,
      doctor:doctor_id (
        id,
        name,
        phone_number
      )
    `)
    .eq("id", id)
    .eq("doctor_id", user.id)
    .single()

  if (error || !patient) {
    notFound()
  }

  // Get all sessions for this patient
  const { data: sessions } = await supabase
    .from("session")
    .select("*")
    .eq("patient_id", id)
    .eq("doctor_id", user.id)
    .order("created_at", { ascending: false })

  // Get all forms for this patient
  const { data: forms } = await supabase
    .from("form")
    .select(`
      *,
      questions:question(*),
      answers:answer(*)
    `)
    .eq("patient_id", id)
    .eq("doctor_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="p-8 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {patient.name || "Pending Patient"}
            </h1>
            <p className="text-muted-foreground">
              Patient ID: {patient.id.slice(0, 8)}...
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {patient.invitation_accepted && (
            <>
              <CreateFormDialog 
                patientId={patient.id}
                patientName={patient.name || "Patient"}
              />
              <Link href={`/dashboard/patients/${patient.id}/session`}>
                <Button className="gap-2">
                  <Play className="h-4 w-4" />
                  Start Session
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {!patient.invitation_accepted && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">
                  Invitation Pending
                </p>
                <p className="text-sm text-yellow-700">
                  This patient hasn&apos;t completed their profile yet. They need to accept the invitation and fill out their information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Patient Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
            <CardDescription>
              Personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                {patient.invitation_accepted ? (
                  <Badge variant="default" className="gap-1 mt-1">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    Pending
                  </Badge>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-base">
                  {patient.name || (
                    <span className="italic text-muted-foreground">Not provided yet</span>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{patient.email}</p>
                </div>
              </div>

              {patient.phone_number ? (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-base">{patient.phone_number}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-base italic text-muted-foreground">Not provided</p>
                  </div>
                </div>
              )}

              {patient.date_of_birth ? (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                    <p className="text-base">
                      {new Date(patient.date_of_birth).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Age: {Math.floor((new Date().getTime() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                    <p className="text-base italic text-muted-foreground">Not provided</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Account Details
            </CardTitle>
            <CardDescription>
              Registration and activity timeline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Patient Since</p>
              <p className="text-base">
                {new Date(patient.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {Math.floor((new Date().getTime() - new Date(patient.created_at).getTime()) / (24 * 60 * 60 * 1000))} days ago
              </p>
            </div>

            {patient.updated_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-base">
                  {new Date(patient.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground">Assigned Doctor</p>
              <p className="text-base">{patient.doctor?.name || "You"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forms Section */}
      <PatientFormsList
        forms={forms || []}
        patientId={patient.id}
        patientName={patient.name || "Patient"}
      />

      {/* Sessions Section */}
      <SessionsList 
        sessions={sessions || []} 
        patientId={patient.id}
        patientName={patient.name || "Patient"}
        invitationAccepted={patient.invitation_accepted}
      />
    </div>
  )
}

