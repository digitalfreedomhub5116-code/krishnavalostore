
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Gamepad2, Clock, QrCode, MessageCircle, Play, Star, Zap, Shield, TrendingUp, CheckCircle2, Loader2 } from 'lucide-react';
import CustomVideoPlayer from '../components/CustomVideoPlayer';
import { StorageService, DEFAULT_HOME_CONFIG } from '../services/storage';
import { HomeConfig, Review } from '../types';

const LiquidArrow: React.FC<{ filled: boolean; mobile: boolean }> = ({ filled, mobile }) => {
  return (
    <div className={`relative flex items-center justify-center transition-all duration-700 ${mobile ? 'h-20 w-full md:hidden -mt-4 -mb-4' : 'hidden md:flex w-20 h-full -ml-4 -mr-4'}`}>
       <svg 
         viewBox="0 0 100 100" 
         className={`w-10 h-10 transition-all duration-700 ${filled ? 'opacity-100 scale-110' : 'opacity-20 scale-90'} ${mobile ? 'rotate-90' : ''}`}
         preserveAspectRatio="none"
       >
         <path d="M10 40 H60 L60 20 L90 50 L60 80 L60 60 H10 Z" fill="none" stroke="currentColor" strokeWidth="2" className={filled ? 'text-brand-cyan' : 'text-slate-700'} />
         <defs>
            <clipPath id={`arrow-mask-${mobile ? 'm' : 'd'}`}>
              <path d="M10 40 H60 L60 20 L90 50 L60 80 L60 60 H10 Z" />
            </clipPath>
         </defs>
         <g clipPath={`url(#arrow-mask-${mobile ? 'm' : 'd'})`}>
            <rect 
              x="0" 
              y="0" 
              width={filled ? "100" : "0"} 
              height="100" 
              className="transition-all duration-1000 ease-in-out"
              fill="url(#liquid-gradient)"
            />
         </g>
         <defs>
           <linearGradient id="liquid-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
             <stop offset="0%" stopColor="#00f0ff" />
             <stop offset="100%" stopColor="#3b82f6" />
           </linearGradient>
         </defs>
       </svg>
    </div>
  );
};

