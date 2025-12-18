
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Account, Pricing } from '../types';
import { ArrowLeft, Gem, Clock, Calendar, ChevronRight, MessageCircle, X, ArrowRight, Lock, Maximize2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | undefined>(undefined);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  // UI State for Skins Reveal
  const [isSkinsExpanded, setIsSkinsExpanded] = useState(false);
  const [skinLimit, setSkinLimit] = useState(10);

  // Booking Wizard State
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDuration, setSelectedDuration] = useState<keyof Pricing>('hours3');
  const [startMode, setStartMode] = useState<'now' | 'later'>('now');
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    if (id) {
      const acc = StorageService.getAccountById(id);
      setAccount(acc);
    }
    
    // Set skin limit based on screen size
    const handleResize = () => {
      setSkinLimit(window.innerWidth < 768 ? 6 : 10);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [id]);

  useEffect(() => {
     window.scrollTo(0, 0);
  }, []);

  if (!account) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-white mb-4">Account Not Found</h2>
        <Link to="/browse" className="text-brand-accent hover:underline flex items-center gap-2">
           <ArrowLeft className="w-4 h-4" /> Back to Browse
        </Link>
      </div>
    );
  }

  const isAvailable = !account.isBooked;
  const totalSkins = account.skins.length;
  const hasMoreSkins = totalSkins > skinLimit;
  const visibleSkins = isSkinsExpanded ? account.skins : account.skins.slice(0, skinLimit);

  // --- Wizard Logic ---

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const calculateTimes = () => {
    if (!selectedDuration) return { start: null, end: null };
    const hours = selectedDuration === 'hours3' ? 3 : selectedDuration === 'hours12' ? 12 : 24;
    let start = new Date();
    if (startMode === 'later' && scheduledTime) {
      start = new Date(scheduledTime);
    }
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
    return { start, end };
  };

  const formatTime12Hour = (date: Date | null) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const handleProceedToCheckout = () => {
    if (!account) return;
    
    if (startMode === 'later' && !scheduledTime) {
      alert("Please select a date and time for your booking.");
      return;
    }
    if (startMode === 'later') {
      const selectedDate = new Date(scheduledTime);
      if (selectedDate < new Date()) {
         alert("Please select a future time.");
         return;
      }
    }
    
    const hours = selectedDuration === 'hours3' ? 3 : selectedDuration === 'hours12' ? 12 : 24;
    const basePrice = account.pricing[selectedDuration];
    const isDiscounted = selectedDuration === 'hours24';
    const finalPrice = isDiscounted ? Math.floor(basePrice * 0.9) : basePrice;

    const user = StorageService.getCurrentUser();
    const checkoutState = { 
      account: account,
      hours,
      price: finalPrice,
      originalPrice: isDiscounted ? basePrice : undefined,
      durationLabel: selectedDuration === 'hours3' ? '3 Hours' : selectedDuration === 'hours12' ? '12 Hours' : '24 Hours',
      startMode,
      scheduledTime: startMode === 'later' ? scheduledTime : undefined
    };

    if (!user) {
      navigate('/login', { state: { returnTo: '/checkout', checkoutState } });
    } else {
      navigate('/checkout', { state: checkoutState });
    }
  };

  const { start, end } = calculateTimes();
  const currentPrice = account.pricing[selectedDuration];
  const is24h = selectedDuration === 'hours24';
  const displayPriceStep2 = is24h ? Math.floor(currentPrice * 0.9) : currentPrice;

  // WhatsApp Link
  const waMessage = `I am interested in buying the account: ${account.name} (Rank: ${account.rank}). What is the buying price?`;
  const waLink = `https://wa.me/919860185116?text=${encodeURIComponent(waMessage)}`;

  // Modals
  const ImageModal = (
     <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsImageModalOpen(false)}>
        <button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-red-500/50 rounded-full text-white transition-all z-[210] group">
           <X className="w-8 h-8 group-hover:scale-110 transition-transform" />
        </button>
        <img src={account.imageUrl} alt={account.name} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
     </div>
  );

  const BookingModal = (
     <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] relative z-[210]">
           <div className="p-4 border-b border-white/10 flex justify-between items-center bg-brand-dark/50 shrink-0">
              <div className="flex items-center gap-2">
                 {step === 2 && <button onClick={() => setStep(1)} className="mr-1 p-1 hover:bg-white/10 rounded-full transition-colors"><ArrowLeft className="w-5 h-5 text-slate-300" /></button>}
                 <h3 className="font-bold text-lg">{step === 1 ? 'Select Duration' : 'Select Time'}</h3>
              </div>
              <button onClick={() => { setShowBookingModal(false); setStep(1); }} className="text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
           </div>
           {step === 1 && (
              <div className="p-6 overflow-y-auto">
                 <div className="space-y-3 mb-8">
                    {['hours3', 'hours12', 'hours24'].map((hid) => {
                       const option = { id: hid, label: hid === 'hours3' ? '3 Hours' : hid === 'hours12' ? '12 Hours' : '24 Hours', price: account.pricing[hid as keyof Pricing] };
                       const isDiscounted = option.id === 'hours24';
                       const finalPrice = isDiscounted ? Math.floor(option.price * 0.9) : option.price;
                       return (
                          <div key={option.id} onClick={() => setSelectedDuration(option.id as keyof Pricing)} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedDuration === option.id ? 'border-brand-accent bg-brand-accent/10' : 'border-white/10 bg-brand-dark hover:bg-white/5'}`}>
                             <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedDuration === option.id ? 'border-brand-accent' : 'border-slate-500'}`}>{selectedDuration === option.id && <div className="w-2.5 h-2.5 rounded-full bg-brand-accent" />}</div>
                                <div>
                                   <span className="font-medium text-white text-lg">{option.label}</span>
                                   {isDiscounted && <span className="ml-2 bg-brand-accent text-white text-[10px] px-1.5 py-0.5 rounded font-bold">SAVE 10%</span>}
                                </div>
                             </div>
                             <div className="text-right">
                                {isDiscounted && <div className="text-xs text-slate-500 line-through">₹{option.price}</div>}
                                <span className="font-bold text-xl text-brand-accent">₹{finalPrice}</span>
                             </div>
                          </div>
                       )
                    })}
                 </div>
                 <button onClick={() => setStep(2)} className="w-full bg-brand-accent hover:bg-red-600 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2">Next Step <ChevronRight className="w-5 h-5" /></button>
              </div>
           )}
           {step === 2 && (
              <div className="p-6 overflow-y-auto">
                 <div className="bg-brand-dark border border-white/10 rounded-lg p-3 flex justify-between items-center mb-6">
                    <div><span className="text-xs text-slate-500 uppercase">Total</span><div className="font-bold text-white text-xl">₹{displayPriceStep2}</div></div>
                    <div className="text-right text-sm text-slate-300">{selectedDuration === 'hours3' ? '3 Hours' : selectedDuration === 'hours12' ? '12 Hours' : '24 Hours'}</div>
                 </div>
                 <div className="mb-6">
                    <label className="text-sm text-slate-400 font-medium mb-3 block">Start Time</label>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                       <button onClick={() => setStartMode('now')} className={`py-3 px-2 text-sm font-bold rounded-xl border flex flex-col items-center gap-2 ${startMode === 'now' ? 'bg-brand-accent border-brand-accent text-white' : 'bg-brand-dark border-white/10 text-slate-400'}`}><Clock className="w-5 h-5" /> Start Now</button>
                       <button onClick={() => setStartMode('later')} className={`py-3 px-2 text-sm font-bold rounded-xl border flex flex-col items-center gap-2 ${startMode === 'later' ? 'bg-brand-accent border-brand-accent text-white' : 'bg-brand-dark border-white/10 text-slate-400'}`}><Calendar className="w-5 h-5" /> Schedule</button>
                    </div>
                    {startMode === 'later' && <div className="mb-4"><input type="datetime-local" min={getMinDateTime()} value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white [color-scheme:dark]" /></div>}
                    <div className="bg-brand-dark border border-white/10 rounded-xl p-4 flex items-center justify-between text-center">
                       <div><div className="text-xl font-bold text-white">{startMode === 'now' ? 'Now' : formatTime12Hour(start)}</div><div className="text-[10px] text-slate-500 uppercase font-bold">Start</div></div>
                       <ArrowRight className="w-4 h-4 text-brand-accent" />
                       <div><div className="text-xl font-bold text-brand-accent">{formatTime12Hour(end)}</div><div className="text-[10px] text-slate-500 uppercase font-bold">End</div></div>
                    </div>
                 </div>
                 <button onClick={handleProceedToCheckout} className="w-full bg-brand-accent hover:bg-red-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">{!StorageService.getCurrentUser() && <Lock className="w-4 h-4" />}{StorageService.getCurrentUser() ? 'Proceed to Payment' : 'Login to Proceed'}</button>
              </div>
           )}
        </div>
     </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-32 lg:pb-12">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/browse" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
           <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors"><ArrowLeft className="w-4 h-4" /></div>
           <span className="font-bold text-xs uppercase tracking-widest">Inventory</span>
        </Link>
        <span className="text-slate-600 text-[10px] font-mono tracking-widest uppercase">SECURE_ID: {account.id}</span>
      </div>

      {/* Main Container - Mobile reordering happens here */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12">
         
         {/* Identity Header (Mobile Only - Top Placement) */}
         <div className="lg:hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-3">
               <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase border bg-opacity-10 ${account.rank.includes('Immortal') ? 'border-red-500 text-red-400 bg-red-500' : account.rank.includes('Ascendant') ? 'border-emerald-500 text-emerald-400 bg-emerald-500' : 'border-brand-cyan text-brand-cyan bg-brand-cyan'}`}>{account.rank}</span>
               <span className="text-slate-500 text-[10px] uppercase font-mono tracking-tighter">PLATFORM // PC</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-white uppercase tracking-tight mb-4 leading-tight">{account.name}</h1>
            <div className="h-[1px] w-full bg-gradient-to-r from-white/10 via-transparent to-transparent"></div>
         </div>

         {/* Visual Assets (Left on Desktop, 2nd on Mobile) */}
         <div className="space-y-8">
            <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-brand-dark group cursor-zoom-in shadow-2xl shadow-black/50" onClick={() => setIsImageModalOpen(true)}>
               <img src={account.imageUrl} alt={account.name} className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-105" />
               <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent opacity-60" />
               
               <div className="absolute top-4 right-4">
                  {isAvailable ? (
                     <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 backdrop-blur-md rounded-lg text-green-400 font-bold flex items-center gap-2 uppercase text-[10px] tracking-widest shadow-lg shadow-black/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Available
                     </div>
                  ) : (
                     <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 backdrop-blur-md rounded-lg text-red-400 font-bold flex items-center gap-2 uppercase text-[10px] tracking-widest">
                        <Clock className="w-3 h-3" /> Booked
                     </div>
                  )}
               </div>
            </div>

            {/* Skins Collection Section */}
            <div className="bg-brand-surface/40 border border-white/5 rounded-2xl p-5 lg:p-6 backdrop-blur-sm">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                     <Gem className="w-4 h-4 text-brand-cyan" /> Premium Collection
                  </h3>
                  <span className="text-[10px] bg-white/5 px-2 py-1 rounded-md text-slate-400 font-mono">{totalSkins} TOTAL</span>
               </div>
               
               <div className="relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 transition-all duration-500">
                    {visibleSkins.map((skin, idx) => (
                       <div 
                        key={idx} 
                        className={`p-3 rounded-xl text-xs font-medium transition-all cursor-default animate-in fade-in duration-300 flex items-center justify-between border
                          ${skin.isHighlighted 
                            ? 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan shadow-[0_0_15px_rgba(0,240,255,0.1)]' 
                            : 'bg-brand-dark/50 border-white/5 text-slate-300 hover:border-brand-accent/20'
                          }`}
                       >
                          <span>{skin.name}</span>
                          {skin.isHighlighted && <Sparkles className="w-3.5 h-3.5 text-brand-cyan animate-pulse" />}
                       </div>
                    ))}
                  </div>

                  {!isSkinsExpanded && hasMoreSkins && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-brand-surface to-transparent pointer-events-none" />
                  )}
               </div>

               {hasMoreSkins && (
                  <button onClick={() => setIsSkinsExpanded(!isSkinsExpanded)} className="w-full py-3 mt-4 border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-[0.2em] group">
                    {isSkinsExpanded ? (
                      <><ChevronUp className="w-4 h-4 text-brand-accent group-hover:-translate-y-1" /> View Less</>
                    ) : (
                      <><ChevronDown className="w-4 h-4 text-brand-cyan group-hover:translate-y-1" /> Show More ({totalSkins - skinLimit}+)</>
                    )}
                  </button>
               )}
            </div>
         </div>

         {/* Content & Action Section (Right on Desktop, 3rd on Mobile) */}
         <div className="space-y-8">
            {/* Identity Header (Desktop Only) */}
            <div className="hidden lg:block">
               <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase border bg-opacity-10 ${account.rank.includes('Immortal') ? 'border-red-500 text-red-400 bg-red-500' : account.rank.includes('Ascendant') ? 'border-emerald-500 text-emerald-400 bg-emerald-500' : 'border-brand-cyan text-brand-cyan bg-brand-cyan'}`}>{account.rank}</span>
                  <span className="text-slate-500 text-[10px] uppercase font-mono tracking-widest">ID: {account.id}</span>
               </div>
               <h1 className="text-4xl font-display font-bold text-white uppercase tracking-tight mb-4 leading-tight">{account.name}</h1>
               {account.description && <p className="text-slate-400 text-sm leading-relaxed border-l-2 border-brand-accent pl-4 italic mb-8">{account.description}</p>}
            </div>

            {/* Mobile Description (Shown here if present) */}
            {account.description && <div className="lg:hidden"><p className="text-slate-400 text-xs leading-relaxed italic border-l-2 border-brand-accent pl-3">{account.description}</p></div>}

            {/* Pricing Card */}
            <div className="bg-brand-surface/40 border border-white/5 rounded-2xl p-6 lg:p-8 relative overflow-hidden backdrop-blur-md">
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 blur-3xl pointer-events-none" />
               <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">Select Duration</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                     { id: 'hours3', label: '3 Hours', price: account.pricing.hours3 },
                     { id: 'hours12', label: '12 Hours', price: account.pricing.hours12 },
                     { id: 'hours24', label: '24 Hours', price: account.pricing.hours24, discount: true }
                  ].map((plan, idx) => (
                     <button key={idx} onClick={() => isAvailable && (setSelectedDuration(plan.id as keyof Pricing), setShowBookingModal(true))} disabled={!isAvailable} className={`relative p-5 rounded-xl border text-center transition-all duration-300 ${plan.discount ? 'border-brand-accent/30 bg-brand-accent/5' : 'border-white/5 bg-brand-dark/50'} ${isAvailable ? 'hover:border-brand-cyan/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)] active:scale-95' : 'opacity-50 cursor-not-allowed'}`}>
                        {plan.discount && <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand-accent text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg">OFFER</div>}
                        <div className="text-[10px] text-slate-500 uppercase mb-2 font-bold">{plan.label}</div>
                        <div className="text-2xl font-display font-bold text-white">₹{plan.discount ? Math.floor(plan.price * 0.9) : plan.price}</div>
                     </button>
                  ))}
               </div>
            </div>

            {/* Main CTA Section */}
            <div className="space-y-4">
               <button onClick={() => isAvailable && setShowBookingModal(true)} disabled={!isAvailable} className={`w-full py-5 text-sm font-bold uppercase tracking-[0.2em] rounded-xl shadow-2xl flex items-center justify-center gap-3 transition-all ${isAvailable ? 'bg-white text-brand-darker hover:bg-brand-accent hover:text-white active:scale-[0.98]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>
                  {isAvailable ? (<>RENT NOW <ArrowRight className="w-4 h-4" /></>) : (<><Lock className="w-4 h-4" /> CURRENTLY BUSY</>)}
               </button>
               
               <a href={waLink} target="_blank" rel="noopener noreferrer" className="w-full py-4 text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl border border-green-500/30 text-green-400 hover:bg-green-500/10 flex items-center justify-center gap-2 transition-all">
                  <MessageCircle className="w-4 h-4" /> Want to Buy this ID? Chat Now
               </a>
            </div>

            {/* Safety Badges */}
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center"><div className="text-white font-bold text-[10px] mb-1 uppercase">100% Secure</div><div className="text-[9px] text-slate-500">Auto-Bypass Enabled</div></div>
               <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center"><div className="text-white font-bold text-[10px] mb-1 uppercase">Instant Access</div><div className="text-[9px] text-slate-500">Credentials via WhatsApp</div></div>
            </div>
         </div>
      </div>

      {isImageModalOpen && createPortal(ImageModal, document.body)}
      {showBookingModal && createPortal(BookingModal, document.body)}

    </div>
  );
};

export default ProductDetails;
