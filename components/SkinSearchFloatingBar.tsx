
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';

interface SkinSearchFloatingBarProps {
  isHomePage: boolean;
}

const SkinSearchFloatingBar: React.FC<SkinSearchFloatingBarProps> = ({ isHomePage }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [arrivalPulse, setArrivalPulse] = useState(false);
  const prevIsHome = useRef(isHomePage);

  // Trigger a pulse effect when the bar finishes docking into the header
  useEffect(() => {
    if (prevIsHome.current && !isHomePage) {
      setArrivalPulse(true);
      const timer = setTimeout(() => setArrivalPulse(false), 1000);
      return () => clearTimeout(timer);
    }
    prevIsHome.current = isHomePage;
  }, [isHomePage]);

  // Sync with URL query param if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) setQuery(q);
  }, [location.search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/browse?q=${encodeURIComponent(query.trim())}`);
      setIsFocused(false);
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement) activeElement.blur();
    }
  };
  
  const handleClear = () => {
      setQuery('');
      navigate('/browse');
  };

  const mode = isHomePage ? 'hero' : 'header';

  return (
    <>
        {/* Backdrop - Only when focused */}
        <div 
            className={`fixed inset-0 bg-black/60 backdrop-blur-[6px] z-[55] transition-all duration-700 ${isFocused ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsFocused(false)}
        />

        {/* Floating Bar Container */}
        <div 
            className={`${(isHomePage && !isFocused) ? 'absolute' : 'fixed'} z-[60] transition-all duration-[850ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] 
                ${isFocused 
                    ? 'top-28 md:top-40 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] md:w-[600px] scale-100' 
                    : mode === 'hero'
                        ? 'top-48 md:top-80 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-[320px] md:w-fit scale-100'
                        : 'top-4 right-3 md:right-8 w-fit translate-x-0 scale-90 md:scale-100'
                }
            `}
        >
            {/* Arrival Pulse Glow (Header Mode Only) */}
            {arrivalPulse && !isHomePage && (
              <div className="absolute inset-0 bg-brand-cyan/40 rounded-full animate-ping pointer-events-none"></div>
            )}

            <div className={`transition-all duration-500 ${!isFocused && mode === 'hero' ? 'animate-float' : ''}`}>
                {/* Visual Glow Layer */}
                <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 
                  ${isFocused 
                    ? 'bg-brand-cyan/20 opacity-100 scale-110' 
                    : mode === 'hero' 
                      ? 'bg-brand-accent/20 opacity-60 scale-90' 
                      : 'bg-brand-cyan/0 opacity-0'
                  }`} 
                />

                <form 
                    onSubmit={handleSearch}
                    onClick={() => !isFocused && setIsFocused(true)}
                    className={`relative flex items-center bg-brand-darker/80 backdrop-blur-2xl border rounded-full shadow-[0_15px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-[850ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-text group
                        ${isFocused 
                            ? 'w-full ring-2 ring-brand-cyan/40 py-3 md:py-5 px-4 md:px-7 border-brand-cyan/40' 
                            : mode === 'hero'
                                ? 'w-full md:w-[320px] py-3 md:py-4 px-4 md:px-6 border-white/10 hover:border-brand-accent/40 hover:shadow-[0_0_25px_rgba(255,70,85,0.3)]'
                                : 'w-[40px] h-[40px] md:w-[44px] md:h-[44px] py-0 px-0 justify-center hover:bg-white/10 border-white/5 bg-black/40'
                        }
                    `}
                >
                    {/* Cyber Grid Pattern Background (Visible when focused) */}
                    <div className={`absolute inset-0 opacity-10 pointer-events-none transition-opacity duration-700 ${isFocused ? 'opacity-20' : 'opacity-0'}`} 
                         style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #00f0ff 1px, transparent 0)', backgroundSize: '16px 16px' }} />

                    {/* Search Icon */}
                    <div className={`flex items-center justify-center transition-all duration-[850ms] ${isFocused ? 'mr-3 md:mr-5 scale-110 rotate-90' : (mode === 'hero' ? 'mr-2 md:mr-3 rotate-0' : 'mr-0 rotate-0')}`}>
                         <div className={`transition-all duration-500 p-1.5 md:p-2 rounded-full ${isFocused ? 'bg-brand-cyan/20 text-brand-cyan' : 'bg-transparent text-slate-400 group-hover:text-white'}`}>
                             <Search className={`${mode === 'header' && !isFocused ? 'w-4 h-4 md:w-5 md:h-5' : 'w-5 h-5 md:w-6 md:h-6'}`} strokeWidth={2.5} />
                         </div>
                    </div>
                    
                    {/* Input Field */}
                    <input 
                        name="skin-search"
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        placeholder="Search Skins..."
                        autoComplete="off"
                        className={`bg-transparent border-none outline-none text-white placeholder-slate-500 font-display font-bold text-base md:text-lg tracking-wide transition-all duration-[850ms]
                            ${isFocused 
                                ? 'flex-1 opacity-100' 
                                : mode === 'hero'
                                    ? 'flex-1 opacity-100 md:w-48 cursor-text'
                                    : 'hidden'
                            }
                        `}
                    />

                    {/* Actions / Submit */}
                    <div className={`flex items-center gap-2 md:gap-3 transition-all duration-500 ${isFocused || (mode === 'hero' && query) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 w-0'}`}>
                        {query && isFocused && (
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                                className="p-1.5 md:p-2 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all hover:scale-110"
                            >
                                <X className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        )}
                        
                        {isFocused && (
                            <button 
                                type="submit"
                                className="bg-brand-cyan hover:bg-white text-brand-darker rounded-full p-2 md:p-2.5 shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all hover:scale-110 active:scale-95"
                            >
                                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} />
                            </button>
                        )}
                    </div>

                    <div className={`absolute top-0 left-0 w-full h-[2px] bg-brand-cyan/30 transition-opacity duration-700 pointer-events-none ${isFocused ? 'opacity-100 animate-scan' : 'opacity-0'}`}></div>
                    <div className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-brand-cyan to-transparent w-full transition-all duration-1000 ${isFocused ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'}`}></div>
                </form>
            </div>
        </div>
    </>
  );
};

export default SkinSearchFloatingBar;
