
import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { User, Booking, Account } from '../types'; // Removed BookingStatus import to force string usage
import { 
  User as UserIcon, Clock, History, LifeBuoy, LogOut, 
  Gamepad2, Calendar, Copy, Eye, EyeOff, ShieldCheck, 
  AlertTriangle, ChevronRight, CheckCircle2, MessageCircle, Award, Gift, Gem, Sparkles, Lock, Timer, CalendarClock
} from 'lucide-react';

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'rentals' | 'history' | 'profile' | 'support' | 'rewards'>('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user data
  useEffect(() => {
    const loadData = async () => {
      const currentUser = StorageService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        const userBookings = await StorageService.getUserBookings(currentUser.id);
        
        userBookings.sort((a, b) => {
          // Explicitly cast to any to bypass TS strict enum overlap checks
          const statusA = a.status as any;
          const statusB = b.status as any;
          
          const isActiveA = statusA === 'ACTIVE' || statusA === 'PRE_BOOKED';
          const isActiveB = statusB === 'ACTIVE' || statusB === 'PRE_BOOKED';
          
          if (isActiveA && !isActiveB) return -1;
          if (!isActiveA && isActiveB) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setBookings(userBookings);
      }
      setLoading(false);
    };
    loadData();
    
    const unsubscribe = StorageService.subscribe(loadData);
    return () => { unsubscribe(); };
  }, []);

  const handleLogout = () => {
    StorageService.logoutUser();
    navigate('/');
  };

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  const activeBookings = bookings.filter(b => {
      const s = b.status as any;
      return s === 'ACTIVE' || s === 'PENDING' || s === 'PRE_BOOKED';
  });
  const pastBookings = bookings.filter(b => {
      const s = b.status as any;
      return s === 'COMPLETED' || s === 'CANCELLED';
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Ultra Points Hero */}
            <div className="bg-gradient-to-br from-yellow-600/20 to-brand-surface border border-yellow-500/30 rounded-2xl p-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Award size={120} className="text-yellow-500 rotate-12" />
               </div>
               <div className="relative z-10">
                  <div className="flex items-center gap-2 text-yellow-500 font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                     <Sparkles size={14} /> Ultra Wallet
                  </div>
                  <div className="flex items-end gap-3 mb-6">
                     <div className="text-5xl font-display font-black text-white">{user.ultraPoints || 0}</div>
                     <div className="text-yellow-500 font-bold mb-1 uppercase tracking-widest text-xs">Points</div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('rewards')}
                    className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-brand-darker font-black text-[10px] rounded-lg transition-all uppercase tracking-widest"
                  >
                    View Rewards
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-brand-surface border border-white/10 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                <div className="text-3xl font-bold text-white mb-1">{activeBookings.length}</div>
                <div className="text-xs text-slate-400 uppercase tracking-widest">Active/Upcoming</div>
              </div>
              <div className="bg-brand-surface border border-white/10 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                <div className="text-3xl font-bold text-brand-accent mb-1">{pastBookings.length}</div>
                <div className="text-xs text-slate-400 uppercase tracking-widest">History</div>
              </div>
            </div>

            {activeBookings.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   Current Sessions
                </h3>
                {activeBookings.map(booking => (
                  <RentalCard key={booking.orderId} booking={booking} />
                ))}
              </div>
            ) : (
              <div className="bg-brand-surface/50 border border-dashed border-white/10 rounded-xl p-8 text-center">
                 <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                 <h3 className="text-xl font-bold text-white mb-2">No Active Rentals</h3>
                 <p className="text-slate-400 text-sm mb-6">Ready to dominate the lobby? Rent a premium ID now.</p>
                 <button 
                   onClick={() => navigate('/browse')}
                   className="px-6 py-3 bg-brand-accent hover:bg-red-600 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-2"
                 >
                   Browse Inventory <ChevronRight className="w-4 h-4" />
                 </button>
              </div>
            )}
          </div>
        );
      
      case 'rewards':
        const pointsProgress = Math.min((user.ultraPoints / 500) * 100, 100);
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="bg-brand-surface border border-white/10 rounded-2xl p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                   <div>
                      <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tight mb-2">Reward Milestones</h2>
                      <p className="text-slate-400 text-sm">Reach 500 Ultra Points to claim your first reward.</p>
                   </div>
                   <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 text-center min-w-[120px]">
                      <div className="text-2xl font-black text-yellow-500">{user.ultraPoints || 0}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Your Balance</div>
                   </div>
                </div>

                <div className="space-y-12">
                   {/* milestone 1 */}
                   <div className={`relative p-6 rounded-2xl border transition-all ${user.ultraPoints >= 500 ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-brand-dark/50 border-white/5 opacity-60'}`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                         <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${user.ultraPoints >= 500 ? 'bg-yellow-500 text-brand-dark' : 'bg-white/5 text-slate-500'}`}>
                               <Gem size={24} />
                            </div>
                            <div>
                               <h3 className="font-bold text-white uppercase tracking-widest text-sm">Elite Valorant Voucher</h3>
                               <p className="text-[10px] text-slate-500 uppercase tracking-widest">1000 VP Code Delivery</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="text-lg font-black text-white">500 UP</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Required</div>
                         </div>
                      </div>
                      
                      <div className="h-2 bg-brand-dark rounded-full overflow-hidden mb-6 border border-white/5">
                         <div className="h-full bg-yellow-500 rounded-full transition-all duration-1000" style={{ width: `${pointsProgress}%` }} />
                      </div>

                      <button 
                        disabled={user.ultraPoints < 500}
                        className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all
                          ${user.ultraPoints >= 500 
                            ? 'bg-yellow-500 hover:bg-yellow-400 text-brand-dark shadow-lg shadow-yellow-500/20' 
                            : 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'
                          }`}
                      >
                        {user.ultraPoints >= 500 ? 'CLAIM 1000 VP VOUCHER' : `${500 - user.ultraPoints} POINTS REMAINING`}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        );

      case 'rentals':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-white mb-4">My Rentals</h2>
            {activeBookings.length === 0 && (
              <p className="text-slate-500 text-center py-10">You have no active rentals.</p>
            )}
            {activeBookings.map(booking => (
              <RentalCard key={booking.orderId} booking={booking} showCredentials={true} />
            ))}
          </div>
        );

      case 'history':
        return (
           <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <h2 className="text-xl font-bold text-white mb-4">Booking History</h2>
             {pastBookings.length === 0 ? (
               <p className="text-slate-500 text-center py-10">No history found.</p>
             ) : (
                <div className="bg-brand-surface border border-white/10 rounded-xl overflow-hidden">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-black/20 text-slate-400">
                           <tr>
                             <th className="p-4">Order ID</th>
                             <th className="p-4">Account</th>
                             <th className="p-4">Date</th>
                             <th className="p-4">Status</th>
                             <th className="p-4 text-right">Price</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {pastBookings.map(b => {
                             const status = b.status as any;
                             return (
                               <tr key={b.orderId} className="hover:bg-white/5">
                                 <td className="p-4 font-mono">{b.orderId}</td>
                                 <td className="p-4 text-white font-medium">{b.accountName}</td>
                                 <td className="p-4 text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</td>
                                 <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                                       ${status === 'COMPLETED' ? 'bg-slate-700 text-slate-300' : 'bg-red-900/50 text-red-300'}
                                    `}>
                                       {b.status}
                                    </span>
                                 </td>
                                 <td className="p-4 text-right font-bold text-white">₹{b.totalPrice}</td>
                               </tr>
                             );
                           })}
                        </tbody>
                      </table>
                   </div>
                </div>
             )}
           </div>
        );

      case 'profile':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="bg-brand-surface border border-white/10 rounded-xl p-6 max-w-2xl mx-auto">
                <div className="flex flex-col items-center mb-8">
                   <div className="w-24 h-24 rounded-full border-2 border-brand-accent p-1 mb-4">
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full bg-brand-dark object-cover" />
                   </div>
                   <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                   <p className="text-slate-400">{user.email}</p>
                   <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-bold border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Online
                   </div>
                </div>
                
                <div className="space-y-4 border-t border-white/10 pt-6">
                   <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors">
                      <div className="text-sm text-slate-400">Account ID</div>
                      <div className="font-mono text-white text-sm">{user.id}</div>
                   </div>
                   <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors">
                      <div className="text-sm text-slate-400">Ultra Points</div>
                      <div className="font-mono text-yellow-500 text-sm font-bold">{user.ultraPoints || 0} UP</div>
                   </div>
                   <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors">
                      <div className="text-sm text-slate-400">Member Since</div>
                      <div className="font-mono text-white text-sm">{new Date(user.createdAt).toLocaleDateString()}</div>
                   </div>
                </div>
             </div>
          </div>
        );
        
      case 'support':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto">
             <div className="bg-brand-surface border border-white/10 rounded-xl p-8 text-center mb-6">
                <LifeBuoy className="w-16 h-16 text-brand-cyan mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Need Help?</h2>
                <p className="text-slate-400 mb-6">Our support team is available 24/7 via WhatsApp.</p>
                <button 
                  onClick={() => window.open('https://wa.me/919860185116', '_blank')}
                  className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 mx-auto transition-all hover:scale-105"
                >
                  <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
                </button>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-brand-surface border border-white/10 rounded-xl overflow-hidden sticky top-24">
             <div className="p-6 border-b border-white/10 bg-gradient-to-br from-brand-accent/20 to-transparent">
               <div className="flex items-center gap-3">
                  <img src={user.avatarUrl} className="w-10 h-10 rounded-full border border-white/20" alt="" />
                  <div className="overflow-hidden">
                     <div className="font-bold text-white truncate">{user.name}</div>
                     <div className="text-xs text-slate-400 truncate uppercase tracking-tighter">{user.role} // {user.ultraPoints} UP</div>
                  </div>
               </div>
             </div>
             
             <nav className="p-2 space-y-1">
               {[
                 { id: 'overview', icon: Gamepad2, label: 'Dashboard' },
                 { id: 'rewards', icon: Award, label: 'Ultra Rewards' },
                 { id: 'rentals', icon: Clock, label: 'My Rentals' },
                 { id: 'history', icon: History, label: 'Booking History' },
                 { id: 'profile', icon: UserIcon, label: 'Profile' },
                 { id: 'support', icon: LifeBuoy, label: 'Support' },
               ].map((item) => (
                 <button
                   key={item.id}
                   onClick={() => setActiveTab(item.id as any)}
                   className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                     ${activeTab === item.id 
                       ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' 
                       : 'text-slate-400 hover:text-white hover:bg-white/5'
                     }
                   `}
                 >
                   <item.icon className="w-4 h-4" />
                   {item.label}
                 </button>
               ))}
               
               <div className="pt-2 mt-2 border-t border-white/5">
                 <button 
                   onClick={handleLogout}
                   className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                 >
                   <LogOut className="w-4 h-4" />
                   Log Out
                 </button>
               </div>
             </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-h-[500px]">
           {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const RentalCard: React.FC<{ booking: Booking, showCredentials?: boolean }> = ({ booking, showCredentials }) => {
  const [timeLeft, setTimeLeft] = useState<string>('--:--:--');
  const [timeLabel, setTimeLabel] = useState<string>('Time Remaining');
  const [progress, setProgress] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [accountDetails, setAccountDetails] = useState<Account | undefined>(undefined);
  
  // Explicitly ANY cast to remove TS overlap errors
  const status = booking.status as any;
  const isPreBooked = status === 'PRE_BOOKED';
  const isActive = status === 'ACTIVE';
  const isPending = status === 'PENDING';
  const isExpired = status === 'COMPLETED' || status === 'CANCELLED';

  useEffect(() => {
    const fetchAccount = async () => {
      // ONLY fetch details if Active. Security Feature.
      if (showCredentials && isActive) {
         const acc = await StorageService.getAccountById(booking.accountId);
         setAccountDetails(acc);
      } else {
         setAccountDetails(undefined); // Ensure clear if status changes back (rare but safer)
      }
    };
    fetchAccount();
  }, [booking.accountId, showCredentials, isActive]);

  useEffect(() => {
    if (isExpired || isPending) return;

    const interval = setInterval(async () => {
      const now = new Date().getTime();
      const end = new Date(booking.endTime).getTime();
      const start = new Date(booking.startTime).getTime();
      
      const currentStatus = booking.status as any;

      if (currentStatus === 'PRE_BOOKED') {
         // PRE-BOOKING DISPLAY - Wait until start time
         // The syncBooking check will flip it to ACTIVE when start time is reached
         const diff = start - now;
         
         if (diff <= 1000) {
            await StorageService.syncBooking(booking.orderId);
         } else {
             // Show countdown for PRE_BOOKED
             const h = Math.floor(diff / 3600000);
             const m = Math.floor((diff % 3600000) / 60000);
             const s = Math.floor((diff % 60000) / 1000);
             setTimeLeft(`${h}h ${m}m ${s}s`);
             setTimeLabel('Starts In');
         }
      } else if (now < end) {
         // ACTIVE COUNTDOWN
         // If status is still PRE_BOOKED but time has passed, force sync immediately
         if (currentStatus === 'PRE_BOOKED') {
            await StorageService.syncBooking(booking.orderId);
         }

         const totalDuration = end - start;
         const remaining = end - now;
         const h = Math.floor(remaining / 3600000);
         const m = Math.floor((remaining % 3600000) / 60000);
         const s = Math.floor((remaining % 60000) / 1000);
         setTimeLeft(`${h}h ${m}m ${s}s`);
         setTimeLabel('Time Remaining');
         const percent = Math.max(0, (remaining / totalDuration) * 100);
         setProgress(percent);
      } else {
         setTimeLeft("EXPIRED");
         setProgress(0);
         // Force sync on expire to cleanup
         if (currentStatus === 'ACTIVE') {
            await StorageService.syncBooking(booking.orderId);
         }
         clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking, isExpired, isPending]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const startObj = new Date(booking.startTime);
  
  return (
    <div className={`bg-brand-surface border rounded-xl overflow-hidden relative group transition-all duration-300 ${isActive ? 'border-brand-accent/50 shadow-[0_0_20px_rgba(255,70,85,0.1)]' : 'border-white/10'}`}>
      
      {/* Progress Bar (Only for Active) */}
      <div className="h-1 bg-gray-800 w-full">
         <div 
           className={`h-full transition-all duration-1000 ease-linear ${progress < 20 ? 'bg-red-500' : 'bg-brand-accent'}`} 
           style={{ width: `${progress}%` }}
         />
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
           <div>
             <h3 className="font-bold text-xl text-white mb-1">{booking.accountName}</h3>
             <div className="flex items-center gap-2 text-sm text-slate-400">
               <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono">{booking.orderId}</span>
               <span>•</span>
               <span>{booking.durationLabel}</span>
             </div>
           </div>
           
           <div className="text-right">
              {isActive ? (
                 <>
                   <div className="text-sm text-slate-400 uppercase tracking-wide text-[10px] font-bold">{timeLabel}</div>
                   <div className="text-2xl font-mono font-bold tabular-nums tracking-tight text-brand-cyan">
                      {timeLeft}
                   </div>
                 </>
              ) : (
                <span className={`px-3 py-1 border rounded-full text-xs font-bold uppercase ${status === 'CANCELLED' ? 'bg-slate-700/50 text-slate-400 border-white/10' : (isPreBooked ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20')}`}>
                  {isPreBooked ? 'CONFIRMED' : status}
                </span>
              )}
           </div>
        </div>

        {/* --- LOCKED PRE-BOOKED STATE --- */}
        {showCredentials && isPreBooked && (
            <div className="mt-6 bg-purple-500/5 border border-purple-500/20 rounded-lg p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group/lock">
                <div className="absolute inset-0 bg-purple-500/5 blur-xl group-hover/lock:bg-purple-500/10 transition-colors"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(168,85,247,0.3)] animate-pulse">
                        <Lock className="w-8 h-8 text-purple-400" />
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-widest mb-3">
                        <CalendarClock size={12} /> Scheduled
                    </div>
                    {/* Countdown for Pre-Booked Status */}
                    <h4 className="text-white font-bold text-lg mb-2 uppercase tracking-wide">Your booking starts in</h4>
                    <div className="text-xl md:text-4xl font-mono font-black text-white mb-4 tabular-nums tracking-tight">
                       {timeLeft}
                    </div>
                    <div className="flex items-center gap-2 text-purple-300 text-xs bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20 mb-2">
                       <Lock size={12} />
                       <span className="uppercase font-bold tracking-wider">Credentials Locked</span>
                    </div>
                    <p className="text-slate-400 text-xs max-w-sm">
                        Access to ID & Password will unlock automatically at the scheduled time.
                    </p>
                </div>
            </div>
        )}

        {/* --- ACTIVE CREDENTIALS --- */}
        {showCredentials && isActive && accountDetails && (
          <div className="mt-6 bg-brand-dark/50 border border-white/5 rounded-lg p-4 relative overflow-hidden animate-in fade-in zoom-in-95">
             
             {!isRevealed ? (
               <div className="absolute inset-0 z-10 backdrop-blur-md bg-black/60 flex flex-col items-center justify-center text-center p-4">
                  <ShieldCheck className="w-8 h-8 text-brand-accent mb-2" />
                  <h4 className="text-white font-bold mb-1">Secure Credentials</h4>
                  <p className="text-xs text-slate-400 mb-3 max-w-[250px]">
                    Do not share these details. Misuse will result in an immediate ban.
                  </p>
                  <button 
                    onClick={() => setIsRevealed(true)}
                    className="px-4 py-2 bg-white text-black font-bold text-sm rounded hover:bg-slate-200 transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> Reveal Login
                  </button>
               </div>
             ) : (
               <div className="absolute top-2 right-2 z-20">
                  <button onClick={() => setIsRevealed(false)} className="text-slate-500 hover:text-white p-1">
                     <EyeOff className="w-4 h-4" />
                  </button>
               </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Username</label>
                   <div className="flex items-center gap-2 bg-black/40 p-2 rounded border border-white/5 group/field">
                      <code className="flex-1 text-sm font-mono text-brand-cyan truncate">{accountDetails.username || 'Hidden'}</code>
                      <button onClick={() => copyToClipboard(accountDetails.username || '')} className="text-slate-500 hover:text-white opacity-0 group-hover/field:opacity-100 transition-opacity">
                         <Copy className="w-4 h-4" />
                      </button>
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Password</label>
                   <div className="flex items-center gap-2 bg-black/40 p-2 rounded border border-white/5 group/field">
                      <code className="flex-1 text-sm font-mono text-brand-cyan truncate">{accountDetails.password || '********'}</code>
                      <button onClick={() => copyToClipboard(accountDetails.password || '')} className="text-slate-500 hover:text-white opacity-0 group-hover/field:opacity-100 transition-opacity">
                         <Copy className="w-4 h-4" />
                      </button>
                   </div>
                </div>
             </div>
             
             {isRevealed && (
               <div className="mt-3 flex items-start gap-2 text-xs text-yellow-500/80 bg-yellow-500/5 p-2 rounded">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  <p>Do not change the email or password. The system auto-detects changes and will lock your account.</p>
               </div>
             )}
          </div>
        )}

        {isPending && (
          <div className="mt-4 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
               <Clock className="w-4 h-4 text-blue-400 animate-spin-slow" />
             </div>
             <div>
               <p className="text-sm font-bold text-blue-100">Verification Pending</p>
               <p className="text-xs text-blue-300/70">Admin is verifying your payment. Refresh in 2-5 mins.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
