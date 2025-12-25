# 📦 FreeLearning - Complete Setup Guide

## Overview

This guide walks you through setting up FreeLearning from scratch. The project includes **automatic configuration** that handles all Tailwind CSS setup for you.

---

## Prerequisites

Before starting, ensure you have:

- ✅ **Node.js 18+** ([Download](https://nodejs.org/))
- ✅ **npm 9+** (comes with Node.js)
- ✅ **Git** (optional, for cloning)
- ✅ **Modern browser** (Chrome, Firefox, Safari, Edge)

**Check versions:**
```bash
node --version   # Should show v18.x or higher
npm --version    # Should show 9.x or higher
```

---

## Quick Start (2 Steps)

### Step 1: Download/Clone the Project

**Option A: Git Clone**
```bash
git clone <repository-url>
cd freelearning
```

**Option B: Download ZIP**
1. Download project ZIP file
2. Extract to your desired location
3. Open terminal in the extracted folder

### Step 2: Install and Run

```bash
npm install
npm run dev
```

**That's it!** 🎉

The project will:
1. Install all dependencies
2. **Automatically configure Tailwind CSS** (via postinstall script)
3. Start the development server
4. Open at `http://localhost:5173`

---

## What Happens During Install

When you run `npm install`, the following occurs **automatically**:

### 1. Dependencies Installation
- React 18.3.1
- Tailwind CSS 3.4.17
- PostCSS & Autoprefixer
- Supabase client
- Radix UI components
- Recharts
- All other packages

### 2. Auto-Fix Script Runs (Automatic)

The `scripts/auto-fix.js` script runs via the `postinstall` hook and:

✅ **Removes conflicting files:**
- `src/index.css`
- `src/postcss.config.js`
- `src/tailwind.config.js`

✅ **Creates proper config files:**
- `tailwind.config.js` (in root)
- `postcss.config.js` (in root)
- `styles/globals.css` (if missing)

✅ **Fixes CSS imports:**
- Updates `main.tsx` to import `./styles/globals.css`
- Removes incorrect imports

✅ **Cleans build caches:**
- Removes `.vite/`
- Removes `dist/`
- Clears Vite cache

### 3. Ready to Develop

After install completes:
- ✅ Tailwind CSS v3 configured
- ✅ All config files in place
- ✅ CSS imports correct
- ✅ Build caches cleared

**Just run `npm run dev` to start!**

---

## Verification

### Check Installation Success

After `npm install`, verify:

**1. Auto-fix ran successfully:**
```
Expected output during install:

🔧 Running Tailwind CSS auto-fix script...
✓ Removed: src/index.css
✓ Created: tailwind.config.js
✓ Created: postcss.config.js
✓ Fixed: main.tsx CSS imports
✓ Cleaned 2 build cache director(ies)
✅ Auto-fix complete!
```

**2. Files exist in correct locations:**
```bash
ls tailwind.config.js        # ✓ Should exist in root
ls postcss.config.js         # ✓ Should exist in root
ls styles/globals.css        # ✓ Should exist
ls src/index.css            # ✗ Should NOT exist
```

**3. Tailwind version is correct:**
```bash
npm list tailwindcss
# Should show: tailwindcss@3.4.17
```

### Check Development Server

Run `npm run dev` and verify:

**1. Server starts without errors:**
```
Expected output:

VITE v6.0.3  ready in 500ms
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

**2. Browser displays styled application:**

Open `http://localhost:5173` and check:

✅ **Landing Page:**
- Gradient background visible
- Styled navigation menu
- "Get Started" button with color
- Proper typography and spacing

✅ **Overall Appearance:**
- NOT plain HTML (Times New Roman font)
- Colors throughout the page
- Proper layout with spacing
- Buttons have hover effects

**3. Browser console has no errors:**

Press `F12` → Console tab:
- ✅ No red error messages
- ✅ No "Failed to parse CSS" warnings
- ✅ No Tailwind-related errors

---

## Troubleshooting Setup Issues

### Issue 1: Auto-Fix Didn't Run

**Symptom:** No auto-fix output during `npm install`

**Solution:**
```bash
# Manually run the auto-fix script
node scripts/auto-fix.js

# Then start dev server
npm run dev
```

**Cause:** Postinstall hook might have been skipped if:
- Using `--ignore-scripts` flag
- Permission issues
- Script file missing

### Issue 2: Styling Still Broken After Install

**Symptom:** Raw HTML appearance even after auto-fix

**Solution:**
```bash
# Clean reinstall
rm -rf node_modules package-lock.json .vite dist
npm install
npm run dev

# Hard refresh browser
# Windows/Linux: Ctrl + Shift + R
# Mac: Cmd + Shift + R
```

**Possible causes:**
- Browser cache not cleared
- Build artifacts interfering
- Wrong Node.js version

### Issue 3: Port Already in Use

**Symptom:** Error: `Port 5173 already in use`

**Solution:**
```bash
# Kill process on port 5173
npx kill-port 5173

# Or use different port
npm run dev -- --port 3000
```

### Issue 4: Module Not Found Errors

**Symptom:** `Cannot find module 'X'`

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue 5: Permission Denied (Unix/Mac)

**Symptom:** `EACCES: permission denied`

**Solution:**
```bash
# Make auto-fix script executable
chmod +x scripts/auto-fix.js

# Reinstall
npm install
```

---

## Backend Configuration (Supabase)

The project requires Supabase for backend functionality. This is **separate from the CSS setup** and is **optional for testing the UI**.

### Quick Supabase Setup

**1. Create Supabase Project:**
- Go to [supabase.com](https://supabase.com)
- Create new project
- Note your project URL and anon key

**2. Update Configuration:**

Edit `/utils/supabase/info.tsx`:
```typescript
export const projectId = 'your-project-id-here';
export const publicAnonKey = 'your-anon-key-here';
```

**3. Set Up Database:**

See `/SUPABASE_SETUP.md` for:
- SQL schema creation
- RLS policies
- Edge function deployment
- Complete backend setup

**Note:** Backend setup is NOT required to verify Tailwind CSS is working. You can explore the UI without connecting to Supabase.

---

## Project Structure

After setup, your project structure:

```
freelearning/
├── node_modules/           # Dependencies (created by npm install)
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── TeacherDashboard.tsx
│   └── ...
├── scripts/
│   └── auto-fix.js        # Auto-configuration script
├── styles/
│   └── globals.css        # Tailwind CSS + global styles
├── utils/
│   ├── supabase/          # Backend config
│   └── siteConfig.ts
├── supabase/
│   └── functions/         # Edge functions
├── App.tsx                # Main app component
├── main.tsx               # Entry point (imports globals.css)
├── index.html             # HTML template
├── tailwind.config.js     # Tailwind v3 config (auto-created)
├── postcss.config.js      # PostCSS config (auto-created)
├── vite.config.ts         # Vite bundler config
├── package.json           # Dependencies & scripts
└── tsconfig.json          # TypeScript config
```

**Key files auto-managed:**
- ✅ `tailwind.config.js` - Created/verified by auto-fix
- ✅ `postcss.config.js` - Created/verified by auto-fix
- ✅ `styles/globals.css` - Created/verified by auto-fix
- ✅ `main.tsx` - CSS import verified by auto-fix

---

## Available Commands

### Development
```bash
npm run dev          # Start dev server (port 5173)
npm run dev -- --port 3000   # Use custom port
```

### Production
```bash
npm run build        # Build for production (outputs to /dist)
npm run preview      # Preview production build (port 4173)
```

### Code Quality
```bash
npm run lint         # Run ESLint
```

### Manual Tools
```bash
node scripts/auto-fix.js     # Manually run auto-fix
npm list tailwindcss         # Check Tailwind version
```

---

## Development Workflow

### Daily Development

```bash
# 1. Start dev server
npm run dev

# 2. Make changes to components
# 3. See live updates in browser (HMR)
# 4. Check browser console for errors
# 5. Build for production when ready
npm run build
```

### Adding New Dependencies

```bash
# Install new package
npm install package-name

# Auto-fix runs automatically after install
# Continue developing
npm run dev
```

**Note:** Auto-fix runs after EVERY `npm install`, ensuring configuration stays correct.

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update all packages
npm update

# Update specific package
npm update package-name

# Auto-fix runs after updates too
```

---

## Environment Variables (Optional)

Currently, configuration is in `/utils/supabase/info.tsx`.

**To use environment variables instead:**

1. Create `.env` file in root:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

2. Update `/utils/supabase/client.tsx`:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

3. Add `.env` to `.gitignore`:
```
.env
.env.local
```

---

## Deployment

### Build for Production

```bash
npm run build
```

**Output:** `/dist` folder with optimized files

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Build settings:**
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 18.x

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

**Build settings:**
- Build command: `npm run build`
- Publish directory: `dist`

### Deploy to Static Hosting

Upload contents of `/dist` folder to:
- GitHub Pages
- AWS S3 + CloudFront
- Cloudflare Pages
- Any static hosting service

---

## Common Scenarios

### Scenario 1: Fresh Clone

```bash
git clone <repo>
cd freelearning
npm install    # Auto-fix runs automatically
npm run dev    # Start developing
```

### Scenario 2: Downloaded ZIP

```bash
# Extract ZIP
cd freelearning
npm install    # Auto-fix runs automatically
npm run dev    # Start developing
```

### Scenario 3: After Pulling Updates

```bash
git pull
npm install    # Auto-fix runs, ensures config is correct
npm run dev
```

### Scenario 4: Clean Setup

```bash
# Remove everything
rm -rf node_modules package-lock.json .vite dist

# Fresh install
npm install    # Auto-fix runs
npm run dev
```

---

## Understanding Auto-Fix

### When It Runs

Auto-fix runs automatically:
- ✅ After `npm install`
- ✅ After `npm install package-name`
- ✅ After `npm update`
- ✅ After `npm ci` (CI environments)

### What It Fixes

1. **File conflicts** - Removes `src/index.css`, etc.
2. **Config files** - Creates `tailwind.config.js`, `postcss.config.js`
3. **CSS imports** - Fixes `main.tsx` imports
4. **Package versions** - Detects Tailwind v4, warns to reinstall
5. **Build caches** - Clears `.vite/`, `dist/`

### How to Disable (Not Recommended)

Edit `package.json`:
```json
{
  "scripts": {
    "postinstall": "echo 'Auto-fix disabled'"
  }
}
```

**Warning:** You'll need to configure Tailwind manually if disabled.

---

## Advanced Configuration

### Custom Tailwind Theme

Edit `tailwind.config.js`:
```javascript
export default {
  theme: {
    extend: {
      colors: {
        'custom-blue': '#1DA1F2',
      },
    },
  },
};
```

**Note:** Auto-fix won't overwrite existing `tailwind.config.js`, only creates if missing.

### Custom PostCSS Plugins

Edit `postcss.config.js`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    'postcss-preset-env': {},  // Add custom plugins
  },
};
```

### Custom Global CSS

Edit `styles/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Add your custom styles */
@layer components {
  .btn-primary {
    @apply bg-blue-500 text-white px-4 py-2 rounded;
  }
}
```

---

## Documentation Reference

- **📖 Main README** - `/README.md`
- **🔧 Auto-Fix Details** - `/AUTO_FIX_DOCUMENTATION.md`
- **⚡ Quick Fix** - `/FIX_TAILWIND.md`
- **📋 Setup Guide** - `/TAILWIND_SETUP.md` (detailed)
- **✅ Verification** - `/VERIFY_CSS_BUILD.md`
- **🗄️ Backend Setup** - `/SUPABASE_SETUP.md`
- **🔐 Auth Issues** - `/DEBUG_AUTH.md`
- **📝 Guidelines** - `/guidelines/Guidelines.md`

---

## Success Checklist

After completing setup, verify:

- [ ] `npm install` completed successfully
- [ ] Auto-fix script ran (saw output during install)
- [ ] `npm run dev` starts without errors
- [ ] Browser shows styled application at `http://localhost:5173`
- [ ] Landing page has colors and gradients
- [ ] No errors in browser console (F12)
- [ ] No errors in terminal
- [ ] Tailwind version is 3.4.17 (`npm list tailwindcss`)

**All checked?** ✅ **Setup complete!**

---

## Next Steps

1. **✅ Verify styling works** (should already be done)
2. **🗄️ Set up Supabase** (for backend functionality)
3. **👤 Create user accounts** (teacher and student)
4. **📚 Explore features** (dashboard, assessments, forums)
5. **🛠️ Start customizing** (add your own content)

---

## Support

**Need help?**

1. **Check documentation** - See links above
2. **Verify installation** - Use verification checklist
3. **Check browser console** - Press F12, look for errors
4. **Check terminal** - Look for error messages
5. **Try clean reinstall** - Remove `node_modules`, reinstall

**Still stuck?** See `/TROUBLESHOOTING.md` for comprehensive solutions.

---

**Ready to start?** Just run:

```bash
npm install
npm run dev
```

Welcome to FreeLearning! 🎉
