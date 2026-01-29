import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';
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
    FiChevronDown,
    FiShare2,
    FiMoreHorizontal
} from 'react-icons/fi';
import { ITrack } from '@/types';
import { getImageUrl, cn } from '@/utils';

interface FullScreenPlayerProps {
    isOpen: boolean;
    onClose: () => void;
    currentTrack: ITrack | null;
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
    onToggleQueue?: () => void;
    isFavorite?: boolean;
}

export const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({
    isOpen,
    onClose,
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
    onToggleQueue,
    isFavorite = false,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [localProgress, setLocalProgress] = useState(progress);
    const [isMuted, setIsMuted] = useState(false);
    const [previousVolume, setPreviousVolume] = useState(volume);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const progressRef = useRef<HTMLDivElement>(null);

    // Update local progress when prop changes
    useEffect(() => {
        if (!isDragging) {
            setLocalProgress(progress);
        }
    }, [progress, isDragging]);

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

        const handleTouchMove = (e: TouchEvent) => {
            if (isDragging && progressRef.current) {
                const rect = progressRef.current.getBoundingClientRect();
                const x = e.touches[0].clientX - rect.left;
                const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                setLocalProgress(percentage);
            }
        };

        const handleTouchEnd = () => {
            if (isDragging) {
                setIsDragging(false);
                onSeek?.(localProgress);
            }
        };

        if (isDragging) {
            window.addEventListener('mouseup', handleGlobalMouseUp);
            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, localProgress, onSeek]);

    if (!currentTrack) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        if (!progressRef.current) return;
        const rect = progressRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const x = clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        const clampedPercentage = Math.max(0, Math.min(100, percentage));
        setLocalProgress(clampedPercentage);
        onSeek?.(clampedPercentage);
    };

    const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        setIsDragging(true);
        handleProgressClick(e);
    };

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

    const duration = currentTrack.duration || 180000;
    const currentTime = (localProgress / 100) * duration / 1000;
    const totalTime = duration / 1000;

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed inset-0 z-[9999] flex flex-col"
                    style={{
                        background: "#000000",
                    }}
                >
                    {/* Background Image with blur */}
                    <div className="absolute inset-0 -z-10 overflow-hidden">
                        <motion.img
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            src={getImageUrl(currentTrack.poster_path)}
                            alt=""
                            className="w-full h-full object-cover blur-3xl scale-110 opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/90" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 pt-12 pb-4 relative z-10">
                        <motion.div whileTap={{ scale: 0.9 }}>
                            <Button
                                onClick={onClose}
                                variant="ghost"
                                size="icon"
                                className="w-10 h-10 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                            >
                                <FiChevronDown className="w-7 h-7" />
                            </Button>
                        </motion.div>

                        <div className="flex flex-col items-center">
                            <span className="text-xs text-white/60 uppercase tracking-widest font-medium">
                                Now Playing
                            </span>
                            <span className="text-sm text-white/80 font-medium mt-0.5">
                                {currentTrack.album || 'Unknown Album'}
                            </span>
                        </div>

                        <motion.div whileTap={{ scale: 0.9 }}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-10 h-10 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                            >
                                <FiMoreHorizontal className="w-6 h-6" />
                            </Button>
                        </motion.div>
                    </div>

                    {/* Album Art */}
                    <div className="flex-1 flex items-center justify-center px-8 py-4 relative z-10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, type: 'spring', damping: 20 }}
                            className="relative w-full max-w-[320px] aspect-square"
                        >
                            <motion.img
                                src={getImageUrl(currentTrack.poster_path)}
                                alt={currentTrack.title || currentTrack.name}
                                className={cn(
                                    'w-full h-full object-cover rounded-full shadow-2xl',
                                    isPlaying && 'animate-pulse-slow'
                                )}
                                style={{
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                }}
                                animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                                transition={isPlaying ? {
                                    repeat: Infinity,
                                    duration: 20,
                                    ease: 'linear'
                                } : { duration: 0.5 }}
                            />

                            {/* Playing indicator overlay */}
                            {isPlaying && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute bottom-4 right-4 flex items-center gap-1 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full"
                                >
                                    {[0, 1, 2, 3].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-1 bg-brand rounded-full"
                                            animate={{ height: ['8px', '20px', '8px'] }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 0.8,
                                                delay: i * 0.1,
                                                ease: 'easeInOut'
                                            }}
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </motion.div>
                    </div>

                    {/* Track Info & Controls */}
                    <div className="px-6 pb-8 relative z-10 space-y-6">
                        {/* Track Info */}
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-2xl font-bold text-white truncate"
                                >
                                    {currentTrack.title || currentTrack.name || 'Unknown Track'}
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                    className="text-base text-white/60 truncate mt-1"
                                >
                                    {currentTrack.artist || 'Unknown Artist'}
                                </motion.p>
                            </div>

                            <motion.div whileTap={{ scale: 0.9 }}>
                                <Button
                                    onClick={onToggleFavorite}
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        'w-12 h-12 rounded-full',
                                        isFavorite
                                            ? 'text-brand bg-brand/20'
                                            : 'text-white/60 hover:text-white hover:bg-white/10'
                                    )}
                                >
                                    <motion.div
                                        animate={isFavorite ? { scale: [1, 1.3, 1] } : {}}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <FiHeart className={cn('w-6 h-6', isFavorite && 'fill-current')} />
                                    </motion.div>
                                </Button>
                            </motion.div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div
                                ref={progressRef}
                                className="w-full h-2 bg-white/20 rounded-full cursor-pointer group relative"
                                onClick={handleProgressClick}
                                onMouseDown={handleProgressMouseDown}
                                onTouchStart={handleProgressMouseDown}
                            >
                                <motion.div
                                    className="h-full bg-white rounded-full relative"
                                    style={{ width: `${localProgress}%` }}
                                    transition={{ duration: 0.1 }}
                                >
                                    {/* Glowing effect */}
                                    <div className="absolute inset-0 bg-white rounded-full blur-sm opacity-50" />
                                </motion.div>

                                {/* Thumb */}
                                <motion.div
                                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"
                                    style={{ left: `calc(${localProgress}% - 8px)` }}
                                    whileTap={{ scale: 1.2 }}
                                />
                            </div>

                            <div className="flex items-center justify-between text-xs text-white/60 font-mono">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(totalTime)}</span>
                            </div>
                        </div>

                        {/* Main Controls */}
                        <div className="flex items-center justify-between px-4">
                            {/* Shuffle */}
                            <motion.div whileTap={{ scale: 0.9 }}>
                                <Button
                                    onClick={onToggleShuffle}
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        'w-12 h-12 rounded-full',
                                        isShuffled
                                            ? 'text-brand'
                                            : 'text-white/60 hover:text-white'
                                    )}
                                >
                                    <FiShuffle className="w-5 h-5" />
                                </Button>
                            </motion.div>

                            {/* Previous */}
                            <motion.div whileTap={{ scale: 0.9 }}>
                                <Button
                                    onClick={onSkipPrevious}
                                    variant="ghost"
                                    size="icon"
                                    className="w-14 h-14 text-white hover:text-white hover:bg-white/10 rounded-full"
                                >
                                    <FiSkipBack className="w-8 h-8" />
                                </Button>
                            </motion.div>

                            {/* Play/Pause */}
                            <motion.div
                                whileTap={{ scale: 0.95 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <Button
                                    onClick={onTogglePlay}
                                    variant="ghost"
                                    size="icon"
                                    className="w-18 h-18 bg-white hover:bg-white/90 text-black rounded-full shadow-2xl"
                                    style={{ width: '72px', height: '72px' }}
                                >
                                    {isPlaying ? (
                                        <FiPause className="w-8 h-8" />
                                    ) : (
                                        <FiPlay className="w-8 h-8 ml-1" />
                                    )}
                                </Button>
                            </motion.div>

                            {/* Next */}
                            <motion.div whileTap={{ scale: 0.9 }}>
                                <Button
                                    onClick={onSkipNext}
                                    variant="ghost"
                                    size="icon"
                                    className="w-14 h-14 text-white hover:text-white hover:bg-white/10 rounded-full"
                                >
                                    <FiSkipForward className="w-8 h-8" />
                                </Button>
                            </motion.div>

                            {/* Repeat */}
                            <motion.div whileTap={{ scale: 0.9 }}>
                                <Button
                                    onClick={onToggleRepeat}
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        'w-12 h-12 rounded-full relative',
                                        repeatMode !== 'off'
                                            ? 'text-brand'
                                            : 'text-white/60 hover:text-white'
                                    )}
                                >
                                    <FiRepeat className="w-5 h-5" />
                                    {repeatMode === 'one' && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand text-white text-[10px] rounded-full flex items-center justify-center font-bold"
                                        >
                                            1
                                        </motion.span>
                                    )}
                                </Button>
                            </motion.div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex items-center justify-between pt-2">
                            {/* Volume */}
                            <div className="relative">
                                <motion.div whileTap={{ scale: 0.9 }}>
                                    <Button
                                        onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                                        variant="ghost"
                                        size="icon"
                                        className="w-10 h-10 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
                                    >
                                        {isMuted || volume === 0 ? (
                                            <FiVolumeX className="w-5 h-5" />
                                        ) : (
                                            <FiVolume2 className="w-5 h-5" />
                                        )}
                                    </Button>
                                </motion.div>

                                {/* Volume Slider Popup */}
                                <AnimatePresence>
                                    {showVolumeSlider && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                            className="absolute bottom-full left-0 mb-2 bg-gray-900/95 backdrop-blur-xl rounded-xl p-3 shadow-2xl border border-white/10"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    onClick={handleVolumeClick}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-8 h-8 text-white/60 hover:text-white"
                                                >
                                                    {isMuted || volume === 0 ? (
                                                        <FiVolumeX className="w-4 h-4" />
                                                    ) : (
                                                        <FiVolume2 className="w-4 h-4" />
                                                    )}
                                                </Button>
                                                <div
                                                    className="w-32 h-1.5 bg-white/20 rounded-full cursor-pointer"
                                                    onClick={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        const x = e.clientX - rect.left;
                                                        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                                                        onVolumeChange?.(Math.round(percentage));
                                                        if (percentage > 0) setIsMuted(false);
                                                    }}
                                                >
                                                    <div
                                                        className="h-full bg-white rounded-full"
                                                        style={{ width: `${volume}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-white/60 font-mono w-8">
                                                    {Math.round(volume)}
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Share */}
                            <motion.div whileTap={{ scale: 0.9 }}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-10 h-10 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
                                    onClick={() => {
                                        if (navigator.share && currentTrack.external_urls?.spotify) {
                                            navigator.share({
                                                title: currentTrack.title || currentTrack.name,
                                                text: `Check out ${currentTrack.title || currentTrack.name} by ${currentTrack.artist}`,
                                                url: currentTrack.external_urls.spotify,
                                            });
                                        }
                                    }}
                                >
                                    <FiShare2 className="w-5 h-5" />
                                </Button>
                            </motion.div>

                            {/* Queue */}
                            <motion.div whileTap={{ scale: 0.9 }}>
                                <Button
                                    onClick={() => {
                                        onToggleQueue?.();
                                        onClose();
                                    }}
                                    variant="ghost"
                                    size="icon"
                                    className="w-10 h-10 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
                                >
                                    <FiList className="w-5 h-5" />
                                </Button>
                            </motion.div>
                        </div>
                    </div>

                    {/* Safe Area Bottom Padding */}
                    <div className="h-6" />
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default FullScreenPlayer;
