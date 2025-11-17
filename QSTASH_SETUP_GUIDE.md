# ⚡ QStash Setup - Reliable Job Scheduling

## ✅ What Changed

Replaced Vercel Cron with **QStash** for more reliable, scalable job scheduling!

---

## 🎯 Benefits of QStash

**Why QStash > Vercel Cron:**
- ✅ **More reliable** - Retries on failure
- ✅ **Better monitoring** - Dashboard with logs
- ✅ **Signature verification** - Secure webhooks
- ✅ **Works anywhere** - Not limited to Vercel
- ✅ **Delay/schedule** - Precise timing control
- ✅ **Free tier** - 500 requests/day

---

## 📋 Setup Instructions

### Step 1: Add Environment Variables

Add to `.env.local`:

```env
# QStash (provided by you)
QSTASH_URL="https://qstash.upstash.io"
QSTASH_TOKEN="eyJVc2VySUQiOiIzMjdjYTA3Ni02Zjk0LTRkZjgtOWZiOC1lMDlkNGZiZTY5NmQiLCJQYXNzd29yZCI6ImY0YzZiNzE0YmZhOTQ3MTBiN2ExMDcwM2QzYzA5ZGI5In0="
QSTASH_CURRENT_SIGNING_KEY="sig_5u2bUVUGxGnY2kW9dKeMnUgu84C6"
QSTASH_NEXT_SIGNING_KEY="sig_7JcNtGBB4nyEuFr2z4fqRN3Di841"

# Keep existing
CRON_SECRET=your_secret_here
```

### Step 2: Deploy to Production

```bash
# Deploy to Vercel/production
vercel deploy --prod

# Or push to GitHub (if auto-deploy enabled)
git add .
git commit -m "Add QStash integration"
git push
```

### Step 3: Set Up QStash Schedule

**After deployment, call the setup endpoint ONCE:**

```bash
curl "https://your-app.vercel.app/api/setup-qstash?secret=YOUR_CRON_SECRET"
```

This creates an hourly schedule in QStash to check for overdue forms.

**Response:**
```json
{
  "success": true,
  "message": "QStash schedule created successfully",
  "schedule": {
    "scheduleId": "...",
    "cron": "0 * * * *"
  }
}
```

---

## 🎨 How It Works

### 1. **Hourly Job (Background)**

QStash automatically calls your app every hour:

```
QStash Schedule (hourly)
  ↓
POST /api/cron/check-forms
  ↓
Checks all overdue forms
  ↓
Makes VAPI calls for each
```

### 2. **Deadline-Based Jobs (On-Demand)**

When form created with deadline:

```
Doctor creates form with deadline
  ↓
QStash schedules one-time job
  ↓
Waits until deadline
  ↓
POST /api/jobs/call-form {"formId": "..."}
  ↓
Makes VAPI call to patient
```

### 3. **Signature Verification**

All QStash requests are verified:

```typescript
const signature = request.headers.get("upstash-signature")
const isValid = await verifyQStashSignature(signature, body)

if (!isValid) {
  return 401 Unauthorized
}
```

---

## 📂 Files Created/Updated

### New Files:
```
src/lib/qstash.ts
  - QStash client
  - scheduleFormCheckJob()
  - scheduleFormCall()
  - verifyQStashSignature()

src/app/api/setup-qstash/route.ts
  - One-time setup endpoint
  - Creates hourly schedule

src/app/api/jobs/call-form/route.ts
  - Handles deadline-based calls
  - Triggered by QStash
```

### Updated Files:
```
src/app/api/cron/check-forms/route.ts
  - Now accepts POST (QStash format)
  - Signature verification
  - GET still works for manual triggers

src/app/actions/forms.ts
  - Auto-schedules call at deadline
  - Uses scheduleFormCall()

vercel.json
  - Removed cron config
  - Added CORS headers
```

---

## 🔧 API Endpoints

### 1. `/api/setup-qstash`

**Purpose:** One-time setup of hourly schedule

**Usage:**
```bash
GET https://your-app.com/api/setup-qstash?secret=CRON_SECRET
```

**Response:**
```json
{
  "success": true,
  "message": "QStash schedule created",
  "schedule": {...}
}
```

**When to call:** Once after deployment

---

### 2. `/api/cron/check-forms`

**Purpose:** Check overdue forms and make calls

**Trigger:** QStash (hourly) or manual

**QStash Usage:**
```
POST /api/cron/check-forms
Headers:
  upstash-signature: <signature>
```

**Manual Usage:**
```bash
GET /api/cron/check-forms
Headers:
  Authorization: Bearer CRON_SECRET
```

---

### 3. `/api/jobs/call-form`

**Purpose:** Make VAPI call for specific form

**Trigger:** QStash (at deadline)

**Usage:**
```
POST /api/jobs/call-form
Headers:
  upstash-signature: <signature>
Body:
  {"formId": "uuid"}
```

---

## 🎯 Two Job Types

### Type 1: Recurring (Hourly Cleanup)

**Scheduled by:** `/api/setup-qstash` (once)

**Runs:** Every hour (0 * * * *)

**Does:**
- Finds forms past deadline
- Not yet called
- Not yet submitted
- Makes calls for all

**Use case:** Backup/catch-all for missed deadlines

---

### Type 2: One-Time (Deadline-Based)

