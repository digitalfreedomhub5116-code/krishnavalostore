
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, UserCog, Home, Gamepad2, User as UserIcon, LogOut, LayoutDashboard, Zap } from 'lucide-react';
import { StorageService, DEFAULT_HOME_CONFIG } from '../services/storage';
import { User, HomeConfig } from '../types';
import SkinSearchFloatingBar from './SkinSearchFloatingBar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(DEFAULT_HOME_CONFIG);

  const isHomePage = location.pathname === '/';

  const loadConfig = async () => {
    try {
      const config = await StorageService.getHomeConfig();
      setHomeConfig(config);
    } catch (err) {
      console.error("Failed to load global config:", err);
    }
  };

  const syncData = () => {
    setCurrentUser(StorageService.getCurrentUser());
    loadConfig();
  };

  // Listen for user changes and config changes
  useEffect(() => {
    syncData();
    
    // Subscribe to internal StorageService updates (replaces direct Event constructor)
    const unsubscribe = StorageService.subscribe(() => {
      syncData();
    });

    // Native storage event (dispatched by browser for other tabs) is still safe to listen to
    window.addEventListener('storage', syncData);
    
    return () => {
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
      {/* CRT Scanline Effect Overlay */}
      <div className="scanlines"></div>

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

      {/* GLOBAL BRAND HEADER - Non-sticky */}
      <div className="w-full bg-black/80 border-b border-white/5 py-6 md:py-10 lg:py-12 flex justify-center items-center relative z-40 overflow-hidden">
        <div className="absolute inset-0 bg-brand-accent/5 pointer-events-none"></div>
        <div className="max-w-7xl w-full px-4 flex items-center justify-center relative">
          <Link to="/" className="flex items-center gap-4 md:gap-6 group relative z-10 transition-transform duration-300 hover:scale-105">
            <Shield className="h-8 w-8 md:h-12 md:w-12 text-brand-accent transition-all duration-500 group-hover:rotate-12 group-hover:drop-shadow-[0_0_20px_rgba(255,70,85,0.7)]" />
            <span className="font-display font-black text-2xl md:text-5xl lg:text-6xl tracking-tighter text-white whitespace-nowrap uppercase italic">
              KRISHNA <span className="text-brand-accent">VALO</span> STORE
            </span>
          </Link>
        </div>
      </div>

      {/* Navbar - Sticky Navigation */}
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

            <div className="flex items-center">
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

      {/* Global Search Bar */}
      <SkinSearchFloatingBar isHomePage={isHomePage} />

      <main className="flex-grow pb-20 md:pb-0 relative z-10">
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

      {/* Bottom Navigation Bar (Mobile Only) */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-[#0f172a]/70 backdrop-blur-lg border border-white/10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] animate-nav-float">
        <div className="flex justify-around items-center h-16 px-2">
          <Link to="/" className="flex flex-col items-center justify-center w-full h-full">
             <Home className={`w-6 h-6 ${isTabActive('/') ? 'text-brand-accent' : 'text-slate-500'}`} />
          </Link>
          <Link to="/browse" className="relative flex flex-col items-center justify-center w-full h-full">
             <div className={`absolute -top-6 bg-brand-darker border-4 border-brand-dark rounded-full p-3 transition-all ${isTabActive('/browse') ? 'shadow-[0_0_20px_rgba(0,240,255,0.6)] border-brand-cyan' : 'border-white/10'}`}>
                <Gamepad2 className={`w-6 h-6 ${isTabActive('/browse') ? 'text-brand-cyan' : 'text-slate-400'}`} />
             </div>
             <span className="mt-8 text-[10px] font-bold text-slate-500">RENT</span>
          </Link>
          {currentUser ? (
             <Link to="/dashboard" className="flex flex-col items-center justify-center w-full h-full">
                <img src={currentUser.avatarUrl} className={`w-6 h-6 rounded-full border ${isTabActive('/dashboard') ? 'border-brand-accent' : 'border-white/20'}`} alt="Me" />
             </Link>
          ) : (
            <Link to="/login" className="flex flex-col items-center justify-center w-full h-full">
                <UserIcon className={`w-6 h-6 ${isTabActive('/login') ? 'text-brand-accent' : 'text-slate-500'}`} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Layout;
