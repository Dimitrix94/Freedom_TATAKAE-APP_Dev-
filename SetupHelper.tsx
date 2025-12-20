import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, Database, CheckCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export function SetupHelper() {
  const sqlFix = `UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;`;

  const autoRunSQL = `-- Create a function to auto-confirm emails
CREATE OR REPLACE FUNCTION auto_confirm_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE email_confirmed_at IS NULL;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION auto_confirm_users() TO authenticated, anon;

-- Optional: Create a trigger to auto-confirm on user creation
CREATE OR REPLACE FUNCTION trigger_auto_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_confirm();`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('SQL copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="max-w-3xl shadow-2xl border-red-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div>
              <CardTitle className="text-red-900">Setup Required</CardTitle>
              <CardDescription>
                Your Supabase database needs to be configured before you can use FreeLearning
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-yellow-300 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-800" />
            <AlertDescription className="text-yellow-900">
              <strong>Error:</strong> Email confirmation is preventing login. Follow the steps below to fix this.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">Open Supabase Dashboard</h3>
                <p className="text-blue-800 mb-3">
                  Go to your Supabase project's authentication settings
                </p>
                <a
                  href="https://supabase.com/dashboard/project/tkrcwkgtgmlispkvnftd/auth/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Open Authentication Settings
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900 mb-2">Disable Email Confirmation</h3>
                <ul className="list-disc list-inside text-purple-800 space-y-1">
                  <li>Click on "Email" provider</li>
                  <li>Scroll down to find "Confirm email" toggle</li>
                  <li><strong>Turn OFF</strong> the "Confirm email" option</li>
                  <li>Click "Save"</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">Run SQL Fix (CRITICAL!)</h3>
                <p className="text-green-800 mb-3">
                  This confirms ALL existing users so they can log in:
                </p>
                <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm mb-3 relative">
                  <pre className="whitespace-pre-wrap">{sqlFix}</pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyToClipboard(sqlFix)}
                    className="absolute top-2 right-2"
                  >
                    Copy SQL
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-green-800">To run this:</p>
                  <ol className="list-decimal list-inside text-green-800 space-y-1 ml-4">
                    <li>Go to your Supabase Dashboard</li>
                    <li>Click "SQL Editor" in the left sidebar</li>
                    <li>Click "New Query"</li>
                    <li>Paste the SQL above</li>
                    <li>Click "Run" or press Ctrl+Enter</li>
                  </ol>
                  <a
                    href="https://supabase.com/dashboard/project/tkrcwkgtgmlispkvnftd/sql/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-green-600 hover:text-green-800 underline mt-2"
                  >
                    Open SQL Editor
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-indigo-900 mb-2">(OPTIONAL) Set Up Auto-Confirmation</h3>
                <p className="text-indigo-800 mb-3">
                  Want this to run automatically? Set up a database trigger:
                </p>
                <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm mb-3 relative max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs">{autoRunSQL}</pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyToClipboard(autoRunSQL)}
                    className="absolute top-2 right-2"
                  >
                    Copy SQL
                  </Button>
                </div>
                <Alert className="border-indigo-300 bg-indigo-100">
                  <Database className="h-4 w-4 text-indigo-800" />
                  <AlertDescription className="text-indigo-900 text-sm">
                    This creates a database trigger that auto-confirms emails for ALL new signups. Run this in SQL Editor after step 3.
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-teal-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center">
                5
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-teal-900 mb-2">Refresh & Login</h3>
                <p className="text-teal-800 mb-3">
                  After completing the steps above, refresh this page and try logging in again.
                </p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>

          <Alert className="border-green-300 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-800" />
            <AlertDescription className="text-green-900">
              <strong>After this one-time setup,</strong> all new signups will work instantly without email confirmation!
            </AlertDescription>
          </Alert>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              Need help? Check the <code className="bg-gray-100 px-2 py-1 rounded">SUPABASE_SETUP.md</code> and{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">DEBUG_AUTH.md</code> files for detailed instructions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}