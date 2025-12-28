import { useState } from 'react';
import { createClient, getServerUrl } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import logoImage from 'figma:asset/e6d79e8861bd18ad0650862c9dc2b4cc7c09cf38.png';

interface ResetPasswordPageProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export function ResetPasswordPage({ onBack, onSuccess }: ResetPasswordPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Updating password with recovery session...');
      const supabase = createClient();
      
      // Exchange the URL hash for a session (if not already done)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        console.log('Setting session from URL tokens...');
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (sessionError) {
          console.error('Session exchange error:', sessionError);
          throw new Error('Failed to validate reset link. Please request a new one.');
        }
        
        console.log('Session set successfully:', sessionData);
      }
      
      // Verify we have a valid session
      const { data: currentSession, error: sessionCheckError } = await supabase.auth.getSession();
      
      if (sessionCheckError || !currentSession.session) {
        console.error('No valid recovery session found:', sessionCheckError);
        throw new Error('Your password reset link has expired or is invalid. Please request a new one.');
      }

      console.log('Valid session confirmed, updating password...');
      
      // Update password using the recovery session
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        throw error;
      }

      console.log('Password updated successfully:', data);
      
      toast.success('Password reset successfully! Redirecting to login...', {
        duration: 3000,
      });
      
      // Sign out the user after password reset to clear the recovery session
      await supabase.auth.signOut();
      
      // Wait a moment for the toast to be visible, then redirect
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          // Clear the hash from URL
          window.location.hash = '';
          window.location.reload();
        }
      }, 1500);
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Failed to reset password. Please try again or request a new reset link.');
      setIsLoading(false);
    }
    // Don't set isLoading to false here if successful - we're redirecting
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Back button */}
      <div className="absolute top-4 left-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Button>
      </div>
      
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={logoImage} alt="FreeLearning Logo" className="h-12" />
            </div>
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new-password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  New Password
                </Label>
                <Input
                  id="new-password"
                  name="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </form>

            {/* Help text */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <span>⏱️</span>
                <p>Reset link expires in 60 minutes</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Didn't receive the email?{' '}
                  <button
                    type="button"
                    onClick={onBack}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold underline"
                  >
                    Request a new one
                  </button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}