'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Send,
  Sparkles,
  Trophy,
  ArrowLeft,
  BookOpen,
  CornerDownLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  corrections?: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
}

const SCENARIOS = [
  {
    id: 'job_interview',
    title: 'Phỏng vấn xin việc',
    desc: 'Luyện trả lời phỏng vấn với nhà tuyển dụng nước ngoài.',
    icon: '💼',
    prompt: 'Job Interview for a Senior Developer position',
  },
  {
    id: 'restaurant',
    title: 'Gọi món tại nhà hàng',
    desc: 'Đặt bàn, gọi món và đối thoại cùng phục vụ bàn tiếng Anh.',
    icon: '🍽️',
    prompt: 'Ordering dinner in a premium English restaurant',
  },
  {
    id: 'travel',
    title: 'Thủ tục sân bay & Khách sạn',
    desc: 'Hỏi đường, check-in hành lý và giải quyết sự cố phát sinh.',
    icon: '✈️',
    prompt: 'Airport check-in counter and hotel receptionist exchange',
  },
  {
    id: 'shopping',
    title: 'Mua sắm & Trả hàng',
    desc: 'Đàm phán giá cả, hỏi size quần áo và yêu cầu hoàn tiền.',
    icon: '🛍️',
    prompt: 'Shopping in a fashion store and requesting a refund',
  },
  {
    id: 'medical',
    title: 'Khám bệnh & Hiệu thuốc',
    desc: 'Mô tả triệu chứng sức khỏe và mua thuốc theo toa bác sĩ.',
    icon: '🏥',
    prompt: 'Describing illness symptoms to a doctor at a clinic',
  },
  {
    id: 'daily',
    title: 'Trò chuyện tự do',
    desc: 'Tán gẫu về sở thích, thời tiết, phim ảnh và đời sống.',
    icon: '💬',
    prompt: 'Casual chat about weekend plans, hobbies and food',
  },
];

const LEVELS = [
  { id: 'beginner', name: 'Cơ bản (Beginner)' },
  { id: 'intermediate', name: 'Trung cấp (Intermediate)' },
  { id: 'advanced', name: 'Nâng cao (Advanced)' },
];

