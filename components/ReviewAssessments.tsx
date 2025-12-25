import React, { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar,
  ArrowLeft,
  FileText,
  Award,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

interface Assessment {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Submission {
  id: string;
  assessment_id: string;
  student_id: string;
  answers: number[];
  score: number;
  max_score: number;
  submitted_at: string;
  assessment_title?: string;
  assessment_description?: string;
  assessment_questions?: Question[];
}

interface ReviewAssessmentsProps {
  studentId: string;
}

export default function ReviewAssessments({ studentId }: ReviewAssessmentsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchSubmissions();
  }, [studentId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      
      // Fetch all submissions for this student
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('kv_store_d59960c4')
        .select('key, value')
        .like('key', `submission:${studentId}:%`);

      if (submissionsError) throw submissionsError;

      // Fetch all assessments to get titles and questions
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('kv_store_d59960c4')
        .select('key, value')
        .like('key', 'assessment:%');

      if (assessmentsError) throw assessmentsError;

      // Create a map of assessments
      const assessmentsMap: { [key: string]: Assessment } = {};
      assessmentsData?.forEach((item) => {
        const assessment = JSON.parse(item.value);
        assessmentsMap[assessment.id] = assessment;
      });

      // Parse submissions and enrich with assessment data
      const parsedSubmissions: Submission[] = (submissionsData || [])
        .map((item) => {
          const submission = JSON.parse(item.value);
          const assessment = assessmentsMap[submission.assessment_id];
          
          return {
            ...submission,
            assessment_title: assessment?.title || 'Unknown Assessment',
            assessment_description: assessment?.description || '',
            assessment_questions: assessment?.questions || []
          };
        })
        .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

      setSubmissions(parsedSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (score: number, maxScore: number) => {
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (percentage: number): "default" | "secondary" | "destructive" | "outline" => {
    if (percentage >= 90) return 'default';
    if (percentage >= 70) return 'secondary';
    if (percentage >= 50) return 'outline';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your assessment history...</p>
        </div>
      </div>
    );
  }

  // Review view - showing individual assessment with answers
  if (selectedSubmission) {
    const percentage = getPercentage(selectedSubmission.score, selectedSubmission.max_score);
    const correctCount = selectedSubmission.answers.filter(
      (answer, index) => answer === selectedSubmission.assessment_questions![index].correctAnswer
    ).length;
    const incorrectCount = selectedSubmission.assessment_questions!.length - correctCount;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-lg shadow-lg p-8 text-white">
          <Button
            variant="ghost"
            onClick={() => setSelectedSubmission(null)}
            className="mb-4 text-white hover:bg-white/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Assessments
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl mb-2">{selectedSubmission.assessment_title}</h1>
              {selectedSubmission.assessment_description && (
                <p className="text-white/90 mb-4">{selectedSubmission.assessment_description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-white/80">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Submitted: {format(new Date(selectedSubmission.submitted_at), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{format(new Date(selectedSubmission.submitted_at), 'h:mm a')}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-4xl mb-1">{percentage}%</div>
                <div className="text-sm text-white/80">
                  {selectedSubmission.score} / {selectedSubmission.max_score} points
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl">{correctCount}</div>
                  <div className="text-sm text-muted-foreground">Correct Answers</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl">{incorrectCount}</div>
                  <div className="text-sm text-muted-foreground">Incorrect Answers</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl">{selectedSubmission.assessment_questions!.length}</div>
                  <div className="text-sm text-muted-foreground">Total Questions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions Review */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Review</CardTitle>
            <CardDescription>
              Review each question to understand what you got right and what needs improvement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {selectedSubmission.assessment_questions!.map((question, index) => {
                  const userAnswer = selectedSubmission.answers[index];
                  const isCorrect = userAnswer === question.correctAnswer;

                  return (
                    <div key={question.id} className="space-y-3">
                      {/* Question Header */}
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                          isCorrect ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <h4 className="font-medium">
                              Question {index + 1}
                            </h4>
                            <Badge variant={isCorrect ? 'default' : 'destructive'}>
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mt-1">{question.question}</p>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="ml-11 space-y-2">
                        {question.options.map((option, optionIndex) => {
                          const isUserAnswer = userAnswer === optionIndex;
                          const isCorrectAnswer = question.correctAnswer === optionIndex;
                          
                          let optionClass = 'border-2 p-3 rounded-lg transition-colors';
                          
                          if (isCorrectAnswer) {
                            optionClass += ' border-green-500 bg-green-50';
                          } else if (isUserAnswer && !isCorrect) {
                            optionClass += ' border-red-500 bg-red-50';
                          } else {
                            optionClass += ' border-gray-200 bg-gray-50';
                          }

                          return (
                            <div key={optionIndex} className={optionClass}>
                              <div className="flex items-center justify-between">
                                <span className={isCorrectAnswer || isUserAnswer ? 'font-medium' : ''}>
                                  {String.fromCharCode(65 + optionIndex)}. {option}
                                </span>
                                <div className="flex items-center gap-2">
                                  {isUserAnswer && (
                                    <Badge variant="outline" className="text-xs">
                                      Your Answer
                                    </Badge>
                                  )}
                                  {isCorrectAnswer && (
                                    <Badge variant="default" className="text-xs bg-green-600">
                                      Correct Answer
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation for incorrect answers */}
                      {!isCorrect && (
                        <div className="ml-11 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-900 mb-1">Learning Point</p>
                              <p className="text-sm text-blue-800">
                                The correct answer is <strong>{String.fromCharCode(65 + question.correctAnswer)}. {question.options[question.correctAnswer]}</strong>. 
                                Review this topic in your learning materials to strengthen your understanding.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {index < selectedSubmission.assessment_questions!.length - 1 && (
                        <Separator className="my-6" />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view - showing all submissions
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8" />
          <h1 className="text-3xl">Review Past Assessments</h1>
        </div>
        <p className="text-white/90">
          Review your submitted assessments and learn from your mistakes
        </p>
      </div>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Assessments Yet</h3>
              <p className="text-muted-foreground">
                You haven't submitted any assessments yet. Complete an assessment to see it here!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission) => {
            const percentage = getPercentage(submission.score, submission.max_score);
            const correctCount = submission.answers.filter(
              (answer, index) => answer === submission.assessment_questions![index]?.correctAnswer
            ).length;

            return (
              <Card 
                key={submission.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedSubmission(submission)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium">{submission.assessment_title}</h3>
                        <Badge variant={getScoreBadgeVariant(percentage)}>
                          {percentage}%
                        </Badge>
                      </div>
                      
                      {submission.assessment_description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {submission.assessment_description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(submission.submitted_at), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(submission.submitted_at), 'h:mm a')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className={`text-3xl ${getScoreColor(percentage)}`}>
                        {submission.score}/{submission.max_score}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {correctCount} of {submission.assessment_questions!.length} correct
                      </div>
                      <Button size="sm" className="w-full">
                        Review Answers
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          percentage >= 90 ? 'bg-green-600' :
                          percentage >= 70 ? 'bg-blue-600' :
                          percentage >= 50 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
