
import React, { useState, useEffect, useRef, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Gamepad2, Clock, QrCode, MessageCircle, Play, Star, Zap, Shield, TrendingUp, CheckCircle2, Loader2, ArrowRight, Award, Gift, Gem, PlusCircle } from 'lucide-react';
import CustomVideoPlayer from '../components/CustomVideoPlayer';
import { StorageService, DEFAULT_HOME_CONFIG } from '../services/storage';
import { HomeConfig, Review, StepItem } from '../types';

const STEP_ICONS = [Gamepad2, Clock, QrCode, MessageCircle];

// Memoized sub-component to isolate scroll re-renders
const ProcedureSection = memo(({ config }: { config: HomeConfig }) => {
  const procedureRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let rafId: number;
    
    const handleScroll = () => {
      if (!procedureRef.current) return;
      
      const rect = procedureRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Performance: Stop calculating if element is far out of view
      if (rect.bottom < -100 || rect.top > windowHeight + 100) return;

      const start = rect.top - windowHeight * 0.4;
      const end = rect.height;
      // Precision limit to reduce state updates
      let progress = Math.min(Math.max(-start / end, 0), 1);
      
      // Round to 3 decimal places to avoid micro-renders
      progress = Math.round(progress * 1000) / 1000;

      setScrollProgress(prev => {
          if (prev === progress) return prev;
          return progress;
      });
    };

    const onScroll = () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
        window.removeEventListener('scroll', onScroll);
        cancelAnimationFrame(rafId);
    };
  }, []);

  return (
      <section ref={procedureRef} id="how-it-works" className="relative py-24 md:py-32 bg-black overflow-hidden transform-gpu">
        <div className="absolute inset-0 opacity-10 pointer-events-none hero-grid transition-transform duration-100 ease-linear" style={{ transform: `translateY(${scrollProgress * 100}px)`, willChange: 'transform' }}></div>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16 md:mb-20 animate-on-scroll reveal-up">
            <h2 className="text-4xl md:text-8xl font-display font-black mb-4 tracking-tighter uppercase italic">OPERATION <span className="text-brand-accent glitch-text" data-text="PROCEDURE">PROCEDURE</span></h2>
            <div className="flex items-center justify-center gap-4"><div className="h-[1px] w-12 md:w-24 bg-brand-cyan/30"></div><p className="text-slate-500 font-mono uppercase tracking-[0.6em] text-[10px] md:text-sm">Protocol // System Sync: {Math.round(scrollProgress * 100)}%</p><div className="h-[1px] w-12 md:w-24 bg-brand-cyan/30"></div></div>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-px md:w-1 bg-white/5 rounded-full overflow-hidden"><div className="absolute top-0 left-0 w-full bg-gradient-to-b from-brand-cyan via-brand-accent to-brand-secondary shadow-[0_0_20px_#00f0ff] transition-all duration-300 ease-linear" style={{ height: `${scrollProgress * 100}%`, willChange: 'height' }}><div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 md:w-6 md:h-6 bg-white rounded-full blur-[4px] md:blur-[10px] animate-pulse"></div></div></div>
            <div className="relative space-y-4 md:space-y-0">
              {(config.stepItems || []).map((step, idx) => {
                const Icon = STEP_ICONS[idx] || Gamepad2;
                const threshold = idx / (config.stepItems?.length || 4);
                const isActive = scrollProgress >= threshold;
                const isEven = idx % 2 === 0;
                return (
                  <div key={idx} className={`flex items-center justify-center w-full py-6 md:py-12 transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-10'}`}>
                    <div className={`w-[calc(50%-2rem)] md:w-1/2 pr-6 md:pr-16 text-right transition-all duration-1000 transform-gpu ${isEven ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none'}`}>
                       {isEven && <div className="space-y-2 md:space-y-4"><span className="text-3xl md:text-6xl font-display font-black italic text-brand-cyan drop-shadow-[0_0_10px_#00f0ff]">0{idx + 1}</span><h3 className="text-base md:text-4xl font-display font-black uppercase text-white tracking-tight leading-none">{step.title}</h3><p className="text-[10px] md:text-lg text-slate-400 font-light leading-snug">{step.desc}</p></div>}
                    </div>
                    <div className="relative z-20 flex-shrink-0"><div className={`w-12 h-12 md:w-24 md:h-24 rounded-full border-2 transition-all duration-700 flex items-center justify-center bg-black ${isActive ? 'border-brand-cyan shadow-[0_0_40px_rgba(0,240,255,0.4)] scale-110' : 'border-white/10 scale-90'}`}>{isActive && <div className="absolute inset-0 rounded-full border-2 border-brand-cyan/20 animate-ping"></div>}<Icon className={`w-5 h-5 md:w-12 md:h-12 transition-all duration-700 ${isActive ? 'text-brand-cyan scale-110' : 'text-slate-800'}`} /></div></div>
                    <div className={`w-[calc(50%-2rem)] md:w-1/2 pl-6 md:pl-16 text-left transition-all duration-1000 transform-gpu ${!isEven ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0 pointer-events-none'}`}>
                       {!isEven && <div className="space-y-2 md:space-y-4"><span className="text-3xl md:text-6xl font-display font-black italic text-brand-accent drop-shadow-[0_0_10px_#ff4655]">0{idx + 1}</span><h3 className="text-base md:text-4xl font-display font-black uppercase text-white tracking-tight leading-none">{step.title}</h3><p className="text-[10px] md:text-lg text-slate-400 font-light leading-snug">{step.desc}</p></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
  );
});

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<HomeConfig>(DEFAULT_HOME_CONFIG);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Review | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileVideoIndex, setMobileVideoIndex] = useState(0); // State for Mobile Video Slider

  const loadConfig = async () => {
    try {
      const data = await StorageService.getHomeConfig();
      setConfig(data);
    } catch (err) {
      console.error("Home load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    
    const unsubscribe = StorageService.subscribe(() => {
      loadConfig();
    });

    window.addEventListener('storage', loadConfig);
    
    return () => {
      unsubscribe();
      window.removeEventListener('storage', loadConfig);
    };
  }, []);

  // Defensive Intersection Observer
  useEffect(() => {
    if (loading) return;
    
    if (typeof window.IntersectionObserver === 'undefined') {
      const elements = document.querySelectorAll('.animate-on-scroll');
      elements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, config]);

  useEffect(() => {
    if (!config.heroSlides || config.heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % config.heroSlides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [config.heroSlides?.length]);

  // Mobile Video Slider Auto-Scroll (3 Seconds)
  useEffect(() => {
    const videoCount = (config.reviews || []).filter(r => r.type === 'video').length;
    if (videoCount <= 1) return;

    const interval = setInterval(() => {
      setMobileVideoIndex((prev) => (prev + 1) % videoCount);
    }, 3000);

    return () => clearInterval(interval);
  }, [config.reviews]);

  const handleListId = () => {
    const user = StorageService.getCurrentUser();
    if (user) {
      navigate('/list-account');
    } else {
      navigate('/login', { state: { returnTo: '/list-account' } });
    }
  };

  if (loading) {
    return (
      <div className="h-[650px] flex items-center justify-center bg-brand-dark">
         <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-brand-accent animate-spin" />
            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Establishing Secure Uplink...</p>
         </div>
      </div>
    );
  }

  const trustIcons = [Zap, Shield, TrendingUp, Star];
  const ultra = config.ultraPoints || DEFAULT_HOME_CONFIG.ultraPoints!;

  const getBgClassFromAccent = (accentClass: string) => accentClass.replace('text-', 'bg-');
  
  // Select all videos for display
  const videoReviews = (config.reviews || []).filter(r => r.type === 'video');

  return (
    <div className="flex flex-col overflow-hidden">
      
      {/* FLOATING CTA: RENT MY ID */}
      <button 
        onClick={handleListId}
        className="fixed z-[999] bottom-24 right-4 md:bottom-8 md:right-8 bg-brand-accent text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-brand-accent/30 backdrop-blur-md border border-white/10 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group animate-in slide-in-from-bottom-10 duration-700"
      >
        <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
        <span className="uppercase tracking-wide text-xs md:text-sm">Rent My ID</span>
      </button>

      <section className="relative h-[720px] md:h-[800px] lg:h-[950px] flex items-center justify-center overflow-hidden bg-black transform-gpu">
        <div className="absolute inset-0 z-0 opacity-20 hero-grid animate-grid-pan pointer-events-none"></div>
        {(config.heroSlides || []).map((slide, index) => (
          <div key={slide.id} className={`absolute inset-0 transition-all duration-[1500ms] cubic-bezier(0.4, 0, 0.2, 1) ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <div className="absolute inset-0 bg-black/50 z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-darker via-transparent to-brand-darker/60 z-10" />
            <img src={slide.image} alt="" className={`w-full h-full object-cover transition-transform duration-[8000ms] linear ${index === currentSlide ? 'animate-ken-burns' : 'scale-100'}`} />
          </div>
        ))}

        <div className="relative z-30 text-center px-4 max-w-5xl mx-auto flex flex-col items-center md:pt-48">
          <div className="md:hidden mb-6 md:mb-10 inline-flex items-center gap-1.5 md:gap-3 px-3 md:px-6 py-1.5 md:py-2 rounded-full border border-white/10 bg-black/60 backdrop-blur-2xl animate-reveal-up shadow-[0_0_30px_rgba(255,255,255,0.1)]">
             <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_15px_#00f0ff]"></div>
             <span className="text-[10px] md:text-[13px] font-bold tracking-[0.2em] md:tracking-[0.5em] text-white">KRISHNA VALO // SECURE RENTALS</span>
          </div>

          <div key={`title-${currentSlide}`} className="space-y-6 md:space-y-10 perspective-1000">
            <h1 className="text-5xl md:text-8xl lg:text-[11rem] font-display font-bold text-white tracking-tighter leading-[0.8] uppercase animate-hero-pop-in" style={{ animationDelay: '0.1s' }}>
                <span className={`glitch-text block ${config.heroSlides?.[currentSlide]?.accent || 'text-white'}`} data-text={config.heroSlides?.[currentSlide]?.title}>
                    {config.heroSlides?.[currentSlide]?.title}
                </span>
            </h1>
            <p className="text-lg md:text-3xl lg:text-4xl text-slate-300 max-w-4xl mx-auto font-light tracking-[0.15em] border-l-4 border-brand-accent pl-6 md:pl-0 md:border-l-0 text-left md:text-center animate-hero-pop-in" style={{ animationDelay: '0.3s' }}>
                {config.heroSlides?.[currentSlide]?.subtitle}
            </p>
          </div>

          <div className="mt-12 md:mt-16 flex flex-col sm:flex-row gap-6 md:gap-10 justify-center items-center animate-reveal-up" style={{ animationDelay: '0.5s' }}>
            <Link to="/browse" className={`relative overflow-hidden group/btn px-3 py-3.5 md:px-12 md:py-7 ${config.heroSlides?.[currentSlide]?.buttonColor || 'bg-brand-accent'} font-black rounded-none skew-x-[-12deg] uppercase tracking-[0.3em] md:tracking-[0.4em] transition-all shadow-[0_0_50px_rgba(0,0,0,0.6)] hover:shadow-[0_0_70px_rgba(255,70,85,0.4)] hover:scale-105 active:scale-95 flex items-center gap-3 md:gap-4`}>
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full h-full animate-shimmer opacity-25 pointer-events-none"></div>
              <div className="skew-x-[12deg] relative z-10 flex items-center gap-3 md:gap-4 text-white text-sm md:text-2xl">
                START OPERATION <ChevronRight className="w-4 h-4 md:w-8 md:h-8 group-hover/btn:translate-x-3 transition-transform duration-500" />
              </div>
            </Link>
          </div>

          <div className="mt-16 md:mt-24 flex items-center justify-center gap-4 animate-reveal-up" style={{ animationDelay: '0.7s' }}>
            {(config.heroSlides || []).map((slide, idx) => (
              <button 
                key={slide.id} 
                onClick={() => setCurrentSlide(idx)} 
                className={`group/indicator relative h-1.5 md:h-2 transition-all duration-500 overflow-hidden rounded-full ${idx === currentSlide ? `w-12 md:w-20` : 'w-4 md:w-6 bg-white/20 hover:bg-white/40'}`}
              >
                {/* Track */}
                {idx === currentSlide && (
                   <div className="absolute inset-0 w-full h-full bg-white/10"></div>
                )}
                
                {/* Progress Bar */}
                {idx === currentSlide && (
                   <div className={`absolute inset-0 h-full ${getBgClassFromAccent(slide.accent)} animate-progress-fill`}></div>
                )}
                
                {/* Hover state for inactive */}
                {idx !== currentSlide && (
                   <div className="absolute inset-0 w-full h-full bg-transparent group-hover/indicator:bg-white/20 transition-colors"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ULTRA POINTS SECTION */}
      <section className="bg-brand-darker py-24 relative overflow-hidden transform-gpu">
        <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8 animate-on-scroll reveal-left">
               <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-xs font-black text-yellow-500 uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                  <Award size={14} /> {ultra.tagline}
               </div>
               <h2 className="text-5xl md:text-7xl font-display font-black text-white uppercase tracking-tighter italic leading-none">
                  {ultra.titlePart1} <span className="text-yellow-500">{ultra.titleHighlight}</span> <br /> {ultra.titlePart2}
               </h2>
               <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
                 {ultra.description}
               </p>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-6 bg-brand-surface border border-white/5 rounded-2xl group hover:border-yellow-500/30 transition-all">
                     <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Award className="text-yellow-500" />
                     </div>
                     <h3 className="font-bold text-white mb-2 uppercase tracking-widest text-sm">{ultra.card1Title}</h3>
                     <p className="text-slate-500 text-xs leading-relaxed">{ultra.card1Desc}</p>
                  </div>
                  <div className="p-6 bg-brand-surface border border-white/5 rounded-2xl group hover:border-yellow-500/30 transition-all">
                     <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Gem className="text-yellow-500" />
                     </div>
                     <h3 className="font-bold text-white mb-2 uppercase tracking-widest text-sm">{ultra.card2Title}</h3>
                     <p className="text-slate-500 text-xs leading-relaxed">{ultra.card2Desc}</p>
                  </div>
               </div>
            </div>

            <div className="flex-1 relative animate-on-scroll reveal-right">
               <div className="absolute inset-0 bg-yellow-500/20 blur-[100px] rounded-full"></div>
               <div className="relative bg-brand-surface border border-yellow-500/20 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
                  <div className="flex justify-between items-center mb-10">
                     <div className="space-y-1">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Milestone</div>
                        <div className="text-2xl font-display font-black text-white uppercase italic">VP VOUCHER 01</div>
                     </div>
                     <div className="w-16 h-16 bg-brand-dark rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                        <Gift className="text-yellow-500 w-8 h-8" />
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="flex justify-between items-end">
                        <div className="text-sm font-bold text-white">500 <span className="text-yellow-500">UP</span></div>
                        <div className="text-xs text-slate-500">GOAL REACHED</div>
                     </div>
                     <div className="h-4 bg-brand-dark rounded-full border border-white/5 overflow-hidden p-0.5">
                        <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.4)] animate-pulse" style={{ width: '100%' }}></div>
                     </div>
                     <div className="flex justify-between items-center py-4 px-6 bg-brand-dark rounded-xl border border-white/5">
                        <div className="text-center flex-1">
                           <div className="text-lg font-black text-white">500 UP</div>
                           <div className="text-[9px] text-slate-500 uppercase tracking-widest">ULTRA POINTS</div>
                        </div>
                        <div className="px-4 text-slate-600">→</div>
                        <div className="text-center flex-1">
                           <div className="text-lg font-black text-yellow-500">1000 VP</div>
                           <div className="text-[9px] text-slate-500 uppercase tracking-widest">VOUCHER CODE</div>
                        </div>
                     </div>
                     <div className="pt-6 text-center">
                        <Link to="/browse" className="inline-flex items-center gap-2 px-10 py-4 bg-white text-brand-darker font-black text-xs rounded-xl hover:bg-yellow-500 transition-all uppercase tracking-widest shadow-2xl">
                           START EARNING NOW
                        </Link>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-darker border-y border-white/5 py-16 md:py-24 relative transform-gpu">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 relative z-10">
          {(config.trustItems || []).map((item, i) => {
            const Icon = trustIcons[i % trustIcons.length] || Star;
            return (
             <div key={i} className="animate-on-scroll reveal-up glass-panel p-6 md:p-10 rounded-2xl flex flex-col items-center gap-5 hover:bg-white/5 group border border-white/5 transition-all duration-700" style={{ transitionDelay: `${i * 150}ms` }}>
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-cyan/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Icon className={`w-10 h-10 md:w-14 md:h-14 text-brand-cyan group-hover:scale-110 transition-transform relative z-10`} />
                </div>
                <div className="text-center">
                  <div className="font-display font-bold text-xl md:text-3xl text-white uppercase tracking-tight">{item.label}</div>
                  <div className="text-[10px] md:text-xs font-mono text-slate-500 uppercase tracking-[0.4em] mt-2">{item.sub}</div>
                </div>
             </div>
          )})}
        </div>
      </section>

      {/* Replaced old scroll logic with optimized sub-component */}
      <ProcedureSection config={config} />

      {/* VIDEO GRID SECTION (Portrait Layout - Split View) */}
      <section className="py-24 bg-black overflow-hidden border-y border-white/5 relative transform-gpu">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        
        {/* Header */}
        <div className="text-center mb-16 relative z-10 animate-on-scroll reveal-up">
           <h2 className="text-4xl md:text-8xl font-display font-black uppercase tracking-tighter">
              COMMUNITY <span className="text-brand-accent glitch-text" data-text="INTEL">INTEL</span>
           </h2>
           <p className="text-slate-500 font-mono mt-3 uppercase tracking-[0.5em] text-[10px] md:text-sm font-bold italic">
              Verified Mobile Uploads // 9:16 Format
           </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
           
           {/* Mobile View: Auto-Scrolling Slider (3s) */}
           <div className="md:hidden relative h-[500px] w-full rounded-2xl overflow-hidden group/slider touch-pan-y animate-on-scroll reveal-up">
              {videoReviews.map((video, index) => {
                 // Calculate position for sliding effect
                 const offset = index - mobileVideoIndex;
                 
                 return (
                   <div 
                      key={index}
                      onClick={() => setSelectedVideo(video)}
                      className="absolute inset-0 w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
                      style={{ transform: `translateX(${offset * 100}%)` }}
                   >
                      <div className="relative w-full h-full bg-brand-surface border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                          <img src={video.thumbnail} alt={video.name} className="w-full h-full object-cover opacity-80" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90"></div>
                          
                          <div className="absolute inset-0 flex items-center justify-center opacity-100 transition-all duration-500">
                              <div className={`rounded-full backdrop-blur-md flex items-center justify-center shadow-2xl w-20 h-20 bg-brand-accent/20 border border-brand-accent/50 shadow-[0_0_50px_rgba(255,70,85,0.4)]`}>
                                 <Play className="fill-white ml-1 w-8 h-8 text-white" />
                              </div>
                          </div>

                          <div className="absolute bottom-0 left-0 p-8 w-full">
                             <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-accent/20 backdrop-blur-md border border-brand-accent/40 rounded text-[10px] font-black text-brand-accent uppercase tracking-widest mb-2">
                                <Zap size={12} /> Mobile Feed
                             </div>
                             <h3 className="text-3xl font-display font-black text-white italic uppercase leading-none">{video.name}</h3>
                             <p className="font-mono text-[10px] uppercase tracking-widest mt-2 text-brand-cyan">Rank: {video.rank}</p>
                          </div>
                      </div>
                   </div>
                 );
              })}
              
              {/* Slider Indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                 {videoReviews.map((_, idx) => (
                    <button 
                       key={idx}
                       onClick={() => setMobileVideoIndex(idx)}
                       className={`h-1.5 rounded-full transition-all duration-500 ${idx === mobileVideoIndex ? 'w-8 bg-brand-accent shadow-[0_0_10px_#ff4655]' : 'w-1.5 bg-white/20'}`}
                    />
                 ))}
              </div>
           </div>

           {/* Desktop View: Centered Flex Grid with strict Aspect Ratio */}
           <div className="hidden md:flex flex-wrap justify-center gap-8 lg:gap-12 animate-on-scroll reveal-up items-center">
              {videoReviews.map((video, index) => {
                 // Creating a symmetrical wave: High - Low - Low - High
                 // Or High - Low - High depending on count
                 // Using translate-y instead of height difference for cleaner alignment
                 const isLow = (index % 4) === 1 || (index % 4) === 2;
                 const delay = (index % 4) * 100;

                 return (
                   <div 
                      key={index}
                      onClick={() => setSelectedVideo(video)} 
                      className={`relative group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-brand-surface shadow-2xl transition-all duration-700
                        w-full max-w-[280px] lg:max-w-[320px] aspect-[9/16] hover:-translate-y-2
                        ${isLow ? 'lg:translate-y-12' : 'translate-y-0'}
                      `}
                      style={{ animationDelay: `${delay}ms` }}
                   >
                      <img src={video.thumbnail} alt={video.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 group-hover:opacity-60 transition-opacity"></div>
                      
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-90 group-hover:scale-100">
                          <div className={`rounded-full backdrop-blur-md flex items-center justify-center shadow-2xl w-16 h-16 bg-brand-accent/20 border border-brand-accent/50 shadow-[0_0_30px_rgba(255,70,85,0.3)]`}>
                             <Play className="fill-white ml-1 w-6 h-6 text-white" />
                          </div>
                      </div>

                      <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                         {index === 0 && (
                           <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-accent/20 backdrop-blur-md border border-brand-accent/40 rounded text-[10px] font-black text-brand-accent uppercase tracking-widest mb-2">
                              <Zap size={12} /> Featured
                           </div>
                         )}
                         <h3 className="font-display font-black text-white italic uppercase leading-none text-2xl">{video.name}</h3>
                         <p className={`font-mono text-[10px] uppercase tracking-widest mt-2 ${index % 2 === 0 ? 'text-brand-accent' : 'text-brand-cyan'}`}>Rank: {video.rank}</p>
                      </div>
                   </div>
                 );
              })}
           </div>
        </div>
      </section>

      {/* Video Modal - Portrait Mode Optimized */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500 p-4">
          {/* Vertical Video Container */}
          <div className="relative h-[80vh] w-auto aspect-[9/16] rounded-2xl border border-brand-accent/50 bg-black shadow-[0_0_100px_rgba(255,70,85,0.2)] overflow-hidden">
             <CustomVideoPlayer 
                src={selectedVideo.videoUrl!} 
                poster={selectedVideo.thumbnail} 
                title={`${selectedVideo.name} // ${selectedVideo.rank}`} 
                onClose={() => setSelectedVideo(null)} 
             />
          </div>
        </div>
      )}

      <section className="py-32 md:py-48 bg-brand-darker relative overflow-hidden transform-gpu">
        <div className="absolute inset-0 bg-brand-accent/5"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-40"></div>
        <div className="max-w-5xl mx-auto text-center px-4 relative z-10"><div className="animate-on-scroll reveal-up space-y-12"><h2 className="text-6xl md:text-9xl font-display font-black text-white uppercase tracking-tighter leading-[0.85]">{config.cta?.titleLine1} <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-secondary glitch-text" data-text={config.cta?.titleLine2}>{config.cta?.titleLine2}</span></h2><p className="text-slate-400 text-xl md:text-2xl font-light tracking-wide max-w-3xl mx-auto leading-relaxed">{config.cta?.subtitle}</p><Link to="/browse" className="inline-block relative px-3 py-4 md:px-12 md:py-8 bg-white hover:bg-brand-cyan text-brand-darker font-black text-sm md:text-2xl skew-x-[-12deg] transition-all hover:scale-110 shadow-[0_0_60px_rgba(255,255,255,0.2)] hover:shadow-[0_0_80px_rgba(0,240,255,0.4)] active:scale-95 uppercase tracking-[0.3em] md:tracking-[0.4em]"><div className="skew-x-[12deg] flex items-center gap-3 md:gap-4">{config.cta?.buttonText} <ArrowRight className="w-5 h-5 md:w-8 md:h-8" /></div></Link></div></div>
      </section>
    </div>
  );
};

export default Home;
