# Email Integration Setup Guide (Resend)

## 🎉 Email Invitations Now Enabled!

The patient invitation system now sends real emails using Resend! When you invite a patient, they'll receive a beautiful HTML email with an invitation link.

---

## 📋 Prerequisites

- Resend account (free tier available)
- Your Resend API key (you mentioned you already added this!)
- Verified sender email (or use the default for testing)

---

## 🚀 Quick Setup

### Step 1: Verify Your Environment Variables

Make sure your `.env.local` file has these variables:

```env
# Resend Email Configuration
RESEND_API_KEY=re_your_actual_api_key

# Email sender (for testing, use onboarding@resend.dev)
RESEND_FROM_EMAIL=onboarding@resend.dev

# Your app URL (for invitation links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Test the Integration

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Create your doctor profile** (if you haven't already):
   - Go to Settings
   - Fill in your name
   - Save profile

3. **Send a test invitation:**
   - Go to Dashboard
   - Click "Invite Patient"
   - Enter your own email address (for testing)
   - Click "Send Invitation"
   - Check your email inbox!

---

## 📧 Email Details

### What Patients Receive

When you invite a patient, they receive an email with:

✅ **Beautiful HTML design** with gradient header  
✅ **Doctor's name** who invited them  
✅ **Clear call-to-action** button  
✅ **Security notice** about the unique link  
✅ **Plain text URL** as fallback  
✅ **Professional footer** with sender info  

### Email Content Includes:

- 🏥 Health App branding
- 👨‍⚕️ Your doctor name from profile
- 🔗 Unique invitation link
- 📝 What patients can do in the portal
- ⚠️ Security warning not to share link
- 📧 Fallback plain text link

---

## 🔧 Configuration Options

### Environment Variables Explained

| Variable | Purpose | Default | Example |
|----------|---------|---------|---------|
| `RESEND_API_KEY` | Your Resend API key | Required | `re_123abc...` |
| `RESEND_FROM_EMAIL` | Sender email address | `onboarding@resend.dev` | `noreply@yourdomain.com` |
| `NEXT_PUBLIC_APP_URL` | Your app's URL | `http://localhost:3000` | `https://app.yourdomain.com` |

### Sender Email Options

**For Development/Testing:**
```env
RESEND_FROM_EMAIL=onboarding@resend.dev
```
- Resend provides this test email
- Works immediately, no verification needed
- Perfect for development

**For Production:**
```env
RESEND_FROM_EMAIL=noreply@yourdomain.com
```
- Requires domain verification in Resend
- Looks more professional
- Better deliverability

---

## 🎨 Email Template

The email template is located at:
```
src/lib/emails/patient-invitation.tsx
```

### Customization

You can customize the email by editing this file:

**Change Colors:**
```tsx
// Header gradient
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// Button color
background: #667eea;
```

**Change Content:**
```tsx
<p>
  This secure portal will allow you to:
</p>
<ul>
  <li>Your custom feature</li>
  <li>Another feature</li>
</ul>
```

**Change Styling:**
The template uses inline styles for maximum email client compatibility.

---

## 🔍 How It Works

### 1. Invitation Flow

```
Doctor invites patient
    ↓
System creates patient record
    ↓
Generates unique invitation token
    ↓
Sends email via Resend API
    ↓
Patient receives email
    ↓
Patient clicks link
    ↓
Patient completes profile
```

### 2. Code Structure

**Server Action** (`src/app/actions/patient.ts`):
```typescript
// invitePatient() function:
1. Validates email
2. Checks for duplicates
3. Gets doctor name
4. Creates patient record
5. Generates invitation URL
6. Sends email via Resend
7. Returns success/error
```

**Email Template** (`src/lib/emails/patient-invitation.tsx`):
```typescript
// React component that renders HTML email
- Takes doctorName and invitationUrl as props
- Returns beautiful HTML email
```

**Resend Client** (`src/lib/resend.ts`):
```typescript
// Initializes Resend with API key
- Validates API key exists
- Exports resend client
```

---

## 🧪 Testing

### Test Checklist

- [ ] Environment variables are set
- [ ] Doctor profile is created
- [ ] Send test invitation to your email
- [ ] Receive email within 1-2 minutes
- [ ] Email looks good in your email client
- [ ] Click invitation link works
- [ ] Token is in the URL
- [ ] Resend invitation works

### Resend Dashboard

