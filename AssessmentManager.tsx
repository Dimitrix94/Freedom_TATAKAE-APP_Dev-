import { useState, useEffect } from 'react';
import { getServerUrl } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Edit, Trash2, ClipboardList, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Question {
  id: string;
  type: 'multiple-choice' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  points: number;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  questions: Question[];
  createdAt: string;
}

interface AssessmentManagerProps {
  session: any;
}

export function AssessmentManager({ session }: AssessmentManagerProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await fetch(getServerUrl('/assessments'), {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      setAssessments(data.assessments || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateQuestionOption = (qIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    const options = [...(updated[qIndex].options || [])];
    options[optionIndex] = value;
    updated[qIndex].options = options;
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const assessmentData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      duration: parseInt(formData.get('duration') as string),
      questions: questions,
    };

    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    try {
      if (editingAssessment) {
        const response = await fetch(getServerUrl(`/assessments/${editingAssessment.id.replace('assessment:', '')}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(assessmentData),
        });

        if (!response.ok) throw new Error('Failed to update assessment');
        toast.success('Assessment updated successfully');
      } else {
        const response = await fetch(getServerUrl('/assessments'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(assessmentData),
        });

        if (!response.ok) throw new Error('Failed to create assessment');
        toast.success('Assessment created successfully');
      }

      setDialogOpen(false);
      setEditingAssessment(null);
      setQuestions([]);
      fetchAssessments();
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      console.error('Error saving assessment:', error);
      toast.error(error.message || 'Failed to save assessment');
    }
  };

  const handleDelete = async (assessmentId: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;

    try {
      const response = await fetch(getServerUrl(`/assessments/${assessmentId.replace('assessment:', '')}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete assessment');
      toast.success('Assessment deleted successfully');
      fetchAssessments();
    } catch (error: any) {
      console.error('Error deleting assessment:', error);
      toast.error(error.message || 'Failed to delete assessment');
    }
  };

  const openEditDialog = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setQuestions(assessment.questions || []);
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading assessments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-gray-900">Assessments & Quizzes</h2>
          <p className="text-gray-600 mt-1">Create and manage quizzes and assignments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingAssessment(null);
            setQuestions([]);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAssessment ? 'Edit Assessment' : 'Create New Assessment'}</DialogTitle>
              <DialogDescription>
                {editingAssessment ? 'Update the assessment details and questions' : 'Create a new quiz or assignment'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Week 1 Quiz"
                    defaultValue={editingAssessment?.title}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    placeholder="30"
                    defaultValue={editingAssessment?.duration}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Brief description of the assessment"
                  defaultValue={editingAssessment?.description}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue={editingAssessment?.category || 'fundamentals'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fundamentals">Fundamentals</SelectItem>
                    <SelectItem value="design-principles">Design Principles</SelectItem>
                    <SelectItem value="usability">Usability</SelectItem>
                    <SelectItem value="prototyping">Prototyping</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <Label>Questions ({questions.length})</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Question
                  </Button>
                </div>

                <div className="space-y-4">
                  {questions.map((q, qIndex) => (
                    <Card key={q.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm">Question {qIndex + 1}</CardTitle>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(qIndex)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label>Question Text</Label>
                          <Input
                            placeholder="Enter your question"
                            value={q.question}
                            onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                              value={q.type}
                              onValueChange={(value) => updateQuestion(qIndex, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                <SelectItem value="short-answer">Short Answer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Points</Label>
                            <Input
                              type="number"
                              min="1"
                              value={q.points}
                              onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                              required
                            />
                          </div>
                        </div>
                        {q.type === 'multiple-choice' && (
                          <div className="space-y-2">
                            <Label>Options</Label>
                            {q.options?.map((option, oIndex) => (
                              <div key={oIndex} className="flex gap-2">
                                <Input
                                  placeholder={`Option ${oIndex + 1}`}
                                  value={option}
                                  onChange={(e) => updateQuestionOption(qIndex, oIndex, e.target.value)}
                                  required
                                />
                                <Button
                                  type="button"
                                  variant={q.correctAnswer === oIndex ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                                >
                                  {q.correctAnswer === oIndex ? '✓ Correct' : 'Mark Correct'}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        {q.type === 'short-answer' && (
                          <div className="space-y-2">
                            <Label>Correct Answer</Label>
                            <Textarea
                              placeholder="Enter the correct answer (for grading reference)"
                              value={typeof q.correctAnswer === 'string' ? q.correctAnswer : ''}
                              onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                              rows={3}
                              required
                            />
                            <p className="text-xs text-gray-500">
                              This will be used to grade student responses. For partial credit, manual review may be needed.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => {
                  setDialogOpen(false);
                  setEditingAssessment(null);
                  setQuestions([]);
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAssessment ? 'Update Assessment' : 'Create Assessment'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No assessments yet. Create your first quiz!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-1">{assessment.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1">
                  {assessment.description}
                </CardDescription>
                <div className="flex gap-2 mt-3">
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {assessment.category}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {assessment.duration} min
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {assessment.questions?.length || 0} questions
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(assessment)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(assessment.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}