const Home: React.FC = () => {
  const [config, setConfig] = useState<HomeConfig>(DEFAULT_HOME_CONFIG);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Review | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeStep, setActiveStep] = useState(-1);

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

  // Intersection Observer for generic entrance animations
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [loading, config]);

  // Dedicated observer for the procedure steps to track active state
  useEffect(() => {
    if (loading) return;

    const stepObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          if (!isNaN(index)) {
             setActiveStep(prev => Math.max(prev, index));
          }
        }
      });
    }, { threshold: 0.6 });

    const stepElements = document.querySelectorAll('.step-trigger');
    stepElements.forEach(el => stepObserver.observe(el));

    return () => stepObserver.disconnect();
  }, [loading, config]);

  useEffect(() => {
    if (!config || !config.heroSlides || config.heroSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % config.heroSlides.length);
    }, 6000); // Slightly longer for more dramatic effects
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

      {/* Advanced Hero Carousel Section */}
      <section className="relative h-[720px] md:h-[800px] lg:h-[900px] flex items-center justify-center overflow-hidden group bg-black">
        
        {/* Panning Grid Background */}
        <div className="absolute inset-0 z-0 opacity-20 hero-grid animate-grid-pan pointer-events-none"></div>

        {/* Slides */}
        {(config.heroSlides || []).map((slide, index) => (
          <div 
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="absolute inset-0 bg-black/50 z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-darker via-transparent to-brand-darker/40 z-10" />
            <img 
              src={slide.image} 
              alt="Hero" 
              className={`w-full h-full object-cover transition-transform duration-[12000ms] ease-out ${index === currentSlide ? 'scale-110' : 'scale-100 opacity-0'}`}
            />
          </div>
        ))}

        {/* Tactical HUD Overlay (Retriggers on Slide Change) */}
        <div key={`hud-${currentSlide}`} className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
           <div className="absolute top-10 left-10 w-24 h-24 border-l-4 border-t-4 border-white/20 animate-hud-expand"></div>
           <div className="absolute top-10 right-10 w-24 h-24 border-r-4 border-t-4 border-white/20 animate-hud-expand" style={{ animationDelay: '0.1s' }}></div>
           <div className="absolute bottom-10 left-10 w-24 h-24 border-l-4 border-b-4 border-white/20 animate-hud-expand" style={{ animationDelay: '0.2s' }}></div>
           <div className="absolute bottom-10 right-10 w-24 h-24 border-r-4 border-b-4 border-white/20 animate-hud-expand" style={{ animationDelay: '0.3s' }}></div>
           
           {/* Center Targeting Reticle */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-white/5 rounded-full animate-[pulse_4s_infinite] opacity-30"></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full animate-[pulse_6s_infinite] opacity-10"></div>
        </div>

        {/* Content Box (Keyed to trigger animation on every slide change) */}
        <div key={`content-${currentSlide}`} className="relative z-30 text-center px-4 max-w-5xl mx-auto">
          
          {/* Smaller, More Compact HUD Badge for Mobile */}
          <div className="mb-6 md:mb-10 inline-flex items-center gap-1.5 md:gap-3 px-3 md:px-6 py-1.5 md:py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl animate-reveal-up shadow-[0_0_25px_rgba(255,255,255,0.08)]">
             <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_15px_#00f0ff]"></div>
             <span className="text-[10px] md:text-[13px] font-bold tracking-[0.2em] md:tracking-[0.5em] text-white">SYSTEM ONLINE // AGENT_VERIFIED</span>
          </div>

          <h1 className="text-5xl md:text-8xl lg:text-[10rem] font-display font-black text-white mb-8 md:mb-12 tracking-tighter leading-[0.85] uppercase animate-reveal-up" style={{ animationDelay: '0.15s' }}>
             <span className={`glitch-text block transition-colors duration-1000 ${config.heroSlides?.[currentSlide]?.accent || 'text-white'}`} data-text={config.heroSlides?.[currentSlide]?.title}>
               {config.heroSlides?.[currentSlide]?.title}
             </span>
          </h1>
          
          <p className="text-lg md:text-3xl lg:text-4xl text-slate-300 mb-12 max-w-4xl mx-auto font-light tracking-[0.15em] border-l-4 border-brand-accent pl-6 md:pl-10 text-left md:text-center md:border-l-0 md:pl-0 animate-reveal-up opacity-0 fill-mode-forwards" style={{ animationDelay: '0.3s' }}>
            {config.heroSlides?.[currentSlide]?.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center animate-reveal-up opacity-0 fill-mode-forwards" style={{ animationDelay: '0.45s' }}>
            <Link 
              to="/browse"
              className={`relative overflow-hidden group/btn px-8 py-3.5 md:px-16 md:py-6 ${config.heroSlides?.[currentSlide]?.buttonColor || 'bg-brand-accent'} font-black rounded-none skew-x-[-12deg] uppercase tracking-[0.3em] transition-all shadow-[0_0_40px_rgba(0,0,0,0.5)] hover:shadow-[0_0_60px_rgba(255,70,85,0.4)] hover:scale-105 flex items-center gap-4`}
            >
              {/* Shimmer Effect on Button */}
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full h-full animate-shimmer opacity-20 pointer-events-none"></div>
              
              <div className="skew-x-[12deg] relative z-10 flex items-center gap-4 text-white text-base md:text-2xl">
                START OPERATION <ChevronRight className="w-5 h-5 md:w-8 md:h-8 group-hover/btn:translate-x-2 transition-transform duration-500" />
              </div>
            </Link>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-6">
          {(config.heroSlides || []).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`group relative h-1.5 transition-all duration-700 ${idx === currentSlide ? 'w-24 bg-brand-cyan shadow-[0_0_15px_#00f0ff]' : 'w-8 bg-white/10 hover:bg-white/30'}`}
            >
               {idx === currentSlide && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-brand-cyan tracking-widest animate-pulse">0{idx + 1}</div>}
            </button>
          ))}
        </div>
      </section>

      {/* Trust Indicators - Kinetic Scroll Stagger */}
      <section className="bg-brand-darker border-y border-white/5 py-24 relative overflow-visible">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
          {(config.trustItems || []).map((item, i) => {
            const Icon = trustIcons[i % trustIcons.length] || Star;
            const colors = ["text-brand-cyan", "text-brand-secondary", "text-green-400", "text-brand-accent"];
            return (
             <div 
               key={i} 
               className="animate-on-scroll glass-panel p-8 rounded-2xl flex flex-col items-center gap-4 hover:bg-white/5 group duration-700 border border-white/5 transition-all"
               style={{ transitionDelay: `${i * 150}ms` }}
             >
                <Icon className={`w-10 h-10 ${colors[i % 4]} group-hover:scale-110 transition-transform duration-500 group-hover:drop-shadow-[0_0_10px_currentColor]`} />
                <div className="text-center">
                  <div className="font-display font-bold text-2xl text-white uppercase tracking-tight">{item.label}</div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] mt-1">{item.sub}</div>
                </div>
             </div>
          )})}
        </div>
      </section>

      {/* How It Works - Corrected Placement and Sequential Reveal */}
      <section id="how-it-works" className="py-32 px-4 bg-gradient-to-b from-brand-dark to-brand-surface relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-cyan to-transparent opacity-20"></div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 animate-on-scroll">
            <h2 className="text-4xl md:text-7xl font-display font-black mb-6 tracking-tighter uppercase">
              OPERATION <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-secondary">PROCEDURE</span>
            </h2>
            <div className="h-1.5 w-32 bg-brand-accent mx-auto rounded-full shadow-[0_0_20px_#ff4655]"></div>
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-4 md:gap-0 relative">
            {(config.stepItems || []).map((step, idx, arr) => {
              const isActive = activeStep >= idx;
              const isArrowFilled = activeStep > idx;
              const Icon = stepIcons[idx] || Gamepad2;

              return (
                <React.Fragment key={idx}>
                  <div 
                    data-index={idx}
                    className={`step-trigger step-item animate-on-scroll relative z-10 flex flex-col items-center text-center group transform transition-all duration-700 flex-1 px-4 mb-8 md:mb-0`}
                    style={{ transitionDelay: `${idx * 150}ms` }}
                  >
                    <div className={`w-32 h-32 md:w-36 md:h-36 rounded-full flex items-center justify-center mb-6 md:mb-10 transition-all duration-700 relative ${isActive ? 'bg-brand-surface border-2 border-brand-cyan shadow-[0_0_40px_rgba(0,240,255,0.3)] scale-110' : 'bg-brand-darker border-2 border-white/5 scale-100'}`}>
                      {isActive && <div className="absolute inset-0 rounded-full border border-brand-cyan/40 animate-ping opacity-10"></div>}
                      <Icon className={`w-12 h-12 md:w-14 md:h-14 transition-all duration-500 ${isActive ? 'text-brand-cyan drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]' : 'text-slate-700'}`} />
                      <div className={`absolute -bottom-4 px-4 py-1.5 text-[10px] font-black border rounded-full transition-all duration-500 backdrop-blur-xl uppercase tracking-widest ${isActive ? 'bg-black/80 border-brand-cyan text-brand-cyan shadow-[0_0_20px_rgba(0,240,255,0.3)]' : 'bg-black/80 border-white/10 text-slate-600'}`}>MODULE 0{idx+1}</div>
                    </div>
                    <h3 className={`text-xl md:text-2xl font-black mb-2 md:mb-3 font-display tracking-tight transition-colors duration-500 uppercase ${isActive ? 'text-white' : 'text-slate-600'}`}>{step.title}</h3>
                    <p className={`text-xs md:text-sm font-medium leading-relaxed transition-colors duration-500 max-w-[180px] md:max-w-[200px] ${isActive ? 'text-slate-400' : 'text-slate-800'}`}>{step.desc}</p>
                  </div>
                  {idx < arr.length - 1 && (
                    <>
                      <LiquidArrow filled={isArrowFilled} mobile={true} />
                      <LiquidArrow filled={isArrowFilled} mobile={false} />
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* Community Intel Marquee */}
      <section className="py-24 bg-black overflow-hidden border-y border-white/5 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="text-center mb-16 relative z-10 animate-on-scroll">
          <h2 className="text-4xl md:text-7xl font-display font-black uppercase tracking-tighter">
            COMMUNITY <span className="text-brand-accent glitch-text" data-text="INTEL">INTEL</span>
          </h2>
          <p className="text-slate-500 font-mono mt-3 uppercase tracking-[0.4em] text-[10px] font-bold">Verified Agent Network Logs</p>
        </div>

        <div className="relative w-full hover:pause-marquee group animate-on-scroll" style={{ animationDelay: '0.3s' }}>
          <div className="flex gap-10 w-max animate-marquee">
            {[...(config.reviews || []), ...(config.reviews || [])].map((review, i) => (
              <div 
                key={i} 
                onClick={() => review.type === 'video' ? setSelectedVideo(review) : null}
                className={`w-[340px] md:w-[420px] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all duration-500 group/card ${review.type === 'video' ? 'cursor-pointer hover:border-brand-cyan/50 hover:shadow-[0_0_40px_rgba(0,240,255,0.15)]' : 'bg-white/5'} hover:-translate-y-4`}
              >
                {review.type === 'video' ? (
                  <>
                    <div className="relative h-56 w-full overflow-hidden">
                      <img src={review.thumbnail} alt="Intel Preview" className="w-full h-full object-cover opacity-60 group-hover/card:opacity-100 group-hover/card:scale-110 transition-all duration-1000" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover/card:bg-black/20 transition-colors">
                        <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center pl-1.5 group-hover/card:bg-brand-accent group-hover/card:border-transparent transition-all shadow-2xl">
                          <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 px-3 py-1 bg-brand-cyan/20 border border-brand-cyan/40 rounded text-[10px] font-black text-brand-cyan uppercase tracking-widest shadow-lg">VIDEO EVIDENCE</div>
                    </div>
                    <div className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-accent to-brand-secondary p-[1px] shadow-2xl">
                           <div className="w-full h-full bg-brand-dark rounded-xl flex items-center justify-center text-lg font-black text-white">{review.name.charAt(0)}</div>
                        </div>
                        <div>
                          <div className="font-black text-white font-display tracking-tight text-lg uppercase">{review.name}</div>
                          <div className="text-[10px] text-brand-cyan font-mono uppercase tracking-widest font-bold">{review.rank} AGENT</div>
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm italic leading-relaxed font-medium">"{review.quote}"</p>
                    </div>
                  </>
                ) : (
                  <div className="p-8 flex flex-col h-full min-h-[300px] justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-lg font-black text-slate-300 shadow-inner">{review.name.charAt(0)}</div>
                           <div>
                              <div className="font-black text-white font-display tracking-tight uppercase text-lg">{review.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">{review.rank} CLASS</div>
                           </div>
                        </div>
                        <div className="flex gap-1 text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">
                          {Array.from({length: review.rating || 5}).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                        </div>
                      </div>
                      <p className="text-slate-300 text-base leading-relaxed font-medium">"{review.quote}"</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-6">
                       <span className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.4em] font-bold">{review.date || 'RECENT'}</span>
                       <div className="flex items-center gap-2 text-[10px] font-black text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20 shadow-lg">
                          <CheckCircle2 size={12} /> SECURE RENT
                       </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300 p-4">
          <div className="w-full max-w-6xl aspect-video rounded-none border border-brand-accent/50 relative bg-black shadow-[0_0_120px_rgba(255,70,85,0.25)]">
             <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-brand-accent"></div>
             <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-brand-accent"></div>
             <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-brand-accent"></div>
             <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-brand-accent"></div>
             <CustomVideoPlayer 
                src={selectedVideo.videoUrl!} 
                poster={selectedVideo.thumbnail}
                title={`INTEL DEBRIEF // ${selectedVideo.name}`}
                onClose={() => setSelectedVideo(null)}
             />
          </div>
        </div>
      )}

      {/* CTA Section - The Ultimate Domination Reveal */}
      <section className="py-32 bg-brand-darker relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-accent/5"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-30"></div>
        <div className="max-w-5xl mx-auto text-center px-4 relative z-10">
          <div className="animate-on-scroll opacity-0 translate-y-10 scale-95 duration-1000 transform-gpu">
            <h2 className="text-6xl md:text-9xl font-display font-black mb-10 text-white uppercase tracking-tighter leading-[0.9]">
              {config.cta?.titleLine1} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-secondary glitch-text" data-text={config.cta?.titleLine2}>{config.cta?.titleLine2}</span>
            </h2>
            <p className="text-slate-400 mb-10 text-xl font-light tracking-wide max-w-2xl mx-auto">{config.cta?.subtitle}</p>
            <Link 
              to="/browse" 
              className="inline-block px-6 py-3 md:px-10 md:py-4 bg-white hover:bg-brand-cyan text-brand-darker font-black text-sm md:text-lg skew-x-[-12deg] transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95 uppercase tracking-widest"
            >
              <div className="skew-x-[12deg]">{config.cta?.buttonText}</div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
