'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Sparkles,
  Plus,
  CheckCircle2,
  Volume2,
  Trash2,
  GraduationCap,
  RotateCw,
  Frown,
  Meh,
  Smile,
  Flame,
  Award,
  Loader2,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

// Types matching database
interface VocabularyWord {
  id: string;
  word: string;
  definition: string | null;
  example_sentence: string | null;
  pronunciation: string | null;
  part_of_speech: string | null;
  difficulty: string;
  topic: string | null;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  last_reviewed_at: string | null;
  is_mastered: boolean;
  source: string | null;
  created_at: string;
}

const TOPICS = [
  { id: 'all', name: 'Tất cả chủ đề' },
  { id: 'general', name: 'Giao tiếp chung' },
  { id: 'business', name: 'Công sở & Doanh nghiệp' },
  { id: 'travel', name: 'Du lịch & Khám phá' },
  { id: 'academic', name: 'Học thuật & IELTS' },
  { id: 'tech', name: 'Công nghệ & IT' },
];

const DIFFICULTIES = [
  { id: 'all', name: 'Mọi trình độ' },
  { id: 'easy', name: 'Dễ (Beginner)' },
  { id: 'medium', name: 'Vừa (Intermediate)' },
  { id: 'hard', name: 'Khó (Advanced)' },
];

