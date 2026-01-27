
import { useParams, useNavigate } from 'react-router-dom';
import { useSearchMusicQuery } from '@/services/ItunesAPI';
import { Loader, Error } from '@/common';
import { FiChevronLeft, FiPlay } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/utils';
import { useAudioPlayerContext } from '@/context/audioPlayerContext';
import MusicGrid from '@/common/Section/MusicGrid';

const ArtistPage = () => {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();
    const { playTrack } = useAudioPlayerContext();

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
        <div className="flex flex-col w-full min-h-screen">
            {/* Hero Section */}
            <div className="relative w-full h-[50vh] min-h-[300px]">
                {/* Background Image with Blur */}
                <div className="absolute inset-0 overflow-hidden">
                    <img
                        src={getImageUrl(heroTrack.poster_path)}
                        alt={name}
                        className="w-full h-full object-cover blur-3xl opacity-50 dark:opacity-30 scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent dark:from-deep-dark dark:via-deep-dark/50 dark:to-transparent" />
                    {/* Top Gradient for Navbar Visibility */}
                    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent z-10" />
                </div>

                <div className="absolute inset-0 flex flex-col justify-end px-4 md:px-8 pb-8 z-10 max-w-7xl mx-auto w-full">
                    {/* Back Button */}
                    <div className="absolute top-20 left-4 md:left-8">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-gray-900 dark:text-white"
                        >
                            <FiChevronLeft className="w-6 h-6" />
                        </Button>
                    </div>

                    <div className="flex flex-col md:flex-row items-end md:items-end gap-6">
                        {/* Artist Image (Circle) */}
                        <div className="w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 flex-shrink-0">
                            <img
                                src={getImageUrl(heroTrack.poster_path)}
                                alt={name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex flex-col gap-2 mb-2 flex-1">
                            <span className="text-brand font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                                <span className="w-6 h-0.5 bg-brand"></span>
                                Artist
                            </span>
                            <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight">
                                {heroTrack.artist}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300 font-medium">
                                {tracks.length} Top Tracks
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 mb-4">
                            <Button
                                className="h-14 px-8 rounded-full bg-brand hover:brightness-90 text-white text-lg font-bold shadow-xl hover:scale-105 transition-transform"
                                onClick={() => playTrack(tracks[0])}
                            >
                                <FiPlay className="w-5 h-5 mr-2 fill-current" />
                                Play Top Songs
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto w-full pb-24">
                <MusicGrid
                    tracks={tracks}
                    category="artist"
                />
            </div>
        </div>
    );
};

export default ArtistPage;
