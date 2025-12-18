# Quick Start Guide

Get FreeLearning running locally in just a few steps!

## Step 1: Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all required packages (React, Vite, Tailwind, Supabase, etc.)

## Step 2: Configure Supabase (Required)

You need to set up your Supabase project:

### Option A: Use Existing Supabase Project

If you already have the Supabase project set up:

1. Open `/utils/supabase/info.tsx`
2. Ensure your credentials are correct:

```typescript
export const projectId = 'your-project-id';
export const publicAnonKey = 'your-anon-key';
```

### Option B: Create New Supabase Project

If starting fresh:

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Copy your project URL and anon key from Settings → API
4. Update `/utils/supabase/info.tsx` with your credentials
5. Follow the SQL setup in `SUPABASE_SETUP.md`

## Step 3: Run the Development Server

```bash
npm run dev
```

You should see:

```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## Step 4: Open the App

Open your browser and go to: `http://localhost:5173`

You should see the FreeLearning landing page!

## Step 5: Create an Account

1. Click "Get Started" or "Sign In"
2. Go to the "Sign Up" tab
3. Enter your details:
   - Full Name
   - Email
   - Password (min 6 characters)
   - Role (Teacher or Student)
4. Click "Create Account"
5. You'll be automatically logged in!

## Common Issues

### Issue: "npm run dev" fails

**Solution**: Make sure you ran `npm install` first

### Issue: Can't connect to Supabase

**Solution**: 
- Check `/utils/supabase/info.tsx` has correct credentials
- Verify your Supabase project is active
- Check your internet connection

### Issue: "Email not confirmed" error when logging in

**Solution**: 
- See `SUPABASE_SETUP.md` for the auto-confirm SQL script
- Or use the SetupHelper in the app (appears after 2 failed logins)

### Issue: Port 5173 is already in use

**Solution**: Either:
- Stop the other process using port 5173
- Or change the port in `vite.config.ts`:

```typescript
server: {
  port: 3000, // Change to any available port
  host: true,
},
```

## Next Steps

### As a Teacher:
- Create learning materials
- Set up assessments
- Configure production URL for password resets (Profile → Production URL Configuration)

### As a Student:
- Browse learning materials
- Take assessments
- Try the AI Tutor
- View your progress

## Building for Production

When ready to deploy:

```bash
npm run build
```

This creates a `dist` folder with optimized production files.

## Need Help?

Check these documentation files:
- `README.md` - Full documentation
- `SUPABASE_SETUP.md` - Database setup
- `DEBUG_AUTH.md` - Authentication issues

Happy Learning! 🎓
