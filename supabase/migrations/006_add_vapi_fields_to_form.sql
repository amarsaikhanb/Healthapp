-- Add missing fields to form table for VAPI call flow
-- Only adds columns if they don't already exist

-- Add submitted_via field to track how the form was submitted
ALTER TABLE public.form 
ADD COLUMN IF NOT EXISTS submitted_via text NULL;

-- Add deadline field for form completion and VAPI call scheduling
ALTER TABLE public.form 
ADD COLUMN IF NOT EXISTS deadline timestamp with time zone NULL;

-- Add call tracking fields
ALTER TABLE public.form 
ADD COLUMN IF NOT EXISTS call_scheduled boolean DEFAULT false;

ALTER TABLE public.form 
ADD COLUMN IF NOT EXISTS call_made_at timestamp with time zone NULL;

ALTER TABLE public.form 
ADD COLUMN IF NOT EXISTS call_sid text NULL;

-- Add column comments
COMMENT ON COLUMN public.form.submitted_via IS 'How the form was submitted: manual (patient filled online), vapi_call (collected via phone), etc.';
COMMENT ON COLUMN public.form.deadline IS 'Deadline for form completion - also used as the scheduled VAPI call time if form is not submitted manually';
COMMENT ON COLUMN public.form.call_scheduled IS 'Whether a VAPI call has been scheduled or made for this form';
COMMENT ON COLUMN public.form.call_made_at IS 'Timestamp when the VAPI call was initiated';
COMMENT ON COLUMN public.form.call_sid IS 'VAPI call ID for tracking the phone call';

