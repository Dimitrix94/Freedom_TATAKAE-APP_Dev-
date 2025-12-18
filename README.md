# FreeLearning - Interactive HCI Education Platform

An interactive learning platform for HCI education, inspired by SoloLearn but designed to be teacher-driven for classroom use.

## Features

- **User Authentication**: Role-based access for teachers and students using Supabase Auth
- **Learning Materials Management**: Dynamic content creation and editing
- **Quiz/Assessment System**: Create, take, and grade assessments
- **Student Progress Tracking**: Monitor student performance and provide feedback
- **Discussion Forums**: Engage with peers and instructors
- **AI Tutor**: Integrated AI assistance using DeepSeek through OpenRouter API
- **Profile Management**: Upload avatars, edit profiles, and manage settings
- **Password Reset**: Secure email-based password recovery

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account (for backend services)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Update `/utils/supabase/info.tsx` with your Supabase credentials:

```typescript
export const projectId = 'your-project-id';
export const publicAnonKey = 'your-anon-key';
```

3. Run the SQL setup scripts in your Supabase SQL editor (see `SUPABASE_SETUP.md` for details):
   - Create the profiles table
   - Set up RLS policies
   - Create the auto-confirm users function
   - Deploy the edge function for backend operations

### 3. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Configure Production URL (Optional)

When deploying to production:

1. Log in as a teacher
2. Go to Profile → Production URL Configuration
3. Set your production URL (e.g., `https://yourapp.com`)
4. This ensures password reset emails use the correct domain

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── TeacherDashboard.tsx
│   ├── StudentDashboard.tsx
│   └── ...
├── utils/              # Utility functions
│   ├── supabase/       # Supabase client configuration
│   └── siteConfig.ts   # Site configuration utilities
├── styles/             # Global styles
├── supabase/           # Supabase edge functions
└── App.tsx             # Main application component
```

## Key Technologies

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS v4** - Styling
- **Supabase** - Backend (Auth, Database, Storage)
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icons
- **Recharts** - Data visualization

## User Roles

### Teacher
- Create and manage learning materials
- Create and grade assessments
- Track student progress
- Provide feedback on submissions
- Manage announcements
- Access all platform features

### Student
- Access learning materials
- Take assessments
- View results and feedback
- Track personal progress
- Participate in forums
- Use AI tutor

## Authentication Flow

1. Users sign up with email, password, name, and role
2. Email is automatically confirmed (via database trigger)
3. Users can log in immediately
4. Forgot password flow available on login page

## Database Schema

See `SUPABASE_SETUP.md` for complete database schema and setup instructions.

## Environment Variables

No environment variables needed in the client - all configuration is in `/utils/supabase/info.tsx`

## Troubleshooting

### "Email not confirmed" error
- Run the SQL command to auto-confirm users (see `SUPABASE_SETUP.md`)
- The auto-confirm function runs on every app load

### Password reset emails not working
- Configure your production URL in Profile settings
- Check Supabase email settings in your project dashboard

### Edge function errors
- Ensure the edge function is deployed in your Supabase project
- Check the function logs in Supabase dashboard

## License

Private educational project

## Support

For issues and questions, please refer to the documentation files:
- `SUPABASE_SETUP.md` - Backend setup
- `DEBUG_AUTH.md` - Authentication troubleshooting
- `guidelines/Guidelines.md` - Development guidelines
