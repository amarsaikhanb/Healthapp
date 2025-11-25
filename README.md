# LiveAD

LiveAD is an AI-assisted remote care platform built with Next.js 15, Supabase, VAPI, Pathway, and Aparavi. Doctors can create structured forms, schedule automated voice check-ins, receive AI-generated session summaries, and chat with a patient-specific RAG assistant. Patients get a focused dashboard, secure messaging, and automated reminders.

---

## 🚀 Core Features

### Patient & Doctor Dashboards
- Doctor dashboard with collapsible sidebar, session management, and patient forms.
- Patient dashboard with doctor assignment, pending forms, and daily check-ins.

### Automated Voice Check-ins (VAPI)
- Doctors schedule or manually trigger voice calls.
- VAPI assistant calls patients for missed daily check-ins, introduces itself on behalf of the doctor, collects answers, and transcribes responses.
- Transcripts are sent to OpenAI to extract structured answers and automatically submit the form.

### Session Intelligence
- Doctors transcribe sessions from Whisper (outside this repo).
- `updateSessionTranscript` calls GPT-4o-mini to generate:
  - 2–3 sentence summary
  - Clinical inferences
  - Medication list with reason & frequency
- Medications are stored as JSONB and displayed with an approval UI in `SessionsList`.

### Patient RAG Chatbot (Pathway)
- Each patient’s history (profile, sessions, forms) is exported via `generatePatientDocument`.
- A local Pathway service (Python) keeps per-patient documents indexed in real time.
- Doctors can open the Patient RAG Chatbot on any patient page to ask natural-language questions (fallback is direct OpenAI query).

### Aparavi Integration
- The repo includes `aparavi-dtc-node-sdk` for connecting to Aparavi Data Transfer Cloud (used in other parts of the app for data operations – see `src/app/actions/session.ts` imports).

### Patient Side
- A simple way to log your recovery, stay on track, and know what to do next.
- Daily Recovery Check-Ins with guided symptom logging.
- Medication Management cards plus approval workflow.
- Assigned Recovery Forms pulled from a template library.
- Recovery Timeline, education & expectations, and follow-up reminders.
- Secure Messaging & Notifications, AI Support Assistant, auto-generated visit reports.
- Session recording playback and patient dashboard overview.

### Provider Side
- A clear, real-time view of every patient’s recovery between visits.
- Clinic Dashboard with Trust Score breakdown and Patient Directory.
- Assign Forms & Assessments, Care Plan editing, Template Library access.
- Appointment Hub, Follow-Up Task Routing, Appointment Management.
- Medication Control, Insight Summaries, Auto-Generated Visit Reports.
- Smart Alerts for missed check-ins or worsening symptoms.
- Session Recording access and Recovery Timeline visualization.

### Shared & System
- A connected loop that brings patient experiences and clinical decisions together.
- Real-Time Sync between web app, voice assistant, and RAG chatbot.
- Template Library for forms & support messages used across both sides.
- Secure messaging, notifications, and follow-up task routing.
- Recovery Timeline + Appointment Hub ensure clinic + patient stay aligned.
- Smart alerts, medication control, education, expectations, and session tracking feed both views.

---

## 🧱 Tech Stack

| Area              | Technology                                   |
|-------------------|----------------------------------------------|
| Frontend          | Next.js 15 (App Router), React 18, TypeScript |
| UI                | Tailwind CSS, Shadcn UI, Lucide Icons         |
| Auth & Data       | Supabase (Postgres, RLS, Auth helpers)        |
| AI & Voice        | OpenAI GPT-4o-mini, VAPI.ai, Pathway RAG      |
| Automation        | Upstash QStash (scheduled jobs)               |
| External SDKs     | Aparavi DTC Node SDK                          |

---

## 📂 Key Modules

