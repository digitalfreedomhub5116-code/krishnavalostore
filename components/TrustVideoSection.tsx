import React, { useState, useEffect } from 'react';
import { Play, Star, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Review } from '../types';
import { StorageService } from '../services/storage';
import CustomVideoPlayer from './CustomVideoPlayer';

interface TrustVideoSectionProps {
  className?: string;
}

const HIGH_RANKS = ['Ascendant', 'Immortal', 'Ascendant 2'];

export const TrustVideoSection: React.FC<TrustVideoSectionProps> = ({ className = '' }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<Review | null>(null);

  useEffect(() => {
    StorageService.getHomeConfig().then(cfg => {
      const vReviews = (cfg.reviews || []).filter(r => r.type === 'video');
      if (vReviews.length > 0) {
        setReviews(vReviews);
      }
    });
  }, []);

  if (reviews.length === 0) return null;

  const currentReview = reviews[currentIndex] || reviews[0];
  const displayRank = HIGH_RANKS[currentIndex % HIGH_RANKS.length];

  return (
    <div className={`bg-brand-surface border border-white/10 rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-xl ${className}`}>
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-brand-cyan/5 blur-3xl rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="mb-3.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-[10px] font-bold uppercase tracking-widest mb-1.5">
          <ShieldCheck size={12} /> Verified Proof
        </div>
        <h3 className="text-lg sm:text-xl font-display font-black text-white uppercase italic tracking-wide">
          Don't trust us?
        </h3>
        <p className="text-xs text-slate-300">
          View what people say about us.
        </p>
      </div>

      {/* Video Review Card - Decluttered & Properly Framed */}
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-brand-dark group shadow-lg">
        <div 
          onClick={() => setSelectedVideo(currentReview)}
          className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden cursor-pointer"
        >
          <img 
            src={currentReview.thumbnail} 
            alt={currentReview.name} 
            className="w-full h-full object-cover object-top opacity-85 group-hover:opacity-95 group-hover:scale-105 transition-all duration-500" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40"></div>

          {/* Star Rating - Top Right */}
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-md rounded-md border border-white/10 flex items-center gap-1 text-yellow-400 z-10 shadow-lg">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={11} className="fill-yellow-400 text-yellow-400" />
            ))}
          </div>

          {/* Central Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-brand-accent/90 hover:bg-brand-accent border-2 border-white/40 flex items-center justify-center pl-1 shadow-[0_0_30px_rgba(255,70,85,0.7)] group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white" />
            </div>
          </div>

          {/* Bottom Info: Rank in front of Name only */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan text-[10px] font-mono font-bold uppercase tracking-wider">
                {displayRank}
              </span>
              <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                {currentReview.name}
              </span>
            </div>
          </div>
        </div>

        {/* Carousel Navigation */}
        {reviews.length > 1 && (
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-brand-dark/95 border-t border-white/5 text-xs text-slate-400">
            <span className="text-[10px] font-mono uppercase tracking-wider">
              Review {currentIndex + 1} of {reviews.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev > 0 ? prev - 1 : reviews.length - 1));
                }}
                className="p-1.5 rounded bg-white/5 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title="Previous Review"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev < reviews.length - 1 ? prev + 1 : 0));
                }}
                className="p-1.5 rounded bg-white/5 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title="Next Review"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedVideo(null)}
        >
          <div 
            className="relative h-[80vh] w-auto aspect-[9/16] max-w-full rounded-2xl border border-brand-accent/40 bg-black shadow-[0_0_80px_rgba(255,70,85,0.3)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <CustomVideoPlayer 
              src={selectedVideo.videoUrl!} 
              poster={selectedVideo.thumbnail} 
              title={`${selectedVideo.name} // ${displayRank}`} 
              onClose={() => setSelectedVideo(null)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustVideoSection;
