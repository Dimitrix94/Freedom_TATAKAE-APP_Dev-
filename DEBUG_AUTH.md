# Debug Authentication Issues

## Check Current Auth Status

Run these SQL queries in your Supabase SQL Editor to diagnose the problem:

### 1. Check if users exist and their confirmation status:

```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;
```

**What to look for:**
- If `email_confirmed_at` is `NULL`, that user CANNOT log in
- This is why you see "Invalid login credentials"

### 2. Check how many unconfirmed users you have:

```sql
SELECT COUNT(*) as unconfirmed_users
FROM auth.users
WHERE email_confirmed_at IS NULL;
```

### 3. FIX ALL UNCONFIRMED USERS (Run this to fix the issue):

```sql
-- THIS IS THE FIX - RUN THIS NOW
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

### 4. Verify the fix worked:

```sql
-- After running the fix, this should return 0
SELECT COUNT(*) as unconfirmed_users
FROM auth.users
WHERE email_confirmed_at IS NULL;
```

---

## Still Having Issues?

### Option 1: Reset a specific user's password

If you know the email that's having trouble:

```sql
-- Replace 'user@example.com' with the actual email
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email = 'user@example.com';
```

### Option 2: Check if email confirmation is still enabled

1. Go to: https://supabase.com/dashboard/project/tkrcwkgtgmlispkvnftd/auth/providers
2. Click on "Email"
3. Make sure "Confirm email" is **OFF** (disabled)
4. Click Save

### Option 3: Delete problematic test accounts and start fresh

**⚠️ WARNING: This deletes user accounts!**

```sql
-- Delete a specific test user
DELETE FROM auth.users WHERE email = 'test@example.com';

-- Or delete ALL users (only do this if you're testing!)
-- DELETE FROM auth.users;
```

After deleting, create a NEW account with Sign Up.

---

## Common Scenarios

### Scenario 1: "Invalid login credentials" but password is correct
**Cause:** User exists but `email_confirmed_at` is NULL  
**Fix:** Run the UPDATE query in step 3 above

### Scenario 2: Can't sign up new users
**Cause:** Email confirmation still enabled in Supabase  
**Fix:** Disable it in Authentication → Providers → Email

### Scenario 3: "For security purposes, you can only request this after X seconds"
**Cause:** Rate limiting from too many attempts  
**Fix:** Wait 60 seconds, then try again

---

## Quick Test

After running the fixes:

1. ✅ Create a NEW account with a NEW email (should work instantly)
2. ✅ Log in with that new account (should work)
3. ✅ Log in with OLD accounts (should now work after SQL fix)
