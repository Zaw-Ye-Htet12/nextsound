import { FC, useState } from "react";
import { Link } from "react-router-dom";
import { FiHeart, FiMusic } from "react-icons/fi";

import MusicGrid from "@/common/Section/MusicGrid";
import { useAudioPlayerContext } from "@/context/audioPlayerContext";
import { ITrack } from "@/types";
import { getImageUrl } from "@/utils";

const Library: FC = () => {
    const { favorites, favoritesLoading } = useAudioPlayerContext();
    const [activeTab, setActiveTab] = useState<'songs' | 'artists'>('songs');

    return (
        <div className="max-w-6xl mx-auto flex flex-col relative w-full min-h-screen mt-16">
            {/* Header Section */}
            <div className="flex flex-col mb-6 px-4 pt-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                        <FiHeart className="w-8 h-8 text-red-500 fill-current" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Your Library</h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            {favorites.length} {favorites.length === 1 ? 'song' : 'songs'} liked
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center space-x-1 mt-6 border-b border-gray-200 dark:border-gray-800">
                    <button
                        onClick={() => setActiveTab('songs')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === 'songs'
                            ? 'border-red-500 text-red-600 dark:text-red-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        Liked Songs
                    </button>
                    <button
                        onClick={() => setActiveTab('artists')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === 'artists'
                            ? 'border-red-500 text-red-600 dark:text-red-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        Artists
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="px-4 pb-24">
                {activeTab === 'songs' ? (
                    favoritesLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mb-4"></div>
                            <p className="text-gray-500 dark:text-gray-400">Loading your favorites...</p>
                        </div>
                    ) : favorites.length > 0 ? (
                        <MusicGrid
                            tracks={favorites}
                            category="library"
                            initialDisplayCount={50}
                            loadMoreCount={50}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <FiMusic className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Your library is empty
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8">
                                Songs you like will appear here. Look for the heart icon to add songs to your favorites.
                            </p>
                            <Link
                                to="/"
                                className="px-6 py-3 bg-brand hover:brightness-90 text-white font-medium rounded-full transition-colors duration-200"
                            >
                                Explore Music
                            </Link>
                        </div>
                    )
                ) : (
                    // Artists Grid
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {(() => {
                            // Deduplicate artists by ID (preferred) or Name
                            const uniqueArtistsMap = new Map<string, ITrack>();

                            favorites.forEach(track => {
                                if (!track.artist) return;
                                // Use artist_id as key if available, otherwise name
                                const key = track.artist_id || track.artist;
                                if (!uniqueArtistsMap.has(key)) {
                                    uniqueArtistsMap.set(key, track);
                                }
                            });

                            return Array.from(uniqueArtistsMap.values()).map(track => {
                                const artistName = track.artist;
                                const identifier = track.artist_id || encodeURIComponent(artistName || '');

                                return (
                                    <Link
                                        to={`/artist/${identifier}`}
                                        key={identifier}
                                        className="flex flex-col group"
                                    >
                                        <div className="aspect-square rounded-full overflow-hidden mb-3 shadow-lg group-hover:shadow-xl transition-shadow relative">
                                            <img
                                                src={getImageUrl(track.poster_path || '')}
                                                alt={artistName}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        </div>
                                        <h3 className="text-center font-bold text-gray-900 dark:text-white truncate px-2 group-hover:text-brand transition-colors">
                                            {artistName}
                                        </h3>
                                        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                                            Artist
                                        </p>
                                    </Link>
                                );
                            });
                        })()}
                        {favorites.length === 0 && (
                            <div className="col-span-full text-center py-20 text-gray-500">
                                No artists found in your library.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Library;
