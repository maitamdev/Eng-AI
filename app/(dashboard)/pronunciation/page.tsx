'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Volume2,
  Sparkles,
  Award,
  RefreshCw,
  Play,
  Square,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Shield,
  Loader2,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

const TOPICS = [
  { id: 'general', name: 'Giao tiếp hàng ngày' },
  { id: 'business', name: 'Tiếng Anh thương mại' },
  { id: 'travel', name: 'Du lịch & Khách sạn' },
  { id: 'daily', name: 'Đời sống & Gia đình' },
  { id: 'academic', name: 'Học thuật & Trường học' },
];

const LEVELS = [
  { id: 'easy', name: 'Dễ (Beginner)' },
  { id: 'medium', name: 'Trung bình (Intermediate)' },
  { id: 'hard', name: 'Khó (Advanced)' },
];

interface PronunciationPrompt {
  sentence: string;
  translation: string;
  ipa: string;
  focus_words: string[];
  tips: string;
}

export default function PronunciationPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Selector states
  const [selectedTopic, setSelectedTopic] = useState('general');
  const [selectedLevel, setSelectedLevel] = useState('medium');

  // AI Prompt states
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<PronunciationPrompt | null>(null);

  // Speech Recognition states
  const [isListening, setIsListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [evaluation, setEvaluation] = useState<{
    diff: Array<{ word: string; isCorrect: boolean }>;
    score: number;
  } | null>(null);
  const [xpEarned, setXpEarned] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    async function initPage() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }

        // Initialize SpeechRecognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
          setRecognitionSupported(false);
        } else {
          const rec = new SpeechRecognition();
          rec.continuous = false;
          rec.interimResults = false;
          rec.lang = 'en-US';

          rec.onstart = () => {
            setIsListening(true);
            setTranscript('');
            setEvaluation(null);
          };

          rec.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
              toast.error('Vui lòng cấp quyền truy cập Microphone trong trình duyệt của bạn!');
            } else {
              toast.error(`Có lỗi xảy ra khi nhận diện giọng nói: ${event.error}`);
            }
            setIsListening(false);
          };

          rec.onend = () => {
            setIsListening(false);
          };

          rec.onresult = (event: any) => {
            const resultText = event.results[0][0].transcript;
            setTranscript(resultText);
            evaluatePronunciation(resultText);
          };

          recognitionRef.current = rec;
        }
      } catch (err) {
        toast.error('Lỗi khởi tạo trang');
      } finally {
        setLoading(false);
      }
    }
    initPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Request AI Prompt
  const handleGeneratePrompt = async () => {
    setIsGenerating(true);
    setCurrentPrompt(null);
    setEvaluation(null);
    setTranscript('');
    setXpEarned(false);

    try {
      const res = await fetch('/api/ai/pronunciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          difficulty: selectedLevel,
        }),
      });

      if (!res.ok) throw new Error('API failed');

      const data = await res.json();
      setCurrentPrompt(data);
    } catch (err: any) {
      toast.error('Không thể kết nối AI để tạo câu mẫu. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Evaluate Pronunciation
  const evaluatePronunciation = async (spokenText: string) => {
    if (!currentPrompt) return;

    const target = currentPrompt.sentence;
    // Clean strings (lowercase & strip punctuation)
    const cleanSpoken = spokenText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '');
    const spokenTokens = cleanSpoken.split(/\s+/).filter(Boolean);

    const targetTokens = target.split(/\s+/);
    let correctCount = 0;

    const diffResult = targetTokens.map((token) => {
      const cleanTargetToken = token.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '');
      const isMatched = spokenTokens.includes(cleanTargetToken);
      if (isMatched) correctCount++;
      return {
        word: token,
        isCorrect: isMatched,
      };
    });

    const accuracyScore = targetTokens.length > 0 ? Math.round((correctCount / targetTokens.length) * 100) : 0;
    
    setEvaluation({
      diff: diffResult,
      score: accuracyScore,
    });

    // Save and award XP if score >= 60%
    if (accuracyScore >= 60 && userId && !xpEarned) {
      try {
        const rewardXp = 15;
        await (supabase.rpc as any)('add_xp', {
          p_user_id: userId,
          p_xp: rewardXp,
          p_skill: 'pronunciation',
        });
        setXpEarned(true);
        toast.success(`Phát âm tuyệt vời! Bạn đạt ${accuracyScore}% chính xác. +${rewardXp} XP`);
      } catch (err: any) {
        console.error('Error adding XP:', err);
      }
    } else if (accuracyScore < 60) {
      toast.error(`Phát âm chưa đạt yêu cầu (${accuracyScore}%). Hãy thử lại nhé!`);
    }
  };

  // Start Speech Recognition
  const startRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Tính năng nhận diện giọng nói không khả dụng');
      return;
    }
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error(e);
    }
  };

  // Stop Speech Recognition
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Play Model Audio (Text-to-Speech)
  const handlePlayModelAudio = () => {
    if (!currentPrompt) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // stop current reading
      const utterance = new SpeechSynthesisUtterance(currentPrompt.sentence);
      utterance.lang = 'en-US';
      utterance.rate = selectedLevel === 'easy' ? 0.75 : 0.9; // read slower for beginners
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('Trình duyệt không hỗ trợ phát âm thanh');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-10 w-10 text-brand-600 animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Đang chuẩn bị micro...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight dark:text-white">Luyện phát âm AI</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Huấn luyện viên AI phân tích chính xác từng từ bạn nói và hướng dẫn sửa lỗi phát âm trực quan.
        </p>
      </div>

      {!recognitionSupported && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center space-x-3 text-xs leading-normal">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>
            Trình duyệt của bạn không hỗ trợ tính năng Nhận diện giọng nói Web Speech API (Khuyên dùng: Google Chrome, Microsoft Edge hoặc Safari).
          </span>
        </div>
      )}

      {/* Screen 1: Generator form */}
      {!currentPrompt && (
        <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-600" />
              <span>Cấu hình luyện đọc cùng AI</span>
            </CardTitle>
            <CardDescription>
              AI sẽ tạo câu hoặc đoạn văn luyện phát âm theo chủ đề và trình độ của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Trình độ & Độ dài</label>
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
              onClick={handleGeneratePrompt}
              disabled={isGenerating || !recognitionSupported}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-5 rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-brand-500/10 transition-all hover:scale-[1.01]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>AI đang thiết lập bài phát âm...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4.5 w-4.5 text-amber-400" />
                  <span>Khởi tạo bài luyện đọc cùng AI</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Screen 2: Pronunciation Practice workspace */}
      {currentPrompt && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Main workspace */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm relative overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentPrompt(null)}
                  className="text-slate-550 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl px-3 py-1 flex items-center space-x-1.5 text-xs font-bold"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  <span>Chọn chủ đề khác</span>
                </Button>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-0.5 rounded-full uppercase">
                    {TOPICS.find((t) => t.id === selectedTopic)?.name}
                  </span>
                  <span className="text-[10px] font-bold bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 px-2.5 py-0.5 rounded-full uppercase">
                    {LEVELS.find((l) => l.id === selectedLevel)?.name}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-8 flex flex-col items-center space-y-8 min-h-[300px]">
                {/* Visual Target sentence with matched words highlight */}
                <div className="text-center space-y-3 px-4 max-w-xl">
                  {evaluation ? (
                    <div className="flex flex-wrap justify-center gap-x-2 gap-y-2 text-2xl font-bold leading-relaxed">
                      {evaluation.diff.map((token, idx) => (
                        <span
                          key={idx}
                          className={cn(
                            'transition-colors duration-200',
                            token.isCorrect
                              ? 'text-emerald-500 border-b-2 border-emerald-500/20'
                              : 'text-red-500 border-b-2 border-red-500/20'
                          )}
                        >
                          {token.word}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 leading-relaxed">
                      {currentPrompt.sentence}
                    </h2>
                  )}

                  {/* IPA Translation */}
                  <p className="text-slate-400 dark:text-slate-500 font-mono text-sm tracking-wider">
                    {currentPrompt.ipa}
                  </p>

                  {/* Vietnamese translation */}
                  <p className="text-xs text-slate-500 leading-normal italic pt-1">
                    Nghĩa: "{currentPrompt.translation}"
                  </p>
                </div>

                {/* Accuracy score circular gauge after evaluation */}
                {evaluation && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center space-y-2"
                  >
                    <div className={cn(
                      'h-20 w-20 rounded-full border-4 flex flex-col items-center justify-center font-extrabold text-lg bg-slate-50 dark:bg-slate-900',
                      evaluation.score >= 80
                        ? 'text-emerald-500 border-emerald-500'
                        : evaluation.score >= 60
                        ? 'text-brand-500 border-brand-500'
                        : 'text-red-500 border-red-500'
                    )}>
                      <span>{evaluation.score}%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Độ chính xác</span>
                  </motion.div>
                )}

                {/* Recording / Playing Area */}
                <div className="flex items-center justify-center gap-6 pt-4 w-full">
                  {/* Play audio button */}
                  <Button
                    onClick={handlePlayModelAudio}
                    variant="outline"
                    className="h-12 w-12 rounded-full border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-center text-slate-650 hover:text-brand-650 shadow-sm shrink-0"
                    title="Nghe phát âm mẫu"
                  >
                    <Volume2 className="h-5 w-5" />
                  </Button>

                  {/* Record button */}
                  {isListening ? (
                    <Button
                      onClick={stopRecording}
                      className="h-20 w-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/20 relative animate-pulse shrink-0"
                      title="Dừng ghi âm"
                    >
                      <Square className="h-7 w-7 text-white fill-white" />
                      <span className="absolute -bottom-6 text-[10px] text-red-500 font-extrabold uppercase animate-pulse">
                        Dừng nói
                      </span>
                    </Button>
                  ) : (
                    <Button
                      onClick={startRecording}
                      disabled={!recognitionSupported}
                      className="h-20 w-20 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-500/25 relative transition-transform hover:scale-105 shrink-0"
                      title="Bắt đầu ghi âm"
                    >
                      <Mic className="h-8 w-8 text-white" />
                      <span className="absolute -bottom-6 text-[10px] text-slate-400 font-bold uppercase">
                        Nhấn để đọc
                      </span>
                    </Button>
                  )}

                  {/* Skip/next prompt button */}
                  <Button
                    onClick={handleGeneratePrompt}
                    disabled={isGenerating}
                    variant="outline"
                    className="h-12 w-12 rounded-full border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-center text-slate-650 hover:text-brand-650 shadow-sm shrink-0"
                    title="Đổi câu mẫu khác"
                  >
                    <RefreshCw className={cn('h-5 w-5', isGenerating && 'animate-spin')} />
                  </Button>
                </div>

                {/* Display Spoken Transcript text block */}
                {transcript && (
                  <div className="w-full max-w-md bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Bạn đã đọc:</span>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      "{transcript}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Tips & Challenges */}
          <div className="lg:col-span-4 space-y-6">
            {/* Pronunciation tips card */}
            <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm relative overflow-hidden bg-gradient-to-b from-brand-50/10 via-transparent to-transparent">
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center text-lg mb-2">
                  <Sparkles className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-bold">Mẹo đọc từ AI Coach</CardTitle>
                <CardDescription>
                  Hướng dẫn chi tiết giúp bạn nuốt âm, nối âm hoặc nhấn trọng âm chuẩn xác.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs leading-relaxed text-slate-650 dark:text-slate-400">
                <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 leading-relaxed">
                  {currentPrompt.tips}
                </div>

                {/* Challenging words focus list */}
                {currentPrompt.focus_words && currentPrompt.focus_words.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Các từ cần lưu ý</span>
                    <div className="flex flex-wrap gap-2">
                      {currentPrompt.focus_words.map((word, idx) => (
                        <span
                          key={idx}
                          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-xl font-extrabold text-[11px] border border-amber-500/10 transition-colors"
                        >
                          🔥 {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievement rewards statistics */}
            <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Phần thưởng hoạt động
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Yêu cầu chính xác:</span>
                  <span className="text-slate-800 dark:text-white">&gt; 60%</span>
                </div>
                <div className="flex justify-between">
                  <span>Điểm kinh nghiệm:</span>
                  <span className="text-brand-600 font-extrabold">+15 XP</span>
                </div>
                <div className="flex justify-between">
                  <span>Tác động chỉ số:</span>
                  <span className="text-emerald-500">Pronunciation accuracy +</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
