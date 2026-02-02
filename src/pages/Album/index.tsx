
import { useParams, useNavigate } from 'react-router-dom';
import { useLookupAlbumQuery } from '@/services/ItunesAPI';
import { useGetAlbumDetailsQuery } from '@/services/DeezerAPI';
import { Loader, Error, Marquee } from '@/common';
import { FiChevronLeft, FiPlay, FiClock } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/utils';
import { useAudioPlayerContext } from '@/context/audioPlayerContext';

const AlbumPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { playAllTracks } = useAudioPlayerContext();

    const isDeezerId = id && /^\d+$/.test(id);

    // iTunes Query - Remove restriction on running this query
    const { data: itunesData, isLoading: isItunesLoading, isError: isItunesError } = useLookupAlbumQuery({ id: id || '' }, { skip: !id });

    // Deezer Query - Only run if iTunes fails or if we specifically want to try (kept for backup, but priority is iTunes)
    const { data: deezerData, isLoading: isDeezerLoading, isError: isDeezerError } = useGetAlbumDetailsQuery({ id: id || '' }, { skip: !id || (!!itunesData && !isItunesError) });

    if (isItunesLoading || (isItunesError && !itunesData && isDeezerLoading)) return <Loader />;

    // Normalize data
    let album: any = null;
    let tracks: any[] = [];
    let isError = false;

    // Prioritize iTunes Data
    if (itunesData && itunesData.album && itunesData.album.id) {
        album = itunesData.album;
        tracks = itunesData.tracks;
    } else if (isDeezerId && deezerData?.album) {
        // Fallback to Deezer if ID looks like Deezer ID and we have data
        album = deezerData.album;
        tracks = deezerData.tracks;
    } else {
        isError = true;
    }

    if (isError || !album) return <Error error="Could not load album data" />;

    return (
        <div className="flex flex-col w-full min-h-screen bg-white dark:bg-black">
            {/* Header / Hero Section */}
            <div className="relative pt-100 w-full h-[55vh] md:h-[50vh] min-h-[500px]">
                {/* Background Image - Expanded for mobile immersion */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={getImageUrl(album.poster_path)}
                        alt={album.title}
                        className="w-full h-full object-cover transition-transform duration-700"
                    />
                    {/* Gradient overlays for text readability and aesthetic fade */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-white dark:to-black opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent dark:from-black dark:via-black/50 dark:to-transparent" />
                </div>

                {/* Navigation Header - Fixed/Absolute top */}
                <div className="absolute top-20 left-0 md:top-20 z-30 md:left-20 right-0 p-4 flex items-center justify-between  md:pt-6">
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
                                    src={getImageUrl(album.poster_path)}
                                    alt={album.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Text Info */}
                        <div className="flex flex-col gap-3 flex-1 items-center md:items-start mb-2 min-w-0 w-full overflow-hidden">
                            <div className="w-full max-w-full">
                                <Marquee speed={40}>
                                    <h1 className="text-4xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter drop-shadow-sm leading-tight whitespace-nowrap px-2 pb-2">
                                        {album.title}
                                    </h1>
                                </Marquee>
                            </div>
                            <div className="flex items-center gap-3 text-sm md:text-base font-medium text-gray-600 dark:text-gray-300">
                                <span className="px-3 py-1 bg-brand/10 text-brand rounded-full uppercase tracking-wider text-xs font-bold">Album</span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span>{tracks.length} Releases</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 mt-2 md:mb-2 w-full md:w-auto justify-center md:justify-start">
                            <Button
                                className="h-14 px-10 rounded-full bg-brand hover:bg-brand/90 text-white text-lg font-bold shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all w-full md:w-auto disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                                onClick={() => playAllTracks(tracks)}
                                disabled={tracks.length === 0}
                            >
                                <FiPlay className="w-6 h-6 mr-2 fill-current" />
                                Play All
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tracks List */}
            <div className="max-w-7xl mx-auto w-full px-4 py-8 pb-32">
                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-4 text-sm text-gray-500 font-medium uppercase tracking-wider">
                        <span className="w-8 text-center">#</span>
                        <span>Title</span>
                    </div>
                    <div className="pr-4">
                        <FiClock className="w-4 h-4 text-gray-500" />
                    </div>
                </div>

                <div className="flex flex-col">
                    {tracks.length > 0 ? (
                        tracks.map((track, index) => (
                            <div
                                key={track.id}
                                className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                onClick={() => playAllTracks(tracks, index)}
                            >
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <span className="w-8 text-center text-gray-500 font-medium group-hover:hidden">{index + 1}</span>
                                    <span className="w-8 justify-center hidden group-hover:flex text-brand">
                                        <FiPlay className="w-4 h-4 fill-current" />
                                    </span>

                                    <div className="flex flex-col min-w-0">
                                        <span className="font-medium text-gray-900 dark:text-white truncate">{track.title}</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{track.artist}</span>
                                    </div>
                                </div>

                                <div className="text-sm text-gray-500 dark:text-gray-400 font-tabular-nums">
                                    {formatDuration(track.duration || 0)}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-gray-400">
                            <FiClock className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-lg font-medium">No tracks found for this album</p>
                            <p className="text-sm opacity-60">This album might not have any tracks listed yet.</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-xs text-gray-500 dark:text-gray-500 pl-4">
                    <p>© {album.year} {album.artist}</p>
                </div>
            </div>
        </div>
    );
};

const formatDuration = (ms: number) => {
    if (!ms) return '-:--';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default AlbumPage;