export default function VocabularyPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'srs' | 'journal'>('srs');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Vocabulary list states
  const [vocabList, setVocabList] = useState<VocabularyWord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  // SRS states
  const [srsQueue, setSrsQueue] = useState<VocabularyWord[]>([]);
  const [currentSrsIndex, setCurrentSrsIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [srsFinished, setSrsFinished] = useState(false);

  // AI Generator states
  const [aiTopic, setAiTopic] = useState('business');
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWord, setGeneratedWord] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Fetch user session & data
  useEffect(() => {
    async function initPage() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          // Update streak on access
          await (supabase.rpc as any)('update_streak', { p_user_id: user.id });
          await loadVocabulary(user.id);
        }
      } catch (err) {
        toast.error('Không thể tải phiên làm việc');
      } finally {
        setLoading(false);
      }
    }
    initPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Load user vocabulary
  const loadVocabulary = async (uid: string) => {
    try {
      const { data, error } = await (supabase
        .from('vocabulary')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;

      const words: VocabularyWord[] = data || [];
      setVocabList(words);

      // Filter words for review today
      const todayStr = new Date().toISOString().split('T')[0];
      const srsWords = words.filter((w) => {
        // next_review_date <= today AND not mastered
        return w.next_review_date <= todayStr && !w.is_mastered;
      });

      setSrsQueue(srsWords);
      setCurrentSrsIndex(0);
      setIsFlipped(false);
      setSrsFinished(false);
      setReviewedCount(0);
      setXpEarned(0);
    } catch (err: any) {
      console.error('Error fetching vocabulary:', err);
      toast.error('Lỗi tải danh sách từ vựng');
    }
  };

  // SM-2 Spaced Repetition calculation
  const handleSrsReview = async (quality: number) => {
    if (srsQueue.length === 0 || currentSrsIndex >= srsQueue.length) return;

    const currentWord = srsQueue[currentSrsIndex];
    let interval = currentWord.interval_days;
    let repetitions = currentWord.repetitions;
    let easeFactor = Number(currentWord.ease_factor);

    // SM-2 algorithm variables adjustment
    if (quality < 3) {
      // Forgot
      repetitions = 0;
      interval = 1;
      // decrease ease factor
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else {
      // Recall correct
      repetitions += 1;
      if (repetitions === 1) {
        interval = quality === 5 ? 2 : 1;
      } else if (repetitions === 2) {
        interval = quality === 5 ? 8 : (quality === 4 ? 6 : 4);
      } else {
        const factorMultiplier = quality === 5 ? 2.2 : (quality === 4 ? 1.5 : 1.2);
        interval = Math.ceil(interval * factorMultiplier);
      }

      // adjust ease factor
      if (quality === 5) {
        easeFactor += 0.15;
      } else if (quality === 3) {
        easeFactor -= 0.15;
      }
      easeFactor = Math.max(1.3, easeFactor);
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);
    const nextReviewStr = nextReview.toISOString().split('T')[0];

    // Mastered if reviews high enough
    const isMastered = repetitions >= 5 || interval >= 30;

    try {
      // Update database
      const { error } = await (supabase
        .from('vocabulary') as any)
        .update({
          ease_factor: easeFactor,
          interval_days: interval,
          repetitions: repetitions,
          next_review_date: nextReviewStr,
          last_reviewed_at: new Date().toISOString(),
          is_mastered: isMastered,
        })
        .eq('id', currentWord.id);

      if (error) throw error;

      // Add XP for review
      const reviewXp = 5;
      await (supabase.rpc as any)('add_xp', {
        p_user_id: userId,
        p_xp: reviewXp,
        p_skill: 'vocabulary',
      });

      // Update counters
      setXpEarned((prev) => prev + reviewXp);
      setReviewedCount((prev) => prev + 1);

      // Move to next card
      toast.success(`Đã ghi nhận! +${reviewXp} XP`);

      setIsFlipped(false);
      // Wait for flip transition to end before updating index
      setTimeout(() => {
        if (currentSrsIndex + 1 >= srsQueue.length) {
          setSrsFinished(true);
          if (userId) loadVocabulary(userId); // reload list
        } else {
          setCurrentSrsIndex((prev) => prev + 1);
        }
      }, 300);
    } catch (err: any) {
      console.error('Error updating review status:', err);
      toast.error('Không thể cập nhật trạng thái ôn tập');
    }
  };

  // Generate word using Groq AI
  const handleGenerateWord = async () => {
    setIsGenerating(true);
    setGeneratedWord(null);
    setIsSaved(false);

    try {
      const res = await fetch('/api/ai/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          difficulty: aiDifficulty,
        }),
      });

      if (!res.ok) throw new Error('API failed');

      const data = await res.json();
      setGeneratedWord(data);
    } catch (err: any) {
      toast.error('Lỗi khi nhờ AI tạo từ vựng. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save generated word to journal
  const handleSaveWord = async () => {
    if (!generatedWord || !userId) return;

    try {
      const { error } = await (supabase
        .from('vocabulary') as any)
        .insert({
          user_id: userId,
          word: generatedWord.word,
          definition: generatedWord.definition,
          pronunciation: generatedWord.pronunciation,
          part_of_speech: generatedWord.part_of_speech,
          example_sentence: generatedWord.examples ? generatedWord.examples.join('\n') : '',
          difficulty: generatedWord.difficulty || aiDifficulty,
          topic: aiTopic,
          source: 'ai_generated',
        });

      if (error) throw error;

      // Add XP for learning new word
      const newWordXp = 10;
      await (supabase.rpc as any)('add_xp', {
        p_user_id: userId,
        p_xp: newWordXp,
        p_skill: 'vocabulary',
      });

      setIsSaved(true);
      toast.success(`Đã lưu "${generatedWord.word}" vào sổ tay! +${newWordXp} XP`);
      loadVocabulary(userId); // reload
    } catch (err: any) {
      console.error('Error saving word:', err);
      toast.error('Không thể lưu từ vựng');
    }
  };

  // Delete word from journal
  const handleDeleteWord = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa từ vựng này khỏi sổ tay?')) return;

    try {
      const { error } = await (supabase
        .from('vocabulary') as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Đã xóa từ vựng thành công');
      if (userId) loadVocabulary(userId);
    } catch (err: any) {
      toast.error('Lỗi khi xóa từ vựng');
    }
  };

  // Play pronunciation sound via Web Speech API (Text-to-Speech)
  const handlePlayAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85; // slightly slower for learning
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('Trình duyệt không hỗ trợ phát âm thanh');
    }
  };

  // Filtered vocabulary list
  const filteredVocab = vocabList.filter((item) => {
    const matchesSearch = item.word.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.definition && item.definition.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTopic = selectedTopic === 'all' || item.topic === selectedTopic;
    const matchesDifficulty = selectedDifficulty === 'all' || item.difficulty === selectedDifficulty;
    return matchesSearch && matchesTopic && matchesDifficulty;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-10 w-10 text-brand-600 animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Đang chuẩn bị từ điển của bạn...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight dark:text-white">Từ vựng & Flashcards</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Học từ vựng thông minh với thuật toán lặp lại ngắt quãng (SRS) và AI Coach
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl w-full max-w-md">
        <button
          onClick={() => setActiveTab('srs')}
          className={cn(
            'flex-1 text-center py-2.5 rounded-xl text-sm font-extrabold transition-all duration-200 flex items-center justify-center space-x-2',
            activeTab === 'srs'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <Flame className={cn('h-4 w-4', activeTab === 'srs' ? 'text-amber-500' : 'text-slate-400')} />
          <span>Ôn tập hôm nay</span>
          {srsQueue.length > 0 && !srsFinished && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {srsQueue.length - reviewedCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('journal')}
          className={cn(
            'flex-1 text-center py-2.5 rounded-xl text-sm font-extrabold transition-all duration-200 flex items-center justify-center space-x-2',
            activeTab === 'journal'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <BookOpen className="h-4 w-4 text-slate-400" />
          <span>Sổ tay từ vựng</span>
        </button>
      </div>

      {/* TAB 1: SRS PRACTICE */}
      {activeTab === 'srs' && (
        <div className="space-y-6">
          {srsQueue.length === 0 ? (
            <Card className="border border-slate-100 dark:border-slate-800/80 p-8 shadow-sm text-center max-w-xl mx-auto rounded-3xl">
              <CardContent className="pt-6 space-y-4">
                <div className="h-16 w-16 bg-brand-50 dark:bg-brand-950/50 rounded-full flex items-center justify-center text-3xl mx-auto">
                  🎉
                </div>
                <h3 className="text-lg font-bold dark:text-white">Không có từ cần ôn tập hôm nay!</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
                  Bạn đã hoàn thành xuất sắc các lịch trình ôn tập của mình. Hãy sang tab **Sổ tay từ vựng** để thêm từ mới hoặc yêu cầu AI tạo từ vựng cho bạn học nhé!
                </p>
                <Button
                  onClick={() => setActiveTab('journal')}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl px-5 py-4 mt-2"
                >
                  Khám phá Sổ tay & AI Generator
                </Button>
              </CardContent>
            </Card>
          ) : srsFinished ? (
            <Card className="border border-slate-100 dark:border-slate-800/80 p-8 shadow-sm text-center max-w-xl mx-auto rounded-3xl animate-fade-in">
              <CardContent className="pt-6 space-y-6">
                <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center text-4xl mx-auto animate-bounce">
                  🏆
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black dark:text-white">Hoàn thành buổi ôn tập hôm nay!</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Tuyệt vời! Bạn đã hoàn thành việc ôn tập qua hệ thống Lặp lại ngắt quãng.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Đã ôn tập</span>
                    <span className="text-xl font-extrabold dark:text-white">{reviewedCount} từ</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Kinh nghiệm</span>
                    <span className="text-xl font-extrabold text-brand-600 dark:text-brand-500">+{xpEarned} XP</span>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => {
                      if (userId) loadVocabulary(userId);
                    }}
                    variant="outline"
                    className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold rounded-xl"
                  >
                    Học lại từ đầu
                  </Button>
                  <Button
                    onClick={() => setActiveTab('journal')}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl"
                  >
                    Vào sổ tay từ vựng
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="max-w-xl mx-auto space-y-6">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>Tiến độ ôn tập</span>
                  <span>
                    {currentSrsIndex + 1} / {srsQueue.length} từ
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-300"
                    style={{ width: `${((currentSrsIndex + 1) / srsQueue.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Flashcard (Flip animation) */}
              <div className="h-[340px] w-full cursor-pointer select-none [perspective:1000px]">
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="relative w-full h-full duration-500 transition-all transform"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* FRONT SIDE */}
                  <div
                    className="absolute inset-0 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-8 flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {srsQueue[currentSrsIndex].part_of_speech || 'vocab'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudio(srsQueue[currentSrsIndex].word);
                        }}
                        className="h-10 w-10 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 flex items-center justify-center text-slate-500 hover:text-brand-600 transition-colors"
                      >
                        <Volume2 className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    <div className="text-center space-y-2 my-auto">
                      <h2 className="text-4xl font-extrabold tracking-tight dark:text-white">
                        {srsQueue[currentSrsIndex].word}
                      </h2>
                      <p className="text-slate-400 font-mono text-sm font-semibold tracking-wide">
                        {srsQueue[currentSrsIndex].pronunciation || '/.../'}
                      </p>
                    </div>

                    <div className="text-center text-slate-400 text-xs font-semibold flex items-center justify-center space-x-1">
                      <span>Click để xem nghĩa</span>
                      <RotateCw className="h-3 w-3 animate-spin [animation-duration:10s]" />
                    </div>
                  </div>

                  {/* BACK SIDE */}
                  <div
                    className="absolute inset-0 bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-8 flex flex-col justify-between shadow-md"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Định nghĩa & Ví dụ
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudio(srsQueue[currentSrsIndex].word);
                        }}
                        className="h-10 w-10 rounded-full bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 flex items-center justify-center text-slate-500 hover:text-brand-600 transition-colors"
                      >
                        <Volume2 className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-center space-y-4 my-2">
                      <div className="text-center">
                        <span className="text-2xl font-black text-brand-600 dark:text-brand-400">
                          {srsQueue[currentSrsIndex].definition}
                        </span>
                      </div>

                      {srsQueue[currentSrsIndex].example_sentence && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-2xl shadow-inner text-center">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 italic leading-relaxed">
                            "{srsQueue[currentSrsIndex].example_sentence.split('\n')[0]}"
                          </p>
                          {srsQueue[currentSrsIndex].example_sentence.split('\n')[1] && (
                            <p className="text-[10px] text-slate-400 mt-1">
                              {srsQueue[currentSrsIndex].example_sentence.split('\n')[1]}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-center text-slate-400 text-xs font-semibold">
                      Click để lật lại mặt trước
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating buttons */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 text-center block">
                  Bạn nhớ từ vựng này ở mức độ nào?
                </span>
                <div className="grid grid-cols-4 gap-3">
                  <Button
                    onClick={() => handleSrsReview(0)}
                    variant="outline"
                    className="flex flex-col h-20 rounded-2xl border-red-200 dark:border-red-950 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 gap-1.5 p-2 font-bold transition-all"
                  >
                    <Frown className="h-5 w-5" />
                    <span className="text-[10px]">Quên (1 ngày)</span>
                  </Button>
                  <Button
                    onClick={() => handleSrsReview(3)}
                    variant="outline"
                    className="flex flex-col h-20 rounded-2xl border-orange-200 dark:border-orange-950 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-orange-500 gap-1.5 p-2 font-bold transition-all"
                  >
                    <Meh className="h-5 w-5" />
                    <span className="text-[10px]">Khó (tăng ít)</span>
                  </Button>
                  <Button
                    onClick={() => handleSrsReview(4)}
                    variant="outline"
                    className="flex flex-col h-20 rounded-2xl border-blue-200 dark:border-blue-950 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 gap-1.5 p-2 font-bold transition-all"
                  >
                    <Smile className="h-5 w-5" />
                    <span className="text-[10px]">Vừa (tăng vừa)</span>
                  </Button>
                  <Button
                    onClick={() => handleSrsReview(5)}
                    className="bg-brand-600 hover:bg-brand-700 text-white flex flex-col h-20 rounded-2xl gap-1.5 p-2 font-bold transition-all"
                  >
                    <Smile className="h-5 w-5 text-white" />
                    <span className="text-[10px] text-white">Dễ (tăng nhiều)</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VOCABULARY JOURNAL & AI GENERATOR */}
      {activeTab === 'journal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left panel: List and filters */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-brand-600" />
                  <span>Từ vựng của bạn</span>
                </CardTitle>
                <CardDescription>
                  Tổng số: {vocabList.length} từ. Danh sách từ vựng tích lũy và học được.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Tìm từ vựng hoặc nghĩa..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 placeholder-slate-400"
                    />
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs outline-none text-slate-700 dark:text-slate-200 font-semibold focus:border-brand-500"
                    >
                      {TOPICS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs outline-none text-slate-700 dark:text-slate-200 font-semibold focus:border-brand-500"
                    >
                      {DIFFICULTIES.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Word List */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                  {filteredVocab.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Không tìm thấy từ vựng nào khớp với bộ lọc.
                    </div>
                  ) : (
                    filteredVocab.map((item) => (
                      <div
                        key={item.id}
                        className="group border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900/60 p-4 rounded-2xl flex justify-between items-start hover:border-slate-200 dark:hover:border-slate-850 hover:shadow-sm transition-all"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                              {item.word}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400">
                              {item.pronunciation}
                            </span>
                            <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full uppercase">
                              {item.part_of_speech || 'vocab'}
                            </span>
                            {item.is_mastered ? (
                              <span className="text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Thuộc lòng
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <Flame className="h-2.5 w-2.5" /> Đang học (SRS)
                              </span>
                            )}
                          </div>

                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {item.definition}
                          </p>

                          {item.example_sentence && (
                            <p className="text-[11px] text-slate-400 italic truncate group-hover:whitespace-normal group-hover:line-clamp-none line-clamp-1">
                              💡 "{item.example_sentence.split('\n')[0]}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handlePlayAudio(item.word)}
                            className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-brand-600"
                            title="Nghe phát âm"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteWord(item.id)}
                            className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/60 flex items-center justify-center text-red-500"
                            title="Xóa từ"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right panel: AI Vocabulary Generator */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm relative overflow-hidden bg-gradient-to-b from-brand-50/10 via-transparent to-transparent">
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center text-lg mb-2">
                  <Sparkles className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg font-bold">Học từ mới cùng AI</CardTitle>
                <CardDescription>
                  Yêu cầu HLV AI chọn lọc và giải nghĩa từ vựng tiếng Anh theo chủ đề bạn muốn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AI config options */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">Chọn chủ đề</label>
                    <select
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-200 focus:border-brand-500"
                    >
                      {TOPICS.filter((t) => t.id !== 'all').map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">Độ khó từ vựng</label>
                    <select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-200 focus:border-brand-500"
                    >
                      {DIFFICULTIES.filter((d) => d.id !== 'all').map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateWord}
                  disabled={isGenerating}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-5 rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-brand-500/10 transition-all hover:scale-[1.02]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>AI đang tìm từ phù hợp...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4.5 w-4.5 text-amber-400" />
                      <span>AI phát sinh từ vựng ngẫu nhiên</span>
                    </>
                  )}
                </Button>

                {/* Display generated word */}
                {generatedWord && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-brand-100 dark:border-brand-900 bg-brand-500/[0.02] rounded-3xl p-5 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-black dark:text-white flex items-center gap-2">
                          {generatedWord.word}
                        </h3>
                        <span className="text-xs font-mono text-slate-400">
                          {generatedWord.pronunciation}
                        </span>
                        <span className="text-[10px] font-bold bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-md uppercase ml-2">
                          {generatedWord.part_of_speech}
                        </span>
                      </div>
                      <button
                        onClick={() => handlePlayAudio(generatedWord.word)}
                        className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-brand-600 border border-slate-100 dark:border-slate-800"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-450 font-bold block">Nghĩa của từ:</span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {generatedWord.definition}
                      </p>
                    </div>

                    {generatedWord.examples && generatedWord.examples.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-450 font-bold block">Ví dụ:</span>
                        <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl text-[11px] leading-relaxed border border-slate-100 dark:border-slate-800">
                          <p className="font-bold text-slate-700 dark:text-slate-300">
                            - {generatedWord.examples[0]}
                          </p>
                          {generatedWord.examples[1] && (
                            <p className="text-slate-400 mt-1 italic">
                              - {generatedWord.examples[1]}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {generatedWord.memory_tip && (
                      <div className="space-y-1 bg-amber-500/5 border border-amber-500/10 p-3 rounded-2xl">
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black block">💡 Mẹo ghi nhớ:</span>
                        <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed italic">
                          {generatedWord.memory_tip}
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleSaveWord}
                      disabled={isSaved}
                      className={cn(
                        'w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2',
                        isSaved
                          ? 'bg-emerald-500 text-white cursor-default'
                          : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                      )}
                    >
                      {isSaved ? (
                        <>
                          <CheckCircle2 className="h-4.5 w-4.5" />
                          <span>Đã lưu vào sổ tay</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4.5 w-4.5" />
                          <span>Lưu vào sổ tay học tập (+10 XP)</span>
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
