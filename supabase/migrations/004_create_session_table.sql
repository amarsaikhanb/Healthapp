-- Create session table
create table public.session (
  id uuid not null default gen_random_uuid (),
  patient_id uuid null,
  doctor_id uuid null,
  transcript text null,
  summary text null,
  inferences text[] null,
  created_at timestamp with time zone null default now(),
  ended_at timestamp with time zone null,
  medications jsonb null,
  constraint session_pkey primary key (id),
  constraint medications_is_array check ((jsonb_typeof(medications) = 'array'::text)),
  constraint session_patient_id_fkey foreign key (patient_id) references public.patient (id) on delete set null,
  constraint session_doctor_id_fkey foreign key (doctor_id) references public.doctor (id) on delete set null
) TABLESPACE pg_default;

-- Enable RLS
alter table public.session enable row level security;

-- Policies for doctors to manage their sessions
create policy "Doctors can view their own sessions"
  on public.session for select
  using (auth.uid() = doctor_id);

create policy "Doctors can insert sessions"
  on public.session for insert
  with check (auth.uid() = doctor_id);

create policy "Doctors can update their own sessions"
  on public.session for update
  using (auth.uid() = doctor_id);

create policy "Doctors can delete their own sessions"
  on public.session for delete
  using (auth.uid() = doctor_id);

-- Policies for patients to view their sessions
create policy "Patients can view their own sessions"
  on public.session for select
  using (auth.uid() = patient_id);

-- Add indexes for better performance
create index session_patient_id_idx on public.session (patient_id);
create index session_doctor_id_idx on public.session (doctor_id);
create index session_created_at_idx on public.session (created_at desc);

-- Add helpful comments
comment on table public.session is 'Medical consultation sessions with transcripts';
comment on column public.session.transcript is 'Full transcript from Whisper API';
comment on column public.session.summary is 'AI-generated session summary';
comment on column public.session.inferences is 'Array of clinical inferences';
comment on column public.session.medications is 'JSON array of prescribed medications';

