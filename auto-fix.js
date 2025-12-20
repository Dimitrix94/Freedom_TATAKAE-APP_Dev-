#!/usr/bin/env node

/**
 * Auto-Fix Script for Tailwind CSS Configuration
 * 
 * This script runs automatically after npm install to ensure:
 * 1. Tailwind CSS v3 is properly configured
 * 2. All config files are in the root directory
 * 3. No duplicate or conflicting config files exist
 * 4. CSS imports are correct
 * 5. Local build matches Figma Make preview
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('\n🔧 Running Tailwind CSS auto-fix script...\n');

// Step 1: Remove problematic files from src/
function removeProblematicFiles() {
  const problematicFiles = [
    'src/index.css',
    'src/postcss.config.js',
    'src/tailwind.config.js',
    'src/tailwind.config.ts',
  ];

  let removedCount = 0;

  problematicFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`✓ Removed: ${file}`);
        removedCount++;
      } catch (err) {
        console.warn(`⚠ Could not remove ${file}:`, err.message);
      }
    }
  });

  if (removedCount > 0) {
    console.log(`\n✓ Cleaned up ${removedCount} conflicting file(s)\n`);
  }
}

// Step 2: Ensure globals.css exists with correct content
function ensureGlobalsCss() {
  const globalsCssPath = path.join(rootDir, 'styles/globals.css');
  const stylesDir = path.join(rootDir, 'styles');

  if (!fs.existsSync(stylesDir)) {
    fs.mkdirSync(stylesDir, { recursive: true });
  }

  const correctGlobalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer utilities {
  .step {
    counter-increment: step;
  }

  .step:before {
    @apply absolute w-9 h-9 bg-muted rounded-full font-mono font-medium text-center text-base inline-flex items-center justify-center -indent-px border-4 border-background;
    @apply ml-[-50px] mt-[-4px];
    content: counter(step);
  }
}

@media (max-width: 640px) {
  .container {
    @apply px-4;
  }
}
`;

  if (!fs.existsSync(globalsCssPath)) {
    fs.writeFileSync(globalsCssPath, correctGlobalsCss, 'utf8');
    console.log('✓ Created: styles/globals.css\n');
  } else {
    // Check if it has the correct Tailwind directives
    const currentContent = fs.readFileSync(globalsCssPath, 'utf8');
    if (!currentContent.includes('@tailwind base;')) {
      fs.writeFileSync(globalsCssPath, correctGlobalsCss, 'utf8');
      console.log('✓ Fixed: styles/globals.css (updated to Tailwind v3 syntax)\n');
    }
  }
}

// Step 3: Ensure tailwind.config.js exists in root
function ensureTailwindConfig() {
  const tailwindConfigPath = path.join(rootDir, 'tailwind.config.js');

  const correctTailwindConfig = `/** @type {import('tailwindcss').Config} */
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
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
`;

  if (!fs.existsSync(tailwindConfigPath)) {
    fs.writeFileSync(tailwindConfigPath, correctTailwindConfig, 'utf8');
    console.log('✓ Created: tailwind.config.js\n');
  }
}

// Step 4: Ensure postcss.config.js exists in root
function ensurePostCssConfig() {
  const postcssConfigPath = path.join(rootDir, 'postcss.config.js');

  const correctPostCssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

  if (!fs.existsSync(postcssConfigPath)) {
    fs.writeFileSync(postcssConfigPath, correctPostCssConfig, 'utf8');
    console.log('✓ Created: postcss.config.js\n');
  } else {
    // Check if it has the correct format
    const currentContent = fs.readFileSync(postcssConfigPath, 'utf8');
    if (currentContent.includes('@tailwindcss/postcss')) {
      fs.writeFileSync(postcssConfigPath, correctPostCssConfig, 'utf8');
      console.log('✓ Fixed: postcss.config.js (updated to Tailwind v3 syntax)\n');
    }
  }
}

// Step 5: Verify CSS imports in main.tsx
function verifyCssImports() {
  const mainTsxPath = path.join(rootDir, 'main.tsx');

  if (fs.existsSync(mainTsxPath)) {
    let content = fs.readFileSync(mainTsxPath, 'utf8');
    let modified = false;

    // Remove incorrect imports
    const incorrectImports = [
      "import './index.css';",
      "import './src/index.css';",
      "import 'index.css';",
    ];

    incorrectImports.forEach(incorrectImport => {
      if (content.includes(incorrectImport)) {
        content = content.replace(incorrectImport, '');
        modified = true;
      }
    });

    // Ensure correct import exists
    if (!content.includes("import './styles/globals.css';")) {
      // Find the right place to insert (after other imports)
      const lines = content.split('\n');
      let insertIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          insertIndex = i + 1;
        }
      }

      lines.splice(insertIndex, 0, "import './styles/globals.css';");
      content = lines.join('\n');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(mainTsxPath, content, 'utf8');
      console.log('✓ Fixed: main.tsx CSS imports\n');
    }
  }
}

// Step 6: Verify package.json has correct Tailwind version
function verifyPackageJson() {
  const packageJsonPath = path.join(rootDir, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let modified = false;

    // Check devDependencies
    if (packageJson.devDependencies) {
      if (packageJson.devDependencies.tailwindcss) {
        const currentVersion = packageJson.devDependencies.tailwindcss;
        if (currentVersion.includes('4.0') || currentVersion.startsWith('^4')) {
          packageJson.devDependencies.tailwindcss = '^3.4.17';
          modified = true;
          console.log('⚠ Warning: Tailwind CSS v4 detected in package.json');
          console.log('  This will be fixed on next npm install');
        }
      }

      // Remove v4-specific packages
      if (packageJson.devDependencies['@tailwindcss/postcss']) {
        delete packageJson.devDependencies['@tailwindcss/postcss'];
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
      console.log('✓ Fixed: package.json (updated Tailwind version)\n');
    }
  }
}

// Step 7: Clean build artifacts
function cleanBuildArtifacts() {
  const dirsToClean = ['.vite', 'dist', 'node_modules/.vite'];
  let cleanedCount = 0;

  dirsToClean.forEach(dir => {
    const dirPath = path.join(rootDir, dir);
    if (fs.existsSync(dirPath)) {
      try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        cleanedCount++;
      } catch (err) {
        // Ignore errors - directory might be in use
      }
    }
  });

  if (cleanedCount > 0) {
    console.log(`✓ Cleaned ${cleanedCount} build cache director(ies)\n`);
  }
}

// Run all fix steps
function runAutoFix() {
  try {
    console.log('📋 Step 1: Removing conflicting files...');
    removeProblematicFiles();

    console.log('📋 Step 2: Ensuring globals.css...');
    ensureGlobalsCss();

    console.log('📋 Step 3: Ensuring tailwind.config.js...');
    ensureTailwindConfig();

    console.log('📋 Step 4: Ensuring postcss.config.js...');
    ensurePostCssConfig();

    console.log('📋 Step 5: Verifying CSS imports...');
    verifyCssImports();

    console.log('📋 Step 6: Verifying package.json...');
    verifyPackageJson();

    console.log('📋 Step 7: Cleaning build artifacts...');
    cleanBuildArtifacts();

    console.log('✅ Auto-fix complete! Your Tailwind CSS setup is now configured correctly.\n');
    console.log('📌 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Open: http://localhost:5173');
    console.log('   3. Verify: Styling should match Figma Make preview\n');
  } catch (error) {
    console.error('❌ Error during auto-fix:', error.message);
    console.error('\nIf problems persist, please check the documentation in /FIX_TAILWIND.md\n');
    process.exit(1);
  }
}

// Execute
runAutoFix();
