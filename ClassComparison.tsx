import { useState, useEffect } from "react";
import {
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
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { toast } from "sonner@2.0.3";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  ArrowLeft,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Checkbox } from "./ui/checkbox";

interface ClassData {
  id: string;
  name: string;
  created_at: string;
  teacher_id: string;
}

interface ComparisonData {
  class_id: string;
  class_name: string;
  average_score: number;
  total_students: number;
  at_risk_count: number;
  improving_count: number;
  declining_count: number;
  topic_scores: {
    [topic: string]: number;
  };
}

interface ClassComparisonProps {
  session: any;
  onNavigateBack?: () => void;
}

const ASSESSMENT_TYPES = [
  "Fundamentals",
  "Design Principles",
  "Usability",
  "Prototyping",
];

export function ClassComparison({ session, onNavigateBack }: ClassComparisonProps) {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (session?.access_token) {
      loadClasses();
    }
  }, [session]);

  const loadClasses = async () => {
    if (!session?.access_token) return;
    
    try {
      const response = await serverFetch(
        `/classes`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
    }
  };

  const toggleClassSelection = (classId: string) => {
    const newSelection = new Set(selectedClasses);
    if (newSelection.has(classId)) {
      newSelection.delete(classId);
    } else {
      newSelection.add(classId);
    }
    setSelectedClasses(newSelection);
  };

  const generateComparison = async () => {
    if (selectedClasses.size === 0) {
      toast.error("Please select at least one class");
      return;
    }

    setLoading(true);
    try {
      const classIds = Array.from(selectedClasses);
      const params = new URLSearchParams();
      classIds.forEach(id => params.append("class_ids", id));
      if (selectedTopic !== "all") params.append("topic", selectedTopic);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const response = await serverFetch(
        `/class-comparison?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setComparisonData(data.comparison || []);
        setHasGenerated(true);
        toast.success("Comparison generated successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to generate comparison");
      }
    } catch (error) {
      console.error("Error generating comparison:", error);
      toast.error("Failed to generate comparison");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (count: number, type: "at-risk" | "improving" | "declining") => {
    if (count === 0) return null;

    const variants = {
      "at-risk": { className: "bg-red-100 text-red-700", label: "At-Risk" },
      improving: { className: "bg-green-100 text-green-700", label: "Improving" },
      declining: { className: "bg-orange-100 text-orange-700", label: "Declining" },
    };

    const config = variants[type];
    return (
      <Badge className={config.className}>
        {count} {config.label}
      </Badge>
    );
  };

  // Prepare data for bar chart
  const barChartData = comparisonData.map((cls) => ({
    name: cls.class_name,
    average: cls.average_score,
    atRisk: cls.at_risk_count,
    improving: cls.improving_count,
    declining: cls.declining_count,
  }));

  // Prepare data for topic comparison (if topic is selected)
  const topicChartData = selectedTopic !== "all"
    ? comparisonData.map((cls) => ({
        name: cls.class_name,
        score: cls.topic_scores[selectedTopic] || 0,
      }))
    : [];

  // Safety check for session - render after hooks
  if (!session || !session.access_token) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Session expired. Please log in again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            {onNavigateBack && (
              <Button
                onClick={onNavigateBack}
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Classes
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl text-white">Class Performance Analytics</h2>
          </div>
          <p className="text-white/90 ml-[60px] max-w-2xl">
            Compare, contrast, and discover insights across all your classes with powerful analytics
          </p>
        </div>
      </div>

      {/* Selection Criteria Card */}
      <Card className="shadow-lg rounded-xl border-indigo-200 overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-indigo-50 to-blue-50 border-b border-indigo-100">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            Analysis Filters
          </CardTitle>
          <CardDescription>
            Customize your comparison by selecting classes, topics, and date ranges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Select Classes */}
          <div className="space-y-3">
            <Label className="text-gray-700">Select Classes to Compare</Label>
            <div className="border-2 border-indigo-100 rounded-xl p-4 space-y-2 max-h-64 overflow-y-auto bg-gradient-to-br from-gray-50 to-indigo-50/30">
              {classes.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    No classes available. Create classes in the Class Management page.
                  </p>
                </div>
              ) : (
                classes.map((cls) => (
                  <div 
                    key={cls.id} 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/60 transition-colors"
                  >
                    <Checkbox
                      id={`class-${cls.id}`}
                      checked={selectedClasses.has(cls.id)}
                      onCheckedChange={() => toggleClassSelection(cls.id)}
                    />
                    <Label
                      htmlFor={`class-${cls.id}`}
                      className="cursor-pointer font-normal flex-1"
                    >
                      {cls.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
            {selectedClasses.size > 0 && (
              <div className="flex items-center gap-2 text-sm bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg">
                <BarChart3 className="w-4 h-4" />
                <span>{selectedClasses.size} class(es) selected for comparison</span>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Select Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-gray-700">Filter by Topic (Optional)</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger id="topic" className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                  <SelectValue placeholder="All topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All topics</SelectItem>
                  {ASSESSMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-gray-700">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date Range (Optional)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Start"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="End"
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateComparison}
            disabled={loading || selectedClasses.size === 0}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md"
            size="lg"
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            {loading ? "Generating Analysis..." : "Generate Comparison Report"}
          </Button>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {hasGenerated && (
        <>
          {/* Summary Table */}
          <Card className="shadow-lg rounded-xl border-gray-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-gray-50 to-white border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    Performance Summary
                  </CardTitle>
                  <CardDescription>
                    Key metrics across {comparisonData.length} selected class(es)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {comparisonData.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No data available for the selected criteria</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or date range</p>
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Class Name</TableHead>
                        <TableHead>Average Score</TableHead>
                        <TableHead>Total Students</TableHead>
                        <TableHead>Status Indicators</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonData.map((cls) => (
                        <TableRow key={cls.class_id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                              <span className="font-medium text-gray-900">{cls.class_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-semibold text-gray-900">
                                {cls.average_score.toFixed(1)}%
                              </span>
                              {cls.average_score >= 80 && (
                                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
                                  <TrendingUp className="w-3 h-3" />
                                  <span>Excellent</span>
                                </div>
                              )}
                              {cls.average_score < 60 && (
                                <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs">
                                  <TrendingDown className="w-3 h-3" />
                                  <span>Needs Support</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-lg text-gray-700">{cls.total_students}</span>
                              <span className="text-sm text-gray-500">students</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {getStatusBadge(cls.at_risk_count, "at-risk")}
                              {getStatusBadge(cls.improving_count, "improving")}
                              {getStatusBadge(cls.declining_count, "declining")}
                              {cls.at_risk_count === 0 && cls.improving_count === 0 && cls.declining_count === 0 && (
                                <Badge className="bg-gray-100 text-gray-600">No trends</Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart - Average Scores */}
          {comparisonData.length > 0 && (
            <Card className="shadow-lg rounded-xl border-gray-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  Average Score Comparison
                </CardTitle>
                <CardDescription>
                  Visual comparison of class performance
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#6b7280' }}
                      tickLine={{ stroke: '#9ca3af' }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fill: '#6b7280' }}
                      tickLine={{ stroke: '#9ca3af' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar 
                      dataKey="average" 
                      fill="#4f46e5" 
                      name="Average Score (%)"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Student Status Chart */}
          {comparisonData.length > 0 && (
            <Card className="shadow-lg rounded-xl border-gray-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50 border-b border-purple-100">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  Student Performance Trends
                </CardTitle>
                <CardDescription>
                  Distribution of students across performance categories
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name"
                      tick={{ fill: '#6b7280' }}
                      tickLine={{ stroke: '#9ca3af' }}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280' }}
                      tickLine={{ stroke: '#9ca3af' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="atRisk" fill="#dc2626" name="At-Risk" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="improving" fill="#16a34a" name="Improving" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="declining" fill="#ea580c" name="Declining" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Topic Comparison Chart (if topic selected) */}
          {selectedTopic !== "all" && topicChartData.length > 0 && (
            <Card className="shadow-lg rounded-xl border-gray-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50 border-b border-green-100">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                  </div>
                  Topic Analysis: {selectedTopic}
                </CardTitle>
                <CardDescription>
                  Focused comparison for this specific topic
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={topicChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name"
                      tick={{ fill: '#6b7280' }}
                      tickLine={{ stroke: '#9ca3af' }}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fill: '#6b7280' }}
                      tickLine={{ stroke: '#9ca3af' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#10b981"
                      strokeWidth={3}
                      name="Topic Score (%)"
                      dot={{ r: 6, fill: '#10b981' }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* At-Risk Alert */}
          {comparisonData.some((cls) => cls.at_risk_count > 0) && (
            <Card className="shadow-lg rounded-xl border-orange-300 bg-gradient-to-br from-orange-50 to-red-50 overflow-hidden">
              <CardHeader className="border-b border-orange-200">
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <div className="p-2 bg-orange-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-700" />
                  </div>
                  Classes Requiring Attention
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Action recommended for classes with at-risk students
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {comparisonData
                    .filter((cls) => cls.at_risk_count > 0)
                    .map((cls) => (
                      <div
                        key={cls.class_id}
                        className="flex items-center justify-between bg-white p-4 rounded-xl border-2 border-orange-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{cls.class_name}</p>
                            <p className="text-sm text-gray-600">
                              {cls.at_risk_count} student(s) scoring below 60%
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-red-600 text-white px-4 py-2">
                          Needs Support
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}