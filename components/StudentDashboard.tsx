import { useState } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BookOpen, 
  ClipboardCheck, 
  MessageSquare, 
  User,
  LogOut,
  TrendingUp,
  Bot,
  Award,
  FileSearch
} from 'lucide-react';
import { LearningMaterials } from './LearningMaterials';
import { TakeAssessment } from './TakeAssessment';
import { ProgressTracker } from './ProgressTracker';
import { Forum } from './Forum';
import { ProfileEditor } from './ProfileEditor';
import { AIChat } from './AIChat';
import { MyResults } from './MyResults';
import { AnnouncementBar } from './AnnouncementBar';
import ReviewAssessments from './ReviewAssessments';

interface StudentDashboardProps {
  user: any;
  session: any;
  onLogout: () => void;
}

export function StudentDashboard({ user, session, onLogout }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState('learn');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl text-indigo-900">FreeLearning</h1>
                <p className="text-sm text-gray-600">Student Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-900">{user.user_metadata.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Announcement Bar */}
      <AnnouncementBar session={session} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8 mb-6">
            <TabsTrigger value="learn" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Learn
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Practice
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <FileSearch className="w-4 h-4" />
              Review
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="ai-tutor" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI Tutor
            </TabsTrigger>
            <TabsTrigger value="forum" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Forum
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="learn" className="mt-0">
            <LearningMaterials session={session} />
          </TabsContent>

          <TabsContent value="practice" className="mt-0">
            <TakeAssessment session={session} userId={user.id} />
          </TabsContent>

          <TabsContent value="review" className="mt-0">
            <ReviewAssessments studentId={user.id} />
          </TabsContent>

          <TabsContent value="results" className="mt-0">
            <MyResults session={session} />
          </TabsContent>

          <TabsContent value="progress" className="mt-0">
            <ProgressTracker session={session} userId={user.id} userRole="student" />
          </TabsContent>

          <TabsContent value="ai-tutor" className="mt-0">
            <AIChat session={session} />
          </TabsContent>

          <TabsContent value="forum" className="mt-0">
            <Forum session={session} user={user} />
          </TabsContent>

          <TabsContent value="profile" className="mt-0">
            <ProfileEditor user={user} session={session} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}