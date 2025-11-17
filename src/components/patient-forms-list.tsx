"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle, Clock, ChevronDown, ChevronUp, Phone, AlertTriangle } from "lucide-react"
import { makeFormCall } from "@/app/actions/vapi-calls"
import { useRouter } from "next/navigation"

interface Form {
  id: string
  title: string
  created_at: string
  submitted_at: string | null
  deadline: string | null
  call_scheduled: boolean
  call_made_at: string | null
  questions: Question[]
  answers: Answer[]
}

interface Question {
  id: string
  question_text: string
  question_order: number
}

interface Answer {
  id: string
  question_id: string
  answer_text: string | null
}

interface PatientFormsListProps {
  forms: Form[]
  patientId: string
  patientName: string
}

export function PatientFormsList({ forms, patientName }: PatientFormsListProps) {
  const router = useRouter()
  const [expandedForms, setExpandedForms] = useState<Set<string>>(new Set())
  const [callingForm, setCallingForm] = useState<string | null>(null)

  const toggleForm = (formId: string) => {
    const newExpanded = new Set(expandedForms)
    if (newExpanded.has(formId)) {
      newExpanded.delete(formId)
    } else {
      newExpanded.add(formId)
    }
    setExpandedForms(newExpanded)
  }

  const getAnswerForQuestion = (form: Form, questionId: string) => {
    return form.answers?.find((a) => a.question_id === questionId)?.answer_text || "No answer"
  }

  const handleMakeCall = async (formId: string) => {
    if (!confirm("Make an automated call to patient to collect form responses?")) {
      return
    }

    setCallingForm(formId)
    const result = await makeFormCall(formId)
    setCallingForm(null)

    if (result.success) {
      alert("Call initiated successfully! Patient will receive a call shortly.")
      router.refresh()
    } else {
      alert(`Failed to make call: ${result.error}`)
    }
  }

  const isOverdue = (form: Form) => {
    if (!form.deadline || form.submitted_at) return false
    return new Date(form.deadline) < new Date()
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

  if (forms.length === 0) {
    return null // Don't show section if no forms
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Health Assessment Forms
        </CardTitle>
        <CardDescription>
          Forms sent to {patientName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {forms.map((form) => {
          const isExpanded = expandedForms.has(form.id)
          const sortedQuestions = [...(form.questions || [])].sort(
            (a, b) => a.question_order - b.question_order
          )

          return (
            <div
              key={form.id}
              className="border rounded-lg overflow-hidden"
            >
              {/* Form Header */}
              <div className="w-full p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div 
                    className="flex-1 space-y-1 cursor-pointer"
                    onClick={() => toggleForm(form.id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">{form.title}</h4>
                      {form.submitted_at ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </Badge>
                      ) : isOverdue(form) ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Overdue
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                      {form.call_scheduled && (
                        <Badge variant="outline" className="gap-1">
                          <Phone className="h-3 w-3" />
                          Call Made
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Sent: {formatDate(form.created_at)}
                    </p>

                    {form.deadline && !form.submitted_at && (
                      <p className="text-sm text-muted-foreground">
                        Deadline: {formatDate(form.deadline)}
                        {isOverdue(form) && " (⚠️ Passed)"}
                      </p>
                    )}

                    {form.submitted_at && (
                      <p className="text-sm text-muted-foreground">
                        Submitted: {formatDate(form.submitted_at)}
                      </p>
                    )}

                    {form.call_made_at && (
                      <p className="text-sm text-muted-foreground">
                        Call made: {formatDate(form.call_made_at)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!form.submitted_at && !form.call_scheduled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMakeCall(form.id)}
                        disabled={callingForm === form.id}
                        className="gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        {callingForm === form.id ? "Calling..." : "Call Patient"}
                      </Button>
                    )}
                    <button
                      onClick={() => toggleForm(form.id)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Form Content */}
              {isExpanded && (
                <div className="border-t bg-muted/20 p-4 space-y-4">
                  <div className="space-y-3">
                    {sortedQuestions.map((question, index) => (
                      <div
                        key={question.id}
                        className="bg-background p-4 rounded-lg"
                      >
                        <p className="font-medium text-sm mb-2">
                          {index + 1}. {question.question_text}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getAnswerForQuestion(form, question.id)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t space-y-1 text-xs text-muted-foreground">
                    <p>Form ID: {form.id.slice(0, 8)}...</p>
                    <p>{sortedQuestions.length} question(s)</p>
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

