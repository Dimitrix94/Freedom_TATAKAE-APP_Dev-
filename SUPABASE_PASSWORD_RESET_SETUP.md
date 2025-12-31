# Supabase Password Reset Configuration

## ⚠️ Important Setup Required

To ensure password reset links work correctly, you need to configure your Supabase project settings.

### Step 1: Configure Redirect URLs in Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Add your site URL to **Site URL**: `https://your-app-url.com` (or `http://localhost:5173` for local dev)
5. Add your site URL to **Redirect URLs**: 
   - `https://your-app-url.com`
   - `https://your-app-url.com/**` (to allow all paths)
   - For local development: `http://localhost:5173` and `http://localhost:5173/**`

### Step 2: Configure Email Templates (Optional but Recommended)

1. Go to **Authentication** → **Email Templates**
2. Select **Reset Password** template
3. Ensure the template includes: `{{ .ConfirmationURL }}`
4. The default template should work, but you can customize the message

### Step 3: Test the Flow

1. Request a password reset from the login page OR profile page
2. Check the console logs for:
   ```
   ✅ Password reset email sent successfully to: user@example.com
   ```
3. Check your email (including spam folder)
4. Click the reset link
5. Console should show:
   ```
   ✅ Recovery keyword detected in hash
   === ResetPasswordPage MOUNTED ===
   ✅ Reset link is valid
   ```
6. Enter new password
7. Console should show:
   ```
   ✅ Password updated successfully!
   ```

## 🆕 NEW FEATURES

### Password Strength Indicator
- ✅ Real-time password strength visualization
- ✅ Color-coded strength bar (Weak → Fair → Good → Strong)
- ✅ 5 security criteria checklist:
  - At least 8 characters
  - One lowercase letter
  - One uppercase letter
  - One number
  - One special character (!@#$%...)
- ✅ Works in both Profile Editor and Reset Password pages

### Reset from Profile Page
- ✅ Users can now request password reset while logged in
- ✅ Fresh reset link sent every time (invalidates previous links)
- ✅ Works seamlessly even after recent password change
- ✅ Proper session management and token exchange

## Troubleshooting

### "Your password reset link has expired or is invalid"

**Possible Causes:**
1. **Redirect URL not configured** - Make sure your app URL is added to Supabase redirect URLs
2. **Link expired** - Reset links expire after 1 hour by default
3. **Link already used** - Each reset link can only be used once
4. **Browser cache** - Try in incognito mode
5. **Session conflict** - Trying to use old link after requesting new one

**Solutions:**
- Request a new reset link (each request generates a fresh link)
- Verify redirect URLs are configured correctly
- Use the link within 1 hour of receiving it
- Clear browser cache/cookies or use incognito mode
- Always use the most recent reset link

### Reset Failed in Same Session

**Issue Fixed!** Previously, requesting a password reset from the profile page immediately after changing password would fail.

**Solution Implemented:**
- Proper session token exchange in ResetPasswordPage
- Updated redirect URL to use origin only (Supabase adds the hash)
- Session verification before password update
- Comprehensive error handling and logging

### No Email Received

**Possible Causes:**
1. Email in spam folder
2. Email rate limiting (Supabase free tier: 3 emails per hour)
3. Invalid email address

**Solutions:**
- Check spam/junk folder
- Wait a few minutes and try again
- Verify email address is correct
- Check Supabase logs for email delivery status

### Console Errors

Check browser console for detailed logs:
- `=== PASSWORD RESET CHECK ===` - App.tsx detecting reset flow
- `=== PROFILE PASSWORD RESET REQUEST ===` - Reset requested from profile
- `📝 Setting session from URL tokens...` - Token exchange starting
- `✅ Session set successfully` - Token exchange succeeded
- `✅ Reset link is valid` - Link verification passed
- `❌` prefix - Indicates an error occurred

## How It Works

### From Login Page:
1. **User requests reset**: Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin })`
2. **Supabase sends email**: Contains a link with access_token and refresh_token in hash
3. **User clicks link**: Browser loads app with `#access_token=...&refresh_token=...&type=recovery`
4. **App detects recovery**: App.tsx checks for recovery indicators in URL hash
5. **Shows reset page**: ResetPasswordPage component renders
6. **Link verification**: Verifies tokens on mount (shows visual status)
7. **Token exchange**: Exchanges URL tokens for a valid session via `setSession()`
8. **Password update**: Updates password using `updateUser({ password })`
9. **Sign out**: Clears recovery session via `signOut()`
10. **Redirect to login**: User can now log in with new password

### From Profile Page:
1. **User clicks "Send Reset Email"**: While logged in
2. **Fresh link generated**: Invalidates any previous reset links
3. **User receives email**: Can reset password even if already logged in
4. **Same flow as above**: Uses the same ResetPasswordPage component
5. **Session handled properly**: Token exchange works even with existing session

## Fresh Links for Each Request

✅ **Already Implemented!** 

Every time a user requests a password reset, Supabase automatically generates a fresh, unique reset link. Previous links are invalidated when a new one is requested.

This means:
- Each reset request creates a new token
- Old links stop working when a new reset is requested
- Links expire after 1 hour
- Links can only be used once
- Works from both login page AND profile page

## Security Notes

- Reset links expire after 1 hour (Supabase default)
- Each link can only be used once
- Requesting a new reset invalidates previous links
- All tokens are cryptographically secure
- Session is cleared after successful password reset
- Password strength enforced with visual feedback
- Old password verification required for in-app password changes