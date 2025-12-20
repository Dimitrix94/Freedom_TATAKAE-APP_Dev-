import { useEffect, useState } from 'react';
import { getServerUrl } from '../utils/supabase/client';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from './ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui/select';
import {
  MessageSquare, Plus, Send, Edit, Trash2, User, Search, Pin, PinOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface Reply {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

interface Topic {
  id: string; // uuid
  title: string;
  content: string;
  category: string;
  authorId: string; // uuid
  authorName: string;
  replies?: Reply[]; // jsonb
  createdAt: string; // timestamptz
  editedAt?: string | null;
  isPinned?: boolean;
}

interface ForumProps {
  session: any;
  user: any;
}

export function Forum({ session, user }: ForumProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  // Search + filter states (from second code)
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSort, setFilterSort] = useState<'newest'|'oldest'>('newest');
  const [filterAuthor, setFilterAuthor] = useState('');
  const [filterAuthorInput, setFilterAuthorInput] = useState('');

  // Helper: build topics URL with query params
  const buildTopicsUrl = () => {
    const base = getServerUrl('/forum/topics');
    const url = new URL(base, window.location.origin); // URL requires base; second param works in browser
    // Query params (assumptions based on your schema)
    if (searchKeyword) url.searchParams.append('keyword', searchKeyword);
    if (filterCategory && filterCategory !== 'all') url.searchParams.append('category', filterCategory);
    if (filterAuthor) url.searchParams.append('author', filterAuthor);
    // sort: newest / oldest (Option A)
    if (filterSort) url.searchParams.append('sort', filterSort);
    return url.toString();
  };

  // Fetch all topics (returns fetched data)
  const fetchTopics = async () => {
  setLoading(true);
  try {
    const url = new URL(`${getServerUrl("/forum/topics")}`);

    // --- Search ---
    if (searchKeyword.trim() !== "") {
      url.searchParams.append("search", searchKeyword.trim());
    }

    // --- Category filter ---
    if (filterCategory !== "all") {
      url.searchParams.append("category", filterCategory);
    }

    // --- Author filter ---
    if (filterAuthor.trim() !== "") {
      url.searchParams.append("author", filterAuthor.trim());
    }

    // --- Sort ---
    url.searchParams.append("sortBy", "date");
    url.searchParams.append("sortOrder", filterSort === "newest" ? "desc" : "asc");

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });

    const data = await response.json();

    if (Array.isArray(data.topics)) {
      setTopics(data.topics);
    } else {
      toast.error("Unexpected response format from server");
    }
  } catch (error) {
    console.error("Error fetching topics:", error);
    toast.error("Failed to load topics");
  } finally {
    setLoading(false);
  }
};


  // Fetch single topic by id (best-effort; falls back to re-finding in topics)
  const fetchSingleTopic = async (id: string): Promise<Topic | null> => {
    try {
      const url = getServerUrl(`/forum/topics/${id.replace('topic:', '')}`);
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      });
      if (!res.ok) {
        // fallback: re-find in topics after a full fetch
        await fetchTopics();
        return topics.find(t => t.id === id) ?? null;
      }
      const tdata = await res.json();
      // assume API returns topic object directly
      return tdata.topic || tdata;
    } catch (err) {
      console.error('Error fetching single topic:', err);
      return topics.find(t => t.id === id) ?? null;
    }
  };

  // initial + whenever filters/search change
  useEffect(() => {
    
    if (!session?.access_token) {
      setTopics([]);
      setLoading(false);
      return;
    }
    fetchTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.access_token, searchKeyword, filterCategory, filterSort, filterAuthor]);

  // Search trigger
  const handlePerformSearch = () => {
    setSearchKeyword(searchInput.trim());
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchKeyword('');
    setSearchInput('');
    setFilterCategory('all');
    setFilterSort('newest');
    setFilterAuthor('');
    setFilterAuthorInput('');
  };

  // Create topic handler (kept from first code but unified)
  const handleCreateTopic = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      category: formData.get('category') as string,
    };
    try {
      const res = await fetch(getServerUrl('/forum/topics'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to create topic');
      }
      toast.success('Discussion topic created successfully');
      setDialogOpen(false);
      form.reset();
      // Refresh list with current filters
      await fetchTopics();
    } catch (err: any) {
      console.error('Create topic error:', err);
      toast.error(err?.message || 'Failed to create topic');
    }
  };

  // Reply handler — keep selectedTopic refresh behavior from first code
  const handleReply = async () => {
    if (!selectedTopic || !replyContent.trim()) return;
    try {
      const res = await fetch(
        getServerUrl(`/forum/topics/${selectedTopic.id.replace('topic:', '')}/replies`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ content: replyContent }),
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to add reply');
      }
      toast.success('Reply added successfully');
      setReplyContent('');
      // Refresh topics list
      const all = await fetchTopics();
      // try to update selected topic from server via single endpoint if available
      const refreshed = await fetchSingleTopic(selectedTopic.id);
      if (refreshed) setSelectedTopic(refreshed);
      else if (all?.topics) {
        const found = all.topics.find((t: Topic) => t.id === selectedTopic.id);
        if (found) setSelectedTopic(found);
      }
    } catch (err: any) {
      console.error('Error adding reply:', err);
      toast.error(err?.message || 'Failed to add reply');
    }
  };

  // Edit topic handler (from first code)
  const handleEditTopic = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTopic) return;
    const formData = new FormData(e.currentTarget);
    const updates = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
    };
    try {
      const res = await fetch(
        getServerUrl(`/forum/topics/${editingTopic.id.replace('topic:', '')}`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(updates),
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to update topic');
      }
      toast.success('Topic updated successfully');
      setEditingTopic(null);
      await fetchTopics();
      // refresh selectedTopic if it was the one edited
      if (selectedTopic?.id === editingTopic.id) {
        const refreshed = await fetchSingleTopic(editingTopic.id);
        if (refreshed) setSelectedTopic(refreshed);
      }
    } catch (err: any) {
      console.error('Error updating topic:', err);
      toast.error(err?.message || 'Failed to update topic');
    }
  };

  // Delete topic (keeps first code behavior)
  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;
    try {
      const res = await fetch(
        getServerUrl(`/forum/topics/${topicId.replace('topic:', '')}`),
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${session?.access_token}` },
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to delete topic');
      }
      toast.success('Topic deleted successfully');
      setSelectedTopic(null);
      await fetchTopics();
    } catch (err: any) {
      console.error('Error deleting topic:', err);
      toast.error(err?.message || 'Failed to delete topic');
    }
  };

  // Pin/Unpin topic (Teachers only)
  const handleTogglePin = async (topicId: string, currentPinState: boolean, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent card click
    }
    try {
      const res = await fetch(
        getServerUrl(`/forum/topics/${topicId.replace('topic:', '')}/pin`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ isPinned: !currentPinState }),
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to pin/unpin topic');
      }
      toast.success(currentPinState ? 'Topic unpinned' : 'Topic pinned');
      await fetchTopics();
      // Refresh selected topic if it's open
      if (selectedTopic?.id === topicId) {
        const refreshed = await fetchSingleTopic(topicId);
        if (refreshed) setSelectedTopic(refreshed);
      }
    } catch (err: any) {
      console.error('Error pinning topic:', err);
      toast.error(err?.message || 'Failed to pin/unpin topic');
    }
  };

  // Delete reply (Teachers only or reply author)
  const handleDeleteReply = async (topicId: string, replyId: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;
    try {
      const res = await fetch(
        getServerUrl(`/forum/topics/${topicId.replace('topic:', '')}/replies/${replyId}`),
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${session?.access_token}` },
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to delete reply');
      }
      toast.success('Reply deleted successfully');
      // Refresh the topic
      const refreshed = await fetchSingleTopic(topicId);
      if (refreshed) setSelectedTopic(refreshed);
    } catch (err: any) {
      console.error('Error deleting reply:', err);
      toast.error(err?.message || 'Failed to delete reply');
    }
  };

  const isTeacher = user?.user_metadata?.role === 'teacher';

  // render loading
  if (loading) {
    return <div className="text-center py-8">Loading forum...</div>;
  }

  // Topic detail view (complete, from first code)
  if (selectedTopic) {
    const canEdit = selectedTopic.authorId === user?.id || user?.user_metadata?.role === 'teacher';
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setSelectedTopic(null)}>← Back to Topics</Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{selectedTopic.title}</CardTitle>
                  {selectedTopic.isPinned && (
                    <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                      <Pin className="w-3 h-3" />
                      Pinned
                    </span>
                  )}
                </div>
                <CardDescription className="mt-2">
                  Posted by {selectedTopic.authorName || 'Guest'} • {new Date(selectedTopic.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>

              {canEdit && (
                <div className="flex gap-2">
                  {isTeacher && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleTogglePin(selectedTopic.id, selectedTopic.isPinned || false)}
                      title={selectedTopic.isPinned ? "Unpin topic" : "Pin topic"}
                    >
                      {selectedTopic.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setEditingTopic(selectedTopic)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteTopic(selectedTopic.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-2">
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                {selectedTopic.category}
              </span>
            </div>
          </CardHeader>

          <CardContent>
            <p className="whitespace-pre-wrap text-gray-700">{selectedTopic.content}</p>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="space-y-4">
          <h3 className="text-lg">Replies ({selectedTopic.replies?.length || 0})</h3>

          {selectedTopic.replies?.map((reply) => {
            const canDeleteReply = reply.authorId === user?.id || isTeacher;
            return (
              <Card key={reply.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-200 p-2 rounded-full">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p>{reply.authorName || 'Guest'}</p>
                        <p className="text-xs text-gray-500">{new Date(reply.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {canDeleteReply && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteReply(selectedTopic.id, reply.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{reply.content}</p>
                </CardContent>
              </Card>
            );
          })}

          {/* Reply form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Add a Reply</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Write your reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleReply}>
                  <Send className="w-4 h-4 mr-2" />
                  Post Reply
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingTopic} onOpenChange={() => setEditingTopic(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Topic</DialogTitle>
              <DialogDescription>Make changes to your topic.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditTopic} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" name="title" defaultValue={editingTopic?.title} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content</Label>
                <Textarea id="edit-content" name="content" defaultValue={editingTopic?.content} rows={6} required />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditingTopic(null)}>Cancel</Button>
                <Button type="submit">Update Topic</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Topics list + search + filters (merged UI)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-gray-900">Discussion Forum</h2>
          <p className="text-gray-600 mt-1">
            {isTeacher 
              ? 'Moderate discussions, pin important topics, and manage student participation'
              : 'Ask questions and discuss topics with peers'
            }
          </p>
        </div>

        {/* New Topic Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Topic
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Discussion Topic</DialogTitle>
              <DialogDescription>Start a new discussion topic.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="What would you like to discuss?" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue="general">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Discussion</SelectItem>
                    <SelectItem value="help">Help & Support</SelectItem>
                    <SelectItem value="resources">Resources</SelectItem>
                    <SelectItem value="projects">Projects</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" name="content" placeholder="Describe your topic..." rows={6} required />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create Topic</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Teacher Moderation Info */}
      {isTeacher && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">📌 Moderator Tools</h3>
                <p className="text-sm text-blue-800">
                  As a teacher, you can <strong>pin important topics</strong> to keep them at the top, 
                  <strong> edit or delete any post</strong> to maintain quality discussions, 
                  and <strong>remove inappropriate replies</strong> to ensure a safe learning environment.
                </p>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-2xl font-semibold text-blue-900">{topics.length}</div>
                  <div className="text-xs text-blue-700">Total Topics</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-amber-900">
                    {topics.filter(t => t.isPinned).length}
                  </div>
                  <div className="text-xs text-amber-700">Pinned</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search + Filters */}
      <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by keyword..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePerformSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handlePerformSearch}>Search</Button>
          <Button onClick={handleClearFilters} variant="outline">Clear Filters</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Category</Label>
            <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v)}>
              <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="help">Help & Support</SelectItem>
                <SelectItem value="resources">Resources</SelectItem>
                <SelectItem value="projects">Projects</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Sort By</Label>
            <Select value={filterSort} onValueChange={(v) => setFilterSort(v as 'newest'|'oldest')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="replies">Most Replies</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Author</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Author name..."
                value={filterAuthorInput}
                onChange={(e) => setFilterAuthorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setFilterAuthor(filterAuthorInput);
                  }
                }}
              />
              <Button 
                onClick={() => setFilterAuthor(filterAuthorInput)}
                variant="outline"
                size="sm"
              >
                Filter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Topics list */}
      {topics.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No topics found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {topics.map((topic) => (
            <Card
              key={topic.id}
              className={`group hover:shadow-md transition-shadow cursor-pointer ${
                topic.isPinned ? 'border-l-4 border-l-amber-500 bg-amber-50/30' : ''
              }`}
              onClick={() => setSelectedTopic(topic)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{topic.title}</CardTitle>
                      {topic.isPinned && (
                        <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                          <Pin className="w-3 h-3" />
                          Pinned
                        </span>
                      )}
                    </div>
                    <CardDescription className="mt-1">
                      {topic.authorName || 'Guest'} • {new Date(topic.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                      {topic.category}
                    </span>
                    <div className="flex items-center gap-1 text-gray-500">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">{topic.replies?.length || 0}</span>
                    </div>
                    {isTeacher && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleTogglePin(topic.id, topic.isPinned || false, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title={topic.isPinned ? "Unpin topic" : "Pin topic"}
                      >
                        {topic.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-2">{topic.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}