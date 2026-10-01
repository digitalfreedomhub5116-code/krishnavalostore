import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Flame, Zap, X } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Account } from '../types';

interface NotificationItem {
  id: string;
  type: 'rental' | 'scarcity';
  name?: string;
  city?: string;
  accountName: string;
  accountId?: string;
  accountImage?: string;
  timeAgo?: string;
}

const INDIAN_CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Pune', 'Hyderabad', 'Kolkata', 'Ahmedabad', 'Jaipur'];
const GAMER_NAMES = ['Aditya', 'Rohan', 'Sahil', 'Dev', 'Karthik', 'Aman', 'Harsh', 'Nikhil', 'Yash', 'Tanmay', 'Arjun', 'Vikram'];
const TIME_AGOS = ['8 minutes ago', '14 minutes ago', '19 minutes ago', '25 minutes ago', '32 minutes ago', '41 minutes ago'];

export const LiveSocialProofTicker: React.FC = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<NotificationItem | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const cycleCountRef = useRef(0);

  // Fetch accounts on mount to use real inventory data
  useEffect(() => {
    StorageService.getAccounts().then(accs => {
      if (accs && accs.length > 0) {
        setAccounts(accs);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // Never show on admin pages
    if (location.pathname.startsWith('/admin')) {
      setVisible(false);
      return;
    }

    if (dismissed) return;

    let hideTimeout: NodeJS.Timeout;
    let nextShowTimeout: NodeJS.Timeout;

    const generateNotification = (): NotificationItem => {
      const isScarcity = cycleCountRef.current % 3 === 2; // Every 3rd notification is a scarcity notice
      cycleCountRef.current += 1;

      const randomAcc = accounts.length > 0 
        ? accounts[Math.floor(Math.random() * accounts.length)] 
        : null;

      const accName = randomAcc?.name || 'Kuronami';
      const accId = randomAcc?.id;
      const accImage = randomAcc?.imageUrl;

      if (isScarcity) {
        return {
          id: 'scarcity-' + Date.now(),
          type: 'scarcity',
          accountName: accName,
          accountId: accId,
          accountImage: accImage
        };
      }

      const randomName = GAMER_NAMES[Math.floor(Math.random() * GAMER_NAMES.length)];
      const randomCity = INDIAN_CITIES[Math.floor(Math.random() * INDIAN_CITIES.length)];
      const randomTime = TIME_AGOS[Math.floor(Math.random() * TIME_AGOS.length)];

      return {
        id: 'rental-' + Date.now(),
        type: 'rental',
        name: randomName,
        city: randomCity,
        accountName: accName,
        accountId: accId,
        accountImage: accImage,
        timeAgo: randomTime
      };
    };

    const showNext = () => {
      const nextItem = generateNotification();
      setCurrentNotification(nextItem);
      setVisible(true);

      // Visible for 5.5 seconds (gentle, not rushed)
      hideTimeout = setTimeout(() => {
        setVisible(false);

        // Quiet interval of 18-24 seconds before showing next (realistic, non-intrusive)
        const quietDelay = 18000 + Math.random() * 6000;
        nextShowTimeout = setTimeout(showNext, quietDelay);
      }, 5500);
    };

    // First appearance: comfortable 6.5s delay after page loads
    const initialDelayTimeout = setTimeout(showNext, 6500);

    return () => {
      clearTimeout(initialDelayTimeout);
      clearTimeout(hideTimeout);
      clearTimeout(nextShowTimeout);
    };
  }, [accounts, location.pathname, dismissed]);

  // If dismissed or no notification, don't render DOM
  if (!currentNotification || dismissed || location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setVisible(false);
    // Dismiss for 2 minutes
    setDismissed(true);
    setTimeout(() => setDismissed(false), 120000);
  };

  return (
    <div 
      className={`fixed z-40 transition-all duration-500 ease-out 
        bottom-24 left-4 right-4 sm:right-auto sm:left-6 sm:bottom-6 sm:max-w-sm
        ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
    >
      <div className="bg-brand-surface/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex items-center gap-3 relative overflow-hidden group">
        
        {/* Subtle Accent Glow */}
        <div className={`absolute top-0 left-0 bottom-0 w-1 ${currentNotification.type === 'rental' ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]' : 'bg-brand-cyan shadow-[0_0_10px_rgba(0,240,255,0.8)]'}`} />

        {/* Thumbnail or Icon */}
        <div className="relative shrink-0 pl-1">
          {currentNotification.accountImage ? (
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-black/50 relative">
              <img 
                src={currentNotification.accountImage} 
                alt={currentNotification.accountName} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute -bottom-1 -right-1 rounded-full p-0.5 bg-brand-dark">
                {currentNotification.type === 'rental' ? (
                  <Flame size={12} className="text-orange-400 fill-orange-400" />
                ) : (
                  <Zap size={12} className="text-brand-cyan fill-brand-cyan" />
                )}
              </div>
            </div>
          ) : (
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border border-white/10 ${currentNotification.type === 'rental' ? 'bg-orange-500/10 text-orange-400' : 'bg-brand-cyan/10 text-brand-cyan'}`}>
              {currentNotification.type === 'rental' ? (
                <Flame size={18} className="fill-orange-400/20" />
              ) : (
                <Zap size={18} className="fill-brand-cyan/20" />
              )}
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 pr-4">
          {currentNotification.type === 'rental' ? (
            <div>
              <div className="text-xs text-slate-200 leading-snug">
                <span className="font-bold text-white">{currentNotification.name}</span>
                <span className="text-slate-400"> from </span>
                <span className="text-slate-300 font-medium">{currentNotification.city}</span>
                <span className="text-slate-400"> rented </span>
                <span className="font-bold text-brand-accent">{currentNotification.accountName}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{currentNotification.timeAgo}</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs text-slate-200 leading-snug">
                <span className="text-brand-cyan font-bold uppercase tracking-wider text-[10px] font-mono block">High Demand</span>
                <span>Only </span>
                <span className="font-bold text-white">1 slot left</span>
                <span> for </span>
                <span className="font-bold text-brand-cyan">{currentNotification.accountName}</span>
                <span> today</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
                <span>Verified live availability</span>
              </div>
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-slate-500 hover:text-white p-1 rounded-md transition-colors"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};

export default LiveSocialProofTicker;
