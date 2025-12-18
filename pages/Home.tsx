import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Gamepad2, Clock, QrCode, MessageCircle, Play, Star, Zap, Shield, TrendingUp, CheckCircle2, Loader2 } from 'lucide-react';
import CustomVideoPlayer from '../components/CustomVideoPlayer';
import { StorageService } from '../services/storage';
import { HomeConfig, Review } from '../types';

const LiquidArrow: React.FC<{ filled: boolean; mobile: boolean }> = ({ filled, mobile }) => {
  return (
    <div className={`relative flex items-center justify-center transition-all duration-1000 ${mobile ? 'h-24 w-full md:hidden' : 'hidden md:flex w-24 h-full'}`}>
       <svg 
         viewBox="0 0 100 100" 
         className={`w-12 h-12 opacity-80 drop-shadow-[0_0_10px_rgba(0,240,255,0.2)] ${mobile ? 'rotate-90' : ''}`}
         preserveAspectRatio="none"
       >
         <path d="M0 40 H70 L70 20 L100 50 L70 80 L70 60 H0 Z" fill="#1e293b" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
         <defs>
            <clipPath id={`arrow-mask-${mobile ? 'm' : 'd'}`}>
              <path d="M0 40 H70 L70 20 L100 50 L70 80 L70 60 H0 Z" />
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
             <stop offset="0%" stopColor="#00f0ff">
               <animate attributeName="stop-color" values="#00f0ff;#2563eb;#00f0ff" dur="2s" repeatCount="indefinite" />
             </stop>
             <stop offset="100%" stopColor="#3b82f6" />
           </linearGradient>
         </defs>
       </svg>
    </div>
  );
};

