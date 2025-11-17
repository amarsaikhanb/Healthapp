-- Allow anonymous users to read patient records by invitation token
-- This is needed for the invitation acceptance flow

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Doctors can view their patients" ON public.patient;
DROP POLICY IF EXISTS "Doctors can invite patients" ON public.patient;
DROP POLICY IF EXISTS "Doctors can update their patients" ON public.patient;
DROP POLICY IF EXISTS "Doctors can delete their patients" ON public.patient;
DROP POLICY IF EXISTS "Patients can view own record" ON public.patient;
DROP POLICY IF EXISTS "Patients can update own record" ON public.patient;

-- Recreate policies with invitation support

-- SELECT policies
CREATE POLICY "Doctors can view their patients"
  ON public.patient
  FOR SELECT
  USING (doctor_id = auth.uid());

CREATE POLICY "Patients can view own record"
  ON public.patient
  FOR SELECT
  USING (id = auth.uid());

-- Allow anonymous read by invitation token (for acceptance page)
CREATE POLICY "Anyone can view patient by invitation token"
  ON public.patient
  FOR SELECT
  USING (invitation_token IS NOT NULL AND invitation_accepted = false);

-- INSERT policy
CREATE POLICY "Doctors can invite patients"
  ON public.patient
  FOR INSERT
  WITH CHECK (doctor_id = auth.uid());

-- UPDATE policies
CREATE POLICY "Doctors can update their patients"
  ON public.patient
  FOR UPDATE
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Patients can update own record"
  ON public.patient
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow anonymous update by invitation token (for acceptance)
CREATE POLICY "Anyone can accept invitation by token"
  ON public.patient
  FOR UPDATE
  USING (
    invitation_token IS NOT NULL 
    AND invitation_accepted = false
  )
  WITH CHECK (
    invitation_token IS NOT NULL
    AND invitation_accepted = true  -- Can only update to accepted
  );

-- DELETE policy
CREATE POLICY "Doctors can delete their patients"
  ON public.patient
  FOR DELETE
  USING (doctor_id = auth.uid());

-- Add helpful comments
COMMENT ON POLICY "Anyone can view patient by invitation token" ON public.patient 
  IS 'Allows anonymous users to view patient record for invitation acceptance page';

COMMENT ON POLICY "Anyone can accept invitation by token" ON public.patient 
  IS 'Allows anonymous users to complete profile and accept invitation using the token';

