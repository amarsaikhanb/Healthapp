# VAPI Automated Form Call Flow

This document explains the complete automated call flow for form submissions using VAPI and QStash.

## Overview

When a doctor creates a form with a deadline, the system automatically schedules a VAPI phone call to the patient at that exact time. If the patient hasn't submitted the form manually by then, VAPI will call them and collect the answers over the phone.

## Complete Flow

### 1. Form Creation

**Location:** `src/app/actions/forms.ts` → `createForm()`

When a doctor creates a form:
1. Doctor provides:
   - Patient ID
   - Form title
   - Questions array
   - **Deadline** (exact date/time for the call)
2. System creates the form and questions in the database
3. System calls `scheduleFormCall(formId, deadline)` to schedule a QStash job

**Key Code:**
```typescript
// Schedule VAPI call at deadline if provided
if (deadline) {
  const deadlineDate = new Date(deadline)
  await scheduleFormCall(form.id, deadlineDate)
}
```

### 2. QStash Scheduling

**Location:** `src/lib/qstash.ts` → `scheduleFormCall()`

QStash schedules a one-time job:
- Calculates delay: `delaySeconds = (deadline - now) / 1000`
- Publishes message to: `/api/jobs/call-form`
- Payload: `{ formId }`

The job will trigger at the exact deadline time.

### 3. Job Trigger (At Deadline)

**Location:** `src/app/api/jobs/call-form/route.ts`

When deadline arrives, QStash POSTs to this endpoint:

1. **Verify signature** (security)
2. **Check form status:**
   ```typescript
   if (form.submitted_at) {
     return "already submitted, skip call"
   }
   ```
3. **Get form data:**
   - Patient info (name, phone)
   - Questions
4. **Build callback URL:** `/api/forms/vapi-submit`
5. **Create VAPI assistant** with:
   - Patient-friendly instructions
   - Questions to ask
   - Callback URL for submitting answers
6. **Make VAPI call**
7. **Update form:** Set `call_scheduled=true`, `call_made_at`, `call_sid`

**Important:** The call ONLY happens if the form is not yet submitted.

### 4. VAPI Call Execution

**Location:** `src/lib/vapi.ts` → `buildFormAssistant()`

VAPI assistant:
- Introduces itself to the patient
- Asks each question one by one
- Collects answers
- Confirms answers with the patient
- **Sends answers back** to the callback URL

**Assistant Configuration:**
```typescript
{
  name: "Form: Health Assessment",
  model: {
    provider: "openai",
    model: "gpt-4"
  },
  voice: {
    provider: "playht",
    voiceId: "jennifer"
  },
  serverUrl: "https://yourapp.com/api/forms/vapi-submit"
}
```

### 5. Answer Submission (VAPI Callback)

**Location:** `src/app/api/forms/vapi-submit/route.ts`

After the call, VAPI sends answers to this endpoint:

**Expected Payload:**
```json
{
  "call": {
    "metadata": {
      "formId": "uuid"
    }
  },
  "answers": [
    {
      "question_id": "uuid",
      "answer_text": "Patient's response"
    }
  ]
}
```

**Process:**
1. Extract `formId` from metadata
2. Extract `answers` array
3. Verify form exists and not yet submitted
4. Delete existing answers (if any)
5. Insert new answers
6. Mark form as submitted: `submitted_at`, `submitted_via="vapi_call"`
7. Revalidate relevant pages

## Database Schema Updates

### New Migration: `006_add_submitted_via_to_form.sql`

Adds tracking field to know how form was submitted:

```sql
ALTER TABLE public.form 
ADD COLUMN submitted_via text NULL;
```

**Possible Values:**
- `"manual"` - Patient filled out form online
- `"vapi_call"` - VAPI collected answers via phone
- `null` - Not yet submitted

## Alternative: Manual Call

Doctors can still manually trigger a call using the "Call Patient" button:

**Location:** `src/app/actions/vapi-calls.ts` → `makeFormCall()`

This bypasses the scheduled job and immediately initiates a VAPI call.

## Environment Variables Required

