# Troubleshooting Guide

Common issues and solutions for FreeLearning.

## "npm run dev" Issues

### Error: Missing script: "dev"

**Problem**: The package.json file is missing or doesn't have the dev script.

**Solution**: 
1. Make sure `package.json` exists in your project root
2. Run `npm install` to ensure all dependencies are installed
3. Verify package.json has this in the scripts section:
   ```json
   "scripts": {
     "dev": "vite"
   }
   ```

### Error: 'vite' is not recognized

**Problem**: Vite is not installed.

**Solution**: 
```bash
npm install
```

If that doesn't work:
```bash
npm install vite --save-dev
```

### Error: Cannot find module 'react'

**Problem**: Dependencies are not installed.

**Solution**: 
```bash
npm install
```

### Port 5173 already in use

**Problem**: Another process is using port 5173.

**Solution 1** - Kill the existing process:
- Windows: 
  ```bash
  netstat -ano | findstr :5173
  taskkill /PID <PID> /F
  ```
- Mac/Linux:
  ```bash
  lsof -ti:5173 | xargs kill -9
  ```

**Solution 2** - Use a different port by editing `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 3000, // Change to any available port
  }
});
```

## Supabase Connection Issues

### Error: Invalid API key

**Problem**: Supabase credentials are incorrect.

**Solution**:
1. Check `/utils/supabase/info.tsx`
2. Verify your credentials at supabase.com → Your Project → Settings → API
3. Make sure you're using the `anon` `public` key, not the `service_role` key

### Error: Failed to fetch

**Problem**: Can't connect to Supabase.

**Solution**:
1. Check your internet connection
2. Verify your Supabase project is active (not paused)
3. Check the project URL format: `https://[project-id].supabase.co`

### Email not confirmed error

**Problem**: Users can't log in due to unconfirmed emails.

**Solution**:
Run this SQL in Supabase SQL Editor:
```sql
CREATE OR REPLACE FUNCTION auto_confirm_users()
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE email_confirmed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Then run the function
SELECT auto_confirm_users();
```

## Build Issues

### TypeScript errors during build

**Problem**: TypeScript compilation errors.

**Solution**:
1. Check for any `.tsx` or `.ts` files with errors
2. Run `npm run build` to see detailed error messages
3. Fix type errors in the indicated files

### Missing dependencies

**Problem**: Import errors for missing packages.

**Solution**:
```bash
npm install
```

For specific missing packages:
```bash
npm install [package-name]
```

## Runtime Errors

### "Module not found: Can't resolve '...'"

**Problem**: Import path is incorrect or module is missing.

**Solution**:
1. Check the import path
2. Make sure the file exists
3. Restart the dev server:
   ```bash
   # Stop with Ctrl+C, then
   npm run dev
   ```

### White screen / Blank page

**Problem**: JavaScript error preventing render.

**Solution**:
1. Open browser console (F12)
2. Look for error messages
3. Check that `/main.tsx` imports `/App.tsx` correctly
4. Verify `/index.html` references `/main.tsx`

### Styles not loading

**Problem**: Tailwind CSS not working.

**Solution**:
1. Check that `/styles/globals.css` has `@import "tailwindcss";` at the top
2. Verify `main.tsx` imports the CSS:
   ```typescript
   import './styles/globals.css';
   ```
3. Restart the dev server

## Password Reset Issues

### Reset emails not sending

**Problem**: Supabase email configuration.

**Solution**:
1. In Supabase dashboard, go to Authentication → Email Templates
2. Configure your email provider (or use Supabase's built-in for testing)
3. Make sure "Confirm email" is disabled if using auto-confirm

### Reset link goes to localhost in production

**Problem**: Production URL not configured.

**Solution**:
1. Log in as any user
2. Go to Profile → Production URL Configuration
3. Set your production URL (e.g., `https://yourapp.com`)
4. Click "Save URL"

## Database Issues

### RLS policy errors

**Problem**: Can't read/write data due to Row Level Security.

**Solution**:
Run this SQL to reset policies:
```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recreate policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

### Table doesn't exist

**Problem**: Database tables not created.

**Solution**:
Follow the setup in `SUPABASE_SETUP.md` to create all required tables.

## Performance Issues

### Slow page loads

**Problem**: Development mode is slower than production.

**Solution**:
This is normal in development. For production:
```bash
npm run build
npm run preview
```

### Hot reload not working

**Problem**: Changes don't show up automatically.

**Solution**:
1. Check that files are saved
2. Restart dev server
3. Clear browser cache (Ctrl+Shift+R)

## Browser Issues

### Different behavior in different browsers

**Problem**: Browser compatibility.

**Solution**:
- Use a modern browser (Chrome, Firefox, Edge, Safari - latest versions)
- Clear cache and cookies
- Try in incognito/private mode

### CORS errors

**Problem**: Cross-Origin Resource Sharing errors.

**Solution**:
1. This shouldn't happen in development
2. Check Supabase CORS settings if using custom domains
3. Verify your Supabase URL is correct

## Still Having Issues?

1. **Check Console**: Open browser console (F12) and look for errors
2. **Check Network Tab**: See if API calls are failing
3. **Check Supabase Logs**: Go to your Supabase dashboard → Logs
4. **Clear Everything**:
   ```bash
   # Delete node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Clear browser cache
   # In browser: Ctrl+Shift+Delete
   ```

5. **Restart Everything**:
   - Close terminal
   - Close browser
   - Restart dev server
   - Open fresh browser window

## Quick Diagnostic Commands

Run these to check your setup:

```bash
# Check Node version (should be 18+)
node --version

# Check npm version
npm --version

# Check if package.json exists
ls package.json

# Check if node_modules exists
ls node_modules

# List all npm scripts
npm run

# Check for errors in package.json
npm install --dry-run
```

## Getting More Help

If you're still stuck:

1. Read the full documentation in `README.md`
2. Check `SUPABASE_SETUP.md` for backend issues
3. Review `DEBUG_AUTH.md` for authentication problems
4. Look at the error message carefully - it often tells you exactly what's wrong
5. Search for the error message online

Remember: Most issues can be fixed by:
1. Running `npm install`
2. Restarting the dev server
3. Checking Supabase credentials
4. Clearing browser cache
