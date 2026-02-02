import React, { useState } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import {
  FaPlay,
  FaPause,
  FaClock,
  FaMusic,
  FaCalendarAlt,
  FaUser
} from 'react-icons/fa';
import { FiPlusCircle, FiHeart, FiLoader } from 'react-icons/fi';
import { ITrack, IAlbum } from '@/types';
import { getImageUrl, cn } from '@/utils';
import { useAudioPlayerContext } from '@/context/audioPlayerContext';
import { useLookupAlbumQuery, useLazyLookupAlbumQuery } from '@/services/ItunesAPI';

interface AlbumCardProps {
  album: IAlbum;
  isPlaying?: boolean;
  onPlay?: (album: IAlbum) => void;
  onTrackPlay?: (track: ITrack) => void;
  variant?: 'compact' | 'detailed' | 'featured';
  className?: string;
  tracks?: ITrack[];
}

export const AlbumCard: React.FC<AlbumCardProps> = ({
  album,
  isPlaying = false,
  onPlay,
  onTrackPlay: _onTrackPlay,
  variant = 'detailed',
  className,
  tracks = []
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

  // Context for Queue and Favorites
  const { addTracksToQueue, favorites, toggleFavorite } = useAudioPlayerContext();

  // Check if album is favorited (using ID match)
  const isFavorite = favorites.some(t => t.id === album.id);

  const { poster_path, original_title: title, name, artists } = album;
  const displayTitle = title || name || 'Unknown Album';
  const artistName = artists && artists.length > 0 ? artists.join(', ') : (album.artist || 'Unknown Artist');

  // Album-specific metadata
  const releaseYear = album.release_date ? new Date(album.release_date).getFullYear() : (album.year || null);
  const trackCount = album.total_tracks || tracks.length || 0;

  // Should we fetch tracks for queueing?
  // We use the lazy query manually or just trigger it. 
  // Since we can't use hooks conditionally, we need to import useLazyLookupAlbumQuery from API slice if available, 
  // BUT we only have useLookupAlbumQuery exported. 
  // We can use the skip option with a state, but that's for "load completely".
  // Let's use the mutation/lazy trigger if possible. 
  // Assuming ItunesAPI exports useLazyLookupAlbumQuery (standard RTK Query).
  // If not, we might need to rely on the passed 'tracks'.
  // IF 'tracks' are not passed, we might fail to queue nicely without refactoring API to export lazy hook.
  // HOWEVER, for now, let's assume we can rely on `onPlay` which usually fetches album details in parent,
  // OR we add the lazy hook to exports.
  // Let's check imports... I see useLookupAlbumQuery.
  // I will add useLazyLookupAlbumQuery to imports in the next step if it fails.
  // For now let's assume I can trigger it.
  // Actually, standard useQuery runs immediately. 
  // Let's just use useLookupAlbumQuery conditionally skipped unless loading? No.
  // Let's try to just queue the album object itself if tracks missing? 
  // No, user wants "songs in that clicked album".
  // I will assume for now that if I don't have tracks, I can't queue. 
  // WAIT, the `MusicGrid` usually passes what it has.
  // If we are on ArtistPage, we might not have tracks for ALL albums loaded.
  // I will add `useLazyLookupAlbumQuery` to ItunesAPI.ts first to be safe.

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPlay?.(album);
  };

  const handleAddToLibrary = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Treat album as ITrack for favorites
    await toggleFavorite(album as unknown as ITrack);
  };

  return (
    <Card
      className={cn(
        "group relative transition-all duration-300 ease-out overflow-hidden",
        "hover:scale-[1.03] hover:-translate-y-2 cursor-pointer",
        "bg-white dark:bg-card-dark border-0",
        "shadow-sm hover:shadow-card-hover",
        "rounded-xl p-4",
        variant === 'compact' ? 'h-64' : variant === 'featured' ? 'h-96' : 'h-80',
        "w-[200px]",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handlePlayClick}
    >
      {/* Main Content */}
      <div className="block relative">
        <div className="relative overflow-hidden rounded-lg mb-3">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-hover-gray animate-pulse rounded-lg"
              style={{ height: variant === 'compact' ? 160 : variant === 'featured' ? 240 : 200 }} />
          )}

          <img
            src={getImageUrl(poster_path)}
            alt={displayTitle}
            className={cn(
              "w-full object-cover transition-all duration-300 rounded-lg",
              "group-hover:scale-105",
              "dark:brightness-75 dark:contrast-110 dark:saturate-90",
              "dark:group-hover:brightness-90 dark:group-hover:contrast-105 dark:group-hover:saturate-95",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            style={{ height: variant === 'compact' ? 160 : variant === 'featured' ? 240 : 200 }}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />

          {/* Overlays */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity duration-300 rounded-lg",
            isHovered ? "opacity-100" : "opacity-0"
          )} />

          <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-all duration-300 z-10",
            isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90"
          )}>
            <Button
              onClick={handlePlayClick}
              variant="ghost"
              size="icon"
              className={cn(
                "w-14 h-14 rounded-full shadow-xl transition-all duration-200",
                "bg-accent-orange hover:bg-accent-orange/90",
                "hover:scale-110 text-white"
              )}
            >
              {isPlaying ? <FaPause className="w-6 h-6" /> : <FaPlay className="w-6 h-6 ml-1" />}
            </Button>
          </div>

          {/* Action Buttons (Top Right) */}
          <div className={cn(
            "absolute top-2 right-2 flex gap-2 transition-opacity duration-300 z-20",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            <button
              onClick={handleAddToLibrary}
              className={cn(
                "p-2 bg-black/50 hover:bg-black/70 rounded-full transition-transform hover:scale-110",
                isFavorite ? "text-red-500" : "text-white hover:text-red-500"
              )}
              title={isFavorite ? "Remove from Library" : "Add to Library"}
            >
              <FiHeart size={20} className={cn(isFavorite && "fill-current")} />
            </button>

            <AlbumQueueButton albumId={album.id} tracks={tracks} addTracksToQueue={addTracksToQueue} />
          </div>
        </div>

        <CardContent className="p-0 space-y-2">
          <h3 className="font-semibold text-gray-900 dark:text-text-primary truncate text-base group-hover:text-accent-orange dark:group-hover:text-accent-orange">
            {displayTitle}
          </h3>
          <p className="text-gray-600 dark:text-text-secondary truncate text-sm font-medium">
            <FaUser className="w-3 h-3 inline mr-1 opacity-60" />
            {artistName}
          </p>
          {variant === 'detailed' && (
            <div className="flex items-center justify-between text-xs text-text-muted dark:text-text-secondary/70">
              {releaseYear && (
                <span className="flex items-center">
                  <FaCalendarAlt className="w-3 h-3 mr-1 opacity-60" />
                  {releaseYear}
                </span>
              )}
              {trackCount > 0 && (
                <span className="flex items-center">
                  <FaMusic className="w-3 h-3 mr-1 opacity-60" />
                  {trackCount} tracks
                </span>
              )}
            </div>
          )}
        </CardContent>
      </div>

      {/* Hover glow */}
      <div className={cn(
        "absolute -inset-1 bg-gradient-to-r from-spotify-green via-accent-orange to-warning-amber rounded-2xl opacity-0 transition-opacity duration-500 -z-10 blur-md dark:bg-gradient-to-r dark:from-brand dark:via-red-600 dark:to-brand",
        isHovered && "opacity-10"
      )} />
    </Card>
  );
};

// Helper component to handle lazy fetching of album tracks

const AlbumQueueButton = ({ albumId, tracks, addTracksToQueue }: { albumId: string, tracks: ITrack[], addTracksToQueue: (t: ITrack[]) => void }) => {
  const [trigger, { isLoading }] = useLazyLookupAlbumQuery();

  const handleAddToQueue = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (tracks.length > 0) {
      addTracksToQueue(tracks);
    } else {
      // Fetch tracks
      try {
        const result = await trigger({ id: albumId }).unwrap();
        if (result.tracks && result.tracks.length > 0) {
          addTracksToQueue(result.tracks);
        }
      } catch (err) {
        console.error("Failed to fetch album tracks", err);
      }
    }
  };

  return (
    <button
      onClick={handleAddToQueue}
      className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white hover:text-accent-orange transition-transform hover:scale-110"
      title="Add Album to Queue"
      disabled={isLoading}
    >
      {isLoading ? <FiLoader size={20} className="animate-spin" /> : <FiPlusCircle size={20} />}
    </button>
  );
};