```env
# QStash (for scheduling)
QSTASH_TOKEN=xxxxx
QSTASH_CURRENT_SIGNING_KEY=xxxxx
QSTASH_NEXT_SIGNING_KEY=xxxxx

# VAPI (for calls)
VAPI_PRIVATE_KEY=xxxxx
VAPI_PUBLIC_KEY=xxxxx

# Your app URL (for callbacks)
NEXT_PUBLIC_APP_URL=https://yourapp.com
# OR
VERCEL_URL=yourapp.vercel.app
```

## Testing the Flow

### 1. Create Test Form

```typescript
// In your app
await createForm(
  patientId,
  "Health Check",
  ["How are you feeling?", "Any new symptoms?"],
  "2024-12-01T14:00:00Z" // Deadline
)
```

### 2. Verify QStash Job Created

Check QStash dashboard - you should see a scheduled message.

### 3. Wait for Deadline (or test immediately)

For testing, set deadline to 1-2 minutes in the future.

### 4. Monitor Logs

```bash
# Watch for:
# - "Checking form {id} for scheduled call..."
# - "Making VAPI call to {phone} for form {id}"
# - "VAPI call initiated: {callId}"
```

### 5. Check VAPI Dashboard

- Call should appear in VAPI dashboard
- Status: "in-progress" → "completed"

### 6. Verify Answer Submission

```bash
# Watch for:
# - "Received VAPI webhook: ..."
# - "Form {id} submitted successfully via VAPI with {n} answers"
```

### 7. Check Database

```sql
SELECT id, title, submitted_at, submitted_via, call_sid
FROM form
WHERE id = '{formId}';

SELECT question_text, answer_text
FROM question q
JOIN answer a ON a.question_id = q.id
WHERE q.form_id = '{formId}'
ORDER BY question_order;
```

## Troubleshooting

### Call Not Triggered

1. **Check QStash logs** - was the job delivered?
2. **Check endpoint signature verification** - might be failing
3. **Check form status** - already submitted?

### VAPI Call Fails

1. **Check patient phone number** - valid format?
2. **Check VAPI credentials** - valid API key?
3. **Check VAPI dashboard** - error messages?

### Answers Not Saved

1. **Check VAPI webhook logs** - what's being sent?
2. **Check callback URL** - is it accessible?
3. **Check answer format** - matches expected structure?
4. **Check Supabase RLS policies** - allowing insert without auth?

## Security Considerations

### QStash Signature Verification

All QStash requests are verified:
```typescript
const isValid = await verifyQStashSignature(signature, body)
if (!isValid) return 401
```

### VAPI Callback URL

The callback endpoint needs to be:
- **Publicly accessible** (VAPI needs to reach it)
- **Handle various payload formats** (VAPI's structure may vary)
- **Validate formId exists** before saving

### RLS Policies

Note: The VAPI callback endpoint uses service role client to bypass RLS since it's not authenticated. Make sure to:
- Validate formId exists
- Don't expose sensitive data in responses
- Log all submissions for audit

## Next Steps

1. ✅ Form creation schedules QStash job
2. ✅ QStash triggers call at deadline
3. ✅ VAPI makes call and collects answers
4. ✅ Answers submitted via callback
5. ✅ Track submission method
6. 🔜 Add retry logic if call fails
7. 🔜 Send notification to doctor after submission
8. 🔜 Add call recording/transcript storage

## Files Modified/Created

### Modified
- `src/app/actions/forms.ts` - Added `submitted_via: "manual"`
- `src/app/api/jobs/call-form/route.ts` - Complete rewrite with form check
- `src/lib/vapi.ts` - Added `callbackUrl` parameter
- `src/app/actions/vapi-calls.ts` - Added callback URLs to all calls

### Created
- `src/app/api/forms/vapi-submit/route.ts` - VAPI callback endpoint
- `supabase/migrations/006_add_submitted_via_to_form.sql` - DB migration

## Summary

This flow ensures that patients never miss completing their forms:
1. **Doctor creates form** → QStash scheduled
2. **Deadline arrives** → Check if submitted
3. **Not submitted?** → VAPI calls patient
4. **Answers collected** → Auto-saved to database
5. **Doctor notified** → Form ready for review

No manual intervention needed! 🎉

