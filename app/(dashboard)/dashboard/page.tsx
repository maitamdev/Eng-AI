'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Flame, Zap, Sparkles, Clock, TrendingUp, Target, Trophy, ChevronRight, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Area, AreaChart, XAxis, YAxis, Tooltip } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import { format, subDays, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function DashboardHome() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Profile
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) setProfile(profileData);

      // 2. Fetch Skill Stats for Radar
      const { data: skillsData } = await supabase.from('skill_stats').select('*').eq('user_id', user.id);
      if (skillsData) {
        const mappedRadar = ['conversation', 'vocabulary', 'writing', 'pronunciation', 'listening', 'reading'].map(skill => {
          const stat: any = skillsData.find((s: any) => s.skill === skill);
          // Normalize to 100 based on level (max 10) or accuracy
          const A = stat ? Math.min(100, Math.max(10, (stat.level * 10) + (stat.accuracy_rate / 2))) : 10;
          return {
            subject: skill.charAt(0).toUpperCase() + skill.slice(1),
            A: Math.round(A),
            fullMark: 100
          };
        });
        setRadarData(mappedRadar);
      }

      // 3. Fetch Study Sessions for Weekly Activity
      const sevenDaysAgo = subDays(new Date(), 6);
      const { data: sessionsData } = await supabase
        .from('study_sessions')
        .select('session_date, duration_seconds')
        .eq('user_id', user.id)
        .gte('session_date', format(sevenDaysAgo, 'yyyy-MM-dd'));

      // Prepare empty week array
      const daysMap = new Map();
      for (let i = 6; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const dateStr = format(d, 'yyyy-MM-dd');
        let name = format(d, 'EEEE', { locale: vi }); 
        name = name.charAt(0).toUpperCase() + name.slice(1);
        daysMap.set(dateStr, { name: name.includes('Chủ nhật') ? 'Chủ Nhật' : name.replace('Thứ', 'T'), minutes: 0, date: dateStr });
      }

      if (sessionsData) {
        sessionsData.forEach((s: any) => {
          if (daysMap.has(s.session_date)) {
            const dayObj = daysMap.get(s.session_date);
            dayObj.minutes += Math.round(s.duration_seconds / 60);
          }
        });
      }
      setWeeklyData(Array.from(daysMap.values()));

      // 4. Fetch Recent Activities (Mix of conversations and writing)
      const { data: convData } = await supabase.from('conversations').select('scenario, created_at, xp_earned').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3);
      const { data: writeData } = await supabase.from('writing_submissions').select('writing_type, overall_score, created_at, xp_earned').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3);
      
      let combined: any[] = [];
      if (convData) {
        combined = combined.concat(convData.map((c: any) => ({
          title: `Hội thoại AI: ${c.scenario}`,
          desc: 'Speaking • Hoàn thành',
          created_at: new Date(c.created_at).getTime(),
          time: format(new Date(c.created_at), 'dd/MM/yyyy HH:mm'),
          xp: `+${c.xp_earned} XP`
        })));
      }
      if (writeData) {
        combined = combined.concat(writeData.map((w: any) => ({
          title: `Viết bài: ${w.writing_type}`,
          desc: `Writing • Điểm ${w.overall_score || 0}`,
          created_at: new Date(w.created_at).getTime(),
          time: format(new Date(w.created_at), 'dd/MM/yyyy HH:mm'),
          xp: `+${w.xp_earned} XP`
        })));
      }

      combined.sort((a, b) => b.created_at - a.created_at);
      setRecentActivities(combined.slice(0, 3));

    } catch (err) {
      console.error(err);
      toast.error('Không thể tải dữ liệu Dashboard');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();

    let channel: ReturnType<typeof supabase.channel>;
    // Generate a unique channel name to prevent collision in React Strict Mode
    const channelName = `dashboard_realtime_${Math.random().toString(36).substring(7)}`;
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      
      channel = supabase.channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => {
          fetchDashboardData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'skill_stats', filter: `user_id=eq.${user.id}` }, () => {
          fetchDashboardData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'study_sessions', filter: `user_id=eq.${user.id}` }, () => {
          fetchDashboardData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `user_id=eq.${user.id}` }, () => {
          fetchDashboardData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'writing_submissions', filter: `user_id=eq.${user.id}` }, () => {
          fetchDashboardData();
        })
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, fetchDashboardData]);

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
            Chào mừng quay lại, {profile?.full_name?.split(' ')[0] || 'Học viên'}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Bắt đầu bài luyện tập hôm nay để giữ vững phong độ và bảo vệ ngọn lửa streak!
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-slate-600 dark:text-slate-300">
            Hôm nay: {format(new Date(), 'EEEE, dd/MM/yyyy', { locale: vi })}
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
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" strokeOpacity={0.5} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                <Radar
                  name="Mức độ thành thạo"
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
              Số phút rèn luyện tích lũy theo từng ngày (7 ngày gần nhất)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 p-0 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
              {recentActivities.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  Bạn chưa có hoạt động nào. Hãy bắt đầu học ngay!
                </div>
              ) : (
                recentActivities.map((act, idx) => (
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
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
