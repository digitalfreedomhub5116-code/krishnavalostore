
import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { User, Booking, BookingStatus, Account } from '../types';
import { 
  User as UserIcon, Clock, History, LifeBuoy, LogOut, 
  Gamepad2, Calendar, Copy, Eye, EyeOff, ShieldCheck, 
  AlertTriangle, ChevronRight, CheckCircle2, MessageCircle
} from 'lucide-react';

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'rentals' | 'history' | 'profile' | 'support'>('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user data
  useEffect(() => {
    // Fix: Using an internal async function to properly await StorageService calls
    const loadData = async () => {
      const currentUser = StorageService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        const userBookings = await StorageService.getUserBookings(currentUser.id);
        // Sort: Active first, then by date desc
        userBookings.sort((a, b) => {
          if (a.status === BookingStatus.ACTIVE && b.status !== BookingStatus.ACTIVE) return -1;
          if (a.status !== BookingStatus.ACTIVE && b.status === BookingStatus.ACTIVE) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setBookings(userBookings);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleLogout = () => {
    StorageService.logoutUser();
    navigate('/');
  };

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  const activeBookings = bookings.filter(b => b.status === BookingStatus.ACTIVE || b.status === BookingStatus.PENDING);
  const pastBookings = bookings.filter(b => b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CANCELLED);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-brand-surface border border-white/10 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                <div className="text-3xl font-bold text-white mb-1">{activeBookings.length}</div>
                <div className="text-xs text-slate-400 uppercase tracking-widest">Active Rentals</div>
              </div>
              <div className="bg-brand-surface border border-white/10 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                <div className="text-3xl font-bold text-brand-accent mb-1">{pastBookings.length}</div>
                <div className="text-xs text-slate-400 uppercase tracking-widest">Completed</div>
              </div>
            </div>

            {/* Active Rental Highlight */}
            {activeBookings.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   Current Session
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
                           {pastBookings.map(b => (
                             <tr key={b.orderId} className="hover:bg-white/5">
                               <td className="p-4 font-mono">{b.orderId}</td>
                               <td className="p-4 text-white font-medium">{b.accountName}</td>
                               <td className="p-4 text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</td>
                               <td className="p-4">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                                     ${b.status === BookingStatus.COMPLETED ? 'bg-slate-700 text-slate-300' : 'bg-red-900/50 text-red-300'}
                                  `}>
                                     {b.status}
                                  </span>
                               </td>
                               <td className="p-4 text-right font-bold text-white">₹{b.totalPrice}</td>
                             </tr>
                           ))}
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
                      <div className="text-sm text-slate-400">Member Since</div>
                      <div className="font-mono text-white text-sm">{new Date(user.createdAt).toLocaleDateString()}</div>
                   </div>
                   <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors">
                      <div className="text-sm text-slate-400">Last Login</div>
                      <div className="font-mono text-white text-sm">{new Date(user.lastLogin).toLocaleString()}</div>
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
             
             <div className="space-y-2">
               {['Refund Policy', 'Account Rules', 'Ban Safety'].map((item, i) => (
                 <div key={i} className="bg-brand-dark border border-white/5 p-4 rounded-lg flex justify-between items-center hover:border-brand-accent/30 cursor-pointer transition-colors group">
                    <span className="text-slate-300 font-medium group-hover:text-white">{item}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-brand-accent" />
                 </div>
               ))}
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
                     <div className="text-xs text-slate-400 truncate">{user.role}</div>
                  </div>
               </div>
             </div>
             
             <nav className="p-2 space-y-1">
               {[
                 { id: 'overview', icon: Gamepad2, label: 'Dashboard' },
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
  const [progress, setProgress] = useState(100);
  const [isRevealed, setIsRevealed] = useState(false);
  const [accountDetails, setAccountDetails] = useState<Account | undefined>(undefined);

  useEffect(() => {
    // Fix: Awaiting async getAccountById call in subcomponent
    const fetchAccount = async () => {
      if (showCredentials) {
         const acc = await StorageService.getAccountById(booking.accountId);
         setAccountDetails(acc);
      }
    };
    fetchAccount();
  }, [booking.accountId, showCredentials]);

  useEffect(() => {
    if (booking.status !== BookingStatus.ACTIVE) {
       setTimeLeft(booking.status);
       setProgress(0);
       return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(booking.endTime).getTime();
      const start = new Date(booking.startTime).getTime();
      const totalDuration = end - start;
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft("EXPIRED");
        setProgress(0);
        clearInterval(interval);
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        
        const percent = Math.max(0, (distance / totalDuration) * 100);
        setProgress(percent);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple alert for now, could be a toast
    alert("Copied to clipboard!");
  };

  return (
    <div className="bg-brand-surface border border-white/10 rounded-xl overflow-hidden relative group">
      {/* Status Bar */}
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
              {booking.status === BookingStatus.ACTIVE ? (
                 <>
                   <div className="text-sm text-slate-400 uppercase tracking-wide text-[10px] font-bold">Time Remaining</div>
                   <div className="text-2xl font-mono font-bold text-brand-cyan tabular-nums tracking-tight">
                      {timeLeft}
                   </div>
                 </>
              ) : (
                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-xs font-bold uppercase">
                  {booking.status}
                </span>
              )}
           </div>
        </div>

        {showCredentials && booking.status === BookingStatus.ACTIVE && accountDetails && (
          <div className="mt-6 bg-brand-dark/50 border border-white/5 rounded-lg p-4 relative overflow-hidden">
             
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

        {booking.status === BookingStatus.PENDING && (
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
