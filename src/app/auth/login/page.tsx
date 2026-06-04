'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client'; // Use the exported supabase client
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  console.log('LoginPage: Component rendered');

  // Check if user is already logged in when component mounts
  useEffect(() => {
    if (!supabase) {
      console.error('LoginPage: Supabase client not available');
      setInitialized(true);
      return;
    }
    
    console.log('LoginPage: useEffect running to check session');
    
    const checkSession = async () => {
      console.log('LoginPage: Checking if user is already logged in...');
      const { data } = await supabase!.auth.getSession(); // Non-null assertion since we check above
      console.log('LoginPage: Session check result:', data.session ? 'User is logged in' : 'User is not logged in');
      
      setSession(data.session);

      // If user is already logged in, redirect to dashboard
      if (data.session) {
        console.log('LoginPage: User already logged in, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('LoginPage: User not logged in, showing login form');
      }
      setInitialized(true);
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        console.log('LoginPage: Session detected, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('LoginPage: No session, staying on login page');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      console.error('LoginPage: Supabase client not available');
      return;
    }
    
    console.log('LoginPage: Login attempt started with email:', email);
    setLoading(true);

    try {
      console.log('LoginPage: Calling signInWithPassword API');
      const { error, data } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('LoginPage: Login error:', error);
        alert(`Error logging in: ${error.message}`);
        return;
      }

      if (data?.user) {
        console.log('LoginPage: Login successful for user:', data.user.email);
        // Successful login
        router.push('/dashboard');
        router.refresh();
      } else {
        console.log('LoginPage: Login failed: No user data returned');
        alert('Login failed: No user data returned');
      }
    } catch (error: any) {
      console.error('LoginPage: Unexpected login error:', error);
      alert(`Unexpected error: ${error?.message || 'Something went wrong'}`);
    } finally {
      console.log('LoginPage: Login attempt finished, setting loading to false');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      console.error('LoginPage: Supabase client not available');
      return;
    }
    
    console.log('LoginPage: Signup attempt started with email:', email);
    setLoading(true);

    try {
      console.log('LoginPage: Calling signUp API');
      const { error, data } = await supabase!.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('LoginPage: Signup error:', error);
        alert(`Error signing up: ${error.message}`);
        return;
      }

      if (data?.user) {
        console.log('LoginPage: Signup successful, user created:', data.user.email);
        alert('Check your email for the confirmation link!');
      } else {
        console.log('LoginPage: Account created but no user data returned');
        alert('Account created. Please check your email for confirmation.');
      }
    } catch (error: any) {
      console.error('LoginPage: Unexpected signup error:', error);
      alert(`Unexpected error: ${error?.message || 'Something went wrong'}`);
    } finally {
      console.log('LoginPage: Signup attempt finished, setting loading to false');
      setLoading(false);
    }
  };

  // Don't render until initialization is complete
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="flex justify-center">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  console.log('LoginPage: Rendering login form');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            S-Curve Project Monitoring
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  console.log('LoginPage: Email input changed to:', e.target.value);
                }}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  console.log('LoginPage: Password input changed');
                }}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
              >
                Sign up
              </button>
            </p>
          </div>
          
        </form>
      </div>
    </div>
  );
}