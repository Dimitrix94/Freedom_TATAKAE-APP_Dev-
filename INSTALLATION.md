# Installation & Setup Instructions

Follow these steps to get FreeLearning running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- A **Supabase account** - [Sign up here](https://supabase.com)
- A code editor (VS Code recommended)

## Step-by-Step Installation

### 1. Navigate to Your Project Directory

Open your terminal/command prompt and navigate to your project folder:

```bash
cd "C:\Users\Huwa Jia Sheng\Downloads\AppDev"
```

### 2. Install Dependencies

Run the following command to install all required packages:

```bash
npm install
```

This will install:
- React 18
- TypeScript
- Vite (build tool)
- Tailwind CSS v4
- Supabase client
- All UI components (Radix UI)
- Icons (Lucide React)
- And many more dependencies

**Note**: This may take a few minutes depending on your internet speed.

### 3. Configure Supabase

#### 3a. Check Your Supabase Configuration

Open the file `/utils/supabase/info.tsx` and verify your credentials:

```typescript
export const projectId = 'your-project-id';
export const publicAnonKey = 'your-anon-key';
```

#### 3b. If You Need to Set Up Supabase

If you haven't set up Supabase yet:

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in the details:
   - Project name: FreeLearning (or any name)
   - Database password: (create a strong password)
   - Region: (choose closest to your location)
5. Wait for the project to finish setting up (1-2 minutes)
6. Go to Settings → API
7. Copy your:
   - Project URL (the part after `https://` and before `.supabase.co`)
   - `anon` `public` key
8. Update `/utils/supabase/info.tsx` with these values

### 4. Set Up the Database

Follow the instructions in `SUPABASE_SETUP.md` to:
- Create the profiles table
- Set up Row Level Security (RLS) policies
- Create the auto-confirm function
- Deploy the edge function

Or run this simplified SQL in your Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT DEFAULT 'student',
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read all profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-confirm users function
CREATE OR REPLACE FUNCTION auto_confirm_users()
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE email_confirmed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5. Start the Development Server

Now you're ready to run the app!

```bash
npm run dev
```

You should see output like:

```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### 6. Open the Application

Open your web browser and go to:

```
http://localhost:5173
```

You should see the FreeLearning landing page!

## Verify Installation

To verify everything is working:

1. **Check the Landing Page**: You should see the FreeLearning homepage with:
   - Logo and branding
   - "Get Started" button
   - About section

2. **Test Sign Up**:
   - Click "Get Started"
   - Click "Sign Up" tab
   - Fill in the form
   - Click "Create Account"
   - You should be logged in automatically

3. **Check the Dashboard**:
   - As a teacher: You'll see the Teacher Dashboard with tabs for Materials, Assessments, Progress, Forum, AI Tutor, and Profile
   - As a student: You'll see the Student Dashboard with Learning Materials, Take Assessment, My Results, Forum, AI Tutor, and Profile

## Common Installation Issues

### Issue: "npm is not recognized"

**Solution**: Node.js is not installed or not in PATH. Download and install Node.js from [nodejs.org](https://nodejs.org/)

### Issue: "EACCES: permission denied"

**Solution**: On Mac/Linux, try:
```bash
sudo npm install
```

Or fix npm permissions: [https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)

### Issue: Installation is very slow

**Solution**: 
- Check your internet connection
- Try using a different npm registry:
  ```bash
  npm config set registry https://registry.npmjs.org/
  ```

### Issue: "Module not found" errors

**Solution**: Delete `node_modules` and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 5173 is already in use

**Solution**: Either:
- Stop the other process using that port
- Or change the port in `vite.config.ts`:
  ```typescript
  server: {
    port: 3000, // Use any available port
  }
  ```

### Issue: TypeScript errors

**Solution**: Make sure TypeScript is installed:
```bash
npm install -D typescript
```

## Next Steps

After successful installation:

1. **Read the Documentation**:
   - `README.md` - Complete project documentation
   - `QUICKSTART.md` - Quick start guide
   - `SUPABASE_SETUP.md` - Backend setup details

2. **Configure Production URL**:
   - Log in as a teacher
   - Go to Profile settings
   - Set your production URL in "Production URL Configuration"

3. **Start Creating Content**:
   - Teachers: Create learning materials and assessments
   - Students: Start learning!

## Getting Help

If you encounter issues:

1. Check the documentation files in the project
2. Review the console for error messages
3. Check Supabase dashboard for backend errors
4. Ensure all environment variables are set correctly

## Production Deployment

When ready to deploy:

```bash
npm run build
```

This creates a `dist` folder ready for deployment to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

See your hosting provider's documentation for specific deployment steps.

---

Congratulations! FreeLearning is now installed and ready to use! 🎉
