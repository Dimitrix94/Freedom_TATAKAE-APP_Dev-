import { useState, useEffect } from "react";
import {
  getServerUrl,
  serverFetch,
} from "../utils/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Progress } from "./ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  BarChart,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Edit,
  Trash2,
  Filter,
  Download,
  User as UserIcon,
  User,
  AlertTriangle,
  CheckCircle2,
  FileText,
  MessageSquare,
  Target,
  Award,
  AlertCircle,
  Calendar,
  BookOpen,
  Check,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { jsPDF } from "jspdf";
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ReportPage } from "./ReportPage";
import { ChibiCharacter } from "./ChibiCharacter";

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
  userRole: "teacher" | "student";
}

export function ProgressTracker({
  session,
  userId,
  userRole,
}: ProgressTrackerProps) {
  const [progressData, setProgressData] = useState<
    ProgressRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false);
  const [studentIdInput, setStudentIdInput] = useState("");
  const [currentRecord, setCurrentRecord] =
    useState<ProgressRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<
    string | null
  >(null);

  // Filters for students
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [assessmentTypeFilter, setAssessmentTypeFilter] =
    useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [filteredData, setFilteredData] = useState<
    ProgressRecord[]
  >([]);
  //const [classFilter, setClassFilter] = useState<string>('all');
  const [threshold, setThreshold] = useState<number>(70);
  const [sortKey, setSortKey] = useState<string>("recordedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(
    "desc",
  );
  const [reportData, setReportData] = useState<
    ProgressRecord[] | null
  >(null);
  const [emailMap, setEmailMap] = useState<
    Record<string, string>
  >({});
  const [teacherNotes, setTeacherNotes] = useState<
    Record<string, string>
  >({});
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState<
    string | null
  >(null);
  const [atRiskDialogOpen, setAtRiskDialogOpen] = useState(false);

  // Assume selectedStudentId is from a dropdown or list selection (string | null)
  useEffect(() => {
    if (!userRole) return;

    if (userRole === "student" && userId) {
      // Students see their own progress
      fetchProgress(userId);
      return;
    }

    if (userRole === "teacher") {
      if (userId) {
        // Teacher views a specific student
        fetchProgress(userId);
      } else {
        // Teacher overview when no student selected
        fetchAllProgress();
      }
    }
  }, [userRole, userId]);

  useEffect(() => {
    applyFilters();
  }, [
    progressData,
    topicFilter,
    assessmentTypeFilter,
    dateFilter,
  ]);

  const fetchProgress = async (studentId: string) => {
    setShowReport(false);
    setReportData(null);
    setLoading(true);
    try {
      const response = await serverFetch(
        `/progress/${studentId}`,
      );
      let data: any = null;
      try {
        data = await response.json();
      } catch {}
      if (!response.ok) {
        const serverMsg =
          data && (data.error || data.message)
            ? data.error || data.message
            : `HTTP ${response.status}`;
        throw new Error(serverMsg);
      }
      let records: ProgressRecord[] = data.progress || [];
      const emailFromInput = studentId.includes("@")
        ? studentId
        : "";
      // Student view: use session email
      if (userRole === "student" && session?.user?.email) {
        const em = session.user.email;
        const ids = Array.from(
          new Set(
            records.map((r) => r.studentId).filter(Boolean),
          ),
        );
        if (ids.length)
          setEmailMap((prev) => ({
            ...prev,
            ...Object.fromEntries(ids.map((id) => [id, em])),
          }));
        records = records.map((r) => ({
          ...r,
          studentEmail: em,
        }));
      } else if (emailFromInput) {
        const ids = Array.from(
          new Set(
            records.map((r) => r.studentId).filter(Boolean),
          ),
        );
        if (ids.length)
          setEmailMap((prev) => ({
            ...prev,
            ...Object.fromEntries(
              ids.map((id) => [id, emailFromInput]),
            ),
          }));
        records = records.map((r) => ({
          ...r,
          studentEmail: emailFromInput,
        }));
      } else {
        // Teacher/admin querying by ID: fetch email from server
        const uniqueIds = Array.from(
          new Set(
            records.map((r) => r.studentId).filter(Boolean),
          ),
        );
        const emailMap: Record<string, string> = {};
        await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const res = await serverFetch(`/user/${id}`);
              if (res.ok) {
                const info = await res.json();
                if (info?.email) emailMap[id] = info.email;
              }
            } catch {}
          }),
        );
        if (Object.keys(emailMap).length)
          setEmailMap((prev) => ({ ...prev, ...emailMap }));
        records = records.map((r) => ({
          ...r,
          studentEmail:
            r.studentEmail && r.studentEmail.includes("@")
              ? r.studentEmail
              : emailMap[r.studentId] || "",
        }));
      }
      setProgressData(records);
    } catch (error: any) {
      console.error("Error fetching progress:", error);
      const msg = (error?.message || "")
        .toLowerCase()
        .includes("unauthorized")
        ? "Unauthorized: please login as a teacher or the student"
        : error?.message || "Failed to load progress data";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getUniqueTopics = () => {
    const topics = new Set(progressData.map((r) => r.topic));
    return Array.from(topics);
  };

  const getUniqueAssessmentTypes = () => {
    const types = new Set(
      progressData.map((r) => r.assessmentType || "General"),
    );
    return Array.from(types);
  };

  const getUniqueClasses = () => {
    const classes = new Set(
      (progressData || []).map(
        (r) => r.className || "Unassigned",
      ),
    );
    return Array.from(classes);
  };

  const fetchAllProgress = async () => {
    setShowReport(false);
    setReportData(null);
    setLoading(true);
    try {
      const response = await serverFetch(`/progress`);
      let data: any = null;
      try {
        data = await response.json();
      } catch {}
      if (!response.ok) {
        const serverMsg =
          data && (data.error || data.message)
            ? data.error || data.message
            : `HTTP ${response.status}`;
        throw new Error(serverMsg);
      }
      let records: ProgressRecord[] = data.progress || [];
      // Enrich emails by looking up each unique studentId
      const uniqueIds = Array.from(
        new Set(
          records.map((r) => r.studentId).filter(Boolean),
        ),
      );
      const emap: Record<string, string> = {};
      await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const res = await serverFetch(`/user/${id}`);
            if (res.ok) {
              const info = await res.json();
              if (info?.email) emap[id] = info.email;
            }
          } catch {}
        }),
      );
      if (Object.keys(emap).length)
        setEmailMap((prev) => ({ ...prev, ...emap }));
      records = records.map((r) => ({
        ...r,
        studentEmail:
          r.studentEmail && r.studentEmail.includes("@")
            ? r.studentEmail
            : emap[r.studentId] || "",
      }));
      setProgressData(records);
    } catch (error: any) {
      const msg = (error?.message || "")
        .toLowerCase()
        .includes("unauthorized")
        ? "Unauthorized: teachers/admin only"
        : error?.message || "Failed to load overview progress";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const AnalyticsCharts = ({
    records,
  }: {
    records: ProgressRecord[];
  }) => {
    useEffect(() => {
      const id = setTimeout(() => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("resize"));
        }
      }, 50);
      return () => clearTimeout(id);
    }, [records.length]);
    const topicAverages = (() => {
      const map: Record<
        string,
        { sum: number; count: number }
      > = {};
      records.forEach((r) => {
        const key = r.topic || "Unknown";
        if (!map[key]) map[key] = { sum: 0, count: 0 };
        map[key].sum += Number(r.score || 0);
        map[key].count += 1;
      });
      return Object.entries(map)
        .map(([topic, { sum, count }]) => ({
          topic,
          average: count ? Math.round(sum / count) : 0,
        }))
        .filter((d) => Number.isFinite(d.average));
    })();

    const trendData = records
      .slice()
      .sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() -
          new Date(b.recordedAt).getTime(),
      )
      .map((r) => ({
        date: new Date(r.recordedAt).toLocaleDateString(),
        score: Number(r.score || 0),
      }))
      .filter((d) => Number.isFinite(d.score));

    const normalizeType = (t?: string) => {
      const v = (t || "").toLowerCase();
      if (v === "general") return "Fundamentals";
      if (v === "exam") return "Prototyping";
      return t || "Fundamentals";
    };
    const typeCounts = (() => {
      const map: Record<string, number> = {};
      records.forEach((r) => {
        const key = normalizeType(r.assessmentType);
        map[key] = (map[key] || 0) + 1;
      });
      return Object.entries(map)
        .map(([type, value]) => ({ type, value }))
        .filter((d) => Number.isFinite(d.value) && d.value > 0);
    })();
    const colors = [
      "#6366F1",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#0EA5E9",
    ];
    const safeTopicAverages = topicAverages.length
      ? topicAverages
      : [{ topic: "No Data", average: 0 }];
    const safeTrendData = trendData.length
      ? trendData
      : [{ date: "No Data", score: 0 }];
    const safeTypeCounts = typeCounts.length
      ? typeCounts
      : [{ type: "No Data", value: 1 }];

    return (
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white rounded-xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all">
          <h4 className="text-gray-900 mb-4">Topic Performance</h4>
          <div className="flex items-center justify-center">
            <ReBarChart
              width={360}
              height={240}
              data={safeTopicAverages}
              key={`topics-${records.length}`}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="topic" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '14px' }} />
              <Bar
                dataKey="average"
                fill="#6366f1"
                name="Avg Score"
                radius={[6, 6, 0, 0]}
              />
            </ReBarChart>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all">
          <h4 className="text-gray-900 mb-4">Progress Trend</h4>
          <div className="flex items-center justify-center">
            <LineChart
              width={360}
              height={240}
              data={safeTrendData}
              key={`trend-${records.length}`}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '14px' }} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#10b981"
                strokeWidth={2}
                name="Score"
                dot={{ fill: '#10b981', r: 4 }}
                isAnimationActive
                animationDuration={600}
              />
            </LineChart>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all">
          <h4 className="text-gray-900 mb-4">Assessment Types</h4>
          <div className="flex items-center justify-center">
            <PieChart
              width={360}
              height={240}
              key={`types-${records.length}`}
            >
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '14px' }} />
              <Pie
                data={safeTypeCounts}
                dataKey="value"
                nameKey="type"
                innerRadius={50}
                outerRadius={90}
                label
              >
                {safeTypeCounts.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </div>
        </div>
      </div>
    );
  };

  const handleAddProgress = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const progressRecord = {
      studentId: formData.get("studentId") as string,
      topic: formData.get("topic") as string,
      assessmentType:
        (formData.get("assessmentType") as string) || "General",
      score: parseInt(formData.get("score") as string),
      notes: formData.get("notes") as string,
      studentName: formData.get("studentName") as string,
      className: formData.get("className") as string,
    };

    try {
      const response = await serverFetch("/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(progressRecord),
      });

      if (!response.ok) {
        let message = "Failed to add progress";
        try {
          const data = await response.json();
          if (data?.error) message = data.error;
        } catch {}
        throw new Error(message);
      }

      toast.success("Progress record added successfully");
      setDialogOpen(false);
      (e.target as HTMLFormElement).reset();

      // Refresh if viewing the same student
      if (
        progressRecord.studentId === userId ||
        progressRecord.studentId === studentIdInput
      ) {
        fetchProgress(progressRecord.studentId);
      }
    } catch (error: any) {
      console.error("Error adding progress:", error);
      toast.error(error.message || "Failed to add progress");
    }
  };

  const handleEditProgress = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    if (!currentRecord?.id) return;

    const formData = new FormData(e.currentTarget);

    const updates = {
      topic: formData.get("topic") as string,
      assessmentType: formData.get("assessmentType") as string,
      score: parseInt(formData.get("score") as string),
      notes: formData.get("notes") as string,
      studentName: formData.get("studentName") as string,
      className: formData.get("className") as string,
    };

    try {
      const response = await serverFetch(
        `/progress/${currentRecord.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        },
      );

      if (!response.ok)
        throw new Error("Failed to update progress");

      toast.success("Progress record updated successfully");
      setEditDialogOpen(false);
      setCurrentRecord(null);

      // Refresh the current view
      if (studentIdInput) {
        fetchProgress(studentIdInput);
      }
    } catch (error: any) {
      console.error("Error updating progress:", error);
      toast.error(error.message || "Failed to update progress");
    }
  };

  const handleDeleteProgress = async () => {
    if (!recordToDelete) return;

    try {
      const response = await serverFetch(
        `/progress/${recordToDelete}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok)
        throw new Error("Failed to delete progress");

      toast.success("Progress record deleted successfully");
      setDeleteDialogOpen(false);
      setRecordToDelete(null);

      // Refresh the current view
      if (studentIdInput) {
        fetchProgress(studentIdInput);
      }
    } catch (error: any) {
      console.error("Error deleting progress:", error);
      toast.error(error.message || "Failed to delete progress");
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
    const sum = filteredData.reduce(
      (acc, record) => acc + record.score,
      0,
    );
    return Math.round(sum / filteredData.length);
  };

  const Gauge = ({ value }: { value: number }) => {
    const data = [
      { name: "Score", value },
      { name: "Remaining", value: Math.max(0, 100 - value) },
    ];
    return (
      <div className="relative h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              startAngle={180}
              endAngle={-180}
              dataKey="value"
            >
              <Cell fill="#6366F1" />
              <Cell fill="#E5E7EB" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-3xl text-indigo-600">
            {value}%
          </div>
        </div>
      </div>
    );
  };

  const getStudentAverages = () => {
    const map = new Map<
      string,
      {
        sum: number;
        count: number;
        name?: string;
        cls?: string;
      }
    >();
    filteredData.forEach((r) => {
      const key = r.studentId;
      const v = map.get(key) || {
        sum: 0,
        count: 0,
        name: r.studentName,
        cls: r.className,
      };
      v.sum += r.score;
      v.count += 1;
      v.name = v.name || r.studentName;
      v.cls = v.cls || r.className;
      map.set(key, v);
    });
    return Array.from(map.entries()).map(([id, v]) => ({
      id,
      name: v.name || id,
      className: v.cls || "Unassigned",
      average: Math.round(v.sum / v.count),
      records: v.count,
    }));
  };

  const getClassAverages = () => {
    const map = new Map<
      string,
      { sum: number; count: number }
    >();
    filteredData.forEach((r) => {
      const key = r.className || "Unassigned";
      const v = map.get(key) || { sum: 0, count: 0 };
      v.sum += r.score;
      v.count += 1;
      map.set(key, v);
    });
    return Array.from(map.entries()).map(([name, v]) => ({
      name,
      average: Math.round(v.sum / v.count),
      records: v.count,
    }));
  };

  const getTopicExtremes = () => {
    const items = getTopicProgress();
    if (items.length === 0)
      return { highest: null as any, lowest: null as any };
    const sorted = items
      .slice()
      .sort((a, b) => b.average - a.average);
    return {
      highest: sorted[0],
      lowest: sorted[sorted.length - 1],
    };
  };

  // Get trend for a student (comparing recent vs earlier scores)
  const getStudentTrend = (studentId: string) => {
    const studentRecords = filteredData
      .filter((r) => r.studentId === studentId)
      .sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() -
          new Date(b.recordedAt).getTime(),
      );
    if (studentRecords.length < 2)
      return { trend: "stable", change: 0 };
    const mid = Math.floor(studentRecords.length / 2);
    const earlier = studentRecords.slice(0, mid);
    const recent = studentRecords.slice(mid);
    const earlierAvg =
      earlier.reduce((sum, r) => sum + r.score, 0) / earlier.length;
    const recentAvg =
      recent.reduce((sum, r) => sum + r.score, 0) / recent.length;
    const change = recentAvg - earlierAvg;
    if (change > 5) return { trend: "improving", change };
    if (change < -5) return { trend: "declining", change };
    return { trend: "stable", change };
  };

  // Get topic mastery level
  const getTopicMastery = (average: number) => {
    if (average >= 90) return { level: "Expert", color: "emerald" };
    if (average >= 75) return { level: "Proficient", color: "green" };
    if (average >= 60) return { level: "Developing", color: "yellow" };
    return { level: "Needs Support", color: "red" };
  };

  // Get at-risk students
  const getAtRiskStudents = () => {
    const students = getStudentAverages();
    return students.filter((s) => s.average < threshold);
  };

  // Save teacher note
  const saveTeacherNote = (studentId: string, note: string) => {
    setTeacherNotes((prev) => ({ ...prev, [studentId]: note }));
    toast.success("Teacher note saved");
    setNotesDialogOpen(false);
  };

  const getThresholdPercent = () => {
    if (filteredData.length === 0) return 0;
    const passed = filteredData.filter(
      (r) => r.score >= threshold,
    ).length;
    return Math.round((passed / filteredData.length) * 100);
  };

  const getTopicProgress = () => {
    const topicMap = new Map<
      string,
      { total: number; count: number }
    >();

    filteredData.forEach((record) => {
      const existing = topicMap.get(record.topic) || {
        total: 0,
        count: 0,
      };
      topicMap.set(record.topic, {
        total: existing.total + record.score,
        count: existing.count + 1,
      });
    });

    return Array.from(topicMap.entries()).map(
      ([topic, { total, count }]) => ({
        topic,
        average: Math.round(total / count),
      }),
    );
  };

  const exportProgressToPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const isOverview = !studentIdInput;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const marginX = 45;
    const marginRight = 45;
    const contentWidth = pageWidth - marginX - marginRight;
    let y = 50;
    let pageNumber = 1;

    // Professional color palette - Navy Blue Accent
    const accentColor = { r: 25, g: 55, b: 109 };
    const lightAccent = { r: 240, g: 243, b: 248 };
    const borderGray = { r: 200, g: 200, b: 200 };
    const textDark = { r: 33, g: 33, b: 33 };
    const textGray = { r: 85, g: 85, b: 85 };

    const addFooter = () => {
      doc.setFontSize(9);
      doc.setTextColor(textGray.r, textGray.g, textGray.b);
      doc.setFont("helvetica", "normal");
      const footerY = pageHeight - 35;
      
      doc.setDrawColor(borderGray.r, borderGray.g, borderGray.b);
      doc.setLineWidth(0.5);
      doc.line(marginX, footerY - 10, pageWidth - marginRight, footerY - 10);
      
      doc.text(
        `Page ${pageNumber}`,
        pageWidth / 2,
        footerY,
        { align: "center" }
      );
      doc.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        marginX,
        footerY
      );
      doc.text(
        "FreeLearning Platform",
        pageWidth - marginRight,
        footerY,
        { align: "right" }
      );
    };

    const checkPageBreak = (spaceNeeded: number) => {
      if (y + spaceNeeded > pageHeight - 70) {
        addFooter();
        doc.addPage();
        pageNumber++;
        y = 50;
      }
    };

    // ========== HEADER SECTION ==========
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
    const reportTitle = isOverview
      ? "Student Progress Overview Report"
      : "Student Progress Report";
    doc.text(reportTitle, pageWidth / 2, y, { align: "center" });
    y += 28;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(textGray.r, textGray.g, textGray.b);
    doc.text("FreeLearning Platform", pageWidth / 2, y, { align: "center" });
    y += 16;
    doc.setFontSize(10);
    doc.text(
      `Report Generated: ${new Date().toLocaleString()}`,
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += 30;

    doc.setDrawColor(accentColor.r, accentColor.g, accentColor.b);
    doc.setLineWidth(2);
    doc.line(marginX, y, pageWidth - marginRight, y);
    y += 30;

    // ========== COLLECT DATA ==========
    const avg = calculateAverageScore();
    const topics = getTopicProgress().length;
    const passPct = getThresholdPercent();
    const atRisk = getAtRiskStudents().length;
    const topicExtremes = getTopicExtremes();

    // ========== AT-A-GLANCE SUMMARY SECTION ==========
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
    doc.text("At-a-Glance Summary", marginX, y);
    y += 22;

    const summaryTableData: Array<{ label: string; value: string }> = [];
    if (!isOverview && studentIdInput) {
      summaryTableData.push({ label: "Student ID/Email", value: studentIdInput });
    }
    summaryTableData.push({ label: "Average Score", value: `${avg}%` });
    summaryTableData.push({ label: `Pass Rate (>=${threshold}%)`, value: `${passPct}%` });
    summaryTableData.push({ label: "Total Records", value: `${filteredData.length}` });
    summaryTableData.push({ label: "Topics Covered", value: `${topics}` });
    summaryTableData.push({ label: "At-Risk Students", value: `${atRisk}` });
    if (topicExtremes.highest) {
      summaryTableData.push({
        label: "Strongest Topic",
        value: `${topicExtremes.highest.topic} (${topicExtremes.highest.average}%)`
      });
    }
    if (topicExtremes.lowest) {
      summaryTableData.push({
        label: "Needs Focus",
        value: `${topicExtremes.lowest.topic} (${topicExtremes.lowest.average}%)`
      });
    }

    // Draw 2-column grid for summary with auto-height cards
    const cellWidth = (contentWidth - 10) / 2;
    const cellHeight = 28;
    let colIndex = 0;
    let rowStartY = y;
    let maxRowHeight = cellHeight;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    summaryTableData.forEach((item, index) => {
      const xPos = marginX + colIndex * (cellWidth + 10);
      
      // Calculate required height for this card
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const labelLines = doc.splitTextToSize(item.label, cellWidth - 16);
      
      doc.setFontSize(13);
      const valueLines = doc.splitTextToSize(item.value, cellWidth - 16);
      
      const labelHeight = labelLines.length * 10;
      const valueHeight = valueLines.length * 13;
      const cardHeight = Math.max(cellHeight, labelHeight + valueHeight + 16);
      
      // Track max height in this row
      if (cardHeight > maxRowHeight) {
        maxRowHeight = cardHeight;
      }
      
      if (colIndex === 0 && index > 0) {
        checkPageBreak(maxRowHeight + 10);
        rowStartY = y;
        maxRowHeight = cellHeight;
      }

      // Cell background
      doc.setFillColor(lightAccent.r, lightAccent.g, lightAccent.b);
      doc.rect(xPos, rowStartY - 18, cellWidth, cardHeight, "F");
      
      // Cell border
      doc.setDrawColor(borderGray.r, borderGray.g, borderGray.b);
      doc.setLineWidth(0.5);
      doc.rect(xPos, rowStartY - 18, cellWidth, cardHeight);

      // Label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(textGray.r, textGray.g, textGray.b);
      doc.text(labelLines, xPos + 8, rowStartY - 6);

      // Value
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
      const valueYPos = rowStartY - 6 + labelHeight + 4;
      doc.text(valueLines, xPos + 8, valueYPos);

      colIndex++;
      if (colIndex >= 2) {
        colIndex = 0;
        y = rowStartY + maxRowHeight + 5;
        rowStartY = y;
        maxRowHeight = cellHeight;
      }
    });

    if (colIndex > 0) {
      y = rowStartY + maxRowHeight + 5;
    }

    y += 25;

    // ========== DETAILED PROGRESS RECORDS SECTION ==========
    checkPageBreak(120);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
    doc.text("Detailed Progress Records", marginX, y);
    y += 25;

    // Column widths: Narrow (Date, Score), Medium (Email, Type), Wide (Topic), Extra-wide (Comments)
    const headers = ["Date", "Email", "Topic", "Type", "Score", "Comments"];
    const colWidths = [60, 95, 110, 65, 40, 135]; // Total: 505
    
    const drawTableHeader = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(accentColor.r, accentColor.g, accentColor.b);
      doc.rect(marginX, y - 14, contentWidth, 20, "F");
      
      doc.setDrawColor(accentColor.r, accentColor.g, accentColor.b);
      doc.setLineWidth(0.5);
      doc.rect(marginX, y - 14, contentWidth, 20);
      
      let xPos = marginX;
      headers.forEach((header, i) => {
        doc.text(header, xPos + 5, y);
        xPos += colWidths[i];
      });
      y += 18;
    };
    
    drawTableHeader();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const rowHeight = 18;
    let xPos = marginX;
    
    filteredData.forEach((record, rowIndex) => {
      const cells = [
        new Date(record.recordedAt).toLocaleDateString(),
        record.studentEmail || emailMap[record.studentId] || record.studentId || "",
        record.topic,
        record.assessmentType
          ? record.assessmentType.toLowerCase() === "general"
            ? "Fundamentals"
            : record.assessmentType.toLowerCase() === "exam"
              ? "Prototyping"
              : record.assessmentType
          : "Fundamentals",
        `${record.score}%`,
        record.notes || ""
      ];

      const wrappedCells = cells.map((text, i) =>
        doc.splitTextToSize(String(text), colWidths[i] - 10)
      );
      const maxLines = Math.max(...wrappedCells.map(w => w.length));
      const lineSpacing = 10;
      const currentRowHeight = Math.max(rowHeight, maxLines * lineSpacing + 8);

      if (y + currentRowHeight + 5 > pageHeight - 70) {
        addFooter();
        doc.addPage();
        pageNumber++;
        y = 50;
        drawTableHeader();
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
      }

      // Alternating row background
      if (rowIndex % 2 === 1) {
        doc.setFillColor(248, 249, 250);
        doc.rect(marginX, y - 12, contentWidth, currentRowHeight, "F");
      }

      // Row border
      doc.setDrawColor(borderGray.r, borderGray.g, borderGray.b);
      doc.setLineWidth(0.3);
      doc.rect(marginX, y - 12, contentWidth, currentRowHeight);

      xPos = marginX;
      doc.setTextColor(textDark.r, textDark.g, textDark.b);
      wrappedCells.forEach((lines, colIndex) => {
        // Vertical cell dividers
        if (colIndex > 0) {
          doc.setDrawColor(borderGray.r, borderGray.g, borderGray.b);
          doc.line(xPos, y - 12, xPos, y - 12 + currentRowHeight);
        }
        
        // Cell text with proper line spacing
        lines.forEach((line, lineIndex) => {
          doc.text(line, xPos + 5, y - 3 + lineIndex * lineSpacing);
        });
        xPos += colWidths[colIndex];
      });

      y += currentRowHeight;
    });

    y += 35;

    checkPageBreak(50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(textGray.r, textGray.g, textGray.b);
    doc.text("— End of Report —", pageWidth / 2, y, { align: "center" });

    addFooter();

    const namePart = isOverview
      ? "overview"
      : filteredData[0]?.studentEmail ||
        emailMap[filteredData[0]?.studentId] ||
        studentIdInput ||
        "student";
    doc.save(`progress_report_${namePart}_${Date.now()}.pdf`);
  };

  const applyFilters = () => {
    let filtered = [...progressData];
    if (topicFilter !== "all") {
      filtered = filtered.filter(
        (record) => record.topic === topicFilter,
      );
    }
    if (assessmentTypeFilter !== "all") {
      filtered = filtered.filter((record) => {
        const v = (record.assessmentType || "").toLowerCase();
        const mapped =
          v === "general"
            ? "Fundamentals"
            : v === "exam"
              ? "Prototyping"
              : record.assessmentType || "Fundamentals";
        return mapped === assessmentTypeFilter;
      });
    }
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      switch (dateFilter) {
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3);
          break;
        default:
          break;
      }
      filtered = filtered.filter(
        (record) => new Date(record.recordedAt) >= filterDate,
      );
    }
    const sorted = filtered.slice().sort((a, b) => {
      const va: any = (a as any)[sortKey] || "";
      const vb: any = (b as any)[sortKey] || "";
      const cmp =
        sortKey === "recordedAt"
          ? new Date(va).getTime() - new Date(vb).getTime()
          : va > vb
            ? 1
            : va < vb
              ? -1
              : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    setFilteredData(sorted);
  };

  const handleGenerateReport = async () => {
    const snapshot = (
      filteredData.length ? filteredData : progressData
    ).map((r) => ({
      ...r,
      studentEmail:
        r.studentEmail && r.studentEmail.includes("@")
          ? r.studentEmail
          : r.studentId
            ? emailMap[r.studentId] || ""
            : "",
    }));
    setReportData(snapshot);
    setShowReport(true);
  };

  if (userRole === "teacher") {
    if (showReport) {
      return (
        <ReportPage
          records={reportData ?? filteredData}
          onBack={() => {
            setShowReport(false);
            setReportData(null);
          }}
          onDownload={exportProgressToPDF}
          onViewStudent={(studentId) => {
            setShowReport(false);
            setReportData(null);
            fetchProgress(studentId);
          }}
        />
      );
    }
    return (
      <div className="space-y-6">
        {/* Modern Header with Gradient */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl text-white mb-2">
                Student Progress Analytics
              </h2>
              <p className="text-indigo-100">
                Monitor performance, track trends, and support student success
              </p>
            </div>
            <Dialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-white hover:bg-gray-100 text-indigo-600 shadow-md">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Progress Record
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader className="pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl">Add Student Progress 📝</DialogTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Record a new achievement or assessment result
                    </p>
                  </div>
                </div>
              </DialogHeader>
              <form
                onSubmit={handleAddProgress}
                className="space-y-5 pt-4"
              >
                <div className="space-y-2.5">
                  <Label htmlFor="studentId" className="text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500" />
                    Student ID
                  </Label>
                  <Input
                    id="studentId"
                    name="studentId"
                    placeholder="Enter student user ID..."
                    required
                    className="border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20 h-11 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    💡 Tip: Find student IDs in their profile or the analytics dashboard
                  </p>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="topic" className="text-gray-700 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-500" />
                    Topic/Assignment
                  </Label>
                  <Input
                    id="topic"
                    name="topic"
                    placeholder="e.g., HCI Fundamentals Quiz"
                    required
                    className="border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="assessmentType" className="text-gray-700 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    Assessment Type
                  </Label>
                  <Select
                    id="assessmentType"
                    name="assessmentType"
                    defaultValue="Fundamentals"
                    required
                  >
                    <SelectTrigger className="border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 h-11 rounded-lg">
                      <SelectValue placeholder="Select assessment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fundamentals">
                        📚 Fundamentals
                      </SelectItem>
                      <SelectItem value="Design Principles">
                        🎨 Design Principles
                      </SelectItem>
                      <SelectItem value="Usability">
                        👥 Usability
                      </SelectItem>
                      <SelectItem value="Prototyping">
                        🔧 Prototyping
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="score" className="text-gray-700 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-500" />
                    Score (0-100)
                  </Label>
                  <Input
                    id="score"
                    name="score"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="85"
                    required
                    className="border-gray-200 focus:border-emerald-400 focus:ring-emerald-400/20 h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="notes" className="text-gray-700 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-500" />
                    Notes (optional)
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Add encouraging feedback or observations..."
                    className="border-gray-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-lg min-h-[100px]"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="border-gray-300 hover:bg-gray-50 h-11 px-6 rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md h-11 px-6 rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Record
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Edit Progress Dialog */}
        <Dialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader className="pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-md">
                  <Edit className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">Edit Progress Record ✏️</DialogTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Update student assessment details and feedback
                  </p>
                </div>
              </div>
            </DialogHeader>
            <form
              onSubmit={handleEditProgress}
              className="space-y-5 pt-4"
            >
              <div className="space-y-2.5">
                <Label htmlFor="edit-topic" className="text-gray-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  Topic/Assignment
                </Label>
                <Input
                  id="edit-topic"
                  name="topic"
                  defaultValue={currentRecord?.topic || ""}
                  placeholder="e.g., HCI Fundamentals Quiz"
                  required
                  className="border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 h-11 rounded-lg"
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="edit-assessmentType" className="text-gray-700 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  Assessment Type
                </Label>
                <Select
                  id="edit-assessmentType"
                  name="assessmentType"
                  defaultValue={
                    currentRecord?.assessmentType || "Fundamentals"
                  }
                  required
                >
                  <SelectTrigger className="border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 h-11 rounded-lg">
                    <SelectValue placeholder="Select assessment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fundamentals">
                      📚 Fundamentals
                    </SelectItem>
                    <SelectItem value="Design Principles">
                      🎨 Design Principles
                    </SelectItem>
                    <SelectItem value="Usability">
                      👥 Usability
                    </SelectItem>
                    <SelectItem value="Prototyping">
                      🔧 Prototyping
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="edit-score" className="text-gray-700 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  Score (0-100)
                </Label>
                <Input
                  id="edit-score"
                  name="score"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={currentRecord?.score || 0}
                  placeholder="85"
                  required
                  className="border-gray-200 focus:border-emerald-400 focus:ring-emerald-400/20 h-11 rounded-lg"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="edit-notes" className="text-gray-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  Notes (optional)
                </Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  defaultValue={currentRecord?.notes || ""}
                  placeholder="Update feedback or observations..."
                  className="border-gray-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-lg min-h-[100px]"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  className="border-gray-300 hover:bg-gray-50 h-11 px-6 rounded-lg"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-md h-11 px-6 rounded-lg"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Update Record
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        >
          <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <AlertDialogTitle className="text-2xl mb-2">
                    Delete Progress Record? 🗑️
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600 leading-relaxed">
                    This will permanently remove this progress record from the student's history. 
                    This action <span className="text-red-600 font-medium">cannot be undone</span>.
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200/60">
              <p className="text-sm text-amber-900 flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <span>
                  <strong className="font-medium">Think twice:</strong> Consider editing the record instead if you just need to update the details.
                </span>
              </p>
            </div>
            <AlertDialogFooter className="pt-4">
              <AlertDialogCancel className="border-gray-300 hover:bg-gray-50 h-11 px-6 rounded-lg">
                Keep Record
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProgress}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md h-11 px-6 rounded-lg"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Teacher Notes Dialog */}
        <Dialog
          open={notesDialogOpen}
          onOpenChange={setNotesDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Teacher Notes</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teacher-note">
                  Add notes for{" "}
                  {currentStudentId
                    ? emailMap[currentStudentId] || currentStudentId
                    : "student"}
                </Label>
                <Textarea
                  id="teacher-note"
                  placeholder="Enter observations, recommendations, or action items..."
                  defaultValue={
                    currentStudentId
                      ? teacherNotes[currentStudentId] || ""
                      : ""
                  }
                  rows={5}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNotesDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (currentStudentId) {
                      const textarea = document.getElementById(
                        "teacher-note",
                      ) as HTMLTextAreaElement;
                      saveTeacherNote(
                        currentStudentId,
                        textarea.value,
                      );
                    }
                  }}
                >
                  Save Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* At-Risk Students Dialog */}
        <Dialog
          open={atRiskDialogOpen}
          onOpenChange={setAtRiskDialogOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                Students Needing Support
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {getAtRiskStudents().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>All students are performing above the {threshold}% threshold!</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    The following {getAtRiskStudents().length} student{getAtRiskStudents().length > 1 ? 's are' : ' is'} currently performing below the {threshold}% threshold and may benefit from additional support.
                  </p>
                  {getAtRiskStudents()
                    .sort((a, b) => a.average - b.average)
                    .map((student) => {
                      const trend = getStudentTrend(student.id);
                      return (
                        <div
                          key={student.id}
                          className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-lg p-4 border border-rose-200/60"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <Avatar className="w-10 h-10 shadow-md ring-2 ring-white">
                                <AvatarFallback className="bg-gradient-to-br from-rose-400 to-orange-500 text-white">
                                  {(emailMap[student.id] || student.name || '?').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-gray-900">
                                    {emailMap[student.id] || student.name}
                                  </span>
                                  {trend.trend === "declining" && (
                                    <Badge className="text-xs bg-amber-500 text-white">
                                      <TrendingDown className="w-3 h-3 mr-1" />
                                      Declining
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="text-rose-700">
                                    {student.average}% average
                                  </span>
                                  <span className="text-gray-600">
                                    {student.records} assessment{student.records > 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAtRiskDialogOpen(false);
                                fetchProgress(student.id);
                              }}
                              className="border-rose-300 hover:bg-rose-50 text-rose-700"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setAtRiskDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="shadow-xl rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-slate-200/60">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-md">
                    <BarChart className="w-5 h-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                    Student Progress Dashboard
                  </span>
                </CardTitle>
                <CardDescription className="text-slate-600 ml-[52px]">
                  Track individual journeys or explore the bigger picture
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 bg-white">
            <div className="flex gap-3 items-center flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Enter Student ID to begin..."
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 h-11 rounded-lg transition-all"
                />
              </div>

              <Button
                onClick={() =>
                  studentIdInput && fetchProgress(studentIdInput)
                }
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200 h-11 px-6 rounded-lg"
              >
                <UserIcon className="w-4 h-4 mr-2" />
                View Progress
              </Button>

              <Button
                variant="outline"
                onClick={fetchAllProgress}
                className="border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm h-11 px-6 rounded-lg transition-all"
              >
                <BarChart className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>
          </CardContent>
        </Card>

        {progressData.length > 0 && (
          <Card className="shadow-xl rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border-b border-slate-200/60">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-md">
                      <Filter className="w-5 h-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Filter & Refine Results
                    </span>
                  </CardTitle>
                  <CardDescription className="text-slate-600 ml-[52px]">
                    Fine-tune your view to focus on what matters most
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-white">
              <div className="grid gap-5 md:grid-cols-3">
                <div className="space-y-2.5">
                  <Label htmlFor="topic-filter" className="text-slate-700 flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    Topic
                  </Label>
                  <Select
                    value={topicFilter}
                    onValueChange={setTopicFilter}
                  >
                    <SelectTrigger id="topic-filter" className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 h-11 rounded-lg transition-all">
                      <SelectValue placeholder="All Topics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All Topics
                      </SelectItem>
                      {getUniqueTopics().map((topic) => (
                        <SelectItem key={topic} value={topic}>
                          {topic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="type-filter" className="text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-500" />
                    Assessment Type
                  </Label>
                  <Select
                    value={assessmentTypeFilter}
                    onValueChange={setAssessmentTypeFilter}
                  >
                    <SelectTrigger id="type-filter" className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 h-11 rounded-lg transition-all">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All Types
                      </SelectItem>
                      <SelectItem value="Fundamentals">
                        Fundamentals
                      </SelectItem>
                      <SelectItem value="Design Principles">
                        Design Principles
                      </SelectItem>
                      <SelectItem value="Usability">
                        Usability
                      </SelectItem>
                      <SelectItem value="Prototyping">
                        Prototyping
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="date-filter" className="text-slate-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    Date Range
                  </Label>
                  <Select
                    value={dateFilter}
                    onValueChange={setDateFilter}
                  >
                    <SelectTrigger id="date-filter" className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 h-11 rounded-lg transition-all">
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All Time
                      </SelectItem>
                      <SelectItem value="week">
                        Last 7 Days
                      </SelectItem>
                      <SelectItem value="month">
                        Last 30 Days
                      </SelectItem>
                      <SelectItem value="quarter">
                        Last 3 Months
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {progressData.length > 0 && (
          <>
            {/* Enhanced Analytics Dashboard */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg shadow-sm">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
                  <Target className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="students" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
                  <UserIcon className="w-4 h-4 mr-2" />
                  Students
                </TabsTrigger>
                <TabsTrigger value="topics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
                  <Award className="w-4 h-4 mr-2" />
                  Topic Mastery
                </TabsTrigger>
                <TabsTrigger value="charts" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
                  <BarChart className="w-4 h-4 mr-2" />
                  Charts
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Hero Stats Section with Human Touch */}
                <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-8 shadow-lg border border-indigo-100">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-xl text-gray-900 mb-1">
                        Class Overview
                      </h3>
                      <p className="text-gray-600">
                        A snapshot of learning progress & achievements
                      </p>
                    </div>
                    {getAtRiskStudents().length > 0 && (
                      <Badge
                        variant="destructive"
                        className="bg-orange-500 hover:bg-orange-600 shadow-md px-4 py-2"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        {getAtRiskStudents().length} need support
                      </Badge>
                    )}
                  </div>

                  {/* Primary Metrics - Large & Friendly */}
                  <div className="grid gap-5 md:grid-cols-3 mb-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-5xl text-transparent bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text">
                          {calculateAverageScore()}%
                        </span>
                      </div>
                      <p className="text-gray-600 mb-1">Class Average</p>
                      <p className="text-sm text-gray-500">
                        {calculateAverageScore() >= 80
                          ? "🌟 Excellent work!"
                          : calculateAverageScore() >= 70
                            ? "👍 Solid progress"
                            : "💪 Room to grow"}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-md">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-5xl text-transparent bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text">
                          {filteredData.length}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-1">Assessments</p>
                      <p className="text-sm text-gray-500">
                        {filteredData.length > 20
                          ? "📚 Great engagement"
                          : filteredData.length > 10
                            ? "📖 Building momentum"
                            : "🚀 Getting started"}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-md">
                          <Award className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-5xl text-transparent bg-gradient-to-br from-emerald-600 to-green-600 bg-clip-text">
                          {getTopicProgress().length}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-1">Topics Covered</p>
                      <p className="text-sm text-gray-500">
                        {getTopicProgress().length >= 5
                          ? "🎯 Comprehensive coverage"
                          : "📍 Expanding curriculum"}
                      </p>
                    </div>
                  </div>

                  {/* Pass Rate with Visual Indicator */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-gray-900">Success Rate</p>
                          <p className="text-sm text-gray-500">
                            Students scoring {threshold}% or higher
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={threshold}
                          onChange={(e) =>
                            setThreshold(
                              parseInt(e.target.value || "0"),
                            )
                          }
                          className="w-20 border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                        />
                        <span className="text-3xl text-gray-900 min-w-[80px] text-right">
                          {getThresholdPercent()}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={getThresholdPercent()}
                      className="h-3 bg-gray-200"
                    />
                  </div>
                </div>

                {/* Topic Performance Highlights - Redesigned */}
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 shadow-lg border border-emerald-100 hover:shadow-xl transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-md">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-900 mb-1">
                          🌟 Strongest Topic
                        </h4>
                        <p className="text-sm text-emerald-700">
                          Where students truly excel
                        </p>
                      </div>
                    </div>
                    {getTopicExtremes().highest ? (
                      <div className="bg-white rounded-xl p-5 border border-emerald-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-gray-900">
                            {getTopicExtremes().highest.topic}
                          </p>
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm">
                            {getTopicExtremes().highest.average}%
                          </Badge>
                        </div>
                        <Progress
                          value={getTopicExtremes().highest.average}
                          className="h-2 bg-emerald-100"
                        />
                        <p className="text-sm text-emerald-700 mt-3">
                          ✨ Students are mastering this area — keep up the great momentum!
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl p-5 border border-emerald-100 text-emerald-700">
                        No data available yet
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-md">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-900 mb-1">
                          💡 Needs Focus
                        </h4>
                        <p className="text-sm text-orange-700">
                          An opportunity to strengthen skills
                        </p>
                      </div>
                    </div>
                    {getTopicExtremes().lowest ? (
                      <div className="bg-white rounded-xl p-5 border border-orange-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-gray-900">
                            {getTopicExtremes().lowest.topic}
                          </p>
                          <Badge className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm">
                            {getTopicExtremes().lowest.average}%
                          </Badge>
                        </div>
                        <Progress
                          value={getTopicExtremes().lowest.average}
                          className="h-2 bg-orange-100"
                        />
                        <p className="text-sm text-orange-700 mt-3">
                          🎯 Consider extra resources, practice exercises, or review sessions here.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl p-5 border border-orange-100 text-orange-700">
                        No data available yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions & Insights */}
                {getAtRiskStudents().length > 0 && (
                  <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl p-6 shadow-lg border border-rose-200">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl shadow-md">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-900 mb-2">
                          Students Needing Support
                        </h4>
                        <p className="text-rose-700 mb-4">
                          {getAtRiskStudents().length} student
                          {getAtRiskStudents().length > 1 ? "s are" : " is"}{" "}
                          currently below the {threshold}% threshold. Check the Students tab to review their progress and provide personalized support.
                        </p>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="bg-white border-rose-300 hover:bg-rose-50 hover:border-rose-400 text-rose-700 shadow-sm"
                            onClick={() => setAtRiskDialogOpen(true)}
                          >
                            <UserIcon className="w-4 h-4 mr-2" />
                            View Students
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="students" className="space-y-6 mt-6">
                <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-2xl p-8 border border-slate-200/60 shadow-sm">
                  <div className="mb-6">
                    <h3 className="text-gray-900 mb-2">
                      Student Performance
                    </h3>
                    <p className="text-gray-600">
                      A clear view of each student's learning journey and progress over time
                    </p>
                  </div>
                  <div className="space-y-4">
                      {getStudentAverages()
                        .sort((a, b) => a.average - b.average)
                        .map((student) => {
                          const trend = getStudentTrend(student.id);
                          const isAtRisk = student.average < threshold;
                          return (
                            <div
                              key={student.id}
                              className={`rounded-xl p-6 transition-all hover:shadow-lg group ${
                                isAtRisk
                                  ? "bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/60"
                                  : "bg-white border border-slate-200/60 hover:border-slate-300/80"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <Avatar className="w-12 h-12 shadow-md ring-2 ring-white">
                                    <AvatarFallback
                                      className={
                                        isAtRisk
                                          ? "bg-gradient-to-br from-orange-400 to-amber-500 text-white"
                                          : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                                      }
                                    >
                                      {(
                                        emailMap[student.id] ||
                                        student.name ||
                                        "?"
                                      )
                                        .charAt(0)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-gray-900">
                                        {emailMap[student.id] ||
                                          student.name}
                                      </span>
                                      {isAtRisk && (
                                        <Badge
                                          variant="destructive"
                                          className="text-xs shadow-sm bg-rose-500 hover:bg-rose-600"
                                        >
                                          <AlertTriangle className="w-3 h-3 mr-1" />
                                          Needs Support
                                        </Badge>
                                      )}
                                      {trend.trend === "improving" && (
                                        <Badge
                                          variant="default"
                                          className="text-xs bg-emerald-500 hover:bg-emerald-600 shadow-sm"
                                        >
                                          <TrendingUp className="w-3 h-3 mr-1" />
                                          Growing
                                        </Badge>
                                      )}
                                      {trend.trend === "declining" && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs bg-amber-100 text-amber-800 shadow-sm"
                                        >
                                          <TrendingDown className="w-3 h-3 mr-1" />
                                          Slipping
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-3">
                                      <div className="flex items-baseline gap-1">
                                        <span className="text-3xl text-gray-900">
                                          {student.average}
                                        </span>
                                        <span className="text-gray-500">%</span>
                                      </div>
                                      <span className="text-sm text-gray-600">
                                        {student.records} assessment{student.records > 1 ? "s" : ""}
                                      </span>
                                      {trend.change !== 0 && (
                                        <span
                                          className={`text-xs flex items-center gap-1 font-medium ${
                                            trend.change > 0
                                              ? "text-green-600"
                                              : "text-orange-600"
                                          }`}
                                        >
                                          {trend.change > 0 ? (
                                            <TrendingUp className="w-3 h-3" />
                                          ) : (
                                            <TrendingDown className="w-3 h-3" />
                                          )}
                                          {Math.abs(
                                            Math.round(trend.change),
                                          )}
                                          % trend
                                        </span>
                                      )}
                                    </div>
                                    <Progress
                                      value={student.average}
                                      className={`h-2.5 mt-4 ${
                                        isAtRisk ? "bg-orange-100" : "bg-slate-200"
                                      }`}
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setCurrentStudentId(student.id);
                                      setNotesDialogOpen(true);
                                    }}
                                    className="border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
                                    title="Add note"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      fetchProgress(student.id)
                                    }
                                    className="border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
                                    title="View details"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              {teacherNotes[student.id] && (
                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200/60 rounded-lg">
                                  <div className="flex gap-2">
                                    <span className="text-blue-900">
                                      💬
                                    </span>
                                    <p className="text-blue-800 text-sm">
                                      {teacherNotes[student.id]}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
              </TabsContent>

              {/* Topic Mastery Tab */}
              <TabsContent value="topics" className="space-y-6 mt-6">
                <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl p-8 border border-purple-200/60 shadow-sm">
                  <div className="mb-6">
                    <h3 className="text-gray-900 mb-2">
                      Topic Mastery
                    </h3>
                    <p className="text-gray-600">
                      Understanding where students excel and where they need more support
                    </p>
                  </div>
                  <div className="space-y-4">
                      {getTopicProgress()
                        .sort((a, b) => b.average - a.average)
                        .map((topic) => {
                          const mastery = getTopicMastery(
                            topic.average,
                          );
                          return (
                            <div
                              key={topic.topic}
                              className="bg-white rounded-xl p-6 border border-slate-200/60 hover:shadow-lg transition-all group"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h4 className="text-gray-900 mb-2">{topic.topic}</h4>
                                  <Badge
                                    className={`text-xs shadow-sm ${
                                      mastery.color === "emerald"
                                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                        : mastery.color === "green"
                                          ? "bg-green-500 text-white hover:bg-green-600"
                                          : mastery.color === "yellow"
                                            ? "bg-amber-500 text-white hover:bg-amber-600"
                                            : "bg-rose-500 text-white hover:bg-rose-600"
                                    }`}
                                  >
                                    {mastery.level}
                                  </Badge>
                                </div>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-3xl text-gray-900">
                                    {topic.average}
                                  </span>
                                  <span className="text-gray-500">%</span>
                                </div>
                              </div>
                              <Progress
                                value={topic.average}
                                className="h-3 bg-slate-200"
                              />
                              <p className="text-sm text-gray-600 mt-4">
                                {mastery.level === "Expert"
                                  ? "✨ Students have truly mastered this topic"
                                  : mastery.level === "Proficient"
                                    ? "🎯 Strong understanding shown by students"
                                    : mastery.level === "Developing"
                                      ? "📈 Students are making steady progress"
                                      : "💡 This topic needs more attention and support"}
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  </div>
              </TabsContent>

              {/* Charts Tab */}
              <TabsContent value="charts" className="space-y-6 mt-6">
                <div className="bg-gradient-to-br from-teal-50 via-white to-cyan-50 rounded-2xl p-8 border border-teal-200/60 shadow-sm">
                  <div className="mb-6">
                    <h3 className="text-gray-900 mb-2">
                      Visual Analytics
                    </h3>
                    <p className="text-gray-600">
                      Interactive charts and graphs that bring your data to life
                    </p>
                  </div>
                  <AnalyticsCharts
                    records={filteredData}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        {!loading && progressData.length > 0 && (
          <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50 rounded-2xl p-8 border border-slate-200/60 shadow-sm">
            <div className="mb-6">
              <h3 className="text-gray-900 mb-2">
                Progress History
              </h3>
              <p className="text-gray-600">
                A chronological view of learning milestones and achievements 📚
              </p>
            </div>
            <div className="space-y-3">
              {filteredData.map((record, index) => {
                const scoreColor = 
                  record.score >= 90 ? "from-emerald-500 to-green-600" :
                  record.score >= 75 ? "from-blue-500 to-indigo-600" :
                  record.score >= 60 ? "from-amber-500 to-orange-600" :
                  "from-rose-500 to-red-600";
                  
                const bgColor =
                  record.score >= 90 ? "from-emerald-50 to-green-50 border-emerald-200/60" :
                  record.score >= 75 ? "from-blue-50 to-indigo-50 border-blue-200/60" :
                  record.score >= 60 ? "from-amber-50 to-orange-50 border-amber-200/60" :
                  "from-rose-50 to-red-50 border-rose-200/60";
                
                return (
                  <div
                    key={index}
                    className={`rounded-xl p-5 bg-gradient-to-br ${bgColor} border transition-all hover:shadow-md group`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-gray-900 mb-1">{record.topic}</h4>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {new Date(record.recordedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-baseline">
                          <span className={`text-4xl text-transparent bg-gradient-to-br ${scoreColor} bg-clip-text`}>
                            {record.score}
                          </span>
                          <span className="text-gray-500 ml-1">%</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-white/80"
                            onClick={() => openEditDialog(record)}
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-white/80"
                            onClick={() => openDeleteDialog(record.id!)}
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Progress
                      value={record.score}
                      className="h-3 mb-3 bg-white/60"
                    />
                    {record.notes && (
                      <div className="bg-white/70 rounded-lg p-3 mt-3 backdrop-blur-sm">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          💭 {record.notes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && filteredData.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl p-8 border border-purple-200/60 shadow-sm">
            <div className="mb-6">
              <h3 className="text-gray-900 mb-2">
                Student Performance
              </h3>
              <p className="text-gray-600">
                Detailed breakdown of all assessment records - click column headers to sort 🎯
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100">
                      <TableHead
                        onClick={() => {
                          setSortKey("studentEmail");
                          setSortDir(
                            sortKey === "studentEmail" &&
                              sortDir === "asc"
                              ? "desc"
                              : "asc",
                          );
                          applyFilters();
                        }}
                        className="cursor-pointer hover:text-purple-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Student
                          {sortKey === "studentEmail" && (
                            <span className="text-purple-600">
                              {sortDir === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        onClick={() => {
                          setSortKey("topic");
                          setSortDir(
                            sortKey === "topic" &&
                              sortDir === "asc"
                              ? "desc"
                              : "asc",
                          );
                          applyFilters();
                        }}
                        className="cursor-pointer hover:text-purple-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Topic
                          {sortKey === "topic" && (
                            <span className="text-purple-600">
                              {sortDir === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        onClick={() => {
                          setSortKey("assessmentType");
                          setSortDir(
                            sortKey === "assessmentType" &&
                              sortDir === "asc"
                              ? "desc"
                              : "asc",
                          );
                          applyFilters();
                        }}
                        className="cursor-pointer hover:text-purple-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Type
                          {sortKey === "assessmentType" && (
                            <span className="text-purple-600">
                              {sortDir === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        onClick={() => {
                          setSortKey("score");
                          setSortDir(
                            sortKey === "score" &&
                              sortDir === "asc"
                              ? "desc"
                              : "asc",
                          );
                          applyFilters();
                        }}
                        className="cursor-pointer hover:text-purple-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Score
                          {sortKey === "score" && (
                            <span className="text-purple-600">
                              {sortDir === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        onClick={() => {
                          setSortKey("recordedAt");
                          setSortDir(
                            sortKey === "recordedAt" &&
                              sortDir === "asc"
                              ? "desc"
                              : "asc",
                          );
                          applyFilters();
                        }}
                        className="cursor-pointer hover:text-purple-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Date
                          {sortKey === "recordedAt" && (
                            <span className="text-purple-600">
                              {sortDir === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((r, i) => {
                      const scoreColor = 
                        r.score >= 90 ? "text-emerald-700 bg-emerald-50" :
                        r.score >= 75 ? "text-blue-700 bg-blue-50" :
                        r.score >= 60 ? "text-amber-700 bg-amber-50" :
                        "text-rose-700 bg-rose-50";
                      
                      return (
                        <TableRow key={i} className="hover:bg-purple-50/30 transition-colors">
                          <TableCell className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 shadow-sm ring-2 ring-white">
                              <AvatarImage src={""} alt="" />
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                                {(
                                  r.studentEmail ||
                                  r.studentId ||
                                  "?"
                                )
                                  .toString()
                                  .slice(0, 1)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-gray-900">{r.studentEmail || "Unknown"}</span>
                          </TableCell>
                          <TableCell className="text-gray-900">{r.topic}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-white">
                              {r.assessmentType
                                ? r.assessmentType.toLowerCase() ===
                                  "general"
                                  ? "Fundamentals"
                                  : r.assessmentType.toLowerCase() ===
                                      "exam"
                                    ? "Prototyping"
                                    : r.assessmentType
                                : "Fundamentals"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${scoreColor} shadow-sm`}>
                              {r.score}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {new Date(r.recordedAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableCaption className="text-gray-500 py-4 bg-gradient-to-r from-purple-50/30 to-pink-50/30">
                    💡 Tip: Click any column header to sort the table
                  </TableCaption>
                </Table>
              </div>
            </div>
          </div>
        )}

        {!loading && progressData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Report</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleGenerateReport}>
                Generate Report
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Student view
  if (loading) {
    return (
      <div className="text-center py-8">
        Loading your progress...
      </div>
    );
  }

  if (showReport) {
    return (
      <ReportPage
        records={reportData ?? filteredData}
        onBack={() => {
          setShowReport(false);
          setReportData(null);
        }}
        onDownload={exportProgressToPDF}
      />
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl text-gray-900">My Progress</h2>
        <p className="text-gray-600 mt-1">
          Track your learning journey and achievements
        </p>
      </div>

      {/* Chibi Character */}
      <ChibiCharacter message="Hi!! Let's see your progress" />

      {progressData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              No progress records yet. Complete some assessments
              to see your progress!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter Progress
              </CardTitle>
              <CardDescription>
                Filter by topic, assessment type, or date range
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="topic-filter">Topic</Label>
                  <Select
                    value={topicFilter}
                    onValueChange={setTopicFilter}
                  >
                    <SelectTrigger id="topic-filter">
                      <SelectValue placeholder="All Topics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All Topics
                      </SelectItem>
                      {getUniqueTopics().map((topic) => (
                        <SelectItem key={topic} value={topic}>
                          {topic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type-filter">
                    Assessment Type
                  </Label>
                  <Select
                    value={assessmentTypeFilter}
                    onValueChange={setAssessmentTypeFilter}
                  >
                    <SelectTrigger id="type-filter">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All Types
                      </SelectItem>
                      <SelectItem value="Fundamentals">
                        Fundamentals
                      </SelectItem>
                      <SelectItem value="Design Principles">
                        Design Principles
                      </SelectItem>
                      <SelectItem value="Usability">
                        Usability
                      </SelectItem>
                      <SelectItem value="Prototyping">
                        Prototyping
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-filter">
                    Date Range
                  </Label>
                  <Select
                    value={dateFilter}
                    onValueChange={setDateFilter}
                  >
                    <SelectTrigger id="date-filter">
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All Time
                      </SelectItem>
                      <SelectItem value="week">
                        Last 7 Days
                      </SelectItem>
                      <SelectItem value="month">
                        Last 30 Days
                      </SelectItem>
                      <SelectItem value="quarter">
                        Last 3 Months
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {progressData.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl p-8 border border-indigo-200/60 shadow-sm">
              <div className="mb-6">
                <h3 className="text-gray-900 mb-2">
                  Visual Analytics
                </h3>
                <p className="text-gray-600">
                  Interactive charts showing your learning patterns and trends 📈
                </p>
              </div>
              <AnalyticsCharts
                records={filteredData}
              />
            </div>
          )}
          <div className="grid gap-5 md:grid-cols-3">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-200/60 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <span className="text-5xl text-transparent bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text">
                  {calculateAverageScore()}%
                </span>
              </div>
              <p className="text-gray-900 mb-1">Average Score</p>
              <p className="text-sm text-gray-600">
                {calculateAverageScore() >= 80
                  ? "🌟 Excellent work!"
                  : calculateAverageScore() >= 70
                    ? "👍 Solid progress"
                    : "💪 Keep going!"}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-sm border border-purple-200/60 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-md">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="text-5xl text-transparent bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text">
                  {filteredData.length}
                </span>
              </div>
              <p className="text-gray-900 mb-1">Total Records</p>
              <p className="text-sm text-gray-600">
                {filteredData.length > 10
                  ? "📚 Great engagement"
                  : "📖 Building up"}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 shadow-sm border border-emerald-200/60 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-md">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <span className="text-5xl text-transparent bg-gradient-to-br from-emerald-600 to-green-600 bg-clip-text">
                  {getTopicProgress().length}
                </span>
              </div>
              <p className="text-gray-900 mb-1">Topics Covered</p>
              <p className="text-sm text-gray-600">
                {getTopicProgress().length >= 5
                  ? "🎯 Great variety"
                  : "📍 Exploring"}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-2xl p-8 border border-amber-200/60 shadow-sm">
            <div className="mb-6">
              <h3 className="text-gray-900 mb-2">
                Progress by Topic
              </h3>
              <p className="text-gray-600">
                Your performance across different learning areas 📊
              </p>
            </div>
            <div className="space-y-4">
              {getTopicProgress().map((item, index) => {
                const barColor = 
                  item.average >= 90 ? "bg-gradient-to-r from-emerald-500 to-green-600" :
                  item.average >= 75 ? "bg-gradient-to-r from-blue-500 to-indigo-600" :
                  item.average >= 60 ? "bg-gradient-to-r from-amber-500 to-orange-600" :
                  "bg-gradient-to-r from-rose-500 to-red-600";
                
                const bgGlow =
                  item.average >= 90 ? "from-emerald-50 to-green-50 border-emerald-200/60" :
                  item.average >= 75 ? "from-blue-50 to-indigo-50 border-blue-200/60" :
                  item.average >= 60 ? "from-amber-50 to-orange-50 border-amber-200/60" :
                  "from-rose-50 to-red-50 border-rose-200/60";
                
                return (
                  <div key={index} className={`bg-gradient-to-br ${bgGlow} rounded-xl p-5 border transition-all hover:shadow-md`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-gray-900">{item.topic}</h4>
                      <Badge className={`${barColor} text-white shadow-sm`}>
                        {item.average}%
                      </Badge>
                    </div>
                    <div className="relative h-3 bg-white/60 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${item.average}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 via-white to-cyan-50 rounded-2xl p-8 border border-teal-200/60 shadow-sm">
            <div className="mb-6">
              <h3 className="text-gray-900 mb-2">
                Recent Activity
              </h3>
              <p className="text-gray-600">
                Your latest assessments and learning progress ⚡
              </p>
            </div>
            <div className="space-y-3">
              {filteredData
                .slice(-10)
                .reverse()
                .map((record, index) => {
                  const scoreColor = 
                    record.score >= 90 ? "from-emerald-500 to-green-600" :
                    record.score >= 75 ? "from-blue-500 to-indigo-600" :
                    record.score >= 60 ? "from-amber-500 to-orange-600" :
                    "from-rose-500 to-red-600";
                    
                  const bgColor =
                    record.score >= 90 ? "from-emerald-50 to-green-50 border-emerald-200/60" :
                    record.score >= 75 ? "from-blue-50 to-indigo-50 border-blue-200/60" :
                    record.score >= 60 ? "from-amber-50 to-orange-50 border-amber-200/60" :
                    "from-rose-50 to-red-50 border-rose-200/60";
                  
                  return (
                    <div
                      key={index}
                      className={`rounded-xl p-5 bg-gradient-to-br ${bgColor} border transition-all hover:shadow-md`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-gray-900 mb-1">{record.topic}</h4>
                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {new Date(record.recordedAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                        <div className="flex items-baseline">
                          <span className={`text-4xl text-transparent bg-gradient-to-br ${scoreColor} bg-clip-text`}>
                            {record.score}
                          </span>
                          <span className="text-gray-500 ml-1">%</span>
                        </div>
                      </div>
                      <Progress
                        value={record.score}
                        className="h-3 mb-3 bg-white/60"
                      />
                      {record.notes && (
                        <div className="bg-white/70 rounded-lg p-3 backdrop-blur-sm">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            💭 {record.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}