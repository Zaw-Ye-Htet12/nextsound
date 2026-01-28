
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ITrack } from "@/types";
import { USE_BACKEND_PROXY, PROXY_SERVER_URL } from "@/utils/config";

// Deezer API Configuration
const BASE_URL = USE_BACKEND_PROXY ? `${PROXY_SERVER_URL}/api` : 'https://api.deezer.com';

export const deezerApi = createApi({
    reducerPath: "deezerApi",
    baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
    endpoints: (builder) => ({
        searchArtists: builder.query<{ results: ITrack[] }, { query: string, limit?: number }>({
            query: ({ query, limit = 10 }) => ({
                url: USE_BACKEND_PROXY ? '/deezer' : '/search/artist',
                params: {
                    q: query,
                    limit: limit,
                }
            }),
            transformResponse: (response: any) => {
                const artists = response.data || [];
                const results = artists.map((artist: any) => ({
                    id: String(artist.id),
                    spotify_id: String(artist.id),
                    poster_path: artist.picture_xl || artist.picture_medium || artist.picture_small || '',
                    artist_image: artist.picture_xl || artist.picture_medium || artist.picture_small || '',
                    backdrop_path: artist.picture_xl || '',
                    original_title: artist.name,
                    name: artist.name,
                    title: artist.name,
                    overview: `Artist • ${artist.nb_fan ? artist.nb_fan.toLocaleString() + ' Fans' : 'Music Artist'}`,
                    artist: artist.name,
                    album: '',
                    duration: 0,
                    preview_url: null,
                    external_urls: {
                        spotify: artist.link
                    },
                    popularity: 80,
                    genre: 'Artist',
                    year: 0
                } as ITrack));

                return { results };
            }
        }),
        searchTracks: builder.query<{ results: ITrack[] }, { query: string, limit?: number }>({
            query: ({ query, limit = 10 }) => ({
                url: USE_BACKEND_PROXY ? '/deezer/search' : '/search',
                params: {
                    q: query,
                    limit: limit,
                }
            }),
            transformResponse: (response: any) => {
                // Determine if 'data' is present (Deezer response wrapper)
                const tracks = response.data || [];
                const results = tracks.map((track: any) => ({
                    id: String(track.id),
                    spotify_id: String(track.id),
                    // Use album cover for poster_path (standard behavior)
                    poster_path: track.album?.cover_xl || track.album?.cover_medium || track.album?.cover_small || '',
                    // Use artist picture for artist_image (new field)
                    artist_image: track.artist?.picture_xl || track.artist?.picture_medium || track.artist?.picture_small || '',
                    backdrop_path: track.artist?.picture_xl || track.album?.cover_xl || '',
                    original_title: track.title,
                    name: track.title,
                    title: track.title,
                    overview: `${track.artist?.name} • ${track.album?.title}`,
                    artist: track.artist?.name,
                    album: track.album?.title,
                    duration: track.duration ? track.duration * 1000 : 0, // Deezer duration is in seconds
                    preview_url: track.preview,
                    external_urls: {
                        spotify: track.link
                    },
                    popularity: track.rank ? Math.min(100, Math.round(track.rank / 10000)) : 50, // Approximation
                    genre: 'Pop', // Deezer search result doesn't usually give genre on track object directly without lookup
                    year: 0
                } as ITrack));

                return { results };
            }
        }),
        getArtistsByGenre: builder.query<{ results: ITrack[] }, { genreId: string | number, limit?: number }>({
            query: ({ genreId, limit = 50 }) => ({
                url: USE_BACKEND_PROXY ? `/deezer/genre/${genreId}/artists` : `/genre/${genreId}/artists`,
                params: {
                    limit: limit,
                }
            }),
            transformResponse: (response: any) => {
                const artists = response.data || [];
                const results = artists.map((artist: any) => ({
                    id: String(artist.id),
                    spotify_id: String(artist.id),
                    poster_path: artist.picture_xl || artist.picture_medium || artist.picture_small || '',
                    artist_image: artist.picture_xl || artist.picture_medium || artist.picture_small || '',
                    backdrop_path: artist.picture_xl || '',
                    original_title: artist.name,
                    name: artist.name,
                    title: artist.name,
                    overview: `Artist • ${artist.nb_fan ? artist.nb_fan.toLocaleString() + ' Fans' : 'Music Artist'}`,
                    artist: artist.name,
                    album: '',
                    duration: 0,
                    preview_url: null,
                    external_urls: {
                        spotify: artist.link
                    },
                    popularity: 80,
                    genre: 'Artist',
                    year: 0
                } as ITrack));
                return { results };
            }
        })
    })
});

export const { useSearchArtistsQuery, useSearchTracksQuery, useGetArtistsByGenreQuery } = deezerApi;
