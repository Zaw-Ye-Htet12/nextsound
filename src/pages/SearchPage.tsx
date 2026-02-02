import { useNavigate, useParams } from "react-router-dom";
import { Loader, Error, Section } from "@/common";
import { itunesApi } from "@/services/ItunesAPI";
import { deezerApi } from "@/services/DeezerAPI";
import { Hero } from "@/pages/Home/components";
import { maxWidth } from "@/styles";
import { cn } from "@/utils/helper";
import { ITrack } from "@/types";
import { FiMusic, FiUser, FiDisc } from "react-icons/fi";

const SearchPage = () => {
    const { query } = useParams();
    const navigate = useNavigate();
    const decodedQuery = decodeURIComponent(query || "").trim();

    // Search for songs (Top Result + Songs)
    const {
        data: songData,
        isLoading: isSongLoading,
        error: songError
    } = itunesApi.useSearchMusicQuery({
        query: decodedQuery,
        limit: 10,
        entity: "song",
        attribute: "songTerm"
    }, { skip: !decodedQuery });

    // Search for artists
    const {
        data: artistData,
        isLoading: isArtistLoading,
        error: artistError
    } = deezerApi.useSearchArtistsQuery({
        query: decodedQuery,
        limit: 6
    }, { skip: !decodedQuery });

    const isLoading = isSongLoading || isArtistLoading;
    const error = songError || artistError;

    if (!decodedQuery) {
        return (
            <div className={cn(maxWidth, "flex items-center justify-center min-h-[50vh]")}>
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Search NextSound</h2>
                    <p className="text-gray-500">Find your favorite songs, artists, and albums.</p>
                </div>
            </div>
        );
    }

    if (isLoading) return <Loader />;
    if (error) return <Error error="Failed to fetch search results" />;

    const songs = (songData?.results || []) as ITrack[];
    const artists = (artistData?.results || []) as ITrack[];

    // Determine "Top Result"
    // Logic: First exact match in Artists, otherwise first exact match in Songs, otherwise first item in Songs.
    let topResult = null;
    const exactArtist = artists.find(a => a.name.toLowerCase() === decodedQuery.toLowerCase());
    const exactSong = songs.find(s => s.name?.toLowerCase() === decodedQuery.toLowerCase());

    if (exactArtist) topResult = { ...exactArtist, type: 'artist' as const };
    else if (exactSong) topResult = { ...exactSong, type: 'track' as const };
    else if (songs.length > 0) topResult = { ...songs[0], type: 'track' as const };
    else if (artists.length > 0) topResult = { ...artists[0], type: 'artist' as const };

    return (
        <div className={cn(maxWidth, "pt-10 lg:mt-12 md:mt-8 sm:mt-6 xs:mt-4 mt-2 mb-20")}>
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                Search results for "{decodedQuery}"
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                {/* Left Column: Top Result (Top Match) */}
                <div className="lg:col-span-2">
                    {topResult && (
                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Top Result</h2>
                            <div
                                onClick={() => {
                                    if (topResult?.type === 'artist') {
                                        // Prefer ID if available (Deezer), fallback to name
                                        const identifier = topResult.id && /^\d+$/.test(topResult.id) ? topResult.id : encodeURIComponent(topResult.name);
                                        navigate(`/artist/${identifier}`);
                                    }
                                    // Handling track click if needed
                                }}
                                className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer group relative"
                            >
                                <div className="mb-4">
                                    <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg bg-gray-300 dark:bg-gray-700">
                                        {topResult.poster_path ? (
                                            <img src={topResult.poster_path} alt={topResult.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                {topResult.type === 'artist' ? <FiUser size={32} /> : <FiMusic size={32} />}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold mb-1 truncate text-gray-900 dark:text-white">{topResult.name || topResult.title}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    {topResult.type === 'artist' ? (
                                        <span className="bg-black/10 dark:bg-white/10 px-2 py-1 rounded-full text-xs uppercase tracking-wider">Artist</span>
                                    ) : (
                                        <>
                                            <span className="bg-black/10 dark:bg-white/10 px-2 py-1 rounded-full text-xs uppercase tracking-wider">Song</span>
                                            <span>• {topResult.artist}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column: Songs */}
                <div className="lg:col-span-3">
                    {songs.length > 0 && (
                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Songs</h2>
                            <div className="space-y-2">
                                {songs.slice(0, 4).map((track) => (
                                    <div
                                        key={track.id}
                                        className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 group"
                                    >
                                        <div className="w-10 h-10 rounded overflow-hidden mr-3 bg-gray-200 dark:bg-gray-700 shrink-0">
                                            {track.poster_path && <img src={track.poster_path} className="w-full h-full object-cover" alt={track.title} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate text-gray-900 dark:text-white">{track.title || track.name}</div>
                                            <div className="text-sm text-gray-500 truncate">{track.artist}</div>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {/* Duration could go here */}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {/* Artists Section */}
            {artists.length > 0 && (
                <section className="mt-8">
                    <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Artists</h2>
                    {/* Reusing existing Hero or creating a simple grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {artists.map((artist) => (
                            <div
                                key={artist.id}
                                className="cursor-pointer group text-center"
                                onClick={() => {
                                    const identifier = artist.id && /^\d+$/.test(artist.id) ? artist.id : encodeURIComponent(artist.name);
                                    navigate(`/artist/${identifier}`);
                                }}
                            >
                                <div className="aspect-square rounded-full overflow-hidden mb-3 bg-gray-200 dark:bg-gray-700 shadow-sm group-hover:shadow-md transition-shadow">
                                    {artist.poster_path ? (
                                        <img src={artist.poster_path} alt={artist.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <FiUser size={40} />
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-medium truncate text-gray-900 dark:text-white group-hover:underline">{artist.name}</h3>
                                <p className="text-sm text-gray-500">Artist</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {songs.length === 0 && artists.length === 0 && (
                <div className="text-center py-20">
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">No results found for "{decodedQuery}"</h3>
                    <p className="text-gray-500 mt-2">Please make sure your words are spelled correctly, or use fewer or different keywords.</p>
                </div>
            )}
        </div>
    );
};

export default SearchPage;
