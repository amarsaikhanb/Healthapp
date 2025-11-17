-- Forms system tables

-- Form table
create table public.form (
  id uuid not null default gen_random_uuid (),
  doctor_id uuid null,
  patient_id uuid null,
  title text not null default 'Health Assessment Form',
  created_at timestamp with time zone null default now(),
  submitted_at timestamp with time zone null,
  submitted_via text null,
  deadline timestamp with time zone null,
  call_scheduled boolean default false,
  call_made_at timestamp with time zone null,
  call_sid text null,
  constraint form_pkey primary key (id),
  constraint form_doctor_id_fkey foreign key (doctor_id) references public.doctor (id) on delete cascade,
  constraint form_patient_id_fkey foreign key (patient_id) references public.patient (id) on delete cascade
) TABLESPACE pg_default;

-- Question table
create table public.question (
  id uuid not null default gen_random_uuid (),
  form_id uuid not null,
  question_text text not null,
  question_order integer not null default 0,
  created_at timestamp with time zone null default now(),
  constraint question_pkey primary key (id),
  constraint question_form_id_fkey foreign key (form_id) references public.form (id) on delete cascade
) TABLESPACE pg_default;

-- Answer table
create table public.answer (
  id uuid not null default gen_random_uuid (),
  form_id uuid not null,
  question_id uuid not null,
  answer_text text null,
  created_at timestamp with time zone null default now(),
  constraint answer_pkey primary key (id),
  constraint answer_form_id_fkey foreign key (form_id) references form (id) on delete cascade,
  constraint answer_question_id_fkey foreign key (question_id) references question (id) on delete restrict
) TABLESPACE pg_default;

-- Enable RLS
alter table public.form enable row level security;
alter table public.question enable row level security;
alter table public.answer enable row level security;

-- Form policies
create policy "Doctors can view their forms"
  on public.form for select
  using (auth.uid() = doctor_id);

create policy "Doctors can insert forms"
  on public.form for insert
  with check (auth.uid() = doctor_id);

create policy "Doctors can update their forms"
  on public.form for update
  using (auth.uid() = doctor_id);

create policy "Doctors can delete their forms"
  on public.form for delete
  using (auth.uid() = doctor_id);

create policy "Patients can view their assigned forms"
  on public.form for select
  using (auth.uid() = patient_id);

create policy "Patients can update their forms (submit answers)"
  on public.form for update
  using (auth.uid() = patient_id);

-- Question policies
create policy "Doctors can manage questions for their forms"
  on public.question for all
  using (
    exists (
      select 1 from public.form
      where form.id = question.form_id
      and form.doctor_id = auth.uid()
    )
  );

create policy "Patients can view questions for their forms"
  on public.question for select
  using (
    exists (
      select 1 from public.form
      where form.id = question.form_id
      and form.patient_id = auth.uid()
    )
  );

-- Answer policies
create policy "Doctors can view answers for their forms"
  on public.answer for select
  using (
    exists (
      select 1 from public.form
      where form.id = answer.form_id
      and form.doctor_id = auth.uid()
    )
  );

create policy "Patients can manage answers for their forms"
  on public.answer for all
  using (
    exists (
      select 1 from public.form
      where form.id = answer.form_id
      and form.patient_id = auth.uid()
    )
  );

-- Indexes
create index form_doctor_id_idx on public.form (doctor_id);
create index form_patient_id_idx on public.form (patient_id);
create index question_form_id_idx on public.question (form_id);
create index answer_form_id_idx on public.answer (form_id);
create index answer_question_id_idx on public.answer (question_id);

-- Comments
comment on table public.form is 'Custom health assessment forms created by doctors for patients';
comment on table public.question is 'Questions belonging to forms';
comment on table public.answer is 'Patient answers to form questions';

-- Column comments
comment on column public.form.submitted_via is 'How the form was submitted: manual (patient filled online), vapi_call (collected via phone), etc.';
comment on column public.form.deadline is 'Deadline for form completion - also used as the scheduled VAPI call time if form is not submitted manually';
comment on column public.form.call_scheduled is 'Whether a VAPI call has been scheduled or made for this form';
comment on column public.form.call_made_at is 'Timestamp when the VAPI call was initiated';
comment on column public.form.call_sid is 'VAPI call ID for tracking the phone call';

