"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { upsertDoctorProfile, type DoctorProfile } from "@/app/actions/doctor"
import { Loader2, Save, User, Phone } from "lucide-react"

interface DoctorProfileFormProps {
  initialData?: DoctorProfile
}

export function DoctorProfileForm({ initialData }: DoctorProfileFormProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phone_number || "")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await upsertDoctorProfile(name, phoneNumber || null)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || "Failed to save profile")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Doctor Profile</CardTitle>
        <CardDescription>
          Update your professional information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Dr. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isPending}
                className="pl-10"
                minLength={2}
                maxLength={100}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your full name as you&apos;d like it to appear
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isPending}
                className="pl-10"
                maxLength={20}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Optional contact number
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
              ✓ Profile saved successfully!
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

