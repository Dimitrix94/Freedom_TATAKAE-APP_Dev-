import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MessageSquare,
  Save,
  Loader2
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface AssessmentResultsProps {
  session: any;
}

interface Submission {
  id: string;
  userId: string;
  assessmentId: string;
  studentName: string;
  studentEmail: string;
  assessmentTitle: string;
  answers: any[];
  score: number;
  totalQuestions: number;
  submittedAt: string;
  feedback?: string;
  manualScore?: number;
  feedbackProvidedBy?: string;
  feedbackProvidedByName?: string;
  feedbackProvidedAt?: string;
}

export function AssessmentResults({ session }: AssessmentResultsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [feedback, setFeedback] = useState('');
  const [manualScore, setManualScore] = useState<number | null>(null);
  const [savingFeedback, setSavingFeedback] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d59960c4/submissions`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        // Clone the response before trying to read it
        const clonedResponse = response.clone();
        let errorMessage = 'Failed to fetch submissions';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If JSON parsing fails, read as text from the cloned response
          const textError = await clonedResponse.text();
          console.error('Non-JSON error response:', textError);
          errorMessage = `Server returned status ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      toast.error(error.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleProvideFeedback = (submission: Submission) => {
    setSelectedSubmission(submission);
    setFeedback(submission.feedback || '');
    setManualScore(submission.manualScore !== undefined ? submission.manualScore : null);
  };

  const saveFeedback = async () => {
    if (!selectedSubmission) return;

    try {
      setSavingFeedback(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d59960c4/submissions/${selectedSubmission.id}/feedback`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedback,
            manualScore,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save feedback');
      }

      toast.success('Feedback saved successfully');
      setSelectedSubmission(null);
      setFeedback('');
      setManualScore(null);
      fetchSubmissions();
    } catch (error: any) {
      console.error('Error saving feedback:', error);
      toast.error(error.message || 'Failed to save feedback');
    } finally {
      setSavingFeedback(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Assessment Results & Feedback</h2>
        <p className="text-gray-600">
          Review student submissions and provide feedback
        </p>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No submissions yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-indigo-900">
                      {submission.assessmentTitle}
                    </CardTitle>
                    <CardDescription>
                      <span className="text-gray-900">{submission.studentName}</span>
                      {' '}({submission.studentEmail})
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl ${getScoreColor(submission.manualScore ?? submission.score, submission.totalQuestions)}`}>
                      {submission.manualScore !== undefined ? submission.manualScore : submission.score}/{submission.totalQuestions}
                    </div>
                    <p className="text-sm text-gray-500">
                      {Math.round(((submission.manualScore ?? submission.score) / submission.totalQuestions) * 100)}%
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Submitted: {formatDate(submission.submittedAt)}</span>
                  {submission.feedback && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Feedback Provided
                    </Badge>
                  )}
                </div>

                {submission.feedback && (
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm text-indigo-900">Your Feedback</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{submission.feedback}</p>
                    {submission.feedbackProvidedByName && submission.feedbackProvidedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        By {submission.feedbackProvidedByName} on {formatDate(submission.feedbackProvidedAt)}
                      </p>
                    )}
                  </div>
                )}

                <Button
                  onClick={() => handleProvideFeedback(submission)}
                  variant={submission.feedback ? "outline" : "default"}
                  className="w-full"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {submission.feedback ? 'Edit Feedback' : 'Provide Feedback'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Feedback Modal/Panel */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Provide Feedback</CardTitle>
              <CardDescription>
                {selectedSubmission.studentName} - {selectedSubmission.assessmentTitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Auto Score:</span>
                    <span className="ml-2 text-gray-900">
                      {selectedSubmission.score}/{selectedSubmission.totalQuestions}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Submitted:</span>
                    <span className="ml-2 text-gray-900">
                      {formatDate(selectedSubmission.submittedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manualScore">Adjusted Score (Optional)</Label>
                <Input
                  id="manualScore"
                  type="number"
                  min="0"
                  max={selectedSubmission.totalQuestions}
                  value={manualScore ?? ''}
                  onChange={(e) => setManualScore(e.target.value ? Number(e.target.value) : null)}
                  placeholder={`Auto score: ${selectedSubmission.score}`}
                />
                <p className="text-xs text-gray-500">
                  Leave empty to use the auto-graded score of {selectedSubmission.score}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide constructive feedback for the student..."
                  rows={8}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedSubmission(null);
                    setFeedback('');
                    setManualScore(null);
                  }}
                  disabled={savingFeedback}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveFeedback}
                  disabled={savingFeedback}
                >
                  {savingFeedback ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Feedback
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}