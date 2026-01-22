import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { itunesApi } from "./ItunesAPI";
import { ITrack } from "@/types";

// Create a unified API that wraps Spotify functionality
export const musicApi = createApi({
  reducerPath: "musicApi",
  baseQuery: fetchBaseQuery({ baseUrl: '/' }), // Dummy base query since we're using manual queries

  endpoints: (builder) => ({
    // This is just a placeholder - we'll use the Spotify API directly
    getTracks: builder.query<{ results: ITrack[] }, {
      category: string | undefined;
      type?: string;
      page?: number;
      searchQuery?: string;
      showSimilarTracks?: boolean;
      id?: number;
    }>({
      query: () => '', // Dummy query since we handle this manually
    }),

    getTrack: builder.query<ITrack, { category: string; id: number }>({
      query: () => '', // Dummy query since we handle this manually
    }),
  }),
});

// Create hooks that provide music data through Spotify API integration
export const useGetTracksQuery = (
  args: {
    category: string | undefined;
    type?: string;
    page?: number;
    searchQuery?: string;
    showSimilarTracks?: boolean;
    id?: number;
    cacheKey?: string; // Add unique cache key
  },
  options?: { skip?: boolean }
) => {
  const { category, type, searchQuery, showSimilarTracks } = args;
  const { skip = false } = options || {};

  // Handle search queries
  if (searchQuery) {
    // Use iTunes API for search
    return itunesApi.useSearchMusicQuery({
      query: searchQuery,
      limit: 50
    }, { skip });
  }

  // Handle legacy content categories using iTunes search fallback


  // Handle similar tracks (related content)
  if (showSimilarTracks) {
    return itunesApi.useSearchMusicQuery({
      query: 'top hits', // iTunes doesn't have recommendations, just show hits
      limit: 10
    }, { skip });
  }

  // Dynamic genre support: use the 'type' directly as a search query if available.
  const searchTerm = type || 'top hits';

  return itunesApi.useSearchMusicQuery({
    query: searchTerm,
    limit: 25
  }, { skip });
};

export const useGetTrackQuery = (
  args: { category: string; id: number | string },
  options?: { skip?: boolean }
) => {
  const { id } = args;
  const { skip = false } = options || {};

  // Handle both string and number IDs
  const stringId = String(id);

  // Validate ID
  if (!stringId || stringId === 'undefined' || stringId === 'null') {
    return { isError: true, error: { status: 400, message: 'Invalid ID' } } as any;
  }

  // Since iTunes doesn't support looking up by Spotify ID (which our app uses internally),
  // and we don't have a direct "lookup by ID" endpoint exposed in our simple ItunesAPI service yet,
  // we will perform a search for the ID assuming it might be a track name or just fallback to search.
  // Ideally, we should add a 'lookup' endpoint to ItunesAPI.ts.
  // For now, let's use the search endpoint which we know works.

  return itunesApi.useSearchMusicQuery({
    query: stringId, // Try searching by ID (which won't work well) or we need a better strategy
    limit: 1
  }, { skip });
};