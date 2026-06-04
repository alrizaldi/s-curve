"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client"; // 使用已导出的 supabase 实例
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    console.log('Navbar: useEffect hook running');
    
    // Wrap in try-catch to handle potential errors during session retrieval
    const getSession = async () => {
      try {
        console.log('Navbar: Getting session...');
        const { data } = await supabase.auth.getSession();
        console.log('Navbar: Session data received:', data.session);
        setSession(data.session);
      } catch (error) {
        console.warn("Navbar: Error getting session:", error);
        setSession(null);
      }
    };

    getSession();

    // Subscribe to auth state changes with error handling
    console.log('Navbar: Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        console.log('Navbar: Auth state changed, event:', _event, 'session:', session);
        setSession(session);
      } catch (error) {
        console.warn("Navbar: Error in auth state change:", error);
      }
    });

    return () => {
      console.log('Navbar: Cleaning up auth state change listener');
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.warn("Navbar: Error unsubscribing from auth state:", error);
      }
    };
  }, []);

  const handleSignOut = async () => {
    console.log('Navbar: Signing out...');
    try {
      await supabase.auth.signOut();
      console.log('Navbar: Successfully signed out, redirecting to login');
      router.push('/auth/login'); // 更正为正确的登录页面路径
    } catch (error) {
      console.error("Navbar: Error signing out:", error);
      router.push('/auth/login'); // Still redirect to login page even if sign out fails
    }
  };

  console.log('Navbar: Rendering, session status:', session ? 'authenticated' : 'not authenticated');

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2" onClick={() => console.log('Navbar: Clicked home link')}>
          <span className="text-xl font-bold">S-Curve</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/dashboard" className="transition-colors hover:text-primary" onClick={() => console.log('Navbar: Clicked dashboard link')}>
            Dashboard
          </Link>
          <Link href="/projects" className="transition-colors hover:text-primary" onClick={() => console.log('Navbar: Clicked projects link')}>
            Projects
          </Link>
          <Link href="/wbs" className="transition-colors hover:text-primary" onClick={() => console.log('Navbar: Clicked WBS link')}>
            WBS
          </Link>
          <Link href="/milestones" className="transition-colors hover:text-primary" onClick={() => console.log('Navbar: Clicked milestones link')}>
            Milestones
          </Link>
          <Link href="/scurve" className="transition-colors hover:text-primary" onClick={() => console.log('Navbar: Clicked S-Curve link')}>
            S-Curve
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          {session ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm">{session.user?.email || session.user?.user_metadata?.email || 'User'}</span>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          ) : (
            <Link href="/auth/login" onClick={() => console.log('Navbar: Clicked sign in link')}>
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}