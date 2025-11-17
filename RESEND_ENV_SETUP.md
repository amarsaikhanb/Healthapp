# Setting Up Resend Environment Variables

## 📧 Quick Reference

Since you've already added your Resend API key, here's what you need to know!

---

## ✅ Required Environment Variables

Add these to your `.env.local` file:

```env
# Your Resend API Key (you already have this!)
RESEND_API_KEY=re_your_api_key_here

# Sender email address (use default for testing)
RESEND_FROM_EMAIL=onboarding@resend.dev

# Your application URL (for invitation links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🔧 Variable Details

### 1. RESEND_API_KEY

**What it is:** Your Resend authentication key  
**Where to find it:** [Resend API Keys](https://resend.com/api-keys)  
**Format:** `re_xxxxxxxxxx_yyyyyyyyyyyy`  
**Status:** ✅ You already have this!

### 2. RESEND_FROM_EMAIL

**What it is:** The "from" address in emails  
**Default:** `onboarding@resend.dev`  
**For testing:** Use the default above  
**For production:** Use your own verified domain email

```env
# Development (use this!)
RESEND_FROM_EMAIL=onboarding@resend.dev

# Production (after domain verification)
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 3. NEXT_PUBLIC_APP_URL

**What it is:** Your app's base URL for invitation links  
**Development:** `http://localhost:3000`  
**Production:** `https://your-domain.com`

```env
# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
```

---

## 📝 Complete `.env.local` Template

Copy this and replace with your actual values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Resend Email Configuration
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🧪 Testing Your Setup

### Step 1: Verify Variables Are Loaded

Restart your dev server after adding variables:

```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

### Step 2: Send Test Email

1. Go to http://localhost:3000/dashboard
2. Click "Invite Patient"
3. Enter your email
4. Click "Send Invitation"
5. Check your email inbox!

### Step 3: Check for Errors

If you see errors in terminal:
```
Error: RESEND_API_KEY is not set
```
→ Variable not loaded, restart dev server

```
Error: Invalid API key
```
→ Check your API key is correct

```
Error: Failed to send email
```
→ Check Resend dashboard for API usage

---

## 🎯 Getting Your Resend API Key

If you need to find or regenerate your API key:

1. Go to [Resend Dashboard](https://resend.com)
2. Click **"API Keys"** in sidebar
3. Either:
   - Copy existing key (if visible)
   - Click **"Create API Key"**
4. Choose permissions:
   - Name: "Health App Production"
   - Permission: "Sending access"
5. Copy the key (starts with `re_`)
6. Add to `.env.local`

**⚠️ Important:** API keys are only shown once! Save it somewhere safe.

---

## 🌐 Production Setup

### For Vercel Deployment

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add each variable:
   - `RESEND_API_KEY` = your key
   - `RESEND_FROM_EMAIL` = your verified email
   - `NEXT_PUBLIC_APP_URL` = your production URL

### For Other Hosting

Add environment variables in your hosting platform's dashboard.

---

## 🔐 Security Notes

### DO:
✅ Keep `RESEND_API_KEY` secret  
✅ Add `.env.local` to `.gitignore` (already done)  
✅ Use different API keys for dev/prod  
✅ Regenerate keys if exposed  

### DON'T:
❌ Commit `.env.local` to git  
❌ Share API keys publicly  
❌ Use production keys in development  
❌ Expose keys in client-side code  

---

## 📧 Sender Email Setup

### Option 1: Use Default (Testing)

**Email:** `onboarding@resend.dev`  
**Pros:** Works immediately, no setup  
**Cons:** Not personalized, testing only  

```env
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### Option 2: Use Your Domain (Production)

**Steps:**

1. **Add Domain in Resend:**
   - Go to [Domains](https://resend.com/domains)
   - Click "Add Domain"
   - Enter your domain

2. **Add DNS Records:**
   Resend will provide 3 records:
   - SPF record
   - DKIM record  
   - DMARC record

   Add these to your domain's DNS settings.

3. **Verify Domain:**
   - Wait 24-48 hours for DNS propagation
   - Resend will verify automatically
   - You'll see "Verified" status

4. **Update Environment Variable:**
   ```env
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

---

## 🧪 Verify It's Working

### Check 1: Environment Variables Loaded

Create a test API route:

```typescript
// src/app/api/test-env/route.ts
export async function GET() {
  return Response.json({
    hasResendKey: !!process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  })
}
```

Visit: http://localhost:3000/api/test-env

Should show:
```json
{
  "hasResendKey": true,
  "fromEmail": "onboarding@resend.dev",
  "appUrl": "http://localhost:3000"
}
```

### Check 2: Send Test Email

Use the invite patient button in dashboard!

### Check 3: Resend Dashboard

Go to [Resend Emails](https://resend.com/emails) and see your sent email.

---

## 🐛 Troubleshooting

### Issue: "RESEND_API_KEY is not set"

**Solutions:**
1. Create `.env.local` in project root
2. Add `RESEND_API_KEY=your_key`
3. Restart dev server (`Ctrl+C` then `npm run dev`)
4. Clear Next.js cache: `rm -rf .next`

### Issue: "Invalid API key"

**Solutions:**
1. Verify key starts with `re_`
2. Check for extra spaces in `.env.local`
3. Regenerate key in Resend dashboard
4. Ensure key has "Sending access" permission

### Issue: "Email not sending"

**Check:**
1. Resend dashboard shows API usage
2. Check quota/limits (free tier: 100/day, 3000/month)
3. Look for errors in terminal
4. Test with Resend API directly

### Issue: "Variables not loading"

**Solutions:**
1. File must be named exactly `.env.local`
2. Must be in project root (same level as `package.json`)
3. Restart dev server after changes
4. Check for syntax errors in `.env.local`

---

## 📊 Rate Limits

Resend Free Tier:
- **100 emails per day**
- **3,000 emails per month**
- **1 domain**

Pro Tier ($20/month):
- **50,000 emails per month**
- **Unlimited domains**
- **Better deliverability**

Check usage: [Resend Dashboard](https://resend.com/overview)

---

## ✅ Final Checklist

Before testing, ensure:

- [ ] `.env.local` file exists in project root
- [ ] `RESEND_API_KEY` is set with your actual key
- [ ] `RESEND_FROM_EMAIL` is set (use `onboarding@resend.dev` for testing)
- [ ] `NEXT_PUBLIC_APP_URL` is set to `http://localhost:3000`
- [ ] Dev server restarted after adding variables
- [ ] No syntax errors in `.env.local` (no spaces around `=`)
- [ ] Doctor profile created in app
- [ ] Test invitation sent successfully

---

## 🎉 You're Ready!

Your Resend integration is configured! Now you can:

1. **Invite patients** and they'll receive real emails
2. **Track email delivery** in Resend dashboard
3. **Customize email templates** as needed
4. **Scale to production** when ready

**Test it now:**
```bash
npm run dev
# Go to http://localhost:3000/dashboard
# Click "Invite Patient"
# Enter your email
# Check inbox!
```

---

**Need help?**  
- [Resend Docs](https://resend.com/docs)
- [Resend Support](https://resend.com/support)

**Last Updated:** November 17, 2024

