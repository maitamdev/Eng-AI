'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Brand logo for mobile/tablet */}
      <div className="absolute top-6 left-6 z-20 block lg:hidden">
        <Link href="/" className="flex items-center space-x-2 text-2xl font-bold tracking-tight text-brand-600 dark:text-brand-500">
          <span className="bg-brand-600 text-white rounded-lg p-1.5 font-mono leading-none">ENG</span>
          <span>.AI</span>
        </Link>
      </div>

      {/* Form Container (Left) */}
      <div className="lg:col-span-5 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 z-10 relative shadow-xl">
        <div className="mx-auto w-full max-w-md">
          {/* Logo on Desktop */}
          <div className="hidden lg:block mb-8">
            <Link href="/" className="flex items-center space-x-2 text-2xl font-bold tracking-tight text-brand-600 dark:text-brand-500">
              <span className="bg-brand-600 text-white rounded-lg p-1.5 font-mono leading-none">ENG</span>
              <span>.AI</span>
            </Link>
          </div>
          {children}
        </div>
      </div>

      {/* Decorative / Branding (Right) */}
      <div className="hidden lg:col-span-7 lg:flex relative overflow-hidden bg-slate-900 justify-center items-center">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/20 rounded-full blur-3xl" />

        {/* Floating decorative elements */}
        <div className="relative z-10 text-center max-w-xl px-8 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="glass-morphism p-8 rounded-2xl border border-white/10 shadow-2xl relative text-left w-full"
          >
            {/* Tag / Chip */}
            <div className="inline-flex items-center space-x-2 bg-brand-500/10 text-brand-400 px-3 py-1 rounded-full text-xs font-semibold mb-6 border border-brand-500/20">
              <span className="flex h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
              <span>Next-Gen English Learning</span>
            </div>

            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Your AI-powered English Coach
            </h2>
            <p className="text-slate-300 mb-6 text-sm sm:text-base leading-relaxed">
              Experience the next generation of language learning. Practice conversation in real-world scenarios, write essays graded by AI, and master vocabulary with an intelligent Spaced Repetition System.
            </p>

            {/* Testimonial / Quote Box */}
            <div className="border-t border-slate-700/50 pt-6 mt-6 flex items-start space-x-4">
              <div className="h-10 w-10 rounded-full bg-brand-600 flex items-center justify-center font-bold text-white text-lg">
                T
              </div>
              <div>
                <p className="text-xs italic text-slate-400">
                  "ENG.AI helped me reach my target 7.5 IELTS writing score in just 2 months. The real-time corrections were game-changing."
                </p>
                <span className="text-xs font-semibold text-slate-300 block mt-1">
                  Trần Minh Hoàng — IELTS 7.5 Aspirant
                </span>
              </div>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-slate-500 text-xs mt-8"
          >
            © {new Date().getFullYear()} ENG.AI. Developed with advanced AI. All rights reserved.
          </motion.p>
        </div>
      </div>
    </div>
  );
}
