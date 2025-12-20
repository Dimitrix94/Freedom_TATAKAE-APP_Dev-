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
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner@2.0.3";
import { 
  Users, 
  Plus, 
  Search, 
  Trash2,
  CheckCircle,
  UserPlus,
  BarChart3
} from "lucide-react";

interface ClassData {
  id: string;
  name: string;
  created_at: string;
  teacher_id: string;
}

interface Student {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    student_id?: string;
  };
}

interface ClassAssignmentData {
  id: string;
  class_id: string;
  student_id: string;
  assigned_at: string;
}

interface ClassAssignmentProps {
  session: any;
  onNavigateToComparison?: () => void;
}

export function ClassAssignment({ session, onNavigateToComparison }: ClassAssignmentProps) {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [assignedStudents, setAssignedStudents] = useState<Student[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<string | null>(null);

  // Load classes and students
  useEffect(() => {
    loadClasses();
    loadStudents();
  }, [session]);

  // Load assigned students when class is selected
  useEffect(() => {
    if (selectedClass) {
      loadAssignedStudents(selectedClass);
    } else {
      setAssignedStudents([]);
    }
  }, [selectedClass]);

  const loadClasses = async () => {
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

  const loadStudents = async () => {
    try {
      const response = await serverFetch(
        `/students`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error("Error loading students:", error);
    }
  };

  const loadAssignedStudents = async (classId: string) => {
    try {
      const response = await serverFetch(
        `/class-assignments?class_id=${classId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const assignedIds = data.assignments?.map((a: ClassAssignmentData) => a.student_id) || [];
        const assigned = students.filter(s => assignedIds.includes(s.id));
        setAssignedStudents(assigned);
      }
    } catch (error) {
      console.error("Error loading assigned students:", error);
    }
  };

  const createClass = async () => {
    if (!newClassName.trim()) {
      toast.error("Please enter a class name");
      return;
    }

    setLoading(true);
    try {
      const response = await serverFetch(
        `/classes`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newClassName }),
        }
      );

      if (response.ok) {
        toast.success("Class successfully created");
        setNewClassName("");
        await loadClasses();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create class");
      }
    } catch (error) {
      console.error("Error creating class:", error);
      toast.error("Failed to create class");
    } finally {
      setLoading(false);
    }
  };

  const assignStudentsToClass = async () => {
    if (!selectedClass) {
      toast.error("Please select a class");
      return;
    }

    if (selectedStudents.size === 0) {
      toast.error("Please select at least one student");
      return;
    }

    setLoading(true);
    try {
      const studentIds = Array.from(selectedStudents);
      const response = await serverFetch(
        `/class-assignments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            class_id: selectedClass,
            student_ids: studentIds,
          }),
        }
      );

      if (response.ok) {
        toast.success(`${studentIds.length} student(s) assigned successfully`);
        setSelectedStudents(new Set());
        await loadAssignedStudents(selectedClass);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to assign students");
      }
    } catch (error) {
      console.error("Error assigning students:", error);
      toast.error("Failed to assign students");
    } finally {
      setLoading(false);
    }
  };

  const removeStudentFromClass = async (studentId: string) => {
    if (!selectedClass) return;

    setLoading(true);
    try {
      const response = await serverFetch(
        `/class-assignments`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            class_id: selectedClass,
            student_id: studentId,
          }),
        }
      );

      if (response.ok) {
        toast.success("Student removed from class");
        await loadAssignedStudents(selectedClass);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to remove student");
      }
    } catch (error) {
      console.error("Error removing student:", error);
      toast.error("Failed to remove student");
    } finally {
      setLoading(false);
      setStudentToRemove(null);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    const name = student.user_metadata.name?.toLowerCase() || "";
    const email = student.email.toLowerCase();
    const studentId = student.user_metadata.student_id?.toLowerCase() || "";
    
    return (
      name.includes(searchLower) ||
      email.includes(searchLower) ||
      studentId.includes(searchLower)
    );
  });

  // Filter out already assigned students from the selection list
  const assignedStudentIds = new Set(assignedStudents.map(s => s.id));
  const availableStudents = filteredStudents.filter(s => !assignedStudentIds.has(s.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl text-white">Class Management</h2>
          </div>
          <p className="text-white/90 ml-[60px] max-w-2xl">
            Build your learning communities. Organize students into classes and unlock powerful group insights.
          </p>
        </div>
      </div>

      {/* Section 1: Create / Select Class */}
      <Card className="shadow-xl rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-b border-slate-200/60">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Your Classes
              </span>
            </CardTitle>
            <CardDescription className="text-slate-600 ml-[52px]">
              Create a new learning space or select an existing class to get started
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6 bg-white">
          {/* Create New Class */}
          <div className="space-y-3">
            <Label htmlFor="className" className="text-slate-700 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-500" />
              Create New Class
            </Label>
            <div className="flex gap-3">
              <Input
                id="className"
                placeholder="e.g., HCI Group A, Spring 2024"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && createClass()}
                className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 h-11 rounded-lg transition-all"
              />
              <Button
                onClick={createClass}
                disabled={loading || !newClassName.trim()}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200 h-11 px-6 rounded-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>
          </div>

          {/* Select Existing Class */}
          <div className="space-y-3">
            <Label htmlFor="selectClass" className="text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Select Existing Class
            </Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger id="selectClass" className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 h-11 rounded-lg transition-all">
                <SelectValue placeholder="Choose a class to manage..." />
              </SelectTrigger>
              <SelectContent>
                {classes.length === 0 ? (
                  <SelectItem value="no-classes" disabled>No classes available - create one above</SelectItem>
                ) : (
                  classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedClass && (
              <div className="flex items-center gap-2.5 text-sm bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Currently managing</p>
                  <p className="text-indigo-700">{classes.find(c => c.id === selectedClass)?.name}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Student List */}
      {selectedClass && (
        <Card className="shadow-xl rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-b border-slate-200/60">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Add Students
                </span>
              </CardTitle>
              <CardDescription className="text-slate-600 ml-[52px]">
                Search and select students to join <span className="text-emerald-600">{classes.find(c => c.id === selectedClass)?.name}</span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6 bg-white">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search by Student ID or Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 border-slate-200 focus:border-green-400 focus:ring-green-400/20 h-11 rounded-lg transition-all"
              />
            </div>

            {/* Student Table */}
            <div className="border rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Student Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-12 h-12 text-gray-300" />
                          <p>
                            {searchTerm
                              ? "No students found matching your search"
                              : "All students are already assigned to this class"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    availableStudents.map((student) => (
                      <TableRow key={student.id} className="hover:bg-gray-50">
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.has(student.id)}
                            onCheckedChange={() => toggleStudentSelection(student.id)}
                          />
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {student.user_metadata.student_id || student.email}
                        </TableCell>
                        <TableCell>{student.user_metadata.name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Selected count indicator */}
            {selectedStudents.size > 0 && (
              <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Selected</p>
                    <p className="text-green-700">{selectedStudents.size} student(s)</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStudents(new Set())}
                  className="text-green-600 hover:text-green-700 hover:bg-green-100"
                >
                  Clear
                </Button>
              </div>
            )}

            {/* Section 3: Assign to Class Button */}
            <Button
              onClick={assignStudentsToClass}
              disabled={loading || !selectedClass || selectedStudents.size === 0}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 h-12 rounded-xl"
              size="lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Assign {selectedStudents.size > 0 ? `${selectedStudents.size} ` : ''}Student(s) to Class
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Section 4: Assigned Students Overview */}
      {selectedClass && (
        <Card className="shadow-xl rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-slate-200/60">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Enrolled Students
                  </span>
                </CardTitle>
                <CardDescription className="text-slate-600 ml-[52px]">
                  {assignedStudents.length} {assignedStudents.length === 1 ? 'student' : 'students'} currently in {classes.find(c => c.id === selectedClass)?.name}
                </CardDescription>
              </div>
              {assignedStudents.length > 0 && (
                <div className="flex flex-col items-center gap-1 bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-5 py-3 rounded-xl shadow-lg">
                  <span className="text-2xl">{assignedStudents.length}</span>
                  <span className="text-xs opacity-90">Enrolled</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="border rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Student ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="w-24 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-12">
                        <div className="flex flex-col items-center gap-2">
                          <UserPlus className="w-12 h-12 text-gray-300" />
                          <p>No students assigned yet</p>
                          <p className="text-sm">Use the section above to add students</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignedStudents.map((student) => (
                      <TableRow key={student.id} className="hover:bg-gray-50">
                        <TableCell className="text-gray-600">
                          {student.user_metadata.student_id || student.email}
                        </TableCell>
                        <TableCell>{student.user_metadata.name}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setStudentToRemove(student.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 5: Compare Class Performance */}
      <Card className="shadow-xl rounded-2xl border border-slate-200/60 overflow-hidden bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 hover:shadow-2xl transition-all duration-300">
        <CardHeader className="border-b border-slate-200/60">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl shadow-md">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                Analytics & Insights
              </span>
            </CardTitle>
            <CardDescription className="text-slate-600 ml-[52px]">
              Unlock the power of comparative analytics across all your classes
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="bg-white/70 backdrop-blur-sm p-5 rounded-xl border border-orange-100 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-700 leading-relaxed">
                    Dive deep into performance metrics. Compare average scores, spot at-risk students early, and discover learning trends with beautiful interactive visualizations.
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={onNavigateToComparison}
              className="w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 h-12 rounded-xl"
              size="lg"
              disabled={classes.length === 0}
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Open Class Comparison Dashboard
            </Button>
            {classes.length === 0 && (
              <p className="text-sm text-gray-500 text-center">
                Create at least one class to access analytics
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Remove Student Confirmation Dialog */}
      <AlertDialog open={!!studentToRemove} onOpenChange={() => setStudentToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student from Class?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the student from the class. The student's progress records will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => studentToRemove && removeStudentFromClass(studentToRemove)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}