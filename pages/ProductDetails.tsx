

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Account, Pricing, BookingStatus, Booking, Skin } from '../types';
import TrustVideoSection from '../components/TrustVideoSection';
import { ArrowLeft, Gem, Clock, Calendar, ChevronRight, MessageCircle, X, ArrowRight, Lock, Maximize2, ChevronDown, ChevronUp, Sparkles, Loader2, AlertCircle, ShieldCheck, PlayCircle, CalendarClock, Eye } from 'lucide-react';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState<keyof Pricing>('hours3');
  const [isInitiating, setIsInitiating] = useState(false);
  const [initiateError, setInitiateError] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [viewingSkin, setViewingSkin] = useState<Skin | null>(null);
  
  const [isSkinsExpanded, setIsSkinsExpanded] = useState(false);
  
  // Countdown states
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isEffectivelyAvailable, setIsEffectivelyAvailable] = useState(true);

  useEffect(() => {
    const loadAccount = async () => {
      try {
        if (id) {
          const acc = await StorageService.getAccountById(id);
          setAccount(acc);
        }
      } finally {
        setLoading(false);
      }
    };
    loadAccount();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!account || !account.isBooked || !account.bookedUntil) {
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
  }, [account]);

  if (loading) return <div className="min-h-[50vh] flex flex-col items-center justify-center"><Loader2 className="w-10 h-10 text-brand-accent animate-spin" /></div>;
  if (!account) return <div className="min-h-[50vh] flex flex-col items-center justify-center"><h2 className="text-2xl font-bold mb-4">Account Not Found</h2><Link to="/browse" className="text-brand-accent hover:underline flex items-center gap-2"><ArrowLeft size={16} /> Back to Browse</Link></div>;

  const calculatePrice = (duration: keyof Pricing) => {
    if (!account) return 0;
    const price = account.pricing[duration];
    if (duration === 'hours24') return Math.floor((account.pricing.hours24 || 0) * 0.9);
    return price || Math.floor((account.pricing.hours3 || 0) * (duration === 'hours1' ? 0.6 : 1)) || 0;
  };

  const handleInitiateRental = async () => {
    if (!account) return;
    setInitiateError('');
    setIsInitiating(true);

    try {
      const now = new Date();
      const hoursToAdd = parseInt(selectedDuration.replace('hours', ''));
      const end = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);

      // Availability Check
      const isAvailable = await StorageService.checkAvailability(account.id, now.toISOString(), end.toISOString());
      if (!isAvailable) {
        throw new Error("Selected time slot overlaps with an active booking. Please check back later.");
      }

      const price = calculatePrice(selectedDuration);
      if (price <= 0) {
        throw new Error("Invalid pricing configuration. Please contact support.");
      }

      // Guest user or current user
      const activeUser = StorageService.getOrCreateGuestUser();

      // Create Pending Booking for checkout lock
      const orderId = 'KV-' + Math.floor(1000 + Math.random() * 9000);
      const durationLabel = selectedDuration === 'hours1' ? '1 Hour' : selectedDuration === 'hours3' ? '3 Hours' : selectedDuration === 'hours12' ? '12 Hours' : '24 Hours';

      const booking: Booking = {
        orderId,
        accountId: account.id,
        accountName: account.name,
        durationLabel,
        hours: hoursToAdd,
        totalPrice: price,
        startTime: now.toISOString(),
        endTime: end.toISOString(),
        status: BookingStatus.PENDING,
        createdAt: new Date().toISOString(),
        customerId: activeUser.id,
        customerName: activeUser.name
      };

      await StorageService.createBooking(booking);

      const state = {
        orderId,
        account,
        hours: booking.hours,
        price: booking.totalPrice,
        durationLabel: booking.durationLabel,
        startMode: 'now',
        scheduledTime: now.toISOString()
      };

      // Navigate directly to checkout without obstacle
      navigate('/checkout', { state });
    } catch (err: any) {
      setInitiateError(err.message || 'Failed to initiate rental. Please try again.');
    } finally {
      setIsInitiating(false);
    }
  };

  const initialSkinsLimit = account.initialSkinsCount || 10;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-32">
      <div className="flex items-center justify-between mb-6">
        <Link to="/browse" className="text-slate-400 hover:text-white flex items-center gap-2"><ArrowLeft size={16} /> <span className="font-bold text-xs uppercase">Inventory</span></Link>
        <span className="text-slate-600 text-[10px] font-mono uppercase">ID: {account.id}</span>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12">
         <div className="space-y-6">
            <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-brand-dark cursor-zoom-in group" onClick={() => setIsImageModalOpen(true)}>
               <img src={account.imageUrl} className="w-full aspect-video object-cover" alt={account.name} />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="text-white w-10 h-10" />
               </div>
               
               {!isEffectivelyAvailable && (
                 <div className="absolute top-4 right-4 px-4 py-2 backdrop-blur-xl rounded-lg text-xs font-black uppercase tracking-widest shadow-2xl border text-brand-accent bg-brand-accent/10 border-brand-accent/30">
                   <span className="flex items-center gap-2">
                     <Clock className="w-4 h-4 animate-spin-slow" />
                     Locked: Opens in {timeLeft}
                   </span>
                 </div>
               )}
            </div>
            
            <div className="bg-brand-surface/40 border border-white/5 rounded-2xl p-6">
               <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2"><Gem size={16} className="text-brand-cyan" /> Loadout</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {account.skins.slice(0, isSkinsExpanded ? undefined : initialSkinsLimit).map((s, i) => (
                    <button 
                       key={i} 
                       onClick={() => setViewingSkin(s)}
                       className={`p-3 rounded-xl text-xs border text-left flex items-center gap-2 transition-all hover:scale-[1.02] hover:shadow-lg
                         ${s.isHighlighted 
                           ? 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan font-bold shadow-[0_0_10px_rgba(0,240,255,0.1)] hover:bg-brand-cyan/20' 
                           : 'bg-brand-dark/50 border-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                         }
                         ${s.imageUrl ? 'cursor-pointer' : 'cursor-default'}
                       `}
                    >
                       {s.isHighlighted && <Sparkles className="inline-block w-3 h-3 shrink-0" />}
                       <span className="truncate flex-1">{s.name}</span>
                       {s.imageUrl && <Eye className="w-3 h-3 opacity-50" />}
                    </button>
                  ))}
               </div>
               {account.skins.length > initialSkinsLimit && (
                 <button 
                   onClick={() => setIsSkinsExpanded(!isSkinsExpanded)} 
                   className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-bold text-slate-300 uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                 >
                   {isSkinsExpanded ? <><ChevronUp size={14} /> View Less</> : <><ChevronDown size={14} /> View All Skins ({account.skins.length})</>}
                 </button>
               )}
            </div>
         </div>

         <div className="space-y-8">
            <div>
               <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 rounded text-[10px] font-bold border border-brand-cyan text-brand-cyan uppercase tracking-widest">{account.rank} RANKED</span>
                  {!isEffectivelyAvailable && (
                    <span className="px-3 py-1 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 uppercase tracking-widest flex items-center gap-1.5">
                       <AlertCircle size={12} /> High Demand ID
                    </span>
                  )}
               </div>
               <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white uppercase mb-4 leading-tight tracking-tighter">
                  {account.name}
               </h1>
               <p className="text-slate-400 text-base border-l-4 border-brand-accent pl-6 py-2 italic font-medium">
                  {account.description || "Premium account with verified skins and competitive MMR. Guaranteed 0% ban rate."}
               </p>
            </div>

            {/* SOCIAL PROOF: VIDEO REVIEWS */}
            <TrustVideoSection />

            <div className="bg-brand-surface/40 border border-white/5 rounded-2xl p-5 sm:p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/5 blur-3xl rounded-full"></div>
                <div className="flex items-center justify-between mb-5">
                   <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Service Configuration</h3>
                   <span className="text-[10px] font-mono text-brand-cyan uppercase tracking-wider font-bold">Select Duration</span>
                </div>
                
                {!isEffectivelyAvailable && (
                  <div className="mb-6 bg-brand-accent/5 border border-brand-accent/20 rounded-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                     <div className="w-12 h-12 rounded-full bg-brand-accent/20 flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6 text-brand-accent animate-pulse" />
                     </div>
                     <div>
                        <p className="text-white font-bold text-sm">Deployment Queue Active</p>
                        <p className="text-slate-400 text-xs">This account is currently in a match. Next slot opens in <span className="text-brand-accent font-mono font-bold">{timeLeft}</span>.</p>
                     </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                   {(['hours1', 'hours3', 'hours12', 'hours24'] as (keyof Pricing)[]).map((h) => {
                      const isSelected = selectedDuration === h;
                      const price = calculatePrice(h);

                      return (
                        <button 
                           key={h} 
                           type="button"
                           onClick={() => setSelectedDuration(h)}
                           className={`p-4 sm:p-5 rounded-xl border text-left relative overflow-hidden transition-all cursor-pointer ${
                              isSelected 
                                 ? 'bg-gradient-to-br from-brand-accent/20 via-brand-surface to-brand-accent/5 border-brand-accent ring-2 ring-brand-accent/50 shadow-[0_0_20px_rgba(255,70,85,0.25)] scale-[1.02]' 
                                 : 'bg-brand-dark/90 border-white/10 hover:border-white/25 hover:bg-brand-dark'
                           }`}
                        >
                           {h === 'hours24' && (
                             <div className="absolute top-0 right-0 bg-brand-accent text-white text-[8px] px-2 py-0.5 font-black uppercase tracking-widest skew-x-[-12deg] -mr-1">
                                BEST VALUE
                             </div>
                           )}
                           <div className={`text-[10px] uppercase font-bold tracking-widest mb-1.5 flex items-center justify-between ${
                              isSelected ? 'text-brand-accent font-black' : 'text-slate-400'
                           }`}>
                              <span>{h === 'hours1' ? 'Quick (1h)' : h === 'hours3' ? 'Tactical (3h)' : h === 'hours12' ? 'Ops (12h)' : 'Full Day'}</span>
                              {isSelected && <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />}
                           </div>
                           <div className="text-xl sm:text-2xl font-black text-white">
                              ₹{price}
                           </div>
                        </button>
                      );
                   })}
                </div>
            </div>

            {initiateError && (
              <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl flex items-center gap-2.5 text-red-400 text-xs">
                 <AlertCircle size={15} className="shrink-0" />
                 <span>{initiateError}</span>
              </div>
            )}

            <button 
              type="button"
              onClick={handleInitiateRental}
              disabled={isInitiating}
              className="w-full py-3.5 sm:py-4 font-black uppercase rounded-xl transition-all tracking-[0.15em] text-sm shadow-xl bg-white text-brand-darker hover:bg-brand-accent hover:text-white active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
               {isInitiating ? (
                 <>
                   <Loader2 className="w-4 h-4 animate-spin" />
                   <span>Securing Slot...</span>
                 </>
               ) : (
                 <>
                   <span>Initiate Rental</span>
                   <ArrowRight size={16} />
                 </>
               )}
            </button>
            
            <p className="text-center text-[10px] text-slate-600 font-mono uppercase tracking-widest">
               Encrypted Handshake Protocol v2.4 // 256-bit AES Delivery
            </p>
         </div>
      </div>

      {isImageModalOpen && createPortal(
        <div className="fixed inset-0 z-[200] bg-black/98 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setIsImageModalOpen(false)}>
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
             <X size={40} strokeWidth={1} />
          </button>
          <img src={account.imageUrl} className="max-w-full max-h-full rounded-lg shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5" />
        </div>, 
        document.body
      )}

      {/* Skin Preview Modal */}
      {viewingSkin && createPortal(
         <div className="fixed inset-0 z-[200] bg-black/98 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setViewingSkin(null)}>
            <div className="relative max-w-5xl w-full max-h-[90vh] bg-brand-surface border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-[0_0_150px_rgba(0,240,255,0.1)]" onClick={e => e.stopPropagation()}>
               <div className="absolute top-4 right-4 z-10">
                  <button onClick={() => setViewingSkin(null)} className="p-2 bg-black/50 hover:bg-white hover:text-black rounded-full text-white transition-colors">
                     <X size={24} />
                  </button>
               </div>
               
               <div className="flex-1 bg-black flex items-center justify-center p-8 overflow-hidden relative">
                  <div className="absolute inset-0 bg-brand-cyan/5 radial-gradient opacity-50"></div>
                  {viewingSkin.imageUrl ? (
                     <img src={viewingSkin.imageUrl} alt={viewingSkin.name} className="max-w-full max-h-[70vh] object-contain drop-shadow-2xl relative z-10" />
                  ) : (
                     <div className="flex flex-col items-center justify-center text-center opacity-50">
                        <Gem size={64} className="mb-4 text-brand-cyan" />
                        <p className="text-white font-bold text-lg">No Preview Available</p>
                        <p className="text-slate-500 text-sm">Image data not found for this item.</p>
                     </div>
                  )}
               </div>
               
               <div className="p-6 bg-brand-surface border-t border-white/10 flex justify-between items-center">
                  <div>
                     <h3 className="text-2xl font-display font-bold text-white uppercase italic tracking-wider">{viewingSkin.name}</h3>
                     <p className="text-brand-cyan text-xs font-mono uppercase tracking-widest mt-1">Premium Collection</p>
                  </div>
                  {viewingSkin.isHighlighted && (
                     <div className="px-4 py-2 bg-brand-cyan/10 border border-brand-cyan/30 rounded-lg text-brand-cyan text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={14} /> Highlighted Item
                     </div>
                  )}
               </div>
            </div>
         </div>,
         document.body
      )}

    </div>
  );
};

export default ProductDetails;
