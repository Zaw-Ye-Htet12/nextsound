
import { FC } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Link } from "react-router-dom";
import { getImageUrl } from "@/utils";
import { ITrack } from "@/types";

interface ArtistSlidesProps {
    tracks: ITrack[];
}

const ArtistSlides: FC<ArtistSlidesProps> = ({ tracks }) => {
    // Deduplicate artists from tracks
    // Use a Map to keep the first occurrence (which usually has the best image if sorted, or just random)
    const uniqueArtists = new Map<string, ITrack>();

    tracks.forEach(track => {
        if (track.artist && !uniqueArtists.has(track.artist)) {
            uniqueArtists.set(track.artist, track);
        }
    });

    const artists = Array.from(uniqueArtists.values());

    return (
        <Swiper slidesPerView="auto" spaceBetween={20} className="mySwiper px-4">
            {artists.map((track) => (
                <SwiperSlide
                    key={track.artist}
                    className="flex flex-col items-center gap-3 w-[140px] group cursor-pointer"
                >
                    <Link to={`/artist/${encodeURIComponent(track.artist!)}`} className="w-full flex flex-col items-center">
                        <div className="w-[140px] h-[140px] rounded-full overflow-hidden shadow-lg border-2 border-transparent group-hover:border-brand transition-all duration-300 relative">
                            <img
                                src={getImageUrl(track.poster_path)}
                                alt={track.artist}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>

                        <div className="text-center mt-3">
                            <h3 className="font-bold text-gray-900 dark:text-white truncate w-full text-base group-hover:text-brand transition-colors">
                                {track.artist}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Artist
                            </p>
                        </div>
                    </Link>
                </SwiperSlide>
            ))}
        </Swiper>
    );
};

export default ArtistSlides;
