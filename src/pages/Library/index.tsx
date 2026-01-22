import { FC } from "react";
import { Link } from "react-router-dom";
import { FiHeart, FiMusic } from "react-icons/fi";

import MusicGrid from "@/common/Section/MusicGrid";
import { useAudioPlayerContext } from "@/context/audioPlayerContext";

const Library: FC = () => {
    const { favorites } = useAudioPlayerContext();

    return (
        <div className="flex flex-col relative w-full min-h-screen">
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
            </div>

            {/* Content Section */}
            <div className="px-4 pb-24">
                {favorites.length > 0 ? (
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
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors duration-200"
                        >
                            Explore Music
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Library;
