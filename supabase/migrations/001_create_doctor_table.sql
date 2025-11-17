-- Create doctor table
CREATE TABLE IF NOT EXISTS public.doctor (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone_number TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT doctor_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Add RLS (Row Level Security) policies
ALTER TABLE public.doctor ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own doctor profile
CREATE POLICY "Users can view own doctor profile"
  ON public.doctor
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can insert their own doctor profile
CREATE POLICY "Users can insert own doctor profile"
  ON public.doctor
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own doctor profile
CREATE POLICY "Users can update own doctor profile"
  ON public.doctor
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own doctor profile
CREATE POLICY "Users can delete own doctor profile"
  ON public.doctor
  FOR DELETE
  USING (auth.uid() = id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.doctor
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add comment to table
COMMENT ON TABLE public.doctor IS 'Stores doctor profile information';

-- Add comments to columns
COMMENT ON COLUMN public.doctor.id IS 'Primary key, matches auth.users.id';
COMMENT ON COLUMN public.doctor.name IS 'Doctor full name';
COMMENT ON COLUMN public.doctor.phone_number IS 'Optional contact phone number';
COMMENT ON COLUMN public.doctor.created_at IS 'Timestamp when profile was created';
COMMENT ON COLUMN public.doctor.updated_at IS 'Timestamp when profile was last updated';

