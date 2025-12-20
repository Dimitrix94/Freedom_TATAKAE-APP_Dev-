import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MessageSquare,
  Loader2,
  TrendingUp,
  Award
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface MyResultsProps {
  session: any;
}

interface Submission {
  id: string;
  userId: string;
  assessmentId: string;
  assessmentTitle: string;
  assessmentCategory: string;
  answers: any[];
  score: number;
  totalQuestions: number;
  submittedAt: string;
  feedback?: string;
  manualScore?: number;
  feedbackProvidedByName?: string;
  feedbackProvidedAt?: string;
}

export function MyResults({ session }: MyResultsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyResults();
  }, []);

  const fetchMyResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d59960c4/submissions/my-results`,
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
        let errorMessage = 'Failed to fetch results';
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
      // Sort by submission date, newest first
      const sorted = (data.submissions || []).sort((a: Submission, b: Submission) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      setSubmissions(sorted);
    } catch (error: any) {
      console.error('Error fetching results:', error);
      toast.error(error.message || 'Failed to load results');
    } finally {
      setLoading(false);
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

  const getScoreBadgeVariant = (score: number, total: number): "default" | "secondary" | "outline" | "destructive" => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'default';
    if (percentage >= 60) return 'secondary';
    return 'destructive';
  };

  const calculateOverallStats = () => {
    if (submissions.length === 0) return { average: 0, total: 0, withFeedback: 0 };
    
    const totalScore = submissions.reduce((acc, sub) => {
      const score = sub.manualScore !== undefined ? sub.manualScore : sub.score;
      const percentage = (score / sub.totalQuestions) * 100;
      return acc + percentage;
    }, 0);
    
    const withFeedback = submissions.filter(sub => sub.feedback).length;
    
    return {
      average: Math.round(totalScore / submissions.length),
      total: submissions.length,
      withFeedback,
    };
  };

  const stats = calculateOverallStats();

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
        <h2 className="text-gray-900">My Results</h2>
        <p className="text-gray-600">
          View your assessment scores and teacher feedback
        </p>
      </div>

      {/* Stats Cards */}
      {submissions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <Award className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-2xl text-gray-900">{stats.average}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">With Feedback</p>
                  <p className="text-2xl text-gray-900">{stats.withFeedback}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results List */}
      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                You haven&apos;t completed any assessments yet
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Go to the Practice tab to start taking assessments
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission) => {
            const finalScore = submission.manualScore !== undefined ? submission.manualScore : submission.score;
            const percentage = Math.round((finalScore / submission.totalQuestions) * 100);

            return (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-indigo-900">
                          {submission.assessmentTitle}
                        </CardTitle>
                        {submission.feedback && (
                          <Badge variant="secondary" className="gap-1">
                            <MessageSquare className="w-3 h-3" />
                            Feedback Available
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        {submission.assessmentCategory} • Submitted {formatDate(submission.submittedAt)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl ${getScoreColor(finalScore, submission.totalQuestions)}`}>
                        {finalScore}/{submission.totalQuestions}
                      </div>
                      <Badge 
                        variant={getScoreBadgeVariant(finalScore, submission.totalQuestions)}
                        className="mt-1"
                      >
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                {submission.feedback && (
                  <CardContent>
                    <div className="bg-indigo-50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        <h4 className="text-indigo-900">Teacher Feedback</h4>
                      </div>
                      
                      {submission.manualScore !== undefined && submission.manualScore !== submission.score && (
                        <div className="bg-white p-3 rounded border border-indigo-200">
                          <p className="text-sm text-gray-600">
                            Your score was adjusted from {submission.score} to {submission.manualScore} by your teacher
                          </p>
                        </div>
                      )}

                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {submission.feedback}
                      </p>

                      {submission.feedbackProvidedByName && submission.feedbackProvidedAt && (
                        <p className="text-xs text-gray-500 pt-2 border-t border-indigo-200">
                          Feedback by {submission.feedbackProvidedByName} on {formatDate(submission.feedbackProvidedAt)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                )}

                {!submission.feedback && (
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        No teacher feedback yet
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}