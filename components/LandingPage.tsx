import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { GraduationCap, BookOpen, Target, Users, MessageSquare } from 'lucide-react';
import { getServerUrl, createClient, getAnonKey } from '../utils/supabase/client';
import logoImage from 'figma:asset/e6d79e8861bd18ad0650862c9dc2b4cc7c09cf38.png';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToAbout: () => void;
}

export function LandingPage({ onNavigateToLogin, onNavigateToAbout }: LandingPageProps) {
  const [content, setContent] = useState({
    heroTitle: 'Welcome to FreeLearning',
    heroSubtitle: 'Your interactive HCI learning platform',
    featuresTitle: 'Platform Features',
    featuresSubtitle: 'Explore the key features of our platform',
    howItWorksTitle: 'How It Works',
    ctaTitle: 'Get Started',
    ctaSubtitle: 'Join our community and start learning today'
  });

  useEffect(() => {
    fetchContent();

    // Poll for content updates every 5 seconds
    const pollInterval = setInterval(() => {
      fetchContent();
    }, 5000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const fetchContent = async () => {
    try {
      // Get session - use user token if logged in, otherwise use anon key
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const authToken = session?.access_token || getAnonKey();
      
      const response = await fetch(getServerUrl('/content/landing'), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('LandingPage - Fetched content:', data);
        if (data.content) {
          setContent(prev => ({ ...prev, ...data.content }));
        }
      } else {
        console.error('LandingPage - Failed to fetch content:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching landing page content:', error);
    }
  };

  const features = [
    {
      icon: BookOpen,
      title: 'Interactive Learning Materials',
      description: 'Access comprehensive HCI learning materials with interactive exercises and real-world examples.'
    },
    {
      icon: Target,
      title: 'Assessments & Quizzes',
      description: 'Test your knowledge with engaging quizzes and track your progress over time.'
    },
    {
      icon: Users,
      title: 'Teacher-Driven Classroom',
      description: 'Teachers can manage materials, create assessments, and monitor student progress.'
    },
    {
      icon: MessageSquare,
      title: 'Discussion Forums',
      description: 'Collaborate with peers and instructors through interactive discussion forums.'
    },
    {
      icon: GraduationCap,
      title: 'Progress Tracking',
      description: 'Monitor your learning journey with detailed analytics and performance insights.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="FreeLearning Logo" className="h-10" />
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onNavigateToAbout}>
                About
              </Button>
              <Button onClick={onNavigateToLogin}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl text-indigo-900 mb-6">
            {content.heroTitle}
          </h1>
          <p className="text-2xl text-gray-700 mb-12 max-w-3xl mx-auto">
            {content.heroSubtitle}
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={onNavigateToLogin}>
              {content.ctaTitle}
            </Button>
            <Button size="lg" variant="outline" onClick={onNavigateToAbout}>
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl text-center text-gray-900 mb-4">
            {content.featuresTitle}
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            {content.featuresSubtitle}
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl text-center text-gray-900 mb-12">
            {content.howItWorksTitle}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-indigo-600">1</span>
                </div>
                <CardTitle>Sign Up</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create your account as a student or teacher to get started
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-indigo-600">2</span>
                </div>
                <CardTitle>Learn & Practice</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Access learning materials and complete interactive assessments
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-indigo-600">3</span>
                </div>
                <CardTitle>Track Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Monitor your learning journey and see your improvement over time
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white">
            <CardHeader>
              <CardTitle className="text-3xl text-white">
                {content.ctaTitle}
              </CardTitle>
              <CardDescription className="text-indigo-100 text-lg">
                {content.ctaSubtitle}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={onNavigateToLogin}
                className="bg-white text-indigo-600 hover:bg-gray-100"
              >
                Sign Up Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src={logoImage} alt="FreeLearning Logo" className="h-8" />
          </div>
          <p className="text-sm text-gray-400">
            © 2025 FreeLearning. Interactive HCI Education Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}