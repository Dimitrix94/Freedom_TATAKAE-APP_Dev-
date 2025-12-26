import { useState } from 'react';
import { createClient, getServerUrl } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { BookOpen, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import logoImage from 'figma:asset/e6d79e8861bd18ad0650862c9dc2b4cc7c09cf38.png';
import { SetupHelper } from './SetupHelper';
import { ResetPasswordPage } from './ResetPasswordPage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface LoginPageProps {
  onLogin: (user: any, session: any) => void;
  onBack?: () => void;
}

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [showSetupHelper, setShowSetupHelper] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('signup-email') as string;
    const password = formData.get('signup-password') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;

    try {
      const supabase = createClient();
      
      // Sign up directly with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: role || 'student',
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error('Signup error:', error);
        throw error;
      }

      if (data.user && data.session) {
        // Create user profile in the database
        try {
          await supabase.from('profiles').insert({
            id: data.user.id,
            name: name,
            role: role || 'student',
          });
        } catch (profileError) {
          console.log('Profile creation error (may already exist):', profileError);
          // Don't fail if profile already exists
        }
        
        const roleText = role === 'teacher' ? 'Teacher' : 'Student';
        toast.success(
          `🎉 Account created successfully! Welcome to FreeLearning, ${name}! You're now logged in as a ${roleText}.`,
          { duration: 5000 }
        );
        onLogin(data.user, data.session);
      } else {
        // User created but no session (email confirmation might be required)
        toast.success(
          'Account created! You can now log in.',
          { duration: 4000 }
        );
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('login-email') as string;
    const password = formData.get('login-password') as string;

    console.log('Attempting login for:', email);

    try {
      const supabase = createClient();
      
      // Try to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login response:', { data, error });

      if (error) {
        console.error('Login error details:', error);
        
        // Increment error count and show setup helper after 2 auth errors
        const newErrorCount = errorCount + 1;
        setErrorCount(newErrorCount);
        
        if (error.message.toLowerCase().includes('email not confirmed') || 
            error.message.toLowerCase().includes('invalid login credentials')) {
          if (newErrorCount >= 2) {
            setShowSetupHelper(true);
          }
        }
        
        // Handle specific error cases
        if (error.message.toLowerCase().includes('email not confirmed')) {
          toast.error(
            'Email not confirmed. Click "Need Setup Help?" below for instructions.',
            { duration: 6000 }
          );
        } else if (error.message.toLowerCase().includes('invalid login credentials')) {
          // Could be wrong password OR unconfirmed email showing as invalid credentials
          toast.error(
            'Invalid credentials. This might be due to unconfirmed emails. Click "Need Setup Help?" below.',
            { duration: 6000 }
          );
        } else {
          toast.error(error.message);
        }
        throw error;
      }

      if (data.session && data.user) {
        console.log('Login successful, user:', data.user.email);
        toast.success('Welcome back!');
        onLogin(data.user, data.session);
      } else {
        toast.error('Login failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Login exception:', error);
      // Error already handled above with specific messages
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSendingReset(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('reset-email') as string;

    try {
      console.log('Sending password reset email to:', email);
      const supabase = createClient();
      
      // Send password reset email using Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#type=recovery`,
      });

      if (error) {
        console.error('Password reset error:', error);
        throw error;
      }

      // Store email for reference
      setResetEmail(email);
      toast.success('Password reset link sent to your email! Check your inbox.', { duration: 5000 });
      
      // Close dialog
      setShowForgotPassword(false);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setSendingReset(false);
    }
  };

  // If setup helper should be shown, show it instead
  if (showSetupHelper) {
    return <SetupHelper />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Back button */}
      {onBack && (
        <div className="absolute top-4 left-4">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
      )}
      
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Branding Section */}
        <div className="text-center md:text-left space-y-6">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <img src={logoImage} alt="FreeLearning Logo" className="h-16" />
          </div>
          <p className="text-xl text-gray-700 max-w-md">
            Interactive HCI Education Platform
          </p>
          <div className="space-y-4 text-gray-600">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
              <p>Structured learning paths with interactive exercises</p>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
              <p>Teacher-driven classroom management and progress tracking</p>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
              <p>Gamified quizzes and AI-powered learning support</p>
            </div>
          </div>
        </div>

        {/* Auth Section */}
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle>Welcome to FreeLearning</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      name="login-email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="login-password"
                      name="login-password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Log In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="signup-password"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>I am a...</Label>
                    <RadioGroup defaultValue="student" name="role" required>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="student" id="student" />
                        <Label htmlFor="student" className="cursor-pointer">
                          Student
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="teacher" id="teacher" />
                        <Label htmlFor="teacher" className="cursor-pointer">
                          Teacher
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a password reset link.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="reset-email"
                name="reset-email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForgotPassword(false)}
                className="flex-1"
                disabled={sendingReset}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={sendingReset}>
                {sendingReset ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
