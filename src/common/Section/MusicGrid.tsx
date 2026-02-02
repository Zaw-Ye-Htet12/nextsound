import { FC, useState } from "react";
import { TrackCard } from "@/components/ui/TrackCard";
import { AlbumCard } from "@/components/ui/AlbumCard";
import { ITrack } from "@/types";
import { useAudioPlayerContext } from "@/context/audioPlayerContext";

interface MusicGridProps {
  tracks: ITrack[];
  category: string;
  initialDisplayCount?: number;
  loadMoreCount?: number;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMoreContent?: boolean;
  onAlbumClick?: (album: ITrack) => void; // New prop for album navigation
}

const MusicGrid: FC<MusicGridProps> = ({
  tracks,
  category,
  initialDisplayCount = 18, // Show 3 rows initially (6 columns * 3 rows)
  loadMoreCount = 18, // Load 3 more rows each time
  onLoadMore,
  isLoadingMore = false,
  hasMoreContent = false,
  onAlbumClick
}) => {
  const [visibleCount, setVisibleCount] = useState(initialDisplayCount);

  const { playTrack, currentTrack, isPlaying, addToQueue } = useAudioPlayerContext(); // Access player context

  // Removed dummy handlePlay

  const handleLoadMoreClick = () => {
    if (tracks.length > visibleCount) {
      // Show more of existing tracks first
      setVisibleCount(prev => Math.min(prev + loadMoreCount, tracks.length));
    } else if (onLoadMore && hasMoreContent) {
      // Load new tracks from API
      onLoadMore();
      setVisibleCount(prev => prev + loadMoreCount);
    }
  };

  const displayedTracks = tracks.slice(0, visibleCount);
  const showLoadMoreButton =
    (tracks.length > visibleCount) || // More existing tracks to show
    (hasMoreContent && !isLoadingMore); // Or more content available from API

  return (
    <div className="w-full">
      {/* Grid container */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
        {displayedTracks.map((track) => (
          <div key={track.id} className="flex flex-col">
            {category === 'album' ? (
              <AlbumCard
                album={track as any} // Cast because ITrack matches IAlbum shape mostly
                variant="detailed"
                onPlay={() => onAlbumClick?.(track)} // Redirect on Play for now, or use onAlbumClick for navigation
              // Note: AlbumCard handles queueing internally via overlay buttons
              // onAlbumClick handles navigation to album page
              // We override the card's native play button to navigate for now (or play album context?)
              // Usually play on card means PLAY. But navigation via title/click.
              // For now, let's make the card click navigate to album.
              />
            ) : (
              <TrackCard
                track={track}
                category={category}
                isPlaying={currentTrack?.id === track.id && isPlaying}
                onPlay={playTrack}
                onAddToQueue={addToQueue}
                variant="detailed"
                onClick={category === 'album' && onAlbumClick ? onAlbumClick : undefined}
              />
            )}
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {showLoadMoreButton && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMoreClick}
            disabled={isLoadingMore}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            {isLoadingMore ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </div>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}

      {/* Loading indicator when fetching more content */}
      {isLoadingMore && !showLoadMoreButton && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            Loading more tracks...
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicGrid;