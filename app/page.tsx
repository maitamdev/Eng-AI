'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  BookOpen,
  PenTool,
  Mic,
  Volume2,
  BookMarked,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const features = [
    {
      icon: MessageSquare,
      title: 'AI Conversation',
      desc: 'Luyện giao tiếp trực tiếp với AI theo 6+ kịch bản thực tế đời sống và công việc.',
      color: 'text-brand-500 bg-brand-50 dark:bg-brand-900/10',
      badge: 'Real-time',
    },
    {
      icon: BookOpen,
      title: 'Vocabulary & SRS',
      desc: 'Tự động lưu từ vựng mới và ôn tập với thuật toán Lặp lại ngắt quãng (SRS) thông minh.',
      color: 'text-accent-teal bg-teal-50 dark:bg-teal-900/10',
      badge: 'Spaced Repetition',
    },
    {
      icon: PenTool,
      title: 'AI Writing Evaluator',
      desc: 'Chấm bài viết tiếng Anh (IELTS, Email, Essay) tức thì kèm hướng dẫn sửa chi tiết.',
      color: 'text-accent-purple bg-purple-50 dark:bg-purple-900/10',
      badge: 'Instant Feedback',
    },
    {
      icon: Mic,
      title: 'Pronunciation AI',
      desc: 'Luyện nói chuẩn IPA thông qua bộ phân tích âm thanh giọng đọc bản xứ từ AI.',
      color: 'text-accent-rose bg-rose-50 dark:bg-rose-900/10',
      badge: 'Voice Analysis',
    },
    {
      icon: Volume2,
      title: 'Interactive Listening',
      desc: 'Rèn luyện khả năng nghe thông dịch với hệ thống bài tập sinh động tạo bởi AI.',
      color: 'text-accent-amber bg-amber-50 dark:bg-amber-900/10',
      badge: 'Contextual',
    },
    {
      icon: BookMarked,
      title: 'Adaptive Reading',
      desc: 'Đọc hiểu văn bản học thuật hoặc tin tức và làm bài trắc nghiệm thông minh.',
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/10',
      badge: 'Personalized',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 grid-bg opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-brand-500/10 to-transparent blur-[120px] pointer-events-none" />

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full glass-morphism border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 text-2xl font-bold tracking-tight text-brand-600 dark:text-brand-500">
          <span className="bg-brand-600 text-white rounded-lg p-1.5 font-mono leading-none">ENG</span>
          <span>.AI</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost" className="text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
              Đăng nhập
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-sm transition-all text-sm rounded-lg">
              Đăng ký miễn phí
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 lg:px-16 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 z-10">
        <div className="flex-1 text-center lg:text-left space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-brand-500/10 dark:bg-brand-400/5 text-brand-600 dark:text-brand-400 px-3 py-1 rounded-full text-xs font-semibold border border-brand-500/10"
          >
            <Zap className="h-3.5 w-3.5 animate-pulse" />
            <span>AI-Powered English Learning Environment</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight dark:text-white"
          >
            Master English with{' '}
            <span className="bg-gradient-to-r from-brand-600 to-accent-purple bg-clip-text text-transparent text-glow-brand">
              Personalized AI
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed"
          >
            ENG.AI là huấn luyện viên cá nhân hỗ trợ bạn làm chủ 6 kỹ năng tiếng Anh cốt lõi. Sửa lỗi ngữ pháp tức thì, phân tích phát âm chi tiết và tạo lộ trình bài học thông minh tối ưu riêng cho bạn.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
          >
            <Link href="/register" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-bold text-base px-8 py-6 rounded-xl shadow-lg hover:shadow-brand-500/25 transition-all flex items-center justify-center space-x-2">
                <span>Bắt đầu ngay</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-semibold text-base px-8 py-6 rounded-xl transition-all">
                Học thử miễn phí
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Floating Preview Card Component */}
        <div className="flex-1 w-full max-w-md lg:max-w-none relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="glass-morphism rounded-3xl border border-white/20 dark:border-slate-800 shadow-2xl p-6 relative overflow-hidden"
          >
            {/* Dashboard Mock Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-brand-500 to-accent-purple p-0.5 shadow-md">
                  <div className="h-full w-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center font-bold text-sm">
                    AI
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold dark:text-white">ENG.AI Coach</h4>
                  <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Online Partner
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full text-xs font-bold">
                <Award className="h-3 w-3" />
                <span>Level 5</span>
              </div>
            </div>

            {/* Simulated Chat Dialogue */}
            <div className="space-y-3 mb-4">
              <div className="bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-3 text-xs max-w-[85%] text-slate-800 dark:text-slate-300">
                Hi! Let's practice a Job Interview scenario today. Tell me about a time you faced a difficult situation at work?
              </div>
              <div className="bg-brand-600 text-white rounded-2xl p-3 text-xs max-w-[85%] ml-auto text-right">
                I was working on a project and the database goes down. I must fix it quickly under pressure.
              </div>
              {/* AI Real-time Feedback simulation */}
              <div className="bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 rounded-2xl p-3.5 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Correction Suggestion
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Grammar & Tense</span>
                </div>
                <div className="line-through text-slate-400 mb-1">
                  ...the database <span className="font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1 rounded">goes</span> down.
                </div>
                <div className="text-slate-700 dark:text-slate-300">
                  👉 Use past tense: "...the database <span className="font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-1 rounded">went</span> down." Since the story occurred in the past.
                </div>
              </div>
            </div>

            {/* Performance Stats Overlay */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/30">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-medium block">Daily Streak</span>
                <span className="text-sm font-extrabold text-brand-600 dark:text-brand-500">12 Days</span>
              </div>
              <div className="text-center border-x border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium block">XP Earned</span>
                <span className="text-sm font-extrabold text-accent-purple">1,450 XP</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-medium block">Accuracy</span>
                <span className="text-sm font-extrabold text-accent-teal">88.5%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Showcase Section */}
      <section className="bg-white dark:bg-slate-900/50 py-20 px-6 lg:px-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight dark:text-white sm:text-4xl">
              Hệ thống học tiếng Anh 6 kỹ năng toàn diện
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
              Mỗi kỹ năng được dẫn dắt bởi một mô hình AI chuyên nghiệp, tự động ghi nhận điểm yếu và sửa lỗi thời gian thực.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${feat.color}`}>
                    <feat.icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                    {feat.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold dark:text-white mb-2">{feat.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed flex-grow">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-6 lg:px-16 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight dark:text-white sm:text-4xl">
            Lộ trình học tối giản 3 bước
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
            Không cần nhồi nhét lý thuyết. ENG.AI tập trung rèn luyện phản xạ thông qua thực hành tương tác trực tiếp.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
          {/* Decorative connector lines on large screens */}
          <div className="hidden lg:block absolute top-12 left-1/6 right-1/6 h-[2px] bg-gradient-to-r from-brand-600/30 via-accent-purple/30 to-brand-600/30 z-0" />

          {[
            {
              step: '01',
              title: 'Lựa chọn kịch bản',
              desc: 'Chọn các chủ đề từ phỏng vấn xin việc, đàm phán kinh doanh đến giao tiếp tại quán cafe, nhà hàng hoặc gửi bài viết học thuật.',
            },
            {
              step: '02',
              title: 'Tương tác cùng AI',
              desc: 'AI phản hồi tức thì với độ trễ dưới 1 giây. Hỗ trợ dịch nghĩa, phát âm mẫu và định hướng gợi ý câu trả lời.',
            },
            {
              step: '03',
              title: 'Nhận bảng điểm & Sửa lỗi',
              desc: 'AI phân tích lỗi sai chi tiết, đề xuất cách viết tối ưu hơn, lưu từ vựng vào bộ thẻ flashcard và cộng điểm kinh nghiệm (XP).',
            },
          ].map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center relative z-10 space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-purple flex items-center justify-center shadow-lg font-mono text-xl font-black text-white">
                {item.step}
              </div>
              <h3 className="text-xl font-bold dark:text-white mt-2">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-xs">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Summary Section */}
      <section className="bg-brand-900 text-white py-16 px-6 lg:px-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div className="space-y-2">
            <h4 className="text-4xl font-extrabold tracking-tight">10,000+</h4>
            <p className="text-slate-300 text-sm font-medium">Học viên hoạt động</p>
          </div>
          <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-6 sm:pt-0">
            <h4 className="text-4xl font-extrabold tracking-tight">95%</h4>
            <p className="text-slate-300 text-sm font-medium">Tỷ lệ tiến bộ sau 1 tháng</p>
          </div>
          <div className="space-y-2 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0">
            <h4 className="text-4xl font-extrabold tracking-tight">6 Kỹ năng</h4>
            <p className="text-slate-300 text-sm font-medium">Tích hợp huấn luyện AI</p>
          </div>
          <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-6 sm:pt-0">
            <h4 className="text-4xl font-extrabold tracking-tight">8.0 IELTS</h4>
            <p className="text-slate-300 text-sm font-medium">Khả năng chấm điểm chuẩn xác</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 lg:px-16 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight dark:text-white sm:text-4xl">
            Nhận xét từ học viên
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
            Khám phá trải nghiệm học tiếng Anh đầy cảm hứng từ hàng ngàn học viên trên toàn quốc.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              name: 'Lê Thảo Vy',
              role: 'Sinh viên Ngoại Thương',
              target: 'IELTS Speaking 7.5',
              quote: 'Học cùng AI giúp mình tự tin nói mà không sợ bị phán xét. AI sửa phát âm từng từ rất chi tiết, phản hồi siêu nhanh.',
              avatar: 'V',
            },
            {
              name: 'Nguyễn Tiến Đạt',
              role: 'Software Engineer',
              target: 'Business English',
              quote: 'Các bài học viết email công việc hay phỏng vấn của ENG.AI rất sát thực tế. Mình tự tin hơn nhiều khi họp với đối tác nước ngoài.',
              avatar: 'Đ',
            },
            {
              name: 'Phan Mỹ Linh',
              role: 'Marketing Executive',
              target: 'General Fluency',
              quote: 'Hệ thống thẻ từ vựng lặp lại ngắt quãng (SRS) cực kỳ hiệu quả. Nhờ app mà mình nhớ từ mới sâu hơn gấp 3 lần lúc trước.',
              avatar: 'L',
            },
          ].map((testi, index) => (
            <div key={index} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-1.5 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-4.5 w-4.5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm italic leading-relaxed">
                  "{testi.quote}"
                </p>
              </div>
              <div className="flex items-center space-x-3 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm">
                  {testi.avatar}
                </div>
                <div>
                  <h5 className="text-sm font-bold dark:text-white">{testi.name}</h5>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {testi.role} • <span className="text-brand-500 font-semibold">{testi.target}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-brand-600 via-brand-700 to-accent-purple text-white py-16 px-6 lg:px-16 text-center transition-colors duration-300 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Sẵn sàng làm chủ tiếng Anh cùng ENG.AI?
          </h2>
          <p className="text-brand-100 text-base max-w-xl mx-auto leading-relaxed">
            Đăng ký tài khoản ngay hôm nay và bắt đầu hành trình học tiếng Anh đầy hứng khởi với huấn luyện viên AI.
          </p>
          <div className="pt-2">
            <Link href="/register">
              <Button className="bg-white hover:bg-slate-100 text-brand-700 font-bold text-base px-8 py-6 rounded-xl shadow-lg hover:shadow-white/10 transition-all">
                Đăng ký tài khoản miễn phí
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 py-8 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-lg font-bold tracking-tight text-brand-600 dark:text-brand-500">
            <span className="bg-brand-600 text-white rounded-md p-1 font-mono leading-none text-xs">ENG</span>
            <span>.AI</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="#" className="hover:underline">Điều khoản dịch vụ</a>
            <a href="#" className="hover:underline">Chính sách bảo mật</a>
            <a href="#" className="hover:underline">Hỗ trợ học viên</a>
          </div>
          <p className="sm:text-right">
            © {new Date().getFullYear()} ENG.AI. Developed with ❤️ by AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
