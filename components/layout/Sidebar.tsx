'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  PenTool,
  Mic,
  Volume2,
  BookMarked,
  Swords,
  Trophy,
  User,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SidebarProps {
  className?: string;
  onCloseMobile?: () => void;
  user?: {
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    level?: number;
    xp?: number;
  };
}

export default function Sidebar({ className, onCloseMobile, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Luyện hội thoại AI', href: '/conversation', icon: MessageSquare, badge: 'Hot' },
    { name: 'Từ vựng & Flashcard', href: '/vocabulary', icon: BookOpen },
    { name: 'Chấm bài viết', href: '/writing', icon: PenTool },
    { name: 'Luyện phát âm', href: '/pronunciation', icon: Mic },
    { name: 'Luyện nghe', href: '/listening', icon: Volume2 },
    { name: 'Đọc hiểu', href: '/reading', icon: BookMarked },
    { name: 'Thi đấu 1v1', href: '/battle', icon: Swords, badge: 'New' },
    { name: 'Bảng xếp hạng', href: '/leaderboard', icon: Trophy },
    { name: 'Hồ sơ cá nhân', href: '/profile', icon: User },
  ];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error('Không thể đăng xuất');
        return;
      }
      toast.success('Đăng xuất thành công');
      router.push('/');
      router.refresh();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi đăng xuất');
    }
  };

  return (
    <aside className={cn(
      'flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-colors duration-300 w-64',
      className
    )}>
      {/* Sidebar Header Logo */}
      <div className="h-16 px-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-brand-600 dark:text-brand-500">
          <span className="bg-brand-600 text-white rounded-lg p-1.5 font-mono leading-none text-sm">ENG</span>
          <span>.AI</span>
        </Link>
        {onCloseMobile && (
          <Button variant="ghost" size="sm" onClick={onCloseMobile} className="lg:hidden">
            ✕
          </Button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-thin">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                'group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                isActive
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                  : 'text-slate-600 hover:text-brand-600 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              )}
            >
              <div className="flex items-center space-x-3">
                <Icon className={cn('h-4.5 w-4.5 transition-transform group-hover:scale-110', isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-600 dark:group-hover:text-white')} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  item.badge === 'Hot'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-400'
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile preview at the bottom */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold shadow-inner">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-bold truncate dark:text-white">
              {user?.full_name || 'Học viên ENG.AI'}
            </h5>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Level {user?.level || 1} • {user?.xp || 0} XP
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 justify-start space-x-3 rounded-xl py-2 px-3 text-sm font-semibold transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span>Đăng xuất</span>
        </Button>
      </div>
    </aside>
  );
}
