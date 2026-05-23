'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookMarked,
  Eye,
  EyeOff,
  Loader2,
  Award,
  Plus,
  Check,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

const TOPICS = [
  { id: 'general', name: 'Giao tiếp đời sống' },
  { id: 'science', name: 'Khoa học & Công nghệ' },
  { id: 'business', name: 'Kinh doanh & Kinh tế' },
  { id: 'culture', name: 'Văn hóa & Nghệ thuật' },
  { id: 'travel', name: 'Du lịch & Xã hội' },
];

const LEVELS = [
  { id: 'easy', name: 'Dễ (Beginner)' },
  { id: 'medium', name: 'Trung bình (Intermediate)' },
  { id: 'hard', name: 'Khó (Advanced)' },
];

interface VocabItem {
  word: string;
  pronunciation: string;
  part_of_speech: string;
  definition: string;
}

interface QuestionItem {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface ReadingData {
  title: string;
  passage: string;
  translation: string;
  key_vocabulary: VocabItem[];
  questions: QuestionItem[];
}

export default function ReadingPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Filters
  const [selectedTopic, setSelectedTopic] = useState('general');
  const [selectedLevel, setSelectedLevel] = useState('medium');

  // AI Content State
  const [isGenerating, setIsGenerating] = useState(false);
  const [readingData, setReadingData] = useState<ReadingData | null>(null);

