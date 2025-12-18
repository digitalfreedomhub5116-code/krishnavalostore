
import React, { useState, useEffect } from 'react';
import { Shield, Zap } from 'lucide-react';

const LOADING_TEXTS = [
  "INITIALIZING VANGUARD SYSTEM...",
  "LOADING ASSETS...",
  "BYPASSING FIREWALL...",
  "SYNCING INVENTORY...",
  "ESTABLISHING SECURE CONNECTION...",
  "RENDERING SKINS...",
  "CHECKING RANK INTEGRITY...",
  "WELCOME AGENT."
];

const LoadingScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    // Progress Timer - simulates irregular loading speed
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500); // Small delay at 100% before unmounting
          return 100;
        }
        // Random increment for realistic "loading" feel
        const increment = Math.random() * 10; 
        return Math.min(prev + increment, 100);
      });
    }, 150);

    // Text Timer - Cycles through "system" messages
    const textTimer = setInterval(() => {
      setTextIndex(prev => {
          if (prev < LOADING_TEXTS.length - 1) return prev + 1;
          return prev;
      });
    }, 800);

    return () => {
      clearInterval(timer);
      clearInterval(textTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden font-sans">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        {/* Scanline Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-accent/5 to-transparent animate-scan pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center w-full max-w-md px-4">
            {/* Logo Animation */}
            <div className="relative mb-12 scale-125">
                <div className="absolute inset-0 bg-brand-accent/20 blur-3xl rounded-full animate-pulse"></div>
                <div className="relative">
                    <Shield className="w-24 h-24 text-brand-accent animate-[pulse_3s_ease-in-out_infinite]" strokeWidth={1.5} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="w-10 h-10 text-white fill-white animate-[bounce_2s_infinite]" />
                    </div>
                </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 tracking-widest glitch-text text-center" data-text="KRISHNA VALO STORE">
                KRISHNA VALO STORE
            </h1>
            <div className="text-brand-cyan font-mono text-xs tracking-[0.4em] mb-12 uppercase animate-pulse">
                System Online
            </div>

            {/* Progress Bar Container */}
            <div className="w-full h-1.5 bg-gray-900 rounded-none overflow-hidden relative mb-4 border border-white/10 skew-x-[-20deg]">
                <div 
                    className="h-full bg-brand-accent relative transition-all duration-200 ease-out shadow-[0_0_15px_#ff4655]"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute right-0 top-0 h-full w-4 bg-white/80 blur-[2px]"></div>
                </div>
            </div>

            {/* Status Text & Percentage */}
            <div className="w-full flex justify-between items-center font-mono text-xs uppercase">
                <span className="text-brand-cyan/80 min-w-[200px] flex items-center gap-2">
                    <span className="animate-pulse">_</span> 
                    {LOADING_TEXTS[textIndex]}
                </span>
                <span className="text-brand-accent font-bold text-lg">{Math.round(progress)}%</span>
            </div>
        </div>
        
        {/* Decorative HUD Corners */}
        <div className="absolute top-8 left-8 w-32 h-32 border-l-2 border-t-2 border-white/10"></div>
        <div className="absolute top-8 right-8 w-32 h-32 border-r-2 border-t-2 border-white/10"></div>
        <div className="absolute bottom-8 right-8 w-32 h-32 border-r-2 border-b-2 border-white/10"></div>
        <div className="absolute bottom-8 left-8 w-32 h-32 border-l-2 border-b-2 border-white/10"></div>
        
        {/* Version Number */}
        <div className="absolute bottom-6 right-10 text-[10px] text-slate-600 font-mono tracking-widest">
            V.2.0.4 // BUILD: STABLE
        </div>
    </div>
  );
};

export default LoadingScreen;
