import { memo, FC, useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useInView } from "framer-motion";

import MusicSlides from "./MusicSlides";
import ArtistSlides from "./ArtistSlides";
import { SkelatonLoader } from "../Loader";
import Error from "../Error";
import ErrorBoundary, { APIErrorBoundary } from "../ErrorBoundary";

import { useGetTracksQuery } from "@/services/MusicAPI";
import { useSearchTracksQuery } from "@/services/DeezerAPI";
import { cn, getErrorMessage } from "@/utils/helper";
import { ITrack } from "@/types";

interface SectionProps {
  title: string;
  category: string;
  className?: string;
  type?: string;
  id?: number;
  showSimilarTracks?: boolean;
}

const Section: FC<SectionProps> = ({
  title,
  category,
  className,
  type,
  id,
  showSimilarTracks,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const inView = useInView(ref, {
    margin: "420px",
    once: true,
  });

  const isArtistCategory = category === 'artist';

  const {
    data: musicData = { results: [] },
    isLoading: isMusicLoading,
    isError: isMusicError,
    error: musicError,
  } = useGetTracksQuery(
    {
      category,
      type,
      page: 1,
      showSimilarTracks,
      id,
      cacheKey: `${title}-1`,
    },
    {
      skip: !inView || isArtistCategory,
    }
  );

  const {
    data: deezerData = { results: [] },
    isLoading: isDeezerLoading,
    isError: isDeezerError,
    error: deezerError,
  } = useSearchTracksQuery(
    {
      query: type || 'top',
      limit: 25
    },
    {
      skip: !inView || !isArtistCategory
    }
  );

  const data = isArtistCategory ? deezerData : musicData;
  const isLoading = isArtistCategory ? isDeezerLoading : isMusicLoading;
  const isError = isArtistCategory ? isDeezerError : isMusicError;
  const error = isArtistCategory ? deezerError : musicError;

  const errorMessage = isError ? getErrorMessage(error) : "";

  const sectionStyle = cn(
    `sm:py-[20px] xs:py-[18.75px] py-[16.75px] font-nunito`,
    className
  );

  return (
    <ErrorBoundary>
      <section className={sectionStyle} ref={ref}>

        <div className="flex flex-row justify-between items-center mb-[22.75px]">
          <div className=" relative">
            <h3 className="sm:text-[22.25px] xs:text-[20px] text-[18.75px] dark:text-gray-50 sm:font-bold font-semibold">{title}</h3>
            <div className="line" />
          </div>
          <Link
            to={category === 'artist' ? '/artists' : '/songs'}
            className="text-gray-500 hover:text-brand dark:text-gray-400 dark:hover:text-brand text-sm font-bold uppercase tracking-wider transition-colors"
          >
            See All
          </Link>
        </div>
        <div className={title === "Latest Hits" ? "min-h-[400px]" : "sm:h-[312px] xs:h-[309px] h-[266px]"}>
          {isLoading ? (
            <SkelatonLoader />
          ) : isError ? (
            <Error error={String(errorMessage)} className="h-full text-[18px]" />
          ) : (
            <APIErrorBoundary>
              {category === 'artist' ? (
                <ArtistSlides tracks={data.results} />
              ) : (
                <MusicSlides
                  tracks={data.results}
                  category={category}
                />
              )}
            </APIErrorBoundary>
          )}
        </div>
      </section>
    </ErrorBoundary>
  );
};

export default memo(Section);
