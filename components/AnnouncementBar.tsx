import { useState, useEffect } from 'react';
import { serverFetch } from '../utils/supabase/client';
import { X, ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';
import { Button } from './ui/button';

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  createdBy: string;
  priority?: 'low' | 'medium' | 'high';
}

interface AnnouncementBarProps {
  session: any;
}

export function AnnouncementBar({ session }: AnnouncementBarProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    // Auto-rotate announcements every 10 seconds
    const interval = setInterval(() => {
      if (announcements.length > 1) {
        handleTransition(() => {
          setCurrentIndex((prev) => (prev + 1) % announcements.length);
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [announcements.length]);

  const fetchAnnouncements = async () => {
    try {
      const response = await serverFetch('/content/announcements', {
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
        
        // Sort by priority (high, medium, low) and then by createdAt (newest first)
        const sorted = announcementsList.sort((a: Announcement, b: Announcement) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          const aPriority = priorityOrder[a.priority || 'medium'];
          const bPriority = priorityOrder[b.priority || 'medium'];
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setAnnouncements(sorted);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setLoading(false);
    }
  };

  const handleTransition = (callback: () => void) => {
    setIsFading(true);
    setTimeout(() => {
      callback();
      setTimeout(() => setIsFading(false), 50);
    }, 300); // Match the CSS transition duration
  };

  const handleNext = () => {
    handleTransition(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    });
  };

  const handlePrev = () => {
    handleTransition(() => {
      setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
    });
  };

  if (loading || isDismissed || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];
  const priorityColors = {
    high: 'bg-red-100 border-red-300 text-red-900',
    medium: 'bg-blue-100 border-blue-300 text-blue-900',
    low: 'bg-gray-100 border-gray-300 text-gray-900',
  };

  const bgColor = priorityColors[currentAnnouncement.priority || 'medium'];

  return (
    <div className={`${bgColor} border-b px-4 py-3 relative`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div 
          className={`flex items-center gap-3 flex-1 min-w-0 transition-opacity duration-300 ${
            isFading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <Megaphone className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {currentAnnouncement.title && (
              <p className="font-medium text-sm">
                {currentAnnouncement.title}
              </p>
            )}
            <p className="text-sm">
              {currentAnnouncement.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {announcements.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs">
                {currentIndex + 1} / {announcements.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}