import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SessionRecorder } from "@/components/session-recorder"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PatientSessionPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get patient data
  const { data: patient, error } = await supabase
    .from("patient")
    .select("*")
    .eq("id", id)
    .eq("doctor_id", user.id)
    .single()

  if (error || !patient || !patient.invitation_accepted) {
    notFound()
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/patients/${patient.id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Session with {patient.name}</h1>
          <p className="text-muted-foreground">
            Record and transcribe your consultation
          </p>
        </div>
      </div>

      {/* Session Recorder */}
      <SessionRecorder patientId={patient.id} patientName={patient.name} />
    </div>
  )
}