Check email sends in Resend:
1. Go to [Resend Dashboard](https://resend.com/emails)
2. View "Emails" tab
3. See sent, delivered, opened status
4. Check for any errors

### Test Different Email Clients

✅ Gmail  
✅ Outlook  
✅ Apple Mail  
✅ Mobile email apps  

---

## 🚨 Troubleshooting

### Issue: Email Not Sending

**Check 1: API Key**
```typescript
// Error: "RESEND_API_KEY is not set"
```
**Solution:** Add `RESEND_API_KEY` to your `.env.local` file

**Check 2: Sender Email**
```
// Error: "Invalid sender email"
```
**Solution:** Use `onboarding@resend.dev` for testing

**Check 3: Console Errors**
```bash
# Check terminal output for errors
Failed to send invitation email: [error details]
```

### Issue: Email Goes to Spam

**Solutions:**
1. Use verified domain in production
2. Add SPF/DKIM records (Resend provides these)
3. Use professional sender name
4. Avoid spam trigger words

### Issue: Invitation Link Not Working

**Check:**
1. `NEXT_PUBLIC_APP_URL` is set correctly
2. Token is in the URL: `?token=...`
3. Patient acceptance page exists

---

## 🔐 Security Best Practices

### Current Implementation

✅ **Unique tokens** - Each invitation has unique 64-character hex token  
✅ **Email validation** - Server-side validation  
✅ **Duplicate prevention** - Can't invite same email twice  
✅ **Doctor association** - Patients linked to specific doctor  
✅ **Token in database** - Stored securely in database  

### Recommended Additions

For production, consider adding:

1. **Token Expiration:**
```typescript
// Add expiry date to patient table
invitation_expires_at: Date

// Check in acceptance page
if (Date.now() > invitation_expires_at) {
  return "Invitation expired"
}
```

2. **Rate Limiting:**
```typescript
// Limit invitations per doctor per day
const dailyLimit = 50
// Check count before sending
```

3. **Email Verification:**
```typescript
// Confirm patient email is valid before accepting
// Send verification code
```

---

## 📊 Monitoring

### Resend Dashboard Metrics

Track in Resend dashboard:
- **Sent** - Total emails sent
- **Delivered** - Successfully delivered
- **Opened** - Email opened (requires tracking pixel)
- **Clicked** - Link clicked
- **Bounced** - Failed to deliver
- **Complained** - Marked as spam

### Application Logging

Check terminal for logs:
```
Failed to send invitation email: [error]
```

Consider adding:
```typescript
// Log successful sends
console.log(`Invitation sent to ${email}`)

// Store email status in database
await supabase.from('patient').update({
  email_sent_at: new Date(),
  email_status: 'sent'
})
```

---

## 🎯 Next Steps

### Implement Patient Acceptance Page

Create: `src/app/patient/accept-invitation/page.tsx`

```typescript
// 1. Validate token from URL
// 2. Show patient form
// 3. Let patient complete profile
// 4. Mark invitation_accepted = true
// 5. Redirect to patient dashboard
```

### Add Email Templates

Consider adding more templates:
- Welcome email after profile completion
- Appointment reminders
- Health report notifications
- Password reset emails

### Enhance Invitation System

**Additional Features:**
- Resend invitation button in UI
- Bulk invite patients (CSV upload)
- Invitation history/log
- Track invitation status
- Cancel invitations

---

## 📝 Email Template Examples

### Current Template Preview

```
╔══════════════════════════════════════╗
║   🏥 Health App Invitation           ║
║   (Gradient Purple Header)           ║
╚══════════════════════════════════════╝

You've been invited!

Hello,

Dr. John Smith has invited you to join 
their patient portal on Health App.

This secure portal will allow you to:
• Complete your health profile
• Communicate with your doctor
• Access your medical information
• Schedule appointments

    [Accept Invitation & Create Profile]

⚠️ Security Notice: This invitation 
link is unique to you. Please do not 
share it with others.

Link: https://app.health.com/patient/...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This invitation was sent by Dr. John Smith
If you didn't expect this, ignore this email
```

---

## 🔄 Update Guide

### Changing Email Content

1. Edit `src/lib/emails/patient-invitation.tsx`
2. Modify JSX content
3. Test locally
4. Deploy changes

### Changing Sender Email (Production)

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add your domain
3. Add DNS records (SPF, DKIM, DMARC)
4. Verify domain
5. Update `RESEND_FROM_EMAIL` in production env

### Changing Email Provider

To use a different provider (SendGrid, AWS SES, etc.):

1. Install new provider SDK
2. Update `src/lib/resend.ts` → `src/lib/email.ts`
3. Update `invitePatient()` function
4. Keep same email template structure

---

## ✅ Setup Complete!

Your email invitation system is now fully functional!

**What's working:**
- ✅ Real emails sent via Resend
- ✅ Beautiful HTML templates
- ✅ Unique invitation links
- ✅ Doctor name personalization
- ✅ Error handling
- ✅ Resend invitation capability

**Test it out:**
1. Go to your dashboard
2. Click "Invite Patient"
3. Enter an email
4. Check your inbox!

---

**Questions?** Check the Resend documentation: https://resend.com/docs

**Last Updated:** November 17, 2024

