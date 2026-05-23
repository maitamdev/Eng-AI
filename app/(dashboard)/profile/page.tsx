'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Target,
  Clock,
  Sparkles,
  BookOpen,
  Save,
  Award,
  Shield,
  ThumbsUp,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

const GOALS = [
  { id: 'general', name: 'Tiếng Anh giao tiếp chung (General)' },
  { id: 'ielts', name: 'Luyện thi IELTS' },
  { id: 'toefl', name: 'Luyện thi TOEFL' },
  { id: 'business', name: 'Tiếng Anh công sở & Business' },
  { id: 'travel', name: 'Tiếng Anh du lịch' },
];

const ENGLISH_LEVELS = [
  { id: 'beginner', name: 'Mới bắt đầu (Beginner)' },
  { id: 'elementary', name: 'Sơ cấp (Elementary)' },
  { id: 'intermediate', name: 'Trung cấp (Intermediate)' },
  { id: 'upper', name: 'Trung cấp cấp cao (Upper-Intermediate)' },
  { id: 'advanced', name: 'Nâng cao (Advanced)' },
];

const LEARNING_STYLES = [
  { id: 'balanced', name: 'Cân bằng (Balanced)' },
  { id: 'visual', name: 'Hình ảnh (Visual)' },
  { id: 'auditory', name: 'Âm thanh (Auditory)' },
  { id: 'reading', name: 'Đọc hiểu (Reading)' },
];

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [currentGoal, setCurrentGoal] = useState('general');
  const [englishLevel, setEnglishLevel] = useState('intermediate');
  const [learningStyle, setLearningStyle] = useState('balanced');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(15);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await (supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single() as any);

          if (!error && data) {
            setProfile(data);
            setFullName(data.full_name || '');
            setCurrentGoal(data.current_goal || 'general');
            setEnglishLevel(data.english_level || 'intermediate');
            setLearningStyle(data.learning_style || 'balanced');
            setDailyGoalMinutes(data.daily_goal_minutes || 15);
          }
        }
      } catch (err) {
        toast.error('Không thể tải hồ sơ cá nhân');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [supabase]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase
        .from('profiles') as any)
        .update({
          full_name: fullName,
          current_goal: currentGoal,
          english_level: englishLevel,
          learning_style: learningStyle,
          daily_goal_minutes: Number(dailyGoalMinutes),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Đã cập nhật thông tin cá nhân!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi cập nhật hồ sơ');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-brand-600 to-accent-purple text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-brand-500/10 flex flex-col sm:flex-row items-center sm:justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left z-10">
          <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-4xl font-extrabold border border-white/20 shadow-inner">
            {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">{fullName || 'Học viên ENG.AI'}</h2>
            <p className="text-brand-100 text-xs sm:text-sm font-semibold flex items-center justify-center sm:justify-start gap-1.5 mt-1">
              <Shield className="h-4 w-4" />
              Level {profile?.level || 1} • {profile?.xp || 0} XP
            </p>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center shrink-0">
          <span className="text-[10px] text-brand-100 font-bold uppercase tracking-wider block">Streak hiện tại</span>
          <span className="text-2xl font-black text-white">{profile?.streak_days || 0} ngày 🔥</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form settings */}
        <Card className="lg:col-span-8 border border-slate-100 dark:border-slate-800/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Sliders className="h-5 w-5 text-brand-600" />
              <span>Thiết lập hồ sơ</span>
            </CardTitle>
            <CardDescription>
              Cập nhật thông tin và điều chỉnh lộ trình học tiếng Anh thông minh của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currentGoal">Mục tiêu học tập</Label>
                  <select
                    id="currentGoal"
                    value={currentGoal}
                    onChange={(e) => setCurrentGoal(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-200 focus:border-brand-500 transition-colors"
                  >
                    {GOALS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="englishLevel">Trình độ hiện tại</Label>
                  <select
                    id="englishLevel"
                    value={englishLevel}
                    onChange={(e) => setEnglishLevel(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-200 focus:border-brand-500 transition-colors"
                  >
                    {ENGLISH_LEVELS.map((el) => (
                      <option key={el.id} value={el.id}>
                        {el.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="learningStyle">Phương pháp ưa thích</Label>
                  <select
                    id="learningStyle"
                    value={learningStyle}
                    onChange={(e) => setLearningStyle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-200 focus:border-brand-500 transition-colors"
                  >
                    {LEARNING_STYLES.map((ls) => (
                      <option key={ls.id} value={ls.id}>
                        {ls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyGoalMinutes">Mục tiêu luyện tập mỗi ngày</Label>
                  <select
                    id="dailyGoalMinutes"
                    value={dailyGoalMinutes}
                    onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-200 focus:border-brand-500 transition-colors"
                  >
                    <option value={10}>10 phút / ngày (Nhẹ nhàng)</option>
                    <option value={15}>15 phút / ngày (Trung bình)</option>
                    <option value={30}>30 phút / ngày (Nghiêm túc)</option>
                    <option value={60}>60 phút / ngày (Cường độ cao)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-5 rounded-xl shadow-md flex items-center space-x-2 transition-all duration-300"
                >
                  <Save className="h-4.5 w-4.5" />
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Gallery */}
        <Card className="lg:col-span-4 border border-slate-100 dark:border-slate-800/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-brand-600" />
              <span>Huy hiệu đạt được</span>
            </CardTitle>
            <CardDescription>
              Thành tích học tập tích lũy từ các hoạt động rèn luyện
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                name: 'Chào sân ENG.AI',
                desc: 'Hoàn thành lượt hội thoại đầu tiên với AI.',
                icon: '👋',
                earned: true,
              },
              {
                name: 'Lửa thiêng bất diệt',
                desc: 'Học liên tiếp trong 7 ngày để giữ streak.',
                icon: '🔥',
                earned: true,
              },
              {
                name: 'Nhà hùng biện',
                desc: 'Đạt cấp độ 5 trong kỹ năng Conversation.',
                icon: '🎙️',
                earned: false,
              },
            ].map((badge, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center space-x-4 p-3 rounded-2xl border transition-all duration-300',
                  badge.earned
                    ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                    : 'bg-slate-100/30 dark:bg-slate-950/20 border-dashed border-slate-200 dark:border-slate-800/50 opacity-50'
                )}
              >
                <div className="h-12 w-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-2xl shadow-inner shrink-0">
                  {badge.icon}
                </div>
                <div>
                  <h5 className="text-xs font-bold dark:text-white flex items-center gap-1.5">
                    {badge.name}
                    {badge.earned && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/10" />
                    )}
                  </h5>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    {badge.desc}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
