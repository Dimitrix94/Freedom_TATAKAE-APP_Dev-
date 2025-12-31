import { useState, useEffect } from 'react';
import { createClient, getServerUrl } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import logoImage from 'figma:asset/e6d79e8861bd18ad0650862c9dc2b4cc7c09cf38.png';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

interface ResetPasswordPageProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export function ResetPasswordPage({ onBack, onSuccess }: ResetPasswordPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [linkStatus, setLinkStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');

  // Log on mount to confirm component is rendering
  useEffect(() => {
    console.log('=== ResetPasswordPage MOUNTED ===');
    console.log('Current URL:', window.location.href);
    console.log('Hash:', window.location.hash);
    
    // Verify link validity on mount
    const verifyLink = async () => {
      try {
        const supabase = createClient();
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (!accessToken || !refreshToken) {
          console.error('❌ Missing tokens in URL');
          setLinkStatus('invalid');
          toast.error('Invalid reset link. Please request a new one.', { duration: 5000 });
          return;
        }
        
        // Try to set the session
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (error || !data.session) {
          console.error('❌ Invalid or expired session');
          setLinkStatus('invalid');
          toast.error('Your reset link has expired. Please request a new one.', { duration: 5000 });
          return;
        }
        
        console.log('✅ Reset link is valid');
        setLinkStatus('valid');
      } catch (error) {
        console.error('Error verifying link:', error);
        setLinkStatus('invalid');
      }
    };
    
    verifyLink();
  }, []);

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
      console.log('=== STARTING PASSWORD RESET ===');
      const supabase = createClient();
      
      // First, try to get the tokens from URL hash
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      console.log('Hash params found:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hashLength: hash.length
      });
      
      // IMPORTANT: If we have tokens in URL, exchange them for a session
      if (accessToken && refreshToken) {
        console.log('📝 Setting session from URL tokens...');
        
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (sessionError) {
          console.error('❌ Session exchange error:', sessionError);
          throw new Error('Failed to validate reset link. The link may have expired. Please request a new one.');
        }
        
        console.log('✅ Session set successfully:', {
          hasUser: !!sessionData.user,
          hasSession: !!sessionData.session,
          userEmail: sessionData.user?.email
        });
      } else {
        console.log('⚠️ No tokens in URL hash - checking for existing session');
      }
      
      // Double-check we now have a valid session
      const { data: currentSession, error: sessionCheckError } = await supabase.auth.getSession();
      
      console.log('Current session check:', {
        hasSession: !!currentSession.session,
        hasUser: !!currentSession.session?.user,
        error: sessionCheckError
      });
      
      if (sessionCheckError || !currentSession.session) {
        console.error('❌ No valid recovery session found');
        throw new Error('Your password reset link has expired or is invalid. Please request a new reset link from the login page.');
      }

      console.log('✅ Valid session confirmed, proceeding to update password...');
      
      // Now update the password using the valid session
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Password update error:', error);
        throw error;
      }

      console.log('✅ Password updated successfully!');
      
      toast.success('Password reset successfully! Redirecting to login...', {
        duration: 3000,
      });
      
      // Sign out the user after password reset to clear the recovery session
      console.log('Signing out after password reset...');
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
      console.error('❌ Reset password error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to reset password. ';
      
      if (error.message?.includes('expired') || error.message?.includes('invalid')) {
        errorMessage += 'Your reset link has expired. Please request a new one from the login page.';
      } else if (error.message?.includes('session')) {
        errorMessage += 'Could not verify your reset link. Please request a new one.';
      } else {
        errorMessage += error.message || 'Please try again or request a new reset link.';
      }
      
      toast.error(errorMessage, { duration: 6000 });
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
            {/* Link Status Banner */}
            {linkStatus === 'checking' && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                <p className="text-sm text-blue-700">Verifying reset link...</p>
              </div>
            )}
            
            {linkStatus === 'valid' && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700">Reset link verified! You can now set a new password.</p>
              </div>
            )}
            
            {linkStatus === 'invalid' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700 font-semibold mb-1">Invalid or Expired Link</p>
                    <p className="text-xs text-red-600">
                      This reset link is no longer valid. Please request a new password reset from the login page.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
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
                  disabled={linkStatus !== 'valid'}
                />
                <PasswordStrengthIndicator password={newPassword} />
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
                  disabled={linkStatus !== 'valid'}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || linkStatus !== 'valid'}
              >
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