import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';
import { TrackDetailsDialog } from './TrackDetailsDialog';
import { FullScreenPlayer } from './FullScreenPlayer';
import {
  FiPlay,
  FiPause,
  FiSkipBack,
  FiSkipForward,
  FiVolume2,
  FiVolumeX,
  FiShuffle,
  FiRepeat,
  FiHeart,
  FiList,
  FiMinimize2,
  FiMaximize2,
  FiExternalLink
} from 'react-icons/fi';
import { ITrack } from '@/types';
import { getImageUrl, cn } from '@/utils';

interface MiniPlayerProps {
  currentTrack?: ITrack | null;
  isPlaying?: boolean;
  progress?: number;
  volume?: number;
  isShuffled?: boolean;
  repeatMode?: 'off' | 'one' | 'all';
  onTogglePlay?: () => void;
  onSkipPrevious?: () => void;
  onSkipNext?: () => void;
  onSeek?: (position: number) => void;
  onVolumeChange?: (volume: number) => void;
  onToggleShuffle?: () => void;
  onToggleRepeat?: () => void;
  onToggleFavorite?: () => void;
  onClose?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onToggleQueue?: () => void;
  className?: string;
  isFavorite?: boolean;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying = false,
  progress = 0,
  volume = 80,
  isShuffled = false,
  repeatMode = 'off',
  onTogglePlay,
  onSkipPrevious,
  onSkipNext,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFavorite,
  onClose: _onClose,
  isMinimized = false,
  onToggleMinimize,
  onToggleQueue,
  className,
  isFavorite = false,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(progress);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);

  const progressRef = useRef<HTMLDivElement>(null);
  const volumeSliderRef = useRef<HTMLDivElement>(null);

  // Update local progress when prop changes
  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(progress);
    }
  }, [progress, isDragging]);

  // Sync volume state
  useEffect(() => {
    if (volume > 0 && isMuted) {
      setIsMuted(false);
    } else if (volume === 0 && !isMuted) {
      setIsMuted(true);
    }
  }, [volume, isMuted]);

  // Handle progress dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onSeek?.(localProgress);
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && progressRef.current) {
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setLocalProgress(percentage);
      }
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, localProgress, onSeek]);

  // Handle volume dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingVolume) {
        setIsDraggingVolume(false);
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingVolume && volumeSliderRef.current) {
        const rect = volumeSliderRef.current.getBoundingClientRect();
        const height = rect.height;
        const distanceFromBottom = rect.bottom - e.clientY;
        const percentage = Math.max(0, Math.min(100, (distanceFromBottom / height) * 100));
        onVolumeChange?.(Math.round(percentage));
        if (percentage > 0) setIsMuted(false);
      }
    };

    if (isDraggingVolume) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDraggingVolume, onVolumeChange]);

  if (!currentTrack) return null;

  const handleVolumeClick = () => {
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange?.(previousVolume || 80);
    } else {
      setPreviousVolume(volume);
      setIsMuted(true);
      onVolumeChange?.(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFavoriteClick = () => {
    onToggleFavorite?.();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    setLocalProgress(clampedPercentage);
    onSeek?.(clampedPercentage);
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);
  };

  const duration = currentTrack.duration || 180000;
  const currentTime = (localProgress / 100) * duration / 1000;
  const totalTime = duration / 1000;

  // Minimized mode - floating player
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          'fixed bottom-20 md:bottom-6 right-4 md:right-6',
          'bg-white/90 dark:bg-gray-950/90 backdrop-blur-2xl',
          'border border-gray-200 dark:border-gray-800',
          'rounded-full shadow-2xl p-3 z-50',
          'hover:shadow-3xl transition-shadow duration-300',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img
              src={getImageUrl(currentTrack.poster_path)}
              alt={currentTrack.title || currentTrack.name}
              className={cn(
                'w-12 h-12 rounded-full object-cover shadow-md',
                isPlaying && 'animate-spin'
              )}
              style={{ animationDuration: '8s', animationTimingFunction: 'linear' }}
            />
            {isPlaying && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full shadow-lg"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-full h-full bg-green-400 rounded-full"
                />
              </motion.div>
            )}
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
            <Button
              onClick={onTogglePlay}
              variant="ghost"
              size="icon"
              className="w-10 h-10 bg-brand hover:bg-brand/90 text-white rounded-full shadow-lg"
            >
              {isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5 ml-0.5" />}
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              onClick={onToggleMinimize}
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FiMaximize2 className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className={cn(
        'fixed bottom-0 left-0 right-0',
        'bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl',
        'border-t border-gray-200 dark:border-gray-800',
        'z-40 shadow-2xl',
        className
      )}
    >
      {/* Enhanced Progress Bar */}
      <div
        ref={progressRef}
        className={cn(
          'w-full bg-gray-200 dark:bg-gray-800 cursor-pointer group relative transition-all duration-200',
          isHoveringProgress ? 'h-2' : 'h-1.5'
        )}
        onClick={handleProgressClick}
        onMouseDown={handleProgressMouseDown}
        onMouseEnter={() => setIsHoveringProgress(true)}
        onMouseLeave={() => setIsHoveringProgress(false)}
      >
        {/* Progress fill */}
        <motion.div
          className="h-full bg-gradient-to-r from-brand to-red-600 relative overflow-hidden"
          style={{ width: `${localProgress}%` }}
          transition={{ duration: 0.1 }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          />
        </motion.div>

        {/* Hover indicator */}
        <AnimatePresence>
          {isHoveringProgress && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-gray-100 rounded-full shadow-lg border-2 border-brand"
              style={{ left: `${localProgress}%`, marginLeft: '-6px' }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden">
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer"
          onClick={() => setIsFullScreenOpen(true)}
        >
          {/* Track Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative flex-shrink-0"
            >
              <img
                src={getImageUrl(currentTrack.poster_path)}
                alt="Cover"
                className="w-12 h-12 rounded-lg object-cover shadow-md"
              />
              {isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                  <div className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 bg-white rounded-full"
                        animate={{ height: ['4px', '12px', '4px'] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {currentTrack.title || currentTrack.name || 'Unknown Track'}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {currentTrack.artist || 'Unknown Artist'}
              </span>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavoriteClick();
                }}
                variant="ghost"
                size="icon"
                className={cn(
                  'h-10 w-10',
                  isFavorite ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                )}
              >
                <motion.div
                  animate={isFavorite ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <FiHeart className={cn('w-5 h-5', isFavorite && 'fill-current')} />
                </motion.div>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePlay?.();
                }}
                variant="ghost"
                size="icon"
                className="h-11 w-11 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-full shadow-lg"
              >
                {isPlaying ? (
                  <FiPause className="w-6 h-6" />
                ) : (
                  <FiPlay className="w-6 h-6 ml-0.5" />
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between px-6 py-3 gap-8">
        {/* Left: Track Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative cursor-pointer flex-shrink-0"
            onClick={() => setIsDetailsOpen(true)}
          >
            <img
              src={getImageUrl(currentTrack.poster_path)}
              alt={currentTrack.title || currentTrack.name}
              className="w-14 h-14 rounded-lg object-cover shadow-lg"
            />
            {isPlaying && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full shadow-lg"
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-full h-full bg-green-400 rounded-full"
                />
              </motion.div>
            )}
          </motion.div>

          <div
            className="flex-1 min-w-0 cursor-pointer group"
            onClick={() => setIsDetailsOpen(true)}
          >
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-brand transition-colors">
              {currentTrack.title || currentTrack.name || 'Unknown Track'}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {currentTrack.artist || 'Unknown Artist'}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={handleFavoriteClick}
                variant="ghost"
                size="icon"
                className={cn(
                  'w-9 h-9 rounded-full',
                  isFavorite
                    ? 'text-red-500 bg-red-50 dark:bg-red-950/30'
                    : 'text-gray-400 hover:text-red-500 dark:text-gray-500'
                )}
              >
                <FiHeart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
              </Button>
            </motion.div>

            {currentTrack.external_urls?.spotify && (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  onClick={() => window.open(currentTrack.external_urls?.spotify, '_blank')}
                  variant="ghost"
                  size="icon"
                  className="w-9 h-9 rounded-full text-gray-400 hover:text-green-500 dark:text-gray-500"
                  title="Open in Spotify"
                >
                  <FiExternalLink className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={onToggleShuffle}
                variant="ghost"
                size="icon"
                className={cn(
                  'w-8 h-8 rounded-full',
                  isShuffled
                    ? 'text-brand bg-red-50 dark:bg-red-950/30'
                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                )}
              >
                <FiShuffle className="w-4 h-4" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={onSkipPrevious}
                variant="ghost"
                size="icon"
                className="w-9 h-9 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <FiSkipBack className="w-5 h-5" />
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={onTogglePlay}
                variant="ghost"
                size="icon"
                className="w-12 h-12 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-full shadow-lg"
              >
                {isPlaying ? (
                  <FiPause className="w-6 h-6" />
                ) : (
                  <FiPlay className="w-6 h-6 ml-0.5" />
                )}
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={onSkipNext}
                variant="ghost"
                size="icon"
                className="w-9 h-9 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <FiSkipForward className="w-5 h-5" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={onToggleRepeat}
                variant="ghost"
                size="icon"
                className={cn(
                  'w-8 h-8 rounded-full relative',
                  repeatMode !== 'off'
                    ? 'text-brand bg-red-50 dark:bg-red-950/30'
                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                )}
              >
                <FiRepeat className="w-4 h-4" />
                {repeatMode === 'one' && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-brand text-white text-[9px] rounded-full flex items-center justify-center font-bold"
                  >
                    1
                  </motion.span>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Time display */}
          <div className="flex items-center gap-3 w-full max-w-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono tabular-nums min-w-[40px] text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-brand to-red-600"
                style={{ width: `${localProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono tabular-nums min-w-[40px]">
              {formatTime(totalTime)}
            </span>
          </div>
        </div>

        {/* Right: Volume & Actions */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div
            className="relative"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => !isDraggingVolume && setShowVolumeSlider(false)}
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={handleVolumeClick}
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                {isMuted || volume === 0 ? (
                  <FiVolumeX className="w-4 h-4" />
                ) : (
                  <FiVolume2 className="w-4 h-4" />
                )}
              </Button>
            </motion.div>

            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                  className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-3 z-50"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                >
                  <div
                    ref={volumeSliderRef}
                    className="w-10 h-32 flex flex-col items-center cursor-pointer select-none"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsDraggingVolume(true);
                      const rect = e.currentTarget.getBoundingClientRect();
                      const distanceFromBottom = rect.bottom - e.clientY;
                      const percentage = Math.max(0, Math.min(100, (distanceFromBottom / rect.height) * 100));
                      onVolumeChange?.(Math.round(percentage));
                      if (percentage > 0) setIsMuted(false);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-mono font-semibold">
                      {Math.round(volume || 0)}
                    </div>
                    <div className="flex-1 w-2 bg-gray-200 dark:bg-gray-800 rounded-full relative overflow-hidden">
                      <motion.div
                        className="w-full bg-gradient-to-t from-brand to-red-600 absolute bottom-0 rounded-full"
                        style={{ height: `${volume}%` }}
                        transition={{ duration: 0.1 }}
                      />
                      <motion.div
                        className="absolute w-3 h-3 bg-white dark:bg-gray-100 rounded-full shadow-lg border-2 border-brand left-1/2 -translate-x-1/2"
                        style={{ bottom: `calc(${volume}% - 6px)` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              onClick={onToggleQueue}
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              title="Queue"
            >
              <FiList className="w-4 h-4" />
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              onClick={onToggleMinimize}
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              title="Minimize"
            >
              <FiMinimize2 className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>

      <TrackDetailsDialog
        track={currentTrack}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      {/* Full Screen Mobile Player */}
      <FullScreenPlayer
        isOpen={isFullScreenOpen}
        onClose={() => setIsFullScreenOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        progress={localProgress}
        volume={volume}
        isShuffled={isShuffled}
        repeatMode={repeatMode}
        onTogglePlay={onTogglePlay}
        onSkipPrevious={onSkipPrevious}
        onSkipNext={onSkipNext}
        onSeek={onSeek}
        onVolumeChange={onVolumeChange}
        onToggleShuffle={onToggleShuffle}
        onToggleRepeat={onToggleRepeat}
        onToggleFavorite={onToggleFavorite}
        onToggleQueue={onToggleQueue}
        isFavorite={isFavorite}
      />
    </motion.div>
  );
};