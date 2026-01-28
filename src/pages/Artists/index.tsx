import { useState } from "react";
import { useGetArtistsByGenreQuery } from "@/services/DeezerAPI";
import { ArtistCard } from "@/components/ui/ArtistCard";
import { SkelatonLoader } from "@/common";
import { cn } from "@/utils/helper";
import { ITrack } from "@/types";

// Deezer Genre IDs
const filters = [
    { label: "All Cases", value: "0" }, // 0 is usually 'All' or base chart
    { label: "Pop", value: "132" },
    { label: "Rap/Hip Hop", value: "116" },
    { label: "Rock", value: "152" },
    { label: "Dance", value: "113" },
    { label: "R&B", value: "165" },
    { label: "Electro", value: "106" },
    { label: "Alternative", value: "85" }, // Alternative
    // { label: "Indie", value: "indie" }, // No direct ID easily found without deep lookup, sticking to main ones
    // { label: "Metal", value: "464" },
];

const ArtistsPage = () => {
    const [activeFilter, setActiveFilter] = useState(filters[0].value);

    // Use the new hook for fetching by genre
    const { data, isLoading, isError } = useGetArtistsByGenreQuery({
        genreId: activeFilter,
        limit: 50,
    });

    const artists = data?.results || [];

    // Deduplicate artists
    const uniqueArtists = new Map<string, ITrack>();
    artists.forEach((artist) => {
        if (artist.artist && !uniqueArtists.has(artist.artist)) {
            uniqueArtists.set(artist.artist, artist);
        }
    });
    const filteredArtists = Array.from(uniqueArtists.values());

    return (
        <div className="max-w-6xl mx-auto flex flex-col w-full px-6 py-6 pb-24 h-full overflow-y-auto mt-16">
            {/* Header & Filters */}
            <div className="flex flex-col gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Artists
                    </h1>
                </div>

                <div className="flex flex-wrap gap-3">
                    {filters.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => setActiveFilter(filter.value)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                                activeFilter === filter.value
                                    ? "bg-brand text-white border-brand shadow-lg shadow-brand/20"
                                    : "bg-transparent border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
                            )}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="w-full flex justify-center py-20">
                    <SkelatonLoader />
                </div>
            ) : isError ? (
                <div className="text-center py-20">
                    <h2 className="text-xl font-bold text-red-500">
                        Something went wrong. Please try again.
                    </h2>
                </div>
            ) : filteredArtists.length > 0 ? (
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 gap-y-10">
                    {filteredArtists.map((artist) => (
                        <ArtistCard key={artist.id} artist={artist} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <h2 className="text-xl font-medium text-gray-500">
                        No artists found.
                    </h2>
                </div>
            )}
        </div>
    );
};

export default ArtistsPage;
