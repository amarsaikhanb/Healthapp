"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Calendar, CheckCircle, Clock, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deletePatient, resendInvitation } from "@/app/actions/patient"
import { useRouter } from "next/navigation"

interface Patient {
  id: string
  email: string
  name: string | null
  phone_number: string | null
  date_of_birth: string | null
  invitation_accepted: boolean
  created_at: string
}

interface PatientsTableProps {
  patients: Patient[]
}

export function PatientsTable({ patients }: PatientsTableProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleResend = async (patientId: string) => {
    setLoading(patientId)
    const result = await resendInvitation(patientId)
    if (result.success) {
      alert("Invitation resent successfully!")
    } else {
      alert(`Error: ${result.error}`)
    }
    setLoading(null)
  }

  const handleDelete = async (patientId: string) => {
    if (!confirm("Are you sure you want to remove this patient?")) {
      return
    }

    setLoading(patientId)
    const result = await deletePatient(patientId)
    if (result.success) {
      router.refresh()
    } else {
      alert(`Error: ${result.error}`)
    }
    setLoading(null)
  }

  if (patients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Patients Yet</CardTitle>
          <CardDescription>
            Click &quot;Invite Patient&quot; above to send your first invitation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Mail className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Invite patients via email to start managing their health records
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient List</CardTitle>
        <CardDescription>
          View and manage all your patients
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invited</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow 
                key={patient.id}
                className="cursor-pointer"
                onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
              >
                <TableCell className="font-medium">
                  {patient.name || (
                    <span className="text-muted-foreground italic">
                      Pending
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {patient.email}
                  </div>
                </TableCell>
                <TableCell>
                  {patient.phone_number ? (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {patient.phone_number}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {patient.date_of_birth ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(patient.date_of_birth).toLocaleDateString()}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {patient.invitation_accepted ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {new Date(patient.created_at).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={loading === patient.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {!patient.invitation_accepted && (
                        <DropdownMenuItem
                          onClick={() => handleResend(patient.id)}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Resend Invitation
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDelete(patient.id)}
                        className="text-destructive"
                      >
                        Remove Patient
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

