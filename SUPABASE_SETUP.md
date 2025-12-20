# Supabase Setup Guide for FreeLearning

## 🔥 URGENT: Fix Progress Table Schema Error

If you're seeing the error **"Could not find the 'assessment_type' column of 'progress' in the schema cache"**, you need to add the missing column:

### Run this SQL NOW in Supabase SQL Editor:

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **"New Query"**
3. **Copy and paste this SQL:**

```sql
-- Add assessment_type column if it doesn't exist
ALTER TABLE progress 
ADD COLUMN IF NOT EXISTS assessment_type TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'progress';
```

4. Click **"Run"** or press `Ctrl+Enter`
5. You should see the list of all columns including `assessment_type`

**After running this, try adding progress records again - it should work!**

---

## 🚨 CRITICAL FIX: Email Not Confirmed Error

If you're seeing "Email not confirmed" or "Invalid login credentials" errors, you MUST complete ALL steps below:

### Step 1: Disable Email Confirmation (REQUIRED)

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/tkrcwkgtgmlispkvnftd

2. **Navigate to Authentication Settings**:
   - Click on **"Authentication"** in the left sidebar
   - Click on **"Providers"**
   - Click on **"Email"** provider

3. **Disable Email Confirmation**:
   - Scroll down to find **"Confirm email"** toggle
   - **Turn OFF** the "Confirm email" option
   - Click **"Save"**

### Step 2: Fix ALL Existing Users (CRITICAL - RUN THIS SQL NOW!)

**This is the most important step!** Even after disabling email confirmation, ALL users who signed up before the change will still have unconfirmed emails and CANNOT log in.

**To fix ALL existing users at once:**

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **"New Query"**
3. **Copy and paste this EXACT SQL script:**

```sql
-- THIS FIXES ALL USERS AT ONCE
-- Confirms ALL existing unconfirmed users
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

4. Click **"Run"** or press `Ctrl+Enter`
5. You should see: "Success. X rows affected" (where X = number of unconfirmed users)

**⚠️ IMPORTANT:** Run this SQL EVERY TIME someone gets "Email not confirmed" errors!

### Step 3: Verify the Fix

After completing Steps 1 and 2:

1. ✅ Try logging in with an existing account (should work now)
2. ✅ Try creating a NEW account (should work immediately without confirmation)
3. ✅ No more "Email not confirmed" or "Invalid login credentials" errors

---

## Database Setup (Required)

You need to create the necessary tables in your Supabase database:

### Run this SQL in the SQL Editor:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  role TEXT CHECK (role IN ('student', 'teacher')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read all profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create progress table for tracking student progress
CREATE TABLE IF NOT EXISTS progress (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  assessment_type TEXT,
  score INTEGER,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on progress table
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Progress policies
CREATE POLICY "Students can view their own progress"
  ON progress FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all progress"
  ON progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can insert progress"
  ON progress FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update progress"
  ON progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can delete progress"
  ON progress FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- Create content table for page content management
CREATE TABLE IF NOT EXISTS content (
  id BIGSERIAL PRIMARY KEY,
  page TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on content table
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Content policies (everyone can read, only teachers can write)
CREATE POLICY "Anyone can view content"
  ON content FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage content"
  ON content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- Create classes table for class management
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on classes table
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Classes policies
CREATE POLICY "Teachers can view their own classes"
  ON classes FOR SELECT
  USING (
    auth.uid() = teacher_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can create classes"
  ON classes FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update their own classes"
  ON classes FOR UPDATE
  USING (
    auth.uid() = teacher_id
  );

CREATE POLICY "Teachers can delete their own classes"
  ON classes FOR DELETE
  USING (
    auth.uid() = teacher_id
  );

-- Create class_assignments table for assigning students to classes
CREATE TABLE IF NOT EXISTS class_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- Enable RLS on class_assignments table
ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;

-- Class assignments policies
CREATE POLICY "Teachers can view class assignments"
  ON class_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = class_assignments.class_id
      AND classes.teacher_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Students can view their own class assignments"
  ON class_assignments FOR SELECT
  USING (
    auth.uid() = student_id
  );

CREATE POLICY "Teachers can create class assignments"
  ON class_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = class_assignments.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete class assignments"
  ON class_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = class_assignments.class_id
      AND classes.teacher_id = auth.uid()
    )
  );
```

---

## Edge Function Deployment (If Using)

If you're using the Edge Function and getting 403 errors:

1. Make sure you have the correct permissions in your Supabase project
2. The edge function should auto-deploy through Figma Make
3. If it fails, the app will still work using direct Supabase client calls

---

## Testing Your Setup

After completing all steps:

1. ✅ Try creating a new account (should work immediately)
2. ✅ Try logging in with an existing account (should work after SQL fix)
3. ✅ Verify no "Email not confirmed" errors appear

If you still see issues, check the browser console for detailed error messages.