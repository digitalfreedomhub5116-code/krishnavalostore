
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserCog, Home, Gamepad2, User as UserIcon, LogOut, LayoutDashboard, Zap, Award, Sparkles, X, Trophy } from 'lucide-react';
import { StorageService, DEFAULT_HOME_CONFIG, SITE_LOGO_URL } from '../services/storage';
import { User, HomeConfig } from '../types';
import SkinSearchFloatingBar from './SkinSearchFloatingBar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showBonusPopup, setShowBonusPopup] = useState(false);
  const [prevPoints, setPrevPoints] = useState<number | null>(null);
  const [pointDiff, setPointDiff] = useState<number | null>(null);
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(DEFAULT_HOME_CONFIG);

  const isHomePage = location.pathname === '/';

  // SCROLL TO TOP LOGIC
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [location.pathname]);

  const loadConfig = async () => {
    try {
      const config = await StorageService.getHomeConfig();
      setHomeConfig(config);
    } catch (err) {}
  };

  const syncData = () => {
    const user = StorageService.getCurrentUser();
    
    // Animate point changes
    if (user && prevPoints !== null && user.ultraPoints > prevPoints) {
      const diff = user.ultraPoints - prevPoints;
      setPointDiff(diff);
      setTimeout(() => setPointDiff(null), 4000);
    }
    
    setCurrentUser(user);
    if (user) setPrevPoints(user.ultraPoints);
    
    loadConfig();

    // Show bonus popup if user has exactly 20 points (newly registered) and hasn't seen it this session
    if (user && user.ultraPoints === 20 && !sessionStorage.getItem('bonus_shown')) {
      setShowBonusPopup(true);
      sessionStorage.setItem('bonus_shown', 'true');
    }
  };

  useEffect(() => {
    syncData();
    // Run expiration check immediately on load
    StorageService.checkExpiredBookings();

    // Set up interval to check for expired bookings every minute
    const expiryInterval = setInterval(() => {
        StorageService.checkExpiredBookings();
    }, 60000);

    const unsubscribe = StorageService.subscribe(() => {
      syncData();
    });
    window.addEventListener('storage', syncData);
    return () => {
      clearInterval(expiryInterval);
      unsubscribe();
      window.removeEventListener('storage', syncData);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    StorageService.logoutUser();
    setCurrentUser(null);
    setShowProfileMenu(false);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path ? 'text-brand-accent drop-shadow-[0_0_8px_rgba(255,70,85,0.8)] border-b-2 border-brand-accent' : 'text-slate-400 hover:text-white hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]';
  
  const isTabActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-brand-darker text-slate-100 font-sans flex flex-col selection:bg-brand-accent selection:text-white relative">
      <div className="scanlines"></div>

      {/* Point Earned Floating Animation */}
      {pointDiff !== null && (
        <div className="fixed top-24 right-4 md:right-12 z-[100] pointer-events-none animate-bounce">
           <div className="bg-yellow-500 text-brand-darker px-5 py-2.5 rounded-full font-black shadow-[0_0_40px_#eab308] flex items-center gap-3 scale-125 animate-in slide-in-from-bottom-10 fade-in duration-500">
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>+{pointDiff} ULTRA POINTS</span>
           </div>
        </div>
      )}

      {/* GLOBAL MARQUEE BROADCAST */}
      <div className="w-full bg-black border-b border-white/5 py-2.5 relative z-[60] overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>
        
        <div className="flex whitespace-nowrap animate-marquee">
          {[...homeConfig.marqueeText, ...homeConfig.marqueeText].map((text, i) => (
            <div key={i} className="flex items-center mx-12">
               <Zap size={14} className="text-brand-cyan mr-3 fill-current" />
               <span className="text-[11px] font-bold text-slate-300 tracking-[0.2em] uppercase">
                 {text}
               </span>
               <div className="mx-8 w-1 h-1 rounded-full bg-brand-accent/40"></div>
            </div>
          ))}
        </div>
      </div>

      {/* GLOBAL BRAND HEADER */}
      <div className="w-full bg-black/80 border-b border-white/5 py-6 md:py-10 lg:py-12 flex justify-center items-center relative z-40 overflow-hidden">
        <div className="absolute inset-0 bg-brand-accent/5 pointer-events-none"></div>
        <div className="max-w-7xl w-full px-4 flex items-center justify-center relative">
          <Link to="/" className="flex items-center gap-4 md:gap-6 group relative z-10 transition-transform duration-300 hover:scale-105">
            <img src={SITE_LOGO_URL} alt="Logo" className="h-8 w-8 md:h-12 md:w-12 object-contain transition-all duration-500 group-hover:rotate-12 group-hover:drop-shadow-[0_0_20px_rgba(255,70,85,0.7)]" />
            <div className="flex items-center">
              <span className="font-display font-black text-2xl md:text-5xl lg:text-6xl tracking-tighter text-white whitespace-nowrap uppercase italic">
                KRISHNA <span className="text-brand-accent">VALO</span> STORE
              </span>
              {currentUser && (
                <div className="flex items-center gap-1.5 md:gap-3 ml-3 md:ml-6 px-2.5 md:px-5 py-1 md:py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-500 animate-in fade-in zoom-in duration-700 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                  <Trophy size={18} className="md:w-6 md:h-6 w-4 h-4 animate-pulse" />
                  <span className="font-display font-black text-lg md:text-3xl tracking-tight">
                    {currentUser.ultraPoints || 0}
                  </span>
                </div>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* Navbar */}
      <nav className="hidden md:block sticky top-0 w-full z-30 bg-brand-dark/80 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="hidden md:block w-10"></div>
            
            <div className="flex items-center gap-12">
              <Link to="/" className={`${isActive('/')} px-2 py-1 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300`}>Home</Link>
              <Link to="/browse" className={`${isActive('/browse')} px-2 py-1 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300`}>Available IDs</Link>
              <Link to="/admin" className={`${isActive('/admin')} px-2 py-1 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-1.5`}>
                <UserCog size={14} /> Admin
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {currentUser && (
                <Link to="/dashboard" className="hidden lg:flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-3 py-1 text-[10px] font-black text-yellow-500 uppercase tracking-widest shadow-[0_0_10px_rgba(234,179,8,0.2)] hover:scale-105 transition-all">
                  <Award size={12} className="animate-bounce" />
                  {currentUser.ultraPoints || 0} Ultra Points
                </Link>
              )}

              {currentUser ? (
                <div className="relative">
                    <button 
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-3 bg-brand-dark/50 border border-white/10 hover:border-brand-accent/50 rounded-full pl-2 pr-4 py-1.5 transition-all group backdrop-blur-sm"
                    >
                        <img 
                            src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} 
                            alt="Avatar" 
                            className="w-7 h-7 rounded-full bg-brand-accent/20"
                        />
                        <span className="text-xs font-bold text-white group-hover:text-brand-accent truncate max-w-[80px]">
                            {currentUser.name}
                        </span>
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-brand-surface/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-2 border-b border-white/5">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Signed in as</p>
                                <p className="text-xs font-bold text-white truncate">{currentUser.email}</p>
                            </div>
                            <Link 
                                to="/dashboard"
                                onClick={() => setShowProfileMenu(false)}
                                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 flex items-center gap-2"
                            >
                                <LayoutDashboard className="w-4 h-4" /> My Dashboard
                            </Link>
                            <button 
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
              ) : (
                <Link 
                    to="/login"
                    className="flex items-center gap-2 px-5 py-2 bg-white text-brand-darker font-bold text-xs rounded-full hover:bg-brand-cyan hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] uppercase tracking-widest"
                >
                    <UserIcon className="w-3.5 h-3.5" />
                    LOGIN
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Bonus Popup */}
      {showBonusPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-brand-surface border border-yellow-500/50 rounded-2xl w-full max-w-sm p-8 text-center relative overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.3)]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
              <button onClick={() => setShowBonusPopup(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
              
              <div className="relative inline-block mb-6">
                 <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-20 animate-pulse"></div>
                 <div className="relative w-20 h-20 bg-yellow-500/20 rounded-full border border-yellow-500/50 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-yellow-500" />
                 </div>
              </div>

              <h2 className="text-2xl font-display font-black text-white uppercase tracking-tighter italic mb-2">Welcome Agent!</h2>
              <p className="text-slate-400 text-sm mb-6">We've credited your account with a deployment bonus.</p>
              
              <div className="bg-brand-dark border border-white/5 rounded-xl p-4 mb-8">
                 <div className="text-3xl font-black text-yellow-500">+20</div>
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ultra Points Received</div>
              </div>

              <button 
                onClick={() => setShowBonusPopup(false)}
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-brand-darker font-black rounded-xl transition-all uppercase tracking-widest text-xs shadow-lg shadow-yellow-500/20"
              >
                Let's Play
              </button>
           </div>
        </div>
      )}

      {/* Global Search Bar */}
      <SkinSearchFloatingBar isHomePage={isHomePage} />

      <main className="flex-grow pb-24 md:pb-0 relative z-10">
        {children}
      </main>

      <footer className="bg-brand-dark border-t border-white/5 py-10 mt-12 mb-16 md:mb-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <p className="text-slate-500 text-sm font-mono tracking-wider">© {new Date().getFullYear()} KRISHNA VALO RENTALS. SYSTEM SECURE.</p>
          <div className="mt-6 flex justify-center space-x-8 text-xs font-bold uppercase tracking-widest text-slate-600">
            <span className="hover:text-brand-cyan cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-brand-cyan cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-brand-cyan cursor-pointer transition-colors">Support</span>
            <Link to="/admin" className="hover:text-brand-accent cursor-pointer transition-colors">Admin Access</Link>
          </div>
        </div>
      </footer>

      {/* Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 bg-brand-surface/90 backdrop-blur-xl border border-white/10 rounded-[2rem] h-20 flex justify-around items-center px-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-nav-float">
         <Link to="/" className="p-3 transition-transform active:scale-90">
            <Home className={`${location.pathname === '/' ? 'text-brand-accent drop-shadow-[0_0_8px_rgba(255,70,85,0.6)]' : 'text-slate-500'}`} size={28} />
         </Link>
         
         <Link to="/browse" className="relative -mt-12 p-1">
            <div className="bg-brand-accent rounded-full p-4 border-4 border-brand-darker shadow-[0_10px_30px_rgba(255,70,85,0.5)] transition-all active:scale-95 group">
               <Gamepad2 className="text-white w-8 h-8 group-hover:rotate-12 transition-transform" />
               <div className="absolute inset-0 bg-white/20 rounded-full animate-ping pointer-events-none opacity-20"></div>
            </div>
         </Link>

         {currentUser ? (
           <Link to="/dashboard" className="flex flex-col items-center p-3 active:scale-90 transition-transform">
             <div className="relative">
                <img src={currentUser.avatarUrl} className={`w-9 h-9 rounded-full border-2 transition-all ${pointDiff !== null ? 'border-yellow-500 scale-110 shadow-[0_0_15px_#eab308]' : 'border-white/10'}`} alt="" />
                {currentUser.ultraPoints > 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-brand-darker animate-pulse" />}
             </div>
           </Link>
         ) : (
           <Link to="/login" className="p-3 active:scale-90 transition-transform">
              <UserIcon className="text-slate-500" size={28} />
           </Link>
         )}
      </div>
    </div>
  );
};

export default Layout;
