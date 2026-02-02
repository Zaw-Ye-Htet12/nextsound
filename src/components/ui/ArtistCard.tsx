import { FC } from "react";
import { Link } from "react-router-dom";
import { getImageUrl } from "@/utils";
import { ITrack } from "@/types";

interface ArtistCardProps {
    artist: ITrack;
}

export const ArtistCard: FC<ArtistCardProps> = ({ artist }) => {
    return (
        <div className="flex flex-col items-center gap-3 w-full group cursor-pointer">
            <Link
                to={`/artist/${artist.id}`}
                className="w-full flex flex-col items-center"
            >
                <div className="w-[140px] h-[140px] rounded-full overflow-hidden shadow-lg border-2 border-transparent group-hover:border-brand transition-all duration-300 relative">
                    <img
                        src={getImageUrl(artist.artist_image || artist.poster_path)}
                        alt={artist.artist}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>

                <div className="text-center mt-3 w-[140px]">
                    <h3 className="truncate font-bold text-gray-900 dark:text-white w-full text-base group-hover:text-brand transition-colors">
                        {artist.artist}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Artist
                    </p>
                </div>
            </Link>
        </div>
    );
};
