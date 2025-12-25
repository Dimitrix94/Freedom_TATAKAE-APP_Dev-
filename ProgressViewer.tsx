import { useState, useEffect } from 'react';
import { getServerUrl, serverFetch } from '../utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart, Plus, TrendingUp, Edit, Trash2, Filter, Download, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { jsPDF } from 'jspdf';
import { ResponsiveContainer, BarChart as ReBarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

interface ProgressRecord {
  id?: string;
  studentId: string;
  topic: string;
  assessmentType?: string;
  score: number;
  notes: string;
  recordedAt: string;
  recordedBy?: string;
  studentName?: string;
  className?: string;
  studentEmail?: string;
}

interface ProgressTrackerProps {
  session: any;
  userId?: string;
  userRole: 'teacher' | 'student';
}

export function ProgressTracker({ session, userId, userRole }: ProgressTrackerProps) {
  const [progressData, setProgressData] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [currentRecord, setCurrentRecord] = useState<ProgressRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  
  // Filters for students
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [assessmentTypeFilter, setAssessmentTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [filteredData, setFilteredData] = useState<ProgressRecord[]>([]);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [threshold, setThreshold] = useState<number>(70);
  const [sortKey, setSortKey] = useState<string>('recordedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (userRole === 'student' && userId) {
      fetchProgress(userId);
    }
  }, [userId, userRole]);

  useEffect(() => {
    applyFilters();
  }, [progressData, topicFilter, assessmentTypeFilter, dateFilter]);

  const fetchProgress = async (studentId: string) => {
    setLoading(true);
    try {
      const response = await fetch(getServerUrl(`/progress/${studentId}`), {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      const email = studentId.includes('@') ? studentId : '';
      const enriched = (data.progress || []).map((r: any) => ({ ...r, studentEmail: r.studentEmail || email }));
      setProgressData(enriched);
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const getUniqueTopics = () => {
    const topics = new Set(progressData.map(r => r.topic));
    return Array.from(topics);
  };

  const getUniqueAssessmentTypes = () => {
    const types = new Set(progressData.map(r => r.assessmentType || 'General'));
    return Array.from(types);
  };

  const getUniqueClasses = () => {
    const classes = new Set((progressData || []).map(r => r.className || 'Unassigned'));
    return Array.from(classes);
  };

  const fetchAllProgress = async () => {
    setLoading(true);
    try {
      const response = await serverFetch(`/progress`);
      const data = await response.json();
      setProgressData(data.progress || []);
    } catch (error) {
      toast.error('Failed to load overview progress');
    } finally {
      setLoading(false);
    }
  };

  const AnalyticsCharts = ({ records }: { records: ProgressRecord[] }) => {
    const topicAverages = (() => {
      const map: Record<string, { sum: number; count: number }> = {};
      records.forEach(r => {
        const key = r.topic || 'Unknown';
        if (!map[key]) map[key] = { sum: 0, count: 0 };
        map[key].sum += r.score;
        map[key].count += 1;
      });
      return Object.entries(map).map(([topic, { sum, count }]) => ({ topic, average: Math.round(sum / count) }));
    })();

    const trendData = records
      .slice()
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .map(r => ({ date: new Date(r.recordedAt).toLocaleDateString(), score: r.score }));

    const normalizeType = (t?: string) => {
      const v = (t || '').toLowerCase();
      if (v === 'general') return 'Fundamentals';
      if (v === 'exam') return 'Prototyping';
      return t || 'Fundamentals';
    };
    const typeCounts = (() => {
      const map: Record<string, number> = {};
      records.forEach(r => {
        const key = normalizeType(r.assessmentType);
        map[key] = (map[key] || 0) + 1;
      });
      return Object.entries(map).map(([type, value]) => ({ type, value }));
    })();
    const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#0EA5E9'];

    const classAverages = (() => {
      const cmap: Record<string, { sum: number; count: number }> = {};
      records.forEach(r => {
        const key = r.className || 'Unassigned';
        if (!cmap[key]) cmap[key] = { sum: 0, count: 0 };
        cmap[key].sum += r.score;
        cmap[key].count += 1;
      });
      return Object.entries(cmap).map(([name, { sum, count }]) => ({ name, average: Math.round(sum / count) }));
    })();

    return (
      <>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={topicAverages}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="topic" hide={topicAverages.length > 8} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="average" fill="#4F46E5" name="Avg Score" />
            </ReBarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#10B981" name="Score" dot={false} isAnimationActive animationDuration={600} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie data={typeCounts} dataKey="value" nameKey="type" innerRadius={50} outerRadius={90} label>
                {typeCounts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {classAverages.length > 0 && (
        <div className="mt-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={classAverages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" fill="#0EA5E9" name="Avg Score per Class" isAnimationActive animationDuration={600} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      </>
    );
  };

  const handleAddProgress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const progressRecord = {
      studentId: formData.get('studentId') as string,
      topic: formData.get('topic') as string,
      assessmentType: formData.get('assessmentType') as string || 'General',
      score: parseInt(formData.get('score') as string),
      notes: formData.get('notes') as string,
      studentName: formData.get('studentName') as string,
      className: formData.get('className') as string,
      studentEmail: formData.get('studentEmail') as string,
    };

    try {
      const response = await serverFetch('/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressRecord),
      });

      if (!response.ok) {
        let message = 'Failed to add progress';
        try {
          const data = await response.json();
          if (data?.error) message = data.error;
        } catch {}
        throw new Error(message);
      }
      
      toast.success('Progress record added successfully');
      setDialogOpen(false);
      (e.target as HTMLFormElement).reset();
      
      // Refresh if viewing the same student
      if (progressRecord.studentId === userId || progressRecord.studentId === studentIdInput) {
        fetchProgress(progressRecord.studentId);
      }
    } catch (error: any) {
      console.error('Error adding progress:', error);
      toast.error(error.message || 'Failed to add progress');
    }
  };

  const handleEditProgress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentRecord?.id) return;

    const formData = new FormData(e.currentTarget);

    const updates = {
      topic: formData.get('topic') as string,
      assessmentType: formData.get('assessmentType') as string,
      score: parseInt(formData.get('score') as string),
      notes: formData.get('notes') as string,
      studentName: formData.get('studentName') as string,
      className: formData.get('className') as string,
    };

    try {
      const response = await fetch(getServerUrl(`/progress/${currentRecord.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update progress');
      
      toast.success('Progress record updated successfully');
      setEditDialogOpen(false);
      setCurrentRecord(null);
      
      // Refresh the current view
      if (studentIdInput) {
        fetchProgress(studentIdInput);
      }
    } catch (error: any) {
      console.error('Error updating progress:', error);
      toast.error(error.message || 'Failed to update progress');
    }
  };

  const handleDeleteProgress = async () => {
    if (!recordToDelete) return;

    try {
      const response = await fetch(getServerUrl(`/progress/${recordToDelete}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete progress');
      
      toast.success('Progress record deleted successfully');
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      
      // Refresh the current view
      if (studentIdInput) {
        fetchProgress(studentIdInput);
      }
    } catch (error: any) {
      console.error('Error deleting progress:', error);
      toast.error(error.message || 'Failed to delete progress');
    }
  };

  const openEditDialog = (record: ProgressRecord) => {
    setCurrentRecord(record);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (recordId: string) => {
    setRecordToDelete(recordId);
    setDeleteDialogOpen(true);
  };

  const calculateAverageScore = () => {
    if (filteredData.length === 0) return 0;
    const sum = filteredData.reduce((acc, record) => acc + record.score, 0);
    return Math.round(sum / filteredData.length);
  };

  const Gauge = ({ value }: { value: number }) => {
    const data = [
      { name: 'Score', value },
      { name: 'Remaining', value: Math.max(0, 100 - value) },
    ];
    return (
      <div className="relative h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={60} outerRadius={80} startAngle={180} endAngle={-180} dataKey="value">
              <Cell fill="#6366F1" />
              <Cell fill="#E5E7EB" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-3xl text-indigo-600">{value}%</div>
        </div>
      </div>
    );
  };
