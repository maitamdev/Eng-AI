'use client';

import React, { useState, useEffect } from 'react';
import {
  PenTool,
  Send,
  Sparkles,
  Trophy,
  History,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface Submission {
  id: string;
  created_at: string;
  prompt: string | null;
  content: string;
  writing_type: string;
  overall_score: number;
  grammar_score: number;
  vocabulary_score: number;
  coherence_score: number;
  task_achievement_score: number;
  ai_feedback: string | null;
  corrections: any; // Contains { list, strengths, improvements } or list array
  word_count: number;
}

const WRITING_TYPES = [
  { id: 'essay', name: 'Nghị luận xã hội (Essay)' },
  { id: 'email', name: 'Thư điện tử công sở (Email)' },
  { id: 'story', name: 'Kể chuyện sáng tạo (Story)' },
  { id: 'report', name: 'Báo cáo công việc (Report)' },
  { id: 'ielts_task1', name: 'IELTS Writing Task 1' },
  { id: 'ielts_task2', name: 'IELTS Writing Task 2' },
];

export default function WritingPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Form input states
  const [writingType, setWritingType] = useState('essay');
  const [prompt, setPrompt] = useState('');
  const [content, setContent] = useState('');

  // AI Evaluation states
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationStep, setEvaluationStep] = useState(0);
  const [currentResult, setCurrentResult] = useState<Submission | null>(null);
  
  // History states
  const [historyList, setHistoryList] = useState<Submission[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<Submission | null>(null);

  // Load session & history
  useEffect(() => {
    async function initPage() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          await (supabase.rpc as any)('update_streak', { p_user_id: user.id });
          await loadHistory(user.id);
        }
      } catch (err) {
        toast.error('Lỗi khởi động trang');
      } finally {
        setLoading(false);
      }
    }
    initPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Load history list
  const loadHistory = async (uid: string) => {
    try {
      const { data, error } = await (supabase
        .from('writing_submissions')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      setHistoryList(data || []);
    } catch (err: any) {
      console.error('Error fetching submissions:', err);
    }
  };

  // Simulate evaluation steps for wow factor
  const runEvaluationSteps = async () => {
    const steps = [
      'HLV AI đang đọc và phân tích đề bài...',
      'Đang kiểm tra lỗi chính tả & ngữ pháp chi tiết...',
      'Đánh giá cấu trúc câu và sự mạch lạc...',
      'Đo lường độ đa dạng của vốn từ vựng sử dụng...',
      'Đang biên soạn bảng điểm và lời khuyên viết lại...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setEvaluationStep(i);
      await new Promise((resolve) => setTimeout(resolve, 1800));
    }
  };

  // Submit essay for evaluation
  const handleSubmitWriting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsEvaluating(true);
    setCurrentResult(null);

    // Call API and run visual step loader in parallel
    try {
      const apiPromise = fetch('/api/ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          prompt,
          writingType,
        }),
      });

      const stepsPromise = runEvaluationSteps();

      // Wait for both
      const [res] = await Promise.all([apiPromise, stepsPromise]);

      if (!res.ok) throw new Error('Evaluation failed');
      const aiData = await res.json();

      // Count words
      const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

      // Bundle additional metadata inside corrections column
      const correctionsData = {
        list: aiData.corrections || [],
        strengths: aiData.strengths || [],
        improvements: aiData.improvements || [],
      };

      // Save to Supabase DB
      const { data: dbData, error: dbErr } = await (supabase
        .from('writing_submissions') as any)
        .insert({
          user_id: userId,
          prompt: prompt || 'General Writing Practice',
          content: content,
          writing_type: writingType,
          overall_score: Number(aiData.overall_score),
          grammar_score: Number(aiData.grammar_score),
          vocabulary_score: Number(aiData.vocabulary_score),
          coherence_score: Number(aiData.coherence_score),
          task_achievement_score: Number(aiData.task_achievement_score),
          ai_feedback: aiData.feedback,
          corrections: correctionsData,
          word_count: wordCount,
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      // Add XP for writing (+30 XP)
      const writingXp = 30;
      await (supabase.rpc as any)('add_xp', {
        p_user_id: userId,
        p_xp: writingXp,
        p_skill: 'writing',
      });

      toast.success(`Đã đánh giá xong bài viết! +${writingXp} XP`);
      
      const savedSubmission: Submission = {
        id: dbData.id,
        created_at: dbData.created_at,
        prompt: dbData.prompt,
        content: dbData.content,
        writing_type: dbData.writing_type,
        overall_score: dbData.overall_score,
        grammar_score: dbData.grammar_score,
        vocabulary_score: dbData.vocabulary_score,
        coherence_score: dbData.coherence_score,
        task_achievement_score: dbData.task_achievement_score,
        ai_feedback: dbData.ai_feedback,
        corrections: correctionsData,
        word_count: dbData.word_count,
      };

      setCurrentResult(savedSubmission);
      if (userId) loadHistory(userId); // reload history list
    } catch (err: any) {
      console.error('Error submitting essay:', err);
      toast.error('Lỗi phân tích bài viết. Vui lòng kiểm tra lại kết nối.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Word count helper
  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 8.0) return 'text-emerald-500 border-emerald-500';
    if (score >= 6.5) return 'text-brand-500 border-brand-500';
    if (score >= 5.0) return 'text-amber-500 border-amber-500';
    return 'text-red-500 border-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8.0) return 'bg-emerald-500';
    if (score >= 6.5) return 'bg-brand-500';
    if (score >= 5.0) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const stepsList = [
    'HLV AI đang đọc và phân tích đề bài...',
    'Đang kiểm tra lỗi chính tả & ngữ pháp chi tiết...',
    'Đánh giá cấu trúc câu và sự mạch lạc...',
    'Đo lường độ đa dạng của vốn từ vựng sử dụng...',
    'Đang biên soạn bảng điểm và lời khuyên viết lại...',
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-10 w-10 text-brand-600 animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Đang tải công cụ chấm bài...</p>
      </div>
    );
  }

  // Helper to parse corrections JSON
  const getCorrectionsList = (sub: Submission) => {
    if (!sub.corrections) return [];
    if (Array.isArray(sub.corrections)) return sub.corrections;
    return sub.corrections.list || [];
  };

  const getStrengthsList = (sub: Submission) => {
    if (!sub.corrections || Array.isArray(sub.corrections)) return [];
    return sub.corrections.strengths || [];
  };

  const getImprovementsList = (sub: Submission) => {
    if (!sub.corrections || Array.isArray(sub.corrections)) return [];
    return sub.corrections.improvements || [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight dark:text-white">Chấm bài viết AI</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Nộp bài luận, email hoặc bài viết IELTS của bạn và nhận phản hồi chi tiết từ AI Coach
        </p>
      </div>

      {/* Tab switches */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl w-full max-w-xs">
        <button
          onClick={() => {
            setActiveTab('submit');
            setCurrentResult(null);
            setSelectedHistoryItem(null);
          }}
          className={cn(
            'flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all duration-205 flex items-center justify-center space-x-1.5',
            activeTab === 'submit' && !selectedHistoryItem && !currentResult
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <PenTool className="h-3.5 w-3.5" />
          <span>Bài viết mới</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('history');
            setCurrentResult(null);
            setSelectedHistoryItem(null);
          }}
          className={cn(
            'flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all duration-205 flex items-center justify-center space-x-1.5',
            activeTab === 'history' || selectedHistoryItem
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <History className="h-3.5 w-3.5" />
          <span>Lịch sử ({historyList.length})</span>
        </button>
      </div>

      {/* LOADING EVALUATION OVERLAY */}
      {isEvaluating && (
        <Card className="border border-slate-150 dark:border-slate-800 max-w-xl mx-auto p-8 shadow-lg text-center rounded-3xl animate-pulse">
          <CardContent className="pt-6 space-y-6">
            <div className="relative h-20 w-20 mx-auto flex items-center justify-center">
              <Loader2 className="h-16 w-16 text-brand-600 animate-spin absolute" />
              <PenTool className="h-6 w-6 text-brand-500 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold dark:text-white">HLV AI đang chấm bài...</h3>
              <p className="text-slate-450 dark:text-slate-400 text-xs">
                Mất khoảng 15-30 giây để phân tích toàn bộ văn bản của bạn.
              </p>
            </div>

            {/* Stepper progress */}
            <div className="space-y-2 text-left bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/85">
              {stepsList.map((step, idx) => (
                <div key={idx} className="flex items-center space-x-2.5 py-1">
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                      evaluationStep > idx
                        ? 'bg-emerald-500 text-white'
                        : evaluationStep === idx
                        ? 'bg-brand-600 text-white animate-spin'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    )}
                  >
                    {evaluationStep > idx ? '✓' : idx + 1}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      evaluationStep === idx
                        ? 'text-slate-800 dark:text-white font-bold'
                        : 'text-slate-400'
                    )}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* RESULT REPORT SCREEN */}
      {!isEvaluating && (currentResult || selectedHistoryItem) && (
        <div className="space-y-6 animate-fade-in">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => {
              setCurrentResult(null);
              setSelectedHistoryItem(null);
            }}
            className="text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl px-3 py-1 flex items-center space-x-2 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{selectedHistoryItem ? 'Quay lại lịch sử' : 'Viết bài mới'}</span>
          </Button>

          {(() => {
            const report = currentResult || selectedHistoryItem!;
            const corrections = getCorrectionsList(report);
            const strengths = getStrengthsList(report);
            const improvements = getImprovementsList(report);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left panel: Original text & corrections */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Submission details */}
                  <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-extrabold flex items-center gap-2">
                          <FileText className="h-5 w-5 text-brand-600" />
                          <span>Văn bản của bạn</span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Chủ đề: {report.prompt || 'Chưa định nghĩa'}
                        </CardDescription>
                      </div>
                      <span className="text-[10px] font-bold bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full uppercase">
                        {WRITING_TYPES.find((w) => w.id === report.writing_type)?.name || report.writing_type}
                      </span>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                        {report.content}
                      </div>
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                        <span>Độ dài: {report.word_count} từ</span>
                        <span>Được chấm vào: {new Date(report.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Corrections Box */}
                  <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-extrabold flex items-center gap-2 text-amber-600 dark:text-amber-500">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Sửa lỗi chi tiết (Correction Box)</span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Các cụm từ bị sai ngữ pháp, chính tả hoặc diễn đạt chưa tự nhiên được HLV AI sửa đổi
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {corrections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                          <span>🎉</span>
                          <h5 className="text-sm font-bold dark:text-white">Không tìm thấy lỗi sai nào!</h5>
                          <p className="text-xs text-slate-450">Bạn viết bài cực kỳ chuẩn chỉnh.</p>
                        </div>
                      ) : (
                        <div className="space-y-4.5">
                          {corrections.map((corr: any, idx: number) => (
                            <div
                              key={idx}
                              className="border border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/20 rounded-2xl p-4.5 space-y-2.5 relative overflow-hidden"
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                              <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
                                <span>Lỗi #{idx + 1}</span>
                              </div>
                              <div className="space-y-1">
                                <p className="line-through text-xs text-red-500 font-medium bg-red-500/5 px-2 py-1 rounded">
                                  {corr.original}
                                </p>
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-500/5 px-2 py-1 rounded">
                                  👉 {corr.corrected}
                                </p>
                              </div>
                              {corr.explanation && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic bg-slate-100/50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                                  💡 {corr.explanation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right panel: Evaluation charts and feedback */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Gauge score card */}
                  <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm relative overflow-hidden bg-gradient-to-b from-brand-50/10 via-transparent to-transparent">
                    <CardHeader className="text-center pb-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                        Điểm bài viết
                      </span>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center p-6 space-y-5">
                      {/* Overall score big badge */}
                      <div className={cn(
                        'h-28 w-28 rounded-full border-8 flex flex-col items-center justify-center font-extrabold shadow-inner bg-white dark:bg-slate-900',
                        getScoreColor(report.overall_score)
                      )}>
                        <span className="text-3xl font-black">{Number(report.overall_score).toFixed(1)}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Overall</span>
                      </div>

                      {/* Criteria scores */}
                      <div className="w-full space-y-3.5 pt-2">
                        {[
                          { name: 'Ngữ pháp & Chính tả (Grammar)', score: report.grammar_score },
                          { name: 'Độ đa dạng từ vựng (Vocabulary)', score: report.vocabulary_score },
                          { name: 'Mạch lạc & Liên kết (Coherence)', score: report.coherence_score },
                          { name: 'Đáp ứng yêu cầu đề (Task Achievement)', score: report.task_achievement_score },
                        ].map((crit, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold text-slate-500">
                              <span>{crit.name}</span>
                              <span className="dark:text-white">{Number(crit.score).toFixed(1)} / 9.0</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all duration-500', getScoreBg(crit.score))}
                                style={{ width: `${(crit.score / 9.0) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI feedback summary */}
                  <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-sm font-extrabold text-slate-400 uppercase tracking-wider block">
                        Nhận xét chung
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-355 whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                        {report.ai_feedback}
                      </div>

                      {/* Strengths list */}
                      {strengths.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-extrabold text-slate-450 block uppercase tracking-wider">Điểm mạnh</span>
                          <div className="space-y-1.5">
                            {strengths.map((str: string, index: number) => (
                              <div key={index} className="flex items-start space-x-2 text-xs text-slate-650 dark:text-slate-400 leading-normal">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{str}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Improvements list */}
                      {improvements.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-extrabold text-slate-455 block uppercase tracking-wider">Điểm cần cải thiện</span>
                          <div className="space-y-1.5">
                            {improvements.map((imp: string, index: number) => (
                              <div key={index} className="flex items-start space-x-2 text-xs text-slate-650 dark:text-slate-400 leading-normal">
                                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                <span>{imp}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* NEW WRITING WORKSPACE */}
      {!isEvaluating && !currentResult && !selectedHistoryItem && activeTab === 'submit' && (
        <form onSubmit={handleSubmitWriting} className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Form left */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-brand-600" />
                  <span>Khu vực viết luận</span>
                </CardTitle>
                <CardDescription>
                  Viết bài tự do hoặc chép đề bài. Nhấn nút gửi bài khi hoàn tất để HLV AI tiến hành chấm.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="writingTypeSelect">Thể loại bài viết</Label>
                    <select
                      id="writingTypeSelect"
                      value={writingType}
                      onChange={(e) => setWritingType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-200 focus:border-brand-500"
                    >
                      {WRITING_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="promptInput">Đề bài / Chủ đề (Tùy chọn)</Label>
                    <Input
                      id="promptInput"
                      placeholder="Ví dụ: Should government invest in space travel?"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="writingContent">Nội dung bài viết</Label>
                    <span className={cn(
                      'text-xs font-bold',
                      getWordCount(content) >= 10 ? 'text-slate-400' : 'text-red-500'
                    )}>
                      {getWordCount(content)} từ (tối thiểu 10 từ)
                    </span>
                  </div>
                  <textarea
                    id="writingContent"
                    rows={12}
                    placeholder="Nhập nội dung bài viết của bạn tại đây bằng tiếng Anh..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm leading-relaxed text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 outline-none transition-colors scrollbar-thin resize-none"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-100 dark:border-slate-800/80 p-4.5 flex justify-end">
                <Button
                  type="submit"
                  disabled={getWordCount(content) < 10}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-5 rounded-xl shadow-md shadow-brand-500/10 flex items-center space-x-2 transition-all hover:scale-[1.02]"
                >
                  <Send className="h-4.5 w-4.5" />
                  <span>Gửi bài chấm điểm (+30 XP)</span>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Tips right */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm relative overflow-hidden bg-gradient-to-b from-brand-50/10 via-transparent to-transparent">
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center text-lg mb-2">
                  <Sparkles className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-bold">Kinh nghiệm viết luận</CardTitle>
                <CardDescription>
                  Một số lưu ý giúp bài viết của bạn đạt kết quả tốt nhất.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <p className="font-bold text-slate-800 dark:text-slate-300">1. Đa dạng hóa từ vựng (Vocabulary):</p>
                  <p className="mt-0.5">Tránh lặp lại nhiều lần một từ. Sử dụng từ đồng nghĩa phù hợp ngữ cảnh để AI đánh giá cao.</p>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <p className="font-bold text-slate-800 dark:text-slate-300">2. Mạch lạc & Liên kết (Coherence):</p>
                  <p className="mt-0.5">Sử dụng các từ nối (e.g. However, Furthermore, In addition) để tổ chức ý mạch lạc.</p>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <p className="font-bold text-slate-800 dark:text-slate-300">3. Bắt đúng yêu cầu đề (Task):</p>
                  <p className="mt-0.5">Đưa ra luận điểm rõ ràng từ mở bài đến kết bài, trực tiếp trả lời câu hỏi đề bài.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      )}

      {/* SUBMISSION HISTORY SCREEN */}
      {!isEvaluating && !currentResult && !selectedHistoryItem && activeTab === 'history' && (
        <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm max-w-4xl mx-auto animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-brand-600" />
              <span>Lịch sử chấm bài viết</span>
            </CardTitle>
            <CardDescription>
              Xem lại các bài viết cũ và nhận xét chi tiết của giáo viên AI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {historyList.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                Bạn chưa nộp bài viết nào. Hãy sang tab **Bài viết mới** để gửi bài luyện tập đầu tiên!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/85 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedHistoryItem(item)}
                    className="flex justify-between items-center py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 px-3 rounded-2xl transition-all group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-slate-150 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full uppercase">
                          {WRITING_TYPES.find((w) => w.id === item.writing_type)?.name || item.writing_type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">
                        Đề bài: {item.prompt || 'Bài viết tự do'}
                      </h4>
                      <p className="text-xs text-slate-450 dark:text-slate-400 truncate italic">
                        "{item.content}"
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className={cn(
                        'h-12 w-12 rounded-xl border-2 flex flex-col items-center justify-center font-extrabold text-sm bg-white dark:bg-slate-900',
                        getScoreColor(item.overall_score)
                      )}>
                        <span>{Number(item.overall_score).toFixed(1)}</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