  // Layout & Interactive States
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([-1, -1, -1]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [xpEarnedState, setXpEarnedState] = useState(false);
  const [savedVocabList, setSavedVocabList] = useState<Record<string, boolean>>({});

  // Audio Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);

  // Timer
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    async function initPage() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          // Auto-trigger streak update
          await (supabase.rpc as any)('update_streak', { p_user_id: user.id });
        }
      } catch (err) {
        toast.error('Lỗi khởi động trang Đọc hiểu');
      } finally {
        setLoading(false);
      }
    }
    initPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Handle Text-To-Speech (TTS)
  const handlePlayTTS = () => {
    if (!readingData) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // cancel current speech

      const utterance = new SpeechSynthesisUtterance(readingData.passage);
      utterance.lang = 'en-US';
      utterance.rate = speechRate;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('Trình duyệt của bạn không hỗ trợ đọc âm thanh (TTS)');
    }
  };

  const handleStopTTS = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  // Generate exercises using Groq AI
  const handleGenerateReading = async () => {
    setIsGenerating(true);
    setReadingData(null);
    handleStopTTS();

    // Reset layout states
    setShowTranslation(false);
    setSelectedOptions([-1, -1, -1]);
    setQuizSubmitted(false);
    setQuizScore(0);
    setXpEarnedState(false);
    setSavedVocabList({});
    setStartTime(Date.now());

    try {
      const res = await fetch('/api/ai/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          difficulty: selectedLevel,
        }),
      });

      if (!res.ok) throw new Error('API Request Failed');

      const data = await res.json();
      setReadingData(data);
      toast.success('Bài đọc hiểu đã được tạo thành công!');
    } catch (err: any) {
      console.error(err);
      toast.error('Không thể tạo bài nghe/đọc từ AI. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Key Vocabulary to database
  const handleSaveVocab = async (vocab: VocabItem) => {
    if (!userId) {
      toast.error('Vui lòng đăng nhập để lưu từ vựng!');
      return;
    }

    if (savedVocabList[vocab.word]) return;

    try {
      const { error } = await (supabase
        .from('vocabulary') as any)
        .insert({
          user_id: userId,
          word: vocab.word,
          definition: vocab.definition,
          pronunciation: vocab.pronunciation,
          part_of_speech: vocab.part_of_speech,
          example_sentence: `Generated from reading lesson "${readingData?.title || ''}"`,
          difficulty: selectedLevel,
          topic: selectedTopic,
          source: 'lesson',
        });

      if (error) throw error;

      // Add a small XP for vocabulary learning
      await (supabase.rpc as any)('add_xp', {
        p_user_id: userId,
        p_xp: 5,
        p_skill: 'vocabulary',
      });

      setSavedVocabList((prev) => ({ ...prev, [vocab.word]: true }));
      toast.success(`Đã lưu "${vocab.word}" vào sổ tay từ vựng! +5 XP`);
    } catch (err: any) {
      console.error('Error saving vocab word:', err);
      toast.error('Không thể lưu từ vựng vào database');
    }
  };

  // Submit and check quiz answers
  const handleSubmitQuiz = async () => {
    if (!readingData || !userId) return;

    // Check if user answered all questions
    const unansweredIndex = selectedOptions.findIndex((opt) => opt === -1);
    if (unansweredIndex !== -1) {
      toast.warning(`Vui lòng hoàn thành câu hỏi số ${unansweredIndex + 1} trước khi nộp bài!`);
      return;
    }

    // Stop audio
    handleStopTTS();

    // Evaluate score
    let score = 0;
    readingData.questions.forEach((q, idx) => {
      const userSelectedOptionIndex = selectedOptions[idx];
      const userSelectedText = q.options[userSelectedOptionIndex];
      if (userSelectedText === q.correct_answer) {
        score++;
      }
    });

    setQuizScore(score);
    setQuizSubmitted(true);

    const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
    const xpReward = score * 10; // 10 XP per correct question

    try {
      // 1. Add XP to profiles & skill_stats using RPC
      if (xpReward > 0) {
        await (supabase.rpc as any)('add_xp', {
          p_user_id: userId,
          p_xp: xpReward,
          p_skill: 'reading',
        });
      }

      // 2. Insert into lessons table
      await (supabase
        .from('lessons') as any)
        .insert({
          user_id: userId,
          title: readingData.title,
          skill: 'reading',
          content: readingData,
          difficulty: selectedLevel,
          completed: true,
          score: Math.round((score / 3) * 100),
          xp_earned: xpReward,
          time_spent_seconds: timeSpentSeconds,
        });

      // 3. Insert into study_sessions table to draw the Weekly Activity graph in Dashboard
      await (supabase
        .from('study_sessions') as any)
        .insert({
          user_id: userId,
          skill: 'reading',
          duration_seconds: timeSpentSeconds,
          xp_earned: xpReward,
        });

      setXpEarnedState(true);
      toast.success(`Hoàn thành! Bạn đạt ${score}/3 điểm. +${xpReward} XP!`);
    } catch (err: any) {
      console.error('Error logging quiz submission:', err);
      toast.error('Lỗi khi đồng bộ kết quả lên hệ thống');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-10 w-10 text-brand-600 animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Đang chuẩn bị học liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight dark:text-white">Luyện đọc hiểu AI</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Rèn luyện khả năng đọc hiểu, tích lũy từ vựng học thuật và làm bài kiểm tra tự động thiết kế bởi AI.
        </p>
      </div>

      {/* Screen 1: Config selection */}
      {!readingData && (
        <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm max-w-2xl mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-600" />
              <span>Cấu hình bài đọc cùng AI</span>
            </CardTitle>
            <CardDescription>
              AI sẽ thiết kế một đoạn văn độc quyền kèm câu hỏi trắc nghiệm riêng cho bạn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Topic Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Chủ đề bài đọc</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-sm outline-none text-slate-800 dark:text-slate-200 focus:border-brand-500 transition-colors"
                >
                  {TOPICS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Trình độ tiếng Anh</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-sm outline-none text-slate-800 dark:text-slate-200 focus:border-brand-500 transition-colors"
                >
                  {LEVELS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              onClick={handleGenerateReading}
              disabled={isGenerating}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-5 rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-brand-500/10 transition-all hover:scale-[1.01]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>AI đang soạn thảo bài viết...</span>
                </>
              ) : (
                <>
                  <BookOpen className="h-4.5 w-4.5 text-white" />
                  <span>Bắt đầu bài đọc hiểu mới</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Screen 2: Active Reading workspace (Split layout) */}
      {readingData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          
          {/* LEFT COLUMN: Passage content, TTS & Translation */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm relative overflow-hidden bg-white dark:bg-slate-900">
              
              {/* Card Header controls */}
              <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleStopTTS();
                    setReadingData(null);
                  }}
                  className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-3 py-1 flex items-center space-x-1.5 text-xs font-bold"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  <span>Đổi chủ đề</span>
                </Button>
                
                {/* Level tags */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-0.5 rounded-full uppercase">
                    {TOPICS.find((t) => t.id === selectedTopic)?.name}
                  </span>
                  <span className="text-[10px] font-bold bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 px-2.5 py-0.5 rounded-full uppercase">
                    {LEVELS.find((l) => l.id === selectedLevel)?.name}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                
                {/* Passage Title */}
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                  {readingData.title}
                </h2>

                {/* TTS Reader Panel */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-105/50 dark:border-slate-800/60">
                  <div className="flex items-center space-x-2">
                    {isPlaying ? (
                      <Button
                        size="icon"
                        onClick={handleStopTTS}
                        className="h-9 w-9 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shrink-0"
                      >
                        <VolumeX className="h-4.5 w-4.5" />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        onClick={handlePlayTTS}
                        className="h-9 w-9 rounded-xl bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shrink-0"
                      >
                        <Volume2 className="h-4.5 w-4.5" />
                      </Button>
                    )}
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Nghe AI đọc bài viết (TTS)
                    </span>
                  </div>

                  {/* Speed options */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Tốc độ:</span>
                    {[0.8, 1.0, 1.2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          setSpeechRate(rate);
                          if (isPlaying) {
                            // Restart speech with new speed
                            setTimeout(() => handlePlayTTS(), 50);
                          }
                        }}
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded-lg font-bold border transition-all',
                          speechRate === rate
                            ? 'bg-brand-500 border-brand-500 text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 hover:bg-slate-50'
                        )}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* English Passage Text */}
                <div className="leading-relaxed text-sm text-slate-700 dark:text-slate-350 space-y-4 whitespace-pre-line font-medium pr-1 select-text">
                  {readingData.passage}
                </div>

                {/* Collapsible Vietnamese Translation */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowTranslation(!showTranslation)}
                    className="flex items-center space-x-2 text-xs font-bold border-slate-200 dark:border-slate-800"
                  >
                    {showTranslation ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        <span>Ẩn bản dịch tiếng Việt</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        <span>Xem bản dịch tiếng Việt</span>
                      </>
                    )}
                  </Button>

                  <AnimatePresence>
                    {showTranslation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-xs leading-relaxed text-slate-600 dark:text-slate-400 italic">
                          {readingData.translation}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>

            {/* Key Vocabulary Card */}
            {readingData.key_vocabulary && readingData.key_vocabulary.length > 0 && (
              <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-sm font-extrabold text-slate-400 uppercase tracking-wider block">
                    Từ vựng quan trọng (Key Vocabulary)
                  </CardTitle>
                  <CardDescription>
                    Các từ vựng đắt giá xuất hiện trong bài viết. Lưu vào sổ tay để ôn tập ngắt quãng (SRS).
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {readingData.key_vocabulary.map((vocab, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-start justify-between gap-3 group hover:border-brand-500/30 transition-all duration-300"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-800 dark:text-white">
                            {vocab.word}
                          </span>
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-bold lowercase">
                            {vocab.part_of_speech}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 tracking-wide">
                          {vocab.pronunciation}
                        </p>
                        <p className="text-xs font-semibold text-slate-650 dark:text-slate-350">
                          {vocab.definition}
                        </p>
                      </div>

                      {/* Add button */}
                      <Button
                        size="icon"
                        variant={savedVocabList[vocab.word] ? 'secondary' : 'outline'}
                        onClick={() => handleSaveVocab(vocab)}
                        disabled={savedVocabList[vocab.word]}
                        className={cn(
                          'h-8 w-8 rounded-xl shrink-0 border-slate-200 dark:border-slate-800 shadow-sm transition-all',
                          savedVocabList[vocab.word]
                            ? 'bg-emerald-500/10 border-emerald-550/20 text-emerald-500'
                            : 'hover:border-brand-500 hover:text-brand-600'
                        )}
                        title="Lưu từ vựng vào sổ tay"
                      >
                        {savedVocabList[vocab.word] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN: Interactive Quiz questions */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900 sticky top-4">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
                <CardTitle className="text-sm font-extrabold text-slate-400 uppercase tracking-wider block">
                  Câu hỏi Đọc hiểu (Reading Comprehension)
                </CardTitle>
                <CardDescription>
                  Trả lời cả 3 câu hỏi trắc nghiệm dưới đây để chứng minh sự hiểu biết.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6 space-y-6 max-h-[500px] overflow-y-auto scrollbar-thin">
                {readingData.questions.map((q, qIdx) => {
                  const userSelectedOptionIndex = selectedOptions[qIdx];
                  const hasSelected = userSelectedOptionIndex !== -1;

                  return (
                    <div key={qIdx} className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800/80 last:border-0 last:pb-0">
                      <div className="flex items-start gap-2">
                        <span className="h-5 w-5 bg-brand-50 dark:bg-brand-950 text-brand-650 dark:text-brand-400 font-extrabold rounded-lg text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {qIdx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {q.question}
                        </h4>
                      </div>

                      {/* Options */}
                      <div className="space-y-2 pl-7">
                        {q.options.map((option, optIdx) => {
                          const isSelected = userSelectedOptionIndex === optIdx;
                          const isCorrectOption = option === q.correct_answer;

                          return (
                            <button
                              key={optIdx}
                              disabled={quizSubmitted}
                              onClick={() => {
                                const newOpts = [...selectedOptions];
                                newOpts[qIdx] = optIdx;
                                setSelectedOptions(newOpts);
                              }}
                              className={cn(
                                'w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 flex items-center justify-between',
                                quizSubmitted
                                  ? isCorrectOption
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                    : isSelected
                                    ? 'bg-red-500/10 border-red-500 text-red-650 dark:text-red-400'
                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 text-slate-400'
                                  : isSelected
                                  ? 'bg-brand-500/5 border-brand-500 text-brand-600 dark:text-brand-400 shadow-sm'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850/50 text-slate-650 dark:text-slate-400'
                              )}
                            >
                              <span>{option}</span>
                              {quizSubmitted && isCorrectOption && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 ml-2" />
                              )}
                              {quizSubmitted && isSelected && !isCorrectOption && (
                                <XCircle className="h-4 w-4 text-red-550 shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {quizSubmitted && (
                        <div className="pl-7 pt-2">
                          <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 space-y-1">
                            <span className="font-extrabold text-amber-600 dark:text-amber-500 block uppercase tracking-wider text-[9px]">
                              💡 Giải thích đáp án:
                            </span>
                            <p className="italic">{q.explanation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>

              {/* Action and metrics Footer */}
              <CardFooter className="p-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/20 flex flex-col gap-4">
                
                {/* Result box once submitted */}
                {quizSubmitted && (
                  <div className="w-full grid grid-cols-2 gap-4 text-center bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Điểm đạt được</span>
                      <span className={cn(
                        'text-lg font-extrabold',
                        quizScore >= 2 ? 'text-emerald-500' : 'text-red-500'
                      )}>
                        {quizScore}/3 câu đúng
                      </span>
                    </div>
                    <div className="border-l border-slate-100 dark:border-slate-850">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Kinh nghiệm</span>
                      <span className="text-lg font-extrabold text-brand-600 dark:text-brand-500">
                        +{quizScore * 10} XP
                      </span>
                    </div>
                  </div>
                )}

                <div className="w-full flex gap-3">
                  {quizSubmitted ? (
                    <Button
                      onClick={handleGenerateReading}
                      className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-brand-500/10"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Bài đọc khác</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmitQuiz}
                      className="w-full bg-brand-650 hover:bg-brand-700 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-brand-500/10"
                    >
                      <CheckCircle2 className="h-4.5 w-4.5" />
                      <span>Nộp bài & Chấm điểm</span>
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>

        </div>
      )}

    </div>
  );
}
