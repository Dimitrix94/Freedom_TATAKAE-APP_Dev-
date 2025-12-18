# Fix Import Issues

Your project has import issues because it was designed for Figma Make's environment. Follow these steps to fix them:

## Step 1: Install Required Packages

Run this command in your terminal:

```bash
npm install @tailwindcss/postcss next-themes cmdk jspdf
```

## Step 2: Run the Fix Script

Create and run this Node.js script to fix all versioned imports:

### Create `fix-imports.js`:

```javascript
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Map of versioned imports to fix
const importFixes = {
  'sonner@2.0.3': 'sonner',
  '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
  '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
  '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
  '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
  '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
  '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
  '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
  '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
  '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
  '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
  'class-variance-authority@0.7.1': 'class-variance-authority',
  'lucide-react@0.487.0': 'lucide-react',
  'next-themes@0.4.6': 'next-themes',
  '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
  '@radix-ui/react-separator@1.1.1': '@radix-ui/react-separator',
  'cmdk@1.0.4': 'cmdk',
  'vaul@1.1.1': 'vaul',
  'recharts@2.15.0': 'recharts',
  '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-checkbox@1.1.3': '@radix-ui/react-checkbox',
  '@radix-ui/react-tooltip@1.1.6': '@radix-ui/react-tooltip',
  '@radix-ui/react-switch@1.1.2': '@radix-ui/react-switch',
  '@radix-ui/react-accordion@1.2.2': '@radix-ui/react-accordion',
  'date-fns@4.1.0': 'date-fns',
  'react-day-picker@9.4.3': 'react-day-picker',
  '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
  'input-otp@1.4.1': 'input-otp',
  '@radix-ui/react-menubar@1.1.4': '@radix-ui/react-menubar',
  '@radix-ui/react-navigation-menu@1.2.3': '@radix-ui/react-navigation-menu',
  '@radix-ui/react-slider@1.2.1': '@radix-ui/react-slider',
  'react-resizable-panels@2.1.7': 'react-resizable-panels',
  '@radix-ui/react-collapsible@1.1.2': '@radix-ui/react-collapsible',
  '@radix-ui/react-context-menu@2.2.4': '@radix-ui/react-context-menu',
  '@radix-ui/react-toggle@1.1.1': '@radix-ui/react-toggle',
  '@radix-ui/react-toggle-group@1.1.1': '@radix-ui/react-toggle-group',
};

function fixFileImports(filePath) {
  let content = readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix versioned imports
  for (const [versionedImport, fixedImport] of Object.entries(importFixes)) {
    const regex = new RegExp(`from ["']${versionedImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `from "${fixedImport}"`);
      modified = true;
      console.log(`  Fixed: ${versionedImport} -> ${fixedImport}`);
    }
  }

  // Fix figma:asset imports - replace with placeholder or comment
  const figmaAssetRegex = /import\s+(\w+)\s+from\s+["']figma:asset\/[^"']+["'];?/g;
  if (figmaAssetRegex.test(content)) {
    content = content.replace(figmaAssetRegex, (match, varName) => {
      console.log(`  Commented out figma:asset import: ${varName}`);
      return `// ${match}\n// TODO: Replace with actual image path\nconst ${varName} = "/placeholder-logo.png";`;
    });
    modified = true;
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function processDirectory(dir) {
  const files = readdirSync(dir);
  let totalFixed = 0;

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.git')) {
        totalFixed += processDirectory(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      console.log(`Checking: ${filePath}`);
      if (fixFileImports(filePath)) {
        totalFixed++;
      }
    }
  }

  return totalFixed;
}

console.log('Starting import fixes...\n');
const fixed = processDirectory('.');
console.log(`\nDone! Fixed ${fixed} files.`);
console.log('\nNote: figma:asset imports have been replaced with placeholder paths.');
console.log('You need to either:');
console.log('1. Create a /public/placeholder-logo.png file');
console.log('2. Replace the placeholder paths with your actual image paths\n');
```

### Run the script:

```bash
node fix-imports.js
```

## Step 3: Create Placeholder Image (Optional)

If you want the app to run without errors, create a simple placeholder logo:

1. Create a `/public` folder if it doesn't exist
2. Add any image file named `placeholder-logo.png` to `/public/`

Or you can manually find and replace all instances of `/placeholder-logo.png` with your actual logo path.

## Step 4: Restart Development Server

```bash
npm run dev
```

## Alternative: Manual Fix for Common Files

If the script doesn't work, you can manually fix imports. Here are the most common changes needed:

### In any `.tsx` or `.ts` file:

**Change:**
```typescript
import { toast } from "sonner@2.0.3";
```

**To:**
```typescript
import { toast } from "sonner";
```

**Change:**
```typescript
import * as TabsPrimitive from "@radix-ui/react-tabs@1.1.3";
```

**To:**
```typescript
import * as TabsPrimitive from "@radix-ui/react-tabs";
```

**Change:**
```typescript
import logoImage from "figma:asset/e6d79e8861bd18ad0650862c9dc2b4cc7c09cf38.png";
```

**To:**
```typescript
// Replace with your actual logo path
const logoImage = "/logo.png"; // or import logoImage from "/assets/logo.png"
```

Apply this pattern to all versioned imports (remove the `@version` part).
