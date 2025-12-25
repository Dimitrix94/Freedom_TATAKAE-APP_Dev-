# FreeLearning - Local Installation Guide

## Critical First Step: Fix Tailwind CSS

**Before running the application locally, you MUST install Tailwind CSS v3.**

### One-Line Fix

```bash
rm -rf node_modules package-lock.json .vite dist && npm install && npm run dev
```

This single command:
1. Removes incompatible Tailwind v4 files
2. Installs compatible Tailwind v3.4.17
3. Clears all build caches
4. Starts the development server

### Why This Is Necessary

- **Figma Make** includes Tailwind CSS v4 in its build environment
- **Local development** requires Tailwind CSS v3 with traditional configuration
- Without this fix, the app shows raw HTML with no styling

---

## Full Installation Process

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git (optional, for version control)

Check versions:
```bash
node --version
npm --version
```

### Step 1: Install Dependencies

From the project root directory:

```bash
# Clean install
rm -rf node_modules package-lock.json .vite dist

# Install all packages
npm install
```

**What gets installed:**
- React 18.3.1
- Tailwind CSS 3.4.17
- Supabase JS Client 2.47.10
- Radix UI components
- Recharts for analytics
- All other dependencies

### Step 2: Configure Supabase

See `/SUPABASE_SETUP.md` for detailed instructions.

**Quick setup:**
1. Create Supabase project at https://supabase.com
2. Run SQL migrations from `/supabase/migrations/`
3. Deploy edge function from `/supabase/functions/server/`
4. Update `utils/supabase/client.tsx` with your credentials

### Step 3: Start Development Server

```bash
npm run dev
```

**Expected output:**
```
VITE v6.0.3  ready in 500ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

### Step 4: Verify Installation

Open `http://localhost:5173` in your browser.

**You should see:**
- ✅ Styled landing page with gradient background
- ✅ Navigation menu with links
- ✅ "Get Started" and "Learn More" buttons
- ✅ Proper fonts, colors, spacing

**If you see:**
- ❌ Raw HTML, Times New Roman font
- ❌ No colors or styling
- ❌ Elements stacked vertically

**Then:** Run the Tailwind fix again:
```bash
rm -rf node_modules package-lock.json .vite dist && npm install && npm run dev
```

---

## Project Structure

```
freelearning/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── TeacherDashboard.tsx
│   ├── StudentDashboard.tsx
│   └── ...
├── styles/
│   └── globals.css     # Tailwind CSS + global styles
├── utils/
│   ├── supabase/       # Supabase client config
│   └── siteConfig.ts   # Site configuration
├── supabase/
│   └── functions/      # Edge functions
├── App.tsx             # Main application component
├── main.tsx            # Entry point
├── index.html          # HTML template
├── tailwind.config.js  # Tailwind configuration
├── postcss.config.js   # PostCSS configuration
├── vite.config.ts      # Vite configuration
└── package.json        # Dependencies
```

---

## Available Scripts

### Development
```bash
npm run dev        # Start development server (http://localhost:5173)
```

### Production
```bash
npm run build      # Build for production (outputs to /dist)
npm run preview    # Preview production build (http://localhost:4173)
```

### Linting
```bash
npm run lint       # Run ESLint
```

---

## Configuration Files

### tailwind.config.js
Configures Tailwind CSS with:
- Content paths for component scanning
- Custom theme extensions (colors, animations)
- shadcn/ui color system
- Dark mode support

### postcss.config.js
PostCSS configuration with:
- Tailwind CSS plugin
- Autoprefixer for browser compatibility

### vite.config.ts
Vite bundler configuration with:
- React plugin
- Path aliases (`@` points to root)
- Development server settings
- Build output configuration

### tsconfig.json
TypeScript configuration with:
- Strict type checking
- Module resolution
- Path mappings

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note:** These are currently set in `/utils/supabase/client.tsx` but can be moved to environment variables for better security.

---

## Common Issues & Solutions

### Issue 1: No Styling (Raw HTML)

**Symptom:** Page displays but looks unstyled  
**Cause:** Tailwind CSS not installed/configured  
**Fix:**
```bash
rm -rf node_modules package-lock.json .vite dist && npm install && npm run dev
```

