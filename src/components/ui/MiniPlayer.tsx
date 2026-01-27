import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { TrackDetailsDialog } from './TrackDetailsDialog';
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
  const [isDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(progress);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);

  const progressRef = useRef<HTMLDivElement>(null);

  // Update local progress when prop changes (but not while dragging)
  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(progress);
    }
  }, [progress, isDragging]);

  // Sync volume state on mount
  useEffect(() => {
    if (volume > 0 && isMuted) {
      setIsMuted(false);
    } else if (volume === 0 && !isMuted) {
      setIsMuted(true);
    }
  }, [volume, isMuted]);

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

  const duration = currentTrack.duration || 180000; // Fallback to 3 minutes
  const currentTime = (localProgress / 100) * duration / 1000;
  const totalTime = duration / 1000;

  if (isMinimized) {
    return (
      <div className={cn(
        "fixed bottom-4 right-4 bg-white dark:bg-gray-900 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-50 transition-all duration-300 hover:scale-105",
        className
      )}>
        <div className="flex items-center space-x-2">
          <img
            src={getImageUrl(currentTrack.poster_path)}
            alt={currentTrack.title || currentTrack.name}
            className={cn(
              "w-10 h-10 rounded-full object-cover",
              isPlaying && "animate-spin"
            )}
            style={{ animationDuration: '3s' }}
          />
          <Button
            onClick={onTogglePlay}
            variant="ghost"
            size="icon"
            className="flex items-center justify-center w-8 h-8 bg-brand hover:brightness-90 text-white rounded-full transition-colors duration-200"
          >
            {isPlaying ? <FiPause className="w-4 h-4" /> : <FiPlay className="w-4 h-4 ml-0.5" />}
          </Button>
          <Button
            onClick={onToggleMinimize}
            variant="ghost"
            size="icon"
            className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <FiMaximize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 z-40 transition-all duration-300",
      className
    )}>
      {/* Progress bar - full width at top */}
      <div
        className="w-full h-1 bg-gray-200 dark:bg-gray-700 cursor-pointer group"
        ref={progressRef}
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-brand transition-all duration-100 rounded-full relative group-hover:brightness-110"
          style={{ width: `${localProgress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-brand rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mr-1.5"></div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        {/* Track info */}
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div
            className="relative cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsDetailsOpen(true)}
          >
            <img
              src={getImageUrl(currentTrack.poster_path)}
              alt={currentTrack.title || currentTrack.name}
              className="w-12 h-12 rounded-lg object-cover shadow-md dark:brightness-75 dark:contrast-110 dark:saturate-90"
            />
            {isPlaying && (
              <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                <div className="flex space-x-0.5">
                  <div className="w-0.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  <div className="w-0.5 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-0.5 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>

          <div
            className="min-w-0 flex-1 cursor-pointer group"
            onClick={() => setIsDetailsOpen(true)}
          >
            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm group-hover:underline">
              {currentTrack.title || currentTrack.name || 'Unknown Track'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 truncate text-xs group-hover:text-brand transition-colors">
              {currentTrack.artist || 'Unknown Artist'}
            </p>
          </div>

          <Button
            onClick={handleFavoriteClick}
            variant="ghost"
            size="icon"
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 hover:scale-110",
              isFavorite
                ? "text-red-500 hover:text-red-600"
                : "text-gray-400 hover:text-red-500 dark:text-gray-500"
            )}
          >
            <FiHeart className={cn("w-4 h-4", isFavorite && "fill-current")} />
          </Button>

          {currentTrack.external_urls?.spotify && (
            <Button
              onClick={() => window.open(currentTrack.external_urls?.spotify, '_blank')}
              variant="ghost"
              size="icon"
              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-green-500 dark:text-gray-500 hover:scale-110 transition-all duration-200"
              title="Listen on Spotify/Apple Music"
            >
              <FiExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Main controls */}
        <div className="flex items-center space-x-4 px-8">
          <Button
            onClick={onToggleShuffle}
            variant="ghost"
            size="icon"
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 hover:scale-110",
              isShuffled
                ? "text-brand bg-red-50 dark:bg-red-900/20"
                : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            )}
          >
            <FiShuffle className="w-4 h-4" />
          </Button>

          <Button
            onClick={onSkipPrevious}
            variant="ghost"
            size="icon"
            className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all duration-200 hover:scale-110"
          >
            <FiSkipBack className="w-5 h-5" />
          </Button>

          <Button
            onClick={onTogglePlay}
            variant="ghost"
            size="icon"
            className="flex items-center justify-center w-12 h-12 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          >
            {isPlaying ? (
              <FiPause className="w-6 h-6" />
            ) : (
              <FiPlay className="w-6 h-6 ml-0.5" />
            )}
          </Button>

          <Button
            onClick={onSkipNext}
            variant="ghost"
            size="icon"
            className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all duration-200 hover:scale-110"
          >
            <FiSkipForward className="w-5 h-5" />
          </Button>

          <Button
            onClick={onToggleRepeat}
            variant="ghost"
            size="icon"
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 relative",
              repeatMode !== 'off'
                ? "text-brand bg-red-50 dark:bg-red-900/20"
                : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            )}
          >
            <FiRepeat className="w-4 h-4" />
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand text-white text-xs rounded-full flex items-center justify-center font-bold">1</span>
            )}
          </Button>
        </div>

        {/* Time and volume */}
        <div className="flex items-center space-x-4 min-w-0 flex-1 justify-end">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {formatTime(currentTime)} / {formatTime(totalTime)}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <Button
              onClick={handleVolumeClick}
              variant="ghost"
              size="icon"
              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
            >
              {isMuted || volume === 0 ? (
                <FiVolumeX className="w-4 h-4" />
              ) : (
                <FiVolume2 className="w-4 h-4" />
              )}
            </Button>

            {showVolumeSlider && (
              <div
                className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-50"
                onMouseEnter={() => setShowVolumeSlider(true)}
              >
                <div
                  className="w-8 h-32 flex flex-col items-center justify-center cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const height = rect.height;
                    const y = e.clientY - rect.top;
                    const percentage = Math.max(0, Math.min(100, 100 - (y / height) * 100));
                    onVolumeChange?.(Math.round(percentage));
                    if (percentage > 0) setIsMuted(false);
                  }}
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono h-4">
                    {Math.round(volume || 0)}
                  </div>
                  <div className="flex-1 w-1.5 bg-gray-200 dark:bg-gray-700 rounded-full relative overflow-hidden">
                    <div
                      className="w-full bg-brand absolute bottom-0 transition-all duration-75"
                      style={{ height: `${volume}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>


          <Button
            onClick={onToggleQueue}
            variant="ghost"
            size="icon"
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
            title="Queue"
          >
            <FiList className="w-4 h-4" />
          </Button>

          <Button
            onClick={onToggleMinimize}
            variant="ghost"
            size="icon"
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <FiMinimize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <TrackDetailsDialog
        track={currentTrack}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
};