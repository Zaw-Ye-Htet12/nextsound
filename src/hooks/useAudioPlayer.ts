import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { ITrack } from '@/types';
import { mcpAudioService, PreviewTrack as _PreviewTrack } from '@/services/MCPAudioService';
import { favoritesService } from '@/services/favoritesService';
import { supabase } from '@/services/supabase';

interface AudioPlayerState {
  currentTrack: ITrack | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  isShuffled: boolean;
  repeatMode: 'off' | 'one' | 'all';
  isMinimized: boolean;
  queue: ITrack[];
  isQueueOpen: boolean;
  favorites: ITrack[];
  favoritesLoading: boolean;
}

export const useAudioPlayer = () => {
  const [state, setState] = useState<AudioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    volume: 80,
    isShuffled: false,
    repeatMode: 'off',
    isMinimized: false,
    queue: [],
    isQueueOpen: false,
    favorites: [],
    favoritesLoading: true,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const simulationInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();

    const audio = audioRef.current;

    const handleEnded = () => {
      // Auto-play next track from queue if available
      setState(prev => {
        if (prev.repeatMode === 'one' && prev.currentTrack) {
          // If repeat one, just replay the current track
          audioRef.current?.play().catch(console.error);
          return { ...prev, isPlaying: true, progress: 0 };
        }

        if (prev.queue.length > 0) {
          let nextTrack;
          let newQueue;

          if (prev.isShuffled) {
            // Shuffle mode: pick a random track from the queue
            const randomIndex = Math.floor(Math.random() * prev.queue.length);
            nextTrack = prev.queue[randomIndex];
            newQueue = prev.queue.filter((_, index) => index !== randomIndex);
          } else {
            // Normal mode: pick the first track
            nextTrack = prev.queue[0];
            newQueue = prev.queue.slice(1);
          }

          return {
            ...prev,
            currentTrack: nextTrack,
            queue: newQueue,
            isPlaying: true,
            progress: 0
          };
        }

        // No queue, just stop
        return { ...prev, isPlaying: false, progress: 0 };
      });
    };

    const handleLoadStart = () => {
      console.log('Audio loading started');
    };

    const handleCanPlay = () => {
      console.log('Audio can start playing');
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setState(prev => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
    };
  }, []);

  // Load favorites from database on mount
  useEffect(() => {
    const loadFavorites = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({ ...prev, favoritesLoading: false }));
        return;
      }

      try {
        // Try to migrate localStorage data first
        const migrated = await favoritesService.migrateLocalStorageFavorites();
        if (migrated > 0) {
          toast.success(`Migrated ${migrated} favorite${migrated > 1 ? 's' : ''} to your account`);
        }

        // Load favorites from database
        const favorites = await favoritesService.getFavorites();
        setState(prev => ({ ...prev, favorites, favoritesLoading: false }));
      } catch (error) {
        console.error('Failed to load favorites:', error);
        toast.error('Failed to load your favorites');
        setState(prev => ({ ...prev, favoritesLoading: false }));
      }
    };

    loadFavorites();
  }, []);

  // Update progress
  useEffect(() => {
    if (state.isPlaying && audioRef.current) {
      progressInterval.current = setInterval(() => {
        const audio = audioRef.current;
        if (audio && audio.duration) {
          const currentProgress = (audio.currentTime / audio.duration) * 100;
          setState(prev => ({ ...prev, progress: currentProgress }));
        }
      }, 250); // Optimized for smoother UI - 4 updates per second
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      // Also clear simulation interval when not playing
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
        simulationInterval.current = null;
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
    };
  }, [state.isPlaying]);

  // Handle track changes and audio loading
  const lastTrackIdRef = useRef<string | null>(null);

  useEffect(() => {
    const loadAndPlay = async () => {
      const track = state.currentTrack;
      if (!track) return;

      // If it's the same track we're already playing/loaded, don't reload unless force
      // But we need to handle "Play" from paused state? No, that's handled by isPlaying effect
      // This effect is specifically for NEW tracks or Enhancing tracks
      if (lastTrackIdRef.current === track.id && track.preview_url) {
        return;
      }

      console.log('🎧 Loading track:', track.title || track.name);
      lastTrackIdRef.current = track.id;

      // Clear simulation interval
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
        simulationInterval.current = null;
      }

      let trackToPlay = track;

      // Enhance if needed
      if (!track.preview_url) {
        console.log('🔄 MCP: Enhancing track with preview URL...', track.name);
        try {
          const enhancedTrack = await mcpAudioService.enhanceTrackWithPreview(track);
          console.log('🎯 MCP: Enhancement result:', {
            trackName: enhancedTrack.name,
            hasPreviewUrl: !!enhancedTrack.preview_url
          });

          // Update state with enhanced track - this might re-trigger effect but 
          // 'lastTrackIdRef.current === track.id' check combined with '&& track.preview_url' 
          // logic above needs to be careful.
          // Actually, if we update state, the 'track' object changes, but 'id' is same.
          // So we update state, the effect runs again. 
          // 'track.id' is same. 'track.preview_url' is now present.
          // So we need to ensure we don't return early if we just enhanced it.
          // Let's rely on the fact that we WANT to proceed if we have a url.

          trackToPlay = enhancedTrack;
          setState(prev => ({ ...prev, currentTrack: enhancedTrack }));
        } catch (error) {
          console.error('Failed to enhance track:', error);
          startSimulation();
          return;
        }
      }

      // Play logic
      if (audioRef.current && trackToPlay.preview_url) {
        try {
          audioRef.current.src = trackToPlay.preview_url;
          audioRef.current.volume = state.volume / 100;
          await audioRef.current.play();
          // Ensure state is playing (might have been set to true by caller, but ensure here)
          // setState(prev => ({ ...prev, isPlaying: true })); 
          // We don't want to force set Playing if user paused? 
          // Usually a track change implies play.
        } catch (error) {
          console.error('Playback failed:', error);
          startSimulation();
        }
      } else {
        startSimulation();
      }
    };

    loadAndPlay();

    function startSimulation() {
      // Clear existing first
      if (simulationInterval.current) clearInterval(simulationInterval.current);

      console.log('⚠️ Using simulation for:', state.currentTrack?.name);
      let simulatedProgress = 0;
      simulationInterval.current = setInterval(() => {
        simulatedProgress += 1;
        setState(prev => ({ ...prev, progress: simulatedProgress }));
        if (simulatedProgress >= 100) {
          if (simulationInterval.current) {
            clearInterval(simulationInterval.current);
            simulationInterval.current = null;
          }
          setState(prev => ({ ...prev, isPlaying: false, progress: 0 }));
        }
      }, 250);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentTrack]); // Only run when track object changes

  const playTrack = useCallback(async (track: ITrack) => {
    // If same track, toggle
    if (state.currentTrack?.id === track.id) {
      setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
      return;
    }

    // New track - just update state, effect handles loading
    setState(prev => ({
      ...prev,
      currentTrack: track,
      isPlaying: true,
      progress: 0,
    }));
  }, [state.currentTrack]);

  // Effect to handle Play/Pause toggle on EXISTING track
  useEffect(() => {
    if (!audioRef.current) return;

    if (state.isPlaying) {
      if (audioRef.current.src) {
        // Real Audio
        if (audioRef.current.paused) {
          audioRef.current.play().catch(console.error);
        }
      } else {
        // Simulation: If no audio source, resume simulation if not already running
        if (!simulationInterval.current && state.currentTrack) {
          console.log('▶️ Resuming simulation playback');
          let simulatedProgress = state.progress;

          // Clear any existing just in case
          if (simulationInterval.current) clearInterval(simulationInterval.current);

          simulationInterval.current = setInterval(() => {
            simulatedProgress += 1;
            setState(prev => ({ ...prev, progress: simulatedProgress }));

            if (simulatedProgress >= 100) {
              if (simulationInterval.current) {
                clearInterval(simulationInterval.current);
                simulationInterval.current = null;
              }
              setState(prev => ({ ...prev, isPlaying: false, progress: 0 }));
            }
          }, 250);
        }
      }
    } else {
      // Pause
      if (audioRef.current) audioRef.current.pause();
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
        simulationInterval.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isPlaying, state.currentTrack?.preview_url]); // Re-run if source availability changes

  const togglePlay = useCallback(() => {
    if (!state.currentTrack) return;
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [state.currentTrack]);

  const skipNext = useCallback(() => {
    setState(prev => {
      if (prev.queue.length > 0) {
        let nextTrack;
        let newQueue;

        if (prev.isShuffled) {
          const randomIndex = Math.floor(Math.random() * prev.queue.length);
          nextTrack = prev.queue[randomIndex];
          newQueue = prev.queue.filter((_, index) => index !== randomIndex);
        } else {
          nextTrack = prev.queue[0];
          newQueue = prev.queue.slice(1);
        }

        return {
          ...prev,
          currentTrack: nextTrack,
          queue: newQueue,
          isPlaying: true,
          progress: 0
        };
      }
      return prev;
    });
  }, []);

  const skipPrevious = useCallback(() => {
    console.log('Skip previous - not implemented yet');
    // TODO: Implement previous track logic
  }, []);

  const seek = useCallback((position: number) => {
    setState(prev => ({ ...prev, progress: position }));

    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (position / 100) * audioRef.current.duration;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState(prev => ({ ...prev, volume }));

    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    setState(prev => ({ ...prev, isShuffled: !prev.isShuffled }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setState(prev => {
      const modes: Array<'off' | 'one' | 'all'> = ['off', 'one', 'all'];
      const currentIndex = modes.indexOf(prev.repeatMode);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      return { ...prev, repeatMode: nextMode };
    });
  }, []);

  const toggleFavorite = useCallback(async (track: ITrack) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }

    const isFavorite = state.favorites.some(t => t.id === track.id);

    try {
      if (isFavorite) {
        await favoritesService.removeFavorite(track.id);
        setState(prev => ({
          ...prev,
          favorites: prev.favorites.filter(t => t.id !== track.id)
        }));
        toast.info(`Removed "${track.title || track.name}" from library`);
      } else {
        await favoritesService.addFavorite(track);
        setState(prev => ({
          ...prev,
          favorites: [...prev.favorites, track]
        }));
        toast.success(`Added "${track.title || track.name}" to library`);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update favorites');
    }
  }, [state.favorites]);

  const toggleMinimize = useCallback(() => {
    setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  }, []);

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    setState({
      currentTrack: null,
      isPlaying: false,
      progress: 0,
      volume: 80,
      isShuffled: false,
      repeatMode: 'off',
      isMinimized: false,
      queue: [],
      isQueueOpen: false,
      favorites: state.favorites,
      favoritesLoading: state.favoritesLoading,
    });
  }, [state.favorites, state.favoritesLoading]);

  const addToQueue = useCallback((track: ITrack) => {
    setState(prev => {
      // Check if track is already in queue
      const isDuplicate = prev.queue.some(t => t.id === track.id);
      if (isDuplicate) {
        toast.warning(`"${track.title || track.name}" is already in the queue`);
        console.log('Track already in queue:', track.title || track.name);
        return prev;
      }

      toast.success(`Added "${track.title || track.name}" to queue`);
      return {
        ...prev,
        queue: [...prev.queue, track],
      };
    });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      queue: prev.queue.filter((_, i) => i !== index)
    }));
  }, []);

  const reorderQueue = useCallback((newQueue: ITrack[]) => {
    setState(prev => ({ ...prev, queue: newQueue }));
  }, []);

  const toggleQueue = useCallback(() => {
    setState(prev => ({ ...prev, isQueueOpen: !prev.isQueueOpen }));
  }, []);

  const playAllTracks = useCallback((tracks: ITrack[]) => {
    if (tracks.length === 0) return;

    // First track plays immediately, rest go to queue
    const [firstTrack, ...restTracks] = tracks;

    setState(prev => ({
      ...prev,
      currentTrack: firstTrack,
      isPlaying: true,
      progress: 0,
      queue: restTracks,
    }));

    toast.success(`Playing ${tracks.length} track${tracks.length > 1 ? 's' : ''}`);
  }, []);

  return {
    // State
    currentTrack: state.currentTrack,
    isPlaying: state.isPlaying,
    progress: state.progress,
    volume: state.volume,
    isShuffled: state.isShuffled,
    repeatMode: state.repeatMode,
    isMinimized: state.isMinimized,

    // Actions
    playTrack,
    togglePlay,
    skipNext,
    skipPrevious,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    toggleFavorite,
    toggleMinimize,
    closePlayer,
    queue: state.queue,
    isQueueOpen: state.isQueueOpen,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    toggleQueue,
    playAllTracks,
    favorites: state.favorites,
    favoritesLoading: state.favoritesLoading,
  };
};