### Issue 2: Port Already in Use

**Symptom:** Error: Port 5173 already in use  
**Cause:** Another process using the port  
**Fix:**
```bash
# Kill process on port 5173
npx kill-port 5173

# Or use different port
npm run dev -- --port 3000
```

### Issue 3: Module Not Found

**Symptom:** Cannot find module 'package-name'  
**Cause:** Missing dependencies  
**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue 4: Supabase Errors

**Symptom:** Database/auth errors in console  
**Cause:** Supabase not configured  
**Fix:** See `/SUPABASE_SETUP.md`

### Issue 5: Build Errors

**Symptom:** TypeScript errors during build  
**Cause:** Type mismatches  
**Fix:**
```bash
npm run lint  # Check for errors
# Fix TypeScript errors shown
npm run build
```

---

## Browser Compatibility

**Recommended browsers:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Mobile:**
- iOS Safari 14+
- Chrome Android 90+

---

## Performance Tips

### Development
- Use Chrome DevTools Performance tab
- Enable React DevTools
- Monitor Network tab for slow requests

### Production
- Run `npm run build` to create optimized bundle
- Enable gzip compression on server
- Use CDN for static assets
- Optimize images before uploading

---

## Deployment

### Build for Production
```bash
npm run build
```

Output in `/dist` folder.

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### Deploy to Static Hosting
Upload contents of `/dist` folder to:
- GitHub Pages
- AWS S3 + CloudFront
- Cloudflare Pages
- Any static hosting service

**Build settings:**
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 18.x

---

## Development Workflow

1. **Start server:** `npm run dev`
2. **Make changes** to components in `/components`
3. **See live updates** in browser (HMR enabled)
4. **Check console** for errors
5. **Test features** manually
6. **Build for production:** `npm run build`
7. **Preview build:** `npm run preview`
8. **Deploy** to hosting service

---

## Troubleshooting Resources

- **Quick Fix:** `/FIX_TAILWIND.md` - One command to fix styling
- **Tailwind Setup:** `/TAILWIND_SETUP.md` - Detailed Tailwind guide
- **CSS Fix:** `/CSS_FIX_INSTRUCTIONS.md` - Complete CSS troubleshooting
- **Supabase:** `/SUPABASE_SETUP.md` - Backend setup guide
- **General:** `/TROUBLESHOOTING.md` - General troubleshooting

---

## Getting Help

### Check Documentation
1. Read error message carefully
2. Check relevant guide above
3. Search in project documentation files

### Debug Steps
1. Clear cache: `rm -rf .vite dist`
2. Hard refresh browser: Ctrl+Shift+R
3. Check browser console (F12)
4. Check terminal for errors
5. Verify Node/npm versions

### Community Resources
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Supabase Docs](https://supabase.com/docs)

---

## Success Checklist

After installation, verify:

- [ ] `npm install` completed without errors
- [ ] `npm run dev` starts server successfully
- [ ] Browser shows styled landing page (not raw HTML)
- [ ] Navigation menu works
- [ ] Login page loads and displays correctly
- [ ] No errors in browser console
- [ ] No errors in terminal
- [ ] Supabase connection works (if configured)

**If all checked:** Installation successful! ✅

**If any fail:** See troubleshooting guides above.

---

## Next Steps

After successful installation:

1. **Configure Supabase** (see `/SUPABASE_SETUP.md`)
2. **Create teacher account** via registration
3. **Explore dashboard features**
4. **Add learning materials**
5. **Create assessments**
6. **Invite students**

---

## Updates & Maintenance

### Update Dependencies
```bash
# Check for updates
npm outdated

# Update all packages
npm update

# Update specific package
npm update package-name
```

### Update Tailwind
```bash
# Stay on v3.x for compatibility
npm update tailwindcss
```

**Note:** Do NOT upgrade to Tailwind v4 - it requires different configuration.

---

## License & Credits

- Built with React + Vite
- Styled with Tailwind CSS
- UI components from shadcn/ui
- Backend by Supabase
- Charts by Recharts
- Icons by Lucide

---

**Ready to start?** Run the one-line fix and you're good to go! 🚀

```bash
rm -rf node_modules package-lock.json .vite dist && npm install && npm run dev
```
