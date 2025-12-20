import * as React from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Download,
  ArrowLeft,
  FileText,
  Search,
  User,
  Calendar,
  TrendingUp,
  Award,
  Target,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  ResponsiveContainer,
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
  BarChart as ReBarChart,
  Bar,
} from "recharts";

type ProgressRecord = {
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
};

export function ReportPage({
  records,
  onBack,
  onDownload,
  onViewStudent,
}: {
  records: ProgressRecord[];
  onBack: () => void;
  onDownload: () => void;
  onViewStudent?: (studentId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [studentIdInput, setStudentIdInput] = React.useState("");

  React.useEffect(() => {
    const id = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("resize"));
      }
    }, 50);
    return () => clearTimeout(id);
  }, [records.length]);

  const rows = records;
  const topicAverages = (() => {
    const map: Record<string, { sum: number; count: number }> =
      {};
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
    }));

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
    return Object.entries(map).map(([type, value]) => ({
      type,
      value,
    }));
  })();

  const colors = ["#6366F1", "#10B981", "#0EA5E9", "#A78BFA"];
  const safeTopicAverages = topicAverages.length
    ? topicAverages
    : [{ topic: "No Data", average: 0 }];
  const safeTrendData = trendData.length
    ? trendData
    : [{ date: "No Data", score: 0 }];
  const safeTypeCounts = typeCounts.length
    ? typeCounts
    : [{ type: "No Data", value: 1 }];

  // Get unique students from records
  const uniqueStudents = React.useMemo(() => {
    const studentMap = new Map<string, { id: string; name: string; email: string }>();
    records.forEach(r => {
      if (!studentMap.has(r.studentId)) {
        studentMap.set(r.studentId, {
          id: r.studentId,
          name: r.studentName || r.studentEmail || r.studentId,
          email: r.studentEmail || ""
        });
      }
    });
    return Array.from(studentMap.values());
  }, [records]);

  // Filter students based on search query
  const filteredStudents = React.useMemo(() => {
    if (!searchQuery.trim()) return uniqueStudents;
    const query = searchQuery.toLowerCase();
    return uniqueStudents.filter(s => 
      s.name.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query) ||
      s.id.toLowerCase().includes(query)
    );
  }, [uniqueStudents, searchQuery]);

  // Calculate summary stats
  const averageScore = React.useMemo(() => {
    if (records.length === 0) return 0;
    const sum = records.reduce((acc, r) => acc + r.score, 0);
    return Math.round(sum / records.length);
  }, [records]);

  const totalStudents = uniqueStudents.length;
  const totalAssessments = records.length;

  const handleViewStudent = (studentId: string) => {
    if (onViewStudent) {
      onViewStudent(studentId);
    }
  };

  const handleViewStudentById = () => {
    if (studentIdInput.trim() && onViewStudent) {
      onViewStudent(studentIdInput.trim());
    }
  };

  if (!rows || rows.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl text-white mb-2">
                Progress Report
              </h2>
              <p className="text-indigo-100">
                No data available to generate a report
              </p>
            </div>
            <Button 
              onClick={onBack}
              className="bg-white hover:bg-gray-100 text-indigo-600 shadow-md"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl p-12 text-center border border-gray-200/60">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            No records to display in this report 📊
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Add some progress records to generate a comprehensive report
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl text-white mb-2">
              📊 Progress Report
            </h2>
            <p className="text-indigo-100">
              Comprehensive analytics and student performance insights
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={onBack}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={onDownload}
              className="bg-white hover:bg-gray-100 text-indigo-600 shadow-md"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-5 md:grid-cols-3">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-200/60 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-5xl text-transparent bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text">
              {averageScore}%
            </span>
          </div>
          <p className="text-gray-900 mb-1">Average Score</p>
          <p className="text-sm text-gray-600">
            {averageScore >= 80
              ? "🌟 Excellent performance"
              : averageScore >= 70
                ? "👍 Good progress"
                : "💪 Room for improvement"}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-sm border border-purple-200/60 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-md">
              <User className="w-6 h-6 text-white" />
            </div>
            <span className="text-5xl text-transparent bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text">
              {totalStudents}
            </span>
          </div>
          <p className="text-gray-900 mb-1">Total Students</p>
          <p className="text-sm text-gray-600">
            {totalStudents > 20
              ? "📚 Large class"
              : totalStudents > 10
                ? "👥 Medium class"
                : "👤 Small class"}
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 shadow-sm border border-emerald-200/60 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-md">
              <Award className="w-6 h-6 text-white" />
            </div>
            <span className="text-5xl text-transparent bg-gradient-to-br from-emerald-600 to-green-600 bg-clip-text">
              {totalAssessments}
            </span>
          </div>
          <p className="text-gray-900 mb-1">Total Assessments</p>
          <p className="text-sm text-gray-600">
            {totalAssessments > 50
              ? "🎯 High engagement"
              : "📊 Growing data"}
          </p>
        </div>
      </div>

      {/* Student Search Section */}
      {onViewStudent && (
        <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50 rounded-2xl p-8 border border-slate-200/60 shadow-sm">
          <div className="mb-6">
            <h3 className="text-gray-900 mb-2">
              Track Individual Journeys
            </h3>
            <p className="text-gray-600">
              Search by name or enter student ID to view detailed progress 🔍
            </p>
          </div>
          
          <div className="grid gap-5 md:grid-cols-2">
            {/* Search by Name */}
            <div className="space-y-3">
              <Label className="text-gray-700 flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-500" />
                Search by Name or Email
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Type student name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 h-11 rounded-lg"
                />
              </div>
              
              {searchQuery && (
                <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm max-h-64 overflow-y-auto">
                  {filteredStudents.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {filteredStudents.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => handleViewStudent(student.id)}
                          className="w-full p-4 hover:bg-indigo-50 transition-colors text-left flex items-center gap-3 group"
                        >
                          <Avatar className="w-10 h-10 shadow-sm ring-2 ring-white group-hover:ring-indigo-100">
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                              {student.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-gray-900 group-hover:text-indigo-700 transition-colors">
                              {student.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {student.email}
                            </p>
                          </div>
                          <TrendingUp className="w-4 h-4 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">
                        No students found matching "{searchQuery}" 🔍
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Enter Student ID */}
            <div className="space-y-3">
              <Label className="text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-500" />
                Or Enter Student ID
              </Label>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter specific student ID..."
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleViewStudentById()}
                  className="flex-1 border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 h-11 rounded-lg"
                />
                <Button
                  onClick={handleViewStudentById}
                  disabled={!studentIdInput.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md h-11 px-6 rounded-lg"
                >
                  <User className="w-4 h-4 mr-2" />
                  View
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                💡 Tip: You can get student IDs from the analytics dashboard
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Analytics */}
      <div className="bg-gradient-to-br from-teal-50 via-white to-cyan-50 rounded-2xl p-8 border border-teal-200/60 shadow-sm">
        <div className="mb-6">
          <h3 className="text-gray-900 mb-2">
            Visual Analytics
          </h3>
          <p className="text-gray-600">
            Interactive charts showing trends, topics, and assessment distribution 📈
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
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
                  isAnimationActive
                  animationDuration={600}
                />
              </ReBarChart>
            </div>
          </div>
        </div>
      </div>

      {/* Student Performance Table */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl p-8 border border-purple-200/60 shadow-sm">
        <div className="mb-6">
          <h3 className="text-gray-900 mb-2">
            Detailed Performance Records
          </h3>
          <p className="text-gray-600">
            Complete breakdown of all student assessment records 🎯
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <TableHead className="text-gray-900">Student</TableHead>
                  <TableHead className="text-gray-900">Topic</TableHead>
                  <TableHead className="text-gray-900">Type</TableHead>
                  <TableHead className="text-gray-900">Score</TableHead>
                  <TableHead className="text-gray-900">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => {
                  const scoreColor = 
                    r.score >= 90 ? "text-emerald-700 bg-emerald-50" :
                    r.score >= 75 ? "text-blue-700 bg-blue-50" :
                    r.score >= 60 ? "text-amber-700 bg-amber-50" :
                    "text-rose-700 bg-rose-50";
                  
                  return (
                    <TableRow key={i} className="hover:bg-purple-50/30 transition-colors">
                      <TableCell className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 shadow-sm ring-2 ring-white">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                            {(r.studentEmail || r.studentId || "?")
                              .toString()
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-900">
                          {r.studentEmail && r.studentEmail.includes("@")
                            ? r.studentEmail
                            : r.studentId || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-900">{r.topic}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-white">
                          {normalizeType(r.assessmentType)}
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
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}