"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { invitePatient } from "@/app/actions/patient";
import { Loader2, UserPlus, Mail } from "lucide-react";
import { doctorTheme } from "@/lib/theme/doctor";

export function InvitePatientDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await invitePatient(email);

      if (result.success) {
        setSuccess(true);
        setEmail("");
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.error || "Failed to invite patient");
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setEmail("");
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className={`
            inline-flex
            items-center
            gap-2
            border-none
            ${doctorTheme.brandAccentBg}
            ${doctorTheme.brandAccentBorder}
            ${doctorTheme.brand}
            hover:bg-[#C3D6FF]
            transition-colors
          `}
        >
          <UserPlus className="h-4 w-4" />
          Invite Patient
        </Button>
      </DialogTrigger>

      <DialogContent
        className={`
          sm:max-w-[425px]
          ${doctorTheme.cardBg}
          ${doctorTheme.cardBorder}
          border
          shadow-md
        `}
      >
        <DialogHeader>
          <DialogTitle
            className={`
              text-base
              font-semibold
              ${doctorTheme.textMain}
            `}
          >
            Invite a Patient
          </DialogTitle>
          <DialogDescription className={doctorTheme.textMuted}>
            Send an invitation to a patient via email. They&apos;ll receive a
            link to complete their profile.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className={`
                  text-sm
                  font-medium
                  ${doctorTheme.textMain}
                `}
              >
                Patient Email <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail
                  className={`
                    absolute
                    left-3
                    top-3
                    h-4
                    w-4
                    ${doctorTheme.textSubtle}
                  `}
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="patient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isPending}
                  className={`
                    pl-10
                    ${doctorTheme.textMain}
                  `}
                />
              </div>
              <p
                className={`
                  text-xs
                  ${doctorTheme.textSubtle}
                `}
              >
                The patient will receive an invitation link to complete their
                profile.
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div
                className={`
                  text-sm
                  ${doctorTheme.statusPositiveText}
                  ${doctorTheme.statusPositiveBg}
                  border
                  border-[#BBF7D0]
                  p-3
                  rounded-md
                `}
              >
                ✓ Invitation sent successfully!
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className={doctorTheme.textMuted}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className={`
                inline-flex
                items-center
                gap-2
                ${doctorTheme.brandAccentBg}
                ${doctorTheme.brandAccentBorder}
                ${doctorTheme.brand}
                border
                hover:bg-[#C3D6FF]
                transition-colors
              `}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