| Path                                         | Purpose |
|----------------------------------------------|---------|
| `src/app/actions/session.ts`                 | Handles session CRUD, transcript analysis, AI summaries |
| `src/app/actions/forms.ts`                   | Form creation, submission, QStash scheduling |
| `src/app/actions/vapi-calls.ts`              | Server actions to trigger VAPI voice calls |
| `src/app/api/webhooks/vapi/route.ts`         | Receives VAPI end-of-call reports, extracts answers via OpenAI |
| `src/lib/vapi.ts`                            | VAPI client, assistant builder (prompt, voice, first message) |
| `src/lib/pathway-rag.ts`                     | Builds patient documents for RAG and fallback OpenAI queries |
| `src/components/patient-rag-chatbot.tsx`     | Doctor-facing chatbot UI |
| `pathway_rag/main.py`                        | Real-time RAG service (Pathway + OpenAI embeddings) |
| `supabase/migrations`                        | Database schema, RLS, policies (e.g., patient doctor visibility) |

---

## 🧠 AI & Voice Workflows

### 1. Session Transcript Analysis
1. Doctor saves transcript → `updateSessionTranscript`.
2. GPT-4o-mini returns summary, inferences, medications (with reason + frequency).
3. Data stored on `session` table (JSONB for meds).

### 2. Automated Voice Forms (VAPI)
1. Doctor schedules call manually or via QStash.
2. VAPI assistant:
   - Introduces itself: **"Hi Michael, this is LiveAD calling on behalf of Dr. Kareem..."**
   - Asks daily check-in questions.
   - Closes with reminder + next check-in.
3. Transcript hits `/api/webhooks/vapi`.
4. We fetch actual form questions, call OpenAI to map answers, save to Supabase, mark form submitted.

### 3. Patient RAG
1. `generatePatientDocument` joins patient profile, sessions, forms.
2. Docs written to `pathway_rag/patient_data/{patientId}.txt`.
3. Pathway indexes docs; doctor chatbot fetches context + uses GPT-4o-mini.
4. If Pathway not running, fallback server action queries OpenAI directly with patient document.

---

## 🛠 Local Development

### 1. Prerequisites
- Node.js 18+
- Python 3.10+ (for Pathway service)
- Supabase project (URL, anon key, service role)
- OpenAI API key
- VAPI credentials (private key, phone number ID)
- ngrok (for local webhooks)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

OPENAI_API_KEY=sk-...
VAPI_PRIVATE_KEY=...
VAPI_PHONE_NUMBER_ID=...

# Used to generate absolute callback URLs (ngrok or deployed URL)
NEXT_PUBLIC_APP_URL=https://your-url.ngrok.io
```

For the Pathway service (`pathway_rag/.env`):
```env
OPENAI_API_KEY=sk-...
```

### 4. Database Setup
```bash
supabase start          # optional local edge runtime
supabase db reset       # runs migrations
```

### 5. Run Next.js App
```bash
npm run dev
```

### 6. Run Pathway RAG (optional but recommended)
```bash
cd pathway_rag
pip install -r requirements.txt
python main.py
```
If not running, RAG chatbot falls back to direct OpenAI queries.

### 7. Expose Webhook for VAPI (local dev)
```bash
ngrok http 3000
```
Set `NEXT_PUBLIC_APP_URL=https://your-ngrok-subdomain.ngrok.io` and configure VAPI server URL (either globally in VAPI dashboard or via `assistant.server.url` which we set programmatically).

---

## 🧾 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` / `npm start` | Production build + run |
| `npm run lint` | ESLint check |
| `npm run rag` | Start Pathway service (`python main.py`) |
| `npm run rag:install` | Install Python deps for Pathway |

---

## 🔒 Supabase Policies & Notes
- Patients can view/update their record (policies in `002_create_patient_table.sql`).
- Doctors can manage their patients/forms/sessions.
- Patients can now view their assigned doctor due to `007_allow_patients_view_doctors.sql`.

---

## 🤝 Contributing
1. Fork repo, create a feature branch.
2. Install deps, run `npm run lint`.
3. Submit PR describing the change.

---

## 📄 License
MIT
