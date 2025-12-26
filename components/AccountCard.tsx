
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Account, Booking, BookingStatus } from '../types';
import { StorageService } from '../services/storage';
import { Trophy, Gem, Lock, Eye, Sparkles, Clock, CalendarDays } from 'lucide-react';

interface AccountCardProps {
  account: Account;
}

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isEffectivelyAvailable, setIsEffectivelyAvailable] = useState(!account.isBooked);
  const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null);

  // Poll for upcoming bookings to display "Pre-Booked" status if applicable
  useEffect(() => {
    const fetchBookings = async () => {
       const allBookings = await StorageService.getBookings(account.id);
       const now = Date.now();
       
       // Find nearest future booking that is approved (ACTIVE or PRE_BOOKED)
       const future = allBookings
          .filter(b => 
             (b.status === BookingStatus.PRE_BOOKED || b.status === BookingStatus.ACTIVE) &&
             new Date(b.startTime).getTime() > now
          )
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
       
       setUpcomingBooking(future || null);
    };

    fetchBookings();
    const interval = setInterval(fetchBookings, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [account.id]);

  useEffect(() => {
    if (!account.isBooked || !account.bookedUntil) {
      setIsEffectivelyAvailable(true);
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(account.bookedUntil!).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setIsEffectivelyAvailable(true);
        setTimeLeft(null);
      } else {
        setIsEffectivelyAvailable(false);
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
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

  const skinCount = account.totalSkins || account.skins.length;

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
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1">
            {isEffectivelyAvailable ? (
              <span className="inline-flex items-center px-3 py-1 bg-black/50 backdrop-blur-md border border-green-500/50 text-green-400 text-[10px] font-bold uppercase tracking-wider skew-x-[-10deg]">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-2 animate-pulse" />
                Available
              </span>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <span className="inline-flex items-center px-3 py-1 bg-brand-accent/20 backdrop-blur-md border border-brand-accent/50 text-brand-accent text-[9px] font-black uppercase tracking-widest skew-x-[-10deg] shadow-[0_0_15px_rgba(255,70,85,0.3)]">
                  <Clock className="w-3 h-3 mr-1.5 animate-pulse" />
                  Opens In
                </span>
                <span className="bg-black/80 px-2 py-0.5 rounded font-mono text-xs text-white border border-white/10 tabular-nums">
                  {timeLeft}
                </span>
              </div>
            )}

            {/* Pre-Booked Indicator */}
            {upcomingBooking && (
               <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-1 rounded border border-purple-500/30 text-[9px] text-purple-400 font-bold uppercase tracking-wide">
                  <CalendarDays size={10} />
                  <span>
                     Pre-Booked: {new Date(upcomingBooking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
               </div>
            )}
          </div>

          {/* Rank Badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 border-l-2 border-brand-accent">
            <Trophy className={`w-4 h-4 ${getRankColor(account.rank)}`} />
            <span className={`text-sm font-bold tracking-wide font-display uppercase ${getRankColor(account.rank)}`}>{account.rank}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-xl font-display font-bold text-white mb-4 truncate group-hover:text-brand-accent transition-colors">{account.name}</h3>
          
          {/* Skins */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[10px] text-brand-cyan uppercase tracking-widest font-bold">
                <Gem className="w-3 h-3" />
                Loadout
              </div>
              <div className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 border border-yellow-400/20 rounded-sm shadow-[0_0_10px_rgba(250,204,21,0.1)]">
                {skinCount} PREMIUM SKINS
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {account.skins.slice(0, 4).map((skin, idx) => (
                <span 
                  key={idx} 
                  className={`text-[10px] px-2 py-1 border block max-w-[130px] truncate font-mono uppercase transition-all duration-300 flex items-center gap-1
                    ${skin.isHighlighted 
                        ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/40 shadow-[0_0_10px_rgba(0,240,255,0.2)] font-bold scale-105 z-10' 
                        : 'bg-white/5 text-slate-300 border-white/10'
                    }`}
                >
                  {skin.isHighlighted && <Sparkles className="w-2.5 h-2.5 shrink-0" />}
                  {skin.name}
                </span>
              ))}
              {account.skins.length > 4 && (
                 <span className="text-[10px] px-2 py-1 bg-white/5 text-slate-500 border border-white/10 block font-mono">
                   +{account.skins.length - 4}
                 </span>
              )}
            </div>
          </div>

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
              <Eye className="w-4 h-4" /> 
              {isEffectivelyAvailable ? 'View Details' : 'Check Slot'}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default AccountCard;