**Scheduled by:** `createForm()` action

**Runs:** At exact deadline time

**Does:**
- Makes call for specific form
- Only if not yet submitted

**Use case:** Precise timing, better UX

---

## 🔐 Security

### Signature Verification:

Every QStash request is signed:

```typescript
// QStash signs with HMAC
const signature = "v1=abc123..."

// We verify with signing keys
await receiver.verify({
  signature,
  body,
})
```

**Protects against:**
- Unauthorized calls
- Replay attacks
- Tampering

---

## 💰 Pricing

**Free Tier:**
- 500 requests/day
- Perfect for < 20 forms/day
- ~600 forms/month

**Paid Tiers:**
- $10/month: 10k requests
- $30/month: 100k requests
- Much cheaper than running own workers!

**Example:**
- 100 patients
- 2 forms/month each
- = 200 forms/month
- = ~200 QStash requests
- = **FREE!** 🎉

---

## 🧪 Testing

### Test 1: Setup Schedule

```bash
# After deployment
curl "https://your-app.com/api/setup-qstash?secret=YOUR_CRON_SECRET"

# ✅ Should return success
# ✅ Check QStash dashboard - see schedule
```

### Test 2: Manual Trigger

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.com/api/cron/check-forms

# ✅ Should check forms
# ✅ Console logs activity
```

### Test 3: Create Form with Deadline

```
1. Create form with deadline in 2 minutes
2. Wait 2 minutes
3. ✅ Patient should receive call
4. Check QStash dashboard
5. ✅ See job execution
```

### Test 4: Check QStash Dashboard

1. Go to https://console.upstash.com/qstash
2. ✅ See scheduled jobs
3. ✅ See execution logs
4. ✅ See success/failure status

---

## 🐛 Troubleshooting

### Issue: "QStash not configured"

**Solution:**
Add all 4 QStash env vars to `.env.local` AND Vercel/production

### Issue: Setup endpoint returns 401

**Solution:**
Include correct `?secret=CRON_SECRET` parameter

### Issue: Jobs not running

**Check:**
1. QStash dashboard shows schedule
2. Endpoint is public (not localhost)
3. Signature verification passes
4. Check QStash logs for errors

### Issue: "Invalid signature"

**Solutions:**
- Verify signing keys are correct
- Check body isn't modified
- Ensure keys match dashboard

### Issue: Hourly job created multiple times

**Solution:**
Only call setup endpoint ONCE. Check QStash dashboard and delete duplicates if needed.

---

## 📊 Monitoring

### QStash Dashboard:

**View:**
1. All scheduled jobs
2. Execution history
3. Success/failure rates
4. Error messages
5. Request/response logs

**Access:**
https://console.upstash.com/qstash

### Your App Logs:

**Check:**
```bash
vercel logs your-app-name
```

**Should see:**
- "Running overdue forms check..."
- "Processed X overdue forms"
- "Scheduled call for form..."

---

## 🚀 Advanced Features

### Retry Configuration:

QStash auto-retries failed jobs:

```typescript
// In qstash.ts (optional enhancement)
await qstashClient.publishJSON({
  url,
  body: { formId },
  delay: delaySeconds,
  retries: 3, // Retry 3 times if fails
})
```

### Custom Schedules:

Different schedules for different times:

```typescript
// Every 30 minutes during business hours
cron: "*/30 9-17 * * 1-5"

// Daily at 9 AM
cron: "0 9 * * *"

// Every 15 minutes
cron: "*/15 * * * *"
```

### Dead Letter Queue:

Handle failed jobs:

```typescript
// Add DLQ endpoint
const dlq = `${baseUrl}/api/jobs/failed`

await qstashClient.publishJSON({
  url,
  body,
  failureCallback: dlq,
})
```

---

## ✅ Success Checklist

- [ ] QStash env vars added to `.env.local`
- [ ] QStash env vars added to Vercel/production
- [ ] App deployed to production
- [ ] Called `/api/setup-qstash?secret=...` once
- [ ] Verified schedule in QStash dashboard
- [ ] Created test form with deadline
- [ ] Received test call successfully
- [ ] Monitoring QStash dashboard

---

## 📝 Environment Variables Summary

Complete `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Email
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# OpenAI
OPENAI_API_KEY=sk-...

# VAPI
VAPI_PRIVATE_KEY=...
VAPI_PUBLIC_KEY=...

# QStash (NEW)
QSTASH_URL="https://qstash.upstash.io"
QSTASH_TOKEN="eyJ..."
QSTASH_CURRENT_SIGNING_KEY="sig_..."
QSTASH_NEXT_SIGNING_KEY="sig_..."

# Security
CRON_SECRET=your_random_secret
```

---

## 🎯 Key Differences from Vercel Cron

| Feature | Vercel Cron | QStash |
|---------|-------------|---------|
| **Platform** | Vercel only | Any platform |
| **Monitoring** | Limited | Full dashboard |
| **Retries** | No | Yes, automatic |
| **Signatures** | No | Yes, HMAC |
| **Delays** | No | Yes, precise |
| **Free Tier** | Limited | 500/day |
| **One-time jobs** | No | Yes |

---

**Status:** ✅ Complete!  
**QStash Integration:** Ready to use

**Your app now has enterprise-grade job scheduling! ⚡✨**

