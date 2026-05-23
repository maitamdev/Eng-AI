'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Bell, Search, Menu, Trophy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  user?: {
    full_name?: string | null;
    email?: string | null;
    level?: number;
    xp?: number;
  };
}

export default function Header({ onOpenMobileMenu, user }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();

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

  // Calculate XP progress (each level is 500 XP)
  const currentXP = user?.xp || 0;
  const level = user?.level || 1;
  const xpInCurrentLevel = currentXP % 500;
  const xpPercent = Math.min(100, Math.floor((xpInCurrentLevel / 500) * 100));

  return (
    <header className="h-16 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 transition-colors duration-300 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Mobile Toggle Button & Search */}
      <div className="flex items-center space-x-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="lg:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden md:flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-1.5 border border-slate-100 dark:border-slate-800/50 max-w-xs w-full">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm bài học, từ vựng..."
            className="bg-transparent border-none text-xs outline-none w-full text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Middle XP Progress Bar (Desktop only) */}
      <div className="hidden lg:flex items-center space-x-3 max-w-xs w-full mx-4">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">
          <Trophy className="h-3.5 w-3.5" />
          <span>LV.{level}</span>
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
            <span>Progress</span>
            <span>{xpInCurrentLevel}/500 XP</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-500 to-accent-purple h-full rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-xl p-2">
            <DropdownMenuLabel className="font-bold">Thông báo</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="py-2 text-center text-xs text-slate-500">
              Không có thông báo mới nào
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 w-9 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm"
            >
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 mt-2">
            <DropdownMenuLabel className="font-bold">
              <div className="flex flex-col">
                <span>{user?.full_name || 'Học viên'}</span>
                <span className="text-[10px] text-slate-400 font-medium normal-case truncate">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')} className="font-semibold text-slate-600 dark:text-slate-300">
              Thông tin cá nhân
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard')} className="font-semibold text-slate-600 dark:text-slate-300">
              Trang Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="font-semibold text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-500/10">
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
