import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Account } from '../types';
import { Trophy, Eye, Gamepad2 } from 'lucide-react';

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
    <div className={`group relative rounded-none overflow-hidden border transition-all duration-300 ${isEffectivelyAvailable ? 'border-white/10 bg-brand-surface hover:border-brand-accent/50 hover:shadow-[0_0_30px_rgba(255,70,85,0.15)] hover:-translate-y-2' : 'border-white/5 bg-brand-dark opacity-90'}`}>
      
      <Link to={`/account/${account.id}`} className="block h-full">
        {/* Corner Accents (Cyberpunk Style) */}
        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/20 group-hover:border-brand-accent transition-colors z-20"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-white/20 group-hover:border-brand-accent transition-colors z-20"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-white/20 group-hover:border-brand-accent transition-colors z-20"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/20 group-hover:border-brand-accent transition-colors z-20"></div>

        {/* Image Overlay */}
        <div className="relative h-48 w-full overflow-hidden">
          <div className="absolute inset-0 bg-brand-accent/0 group-hover:bg-brand-accent/10 transition-colors z-10 mix-blend-overlay"></div>
          <img 
            src={account.imageUrl} 
            alt={account.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-transparent to-transparent opacity-90" />
          
          {/* Rank Badge - Top Left Corner (Reduced Size) */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 border-l-2 border-brand-accent">
            <Trophy className={`w-3.5 h-3.5 ${getRankColor(account.rank)}`} />
            <span className={`text-[11px] font-bold tracking-wider font-display uppercase ${getRankColor(account.rank)}`}>{account.rank}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-xl font-display font-bold text-white mb-4 truncate group-hover:text-brand-accent transition-colors">{account.name}</h3>
          
          {/* Pricing Grid */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            <div className="bg-brand-dark/50 p-2 border border-white/5 text-center flex flex-col justify-center transition-colors">
              <div className="text-[10px] text-slate-500 uppercase">1 Hour</div>
              <div className="text-sm font-bold text-white">₹{account.pricing.hours1 || 29}</div>
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
