# Database Setup Instructions

## Quick Start - Setting Up Your Supabase Database

Follow these steps to set up the database tables for the Health App.

---

## 📋 Prerequisites

- Supabase account (free tier works!)
- Supabase project created
- Environment variables configured in `.env.local`

---

## 🚀 Step-by-Step Setup

### Step 1: Access SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on **SQL Editor** in the left sidebar (icon looks like `</>`)

### Step 2: Create Doctor Table

1. Click **"New Query"** in SQL Editor
2. Copy and paste the entire contents of `supabase/migrations/001_create_doctor_table.sql`
3. Click **"Run"** or press `Ctrl+Enter` / `Cmd+Enter`
4. You should see: `Success. No rows returned`

**What this creates:**
- `doctor` table with columns: id, name, phone_number, created_at, updated_at
- Row Level Security (RLS) policies
- Automatic timestamp updates
- Comments on table and columns

### Step 3: Create Patient Table

1. Click **"New Query"** again
2. Copy and paste the entire contents of `supabase/migrations/002_create_patient_table.sql`
3. Click **"Run"**
4. You should see: `Success. No rows returned`

**What this creates:**
- `patient` table with foreign key to `doctor`
- Columns: id, email, name, phone_number, date_of_birth, doctor_id, invitation_token, invitation_accepted
- RLS policies for patient access
- Indexes for performance
- Cascade delete (when doctor is deleted, patients are deleted)

### Step 4: Verify Tables

Run this query to verify both tables were created:

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('doctor', 'patient')
ORDER BY table_name;
```

You should see:
```
doctor    | 5
patient   | 10
```

---

## 🔍 Verify Setup

### Check Table Structure

**Doctor Table:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'doctor'
ORDER BY ordinal_position;
```

**Patient Table:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'patient'
ORDER BY ordinal_position;
```

### Check RLS Policies

```sql
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('doctor', 'patient')
ORDER BY tablename, policyname;
```

You should see policies for both tables.

### Check Foreign Key Constraint

```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'patient';
```

Should show: `patient.doctor_id -> doctor.id`

---

## 🧪 Test Your Setup

### Test 1: Create a Doctor Profile

After logging into your app:
1. Go to **Settings**
2. Fill in your name
3. Click **"Save Profile"**

Verify in Supabase:
```sql
SELECT * FROM doctor;
```

### Test 2: Invite a Patient

1. Go to **Dashboard**
2. Click **"Invite Patient"**
3. Enter an email address
4. Click **"Send Invitation"**

Verify in Supabase:
```sql
SELECT * FROM patient;
```

You should see:
- The patient record
- `doctor_id` matches your user ID
- `invitation_token` is populated
- `invitation_accepted` is `false`

### Test 3: Test RLS

Create a second account and try to:
1. View the first doctor's patients (should see nothing)
2. Create your own doctor profile
3. Invite a patient (should only see your own)

---

## 🗂️ Migration Files

The migration files are located in:
```
supabase/migrations/
├── 001_create_doctor_table.sql
└── 002_create_patient_table.sql
```

**Important:** Run migrations in order (001 before 002) because:
- Patient table depends on Doctor table (foreign key)
- Must create parent table first

---

## 🔒 Security Features

### Row Level Security (RLS)

Both tables have RLS enabled with policies:

**Doctor Table Policies:**
- `Users can view own doctor profile` - SELECT
- `Users can insert own doctor profile` - INSERT  
- `Users can update own doctor profile` - UPDATE
- `Users can delete own doctor profile` - DELETE

**Patient Table Policies:**
- `Doctors can view their patients` - SELECT (where doctor_id = auth.uid())
- `Doctors can invite patients` - INSERT
- `Doctors can update their patients` - UPDATE
- `Doctors can delete their patients` - DELETE
- `Patients can view own record` - SELECT (where id = auth.uid())
- `Patients can update own record` - UPDATE

### What This Means

✅ Doctors can only see and manage their own patients  
✅ Patients can only see their own data  
✅ User authentication required for all operations  
✅ Database-level security (can't be bypassed)

---

## 📊 Table Relationships

```
┌─────────────────┐
│     doctor      │
│─────────────────│
│ id (PK)         │◄──┐
│ name            │   │
│ phone_number    │   │
│ created_at      │   │
│ updated_at      │   │
└─────────────────┘   │
                      │
                      │ Foreign Key
                      │ ON DELETE CASCADE
                      │