export default function ConversationPage() {
  const [selectedScenario, setSelectedScenario] = useState<typeof SCENARIOS[0] | null>(null);
  const [selectedLevel, setSelectedLevel] = useState('intermediate');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [allCorrections, setAllCorrections] = useState<any[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Initiate conversation when scenario is selected
  const handleStartConversation = async (scenario: typeof SCENARIOS[0]) => {
    setSelectedScenario(scenario);
    setMessages([]);
    setSessionFinished(false);
    setAllCorrections([]);
    setIsStreaming(true);

    try {
      const initialMsgs = [
        {
          role: 'user' as const,
          content: `Hi AI, let's start the conversation for "${scenario.title}" scenario. You go first and speak as the scenario character.`,
        },
      ];

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: initialMsgs,
          scenario: scenario.prompt,
          level: selectedLevel,
        }),
      });

      if (!res.ok) throw new Error('API request failed');

      // Setup reader for streaming text
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';

      const newMsgId = Math.random().toString();
      setMessages([
        {
          id: newMsgId,
          role: 'assistant',
          content: '',
        },
      ]);

      while (true) {
        const { value, done } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantResponse += chunk;

        // Process message content to filter out correction blocks
        const cleanedContent = cleanMessageContent(assistantResponse);

        setMessages((prev: Message[]) =>
          prev.map((msg: Message) => (msg.id === newMsgId ? { ...msg, content: cleanedContent } : msg))
        );
      }

      // Parse corrections if any
      const corrections = parseCorrections(assistantResponse);
      if (corrections && corrections.length > 0) {
        setMessages((prev: Message[]) =>
          prev.map((msg: Message) => (msg.id === newMsgId ? { ...msg, corrections } : msg))
        );
        setAllCorrections((prev: any[]) => [...prev, ...corrections]);
      }
    } catch (err) {
      toast.error('Không thể kết nối đến huấn luyện viên AI');
      setSelectedScenario(null);
    } finally {
      setIsStreaming(false);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;

    const userMessageContent = inputValue;
    setInputValue('');

    const userMsg: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: userMessageContent,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsStreaming(true);

    try {
      // Map message lists to only contains role and raw content (omitting parsed corrections)
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          scenario: selectedScenario?.prompt,
          level: selectedLevel,
        }),
      });

      if (!res.ok) throw new Error('API request failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';

      const newMsgId = Math.random().toString();
      setMessages((prev: Message[]) => [
        ...prev,
        {
          id: newMsgId,
          role: 'assistant',
          content: '',
        },
      ]);

      while (true) {
        const { value, done } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantResponse += chunk;

        const cleanedContent = cleanMessageContent(assistantResponse);

        setMessages((prev: Message[]) =>
          prev.map((msg: Message) => (msg.id === newMsgId ? { ...msg, content: cleanedContent } : msg))
        );
      }

      const corrections = parseCorrections(assistantResponse);
      if (corrections && corrections.length > 0) {
        setMessages((prev: Message[]) =>
          prev.map((msg: Message) => (msg.id === newMsgId ? { ...msg, corrections } : msg))
        );
        setAllCorrections((prev: any[]) => [...prev, ...corrections]);
      }
    } catch (err) {
      toast.error('Không thể truyền tải tin nhắn');
    } finally {
      setIsStreaming(false);
    }
  };

  // Helper parser for custom blocks
  const cleanMessageContent = (text: string) => {
    const blockIndex = text.indexOf('||CORRECTIONS||');
    if (blockIndex !== -1) {
      return text.substring(0, blockIndex).trim();
    }
    return text;
  };

  const parseCorrections = (text: string) => {
    const blockStart = text.indexOf('||CORRECTIONS||');
    const blockEnd = text.indexOf('||END_CORRECTIONS||');
    if (blockStart !== -1 && blockEnd !== -1) {
      try {
        const jsonStr = text.substring(blockStart + 15, blockEnd).trim();
        const data = JSON.parse(jsonStr);
        return data.corrections || [];
      } catch (err) {
        console.error('Failed to parse response correction JSON', err);
      }
    }
    return [];
  };

  const handleFinishSession = () => {
    setSessionFinished(true);
    toast.success('Đã hoàn thành hội thoại! Đang tổng hợp phản hồi...');
  };

  return (
    <div className="space-y-6">
      {/* Back button or top header */}
      <div className="flex items-center justify-between pb-2">
        {selectedScenario ? (
          <Button
            variant="ghost"
            onClick={() => setSelectedScenario(null)}
            className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-3 py-1 flex items-center space-x-2 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Đổi kịch bản</span>
          </Button>
        ) : (
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight dark:text-white">Luyện hội thoại AI</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Phát triển phản xạ nói tự nhiên qua các tình huống giả lập đời sống thực tế
            </p>
          </div>
        )}
      </div>

      {/* Screen 1: Scenario Selector */}
      {!selectedScenario && (
        <div className="space-y-6 animate-fade-in">
          {/* Level Config */}
          <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm max-w-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-extrabold text-slate-400 uppercase tracking-wider block">
                Cấu hình độ khó
              </CardTitle>
              <CardDescription>
                AI sẽ điều chỉnh độ dài câu thoại phù hợp với trình độ của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              {LEVELS.map((lvl) => (
                <Button
                  key={lvl.id}
                  variant={selectedLevel === lvl.id ? 'default' : 'outline'}
                  onClick={() => setSelectedLevel(lvl.id)}
                  className={cn(
                    'flex-1 font-semibold rounded-xl py-5',
                    selectedLevel === lvl.id
                      ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  )}
                >
                  {lvl.name}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SCENARIOS.map((scen) => (
              <Card
                key={scen.id}
                className="border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
              >
                <CardHeader className="pb-2">
                  <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                    {scen.icon}
                  </div>
                  <CardTitle className="text-lg font-bold group-hover:text-brand-600 transition-colors">
                    {scen.title}
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    {scen.desc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 mt-auto">
                  <Button
                    onClick={() => handleStartConversation(scen)}
                    className="w-full bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-400 font-bold py-2.5 rounded-xl border border-brand-100/50 dark:border-brand-900/30 transition-colors"
                  >
                    Bắt đầu hội thoại
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Screen 2: Workspace */}
      {selectedScenario && !sessionFinished && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Chat main viewport */}
          <div className="lg:col-span-8 flex flex-col h-[600px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            {/* Header info */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center space-x-3">
                <span className="text-xl">{selectedScenario.icon}</span>
                <div>
                  <h4 className="text-sm font-bold dark:text-white">{selectedScenario.title}</h4>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    Level: {selectedLevel}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleFinishSession}
                className="text-xs font-bold border-red-200 dark:border-red-950 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500"
              >
                Kết thúc hội thoại
              </Button>
            </div>

            {/* Message Viewport */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
              {messages.length === 0 && isStreaming && (
                <div className="flex justify-center items-center h-full">
                  <div className="flex flex-col items-center space-y-2">
                    <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
                    <span className="text-xs font-medium text-slate-400">AI đang chuẩn bị vai diễn...</span>
                  </div>
                </div>
              )}
              {messages.map((msg: Message, index: number) => (
                <div
                  key={msg.id || index}
                  className={cn(
                    'flex flex-col max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm',
                    msg.role === 'user'
                      ? 'ml-auto bg-brand-600 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 rounded-bl-none'
                  )}
                >
                  {/* Message body */}
                  <p>{msg.content}</p>

                  {/* Corrections displaying under assistant messages */}
                  {msg.corrections && msg.corrections.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> AI Correction Box
                      </span>
                      {msg.corrections.map((corr: any, idx: number) => (
                        <div key={idx} className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-2.5 space-y-1">
                          <p className="line-through text-[11px] text-slate-400">
                            {corr.original}
                          </p>
                          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-500">
                            👉 {corr.corrected}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 italic">
                            💡 {corr.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl p-4 text-xs font-semibold max-w-[15%] rounded-bl-none">
                  <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" />
                  <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex gap-3">
              <input
                type="text"
                placeholder="Trả lời bằng tiếng Anh..."
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                disabled={isStreaming}
                className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 transition-colors"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim() || isStreaming}
                className="h-11 w-11 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white shrink-0 shadow-md shadow-brand-500/10 flex items-center justify-center transition-all hover:scale-105"
              >
                <Send className="h-4.5 w-4.5" />
              </Button>
            </form>
          </div>

          {/* Right sidebar: quick hints/vocabulary */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-extrabold text-slate-400 uppercase tracking-wider block">
                  Bản dịch nhanh
                </CardTitle>
                <CardDescription>
                  Dịch các câu thoại của nhân vật sang tiếng Việt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                  *Lời khuyên: Cố gắng tự dịch và đoán nghĩa theo ngữ cảnh trước khi sử dụng hỗ trợ dịch thuật.
                </p>
                <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/30 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {messages.length > 0 && messages[messages.length - 1].role === 'assistant' ? (
                    messages[messages.length - 1].content
                  ) : (
                    'Chưa có hội thoại nào được bắt đầu.'
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-extrabold text-slate-400 uppercase tracking-wider block">
                  Thống kê buổi học
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Số câu thoại:</span>
                  <span className="dark:text-white">{messages.filter((m: Message) => m.role === 'user').length} câu</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Lỗi sai ghi nhận:</span>
                  <span className="text-amber-500">{allCorrections.length} lỗi</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Phần thưởng XP:</span>
                  <span className="text-brand-500 font-extrabold">+30 XP</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Screen 3: Feedback panel */}
      {selectedScenario && sessionFinished && (
        <Card className="border border-slate-100 dark:border-slate-800/80 shadow-sm max-w-3xl mx-auto animate-fade-in">
          <CardHeader className="pb-6 border-b border-slate-100 dark:border-slate-800/80 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-3xl mx-auto mb-4 border border-emerald-500/20">
              ✓
            </div>
            <CardTitle className="text-2xl font-extrabold">Hội thoại hoàn thành!</CardTitle>
            <CardDescription>
              Xem nhận xét chi tiết và tổng hợp lỗi sai từ huấn luyện viên AI
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Rewards metric box */}
            <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/30 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Số câu thoại</span>
                <span className="text-lg font-extrabold dark:text-white">{messages.filter((m: Message) => m.role === 'user').length}</span>
              </div>
              <div className="border-x border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">XP tích lũy</span>
                <span className="text-lg font-extrabold text-brand-600 dark:text-brand-500">+30 XP</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Lỗi ghi nhận</span>
                <span className="text-lg font-extrabold text-amber-500">{allCorrections.length}</span>
              </div>
            </div>

            {/* General AI comments */}
            <div className="space-y-2">
              <h4 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">Nhận xét từ AI</h4>
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/30 leading-relaxed text-sm text-slate-700 dark:text-slate-300">
                Chúc mừng bạn đã hoàn thành bài hội thoại tình huống! Bạn đã nắm vững ý chính và sử dụng tốt từ vựng căn bản. Hãy lưu ý sửa lại các lỗi chia động từ ở các câu đã được sửa lỗi chi tiết bên dưới.
              </div>
            </div>

            {/* Corrections checklist */}
            {allCorrections.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">Danh sách lỗi sai & Hướng dẫn sửa</h4>
                <div className="space-y-3">
                  {allCorrections.map((corr: any, idx: number) => (
                    <div key={idx} className="border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-xs font-bold text-slate-500">Lỗi thứ {idx + 1}</span>
                      </div>
                      <p className="line-through text-xs text-red-500 font-medium">
                        {corr.original}
                      </p>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500">
                        👉 {corr.corrected}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
                        {corr.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allCorrections.length === 0 && (
              <div className="flex flex-col items-center justify-center p-6 border border-slate-100 dark:border-slate-800 rounded-2xl text-center space-y-2">
                <span className="text-3xl">🎉</span>
                <h5 className="text-sm font-bold dark:text-white">Không ghi nhận lỗi sai nào!</h5>
                <p className="text-xs text-slate-400">Bạn đã đối thoại xuất sắc với ngữ pháp và từ vựng cực kỳ chuẩn xác.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-6 border-t border-slate-100 dark:border-slate-800/80 flex gap-4">
            <Button
              onClick={() => setSelectedScenario(null)}
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-5 rounded-xl transition-all"
            >
              Chọn kịch bản khác
            </Button>
            <Link href="/dashboard" className="flex-1">
              <Button
                variant="outline"
                className="w-full border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-semibold py-5 rounded-xl transition-all"
              >
                Về trang chủ
              </Button>
            </Link>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
