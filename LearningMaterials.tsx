import { useState, useEffect } from 'react';
import { serverFetch } from '../utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { BookOpen, Search, Filter, Download, ExternalLink, FileText, Video, Link as LinkIcon, BookMarked, CheckCircle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import jsPDF from 'jspdf';

interface Material {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  difficulty: string;
  createdAt: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
}

interface LearningMaterialsProps {
  session: any;
}

export function LearningMaterials({ session }: LearningMaterialsProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  
  // Download states
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'success'>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchQuery, categoryFilter, difficultyFilter]);

  const fetchMaterials = async () => {
    try {
      const response = await serverFetch('/materials', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      setMaterials(data.materials || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const filterMaterials = () => {
    let filtered = [...materials];

    // IMPORTANT: Only show approved materials to students
    // Filter out pending and rejected materials
    filtered = filtered.filter(m => 
      m.approval_status === 'approved' || !m.approval_status // Show if approved or no status (legacy)
    );

    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(m => m.category === categoryFilter);
    }

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(m => m.difficulty === difficultyFilter);
    }

    setFilteredMaterials(filtered);
  };

  // Calculate file size from content
  const calculateFileSize = (content: string): string => {
    const sizeInBytes = new Blob([content]).size;
    const sizeInKB = sizeInBytes / 1024;
    const sizeInMB = sizeInKB / 1024;
    
    if (sizeInMB >= 1) {
      return `${sizeInMB.toFixed(1)} MB`;
    } else {
      return `${sizeInKB.toFixed(1)} KB`;
    }
  };

  // Download material as PDF
  const handleDownload = async (material: Material) => {
    setDownloadState('downloading');
    setDownloadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Generate PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Add title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      const titleLines = pdf.splitTextToSize(material.title, maxWidth);
      pdf.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 8 + 10;

      // Add metadata
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Category: ${material.category} | Difficulty: ${material.difficulty}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Downloaded: ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 15;

      // Add description
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Description:', margin, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      const descLines = pdf.splitTextToSize(material.description, maxWidth);
      pdf.text(descLines, margin, yPosition);
      yPosition += descLines.length * 6 + 10;

      // Add content
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Content:', margin, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const contentLines = pdf.splitTextToSize(material.content, maxWidth);
      
      // Handle page breaks
      for (let i = 0; i < contentLines.length; i++) {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(contentLines[i], margin, yPosition);
        yPosition += 6;
      }

      clearInterval(progressInterval);
      setDownloadProgress(100);

      // Save PDF
      const fileName = `${material.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      pdf.save(fileName);

      // Show success state
      setTimeout(() => {
        setDownloadState('success');
        toast.success('Download complete!');
        
        // Reset after 2 seconds
        setTimeout(() => {
          setDownloadState('idle');
          setDownloadProgress(0);
        }, 2000);
      }, 300);

    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download material');
      setDownloadState('idle');
      setDownloadProgress(0);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading learning materials...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl text-gray-900">Learn HCI</h2>
        <p className="text-gray-600 mt-1">Explore interactive learning materials and resources</p>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search materials..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="fundamentals">Fundamentals</SelectItem>
            <SelectItem value="design-principles">Design Principles</SelectItem>
            <SelectItem value="usability">Usability</SelectItem>
            <SelectItem value="prototyping">Prototyping</SelectItem>
            <SelectItem value="evaluation">Evaluation</SelectItem>
            <SelectItem value="accessibility">Accessibility</SelectItem>
          </SelectContent>
        </Select>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No materials found. Try adjusting your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((material) => (
            <Card
              key={material.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedMaterial(material)}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <BookMarked className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1 text-base">{material.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {material.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                    {material.category}
                  </span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {material.difficulty}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {material.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Material Detail Dialog */}
      <Dialog open={!!selectedMaterial} onOpenChange={() => {
        setSelectedMaterial(null);
        setDownloadState('idle');
        setDownloadProgress(0);
      }}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden p-0 gap-0">
          {selectedMaterial && (
            <div className="flex flex-col h-full max-h-[95vh]">
              {/* Header with Close Button */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                <div className="flex-1 pr-4">
                  <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                    {selectedMaterial.title}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedMaterial(null);
                    setDownloadState('idle');
                    setDownloadProgress(0);
                  }}
                  className="flex-shrink-0 hover:bg-gray-100 rounded-full h-8 w-8 p-0"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </Button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedMaterial.description}
                    </p>
                  </div>

                  {/* File Info Card */}
                  <Card className="border-2 border-indigo-100 bg-indigo-50/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-red-100 p-3 rounded-lg">
                          <FileText className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">PDF Document</span>
                            <Badge variant="outline" className="text-xs">
                              {selectedMaterial.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            File size: {calculateFileSize(selectedMaterial.content)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Content Preview */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Content Preview</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedMaterial.content}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <Badge variant="outline" className="bg-white">
                      {selectedMaterial.category}
                    </Badge>
                    <span>•</span>
                    <span>Added {new Date(selectedMaterial.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Fixed Download Button Footer */}
              <div className="sticky bottom-0 bg-white border-t px-6 py-4">
                <Button
                  className={`w-full h-12 transition-all duration-300 ${
                    downloadState === 'downloading'
                      ? 'bg-indigo-500'
                      : downloadState === 'success'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                  onClick={() => handleDownload(selectedMaterial)}
                  disabled={downloadState === 'downloading'}
                >
                  {downloadState === 'downloading' ? (
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="animate-spin h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">Downloading...</span>
                        <span className="text-xs opacity-90">{downloadProgress}% complete</span>
                      </div>
                    </div>
                  ) : downloadState === 'success' ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Download Complete!</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Download className="h-5 w-5" />
                      <span className="font-medium">Download Material as PDF</span>
                    </div>
                  )}
                </Button>
                
                {/* Progress Bar */}
                {downloadState === 'downloading' && (
                  <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300 ease-out"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
