import { useState } from "react";
import { useGetTracksQuery } from "@/services/MusicAPI";
import { TrackCard } from "@/components/ui/TrackCard";
import { SkelatonLoader } from "@/common";
import { cn } from "@/utils/helper";
import { useAudioPlayerContext } from "@/context/audioPlayerContext";
import MusicGrid from "@/common/Section/MusicGrid";

const filters = [
    { label: "Global Top Hits", value: "top hits 2024" },
    { label: "Pop Anthems", value: "pop music" },
    { label: "Rock Classics", value: "rock classics" },
    { label: "Hip-Hop / Rap", value: "hip hop hits" },
    { label: "Electronic / Dance", value: "electronic dance" },
    { label: "R&B Vibes", value: "r&b hits" },
    { label: "K-Pop Essentials", value: "kpop hits" },
    { label: "Acoustic Chill", value: "acoustic chill" },
];

const SongsPage = () => {
    const [activeFilter, setActiveFilter] = useState(filters[0].value);

    const { data, isLoading, isError } = useGetTracksQuery({
        category: "tracks",
        type: activeFilter,
        page: 1,
    });

    const tracks = data?.results || [];

    return (
        <div className="max-w-6xl mx-auto mt-16 flex flex-col w-full px-6 py-6 pb-24">
            {/* Header & Filters */}
            <div className="flex flex-col gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Musics
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Browse top musics across genres
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    {filters.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => setActiveFilter(filter.value)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                                activeFilter === filter.value
                                    ? "bg-brand text-white shadow-lg shadow-brand/20"
                                    : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
                            )}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <SkelatonLoader />
            ) : isError ? (
                <div className="text-center py-20">
                    <h2 className="text-xl font-bold text-red-500">
                        Something went wrong. Please try again.
                    </h2>
                </div>
            ) : tracks.length > 0 ? (
                <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto w-full pb-24">
                    <MusicGrid
                        tracks={tracks}
                        category="artist"
                    />
                </div>
            ) : (
                <div className="text-center py-20">
                    <h2 className="text-xl font-medium text-gray-500">
                        No songs found.
                    </h2>
                </div>
            )}
        </div>
    );
};

export default SongsPage;
