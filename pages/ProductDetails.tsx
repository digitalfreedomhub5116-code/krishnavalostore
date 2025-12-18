
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Account, Pricing } from '../types';
// Added ShieldCheck to the imports
import { ArrowLeft, Gem, Clock, Calendar, ChevronRight, MessageCircle, X, ArrowRight, Lock, Maximize2, ChevronDown, ChevronUp, Sparkles, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  const [isSkinsExpanded, setIsSkinsExpanded] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<keyof Pricing>('hours3');
  
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

  const displayPrice = selectedDuration === 'hours24' ? Math.floor(account.pricing.hours24 * 0.9) : account.pricing[selectedDuration];
  
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
               
               <div className={`absolute top-4 right-4 px-4 py-2 backdrop-blur-xl rounded-lg text-xs font-black uppercase tracking-widest shadow-2xl border ${isEffectivelyAvailable ? 'text-green-400 bg-green-500/10 border-green-500/30' : 'text-brand-accent bg-brand-accent/10 border-brand-accent/30'}`}>
                  {isEffectivelyAvailable ? (
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      Ready to Deploy
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-spin-slow" />
                      Locked: Opens in {timeLeft}
                    </span>
                  )}
               </div>
            </div>
            
            <div className="bg-brand-surface/40 border border-white/5 rounded-2xl p-6">
               <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2"><Gem size={16} className="text-brand-cyan" /> Loadout</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {account.skins.slice(0, isSkinsExpanded ? undefined : initialSkinsLimit).map((s, i) => (
                    <div key={i} className={`p-3 rounded-xl text-xs border ${s.isHighlighted ? 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan font-bold shadow-[0_0_10px_rgba(0,240,255,0.1)]' : 'bg-brand-dark/50 border-white/5 text-slate-300'}`}>
                       {s.isHighlighted && <Sparkles className="inline-block w-3 h-3 mr-1.5 mb-0.5" />}
                       {s.name}
                    </div>
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

            <div className="bg-brand-surface/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/5 blur-3xl rounded-full"></div>
               <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mb-8">Service Configuration</h3>
               
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

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['hours3', 'hours12', 'hours24'] as (keyof Pricing)[]).map((h) => (
                     <button 
                        key={h} 
                        disabled={!isEffectivelyAvailable}
                        onClick={() => { setSelectedDuration(h); setShowBookingModal(true); }} 
                        className={`p-5 rounded-xl border transition-all relative overflow-hidden group/plan
                          ${!isEffectivelyAvailable ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                          ${h === 'hours24' 
                             ? 'bg-brand-accent/5 border-brand-accent/30 hover:border-brand-accent' 
                             : 'bg-brand-dark border-white/10 hover:border-brand-cyan/50 hover:bg-white/5'
                          }
                        `}
                     >
                        {h === 'hours24' && (
                          <div className="absolute top-0 right-0 bg-brand-accent text-white text-[8px] px-2 py-0.5 font-black uppercase tracking-widest skew-x-[-12deg] -mr-1">
                             BEST VALUE
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 group-hover/plan:text-slate-300 transition-colors">
                           {h === 'hours3' ? 'Tactical (3h)' : h === 'hours12' ? 'Operation (12h)' : 'Campaign (24h)'}
                        </div>
                        <div className="text-2xl font-black text-white group-hover/plan:scale-105 transition-transform origin-left">
                           ₹{h === 'hours24' ? Math.floor(account.pricing.hours24 * 0.9) : account.pricing[h]}
                        </div>
                     </button>
                  ))}
               </div>
            </div>

            <button 
              onClick={() => setShowBookingModal(true)} 
              disabled={!isEffectivelyAvailable} 
              className={`w-full py-6 font-black uppercase rounded-xl transition-all tracking-[0.3em] text-lg shadow-2xl relative overflow-hidden group
                ${isEffectivelyAvailable 
                  ? 'bg-white text-brand-darker hover:bg-brand-accent hover:text-white hover:scale-[1.02] active:scale-95' 
                  : 'bg-slate-800 text-slate-500 border border-white/5 grayscale'
                }
              `}
            >
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
               <span className="relative z-10 flex items-center justify-center gap-3">
                  {isEffectivelyAvailable ? (
                    <>
                      INITIATE RENTAL <ArrowRight size={20} />
                    </>
                  ) : (
                    <>
                      <Lock size={18} /> ACCOUNT OPENS IN {timeLeft}
                    </>
                  )}
               </span>
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

      {showBookingModal && createPortal(
        <BookingWizard 
           account={account} 
           selectedDuration={selectedDuration} 
           onClose={() => setShowBookingModal(false)} 
        />, 
        document.body
      )}
    </div>
  );
};

const BookingWizard = ({ account, selectedDuration, onClose }: any) => {
   const navigate = useNavigate();
   const user = StorageService.getCurrentUser();
   const finalPrice = selectedDuration === 'hours24' ? Math.floor(account.pricing.hours24 * 0.9) : account.pricing[selectedDuration];

   return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
         <div className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-md p-8 relative shadow-[0_30px_100px_rgba(0,0,0,1)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-cyan to-transparent"></div>
            
            <div className="flex justify-between items-center mb-8">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-cyan/20 rounded-lg text-brand-cyan">
                     <ShieldCheck size={24} />
                  </div>
                  <h3 className="font-bold text-xl uppercase tracking-tighter italic">Checkout Order</h3>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>
            </div>

            <div className="space-y-4 mb-8">
               <div className="bg-brand-dark p-4 rounded-xl flex justify-between items-center border border-white/5">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Target Asset</div>
                    <div className="font-bold text-white uppercase text-lg">{account.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Rank</div>
                    <div className="text-brand-cyan font-bold">{account.rank}</div>
                  </div>
               </div>

               <div className="bg-brand-dark p-4 rounded-xl flex justify-between items-center border border-white/5">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Operation Duration</div>
                    <div className="font-bold text-white uppercase">{selectedDuration.replace('hours', '')} HOURS</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Service Fee</div>
                    <div className="text-2xl font-black text-brand-accent">₹{finalPrice}</div>
                  </div>
               </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => { 
                  const state = { 
                    account, 
                    hours: parseInt(selectedDuration.replace('hours','')), 
                    price: finalPrice, 
                    durationLabel: selectedDuration === 'hours3' ? '3 Hours' : selectedDuration === 'hours12' ? '12 Hours' : '24 Hours', 
                    startMode: 'now' 
                  };
                  navigate(user ? '/checkout' : '/login', { 
                    state: user ? state : { returnTo: '/checkout', checkoutState: state } 
                  });
                }} 
                className="w-full bg-brand-accent py-5 rounded-xl font-black text-white hover:bg-red-600 transition-all shadow-[0_10px_30px_rgba(255,70,85,0.3)] hover:scale-[1.02] active:scale-95 uppercase tracking-[0.2em]"
              >
                {user ? 'PROCEED TO UPLINK' : 'LOGIN TO CONTINUE'}
              </button>
              <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest">
                ID will be delivered instantly to WhatsApp after verification
              </p>
            </div>
         </div>
      </div>
   );
};

export default ProductDetails;
