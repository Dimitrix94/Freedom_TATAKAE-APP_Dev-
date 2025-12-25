# Tailwind CSS Setup for Local Development

## Problem Solved
The local build was showing raw HTML with no styling because Tailwind CSS v4 was not properly configured. This has been fixed by downgrading to Tailwind CSS v3.4.17 with proper traditional configuration.

## Required Steps

### 1. Clean Install Dependencies

**IMPORTANT: You must run these commands to install Tailwind CSS v3:**

```bash
# Remove existing node_modules and lock file
rm -rf node_modules package-lock.json

# Clean Vite cache
rm -rf .vite node_modules/.vite dist

# Install all dependencies (this will install Tailwind v3.4.17)
npm install

# Start development server
npm run dev
```

### 2. Verify Installation

After running the commands above, verify Tailwind is installed:

```bash
npm list tailwindcss
# Should show: tailwindcss@3.4.17
```

## What Was Changed

### 1. Package.json
- ✅ **Downgraded** `tailwindcss` from `^4.0.0` to `^3.4.17`
- ✅ **Removed** `@tailwindcss/postcss` (not needed in v3)
- ✅ **Kept** `autoprefixer@^10.4.20` (required for v3)

### 2. Created tailwind.config.js
- ✅ **New file** with proper content paths
- ✅ Scans: `./index.html`, `./App.tsx`, `./main.tsx`, `./components/**/*`, `./utils/**/*`
- ✅ Includes all necessary theme extensions (colors, animations, etc.)
- ✅ Uses `tailwindcss-animate` plugin

### 3. Updated globals.css
- ✅ **Changed** from `@import "tailwindcss"` to standard directives:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- ✅ **Converted** CSS variables to HSL format compatible with Tailwind
- ✅ **Added** proper color definitions for light and dark modes

### 4. Updated postcss.config.js
- ✅ **Changed** from `@tailwindcss/postcss` to standard `tailwindcss` plugin
- ✅ Uses traditional PostCSS configuration

### 5. Removed utilities.css
- ✅ **Deleted** custom utilities file (not needed with proper Tailwind setup)

## Configuration Files

### tailwind.config.js
```javascript
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./App.tsx",
    "./main.tsx",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
  ],
  theme: { /* ... extended theme ... */ },
  plugins: [require("tailwindcss-animate")],
};
```

### postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* CSS variables in HSL format */
  }
}
```

## Verification Checklist

After running `npm install` and `npm run dev`:

### Terminal
- [ ] No errors during `npm install`
- [ ] Dev server starts without errors
- [ ] No PostCSS warnings

### Browser Console (F12)
- [ ] No CSS-related errors
- [ ] No "Failed to parse" warnings
- [ ] globals.css loads successfully (Network tab)

### Visual Check
- [ ] Background colors appear
- [ ] Text is styled (not Times New Roman)
- [ ] Buttons have proper styling
- [ ] Layout uses flexbox/grid properly
- [ ] Spacing and padding are visible
- [ ] Colors match Figma Make preview

### Specific Elements to Check
1. **Landing Page**: Gradient backgrounds, proper spacing
2. **Login Page**: Form inputs styled, buttons colored
3. **Teacher Dashboard**: Tabs visible, cards have shadows
4. **Progress Tracker**: Table styled, dialogs have gradients
5. **Dialogs**: Proper centering, rounded corners, shadows

## Troubleshooting

### Issue: "Cannot find module 'tailwindcss'"
**Solution:**
```bash
npm install --save-dev tailwindcss@3.4.17 autoprefixer@10.4.20
```

### Issue: Styles still not appearing
**Solution:**
```bash
# Hard refresh browser
# Windows/Linux: Ctrl + Shift + R
# Mac: Cmd + Shift + R

# Or clear cache and restart
rm -rf .vite dist
npm run dev
```

### Issue: Some Tailwind classes not working
**Solution:**
Check that the file is in a scanned directory. The `tailwind.config.js` content paths cover:
- Root: `index.html`, `App.tsx`, `main.tsx`
- Components: `components/**/*`
- Utils: `utils/**/*`

If your file is elsewhere, add it to the `content` array.

### Issue: Dark mode not working
**Solution:**
Dark mode uses the `class` strategy. Add the `dark` class to a parent element:
```html
<html class="dark">
```

## Expected Result

After setup, your local build should:
- ✅ Look identical to Figma Make preview
- ✅ Have all Tailwind utility classes applied
- ✅ Display gradients, shadows, and colors correctly
- ✅ Be fully responsive
- ✅ Have smooth animations

## CSS Variables Available

All shadcn/ui color variables are defined:
- `background`, `foreground`
- `card`, `card-foreground`
- `popover`, `popover-foreground`
- `primary`, `primary-foreground`
- `secondary`, `secondary-foreground`
- `muted`, `muted-foreground`
- `accent`, `accent-foreground`
- `destructive`, `destructive-foreground`
- `border`, `input`, `ring`
- `chart-1` through `chart-5`
- `sidebar-*` variants

Use in components:
```tsx
<div className="bg-primary text-primary-foreground">
  Primary colored element
</div>
```

## Migration Notes

### From Tailwind v4 to v3
- ❌ No more `@import "tailwindcss"`
- ✅ Use `@tailwind` directives instead
- ❌ No more `@theme inline` block
- ✅ CSS variables defined in `@layer base`
- ❌ No more `@tailwindcss/postcss` plugin
- ✅ Use `tailwindcss` plugin in PostCSS

### Content Paths
All component files are automatically scanned. No changes needed to existing code.

### Custom Classes
All custom Tailwind classes work as expected. Gradients, shadows, animations all supported.

## Support

If issues persist after following all steps:
1. Check Node.js version: `node --version` (requires 18+)
2. Verify npm version: `npm --version` (requires 9+)
3. Check for conflicting global packages: `npm list -g tailwindcss`
4. Try completely fresh install:
   ```bash
   rm -rf node_modules package-lock.json .vite dist
   npm cache clean --force
   npm install
   npm run dev
   ```

## Success Criteria

✅ **Local build = Figma Make preview**
- All components styled correctly
- All colors, gradients, shadows visible
- Layout matches exactly
- No console errors
- Fast build times
