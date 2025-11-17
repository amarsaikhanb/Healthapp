# Patient Invitation System Guide

## Overview

The Health App now includes a complete patient invitation system where doctors can invite patients via email. Each patient is linked to one doctor through a foreign key relationship.

---

## 🗄️ Database Schema

### Doctor Table
```sql
public.doctor (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  phone_number TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Patient Table
```sql
public.patient (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone_number TEXT,
  date_of_birth DATE,
  doctor_id UUID NOT NULL REFERENCES doctor(id) ON DELETE CASCADE,
  invitation_token TEXT UNIQUE,
  invitation_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Key Points:**
- `doctor_id` is a **foreign key** to the `doctor` table
- Each patient belongs to **one doctor**
- When a doctor is deleted, their patients are **cascade deleted**
- `invitation_token` is a unique token for the invitation link
- `invitation_accepted` tracks whether the patient has completed their profile

---

## 🔧 Setting Up the Database

### Step 1: Run Migrations in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the migrations in order:

#### First, run `001_create_doctor_table.sql`:
```sql
-- This creates the doctor table with RLS policies
-- Located at: supabase/migrations/001_create_doctor_table.sql
```

#### Then, run `002_create_patient_table.sql`:
```sql
-- This creates the patient table with doctor_id foreign key
-- Located at: supabase/migrations/002_create_patient_table.sql
```

### Step 2: Verify Tables

Run this query to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('doctor', 'patient');
```

---

## 🎯 Features Implemented

### 1. **Doctor Profile Management**
- Doctors can create/update their profile in Settings
- Required fields: Name
- Optional fields: Phone Number

### 2. **Patient Invitation System**
- **Invite Button** appears on the Dashboard header
- Click "Invite Patient" to open a modal
- Enter patient email and send invitation
- System generates a unique invitation token

### 3. **Server Actions**
All operations use Next.js Server Actions for security:

**Doctor Actions** (`src/app/actions/doctor.ts`):
- `getDoctorProfile()` - Fetch doctor profile
- `upsertDoctorProfile()` - Create/update profile
- `deleteDoctorProfile()` - Delete profile

**Patient Actions** (`src/app/actions/patient.ts`):
- `invitePatient(email)` - Send invitation
- `getPatients()` - Get all patients for doctor
- `deletePatient(id)` - Remove patient
- `resendInvitation(id)` - Resend invitation

---

## 🚀 Usage Guide

### For Doctors

#### 1. **Complete Your Profile**
```
1. Go to Settings
2. Fill in your name (required)
3. Add phone number (optional)
4. Click "Save Profile"
```

#### 2. **Invite a Patient**
```
1. Go to Dashboard
2. Click "Invite Patient" button (top right)
3. Enter patient email
4. Click "Send Invitation"
```

#### 3. **Manage Patients**
```
- View all patients in your patient list
- Resend invitations if needed
- Delete patient records
```

---

## 🏗️ Component Structure

### New Components

**1. Dashboard Header** (`src/components/dashboard-header.tsx`)
- Reusable header component
- Optional "Invite Patient" button
- Used across all dashboard pages

**2. Invite Patient Dialog** (`src/components/invite-patient-dialog.tsx`)
- Modal dialog for inviting patients
- Email validation
- Success/error feedback
- Uses Radix UI Dialog

**3. Doctor Profile Form** (`src/components/doctor-profile-form.tsx`)
- Form for editing doctor profile
- Client component with server actions
- Real-time validation

**4. Dialog UI Component** (`src/components/ui/dialog.tsx`)
- Shadcn UI Dialog component
- Accessible modal implementation
- Animated transitions

---

## 🔐 Security Features

### Row Level Security (RLS)

**Doctor Table:**
- Doctors can only view/edit their own profile
- User ID from auth matches doctor ID

**Patient Table:**
- Doctors can only access their own patients
- Filtered by `doctor_id = auth.uid()`
- Patients can view their own record
- Cascade delete when doctor is removed

### Validation

**Server-Side:**
- Email format validation
- Phone number format validation
- Name length validation
- Duplicate email check per doctor

**Client-Side:**
- Required field validation
- Email input type
- Loading states during submission
- Error message display

---

## 📝 Data Flow

### Inviting a Patient

```
1. Doctor clicks "Invite Patient"
   └─> Opens modal dialog

2. Doctor enters email
   └─> Client validation

3. Form submitted
   └─> invitePatient() server action
       └─> Validates email
       └─> Checks for duplicates
       └─> Generates invitation token
       └─> Creates patient record with doctor_id
       └─> Returns success/error

4. UI updates
   └─> Success message shown
   └─> Modal closes after 2 seconds
   └─> Dashboard revalidated
```

### Creating/Updating Doctor Profile

```
1. Doctor fills form in Settings
   └─> Client validation

2. Form submitted
   └─> upsertDoctorProfile() server action
       └─> Validates input
       └─> Upserts with user ID as primary key
       └─> Revalidates settings page
       └─> Returns success/error

3. UI updates
   └─> Success message shown
   └─> Form stays populated with data
```

---

## 🔄 Next Steps / TODO

### Email Integration
Currently, the invitation system creates records but doesn't send actual emails. To complete this:

1. **Set up email provider** (e.g., Resend, SendGrid, AWS SES)
2. **Create email template** for patient invitations
3. **Add email sending** to `invitePatient()` function
4. **Include invitation link** with token

Example invitation link:
```
https://yourapp.com/patient/accept-invitation?token={invitation_token}
```

### Patient Acceptance Flow
Create pages for patients to:
1. Click invitation link
2. View invitation details
3. Fill out their profile
4. Mark `invitation_accepted = true`

### Patient List Page
Create a page to display all patients:
- Table view of all invited patients
- Status (invited/accepted)
- Actions (resend, delete)
- Search and filter

---

## 🧪 Testing

### Manual Testing Steps

1. **Test Doctor Profile:**
   ```
   - Create profile in Settings
   - Verify data saves
   - Update profile
   - Verify updates persist
   ```

2. **Test Patient Invitation:**
   ```
   - Invite patient with valid email
   - Check database for patient record
   - Verify doctor_id matches your user ID
   - Try inviting same email again (should fail)
   - Try invalid email format (should fail)
   ```

3. **Test RLS Policies:**
   ```
   - Create patient as Doctor A
   - Login as Doctor B
   - Verify Doctor B cannot see Doctor A's patients
   ```

---

## 📊 Database Queries

### Useful Queries for Testing

**Get all patients for a doctor:**
```sql
SELECT * FROM patient 
WHERE doctor_id = 'your-user-id'
ORDER BY created_at DESC;
```

**Get doctor with patient count:**
```sql
SELECT 
  d.*,
  COUNT(p.id) as patient_count
FROM doctor d
LEFT JOIN patient p ON p.doctor_id = d.id
GROUP BY d.id;
```

**Get pending invitations:**
```sql
SELECT * FROM patient 
WHERE invitation_accepted = false
AND doctor_id = 'your-user-id';
```

---

## 🛠️ File Reference

### Server Actions
- `src/app/actions/doctor.ts` - Doctor profile CRUD
- `src/app/actions/patient.ts` - Patient invitation and management

### Components
- `src/components/dashboard-header.tsx` - Page header with invite button
- `src/components/invite-patient-dialog.tsx` - Invitation modal
- `src/components/doctor-profile-form.tsx` - Doctor profile form
- `src/components/ui/dialog.tsx` - Shadcn Dialog component

### Database
- `supabase/migrations/001_create_doctor_table.sql` - Doctor table
- `supabase/migrations/002_create_patient_table.sql` - Patient table

### Pages
- `src/app/dashboard/page.tsx` - Dashboard with invite button
- `src/app/dashboard/settings/page.tsx` - Settings with doctor profile

---

## 💡 Tips

1. **Always complete your doctor profile** before inviting patients
2. **Invitation tokens are unique** - each patient gets a unique token
3. **Use lowercase emails** - stored as lowercase for consistency
4. **Check invitation status** - `invitation_accepted` field tracks completion
5. **Cascade deletes** - Deleting a doctor removes their patients

---

## 🐛 Troubleshooting

### "Not authenticated" error
- Ensure you're logged in
- Check middleware is working
- Verify JWT token is valid

### "Patient already exists" error
- Check if patient with that email already exists for your doctor_id
- Use different email or delete existing patient

### RLS Policy Errors
- Verify policies are enabled on both tables
- Check that auth.uid() matches your user ID
- Ensure you're logged in as a doctor

### Foreign Key Violation
- Ensure doctor profile exists before inviting patients
- Check doctor_id in patient table matches existing doctor.id

---

## 📚 Additional Resources

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Radix UI Dialog](https://www.radix-ui.com/docs/primitives/components/dialog)

---

**Last Updated:** November 17, 2024

