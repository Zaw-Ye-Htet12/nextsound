
import { useParams, useNavigate } from 'react-router-dom';
import { useSearchMusicQuery } from '@/services/ItunesAPI';
import { Loader, Error, Marquee } from '@/common';
import { FiChevronLeft, FiPlay } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/utils';
import { useAudioPlayerContext } from '@/context/audioPlayerContext';
import MusicGrid from '@/common/Section/MusicGrid';

const ArtistPage = () => {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();
    const { playAllTracks } = useAudioPlayerContext();

    // Search for tracks by this artist to populate the page
    // We add "artist" to query to be more specific? Or just name.
    const { data, isLoading, isError } = useSearchMusicQuery({
        query: name || '',
        limit: 50
    });

    if (isLoading) return <Loader />;
    if (isError || !data?.results) return <Error error="Could not load artist data" />;

    const tracks = data.results;

    // Filter to ensure we mostly get tracks actually by this artist (fuzzy match)
    // iTunes search is a bit broad.
    // However, for now, let's trust the search or do a soft filter?
    // Let's just show what comes back, assuming user clicked a specific name.

    // Attempt to get a high-res artist image from the first track
    const heroTrack = tracks.length > 0 ? tracks[0] : null;

    if (!heroTrack) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] pt-20">
                <h2 className="text-2xl font-bold dark:text-white mb-4">Artist not found</h2>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full min-h-screen bg-white dark:bg-black">
            {/* Hero Section */}
            <div className="relative pt-100 w-full h-[55vh] md:h-[50vh] min-h-[500px]">
                {/* Background Image - Expanded for mobile immersion */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={getImageUrl(heroTrack.poster_path)}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-700"
                    />
                    {/* Gradient overlays for text readability and aesthetic fade */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-white dark:to-black opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent dark:from-black dark:via-black/50 dark:to-transparent" />
                </div>

                {/* Navigation Header - Fixed/Absolute top */}
                <div className="absolute top-10 z-30 left-0 right-0 p-4 flex items-center justify-between  md:pt-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 shadow-sm"
                    >
                        <FiChevronLeft className="w-6 h-6" />
                    </Button>
                </div>

                {/* Artist Content - Bottom aligned */}
                <div className="absolute inset-0 flex flex-col justify-end pb-10 px-6 z-20 max-w-7xl mx-auto w-full">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 w-full text-center md:text-left">
                        {/* Artist Avatar - Mobile: Centered & Large, Desktop: Left */}
                        <div className="relative group shrink-0">
                            <div className="w-40 h-40 md:w-64 md:h-64 rounded-full overflow-hidden shadow-2xl ring-4 ring-white dark:ring-gray-800 mx-auto transform transition-transform duration-500 hover:scale-105">
                                <img
                                    src={getImageUrl(heroTrack.poster_path)}
                                    alt={name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Text Info */}
                        <div className="flex flex-col gap-3 flex-1 items-center md:items-start mb-2 min-w-0 w-full overflow-hidden">
                            <div className="w-full max-w-full">
                                <Marquee speed={40}>
                                    <h1 className="text-4xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter drop-shadow-sm leading-tight whitespace-nowrap px-2 pb-2">
                                        {heroTrack.artist}
                                    </h1>
                                </Marquee>
                            </div>
                            <div className="flex items-center gap-3 text-sm md:text-base font-medium text-gray-600 dark:text-gray-300">
                                <span className="px-3 py-1 bg-brand/10 text-brand rounded-full uppercase tracking-wider text-xs font-bold">Artist</span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span>{tracks.length} Releases</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 mt-2 md:mb-2 w-full md:w-auto justify-center md:justify-start">
                            <Button
                                className="h-14 px-10 rounded-full bg-brand hover:bg-brand/90 text-white text-lg font-bold shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
                                onClick={() => playAllTracks(tracks)}
                            >
                                <FiPlay className="w-6 h-6 mr-2 fill-current" />
                                Play All
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="relative z-20 px-4 md:px-8 py-6 max-w-7xl mx-auto w-full pb-32">
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-white/95 dark:bg-black/95 backdrop-blur-sm py-4 z-40">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Top Tracks</h2>
                </div>
                <MusicGrid
                    tracks={tracks}
                    category="artist"
                />
            </div>
        </div>
    );
};

export default ArtistPage;
