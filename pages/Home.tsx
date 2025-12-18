
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Gamepad2, Clock, QrCode, MessageCircle, Play, Star, Zap, Shield, TrendingUp, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import CustomVideoPlayer from '../components/CustomVideoPlayer';
import { StorageService, DEFAULT_HOME_CONFIG } from '../services/storage';
import { HomeConfig, Review } from '../types';

const Home: React.FC = () => {
  const [config, setConfig] = useState<HomeConfig>(DEFAULT_HOME_CONFIG);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Review | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const procedureRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

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
    window.addEventListener('storage', loadConfig);
    return () => window.removeEventListener('storage', loadConfig);
  }, []);

  // Advanced Intersection Observer for multiple reveal types
  useEffect(() => {
    if (loading) return;
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

  // Scroll Sync for Timeline
  useEffect(() => {
    const handleScroll = () => {
      if (!procedureRef.current) return;
      const rect = procedureRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate progress specifically for this section
      const start = rect.top - windowHeight * 0.4;
      const end = rect.height;
      const progress = Math.min(Math.max(-start / end, 0), 1);
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading]);

  // Smoother Hero Transition
  useEffect(() => {
    if (!config.heroSlides || config.heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % config.heroSlides.length);
    }, 8000); // Slower, more cinematic interval
    return () => clearInterval(timer);
  }, [config.heroSlides?.length]);

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
  const stepIcons = [Gamepad2, Clock, QrCode, MessageCircle];

  // Helper to map text-brand-X to bg-brand-X for indicators
  const getBgClassFromAccent = (accentClass: string) => {
    return accentClass.replace('text-', 'bg-');
  };

  const getGlowColorFromAccent = (accentClass: string) => {
    if (accentClass.includes('cyan')) return 'shadow-[0_0_20px_#00f0ff]';
    if (accentClass.includes('accent')) return 'shadow-[0_0_20px_#ff4655]';
    return 'shadow-[0_0_20px_rgba(255,255,255,0.5)]';
  };

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Marquee Header */}
      <div className="bg-brand-accent/20 border-b border-brand-accent/30 py-1.5 overflow-hidden backdrop-blur-md relative z-20">
        <div className="animate-marquee whitespace-nowrap flex gap-12 text-xs font-bold font-mono tracking-widest text-brand-cyan">
           {(config.marqueeText || []).map((text, i) => (
             <React.Fragment key={i}>
               <span>{text}</span>
               <span className="text-white opacity-30">•</span>
             </React.Fragment>
           ))}
        </div>
      </div>

      {/* Hero Section - Refined Cinematic Slides */}
      <section className="relative h-[720px] md:h-[800px] lg:h-[950px] flex items-center justify-center overflow-hidden bg-black">
        {/* Parallax Background Grid */}
        <div className="absolute inset-0 z-0 opacity-20 hero-grid animate-grid-pan pointer-events-none"></div>
        
        {/* Cinematic Slides */}
        {(config.heroSlides || []).map((slide, index) => (
          <div key={slide.id} className={`absolute inset-0 transition-all duration-[2000ms] cubic-bezier(0.4, 0, 0.2, 1) ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <div className="absolute inset-0 bg-black/50 z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-darker via-transparent to-brand-darker/60 z-10" />
            <img 
                src={slide.image} 
                alt="" 
                className={`w-full h-full object-cover transition-transform duration-[8000ms] linear ${index === currentSlide ? 'animate-ken-burns' : 'scale-100'}`} 
            />
          </div>
        ))}

        {/* Hero Content Overlay */}
        <div className="relative z-30 text-center px-4 max-w-5xl mx-auto flex flex-col items-center">
          <div className="mb-6 md:mb-10 inline-flex items-center gap-1.5 md:gap-3 px-3 md:px-6 py-1.5 md:py-2 rounded-full border border-white/10 bg-black/60 backdrop-blur-2xl animate-reveal-up shadow-[0_0_30px_rgba(255,255,255,0.1)]">
             <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_15px_#00f0ff]"></div>
             <span className="text-[10px] md:text-[13px] font-bold tracking-[0.2em] md:tracking-[0.5em] text-white">KRISHNA VALO // SECURE RENTALS</span>
          </div>

          <div key={`title-${currentSlide}`} className="space-y-6 md:space-y-10">
            <h1 className="text-5xl md:text-8xl lg:text-[11rem] font-display font-bold text-white tracking-tighter leading-[0.8] uppercase animate-reveal-up" style={{ animationDelay: '0.1s' }}>
                <span className={`glitch-text block ${config.heroSlides?.[currentSlide]?.accent || 'text-white'}`} data-text={config.heroSlides?.[currentSlide]?.title}>
                    {config.heroSlides?.[currentSlide]?.title}
                </span>
            </h1>
            <p className="text-lg md:text-3xl lg:text-4xl text-slate-300 max-w-4xl mx-auto font-light tracking-[0.15em] border-l-4 border-brand-accent pl-6 md:pl-0 md:border-l-0 text-left md:text-center animate-reveal-up" style={{ animationDelay: '0.3s' }}>
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

          {/* Restored Animated Slide Indicator */}
          <div className="mt-16 md:mt-24 flex items-center justify-center gap-4 animate-reveal-up" style={{ animationDelay: '0.7s' }}>
            {(config.heroSlides || []).map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(idx)}
                className={`group/indicator relative h-1.5 md:h-2 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden
                  ${idx === currentSlide 
                    ? `w-12 md:w-20 skew-x-[-20deg] ${getBgClassFromAccent(slide.accent)} ${getGlowColorFromAccent(slide.accent)}` 
                    : 'w-4 md:w-6 skew-x-[-10deg] bg-white/20 hover:bg-white/40'
                  }
                `}
              >
                {/* Active Scanning Glint */}
                {idx === currentSlide && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent w-full h-full animate-shimmer"></div>
                )}
                {/* Tooltip hint on hover */}
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/indicator:opacity-100 transition-opacity pointer-events-none">
                   <span className="w-full h-full bg-white/10"></span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators - Enhanced Scroll Animations */}
      <section className="bg-brand-darker border-y border-white/5 py-16 md:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 relative z-10">
          {(config.trustItems || []).map((item, i) => {
            const Icon = trustIcons[i % trustIcons.length] || Star;
            return (
             <div 
                key={i} 
                className="animate-on-scroll reveal-up glass-panel p-6 md:p-10 rounded-2xl flex flex-col items-center gap-5 hover:bg-white/5 group border border-white/5 transition-all duration-700" 
                style={{ transitionDelay: `${i * 150}ms` }}
             >
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

      {/* Operation Procedure - Refined High-Density Zigzag */}
      <section ref={procedureRef} id="how-it-works" className="relative py-24 md:py-32 bg-black overflow-hidden">
        {/* Parallax Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none hero-grid transition-transform duration-500" style={{ transform: `translateY(${scrollProgress * 100}px)` }}></div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16 md:mb-20 animate-on-scroll reveal-up">
            <h2 className="text-4xl md:text-8xl font-display font-black mb-4 tracking-tighter uppercase italic">
              OPERATION <span className="text-brand-accent glitch-text" data-text="PROCEDURE">PROCEDURE</span>
            </h2>
            <div className="flex items-center justify-center gap-4">
              <div className="h-[1px] w-12 md:w-24 bg-brand-cyan/30"></div>
              <p className="text-slate-500 font-mono uppercase tracking-[0.6em] text-[10px] md:text-sm">Protocol // System Sync: {Math.round(scrollProgress * 100)}%</p>
              <div className="h-[1px] w-12 md:w-24 bg-brand-cyan/30"></div>
            </div>
          </div>

          <div className="relative">
            {/* Central Connectivity Line */}
            <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-px md:w-1 bg-white/5 rounded-full overflow-hidden">
               <div 
                  className="absolute top-0 left-0 w-full bg-gradient-to-b from-brand-cyan via-brand-accent to-brand-secondary shadow-[0_0_20px_#00f0ff] transition-all duration-300" 
                  style={{ height: `${scrollProgress * 100}%` }}
               >
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 md:w-6 md:h-6 bg-white rounded-full blur-[4px] md:blur-[10px] animate-pulse"></div>
               </div>
            </div>

            {/* Tight Zigzag Steps */}
            <div className="relative space-y-4 md:space-y-0">
              {(config.stepItems || []).map((step, idx) => {
                const Icon = stepIcons[idx] || Gamepad2;
                const threshold = (idx) / config.stepItems.length;
                const isActive = scrollProgress >= threshold;
                const isEven = idx % 2 === 0;

                return (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-center w-full py-6 md:py-12 transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-10'}`}
                  >
                    {/* Content Logic: On desktop/mobile, we always zigzag now */}
                    
                    {/* LEFT CONTENT (Visible for Even items) */}
                    <div className={`w-[calc(50%-2rem)] md:w-1/2 pr-6 md:pr-16 text-right transition-all duration-1000 transform-gpu ${isEven ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none'}`}>
                       {isEven && (
                         <div className="space-y-2 md:space-y-4">
                           <span className="text-3xl md:text-6xl font-display font-black italic text-brand-cyan drop-shadow-[0_0_10px_#00f0ff]">0{idx + 1}</span>
                           <h3 className="text-base md:text-4xl font-display font-black uppercase text-white tracking-tight leading-none">{step.title}</h3>
                           <p className="text-[10px] md:text-lg text-slate-400 font-light leading-snug">{step.desc}</p>
                         </div>
                       )}
                    </div>

                    {/* Central Circuit Node */}
                    <div className="relative z-20 flex-shrink-0">
                       <div className={`w-12 h-12 md:w-24 md:h-24 rounded-full border-2 transition-all duration-700 flex items-center justify-center bg-black ${isActive ? 'border-brand-cyan shadow-[0_0_40px_rgba(0,240,255,0.4)] scale-110' : 'border-white/10 scale-90'}`}>
                          {isActive && <div className="absolute inset-0 rounded-full border-2 border-brand-cyan/20 animate-ping"></div>}
                          <Icon className={`w-5 h-5 md:w-12 md:h-12 transition-all duration-700 ${isActive ? 'text-brand-cyan scale-110' : 'text-slate-800'}`} />
                       </div>
                    </div>

                    {/* RIGHT CONTENT (Visible for Odd items) */}
                    <div className={`w-[calc(50%-2rem)] md:w-1/2 pl-6 md:pl-16 text-left transition-all duration-1000 transform-gpu ${!isEven ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0 pointer-events-none'}`}>
                       {!isEven && (
                         <div className="space-y-2 md:space-y-4">
                           <span className="text-3xl md:text-6xl font-display font-black italic text-brand-accent drop-shadow-[0_0_10px_#ff4655]">0{idx + 1}</span>
                           <h3 className="text-base md:text-4xl font-display font-black uppercase text-white tracking-tight leading-none">{step.title}</h3>
                           <p className="text-[10px] md:text-lg text-slate-400 font-light leading-snug">{step.desc}</p>
                         </div>
                       )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Community Intel Marquee - Horizontal Reveal */}
      <section className="py-24 bg-black overflow-hidden border-y border-white/5 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="text-center mb-16 relative z-10 animate-on-scroll reveal-up">
          <h2 className="text-4xl md:text-8xl font-display font-black uppercase tracking-tighter">
            COMMUNITY <span className="text-brand-accent glitch-text" data-text="INTEL">INTEL</span>
          </h2>
          <p className="text-slate-500 font-mono mt-3 uppercase tracking-[0.5em] text-[10px] md:text-sm font-bold italic">Agent Logs Transmitted From The Field</p>
        </div>
        <div className="relative w-full hover:pause-marquee group animate-on-scroll reveal-up">
          <div className="flex gap-10 w-max animate-marquee">
            {[...(config.reviews || []), ...(config.reviews || [])].map((review, i) => (
              <div key={i} onClick={() => review.type === 'video' ? setSelectedVideo(review) : null} className={`w-[320px] md:w-[450px] backdrop-blur-3xl bg-brand-surface/40 border border-white/10 rounded-2xl overflow-hidden transition-all duration-700 group/card ${review.type === 'video' ? 'cursor-pointer hover:border-brand-cyan/50 hover:shadow-[0_0_50px_rgba(0,240,255,0.15)]' : 'hover:border-white/20'} hover:-translate-y-4`}>
                {review.type === 'video' ? (
                  <>
                    <div className="relative h-56 md:h-64 w-full overflow-hidden">
                      <img src={review.thumbnail} alt="" className="w-full h-full object-cover opacity-60 group-hover/card:opacity-100 group-hover/card:scale-110 transition-all duration-1000" />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center group-hover/card:bg-black/30 transition-colors">
                        <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center pl-1.5 group-hover/card:bg-brand-accent group-hover/card:border-transparent transition-all shadow-2xl group-hover/card:scale-110">
                          <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 px-3 py-1 bg-brand-cyan/20 border border-brand-cyan/40 rounded text-[10px] font-black text-brand-cyan uppercase tracking-[0.2em] shadow-lg">LIVE DEBRIEF</div>
                    </div>
                    <div className="p-8">
                      <div className="flex items-center gap-5 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-accent to-brand-secondary p-[1px] shadow-2xl">
                           <div className="w-full h-full bg-brand-dark rounded-2xl flex items-center justify-center text-xl font-black text-white">{review.name.charAt(0)}</div>
                        </div>
                        <div>
                          <div className="font-black text-white font-display tracking-tight text-xl uppercase italic">{review.name}</div>
                          <div className="text-[10px] text-brand-cyan font-mono uppercase tracking-[0.3em] font-bold">SECURE CHANNEL // {review.rank}</div>
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm md:text-base italic leading-relaxed font-medium">"{review.quote}"</p>
                    </div>
                  </>
                ) : (
                  <div className="p-8 flex flex-col h-full min-h-[300px] md:min-h-[350px] justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xl font-black text-slate-300 shadow-inner">{review.name.charAt(0)}</div>
                           <div>
                              <div className="font-black text-white font-display tracking-tight uppercase text-xl">{review.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">VERIFIED RENTER // {review.rank}</div>
                           </div>
                        </div>
                        <div className="flex gap-1 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]">
                          {Array.from({length: review.rating || 5}).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                        </div>
                      </div>
                      <p className="text-slate-300 text-base md:text-lg leading-relaxed font-medium">"{review.quote}"</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/5">
                       <span className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.5em] font-bold">{review.date || 'RECENT'}</span>
                       <div className="flex items-center gap-2 text-[10px] font-black text-green-400 bg-green-400/10 px-4 py-1.5 rounded-full border border-green-400/20">
                          <CheckCircle2 size={12} /> ENCRYPTION ACTIVE
                       </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500 p-4">
          <div className="w-full max-w-6xl aspect-video rounded-none border border-brand-accent/50 relative bg-black shadow-[0_0_150px_rgba(255,70,85,0.3)]">
             <CustomVideoPlayer src={selectedVideo.videoUrl!} poster={selectedVideo.thumbnail} title={`INTEL DEBRIEF // AGENT: ${selectedVideo.name}`} onClose={() => setSelectedVideo(null)} />
          </div>
        </div>
      )}

      {/* CTA Section - Final Reveal */}
      <section className="py-32 md:py-48 bg-brand-darker relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-accent/5"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-40"></div>
        
        <div className="max-w-5xl mx-auto text-center px-4 relative z-10">
          <div className="animate-on-scroll reveal-up space-y-12">
            <h2 className="text-6xl md:text-9xl font-display font-black text-white uppercase tracking-tighter leading-[0.85]">
              {config.cta?.titleLine1} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-secondary glitch-text" data-text={config.cta?.titleLine2}>{config.cta?.titleLine2}</span>
            </h2>
            <p className="text-slate-400 text-xl md:text-2xl font-light tracking-wide max-w-3xl mx-auto leading-relaxed">{config.cta?.subtitle}</p>
            
            <Link to="/browse" className="inline-block relative px-3 py-4 md:px-12 md:py-8 bg-white hover:bg-brand-cyan text-brand-darker font-black text-sm md:text-2xl skew-x-[-12deg] transition-all hover:scale-110 shadow-[0_0_60px_rgba(255,255,255,0.2)] hover:shadow-[0_0_80px_rgba(0,240,255,0.4)] active:scale-95 uppercase tracking-[0.3em] md:tracking-[0.4em]">
              <div className="skew-x-[12deg] flex items-center gap-3 md:gap-4">
                {config.cta?.buttonText} <ArrowRight className="w-5 h-5 md:w-8 md:h-8" />
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
