"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

interface Form {
  id: string
  title: string
  created_at: string
  submitted_at: string | null
  doctor: {
    name: string
  } | null
}

interface PatientPendingFormsProps {
  forms: Form[]
}

export function PatientPendingForms({ forms }: PatientPendingFormsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (forms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Health Forms
          </CardTitle>
          <CardDescription>
            Forms from your doctor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No forms assigned yet
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const pendingForms = forms.filter((f) => !f.submitted_at)
  const completedForms = forms.filter((f) => f.submitted_at)

  return (
    <div className="space-y-6">
      {/* Pending Forms */}
      {pendingForms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending Forms
            </CardTitle>
            <CardDescription>
              {pendingForms.length} form{pendingForms.length !== 1 ? 's' : ''} waiting for your response
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingForms.map((form) => (
              <div
                key={form.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{form.title}</h4>
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {form.doctor ? `From Dr. ${form.doctor.name} • ` : ''}{formatDate(form.created_at)}
                    </p>
                  </div>
                  <Link href={`/patient/forms/${form.id}`}>
                    <Button className="gap-2">
                      Fill Out
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Forms */}
      {completedForms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Completed Forms
            </CardTitle>
            <CardDescription>
              {completedForms.length} form{completedForms.length !== 1 ? 's' : ''} submitted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedForms.map((form) => (
              <div
                key={form.id}
                className="border rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{form.title}</h4>
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Completed
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Submitted: {formatDate(form.submitted_at!)}
                    </p>
                  </div>
                  <Link href={`/patient/forms/${form.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

