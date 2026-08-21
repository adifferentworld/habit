import React, { useState, useEffect } from 'react';
import { Flame, CheckCircle2, Target, Award, Sparkles, BookOpen, Quote } from 'lucide-react';
import { useTracker } from '../context/TrackerContext';

const NEET_QUOTES = [
  "“Every MCQ solved today brings you one step closer to that white coat & stethoscope.” 🩺✨",
  "“NCERT is your holy grail. Read between the lines, conquer every diagram.” 🧬📖",
  "“Physics numericals get simpler with consistent daily formula practice.” ⚡🔬",
  "“Organic chemistry name reactions will be on your fingertips soon!” 🧪🌸",
  "“Consistency beats intensity. Protect your study streak, future doctor.” 🍵💖",
];

export const StatsBanner: React.FC = () => {
  const { todayCompletionStats, overallStats } = useTracker();
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % NEET_QUOTES.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const progressPercentage = todayCompletionStats.percentage;

  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
      {/* Study Momentum Main Card */}
      <div className="md:col-span-8 p-5 md:p-6 rounded-3xl glass-panel flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Study Momentum
            </h3>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              {todayCompletionStats.completedItems}/{todayCompletionStats.totalItems} Goals Done
            </span>
          </div>

          <div className="flex justify-between items-baseline mb-2">
            <div className="text-4xl font-black text-slate-800 dark:text-slate-100 leading-none">
              {progressPercentage}
              <span className="text-xl font-bold text-pink-500">%</span>
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {progressPercentage === 100
                ? '🎉 Complete Mastery Today!'
                : `${todayCompletionStats.totalItems - todayCompletionStats.completedItems} pending targets`}
            </div>
          </div>

          {/* Sleek Gradient Progress Bar */}
          <div className="w-full h-2.5 bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden my-3">
            <div
              className="h-full bg-gradient-to-r from-pink-400 via-rose-400 to-indigo-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.max(5, progressPercentage)}%` }}
            />
          </div>
        </div>

        {/* 2-Column Mini Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
          <div className="bg-pink-50/80 dark:bg-pink-950/40 border border-pink-100/80 dark:border-pink-900/40 rounded-2xl p-3 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-pink-500 font-bold uppercase tracking-wider">Streak</span>
              <Flame className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="text-lg md:text-xl font-bold text-pink-700 dark:text-pink-300 mt-0.5">
              {overallStats.bestOverallStreak} Days
            </div>
          </div>

          <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100/80 dark:border-indigo-900/40 rounded-2xl p-3 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Total Checked</span>
              <Award className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-lg md:text-xl font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">
              {overallStats.totalCompletionsAllTime} Logs
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100/80 dark:border-emerald-900/40 rounded-2xl p-3 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Status</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-lg md:text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
              {progressPercentage >= 80 ? 'Optimal' : progressPercentage >= 40 ? 'On Track' : 'Starting'}
            </div>
          </div>
        </div>
      </div>

      {/* Motivation Hub Card (Sleek Gradient) */}
      <div className="md:col-span-4 p-5 md:p-6 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-pink-500 text-white shadow-xl shadow-pink-200/40 dark:shadow-indigo-950/50 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold opacity-85 uppercase tracking-widest">
              Motivation Hub
            </p>
            <Sparkles className="w-4 h-4 text-pink-200 animate-pulse" />
          </div>
          <p className="text-xs md:text-sm italic font-medium leading-relaxed mt-2 opacity-95">
            {NEET_QUOTES[quoteIndex]}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[10px] opacity-80 font-bold uppercase tracking-wider">
          <span>NEET 2027 Aspirant</span>
          <span>Target 720/720 🎯</span>
        </div>
      </div>
    </section>
  );
};
