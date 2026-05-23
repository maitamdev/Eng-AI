'use client';

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Sparkles,
  Award,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Clock,
  Loader2,
  Flame,
  ArrowRight,
  Eye,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

const TOPICS = [
  { id: 'general', name: 'Giao tiếp đời sống' },
  { id: 'business', name: 'Công sở & Hội họp' },
  { id: 'travel', name: 'Du lịch & Khám phá' },
  { id: 'news', name: 'Bản tin ngắn' },
  { id: 'academic', name: 'Bài giảng học thuật' },
];

const LEVELS = [
  { id: 'easy', name: 'Dễ (Beginner)' },
  { id: 'medium', name: 'Trung bình (Intermediate)' },
  { id: 'hard', name: 'Khó (Advanced)' },
];

interface DictationData {
  sentence_with_blanks: string;
  correct_words: string[];
  full_sentence: string;
  translation: string;
}

interface QuizData {
  passage: string;
  translation: string;
  questions: Array<{
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
  }>;
}

export default function ListeningPage() {
  const supabase = createClient();
  const [activeMode, setActiveMode] = useState<'dictation' | 'quiz'>('dictation');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Filters
  const [selectedTopic, setSelectedTopic] = useState('general');
  const [selectedLevel, setSelectedLevel] = useState('medium');

  // AI Content states
  const [isGenerating, setIsGenerating] = useState(false);
  const [dictationData, setDictationData] = useState<DictationData | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);

  // Audio Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');

  // Dictation game states
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [dictationChecked, setDictationChecked] = useState(false);
  const [dictationResults, setDictationResults] = useState<boolean[]>([]);
  const [dictationXpEarned, setDictationXpEarned] = useState(false);

  // Quiz game states
  const [selectedOptions, setSelectedOptions] = useState<number[]>([-1, -1, -1]); // answers for 3 questions
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizXpEarned, setQuizXpEarned] = useState(false);

  useEffect(() => {
    async function initPage() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }

        // Initialize SpeechSynthesis Voices
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
            setAvailableVoices(englishVoices);
            if (englishVoices.length > 0) {
              // Default to first Google voice or US voice
              const preferredVoice = englishVoices.find((v) => v.name.includes('Google') || v.name.includes('US')) || englishVoices[0];
              setSelectedVoiceName(preferredVoice.name);
            }
          };

          loadVoices();
          window.speechSynthesis.onvoiceschanged = loadVoices;
        }
      } catch (err) {
        toast.error('Lỗi tải tài nguyên trang');
      } finally {
        setLoading(false);
      }
    }
    initPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Handle TTS Playback
  const handlePlayAudio = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Reset
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;

      if (selectedVoiceName) {
        const voice = availableVoices.find((v) => v.name === selectedVoiceName);
        if (voice) utterance.voice = voice;
      }

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('Trình duyệt không hỗ trợ phát âm thanh TTS');
    }
  };

  const handleStopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  // Generate Exercise from AI
  const handleGenerateExercise = async () => {
    setIsGenerating(true);
    setDictationData(null);
    setQuizData(null);
    handleStopAudio();

    // Reset game states
    setUserAnswers([]);
    setDictationChecked(false);
    setDictationResults([]);
    setDictationXpEarned(false);
    
    setSelectedOptions([-1, -1, -1]);
    setQuizSubmitted(false);
    setShowTranscript(false);
    setQuizScore(0);
    setQuizXpEarned(false);

    try {
      const res = await fetch('/api/ai/listening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeMode,
          topic: selectedTopic,
          difficulty: selectedLevel,
        }),
      });

      if (!res.ok) throw new Error('AI failed');

      const data = await res.json();
      if (activeMode === 'dictation') {
        setDictationData(data);
        setUserAnswers(new Array(data.correct_words.length).fill(''));
      } else {
        setQuizData(data);
      }
    } catch (err: any) {
      toast.error('Không thể tạo bài nghe từ AI. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Check Dictation Answers
  const handleCheckDictation = async () => {
    if (!dictationData) return;

    const results = dictationData.correct_words.map((correctWord, idx) => {
      const userAns = (userAnswers[idx] || '').trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '');
      const correctClean = correctWord.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '');
      return userAns === correctClean;
    });

    setDictationResults(results);
    setDictationChecked(true);

    const allCorrect = results.every((r) => r === true);

    if (allCorrect) {
      toast.success('Xuất sắc! Tất cả từ điền đều chính xác.');
      if (userId && !dictationXpEarned) {
        try {
          const rewardXp = 20;
          await (supabase.rpc as any)('add_xp', {
            p_user_id: userId,
            p_xp: rewardXp,
            p_skill: 'listening',
          });
          setDictationXpEarned(true);
          toast.success(`+${rewardXp} XP`);
        } catch (err) {
          console.error(err);
        }
      }
    } else {
      toast.error('Có một số ô điền chưa đúng. Hãy nghe lại nhé!');
    }
  };

  // Submit Quiz Answers
  const handleSubmitQuiz = async () => {
    if (!quizData) return;

    let score = 0;
    quizData.questions.forEach((q, idx) => {
      const selectedIndex = selectedOptions[idx];
      if (selectedIndex !== -1 && q.options[selectedIndex] === q.correct_answer) {
        score++;
      }
    });

    setQuizScore(score);
    setQuizSubmitted(true);
    setShowTranscript(true);

    if (score >= 2 && userId && !quizXpEarned) {
      try {
        const rewardXp = score === 3 ? 20 : 10;
        await (supabase.rpc as any)('add_xp', {
          p_user_id: userId,
          p_xp: rewardXp,
          p_skill: 'listening',
        });
        setQuizXpEarned(true);
        toast.success(`Đã hoàn thành! Đạt ${score}/3 điểm. +${rewardXp} XP`);
      } catch (err) {
        console.error(err);
      }
    } else if (score < 2) {
      toast.error(`Đạt ${score}/3 điểm. Hãy thử đọc Transcript và nghe lại nhé!`);
    }
  };

  // Process sentence with blanks for display
  const renderDictationSentence = () => {
    if (!dictationData) return null;
    const parts = dictationData.sentence_with_blanks.split('_____');

    return (
      <div className="text-lg font-bold leading-loose text-slate-800 dark:text-slate-200 text-center max-w-xl mx-auto px-4">
        {parts.map((part, idx) => (
          <React.Fragment key={idx}>
            <span>{part}</span>
            {idx < parts.length - 1 && (
              <input
                type="text"
                value={userAnswers[idx] || ''}
                onChange={(e) => {
                  const newAns = [...userAnswers];
                  newAns[idx] = e.target.value;
                  setUserAnswers(newAns);
                }}
                disabled={dictationChecked}
                className={cn(
                  'mx-2 px-3 py-1 border rounded-xl text-sm w-28 text-center font-bold bg-white dark:bg-slate-900 focus:border-brand-500 outline-none transition-colors shadow-inner inline-block',
                  dictationChecked
                    ? dictationResults[idx]
                      ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                      : 'border-red-500 bg-red-500/5 text-red-600 dark:text-red-400'
                    : 'border-slate-200 dark:border-slate-800'
                )}
                placeholder={`Từ #${idx + 1}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight dark:text-white">Luyện nghe thông minh</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Học nghe hiểu chủ động qua các đoạn trắc nghiệm thông tin hoặc rèn kỹ năng viết chính tả từ vựng.
        </p>
      </div>

      {/* Mode Switches */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl w-full max-w-md">
        <button
          onClick={() => {
            setActiveMode('dictation');
            setDictationData(null);
            setQuizData(null);
            handleStopAudio();
          }}
          className={cn(
            'flex-1 text-center py-2.5 rounded-xl text-sm font-extrabold transition-all duration-200 flex items-center justify-center space-x-2',
            activeMode === 'dictation'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <FileText className="h-4 w-4" />
          <span>Nghe điền từ (Dictation)</span>
        </button>
        <button
          onClick={() => {
            setActiveMode('quiz');
            setDictationData(null);
            setQuizData(null);
            handleStopAudio();
          }}
          className={cn(
            'flex-1 text-center py-2.5 rounded-xl text-sm font-extrabold transition-all duration-200 flex items-center justify-center space-x-2',
            activeMode === 'quiz'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Trắc nghiệm nghe hiểu</span>
        </button>
      </div>

      {/* Screen 1: Generator Settings Form */}
      {!dictationData && !quizData && (
        <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-600" />
              <span>Cấu hình phòng luyện nghe AI</span>
            </CardTitle>
            <CardDescription>
              AI sẽ tạo bài tập nghe hoàn chỉnh thích ứng với mục tiêu và độ khó bạn chọn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Chủ đề hội thoại</label>
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

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Độ khó bài nghe</label>
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
              onClick={handleGenerateExercise}
              disabled={isGenerating}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-5 rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-brand-500/10 transition-all hover:scale-[1.01]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>AI đang soạn thảo bài nghe...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4.5 w-4.5 text-amber-400" />
                  <span>Khởi tạo bài luyện nghe AI</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Screen 2: Practice Workspace */}
      {(dictationData || quizData) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Main exercise panel */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900">
              <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDictationData(null);
                    setQuizData(null);
                    handleStopAudio();
                  }}
                  className="text-slate-550 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl px-3 py-1 flex items-center space-x-1.5 text-xs font-bold"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  <span>Chọn bài khác</span>
                </Button>
                <span className="text-[10px] font-bold bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 px-2.5 py-0.5 rounded-full uppercase">
                  {activeMode === 'dictation' ? 'Chính tả (Dictation)' : 'Nghe hiểu (Quiz)'}
                </span>
              </CardHeader>
              <CardContent className="pt-8 flex flex-col items-center space-y-8 min-h-[300px]">
                {/* Audio controls */}
                <div className="flex flex-col items-center space-y-4 w-full">
                  <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 px-6 py-4 rounded-3xl shadow-sm">
                    {isPlaying ? (
                      <Button
                        onClick={handleStopAudio}
                        className="h-12 w-12 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow"
                      >
                        <Pause className="h-5 w-5 fill-white text-white" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handlePlayAudio(dictationData ? dictationData.full_sentence : quizData!.passage)}
                        className="h-12 w-12 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow transition-all hover:scale-105"
                      >
                        <Play className="h-5 w-5 fill-white text-white translate-x-0.5" />
                      </Button>
                    )}
                    <span className="text-xs font-bold text-slate-550 dark:text-slate-300">
                      {isPlaying ? 'Audio đang phát...' : 'Bấm để nghe đoạn văn'}
                    </span>
                  </div>

                  {/* Playback Settings (Rate + voice select) */}
                  <div className="flex flex-wrap gap-4 items-center justify-center max-w-md">
                    {/* Speed rate buttons */}
                    <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-850 p-1 rounded-xl">
                      {[0.75, 1.0, 1.25].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => {
                            setSpeechRate(rate);
                            if (isPlaying) {
                              handlePlayAudio(dictationData ? dictationData.full_sentence : quizData!.passage);
                            }
                          }}
                          className={cn(
                            'text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all',
                            speechRate === rate
                              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-700'
                          )}
                        >
                          {rate}x {rate === 0.75 ? 'Rùa' : rate === 1.0 ? 'Thường' : 'Nhanh'}
                        </button>
                      ))}
                    </div>

                    {/* Voice selector */}
                    {availableVoices.length > 0 && (
                      <select
                        value={selectedVoiceName}
                        onChange={(e) => setSelectedVoiceName(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-[10px] outline-none text-slate-700 dark:text-slate-350 font-semibold focus:border-brand-500"
                      >
                        {availableVoices.map((v) => (
                          <option key={v.name} value={v.name}>
                            🗣️ {v.name.replace('Google', '').split(' ')[0]} ({v.lang})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* GAME MODE 1: DICTATION */}
                {activeMode === 'dictation' && dictationData && (
                  <div className="space-y-8 w-full">
                    {/* Render blanks */}
                    {renderDictationSentence()}

                    {/* Actions */}
                    <div className="flex justify-center gap-3 pt-2">
                      <Button
                        onClick={handleCheckDictation}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all hover:scale-[1.01]"
                      >
                        Kiểm tra kết quả
                      </Button>
                      {dictationChecked && (
                        <Button
                          onClick={handleGenerateExercise} // triggers reset/next
                          variant="outline"
                          className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 font-bold rounded-xl"
                        >
                          Luyện câu tiếp theo
                        </Button>
                      )}
                    </div>

                    {/* Reveal full sentence and translation if checked */}
                    {dictationChecked && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-slate-100 dark:border-slate-800 bg-slate-50/30 p-5 rounded-3xl space-y-3"
                      >
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Đáp án đầy đủ:</span>
                        <p className="text-sm font-extrabold text-slate-800 dark:text-white leading-relaxed">
                          {dictationData.full_sentence}
                        </p>
                        <p className="text-xs text-slate-450 italic leading-relaxed pt-1">
                          Nghĩa: "{dictationData.translation}"
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* GAME MODE 2: QUIZ COMPREHENSION */}
                {activeMode === 'quiz' && quizData && (
                  <div className="w-full space-y-6 text-left">
                    {/* Questions checklist */}
                    <div className="space-y-6">
                      {quizData.questions.map((q, qIdx) => (
                        <div key={qIdx} className="space-y-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                            Câu hỏi {qIdx + 1}: {q.question}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, oIdx) => {
                              const isSelected = selectedOptions[qIdx] === oIdx;
                              const isCorrect = opt === q.correct_answer;

                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  disabled={quizSubmitted}
                                  onClick={() => {
                                    const newSel = [...selectedOptions];
                                    newSel[qIdx] = oIdx;
                                    setSelectedOptions(newSel);
                                  }}
                                  className={cn(
                                    'px-4 py-2.5 rounded-xl border text-left text-xs font-semibold transition-all',
                                    isSelected
                                      ? quizSubmitted
                                        ? isCorrect
                                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                          : 'bg-red-500/10 border-red-500 text-red-600'
                                        : 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-white'
                                      : quizSubmitted && isCorrect
                                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{opt}</span>
                                    {quizSubmitted && isCorrect && (
                                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Show explanation after submit */}
                          {quizSubmitted && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-[10px] text-slate-500 leading-relaxed italic bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl mt-2 border border-slate-100 dark:border-slate-800/60"
                            >
                              💡 Giải thích: {q.explanation}
                            </motion.p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center gap-3 pt-3">
                      {!quizSubmitted ? (
                        <Button
                          disabled={selectedOptions.some((o) => o === -1)}
                          onClick={handleSubmitQuiz}
                          className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all hover:scale-[1.01]"
                        >
                          Nộp bài kiểm tra
                        </Button>
                      ) : (
                        <Button
                          onClick={handleGenerateExercise}
                          className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md"
                        >
                          Luyện bài tiếp theo
                        </Button>
                      )}
                      {quizSubmitted && !showTranscript && (
                        <Button
                          variant="outline"
                          onClick={() => setShowTranscript(true)}
                          className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 font-bold rounded-xl flex items-center space-x-1.5"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Xem Transcript</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar: Transcript & Score summary */}
          <div className="lg:col-span-4 space-y-6 animate-fade-in">
            {/* Show Quiz score details if submitted */}
            {activeMode === 'quiz' && quizSubmitted && (
              <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm text-center">
                <CardHeader className="pb-2">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                    Kết quả nghe hiểu
                  </span>
                </CardHeader>
                <CardContent className="p-6 flex flex-col items-center space-y-3">
                  <div className={cn(
                    'h-16 w-16 rounded-full border-4 flex items-center justify-center font-extrabold text-lg bg-slate-50 dark:bg-slate-900',
                    quizScore === 3
                      ? 'text-emerald-500 border-emerald-500'
                      : quizScore === 2
                      ? 'text-brand-500 border-brand-500'
                      : 'text-red-500 border-red-500'
                  )}>
                    <span>{quizScore} / 3</span>
                  </div>
                  <h4 className="font-extrabold text-sm dark:text-white">
                    {quizScore === 3 ? 'Hoàn hảo!' : quizScore === 2 ? 'Khá tốt!' : 'Cần cố gắng thêm!'}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Phần thưởng: {quizScore === 3 ? '+20 XP' : quizScore === 2 ? '+10 XP' : '0 XP'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Transcript Panel */}
            {((activeMode === 'quiz' && showTranscript && quizData) || (activeMode === 'dictation' && dictationData)) && (
              <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm relative overflow-hidden bg-gradient-to-b from-brand-50/10 via-transparent to-transparent">
                <CardHeader>
                  <div className="h-10 w-10 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center text-lg mb-2">
                    <FileText className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-bold">Bản Transcript văn bản</CardTitle>
                  <CardDescription>
                    Nội dung văn bản chính xác giúp đối chiếu phần nghe.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs leading-relaxed text-slate-650 dark:text-slate-400">
                  <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 leading-relaxed font-semibold text-slate-750 dark:text-slate-200">
                    {dictationData ? dictationData.full_sentence : quizData!.passage}
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/60 rounded-2xl italic leading-relaxed">
                    " {dictationData ? dictationData.translation : quizData!.translation} "
                  </div>
                </CardContent>
              </Card>
            )}

            {/* General listening stats/tips */}
            <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Phần thưởng hoạt động
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs font-semibold text-slate-650 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Chế độ điền từ:</span>
                  <span className="text-brand-550 font-extrabold">+20 XP</span>
                </div>
                <div className="flex justify-between">
                  <span>Chế độ trắc nghiệm:</span>
                  <span className="text-brand-550 font-extrabold">+10 XP đến +20 XP</span>
                </div>
                <div className="flex justify-between">
                  <span>Tác động chỉ số:</span>
                  <span className="text-emerald-500">Listening level +</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
