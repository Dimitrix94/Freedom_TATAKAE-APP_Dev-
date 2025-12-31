import { useState, useEffect } from 'react';
import { getServerUrl, serverFetch } from '../utils/supabase/client';
import { createClient } from '../utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { User, Mail, Shield, Trash2, Calendar, Clock, TrendingUp, Award, CheckCircle2, Camera, Lock, KeyRound } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

interface ProfileEditorProps {
  user: any;
  session: any;
}

export function ProfileEditor({ user, session }: ProfileEditorProps) {
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.user_metadata.avatar_url || null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Check for valid account creation timestamp
  const hasValidCreatedAt = user.created_at && !isNaN(new Date(user.created_at).getTime());
  
  // Check for valid session timestamp
  const hasValidSession = session?.user?.last_sign_in_at && !isNaN(new Date(session.user.last_sign_in_at).getTime());

  // Calculate membership duration
  const calculateMembershipDuration = () => {
    if (!hasValidCreatedAt) {
      return 'Membership information unavailable';
    }
    
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` and ${months} month${months > 1 ? 's' : ''}` : ''}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}${days > 0 ? ` and ${days} day${days > 1 ? 's' : ''}` : ''}`;
    } else {
      return `${days} day${days > 1 ? 's' : ''}`;
    }
  };

  const formatMemberSinceDate = () => {
    if (!hasValidCreatedAt) {
      return 'Membership information unavailable';
    }
    
    const createdAt = new Date(user.created_at);
    return createdAt.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Quick Stats calculations
  const calculateDaysActive = () => {
    if (!hasValidCreatedAt) {
      return 0;
    }
    
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getAccountAgeBadge = () => {
    if (!hasValidCreatedAt) {
      return { label: 'Unknown', color: 'bg-gray-100 text-gray-700' };
    }
    
    const days = calculateDaysActive();
    if (days < 30) return { label: 'Newbie', color: 'bg-blue-100 text-blue-700' };
    if (days < 180) return { label: 'Regular', color: 'bg-green-100 text-green-700' };
    return { label: 'Veteran', color: 'bg-purple-100 text-purple-700' };
  };

  const calculateProfileCompletion = () => {
    let score = 0;
    let total = 4;
    
    if (user.email) score++;
    if (user.user_metadata.name) score++;
    if (user.user_metadata.bio && user.user_metadata.bio.length > 0) score++;
    if (user.user_metadata.role) score++;
    
    return Math.round((score / total) * 100);
  };

  const formatLastLogin = () => {
    if (!hasValidSession) {
      return 'Session information unavailable';
    }
    
    if (session?.user?.last_sign_in_at) {
      const lastLogin = new Date(session.user.last_sign_in_at);
      const now = new Date();
      const diffTime = now.getTime() - lastLogin.getTime();
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        const hours = diffHours % 24;
        if (hours > 0) {
          return `${diffDays}d ${hours}h`;
        }
        return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
      }
      if (diffHours > 0) {
        const minutes = diffMinutes % 60;
        if (minutes > 0) {
          return `${diffHours}h ${minutes}m`;
        }
        return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
      }
      if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
      }
      return 'Just now';
    }
    return 'Session information unavailable';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const updates = {
      name: formData.get('name') as string,
      bio: formData.get('bio') as string,
    };

    try {
      const response = await fetch(getServerUrl('/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update profile');
      toast.success('Profile updated successfully! Please refresh to see changes.');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);

    try {
      const response = await serverFetch('/profile', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete account';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } else {
            const text = await response.text();
            console.error('Non-JSON response:', text);
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      toast.success('Account deleted successfully. Redirecting...');
      
      // Sign out from Supabase and redirect to login
      const supabase = createClient();
      await supabase.auth.signOut();
      
      setTimeout(() => {
        // Force a full page reload to reset app state
        window.location.href = '/';
      }, 1500);
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast.error(error.message || 'Failed to delete account');
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setAvatarPreview(base64String);

        // Update user metadata with new avatar
        const updateResponse = await fetch(getServerUrl('/profile'), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            name: user.user_metadata.name,
            bio: user.user_metadata.bio,
            avatar_url: base64String,
          }),
        });

        if (!updateResponse.ok) throw new Error('Failed to update avatar');
        toast.success('Avatar updated successfully! Please refresh to see changes.');
        setUploadingAvatar(false);
      };

      reader.onerror = () => {
        toast.error('Failed to read image file');
        setUploadingAvatar(false);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error(error.message || 'Failed to upload avatar');
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setChangingPassword(true);

    const formData = new FormData(e.currentTarget);
    const oldPassword = formData.get('old-password') as string;
    const newPassword = formData.get('new-password') as string;
    const confirmPassword = formData.get('confirm-password') as string;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      setChangingPassword(false);
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      setChangingPassword(false);
      return;
    }

    // Validate old password is provided
    if (!oldPassword || oldPassword.trim() === '') {
      toast.error('Please enter your current password');
      setChangingPassword(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // First verify the old password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (signInError) {
        console.error('Old password verification failed:', signInError);
        toast.error('Current password is incorrect. Please try again or use "Forgot Password".');
        setChangingPassword(false);
        return;
      }
      
      // Update password using Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password change error:', error);
        throw error;
      }

      if (data) {
        toast.success('Password changed successfully!');
        // Reset form
        (e.target as HTMLFormElement).reset();
      }
    } catch (error: any) {
      console.error('Password change exception:', error);
      toast.error(error.message || 'Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      console.log('=== PROFILE PASSWORD RESET REQUEST ===');
      const supabase = createClient();
      
      // Send password reset email
      // Use just the origin - Supabase will add the hash with tokens
      const redirectUrl = window.location.origin;
      console.log('Profile reset redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('Password reset error:', error);
        throw error;
      }

      console.log('✅ Password reset email sent successfully to:', user.email);
      toast.success('Password reset link sent to your email! Check your inbox and click the link to reset your password.', {
        duration: 6000
      });
    } catch (error: any) {
      console.error('Password reset exception:', error);
      toast.error(error.message || 'Failed to send reset email. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header with Avatar */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <Avatar className="w-24 h-24">
            <AvatarImage src={avatarPreview || user.user_metadata.avatar_url} alt={user.user_metadata.name || user.email} />
            <AvatarFallback className="text-2xl">
              {user.user_metadata.name 
                ? user.user_metadata.name.charAt(0).toUpperCase()
                : user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors"
          >
            <Camera className="w-4 h-4" />
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
            />
          </label>
        </div>
        <div>
          <h2 className="text-3xl text-gray-900">{user.user_metadata.name || 'User Profile'}</h2>
          <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
          {uploadingAvatar && (
            <p className="text-sm text-indigo-600 mt-1">Uploading avatar...</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Account Information & Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>View your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p>{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <p className="capitalize">{user.user_metadata.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Created Since</p>
                  <p>{formatMemberSinceDate()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Account Creation Duration</p>
                  <p>{calculateMembershipDuration()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Bio</p>
                  <p className="text-sm whitespace-pre-wrap">{user.user_metadata.bio || 'No bio added yet'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <TrendingUp className="w-5 h-5" />
                Quick Stats
              </CardTitle>
              <CardDescription>Your platform engagement overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Account Age Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm">Account Status</span>
                </div>
                <Badge className={getAccountAgeBadge().color}>
                  {getAccountAgeBadge().label}
                </Badge>
              </div>

              {/* Last Login */}
              <div className={`flex items-center justify-between p-3 bg-white rounded-lg border ${!hasValidSession ? 'border-gray-200 opacity-60' : 'border-indigo-100'}`}>
                <div className="flex items-center gap-2">
                  <Clock className={`w-5 h-5 ${!hasValidSession ? 'text-gray-400' : 'text-indigo-600'}`} />
                  <span className="text-sm">Session Duration</span>
                </div>
                <span className={!hasValidSession ? 'text-gray-500 text-sm' : 'text-indigo-900'}>{formatLastLogin()}</span>
              </div>

              {/* Profile Completion */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm">Profile Completion</span>
                  </div>
                  <span className="text-indigo-900">{calculateProfileCompletion()}%</span>
                </div>
                <Progress value={calculateProfileCompletion()} className="h-2" />
                {calculateProfileCompletion() < 100 && (
                  <p className="text-xs text-indigo-600 mt-1">
                    {calculateProfileCompletion() < 75 ? 'Add a bio to complete your profile!' : 'Almost there!'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Edit Profile with Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal details and password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Information Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={user.user_metadata.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio (optional)</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Tell us a bit about yourself..."
                  defaultValue={user.user_metadata.bio || ''}
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Change Password</span>
              </div>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old-password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Current Password
                </Label>
                <Input
                  id="old-password"
                  name="old-password"
                  type="password"
                  placeholder="Enter current password"
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  New Password
                </Label>
                <Input
                  id="new-password"
                  name="new-password"
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  minLength={6}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <PasswordStrengthIndicator password={newPassword} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  minLength={6}
                />
              </div>
              <Button 
                type="submit" 
                variant="outline"
                className="w-full" 
                disabled={changingPassword}
              >
                {changingPassword ? 'Changing Password...' : 'Update Password'}
              </Button>
            </form>

            {/* Forgot Password Section */}
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-600 mb-3">
                Forgot your current password? We can send you a reset link.
              </p>
              <Button 
                type="button"
                variant="ghost"
                className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" 
                onClick={handleForgotPassword}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Reset Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Delete Account
          </CardTitle>
          <CardDescription>Irreversible account actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700">
            Once you delete your account, there is no going back. This will permanently delete:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Your profile information</li>
            <li>All your progress records</li>
            <li>Your forum posts and replies</li>
            <li>Any assessments you've created (for teachers)</li>
          </ul>
          <Button
            variant="destructive"
            className="w-full mt-4"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account Permanently
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <button
              className="px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              >
                Cancel
                </button>
                </AlertDialogCancel>
                
                <AlertDialogAction asChild>
                  <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                  disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
                    </button>
                    </AlertDialogAction>
                    </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}