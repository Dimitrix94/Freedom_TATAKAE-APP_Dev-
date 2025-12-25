import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { GraduationCap, Target, Heart, Lightbulb, Users, Award, Sparkles, Rocket } from 'lucide-react';
import { getServerUrl, createClient, getAnonKey } from '../utils/supabase/client';
import logoImage from 'figma:asset/e6d79e8861bd18ad0650862c9dc2b4cc7c09cf38.png';

interface AboutPageProps {
  onNavigateToHome: () => void;
  onNavigateToLogin: () => void;
}

export function AboutPage({ onNavigateToHome, onNavigateToLogin }: AboutPageProps) {
  const [content, setContent] = useState({
    pageTitle: 'About FreeLearning',
    pageSubtitle: 'FreeLearning is an interactive HCI education platform designed to revolutionize how students learn Human-Computer Interaction. Built with modern web technologies and powered by AI, we provide a comprehensive learning experience that combines structured curriculum with interactive engagement.',
    missionTitle: 'Our Mission',
    missionDescription: 'Our mission is to make HCI education accessible, engaging, and effective for everyone.',
    missionContent: 'We believe that learning should be interactive, collaborative, and personalized to each student\'s needs.',
    differenceTitle: 'What Sets Us Apart',
    technologyTitle: 'Advanced Technology',
    technologyDescription: 'Our platform is built on cutting-edge technology including React, Supabase, and AI-powered features to deliver a modern learning experience.',
    capabilitiesTitle: 'Platform Capabilities',
    teachersTitle: 'For Teachers',
    teachersDescription: 'Empower your students with tools to create and manage learning materials, design custom assessments, track student progress in real-time, and manage discussion forums.',
    studentsTitle: 'For Students',
    studentsDescription: 'Learn HCI with ease and efficiency through interactive learning materials, engaging quizzes with instant feedback, AI-powered learning assistant, and collaborative discussion forums.',
    aboutCtaTitle: 'Join Us',
    aboutCtaSubtitle: 'Experience the future of HCI education'
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
      
      const response = await fetch(getServerUrl('/content/about'), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('AboutPage - Fetched content:', data);
        if (data.content) {
          setContent(prev => ({ ...prev, ...data.content }));
        }
      } else {
        console.error('AboutPage - Failed to fetch content:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching about page content:', error);
    }
  };

  const values = [
    {
      icon: Target,
      title: 'Student-Centered',
      description: 'Everything we build is designed with students\' learning experience at the forefront.'
    },
    {
      icon: Heart,
      title: 'Passionate Teaching',
      description: 'We empower teachers with tools to create engaging and effective learning experiences.'
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'Leveraging cutting-edge technology to make learning more interactive and effective.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building a collaborative environment where students and teachers learn together.'
    }
  ];

  const stats = [
    { label: 'Interactive Lessons', value: '100+' },
    { label: 'Practice Quizzes', value: '500+' },
    { label: 'Learning Topics', value: '50+' },
    { label: 'AI-Powered Help', value: '24/7' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={onNavigateToHome}>
              <img src={logoImage} alt="FreeLearning Logo" className="h-10" />
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onNavigateToHome}>
                Home
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
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl text-indigo-900 mb-6">
            {content.pageTitle}
          </h1>
          <p className="text-xl text-gray-700 leading-relaxed">
            {content.pageSubtitle}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white">
            <CardHeader>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-3xl text-white">{content.missionTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg text-indigo-100 leading-relaxed">
                {content.missionDescription}
              </p>
              <p className="text-lg text-indigo-100 leading-relaxed">
                {content.missionContent}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-4xl text-indigo-600 mb-2">
                    {stat.value}
                  </div>
                  <p className="text-gray-600">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl text-center text-gray-900 mb-4">
            {content.differenceTitle}
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            The principles that guide everything we do
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{value.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl text-gray-900 mb-4">
              {content.technologyTitle}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {content.technologyDescription}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Rocket className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle>{content.teachersTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-gray-600">
                  {content.teachersDescription}
                </p>
                <ul className="space-y-2 mt-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>Create and manage learning materials</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>Design custom quizzes and assessments</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>Track student progress in real-time</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>Manage discussion forums</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>{content.studentsTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-gray-600">
                  {content.studentsDescription}
                </p>
                <ul className="space-y-2 mt-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Interactive learning materials</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Engaging quizzes with instant feedback</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>AI-powered learning assistant</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Collaborative discussion forums</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl text-gray-900 mb-6">
            {content.aboutCtaTitle}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {content.aboutCtaSubtitle}
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={onNavigateToLogin}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={onNavigateToHome}>
              Back to Home
            </Button>
          </div>
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