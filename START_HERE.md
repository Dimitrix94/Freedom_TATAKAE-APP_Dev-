# 🚀 START HERE - FreeLearning Local Setup

## ✨ This Project Auto-Configures Itself!

**Just run these two commands:**

```bash
npm install
npm run dev
```

The project includes a **self-healing auto-fix script** that runs automatically on `npm install`. It:
- ✅ Removes conflicting config files
- ✅ Creates proper Tailwind CSS v3 configuration
- ✅ Fixes CSS imports automatically
- ✅ Clears build caches
- ✅ Ensures local build matches Figma Make preview

**No manual fixes needed!** See `/AUTO_FIX_DOCUMENTATION.md` for details.

---

## Still Seeing Raw HTML?

If styling doesn't appear after `npm install && npm run dev`:

### Quick Fix

```bash
rm -rf node_modules package-lock.json .vite dist && npm install && npm run dev
```

**That's it!** Your app should now be styled correctly at `http://localhost:5173`

---

## What just happened?

- ✅ Removed Tailwind CSS v4 (incompatible with local dev)
- ✅ Installed Tailwind CSS v3.4.17 (fully compatible)
- ✅ Cleared all build caches
- ✅ Generated proper CSS files
- ✅ Started development server

---

## Is it working?

Open `http://localhost:5173` and check:

### ✅ Success Indicators:
- Colors appear (backgrounds, buttons, etc.)
- Text is styled (not Times New Roman)
- Buttons have colors and hover effects
- Layout has proper spacing
- Forms have borders and styling

### ❌ Still Not Working?

1. **Hard refresh browser:**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Check browser console (F12):**
   - Look for error messages
   - Note any failed file loads

3. **Verify Tailwind version:**
   ```bash
   npm list tailwindcss
   # Should show: tailwindcss@3.4.17
   ```

4. **Nuclear option:**
   ```bash
   rm -rf node_modules package-lock.json .vite dist
   npm cache clean --force
   npm install
   npm run dev
   ```

---

## Next Steps

### 1. Configure Supabase (Required for full functionality)
See `/SUPABASE_SETUP.md` for backend setup.

**Quick version:**
1. Create Supabase project
2. Update credentials in `/utils/supabase/info.tsx`
3. Run SQL scripts
4. Deploy edge function

### 2. Explore the Application
- **Landing Page:** Introduction and features
- **Login:** Create teacher or student account
- **Teacher Dashboard:** Manage materials, create assessments
- **Student Dashboard:** Access materials, take quizzes
- **Progress Tracker:** Monitor student progress (teacher)
- **Forums:** Discussion boards
- **AI Tutor:** Ask questions (student)

---

## Documentation Quick Links

### Having Issues?
- **CSS/Styling Problems:** `/FIX_TAILWIND.md`
- **Detailed Setup Guide:** `/TAILWIND_SETUP.md`
- **Full Troubleshooting:** `/CSS_FIX_INSTRUCTIONS.md`
- **Verification Checklist:** `/VERIFY_CSS_BUILD.md`

### Project Setup
- **Complete Installation:** `/INSTALLATION_GUIDE.md`
- **Backend Setup:** `/SUPABASE_SETUP.md`
- **Auth Issues:** `/DEBUG_AUTH.md`

### Reference
- **Changes Made:** `/CHANGES_SUMMARY.md`
- **Main README:** `/README.md`
- **Guidelines:** `/guidelines/Guidelines.md`

---

## Common Questions

### Q: Why does Figma Make work but local doesn't?
**A:** Figma Make uses Tailwind v4 in its build environment. Local development needs Tailwind v3 for compatibility. The one-line fix switches to v3.

### Q: Will this affect my component code?
**A:** No! Only configuration files changed. All components work exactly the same.

### Q: What if I already ran `npm install`?
**A:** Run the fix command anyway. It will reinstall with the correct version.

### Q: How do I know which version I have?
**A:** Run: `npm list tailwindcss`  
Should show: `tailwindcss@3.4.17`

### Q: Can I upgrade to Tailwind v4 later?
**A:** Not recommended until v4 is officially released and has widespread Vite support.

### Q: What if the fix doesn't work?
**A:** See `/FIX_TAILWIND.md` for troubleshooting steps and alternative solutions.

---

## Development Workflow

```bash
# Start development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## Project Structure

```
freelearning/
├── components/          # React components
│   ├── ui/             # Reusable UI (buttons, dialogs, etc.)
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── TeacherDashboard.tsx
│   ├── StudentDashboard.tsx
│   ├── ProgressTracker.tsx
│   └── ...
├── styles/
│   └── globals.css     # Tailwind CSS + global styles
├── utils/
│   ├── supabase/       # Backend configuration
│   └── siteConfig.ts
├── supabase/
│   └── functions/      # Backend edge functions
├── App.tsx             # Main app component
├── main.tsx            # Entry point
├── tailwind.config.js  # Tailwind configuration
└── package.json        # Dependencies
```

---

## Key Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS v3** - Styling
- **Supabase** - Backend (auth, database, storage)
- **Radix UI** - Accessible components
- **Recharts** - Charts and analytics

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

---

## Need Help?

### 1. Check Documentation
Start with the quick guides:
- `/FIX_TAILWIND.md` - Styling fixes
- `/QUICK_FIX.md` - Alternative quick fixes
- `/README.md` - Main documentation

### 2. Browser DevTools
Press `F12` and check:
- **Console:** Error messages
- **Network:** Failed file loads
- **Elements:** Verify classes are applied

### 3. Terminal Output
Look for error messages when running:
- `npm install`
- `npm run dev`

### 4. Verify Environment
```bash
node --version  # Should be 18+
npm --version   # Should be 9+
```

---

## Success Checklist

After running the fix command:

- [ ] Dev server starts without errors
- [ ] Browser shows styled application
- [ ] No errors in browser console
- [ ] Colors and gradients visible
- [ ] Buttons are styled
- [ ] Forms have proper layout
- [ ] Landing page looks good
- [ ] Login page is styled

**All checked?** You're ready to develop! 🎉

**Some failed?** See `/VERIFY_CSS_BUILD.md` for detailed checks.

---

## Quick Commands Reference

```bash
# Fix styling issues
rm -rf node_modules package-lock.json .vite dist && npm install && npm run dev

# Check Tailwind version
npm list tailwindcss

# Hard refresh browser
# Windows/Linux: Ctrl + Shift + R
# Mac: Cmd + Shift + R

# Clear all caches
rm -rf .vite dist node_modules package-lock.json
npm cache clean --force
npm install

# Start development
npm run dev

# Build for production
npm run build
```

---

## Remember

✅ **Always run the one-line fix command first**  
✅ **Hard refresh browser after fix**  
✅ **Check browser console for errors**  
✅ **Verify Tailwind version is 3.4.17**  

**Still stuck?** Read `/FIX_TAILWIND.md` for more help.

---

**Ready? Run this now:**

```bash
rm -rf node_modules package-lock.json .vite dist && npm install && npm run dev
```

Then open `http://localhost:5173` and start building! 🚀