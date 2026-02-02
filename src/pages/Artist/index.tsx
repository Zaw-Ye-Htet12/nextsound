
import { useParams, useNavigate } from 'react-router-dom';
import { useSearchMusicQuery } from '@/services/ItunesAPI';
import { useGetArtistDetailsQuery, useSearchArtistsQuery } from '@/services/DeezerAPI';
import { Loader, Error, Marquee } from '@/common';
import { FiChevronLeft, FiPlay } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/utils';
import { useAudioPlayerContext } from '@/context/audioPlayerContext';
import MusicGrid from '@/common/Section/MusicGrid';
import { ITrack } from '@/types';

const ArtistPage = () => {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();
    const { playAllTracks } = useAudioPlayerContext();

    // Determine if we are using Deezer ID (numeric) or iTunes Name (string)
    const isDeezerId = name && /^\d+$/.test(name);

    // ===================================
    // 1. RESOLVE ARTIST IDENTITY (Name & Image)
    // ===================================

    // If ID: Fetch Deezer Details to get Name + Image
    const {
        data: deezerArtist,
        isLoading: isDeezerLoading,
        isError: isDeezerArtistError
    } = useGetArtistDetailsQuery(name || '', { skip: !isDeezerId || !name });

    // If Name: Search Deezer to find Image
    const {
        data: deezerSearchResults,
        isLoading: isDeezerSearchLoading
    } = useSearchArtistsQuery({ query: name || '' }, { skip: !!isDeezerId || !name });

    // Determine the effective Name and Image
    const resolvedArtistName = isDeezerId ? deezerArtist?.name : name;

    // Get the best available image from either the direct detail fetch or the search result
    const deezerImage = isDeezerId
        ? (deezerArtist?.artist_image || deezerArtist?.poster_path)
        : (deezerSearchResults?.results?.[0]?.artist_image || deezerSearchResults?.results?.[0]?.poster_path);

    // ===================================
    // 2. FETCH CONTENT FROM ITUNES
    // ===================================
    const {
        data: itunesData,
        isLoading: isItunesLoading,
        isError: isItunesError
    } = useSearchMusicQuery({
        query: resolvedArtistName || '',
        limit: 50,
        entity: 'song',
        attribute: 'artistTerm'
    }, { skip: !resolvedArtistName });

    const {
        data: itunesAlbumData,
        isLoading: isItunesAlbumLoading
    } = useSearchMusicQuery({
        query: resolvedArtistName || '',
        limit: 20,
        entity: 'album',
        attribute: 'artistTerm'
    }, { skip: !resolvedArtistName });


    // ===================================
    // DATA DATA PROCESSING
    // ===================================
    const normalize = (str: string) => {
        return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    };

    let heroTrack: ITrack | null = null;
    let tracks: ITrack[] = [];
    let albums: ITrack[] = [];

    // Combined Loading State
    // We are loading if:
    // 1. Determining Identity (Deezer loading)
    // 2. Fetching Content (iTunes loading) knowing we have a name
    const isLoading = isDeezerLoading || isDeezerSearchLoading || (!!resolvedArtistName && (isItunesLoading || isItunesAlbumLoading));
    const isError = isDeezerArtistError || isItunesError;

    if (itunesData?.results && resolvedArtistName) {
        const normalizedTargetName = normalize(resolvedArtistName);

        // Filter iTunes results to ensure exact artist match (iTunes search is fuzzy)
        tracks = (itunesData.results || []).filter(track => {
            if (!track.artist) return false;
            if (track.artist.toLowerCase() === resolvedArtistName.toLowerCase()) return true;
            if (normalize(track.artist) === normalizedTargetName) return true;
            return false;
        });

        albums = (itunesAlbumData?.results || []).filter(album => {
            if (!album.artist) return false;
            if (album.artist.toLowerCase() === resolvedArtistName.toLowerCase()) return true;
            if (normalize(album.artist) === normalizedTargetName) return true;
            return false;
        });

        // Use the first track as base, but OVERRIDE the image with Deezer's high-res image
        if (tracks.length > 0) {
            heroTrack = {
                ...tracks[0], // Base info from iTunes
                poster_path: deezerImage || tracks[0].poster_path, // Prefer Deezer Image
                artist: resolvedArtistName,
                // If we started with a Deezer ID, keep it for reference, otherwise use what we have
                artist_id: isDeezerId ? name : undefined
            } as ITrack;
        } else if (deezerArtist) {
            // Fallback: If iTunes has no tracks but we have Deezer Artist info, show that atleast
            heroTrack = {
                ...deezerArtist,
                poster_path: deezerImage || '',
                artist: resolvedArtistName || ''
            };
        }
    }

    if (isLoading) return <Loader />;
    if (isError || !heroTrack) {
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
                        alt={heroTrack.artist}
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
                                    src={getImageUrl(heroTrack.poster_path)}
                                    alt={heroTrack.artist}
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
                                <span>{tracks.length} Songs</span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span>{albums.length} Albums</span>
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
                {tracks.length > 0 ? (
                    <MusicGrid
                        tracks={tracks}
                        category="artist"
                    />
                ) : (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        No tracks found for this artist.
                    </div>
                )}

                {/* Albums Section */}
                <div className="flex items-center justify-between mb-6 mt-12 sticky top-0 bg-white/95 dark:bg-black/95 backdrop-blur-sm py-4 z-40">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Albums</h2>
                </div>
                {albums.length > 0 ? (
                    <MusicGrid
                        tracks={albums}
                        category="album"
                        onAlbumClick={(album) => navigate(`/album/${album.id}`)}
                    />
                ) : (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        No albums found for this artist.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArtistPage;
