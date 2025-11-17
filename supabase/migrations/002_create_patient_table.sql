-- Create patient table with doctor_id foreign key
CREATE TABLE IF NOT EXISTS public.patient (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NULL,
  phone_number TEXT NULL,
  date_of_birth DATE NULL,
  doctor_id UUID NOT NULL,
  invitation_token TEXT NULL UNIQUE,
  invitation_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT patient_pkey PRIMARY KEY (id),
  CONSTRAINT patient_doctor_id_fkey FOREIGN KEY (doctor_id) 
    REFERENCES public.doctor (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_doctor_id ON public.patient(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_email ON public.patient(email);
CREATE INDEX IF NOT EXISTS idx_patient_invitation_token ON public.patient(invitation_token);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.patient ENABLE ROW LEVEL SECURITY;

-- Policy: Doctors can view their own patients
CREATE POLICY "Doctors can view their patients"
  ON public.patient
  FOR SELECT
  USING (doctor_id = auth.uid());

-- Policy: Doctors can insert patients (invite)
CREATE POLICY "Doctors can invite patients"
  ON public.patient
  FOR INSERT
  WITH CHECK (doctor_id = auth.uid());

-- Policy: Doctors can update their patients
CREATE POLICY "Doctors can update their patients"
  ON public.patient
  FOR UPDATE
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

-- Policy: Doctors can delete their patients
CREATE POLICY "Doctors can delete their patients"
  ON public.patient
  FOR DELETE
  USING (doctor_id = auth.uid());

-- Policy: Patients can view their own record (if they have auth.uid matching id)
-- This allows patients to see their own info if they later sign up
CREATE POLICY "Patients can view own record"
  ON public.patient
  FOR SELECT
  USING (id = auth.uid());

-- Policy: Patients can update their own record
CREATE POLICY "Patients can update own record"
  ON public.patient
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_patient_updated_at
  BEFORE UPDATE ON public.patient
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add comments
COMMENT ON TABLE public.patient IS 'Stores patient information linked to doctors';
COMMENT ON COLUMN public.patient.id IS 'Primary key';
COMMENT ON COLUMN public.patient.email IS 'Patient email address (unique)';
COMMENT ON COLUMN public.patient.name IS 'Patient full name';
COMMENT ON COLUMN public.patient.phone_number IS 'Patient contact number';
COMMENT ON COLUMN public.patient.date_of_birth IS 'Patient date of birth';
COMMENT ON COLUMN public.patient.doctor_id IS 'Foreign key to doctor who manages this patient';
COMMENT ON COLUMN public.patient.invitation_token IS 'Unique token for patient invitation link';
COMMENT ON COLUMN public.patient.invitation_accepted IS 'Whether patient has accepted invitation and filled out info';

