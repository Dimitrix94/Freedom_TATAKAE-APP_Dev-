import { useState, useEffect } from 'react';
import { getServerUrl } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
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

interface MaterialsManagerProps {
  session: any;
}

export function MaterialsManager({ session }: MaterialsManagerProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const materialData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      content: formData.get('content') as string,
      difficulty: formData.get('difficulty') as string,
    };

    try {
      if (editingMaterial) {
        // Update existing material
        const response = await fetch(getServerUrl(`/materials/${editingMaterial.id.replace('material:', '')}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(materialData),
        });

        if (!response.ok) throw new Error('Failed to update material');
        toast.success('Material updated successfully');
      } else {
        // Create new material
        const response = await fetch(getServerUrl('/materials'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(materialData),
        });

        if (!response.ok) throw new Error('Failed to add material');
        toast.success('Material added successfully');
      }

      setDialogOpen(false);
      setEditingMaterial(null);
      fetchMaterials();
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      console.error('Error saving material:', error);
      toast.error(error.message || 'Failed to save material');
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      const response = await fetch(getServerUrl(`/materials/${materialId.replace('material:', '')}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete material');
      toast.success('Material deleted successfully');
      fetchMaterials();
    } catch (error: any) {
      console.error('Error deleting material:', error);
      toast.error(error.message || 'Failed to delete material');
    }
  };

  const openEditDialog = (material: Material) => {
    setEditingMaterial(material);
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading materials...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-gray-900">HCI Learning Materials</h2>
          <p className="text-gray-600 mt-1">Manage your course content and resources</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingMaterial(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMaterial ? 'Edit Material' : 'Add New Material'}</DialogTitle>
              <DialogDescription>
                {editingMaterial ? 'Update the learning material details' : 'Create a new HCI learning material'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Introduction to HCI Principles"
                  defaultValue={editingMaterial?.title}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Brief description of the material"
                  defaultValue={editingMaterial?.description}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue={editingMaterial?.category || 'fundamentals'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fundamentals">Fundamentals</SelectItem>
                      <SelectItem value="design-principles">Design Principles</SelectItem>
                      <SelectItem value="usability">Usability</SelectItem>
                      <SelectItem value="prototyping">Prototyping</SelectItem>
                      <SelectItem value="evaluation">Evaluation</SelectItem>
                      <SelectItem value="accessibility">Accessibility</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select name="difficulty" defaultValue={editingMaterial?.difficulty || 'beginner'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  name="content"
                  placeholder="Full content of the learning material (supports markdown)"
                  rows={10}
                  defaultValue={editingMaterial?.content}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => {
                  setDialogOpen(false);
                  setEditingMaterial(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingMaterial ? 'Update Material' : 'Add Material'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {materials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No materials yet. Add your first learning material!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <Card key={material.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{material.title}</CardTitle>
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
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {material.content}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(material)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(material.id)}
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
