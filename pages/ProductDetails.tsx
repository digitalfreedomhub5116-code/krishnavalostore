
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Account, Pricing } from '../types';
import { ArrowLeft, Gem, Clock, Calendar, ChevronRight, MessageCircle, X, ArrowRight, Lock, Maximize2, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  const [isSkinsExpanded, setIsSkinsExpanded] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDuration, setSelectedDuration] = useState<keyof Pricing>('hours3');
  const [startMode, setStartMode] = useState<'now' | 'later'>('now');
  const [scheduledTime, setScheduledTime] = useState('');

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

  if (loading) return <div className="min-h-[50vh] flex flex-col items-center justify-center"><Loader2 className="w-10 h-10 text-brand-accent animate-spin" /></div>;
  if (!account) return <div className="min-h-[50vh] flex flex-col items-center justify-center"><h2 className="text-2xl font-bold mb-4">Account Not Found</h2><Link to="/browse" className="text-brand-accent hover:underline flex items-center gap-2"><ArrowLeft size={16} /> Back to Browse</Link></div>;

  const isAvailable = !account.isBooked;
  const displayPrice = selectedDuration === 'hours24' ? Math.floor(account.pricing.hours24 * 0.9) : account.pricing[selectedDuration];
  
  // Use the admin-configured limit or default to 10
  const initialSkinsLimit = account.initialSkinsCount || 10;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-32">
      <div className="flex items-center justify-between mb-6">
        <Link to="/browse" className="text-slate-400 hover:text-white flex items-center gap-2"><ArrowLeft size={16} /> <span className="font-bold text-xs uppercase">Inventory</span></Link>
        <span className="text-slate-600 text-[10px] font-mono uppercase">ID: {account.id}</span>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12">
         <div className="space-y-6">
            <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-brand-dark cursor-zoom-in" onClick={() => setIsImageModalOpen(true)}>
               <img src={account.imageUrl} className="w-full aspect-video object-cover" alt={account.name} />
               <div className={`absolute top-4 right-4 px-3 py-1.5 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase ${isAvailable ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>{isAvailable ? 'Available' : 'Booked'}</div>
            </div>
            <div className="bg-brand-surface/40 border border-white/5 rounded-2xl p-6">
               <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2"><Gem size={16} className="text-brand-cyan" /> Loadout</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {account.skins.slice(0, isSkinsExpanded ? undefined : initialSkinsLimit).map((s, i) => (
                    <div key={i} className={`p-3 rounded-xl text-xs border ${s.isHighlighted ? 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan' : 'bg-brand-dark/50 border-white/5 text-slate-300'}`}>{s.name}</div>
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
                  <span className="px-3 py-1 rounded text-[10px] font-bold border border-brand-cyan text-brand-cyan">{account.rank}</span>
               </div>
               <h1 className="text-4xl font-display font-bold text-white uppercase mb-4 leading-tight">{account.name}</h1>
               <p className="text-slate-400 text-sm border-l-2 border-brand-accent pl-4 italic">{account.description || "Premium account with verified skins and competitive MMR."}</p>
            </div>

            <div className="bg-brand-surface/40 border border-white/5 rounded-2xl p-6 relative">
               <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Select Duration</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['hours3', 'hours12', 'hours24'] as (keyof Pricing)[]).map((h) => (
                     <button key={h} onClick={() => { setSelectedDuration(h); setShowBookingModal(true); }} className={`p-4 rounded-xl border transition-all ${h === 'hours24' ? 'bg-brand-accent/5 border-brand-accent/30' : 'bg-brand-dark border-white/5'}`}>
                        <div className="text-[10px] text-slate-500 uppercase mb-1">{h === 'hours3' ? '3h' : h === 'hours12' ? '12h' : '24h'}</div>
                        <div className="text-xl font-bold text-white">₹{h === 'hours24' ? Math.floor(account.pricing.hours24 * 0.9) : account.pricing[h]}</div>
                     </button>
                  ))}
               </div>
            </div>

            <button onClick={() => setShowBookingModal(true)} disabled={!isAvailable} className={`w-full py-5 font-bold uppercase rounded-xl transition-all ${isAvailable ? 'bg-white text-brand-darker hover:bg-brand-accent hover:text-white' : 'bg-slate-800 text-slate-500'}`}>{isAvailable ? 'Rent This ID' : 'Currently Locked'}</button>
         </div>
      </div>

      {isImageModalOpen && createPortal(<div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4" onClick={() => setIsImageModalOpen(false)}><img src={account.imageUrl} className="max-w-full max-h-full rounded-lg" /></div>, document.body)}
      {showBookingModal && createPortal(<BookingWizard account={account} selectedDuration={selectedDuration} onClose={() => setShowBookingModal(false)} />, document.body)}
    </div>
  );
};

const BookingWizard = ({ account, selectedDuration, onClose }: any) => {
   const navigate = useNavigate();
   const user = StorageService.getCurrentUser();
   const finalPrice = selectedDuration === 'hours24' ? Math.floor(account.pricing.hours24 * 0.9) : account.pricing[selectedDuration];

   return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
         <div className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-lg">Checkout Order</h3>
               <button onClick={onClose}><X /></button>
            </div>
            <div className="bg-brand-dark p-4 rounded-xl mb-6 flex justify-between items-center border border-white/5">
               <div><div className="text-[10px] text-slate-500 uppercase">Selected Plan</div><div className="font-bold text-white uppercase">{selectedDuration.replace('hours', '')} HOURS</div></div>
               <div className="text-right"><div className="text-[10px] text-slate-500 uppercase">Total</div><div className="text-xl font-bold text-brand-accent">₹{finalPrice}</div></div>
            </div>
            <button onClick={() => { 
               const state = { account, hours: parseInt(selectedDuration.replace('hours','')), price: finalPrice, durationLabel: selectedDuration === 'hours3' ? '3 Hours' : selectedDuration === 'hours12' ? '12 Hours' : '24 Hours', startMode: 'now' };
               navigate(user ? '/checkout' : '/login', { state: user ? state : { returnTo: '/checkout', checkoutState: state } });
            }} className="w-full bg-brand-accent py-4 rounded-xl font-bold text-white hover:bg-red-600 transition-all">{user ? 'Proceed to Payment' : 'Login to Continue'}</button>
         </div>
      </div>
   );
};

export default ProductDetails;
