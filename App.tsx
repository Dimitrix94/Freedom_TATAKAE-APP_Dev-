import { useState, useEffect } from 'react';
import { createClient } from './utils/supabase/client';
import { LandingPage } from './components/LandingPage';
import { AboutPage } from './components/AboutPage';
import { LoginPage } from './components/LoginPage';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { Toaster } from './components/ui/sonner';
import { ResetPasswordPage } from './components/ResetPasswordPage';

interface User {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    role: 'teacher' | 'student';
    bio?: string;
    preferences?: any;
  };
}

type PageView = 'landing' | 'about' | 'login' | 'reset-password';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageView>('landing');
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    
    // Check if this is a password reset redirect
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setIsPasswordReset(true);
      setCurrentPage('reset-password');
    }
    
    // Auto-confirm users if the function exists
    const autoConfirmUsers = async () => {
      try {
        await supabase.rpc('auto_confirm_users');
        console.log('Auto-confirmed any unconfirmed users');
      } catch (error) {
        // Function might not exist yet, that's okay
        console.log('Auto-confirm function not available (run SQL setup if needed)');
      }
    };

    // Run auto-confirm on startup
    autoConfirmUsers();
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user as User);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user as User);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCurrentPage('landing');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading FreeLearning...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show dashboard
  if (user && session) {
    return (
      <>
        {user.user_metadata.role === 'teacher' ? (
          <TeacherDashboard user={user} session={session} onLogout={handleLogout} />
        ) : (
          <StudentDashboard user={user} session={session} onLogout={handleLogout} />
        )}
        <Toaster />
      </>
    );
  }

  // If not logged in, show public pages
  return (
    <>
      {currentPage === 'landing' && (
        <LandingPage
          onNavigateToLogin={() => setCurrentPage('login')}
          onNavigateToAbout={() => setCurrentPage('about')}
        />
      )}
      
      {currentPage === 'about' && (
        <AboutPage
          onNavigateToHome={() => setCurrentPage('landing')}
          onNavigateToLogin={() => setCurrentPage('login')}
        />
      )}
      
      {currentPage === 'login' && (
        <LoginPage 
          onLogin={(user, session) => {
            setUser(user);
            setSession(session);
          }}
          onBack={() => setCurrentPage('landing')}
        />
      )}
      
      {currentPage === 'reset-password' && (
        <ResetPasswordPage 
          onBack={() => {
            setCurrentPage('login');
            setIsPasswordReset(false);
          }}
        />
      )}
      
      <Toaster />
    </>
  );
}