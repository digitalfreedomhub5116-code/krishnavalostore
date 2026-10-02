import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Account } from '../types';
import { Trophy, Eye, Gamepad2, ShieldCheck, Flame } from 'lucide-react';

interface AccountCardProps {
  account: Account;
}

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
  const [isEffectivelyAvailable, setIsEffectivelyAvailable] = useState(!account.isBooked);

  useEffect(() => {
    if (!account.isBooked || !account.bookedUntil) {
      setIsEffectivelyAvailable(true);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(account.bookedUntil!).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setIsEffectivelyAvailable(true);
      } else {
        setIsEffectivelyAvailable(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [account.isBooked, account.bookedUntil]);

  const getRankColor = (rank: string) => {
    if (rank.includes('Gold')) return 'text-yellow-400';
    if (rank.includes('Platinum')) return 'text-cyan-400';
    if (rank.includes('Diamond')) return 'text-purple-400';
    if (rank.includes('Ascendant')) return 'text-emerald-400';
    if (rank.includes('Immortal')) return 'text-red-500';
    return 'text-slate-300';
  };

  return (
    <div className={`group relative rounded-none overflow-hidden border transition-all duration-300 ${
      account.isTrending 
        ? 'border-amber-500/50 bg-brand-surface shadow-[0_0_25px_rgba(245,158,11,0.12)] hover:border-amber-400 hover:shadow-[0_0_35px_rgba(245,158,11,0.25)] hover:-translate-y-2'
        : isEffectivelyAvailable 
          ? 'border-white/10 bg-brand-surface hover:border-brand-accent/50 hover:shadow-[0_0_30px_rgba(255,70,85,0.15)] hover:-translate-y-2' 
          : 'border-white/5 bg-brand-dark opacity-90'
    }`}>
      
      <Link to={`/account/${account.id}`} className="block h-full">
        {/* Corner Accents (Cyberpunk Style) */}
        <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t transition-colors z-20 ${account.isTrending ? 'border-amber-400' : 'border-white/20 group-hover:border-brand-accent'}`}></div>
        <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t transition-colors z-20 ${account.isTrending ? 'border-amber-400' : 'border-white/20 group-hover:border-brand-accent'}`}></div>
        <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b transition-colors z-20 ${account.isTrending ? 'border-amber-400' : 'border-white/20 group-hover:border-brand-accent'}`}></div>
        <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b transition-colors z-20 ${account.isTrending ? 'border-amber-400' : 'border-white/20 group-hover:border-brand-accent'}`}></div>

        {/* Image Overlay */}
        <div className="relative h-48 w-full overflow-hidden">
          <div className="absolute inset-0 bg-brand-accent/0 group-hover:bg-brand-accent/10 transition-colors z-10 mix-blend-overlay"></div>
          <img 
            src={account.imageUrl} 
            alt={account.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-transparent to-transparent opacity-90" />
          
          {/* Trending Tag Badge (Centered Top) */}
          {account.isTrending && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-black font-black text-[10px] uppercase px-3 py-1 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.7)] animate-pulse tracking-widest border border-amber-300">
              <Flame className="w-3.5 h-3.5 fill-black text-black" />
              <span>TRENDING</span>
            </div>
          )}

          {/* Rank Badge - Top Left Corner */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 border-l-2 border-brand-accent">
            <Trophy className={`w-3.5 h-3.5 ${getRankColor(account.rank)}`} />
            <span className={`text-[11px] font-bold tracking-wider font-display uppercase ${getRankColor(account.rank)}`}>{account.rank}</span>
          </div>

          {/* 10-Min Guarantee Micro-Badge - Top Right Corner */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-emerald-400">10m Covered</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-xl font-display font-bold text-white mb-4 truncate group-hover:text-brand-accent transition-colors">{account.name}</h3>
          
          {/* Pricing Grid */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="bg-brand-dark/50 p-2 border border-white/5 text-center flex flex-col justify-center transition-colors">
              <div className="text-[10px] text-slate-500 uppercase">1 Hour</div>
              <div className="text-sm font-bold text-white">₹{account.pricing.hours1 || 80}</div>
            </div>
            <div className="bg-brand-dark/50 p-2 border border-white/5 text-center flex flex-col justify-center transition-colors">
              <div className="text-[10px] text-slate-500 uppercase">3 Hours</div>
              <div className="text-sm font-bold text-white">₹{account.pricing.hours3}</div>
            </div>
            <div className="bg-brand-dark/50 p-2 border border-white/5 text-center flex flex-col justify-center transition-colors">
              <div className="text-[10px] text-slate-500 uppercase">12 Hours</div>
              <div className="text-sm font-bold text-white">₹{account.pricing.hours12}</div>
            </div>
            <div className="bg-brand-dark/50 p-2 border border-white/5 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-brand-accent text-white text-[8px] px-1 font-bold">
                -10%
              </div>
              <div className="text-[10px] text-slate-500 uppercase mt-1">24 H</div>
              <div className="text-sm font-bold text-brand-accent leading-tight">
                 ₹{Math.floor(account.pricing.hours24 * 0.9)}
              </div>
            </div>
          </div>

          {/* Guarantee Subtext */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-400/90 font-mono mb-4">
            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>10-Minute Replacement Guaranteed</span>
          </div>

          {/* Action Button */}
          <div
            className={`w-full py-3 px-4 font-bold uppercase tracking-wider text-sm transition-all duration-200 flex items-center justify-center gap-2 skew-x-[-10deg]
              ${isEffectivelyAvailable 
                ? 'bg-white text-brand-darker group-hover:bg-brand-accent group-hover:text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_25px_rgba(255,70,85,0.4)]' 
                : 'bg-slate-800 text-slate-400 border border-white/5 hover:bg-slate-700'}`}
          >
            <div className="skew-x-[10deg] flex items-center gap-2">
              {isEffectivelyAvailable ? <Gamepad2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />} 
              {isEffectivelyAvailable ? 'RENT NOW!' : 'Check Slot'}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default AccountCard;
