'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface UserData {
  id: string;
  email?: string;
  full_name?: string | null;
  level?: number;
  xp?: number;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<UserData | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
          router.push('/login');
          return;
        }

        // Fetch custom profile data
        const { data: profile, error: profileError } = await (supabase
          .from('profiles')
          .select('full_name, level, xp')
          .eq('id', authUser.id)
          .single() as any);

        if (profileError) {
          // If profile table isn't filled yet, fallback to default auth user meta
          setUser({
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || 'Học viên',
            level: 1,
            xp: 0,
          });
        } else {
          setUser({
            id: authUser.id,
            email: authUser.email,
            full_name: profile.full_name || authUser.user_metadata?.full_name || 'Học viên',
            level: profile.level || 1,
            xp: profile.xp || 0,
          });
        }
      } catch (err) {
        console.error('Failed to load user session', err);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();

    // Subscribe to profile changes for real-time XP updating
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Đang tải cấu hình...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-screen sticky top-0">
        <Sidebar user={user || undefined} />
      </div>

      {/* Mobile Sidebar (Radix Sheet) */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 border-none">
          <Sidebar
            user={user || undefined}
            onCloseMobile={() => setIsMobileOpen(false)}
            className="border-none"
          />
        </SheetContent>
      </Sheet>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={user || undefined}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
