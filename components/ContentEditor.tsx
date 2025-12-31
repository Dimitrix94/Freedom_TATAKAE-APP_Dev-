import { useState, useEffect } from 'react';
import { getServerUrl, serverFetch, createClient } from '../utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Settings, Save, Plus, Trash2, Edit2, Megaphone, AlertCircle, CheckCircle, XCircle, MessageSquare, BookOpen, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ContentEditorProps {
  session: any;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

interface PendingMaterial {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  difficulty: string;
  created_by: string;
  created_at: string;
  submitted_by_name?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
}

interface PendingTopic {
  id: string;
  title: string;
  content: string;
  category: string;
  author_id: string;
  author_name: string;
  created_at: string;
  approval_status: 'pending' | 'approved' | 'rejected';
}

export function ContentEditor({ session }: ContentEditorProps) {
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<Record<string, any>>({});
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });
  
  // New state for user content moderation
  const [pendingMaterials, setPendingMaterials] = useState<PendingMaterial[]>([]);
  const [pendingTopics, setPendingTopics] = useState<PendingTopic[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  useEffect(() => {
    fetchContent();
    fetchAnnouncements();
    fetchPendingContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch(getServerUrl('/content'), {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      
      // Convert array to object keyed by page name
      const contentMap: Record<string, any> = {};
      data.content?.forEach((item: any) => {
        const pageName = item.id?.replace('content:', '') || '';
        contentMap[pageName] = item;
      });
      
      setContent(contentMap);
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(getServerUrl('/content/announcements'), {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      
      // Handle the content structure
      if (data.content && data.content.announcements) {
        const announcementsList = Array.isArray(data.content.announcements) 
          ? data.content.announcements 
          : [];
        
        // Sort by createdAt (newest first)
        const sorted = announcementsList.sort((a: Announcement, b: Announcement) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setAnnouncements(sorted);
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
    }
  };

  const fetchPendingContent = async () => {
    setLoadingPending(true);
    try {
      const response = await fetch(getServerUrl('/content/pending'), {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      
      // Handle the content structure
      if (data.content && data.content.pendingMaterials) {
        const materialsList = Array.isArray(data.content.pendingMaterials) 
          ? data.content.pendingMaterials 
          : [];
        
        setPendingMaterials(materialsList);
      } else {
        setPendingMaterials([]);
      }

      if (data.content && data.content.pendingTopics) {
        const topicsList = Array.isArray(data.content.pendingTopics) 
          ? data.content.pendingTopics 
          : [];
        
        setPendingTopics(topicsList);
      } else {
        setPendingTopics([]);
      }
    } catch (error) {
      console.error('Error fetching pending content:', error);
      setPendingMaterials([]);
      setPendingTopics([]);
    } finally {
      setLoadingPending(false);
    }
  };

  const handleSave = async (page: string, data: any) => {
    setSaving(true);
    try {
      console.log(`ContentEditor - Saving ${page} content:`, data);
      const response = await fetch(getServerUrl(`/content/${page}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('ContentEditor - Save failed:', errorData);
        throw new Error('Failed to update content');
      }

      console.log('ContentEditor - Save successful');
      toast.success('Content updated successfully! Changes are now live.', {
        description: 'All users will see the updated content within 5 seconds.',
      });
      fetchContent();
    } catch (error: any) {
      console.error('Content update error:', error);
      toast.error(error.message || 'Failed to update content');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementForm.message.trim()) {
      toast.error('Please enter an announcement message');
      return;
    }

    setSaving(true);
    try {
      const newAnnouncement: Announcement = {
        id: `announcement-${Date.now()}`,
        title: announcementForm.title,
        message: announcementForm.message,
        priority: announcementForm.priority,
        createdAt: new Date().toISOString(),
        createdBy: session.user.id,
      };

      const updatedAnnouncements = [newAnnouncement, ...announcements];

      const response = await fetch(getServerUrl('/content/announcements'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ announcements: updatedAnnouncements }),
      });

      if (!response.ok) {
        throw new Error('Failed to create announcement');
      }

      toast.success('Announcement created successfully!');
      setShowAnnouncementDialog(false);
      setAnnouncementForm({ title: '', message: '', priority: 'medium' });
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Create announcement error:', error);
      toast.error(error.message || 'Failed to create announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement || !announcementForm.message.trim()) {
      toast.error('Please enter an announcement message');
      return;
    }

    setSaving(true);
    try {
      const updatedAnnouncements = announcements.map(ann => 
        ann.id === editingAnnouncement.id
          ? {
              ...ann,
              title: announcementForm.title,
              message: announcementForm.message,
              priority: announcementForm.priority,
              updatedAt: new Date().toISOString(),
              updatedBy: session.user.id,
            }
          : ann
      );

      const response = await fetch(getServerUrl('/content/announcements'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ announcements: updatedAnnouncements }),
      });

      if (!response.ok) {
        throw new Error('Failed to update announcement');
      }

      toast.success('Announcement updated successfully!');
      setShowAnnouncementDialog(false);
      setEditingAnnouncement(null);
      setAnnouncementForm({ title: '', message: '', priority: 'medium' });
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Update announcement error:', error);
      toast.error(error.message || 'Failed to update announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    setSaving(true);
    try {
      const updatedAnnouncements = announcements.filter(ann => ann.id !== id);

      const response = await fetch(getServerUrl('/content/announcements'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ announcements: updatedAnnouncements }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }

      toast.success('Announcement deleted successfully!');
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Delete announcement error:', error);
      toast.error(error.message || 'Failed to delete announcement');
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority,
    });
    setShowAnnouncementDialog(true);
  };

  const openCreateDialog = () => {
    setEditingAnnouncement(null);
    setAnnouncementForm({ title: '', message: '', priority: 'medium' });
    setShowAnnouncementDialog(true);
  };

  const handleHomeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    handleSave('landing', {
      heroTitle: formData.get('heroTitle'),
      heroSubtitle: formData.get('heroSubtitle'),
      featuresTitle: formData.get('featuresTitle'),
      featuresSubtitle: formData.get('featuresSubtitle'),
      howItWorksTitle: formData.get('howItWorksTitle'),
      ctaTitle: formData.get('ctaTitle'),
      ctaSubtitle: formData.get('ctaSubtitle'),
    });
  };

  const handleAboutSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    handleSave('about', {
      pageTitle: formData.get('pageTitle'),
      pageSubtitle: formData.get('pageSubtitle'),
      missionTitle: formData.get('missionTitle'),
      missionDescription: formData.get('missionDescription'),
      missionContent: formData.get('missionContent'),
      differenceTitle: formData.get('differenceTitle'),
      technologyTitle: formData.get('technologyTitle'),
      technologyDescription: formData.get('technologyDescription'),
      capabilitiesTitle: formData.get('capabilitiesTitle'),
      teachersTitle: formData.get('teachersTitle'),
      teachersDescription: formData.get('teachersDescription'),
      studentsTitle: formData.get('studentsTitle'),
      studentsDescription: formData.get('studentsDescription'),
      aboutCtaTitle: formData.get('aboutCtaTitle'),
      aboutCtaSubtitle: formData.get('aboutCtaSubtitle'),
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-700 bg-red-50 border-red-200';
      case 'medium': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-700 bg-gray-50 border-gray-200';
      default: return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl text-gray-900">Website Content Management</h2>
        <p className="text-gray-600 mt-1">Edit website pages and announcements</p>
      </div>

      <Tabs defaultValue="home">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="home">Home Page</TabsTrigger>
          <TabsTrigger value="about">About Page</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="user-content">
            <Clock className="w-4 h-4 mr-2" />
            User Content
            {(pendingMaterials.length + pendingTopics.length > 0) && (
              <Badge className="ml-2 bg-orange-500">{pendingMaterials.length + pendingTopics.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="home">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Home Page Content
              </CardTitle>
              <CardDescription>Edit the main landing page content</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleHomeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="heroTitle">Hero Title</Label>
                  <Input
                    id="heroTitle"
                    name="heroTitle"
                    defaultValue={content.landing?.heroTitle || 'Welcome to FreeLearning'}
                    placeholder="Welcome to FreeLearning"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                  <Textarea
                    id="heroSubtitle"
                    name="heroSubtitle"
                    defaultValue={content.landing?.heroSubtitle || 'Your interactive HCI learning platform'}
                    placeholder="Brief welcome message"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="featuresTitle">Features Section Title</Label>
                  <Input
                    id="featuresTitle"
                    name="featuresTitle"
                    defaultValue={content.landing?.featuresTitle || 'Platform Features'}
                    placeholder="Platform Features"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="featuresSubtitle">Features Section Subtitle</Label>
                  <Textarea
                    id="featuresSubtitle"
                    name="featuresSubtitle"
                    defaultValue={content.landing?.featuresSubtitle || 'Explore the key features of our platform'}
                    placeholder="Features section subtitle"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="howItWorksTitle">How It Works Title</Label>
                  <Input
                    id="howItWorksTitle"
                    name="howItWorksTitle"
                    defaultValue={content.landing?.howItWorksTitle || 'How It Works'}
                    placeholder="How It Works"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaTitle">Call to Action Title</Label>
                  <Input
                    id="ctaTitle"
                    name="ctaTitle"
                    defaultValue={content.landing?.ctaTitle || 'Get Started'}
                    placeholder="Get Started"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaSubtitle">Call to Action Subtitle</Label>
                  <Textarea
                    id="ctaSubtitle"
                    name="ctaSubtitle"
                    defaultValue={content.landing?.ctaSubtitle || 'Join our community and start learning today'}
                    placeholder="Call to action subtitle"
                    rows={3}
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Home Page'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                About Page Content
              </CardTitle>
              <CardDescription>Edit the about page information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAboutSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pageTitle">Page Title</Label>
                  <Input
                    id="pageTitle"
                    name="pageTitle"
                    defaultValue={content.about?.pageTitle || 'About FreeLearning'}
                    placeholder="About FreeLearning"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pageSubtitle">Page Subtitle</Label>
                  <Textarea
                    id="pageSubtitle"
                    name="pageSubtitle"
                    defaultValue={content.about?.pageSubtitle || 'FreeLearning is an interactive HCI education platform...'}
                    placeholder="Platform description"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="missionTitle">Mission Title</Label>
                  <Input
                    id="missionTitle"
                    name="missionTitle"
                    defaultValue={content.about?.missionTitle || 'Our Mission'}
                    placeholder="Our Mission"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="missionDescription">Mission Description</Label>
                  <Textarea
                    id="missionDescription"
                    name="missionDescription"
                    defaultValue={content.about?.missionDescription || 'Our mission is to make HCI education accessible...'}
                    placeholder="Mission statement"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="missionContent">Mission Content</Label>
                  <Textarea
                    id="missionContent"
                    name="missionContent"
                    defaultValue={content.about?.missionContent || 'We believe in providing high-quality education...'}
                    placeholder="Mission content"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="differenceTitle">Difference Title</Label>
                  <Input
                    id="differenceTitle"
                    name="differenceTitle"
                    defaultValue={content.about?.differenceTitle || 'What Sets Us Apart'}
                    placeholder="What Sets Us Apart"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technologyTitle">Technology Title</Label>
                  <Input
                    id="technologyTitle"
                    name="technologyTitle"
                    defaultValue={content.about?.technologyTitle || 'Advanced Technology'}
                    placeholder="Advanced Technology"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technologyDescription">Technology Description</Label>
                  <Textarea
                    id="technologyDescription"
                    name="technologyDescription"
                    defaultValue={content.about?.technologyDescription || 'Our platform is built on cutting-edge technology...'}
                    placeholder="Technology description"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capabilitiesTitle">Capabilities Title</Label>
                  <Input
                    id="capabilitiesTitle"
                    name="capabilitiesTitle"
                    defaultValue={content.about?.capabilitiesTitle || 'Platform Capabilities'}
                    placeholder="Platform Capabilities"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teachersTitle">Teachers Title</Label>
                  <Input
                    id="teachersTitle"
                    name="teachersTitle"
                    defaultValue={content.about?.teachersTitle || 'For Teachers'}
                    placeholder="For Teachers"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teachersDescription">Teachers Description</Label>
                  <Textarea
                    id="teachersDescription"
                    name="teachersDescription"
                    defaultValue={content.about?.teachersDescription || 'Empower your students with our platform...'}
                    placeholder="Teachers description"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentsTitle">Students Title</Label>
                  <Input
                    id="studentsTitle"
                    name="studentsTitle"
                    defaultValue={content.about?.studentsTitle || 'For Students'}
                    placeholder="For Students"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentsDescription">Students Description</Label>
                  <Textarea
                    id="studentsDescription"
                    name="studentsDescription"
                    defaultValue={content.about?.studentsDescription || 'Learn HCI with ease and efficiency...'}
                    placeholder="Students description"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aboutCtaTitle">About CTA Title</Label>
                  <Input
                    id="aboutCtaTitle"
                    name="aboutCtaTitle"
                    defaultValue={content.about?.aboutCtaTitle || 'Join Us'}
                    placeholder="Join Us"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aboutCtaSubtitle">About CTA Subtitle</Label>
                  <Textarea
                    id="aboutCtaSubtitle"
                    name="aboutCtaSubtitle"
                    defaultValue={content.about?.aboutCtaSubtitle || 'Experience the future of HCI education...'}
                    placeholder="About CTA subtitle"
                    rows={4}
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save About Page'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                Announcements
              </CardTitle>
              <CardDescription>Manage platform announcements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  type="button"
                  onClick={openCreateDialog}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Announcement
                </Button>

                {announcements.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No announcements yet. Create one to get started!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((announcement) => (
                      <Card key={announcement.id} className={`border-2 ${getPriorityColor(announcement.priority)}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <Megaphone className="w-5 h-5 mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {announcement.title && (
                                  <p className="font-semibold">{announcement.title}</p>
                                )}
                                <span className={`px-2 py-1 text-xs rounded ${getPriorityBadgeColor(announcement.priority)}`}>
                                  {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                                </span>
                              </div>
                              <p className="text-sm mb-2">{announcement.message}</p>
                              <p className="text-xs text-gray-500">
                                Created: {new Date(announcement.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(announcement)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="user-content">
          <div className="space-y-6">
            {/* Pending Materials Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Pending Materials
                  {pendingMaterials.length > 0 && (
                    <Badge className="bg-orange-500">{pendingMaterials.length}</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Review and approve user-submitted learning materials
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPending ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading pending content...</p>
                  </div>
                ) : pendingMaterials.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      No pending materials to review. All caught up!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {pendingMaterials.map((material) => (
                      <Card key={material.id} className="border-2 border-orange-200 bg-orange-50">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{material.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                              </div>
                              <Badge className="bg-orange-500 ml-2">Pending</Badge>
                            </div>
                            
                            <div className="flex gap-2 text-sm">
                              <Badge variant="outline">{material.category}</Badge>
                              <Badge variant="outline">{material.difficulty}</Badge>
                            </div>
                            
                            <div className="bg-white p-3 rounded border">
                              <p className="text-sm text-gray-700 line-clamp-3">{material.content}</p>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2">
                              <div className="text-xs text-gray-500">
                                Submitted by: {material.submitted_by_name || 'Unknown'} • {new Date(material.created_at).toLocaleString()}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={async () => {
                                    setSaving(true);
                                    try {
                                      const supabase = createClient();
                                      const { error } = await supabase
                                        .from('materials')
                                        .update({ approval_status: 'approved' })
                                        .eq('id', material.id);
                                      
                                      if (error) throw error;
                                      
                                      toast.success('Material approved successfully!');
                                      fetchPendingContent();
                                    } catch (error: any) {
                                      toast.error('Failed to approve material');
                                    } finally {
                                      setSaving(false);
                                    }
                                  }}
                                  disabled={saving}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    if (!confirm('Are you sure you want to reject this material?')) return;
                                    
                                    setSaving(true);
                                    try {
                                      const supabase = createClient();
                                      const { error } = await supabase
                                        .from('materials')
                                        .update({ approval_status: 'rejected' })
                                        .eq('id', material.id);
                                      
                                      if (error) throw error;
                                      
                                      toast.success('Material rejected');
                                      fetchPendingContent();
                                    } catch (error: any) {
                                      toast.error('Failed to reject material');
                                    } finally {
                                      setSaving(false);
                                    }
                                  }}
                                  disabled={saving}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Topics Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Pending Discussion Topics
                  {pendingTopics.length > 0 && (
                    <Badge className="bg-orange-500">{pendingTopics.length}</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Review and approve user-created forum topics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPending ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading pending content...</p>
                  </div>
                ) : pendingTopics.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      No pending topics to review. All caught up!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {pendingTopics.map((topic) => (
                      <Card key={topic.id} className="border-2 border-orange-200 bg-orange-50">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{topic.title}</h4>
                              </div>
                              <Badge className="bg-orange-500 ml-2">Pending</Badge>
                            </div>
                            
                            <Badge variant="outline">{topic.category}</Badge>
                            
                            <div className="bg-white p-3 rounded border">
                              <p className="text-sm text-gray-700">{topic.content}</p>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2">
                              <div className="text-xs text-gray-500">
                                Posted by: {topic.author_name} • {new Date(topic.created_at).toLocaleString()}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={async () => {
                                    setSaving(true);
                                    try {
                                      const supabase = createClient();
                                      const { error } = await supabase
                                        .from('topics')
                                        .update({ approval_status: 'approved' })
                                        .eq('id', topic.id);
                                      
                                      if (error) throw error;
                                      
                                      toast.success('Topic approved successfully!');
                                      fetchPendingContent();
                                    } catch (error: any) {
                                      toast.error('Failed to approve topic');
                                    } finally {
                                      setSaving(false);
                                    }
                                  }}
                                  disabled={saving}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    if (!confirm('Are you sure you want to reject this topic?')) return;
                                    
                                    setSaving(true);
                                    try {
                                      const supabase = createClient();
                                      const { error } = await supabase
                                        .from('topics')
                                        .update({ approval_status: 'rejected' })
                                        .eq('id', topic.id);
                                      
                                      if (error) throw error;
                                      
                                      toast.success('Topic rejected');
                                      fetchPendingContent();
                                    } catch (error: any) {
                                      toast.error('Failed to reject topic');
                                    } finally {
                                      setSaving(false);
                                    }
                                  }}
                                  disabled={saving}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Content changes are saved to the database and broadcast in real-time.
            All users viewing the landing or about pages will see updates immediately without refreshing.
          </p>
        </CardContent>
      </Card>

      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
            </DialogTitle>
            <DialogDescription>
              {editingAnnouncement ? 'Update the announcement details' : 'Enter the announcement details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                placeholder="Announcement Title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                value={announcementForm.message}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                placeholder="Type your announcement here..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={announcementForm.priority}
                onValueChange={(value) => setAnnouncementForm({ ...announcementForm, priority: value as 'low' | 'medium' | 'high' })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {announcementForm.priority.charAt(0).toUpperCase() + announcementForm.priority.slice(1)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAnnouncementDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={editingAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : editingAnnouncement ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}