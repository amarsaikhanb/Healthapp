"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Play, 
  Clock, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Pill,
  ClipboardList
} from "lucide-react"
import Link from "next/link"

interface Session {
  id: string
  patient_id: string
  doctor_id: string
  transcript: string | null
  summary: string | null
  inferences: string[] | null
  medications: any[] | null
  created_at: string
  ended_at: string | null
}

interface SessionsListProps {
  sessions: Session[]
  patientId: string
  patientName: string
  invitationAccepted: boolean
}

export function SessionsList({ 
  sessions, 
  patientId, 
  patientName,
  invitationAccepted 
}: SessionsListProps) {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())

  const toggleSession = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions)
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId)
    } else {
      newExpanded.add(sessionId)
    }
    setExpandedSessions(newExpanded)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return "In progress"
    const duration = new Date(end).getTime() - new Date(start).getTime()
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Session History
          </CardTitle>
          <CardDescription>
            View all consultation sessions with {patientName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              No sessions recorded yet
            </p>
            {invitationAccepted ? (
              <Link href={`/dashboard/patients/${patientId}/session`}>
                <Button className="mt-4 gap-2">
                  <Play className="h-4 w-4" />
                  Start First Session
                </Button>
              </Link>
            ) : (
              <p className="text-xs text-muted-foreground">
                Patient must accept invitation first
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Session History
          </CardTitle>
          <CardDescription>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} recorded
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.map((session) => {
          const isExpanded = expandedSessions.has(session.id)
          
          return (
            <div
              key={session.id}
              className="border rounded-lg overflow-hidden transition-all"
            >
              {/* Session Header */}
              <button
                onClick={() => toggleSession(session.id)}
                className="w-full p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">
                        Session on {new Date(session.created_at).toLocaleDateString()}
                      </h4>
                      {!session.ended_at ? (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          In Progress
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(session.created_at, session.ended_at)}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(session.created_at)}
                      </div>
                    </div>

                    {session.transcript && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {session.transcript.slice(0, 150)}...
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded Session Details */}
              {isExpanded && (
                <div className="border-t bg-muted/20 p-4 space-y-4">
                  {/* Transcript */}
                  {session.transcript && (
                    <div>
                      <h5 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Transcript
                      </h5>
                      <div className="bg-background p-4 rounded-lg max-h-64 overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">
                          {session.transcript}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {session.summary && (
                    <div>
                      <h5 className="font-semibold mb-2 flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Summary
                      </h5>
                      <div className="bg-background p-4 rounded-lg">
                        <p className="text-sm">{session.summary}</p>
                      </div>
                    </div>
                  )}

                  {/* Inferences */}
                  {session.inferences && session.inferences.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-2">Clinical Inferences</h5>
                      <ul className="space-y-1">
                        {session.inferences.map((inference, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{inference}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Medications */}
                  {session.medications && session.medications.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-2 flex items-center gap-2">
                        <Pill className="h-4 w-4" />
                        Medications
                      </h5>
                      <div className="space-y-2">
                        {session.medications.map((med: any, idx: number) => (
                          <div key={idx} className="bg-background p-3 rounded-lg">
                            <p className="font-medium text-sm">{med.name || "Medication"}</p>
                            {med.dosage && (
                              <p className="text-xs text-muted-foreground">
                                Dosage: {med.dosage}
                              </p>
                            )}
                            {med.instructions && (
                              <p className="text-xs text-muted-foreground">
                                {med.instructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Session Metadata */}
                  <div className="pt-4 border-t space-y-1 text-xs text-muted-foreground">
                    <p>Session ID: {session.id.slice(0, 8)}...</p>
                    <p>Started: {formatDate(session.created_at)}</p>
                    {session.ended_at && (
                      <p>Ended: {formatDate(session.ended_at)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

