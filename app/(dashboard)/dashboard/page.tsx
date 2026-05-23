'use client';

import React, { useEffect, useState } from 'react';
import {
  Flame,
  Zap,
  Sparkles,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Target,
  Trophy,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

// Mock data for skills radar
const initialRadarData = [
  { subject: 'Conversation', A: 75, fullMark: 100 },
  { subject: 'Vocabulary', A: 85, fullMark: 100 },
  { subject: 'Writing', A: 60, fullMark: 100 },
  { subject: 'Pronunciation', A: 70, fullMark: 100 },
  { subject: 'Listening', A: 80, fullMark: 100 },
  { subject: 'Reading', A: 90, fullMark: 100 },
];

// Mock data for weekly study minutes
const weeklyActivityData = [
  { name: 'Thứ 2', minutes: 15 },
  { name: 'Thứ 3', minutes: 30 },
  { name: 'Thứ 4', minutes: 20 },
  { name: 'Thứ 5', minutes: 45 },
  { name: 'Thứ 6', minutes: 15 },
  { name: 'Thứ 7', minutes: 60 },
  { name: 'Chủ Nhật', minutes: 25 },
];

export default function DashboardHome() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            setProfile(data);
          } else {
            // Fallback mock profile
            setProfile({
              full_name: user.user_metadata?.full_name || 'Học viên',
              level: 2,
              xp: 850,
              streak_days: 5,
              total_study_minutes: 195,
              current_goal: 'ielts',
              english_level: 'intermediate',
            });
          }
        }
      } catch (err) {
        toast.error('Không thể kết nối cơ sở dữ liệu');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Streak liên tiếp',
      value: `${profile?.streak_days || 0} ngày`,
      desc: 'Học tập đều đặn mỗi ngày',
      icon: Flame,
      color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    },
    {
      title: 'Tổng điểm tích lũy',
      value: `${profile?.xp || 0} XP`,
      desc: 'Tăng tốc lên cấp tiếp theo',
      icon: Zap,
      color: 'text-brand-500 bg-brand-500/10 border-brand-500/20',
    },
    {
      title: 'Cấp độ học tập',
      value: `Cấp ${profile?.level || 1}`,
      desc: 'Huấn luyện viên AI cấp cao',
      icon: Sparkles,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Thời gian học',
      value: `${profile?.total_study_minutes || 0} phút`,
      desc: 'Tổng thời lượng rèn luyện',
      icon: Clock,
      color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header welcome banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight dark:text-white sm:text-4xl">
            Chào mừng quay lại, {profile?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Bắt đầu bài luyện tập hôm nay để giữ vững phong độ và bảo vệ ngọn lửa streak!
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-slate-600 dark:text-slate-300">
            Hôm nay: {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Grid containing the 4 stats metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="border border-slate-100 dark:border-slate-800/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {stat.title}
                  </span>
                  <span className="text-2xl font-extrabold dark:text-white tracking-tight">
                    {stat.value}
                  </span>
                </div>
                <div className={`p-3 rounded-xl border ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-slate-400 text-[10px] mt-2 font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>{stat.desc}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main grids: skill radar and challenge progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Skill Radar Chart */}
        <Card className="lg:col-span-2 border border-slate-100 dark:border-slate-800/80 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Target className="h-5 w-5 text-brand-600" />
              <span>Biểu đồ kỹ năng 6 góc</span>
            </CardTitle>
            <CardDescription>
              Đánh giá từ AI dựa trên kết quả các bài thực hành gần nhất
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center p-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={initialRadarData}>
                <PolarGrid stroke="#e2e8f0" strokeOpacity={0.5} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                <Radar
                  name="ENG.AI Student"
                  dataKey="A"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Challenge Card */}
        <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl" />
          <CardHeader className="pb-4">
            <div className="inline-flex items-center space-x-1.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-brand-500/10 w-fit mb-3">
              <Trophy className="h-3 w-3" />
              <span>Thử thách hôm nay</span>
            </div>
            <CardTitle className="text-lg font-bold">Luyện giao tiếp AI</CardTitle>
            <CardDescription>
              Hoàn thành 1 bài luyện nói Scenario phỏng vấn xin việc (Job Interview).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rewards */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Phần thưởng</span>
                <span className="text-sm font-extrabold text-amber-500">+50 XP & Huy hiệu Daily</span>
              </div>
              <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center font-bold">
                ⭐
              </div>
            </div>
            {/* Progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Tiến trình</span>
                <span>0/1 hoàn thành</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-brand-500 h-full rounded-full w-0" />
              </div>
            </div>
          </CardContent>
          <div className="p-6 pt-0 mt-auto">
            <Link href="/conversation">
              <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2">
                <span>Tham gia thử thách</span>
                <ChevronRight className="h-4.5 w-4.5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Secondary Row: Activity and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Activity chart */}
        <Card className="lg:col-span-2 border border-slate-100 dark:border-slate-800/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand-600" />
              <span>Thời gian học trong tuần</span>
            </CardTitle>
            <CardDescription>
              Số phút rèn luyện tích lũy theo từng ngày
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 p-0 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyActivityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="minutes" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorMinutes)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activities feed list */}
        <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-brand-600" />
              <span>Hoạt động gần đây</span>
            </CardTitle>
            <CardDescription>
              Nhật ký rèn luyện tiếng Anh
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {[
                {
                  title: 'Hội thoại AI: Airport Check-in',
                  desc: 'Speaking • Hoàn thành',
                  time: '3 giờ trước',
                  xp: '+30 XP',
                },
                {
                  title: 'Ôn tập thẻ từ vựng (SRS)',
                  desc: 'Vocabulary • 12 từ',
                  time: 'Hôm qua',
                  xp: '+20 XP',
                },
                {
                  title: 'Viết bài luận IELTS task 2',
                  desc: 'Writing • Điểm 7.0',
                  time: '2 ngày trước',
                  xp: '+100 XP',
                },
              ].map((act, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="min-w-0 pr-4">
                    <h5 className="text-xs font-bold truncate dark:text-white">
                      {act.title}
                    </h5>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {act.desc} • {act.time}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-500 shrink-0">
                    {act.xp}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
