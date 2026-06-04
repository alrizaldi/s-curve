'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  console.log('HomePage: Component rendered, session status:', session ? 'authenticated' : 'not authenticated');

  useEffect(() => {
    console.log('HomePage: useEffect hook running to check session');
    
    const checkSession = async () => {
      console.log('HomePage: Checking session status...');
      const { data } = await supabase.auth.getSession();
      console.log('HomePage: Session data received:', data.session ? 'User is logged in' : 'User is not logged in');
      
      setSession(data.session);

      // If user is already logged in, redirect to dashboard
      if (data.session) {
        console.log('HomePage: User is logged in, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('HomePage: User is not logged in, showing homepage content');
      }
    };

    checkSession();

    // Listen for auth state changes
    console.log('HomePage: Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('HomePage: Auth state changed, event:', _event, 'session exists:', !!session);
      setSession(session);
      if (session) {
        console.log('HomePage: Session detected, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('HomePage: No session, redirecting to homepage');
        router.push('/'); // Refresh to show landing page
      }
    });

    return () => {
      console.log('HomePage: Cleaning up auth state change listener');
      subscription.unsubscribe();
    };
  }, [router]);

  console.log('HomePage: Rendering homepage content');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            S-Curve Project Monitoring
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Visualize and track your project progress with our advanced S-Curve analytics platform. 
            Monitor planned vs actual progress, manage work breakdown structures, and stay on track.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login" onClick={() => console.log('HomePage: Clicked Get Started button')}>
              <Button size="lg" className="px-8 py-3 text-lg">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/login" onClick={() => console.log('HomePage: Clicked View Demo button')}>
              <Button size="lg" variant="outline" className="px-8 py-3 text-lg">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-20 max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-gray-600">
                Monitor your project's planned vs actual progress with interactive S-Curve visualizations.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Manage Tasks</h3>
              <p className="text-gray-600">
                Create and manage your work breakdown structure with unlimited hierarchy levels.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-gray-600">
                Get actionable insights and recommendations based on your project data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}