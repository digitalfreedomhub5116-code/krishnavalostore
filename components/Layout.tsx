
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserCog, Home, Gamepad2, User as UserIcon, LogOut, LayoutDashboard, Zap, Award, Sparkles, X, Trophy, Shield } from 'lucide-react';
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
  const [scrolled, setScrolled] = useState(false);
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(DEFAULT_HOME_CONFIG);

  const isHomePage = location.pathname === '/';

  // SCROLL TO TOP LOGIC
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [location.pathname]);

  // SCROLL LISTENER FOR HEADER
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const isActive = (path: string) => location.pathname === path;
  
  // Mobile Navigation Items
  const mobileNavItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Rent', path: '/browse', icon: Gamepad2 },
    { label: currentUser ? 'Profile' : 'Login', path: currentUser ? '/dashboard' : '/login', icon: currentUser ? UserIcon : UserIcon },
  ];

  return (
    <div className="min-h-screen bg-brand-darker text-slate-100 font-sans flex flex-col selection:bg-brand-accent selection:text-white relative">
      
      {/* TOP MARQUEE (As requested in image) */}
      <div className="bg-black/40 border-b border-white/5 backdrop-blur-sm relative z-[60] overflow-hidden h-8 flex items-center">
         <div className="animate-marquee whitespace-nowrap flex items-center gap-8 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase w-full">
            <span className="flex items-center gap-2"><Zap size={10} className="text-yellow-400" /> NEW RADIANT BUNDLES ADDED TO INVENTORY</span>
            <span className="flex items-center gap-2 text-brand-accent">⚡ GET 10% OFF ON ALL 24-HOUR RENTALS</span>
            <span className="flex items-center gap-2"><Shield size={10} className="text-green-400" /> VANGUARD BYPASS SECURED - 0% BAN RATE</span>
            <span className="flex items-center gap-2"><Zap size={10} className="text-yellow-400" /> NEW RADIANT BUNDLES ADDED TO INVENTORY</span>
         </div>
      </div>

      {/* Point Earned Floating Animation */}
      {pointDiff !== null && (
        <div className="fixed top-24 right-4 md:right-12 z-[100] pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/50 px-4 py-2 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.4)]">
              <Sparkles className="text-yellow-400 w-5 h-5 animate-spin-slow" />
              <span className="text-yellow-400 font-black text-xl">+{pointDiff} UP</span>
           </div>
        </div>
      )}

      {/* Bonus Popup */}
      {showBonusPopup && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-brand-surface border border-yellow-500/30 rounded-2xl p-8 max-w-sm relative text-center shadow-[0_0_50px_rgba(234,179,8,0.2)]">
               <button onClick={() => setShowBonusPopup(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
               <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <Award size={40} className="text-yellow-500" />
               </div>
               <h3 className="text-2xl font-black text-white italic uppercase mb-2">Welcome Bonus!</h3>
               <p className="text-slate-400 mb-6">You've received <span className="text-yellow-500 font-bold">20 Ultra Points</span> for joining the elite.</p>
               <button onClick={() => setShowBonusPopup(false)} className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-brand-darker font-black uppercase tracking-widest rounded-lg">Claim Reward</button>
            </div>
         </div>
      )}

      {/* DESKTOP & MOBILE NAVIGATION BAR */}
      <header 
        className={`absolute top-8 left-0 right-0 z-50 transition-all duration-500 
        ${scrolled 
          ? 'bg-brand-darker/90 backdrop-blur-xl border-b border-white/10 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
          : 'bg-transparent border-b border-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center md:justify-between relative">
           
           {/* Mobile: Centered Logo exactly like image */}
           {/* Desktop: Logo Left */}
           <Link to="/" className="flex items-center gap-3 group relative z-10">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-brand-accent fill-transparent stroke-[2px]" />
              <div>
                 <h1 className="font-display font-black text-xl md:text-2xl tracking-tighter uppercase italic leading-none text-white">
                    KRISHNA <span className="text-brand-accent">VALO STORE</span>
                 </h1>
              </div>
           </Link>
           
           {/* Global Search Bar (Visible on Mobile & Desktop) */}
           <SkinSearchFloatingBar isHomePage={isHomePage} />

           {/* Desktop Menu (Hidden on Mobile) */}
           <div className="hidden md:flex items-center gap-8">
              <nav className="flex items-center gap-2">
                 {[
                   { path: '/', label: 'Home' },
                   { path: '/browse', label: 'Inventory' }
                 ].map((link) => (
                   <Link 
                     key={link.path}
                     to={link.path} 
                     className="relative px-4 py-2 group overflow-hidden"
                   >
                     <span className={`relative z-10 text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${isActive(link.path) ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                       {link.label}
                     </span>
                     <span className={`absolute bottom-0 left-0 h-[2px] bg-brand-accent transition-all duration-300 ${isActive(link.path) ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                   </Link>
                 ))}
              </nav>

              {/* Desktop Profile / Login */}
              <div>
                {currentUser ? (
                  <div className="relative">
                     <button 
                       onClick={() => setShowProfileMenu(!showProfileMenu)} 
                       className={`flex items-center gap-3 pl-3 pr-1 py-1 rounded-full border transition-all duration-300 ${showProfileMenu ? 'bg-white/10 border-brand-accent' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                     >
                        <div className="text-right">
                           <div className="text-xs font-bold text-white leading-none">{currentUser.name}</div>
                           <div className="text-[9px] text-yellow-500 font-mono leading-none mt-1">{currentUser.ultraPoints} UP</div>
                        </div>
                        <img src={currentUser.avatarUrl} alt="" className="w-9 h-9 rounded-full bg-brand-surface object-cover border border-white/10" />
                     </button>
                     
                     {showProfileMenu && (
                       <>
                       <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                       <div className="absolute right-0 top-full mt-3 w-64 bg-brand-surface/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="p-5 border-b border-white/5 bg-brand-dark/30">
                             <div className="font-bold text-white truncate text-base">{currentUser.name}</div>
                             <div className="text-xs text-slate-500 truncate font-mono">{currentUser.email}</div>
                          </div>
                          <div className="p-2 space-y-1">
                             {currentUser.role === 'admin' && (
                               <Link to="/admin/dashboard" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-brand-cyan hover:bg-brand-cyan/10 rounded-lg transition-colors font-bold">
                                  <UserCog size={16} /> Admin Panel
                               </Link>
                             )}
                             <Link to="/dashboard" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                <LayoutDashboard size={16} /> Dashboard
                             </Link>
                             <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg text-left transition-colors">
                                <LogOut size={16} /> Logout
                             </button>
                          </div>
                       </div>
                       </>
                     )}
                  </div>
                ) : (
                  <Link to="/login" className="group relative px-6 py-2.5 bg-white text-brand-darker font-black text-xs uppercase tracking-widest rounded-none skew-x-[-10deg] transition-all hover:scale-105 active:scale-95 overflow-hidden">
                     <span className="relative z-10 skew-x-[10deg] inline-block">Agent Login</span>
                     <div className="absolute inset-0 bg-brand-accent transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                  </Link>
                )}
              </div>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 md:pt-32">
         {children}
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-white/5 pt-16 pb-32 md:pb-8 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-accent/50 to-transparent"></div>
         <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
               <div className="col-span-1 md:col-span-2">
                  <Link to="/" className="flex items-center gap-3 mb-6">
                     <img src={SITE_LOGO_URL} alt="" className="w-8 h-8 opacity-80 grayscale" />
                     <span className="font-display font-black text-xl text-white uppercase italic tracking-wide">Krishna <span className="text-brand-accent">Valo</span></span>
                  </Link>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-sm mb-6">
                     India's premier Valorant account rental platform. Verified skins, ranked ready, and instant delivery via automated protocols.
                  </p>
               </div>
               
               <div>
                  <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Navigation</h4>
                  <ul className="space-y-3 text-sm text-slate-500">
                     <li><Link to="/" className="hover:text-brand-accent transition-colors">Home Base</Link></li>
                     <li><Link to="/browse" className="hover:text-brand-accent transition-colors">Inventory</Link></li>
                     <li><Link to="/login" className="hover:text-brand-accent transition-colors">Agent Login</Link></li>
                     <li><Link to="/dashboard" className="hover:text-brand-accent transition-colors">Dashboard</Link></li>
                  </ul>
               </div>

               <div>
                  <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Legal</h4>
                  <ul className="space-y-3 text-sm text-slate-500">
                     <li><a href="#" className="hover:text-brand-accent transition-colors">Terms of Service</a></li>
                     <li><a href="#" className="hover:text-brand-accent transition-colors">Privacy Policy</a></li>
                     <li><a href="#" className="hover:text-brand-accent transition-colors">Refund Policy</a></li>
                     <li><a href="#" className="hover:text-brand-accent transition-colors">Support</a></li>
                  </ul>
               </div>
            </div>
            
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
                  © 2024 Krishna Valo Store. All Rights Reserved.
               </div>
               <div className="flex items-center gap-6">
                  <Link to="/admin" className="text-[10px] text-slate-800 hover:text-brand-accent font-mono uppercase tracking-widest transition-colors">
                     Admin Panel
                  </Link>
               </div>
            </div>
         </div>
      </footer>

      {/* MOBILE FLOATING BOTTOM NAVIGATION (Replica from Image) */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 animate-reveal-up">
        <div className="bg-[#0f1219]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex justify-between items-center px-4 py-2 ring-1 ring-white/5 animate-nav-float">
           
           {mobileNavItems.map((item, idx) => {
             const active = isActive(item.path);
             return (
               <Link 
                 key={item.path} 
                 to={item.path}
                 className="flex-1 flex items-center justify-center relative group"
               >
                  <div className={`
                    relative flex items-center justify-center transition-all duration-300
                    ${active 
                       ? 'w-12 h-12 bg-brand-accent rounded-full shadow-[0_0_20px_rgba(255,70,85,0.5)] -translate-y-2 border-4 border-[#020617]' 
                       : 'w-10 h-10 text-slate-500'
                    }
                  `}>
                     <item.icon 
                       size={active ? 20 : 22} 
                       className={`transition-colors duration-300 ${active ? 'text-white fill-white/20' : 'text-slate-500 stroke-[1.5px]'}`} 
                     />
                  </div>
               </Link>
             );
           })}
        </div>
      </div>

    </div>
  );
};

export default Layout;
