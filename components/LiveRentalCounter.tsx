import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Flame, ShieldCheck, TrendingUp } from 'lucide-react';

interface LiveRentalCounterProps {
  variant?: 'badge' | 'card' | 'inline' | 'hero';
  className?: string;
}

export const LiveRentalCounter: React.FC<LiveRentalCounterProps> = ({ variant = 'badge', className = '' }) => {
  const [targetCount, setTargetCount] = useState<number>(570);
  const [displayCount, setDisplayCount] = useState<number>(550);

  useEffect(() => {
    let isMounted = true;

    const fetchCount = async () => {
      try {
        const count = await StorageService.getSuccessfulRentalsCount();
        if (isMounted) {
          setTargetCount(count);
        }
      } catch {
        if (isMounted) setTargetCount(570);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 25000); // Live poll for automatic increase
    const unsubscribe = StorageService.subscribe(fetchCount);

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  // Smooth count-up animation on load or update
  useEffect(() => {
    let start = Math.max(500, targetCount - 35);
    const duration = 1200; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (targetCount - start) * easeOut);
      setDisplayCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayCount(targetCount);
      }
    };

    requestAnimationFrame(animate);
  }, [targetCount]);

  if (variant === 'hero') {
    return (
      <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-emerald-500/30 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.2)] animate-in fade-in duration-500 ${className}`}>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
        </div>
        <div className="text-xs sm:text-sm font-bold font-mono text-white flex items-center gap-1.5 flex-wrap">
          <span>Completed</span>
          <span className="text-emerald-400 font-extrabold text-sm sm:text-base tracking-tight font-display">{displayCount}+</span>
          <span className="text-slate-300">successful rentals</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase tracking-wider font-bold">and increasing</span>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`glass-panel p-6 md:p-8 rounded-2xl border border-emerald-500/20 bg-brand-surface/60 flex flex-col items-center text-center relative overflow-hidden group hover:border-emerald-500/40 transition-all ${className}`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative mb-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <TrendingUp size={24} />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        <div className="text-3xl md:text-5xl font-display font-black text-white tracking-tight flex items-center justify-center gap-1 mb-1">
          <span className="text-emerald-400 font-mono">{displayCount}+</span>
        </div>
        <div className="font-bold text-xs uppercase tracking-wider text-slate-200 mb-1">
          Successful Rentals Completed
        </div>
        <div className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-widest flex items-center gap-1">
          <ShieldCheck size={11} /> 100% Ban-Free // Live Count
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 ${className}`}>
        <Flame size={13} className="text-amber-400 fill-amber-400 animate-pulse" />
        <span>Completed <strong className="text-white font-display text-sm">{displayCount}+</strong> successful rentals & increasing</span>
      </span>
    );
  }

  // Default 'badge' variant
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-mono ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span>Completed <strong className="text-emerald-400 font-bold">{displayCount}+</strong> successful rentals & increasing</span>
    </div>
  );
};

export default LiveRentalCounter;
