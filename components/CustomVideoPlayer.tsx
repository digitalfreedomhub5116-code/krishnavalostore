
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, X, SkipBack, SkipForward } from 'lucide-react';

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  onClose: () => void;
}

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ src, poster, title, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  
  const controlsTimeoutRef = useRef<number | null>(null);

  // Check for ScreenPal or other embeddable URLs
  const isScreenPal = src.includes('screenpal.com');

  if (isScreenPal) {
     // Extract ID from /watch/ or /player/ URL
     // Example: https://go.screenpal.com/watch/cTlql6nYGqu -> cTlql6nYGqu
     const id = src.split('/').pop()?.split('?')[0];
     const embedUrl = `https://go.screenpal.com/player/${id}`;

     return (
        <div className="relative w-full h-full bg-black flex items-center justify-center rounded-xl overflow-hidden shadow-2xl">
           <button 
             onClick={onClose} 
             className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/60 text-white hover:bg-brand-accent transition-colors"
           >
             <X className="w-6 h-6" />
           </button>
           <iframe 
              src={embedUrl} 
              className="w-full h-full border-0" 
              allowFullScreen={true}
              title={title || "Video Player"}
           />
        </div>
     );
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const onEnded = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', onEnded);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
    };
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 3000);
    }
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowControls(true);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 3000);
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (isMuted) {
        videoRef.current.volume = volume;
      } else {
        videoRef.current.volume = 0;
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div 
      ref={playerRef}
      onMouseMove={handleMouseMove}
      onClick={handleMouseMove}
      className="relative w-full h-full bg-black group overflow-hidden flex items-center justify-center font-sans"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        playsInline
      />

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-12 h-12 border-4 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Center Play Button (Visible when paused) */}
      {!isPlaying && !isBuffering && (
        <button 
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 backdrop-blur-[2px] transition-all hover:bg-black/30"
        >
          <div className="w-20 h-20 rounded-full bg-brand-accent/90 flex items-center justify-center pl-2 shadow-[0_0_30px_rgba(255,70,85,0.6)] transform transition-transform hover:scale-110">
            <Play className="w-8 h-8 text-white fill-white" />
          </div>
        </button>
      )}

      {/* Close Button (Top Right) */}
      <button 
        onClick={onClose}
        className={`absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 text-white hover:bg-brand-accent transition-colors ${showControls ? 'opacity-100' : 'opacity-0'} duration-300`}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Title (Top Left) */}
      {title && (
        <div className={`absolute top-4 left-4 z-20 text-white font-display font-bold text-lg drop-shadow-md transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {title}
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-12 pb-4 px-4 transition-transform duration-300 ${showControls ? 'translate-y-0' : 'translate-y-full'}`}>
        
        {/* Seek Bar */}
        <div className="relative group/seek mb-4 cursor-pointer">
          <div className="h-1 bg-white/20 rounded-full w-full overflow-hidden">
             <div 
               className="h-full bg-brand-accent relative" 
               style={{ width: `${(currentTime / duration) * 100}%` }}
             >
               {/* Glow effect at tip */}
               <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-brand-accent rounded-full shadow-[0_0_10px_rgba(255,70,85,1)] scale-0 group-hover/seek:scale-100 transition-transform"></div>
             </div>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          
          {/* Left Controls */}
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white hover:text-brand-accent transition-colors">
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>
            
            {/* Volume */}
            <div className="flex items-center gap-2 group/vol">
              <button onClick={toggleMute} className="text-white hover:text-brand-accent transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300 ease-out">
                 <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-accent"
                />
              </div>
            </div>

            <div className="text-xs font-mono text-slate-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Right Controls */}
          <button onClick={toggleFullscreen} className="text-white hover:text-brand-accent transition-colors">
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
