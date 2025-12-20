import { useState } from 'react';
import { createClient, getServerUrl } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Mail, Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import logoImage from 'figma:asset/e6d79e8861bd18ad0650862c9dc2b4cc7c09cf38.png';

interface ResetPasswordPageProps {
  email: string;
  resetCode?: string; // Optional - for development mode
  onBack: () => void;
  onSuccess: () => void;
}

export function ResetPasswordPage({ email, resetCode, onBack, onSuccess }: ResetPasswordPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
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
      console.log('Verifying code and resetting password for:', email);
      const url = getServerUrl('/verify-reset-code');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: code.toUpperCase(),
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      toast.success('Password reset successfully! You can now log in with your new password.', {
        duration: 5000,
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
              Check your email for the 4-character code and enter it below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Email confirmation box */}
            <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 font-medium">
                    Reset code sent to:
                  </p>
                  <p className="text-sm text-blue-700 font-semibold">
                    {email}
                  </p>
                </div>
              </div>
              
              {resetCode && (
                <div className="mt-3 p-4 bg-white border-2 border-indigo-300 rounded-lg shadow-sm">
                  <p className="text-xs text-indigo-600 mb-2 uppercase tracking-wide font-semibold text-center">
                    Your Reset Code
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {resetCode.split('').map((char, i) => (
                      <div
                        key={i}
                        className="w-12 h-14 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-400 rounded-lg flex items-center justify-center"
                      >
                        <span className="text-3xl font-bold text-indigo-700 font-mono">
                          {char}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    💡 Development Mode: Code displayed for testing
                  </p>
                </div>
              )}
              
              {!resetCode && (
                <p className="text-xs text-blue-600 mt-2 text-center">
                  📧 Check your email inbox for the reset code
                </p>
              )}
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Reset Code Input */}
              <div className="space-y-2">
                <Label htmlFor="reset-code" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Reset Code (Check your email)
                </Label>
                <Input
                  id="reset-code"
                  name="reset-code"
                  type="text"
                  placeholder="Enter 4-character code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={4}
                  required
                  className="text-center text-2xl font-bold tracking-widest uppercase"
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500">
                  Check your email for the 4-character code
                </p>
              </div>

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
                <p>Code expires in 15 minutes</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Didn't receive the code?{' '}
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