┌─────────────────┐   │
│     patient     │   │
│─────────────────│   │
│ id (PK)         │   │
│ email (UNIQUE)  │   │
│ name            │   │
│ phone_number    │   │
│ date_of_birth   │   │
│ doctor_id (FK)  │───┘
│ invitation_token│
│ invitation_acc..│
│ created_at      │
│ updated_at      │
└─────────────────┘
```

**Relationship:**
- One doctor → Many patients
- Each patient → One doctor
- CASCADE DELETE enabled

---

## 🛠️ Useful Database Commands

### Clear All Data (for testing)

```sql
-- Delete all patients
DELETE FROM patient;

-- Delete all doctors
DELETE FROM doctor;

-- Or use TRUNCATE (faster, but be careful!)
TRUNCATE patient CASCADE;
TRUNCATE doctor CASCADE;
```

### View All Data

```sql
-- All doctors with patient count
SELECT 
  d.id,
  d.name,
  d.phone_number,
  COUNT(p.id) as patient_count
FROM doctor d
LEFT JOIN patient p ON p.doctor_id = d.id
GROUP BY d.id, d.name, d.phone_number;

-- All patients with doctor info
SELECT 
  p.email,
  p.name as patient_name,
  p.invitation_accepted,
  d.name as doctor_name
FROM patient p
JOIN doctor d ON d.id = p.doctor_id
ORDER BY p.created_at DESC;
```

### Check Invitation Status

```sql
-- Pending invitations
SELECT email, created_at
FROM patient
WHERE invitation_accepted = false;

-- Accepted invitations
SELECT email, name, created_at
FROM patient
WHERE invitation_accepted = true;
```

---

## 🐛 Common Issues

### Issue: "relation doctor does not exist"
**Solution:** Run migration 001 first (create doctor table)

### Issue: "violates foreign key constraint"
**Solution:** Ensure doctor record exists before creating patient

### Issue: "permission denied for table doctor"
**Solution:** RLS policies not set up correctly. Re-run migration.

### Issue: "duplicate key value violates unique constraint"
**Solution:** 
- For doctor: User ID already has a profile
- For patient: Email already exists for this doctor

---

## 🔄 Updating Migrations

If you need to modify the schema:

1. **Don't edit existing migration files** (already run)
2. **Create a new migration file:** `003_your_change.sql`
3. Run it in SQL Editor
4. Document the change

Example:
```sql
-- 003_add_patient_address.sql
ALTER TABLE patient 
ADD COLUMN address TEXT;

COMMENT ON COLUMN patient.address IS 'Patient residential address';
```

---

## ✅ Setup Checklist

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] SQL Editor accessed
- [ ] Migration 001 executed (doctor table)
- [ ] Migration 002 executed (patient table)
- [ ] Tables verified in database
- [ ] RLS policies verified
- [ ] Test: Created doctor profile
- [ ] Test: Invited a patient
- [ ] Test: Verified data in Supabase

---

## 📚 Next Steps

After setup:
1. ✅ Create your doctor profile in the app
2. ✅ Test inviting a patient
3. ✅ Verify data appears correctly
4. 📖 Read `PATIENT_INVITATION_GUIDE.md` for usage details

---

## 🆘 Need Help?

If you encounter issues:
1. Check Supabase logs (Logs section in dashboard)
2. Verify RLS policies are enabled
3. Check that you're authenticated
4. Review error messages in browser console
5. Ensure migrations ran successfully

---

**Setup Complete!** 🎉

Your database is now ready for the Health App patient invitation system.

