# 📇 FreeLearning - Quick Reference Card

## 🚀 Two-Command Setup

```bash
npm install    # Auto-configures everything
npm run dev    # Start developing
```

**That's it!** Auto-fix runs automatically on install.

---

## 📁 Key Files

| File | Location | Auto-Created |
|------|----------|--------------|
| `tailwind.config.js` | Root | ✅ Yes |
| `postcss.config.js` | Root | ✅ Yes |
| `styles/globals.css` | `/styles/` | ✅ Yes |
| `scripts/auto-fix.js` | `/scripts/` | ✅ Included |

---

## ✅ Verification Quick Check

After `npm install`, verify:

```bash
# Check files exist
ls tailwind.config.js postcss.config.js styles/globals.css

# Check Tailwind version
npm list tailwindcss
# Should show: tailwindcss@3.4.17

# Start dev server
npm run dev

# Open browser: http://localhost:5173
# ✓ Should see styled application (not raw HTML)
```

---

## 🐛 Troubleshooting Fast Track

### Styling Broken?

```bash
# Solution 1: Hard refresh browser
# Windows/Linux: Ctrl + Shift + R
# Mac: Cmd + Shift + R

# Solution 2: Clean reinstall
rm -rf node_modules package-lock.json .vite dist && npm install && npm run dev
```

### Auto-Fix Didn't Run?

```bash
# Manually run auto-fix
node scripts/auto-fix.js

# Then start server
npm run dev
```

### Still Not Working?

```bash
# Nuclear option
rm -rf node_modules package-lock.json .vite dist
npm cache clean --force
npm install
npm run dev
```

---

## 📝 Essential Commands

| Task | Command |
|------|---------|
| Install | `npm install` |
| Start dev | `npm run dev` |
| Build prod | `npm run build` |
| Preview prod | `npm run preview` |
| Run linter | `npm run lint` |
| Manual auto-fix | `node scripts/auto-fix.js` |
| Check Tailwind | `npm list tailwindcss` |

---

## 🔗 Documentation Quick Links

| Need | See |
|------|-----|
| First time setup | [START_HERE.md](/START_HERE.md) |
| How auto-fix works | [AUTO_FIX_DOCUMENTATION.md](/AUTO_FIX_DOCUMENTATION.md) |
| CSS issues | [FIX_TAILWIND.md](/FIX_TAILWIND.md) |
| Complete guide | [SETUP_GUIDE.md](/SETUP_GUIDE.md) |
| All docs index | [DOCUMENTATION_INDEX.md](/DOCUMENTATION_INDEX.md) |
| Backend setup | [SUPABASE_SETUP.md](/SUPABASE_SETUP.md) |

---

## ✨ What Auto-Fix Does

When you run `npm install`, the script automatically:

- ✅ Removes `src/index.css`, `src/postcss.config.js`, etc.
- ✅ Creates `tailwind.config.js` in root
- ✅ Creates `postcss.config.js` in root
- ✅ Creates/updates `styles/globals.css`
- ✅ Fixes CSS imports in `main.tsx`
- ✅ Clears build caches (`.vite/`, `dist/`)
- ✅ Verifies Tailwind version

---

## 🎯 Success Indicators

**After `npm run dev`, you should see:**

✅ Styled landing page with colors  
✅ Gradients in backgrounds  
✅ Styled buttons with hover effects  
✅ Proper spacing and layout  
✅ No console errors (F12)  

**If you see:**

❌ Raw HTML (Times New Roman font)  
❌ No colors  
❌ No styling  

**Then:** Run troubleshooting steps above

---

## 🔍 Common Issues

| Symptom | Quick Fix |
|---------|-----------|
| No styling | Hard refresh browser |
| Auto-fix didn't run | `node scripts/auto-fix.js` |
| Port in use | `npx kill-port 5173` |
| Module not found | `rm -rf node_modules && npm install` |
| Permission denied | `chmod +x scripts/auto-fix.js` |

---

## 📊 File Structure Check

**Should exist:**
```
/
├── tailwind.config.js   ✓
├── postcss.config.js    ✓
├── scripts/
│   └── auto-fix.js      ✓
└── styles/
    └── globals.css      ✓
```

**Should NOT exist:**
```
/src/
├── index.css            ✗ (removed by auto-fix)
├── postcss.config.js    ✗ (removed by auto-fix)
└── tailwind.config.js   ✗ (removed by auto-fix)
```

---

## 🌐 Ports & URLs

| Service | URL | Port |
|---------|-----|------|
| Development | http://localhost:5173 | 5173 |
| Production preview | http://localhost:4173 | 4173 |

---

## 🔐 Supabase Quick Config

**Required for backend features:**

1. Create project at [supabase.com](https://supabase.com)
2. Update `/utils/supabase/info.tsx`:
   ```typescript
   export const projectId = 'your-project-id';
   export const publicAnonKey = 'your-anon-key';
   ```
3. See [SUPABASE_SETUP.md](/SUPABASE_SETUP.md) for SQL scripts

---

## 💡 Pro Tips

1. **Always hard refresh** after fixing CSS issues
2. **Check browser console** (F12) for errors first
3. **Auto-fix runs on every `npm install`** - you can't skip it!
4. **Don't edit config files in `/src/`** - they'll be deleted
5. **Keep configs in root only** - `/tailwind.config.js`, `/postcss.config.js`

---

## 📱 Contact & Support

**Documentation:**
- Main: [README.md](/README.md)
- Index: [DOCUMENTATION_INDEX.md](/DOCUMENTATION_INDEX.md)
- Setup: [START_HERE.md](/START_HERE.md)

**When stuck:**
1. Check browser console (F12)
2. Check terminal output
3. Read relevant docs
4. Try troubleshooting steps

---

## 🎓 Learning Path

**Beginner:**
1. [START_HERE.md](/START_HERE.md) - 2 min
2. Run `npm install && npm run dev`
3. Explore the app!

**Developer:**
1. [SETUP_GUIDE.md](/SETUP_GUIDE.md) - 10 min
2. [AUTO_FIX_DOCUMENTATION.md](/AUTO_FIX_DOCUMENTATION.md) - 10 min
3. Start coding!

---

## ⚡ Emergency Commands

```bash
# Complete reset (use if everything is broken)
rm -rf node_modules package-lock.json .vite dist
npm cache clean --force
npm install
npm run dev

# Kill process on port 5173
npx kill-port 5173

# Check what's running
lsof -i :5173        # Unix/Mac
netstat -ano | findstr :5173  # Windows

# Verify Node/npm versions
node --version    # Need 18+
npm --version     # Need 9+
```

---

## 📈 Version Info

| Package | Version | Notes |
|---------|---------|-------|
| Tailwind CSS | 3.4.17 | ✓ v3 (not v4!) |
| React | 18.3.1 | Latest stable |
| Vite | 6.0.3 | Latest |
| Node.js | 18+ | Required |
| npm | 9+ | Required |

---

## 🎨 Tailwind Quick Test

**Test if Tailwind works:**

Add to any component:
```jsx
<div className="bg-blue-500 text-white p-4 rounded">
  Test - Should be blue background with white text
</div>
```

If it works: ✅ Tailwind configured correctly  
If it doesn't: ❌ Check troubleshooting section

---

**Print or bookmark this page for quick reference!**

Last updated: December 2024
