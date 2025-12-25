import { useState, useEffect } from 'react';
import { getServerUrl } from '../utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { BookOpen, Search, BookMarked } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Material {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  difficulty: string;
  createdAt: string;
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

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchQuery, categoryFilter, difficultyFilter]);

  const fetchMaterials = async () => {
    try {
      const response = await fetch(getServerUrl('/materials'), {
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
      <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMaterial?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                {selectedMaterial?.category}
              </span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                {selectedMaterial?.difficulty}
              </span>
            </div>
            <p className="text-gray-600">{selectedMaterial?.description}</p>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap">{selectedMaterial?.content}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
