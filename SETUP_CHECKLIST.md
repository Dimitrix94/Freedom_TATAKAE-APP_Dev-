# Setup Checklist

Use this checklist to ensure FreeLearning is properly configured.

## ✅ Pre-Installation

- [ ] Node.js installed (v18 or higher)
  - Check: `node --version`
- [ ] npm installed
  - Check: `npm --version`
- [ ] Code editor ready (VS Code recommended)
- [ ] Terminal/Command prompt accessible

## ✅ Supabase Setup

- [ ] Supabase account created at [supabase.com](https://supabase.com)
- [ ] New Supabase project created
- [ ] Project is active (not paused)
- [ ] Project ID copied from Settings → API
- [ ] Anon public key copied from Settings → API
- [ ] Credentials added to `/utils/supabase/info.tsx`

## ✅ Database Configuration

- [ ] Profiles table created
  ```sql
  CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    role TEXT DEFAULT 'student',
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

- [ ] RLS (Row Level Security) enabled
  ```sql
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ```

- [ ] RLS policies created
  - [ ] Public profiles viewable
  - [ ] Users can update own profile
  - [ ] Users can insert own profile

- [ ] Auto-confirm function created
  ```sql
  CREATE OR REPLACE FUNCTION auto_confirm_users()
  RETURNS void AS $$
  BEGIN
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE email_confirmed_at IS NULL;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```

- [ ] Auto-confirm function tested
  ```sql
  SELECT auto_confirm_users();
  ```

## ✅ Local Installation

- [ ] Navigated to project directory
  ```bash
  cd "C:\Users\Huwa Jia Sheng\Downloads\AppDev"
  ```

- [ ] Dependencies installed
  ```bash
  npm install
  ```

- [ ] No installation errors
- [ ] `node_modules` folder created
- [ ] `package-lock.json` created

## ✅ File Structure

- [ ] `/package.json` exists
- [ ] `/vite.config.ts` exists
- [ ] `/tsconfig.json` exists
- [ ] `/index.html` exists
- [ ] `/main.tsx` exists
- [ ] `/App.tsx` exists
- [ ] `/styles/globals.css` exists and has `@import "tailwindcss";`
- [ ] `/utils/supabase/client.tsx` exists
- [ ] `/utils/supabase/info.tsx` exists with your credentials

## ✅ Development Server

- [ ] Dev server starts without errors
  ```bash
  npm run dev
  ```

- [ ] Server running on http://localhost:5173
- [ ] Browser opens to landing page
- [ ] No console errors in browser (F12 to check)

## ✅ Authentication Testing

- [ ] Landing page loads correctly
- [ ] "Get Started" button works
- [ ] Sign Up form accessible
- [ ] Can create teacher account
  - [ ] Email: test-teacher@example.com
  - [ ] Password: test123
  - [ ] Name: Test Teacher
  - [ ] Role: Teacher
- [ ] Teacher automatically logged in after signup
- [ ] Teacher dashboard displays correctly

- [ ] Can log out
- [ ] Can create student account
  - [ ] Email: test-student@example.com
  - [ ] Password: test123
  - [ ] Name: Test Student
  - [ ] Role: Student
- [ ] Student automatically logged in after signup
- [ ] Student dashboard displays correctly

## ✅ Feature Testing

### Teacher Features
- [ ] Can access Teacher Dashboard
- [ ] Materials Manager tab works
- [ ] Assessment Manager tab works
- [ ] Progress Tracker tab works
- [ ] Forum tab works
- [ ] AI Tutor tab works
- [ ] Profile tab works
- [ ] Can create learning material
- [ ] Can create assessment
- [ ] Can edit profile
- [ ] Can upload profile picture

### Student Features
- [ ] Can access Student Dashboard
- [ ] Learning Materials tab works
- [ ] Take Assessment tab works
- [ ] My Results tab works
- [ ] Forum tab works
- [ ] AI Tutor tab works
- [ ] Profile tab works
- [ ] Can view learning materials
- [ ] Can take assessments
- [ ] Can view results
- [ ] Can edit profile
- [ ] Can upload profile picture

## ✅ Password Reset Feature

- [ ] "Forgot password?" link visible on login page
- [ ] Clicking link opens modal
- [ ] Can enter email in modal
- [ ] "Send Reset Email" button works
- [ ] Email settings configured in Supabase
- [ ] Reset email received (check spam folder)
- [ ] Reset link in email works
- [ ] Reset password page loads
- [ ] Can enter new password
- [ ] Password confirmation works
- [ ] Password successfully updated
- [ ] Can log in with new password

## ✅ Production URL Configuration

- [ ] Can access Profile settings
- [ ] "Production URL Configuration" card visible
- [ ] Can enter production URL
- [ ] URL saves successfully
- [ ] Can reset to auto-detect
- [ ] Custom URL indicator shows correctly

## ✅ Optional: Edge Function Setup

- [ ] Edge function deployed to Supabase
- [ ] Function accessible at `/functions/v1/make-server-d59960c4`
- [ ] Function handles routes correctly
- [ ] No CORS errors
- [ ] Check function logs in Supabase dashboard

## ✅ Final Checks

- [ ] No console errors in browser
- [ ] All images load correctly
- [ ] All icons display (Lucide React)
- [ ] Styles apply correctly (Tailwind)
- [ ] Responsive design works (test mobile view)
- [ ] Forms validate inputs
- [ ] Toast notifications appear
- [ ] Navigation works smoothly
- [ ] Can log out and log back in

## 🎯 Production Readiness

When deploying to production, additionally check:

- [ ] Production URL configured in Profile settings
- [ ] Environment variables secured
- [ ] Build command works: `npm run build`
- [ ] Preview works: `npm run preview`
- [ ] No development-only code in production
- [ ] Error handling in place
- [ ] Loading states implemented
- [ ] SEO meta tags added (optional)
- [ ] Analytics configured (optional)

## 📝 Notes

Write any issues or observations here:

```
Issue: 
Solution:

Issue:
Solution:
```

## ✨ Success Criteria

Your setup is complete when:
1. ✅ `npm run dev` starts without errors
2. ✅ App loads at http://localhost:5173
3. ✅ Can create and log in as both teacher and student
4. ✅ All major features work (create materials, assessments, view results)
5. ✅ No errors in browser console
6. ✅ Password reset flow works end-to-end

## 🎉 Congratulations!

If all items are checked, FreeLearning is fully set up and ready to use!

## Next Steps

1. Read `README.md` for full documentation
2. Explore `QUICKSTART.md` for quick reference
3. Check `TROUBLESHOOTING.md` if issues arise
4. Start creating educational content!

---

Setup Date: _______________
Setup By: _______________
Notes: _______________
