
import { FC } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Link } from "react-router-dom";
import { getImageUrl } from "@/utils";
import { ITrack } from "@/types";
import { ArtistCard } from "@/components/ui/ArtistCard";

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
                    <ArtistCard artist={track} />
                </SwiperSlide>
            ))}
        </Swiper>
    );
};

export default ArtistSlides;