const Home: React.FC = () => {
  const [config, setConfig] = useState<HomeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Review | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeStep, setActiveStep] = useState(-1);
  const [trustVisible, setTrustVisible] = useState(false);
  const trustRef = useRef<HTMLElement>(null);

  const loadConfig = async () => {
    try {
      const data = await StorageService.getHomeConfig();
      setConfig(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    window.addEventListener('storage', loadConfig);
    return () => window.removeEventListener('storage', loadConfig);
  }, []);

  useEffect(() => {
    if (!config || config.heroSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % config.heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [config?.heroSlides.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTrustVisible(true);
        }
      },
      { threshold: 0.15 }
    );
    if (trustRef.current) observer.observe(trustRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!config) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          setActiveStep(index);
        }
      });
    }, { threshold: 0.5, rootMargin: "-10% 0px -10% 0px" });
    document.querySelectorAll('.step-item').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [config?.stepItems]);

  if (loading) {
    return (
      <div className="h-[650px] flex items-center justify-center bg-brand-dark">
         <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-brand-accent animate-spin" />
            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Loading Storefront...</p>
         </div>
      </div>
    );
  }

  if (!config) return null;

  const trustIcons = [Zap, Shield, TrendingUp, Star];
  const stepIcons = [Gamepad2, Clock, QrCode, MessageCircle];

  return (
    <div className="flex flex-col overflow-hidden">
      
      {/* Marquee Header */}
      <div className="bg-brand-accent/20 border-b border-brand-accent/30 py-1 overflow-hidden backdrop-blur-md relative z-20">
        <div className="animate-marquee whitespace-nowrap flex gap-12 text-xs font-bold font-mono tracking-widest text-brand-cyan">
           {config.marqueeText.map((text, i) => (
             <React.Fragment key={i}>
               <span>{text}</span>
               <span className="text-white">•</span>
             </React.Fragment>
           ))}
        </div>
      </div>

      {/* Hero Carousel Section */}
      <section className="relative h-[650px] flex items-center justify-center overflow-hidden group">
        {config.heroSlides.map((slide, index) => (
          <div 
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="absolute inset-0 bg-black/50 z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-brand-dark/40 z-10" />
            <img 
              src={slide.image} 
              alt="Hero" 
              className={`w-full h-full object-cover transition-transform duration-[5000ms] ease-out ${index === currentSlide ? 'scale-110' : 'scale-100'}`}
            />
          </div>
        ))}

        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto mt-10">
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 backdrop-blur-md animate-float">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-xs font-bold tracking-widest text-green-400">ONLINE & READY</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-display font-bold text-white mb-6 tracking-tighter leading-tight">
             <span className={`glitch-text block ${config.heroSlides[currentSlide]?.accent || 'text-white'}`} data-text={config.heroSlides[currentSlide]?.title}>
               {config.heroSlides[currentSlide]?.title}
             </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto font-light tracking-wide border-l-4 border-brand-accent pl-4 text-left md:text-center md:border-l-0 md:pl-0">
            {config.heroSlides[currentSlide]?.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              to="/browse"
              className={`px-10 py-4 ${config.heroSlides[currentSlide]?.buttonColor || 'bg-brand-accent'} font-bold rounded-none skew-x-[-10deg] uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:scale-105 flex items-center gap-2 group/btn`}
            >
              <div className="skew-x-[10deg] flex items-center gap-2 text-white">
                Rent Now <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </div>
            </Link>
            <a href="#how-it-works" className="text-sm font-bold tracking-widest text-slate-400 hover:text-white transition-colors border-b border-transparent hover:border-brand-cyan">
              HOW IT WORKS
            </a>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-3">
          {config.heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1 transition-all duration-300 ${idx === currentSlide ? 'w-12 bg-white shadow-[0_0_10px_white]' : 'w-4 bg-white/30 hover:bg-white/50'}`}
            />
          ))}
        </div>
      </section>

      {/* Trust Indicators */}
      <section ref={trustRef} className="bg-brand-darker border-y border-white/5 py-12 relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
          {config.trustItems.map((item, i) => {
            const Icon = trustIcons[i] || Star;
            const colors = ["text-brand-cyan", "text-brand-secondary", "text-green-400", "text-brand-accent"];
            return (
             <div 
               key={i} 
               className={`glass-panel p-6 rounded-xl flex flex-col items-center gap-3 hover:bg-white/5 group duration-700
                 ${trustVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-24 scale-90'}
               `}
               style={{ transitionDelay: `${i * 150}ms`, transitionProperty: 'all', transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
             >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                <Icon className={`w-8 h-8 ${colors[i % 4]} group-hover:scale-110 transition-transform duration-300`} />
                <div className="text-center">
                  <div className="font-display font-bold text-xl text-white">{item.label}</div>
                  <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">{item.sub}</div>
                </div>
             </div>
          )})}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 bg-gradient-to-b from-brand-dark to-brand-surface relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              SYSTEM <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-secondary">INITIATED</span>
            </h2>
            <div className="h-1 w-20 bg-brand-accent mx-auto rounded-full"></div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative">
            {config.stepItems.map((step, idx, arr) => {
              const isActive = activeStep >= idx;
              const isArrowFilled = activeStep > idx;
              const Icon = stepIcons[idx] || Gamepad2;

              return (
                <React.Fragment key={idx}>
                  <div 
                    data-index={idx}
                    className={`step-item relative z-10 flex flex-col items-center text-center group transition-all duration-700 transform flex-1 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-50'}`}
                  >
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all duration-500 relative ${isActive ? 'bg-brand-surface border-2 border-brand-cyan shadow-[0_0_30px_rgba(0,240,255,0.3)] scale-110' : 'bg-brand-darker border-2 border-white/10'}`}>
                      {isActive && <div className="absolute inset-0 rounded-full border border-brand-cyan/50 animate-ping opacity-20"></div>}
                      <Icon className={`w-12 h-12 pb-1 transition-colors duration-300 ${isActive ? 'text-brand-cyan drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]' : 'text-slate-500'}`} />
                      <div className={`absolute -bottom-3 px-3 py-1 text-xs font-mono border rounded-full transition-colors duration-300 backdrop-blur-md ${isActive ? 'bg-black/80 border-brand-cyan text-brand-cyan shadow-[0_0_10px_rgba(0,240,255,0.4)]' : 'bg-black/80 border-white/10 text-slate-500'}`}>STEP 0{idx+1}</div>
                    </div>
                    <h3 className={`text-xl font-bold mb-2 font-display tracking-wide transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500'}`}>{step.title}</h3>
                    <p className={`text-sm font-mono transition-colors duration-300 ${isActive ? 'text-brand-cyan' : 'text-slate-600'}`}>{step.desc}</p>
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

      {/* Mixed Community Intel Marquee */}
      <section className="py-24 bg-black overflow-hidden border-t border-white/10 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="text-center mb-12 relative z-10">
          <h2 className="text-3xl md:text-5xl font-display font-bold">
            COMMUNITY <span className="text-brand-accent glitch-text" data-text="INTEL">INTEL</span>
          </h2>
          <p className="text-slate-500 font-mono mt-2 uppercase tracking-widest text-xs">Verified Agents & Verified Feed</p>
        </div>

        <div className="relative w-full hover:pause-marquee">
          <div className="flex gap-8 w-max animate-marquee">
            {[...config.reviews, ...config.reviews].map((review, i) => (
              <div 
                key={i} 
                onClick={() => review.type === 'video' ? setSelectedVideo(review) : null}
                className={`w-[320px] md:w-[380px] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 group ${review.type === 'video' ? 'cursor-pointer hover:border-brand-cyan/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.1)]' : 'bg-white/5'} hover:-translate-y-2`}
              >
                {review.type === 'video' ? (
                  <>
                    <div className="relative h-48 w-full overflow-hidden">
                      <img src={review.thumbnail} alt="Video Review" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center pl-1 group-hover:bg-brand-accent group-hover:border-transparent transition-all shadow-xl">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-brand-cyan/20 border border-brand-cyan/30 rounded text-[10px] font-bold text-brand-cyan uppercase tracking-widest">Video Evidence</div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-accent to-brand-secondary p-[1px] shadow-lg">
                           <div className="w-full h-full bg-brand-dark rounded-lg flex items-center justify-center text-sm font-bold text-white">{review.name.charAt(0)}</div>
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white font-display tracking-wide">{review.name}</div>
                          <div className="text-[10px] text-brand-cyan font-mono uppercase">{review.rank} Rank</div>
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm italic border-l-2 border-brand-accent pl-3 mb-2">"{review.quote}"</p>
                    </div>
                  </>
                ) : (
                  <div className="p-6 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-bold text-slate-300">{review.name.charAt(0)}</div>
                           <div>
                              <div className="font-bold text-sm text-white font-display tracking-wide">{review.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono uppercase">{review.rank} Rank</div>
                           </div>
                        </div>
                        <div className="flex gap-0.5 text-yellow-500">
                          {Array.from({length: review.rating || 5}).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed mb-6">"{review.quote}"</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                       <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">{review.date || 'RECENTLY'}</span>
                       <div className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
                          <CheckCircle2 size={10} /> VERIFIED RENT
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg animate-in fade-in duration-300 p-4">
          <div className="w-full max-w-6xl aspect-video rounded-none border border-brand-accent/50 relative bg-black shadow-[0_0_100px_rgba(255,70,85,0.2)]">
             <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-brand-accent"></div>
             <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-brand-accent"></div>
             <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-brand-accent"></div>
             <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-brand-accent"></div>
             <CustomVideoPlayer 
                src={selectedVideo.videoUrl!} 
                poster={selectedVideo.thumbnail}
                title={`INTEL // ${selectedVideo.name}`}
                onClose={() => setSelectedVideo(null)}
             />
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-24 bg-brand-darker relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-accent/5"></div>
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <h2 className="text-5xl md:text-7xl font-display font-bold mb-6 text-white uppercase tracking-tighter">
            {config.cta.titleLine1} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-secondary glitch-text" data-text={config.cta.titleLine2}>{config.cta.titleLine2}</span>
          </h2>
          <p className="text-slate-400 mb-10 text-lg font-light">{config.cta.subtitle}</p>
          <Link 
            to="/browse" 
            className="inline-block px-12 py-5 bg-white hover:bg-brand-cyan text-brand-darker font-black text-xl skew-x-[-10deg] transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            <div className="skew-x-[10deg]">{config.cta.buttonText}</div>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;