
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
                    artist_id: String(artist.id),
                    album: '',
                    duration: 0,
                    preview_url: null,
                    external_urls: {
                        spotify: artist.link
                    },
                    popularity: 80,
                    genre: 'Artist',
                    year: 0,
                    type: 'artist' as const
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
                    artist_id: String(track.artist?.id),
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
                    artist_id: String(artist.id),
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
        getArtistDetails: builder.query<ITrack, string>({
            query: (id) => ({
                url: USE_BACKEND_PROXY ? `/deezer/artist/${id}` : `/artist/${id}`,
            }),
            transformResponse: (artist: any) => ({
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
                artist_id: String(artist.id),
                album: '',
                duration: 0,
                preview_url: null,
                external_urls: { spotify: artist.link },
                popularity: 80,
                genre: 'Artist',
                year: 0
            } as ITrack)
        }),
        getArtistTopTracks: builder.query<{ results: ITrack[] }, { id: string, limit?: number }>({
            query: ({ id, limit = 50 }) => ({
                url: USE_BACKEND_PROXY ? `/deezer/artist/${id}/top` : `/artist/${id}/top`,
                params: { limit: limit }
            }),
            transformResponse: (response: any) => {
                const tracks = response.data || [];
                const results = tracks.map((track: any) => ({
                    id: String(track.id),
                    spotify_id: String(track.id),
                    // Use album cover for poster_path 
                    poster_path: track.album?.cover_xl || track.album?.cover_medium || track.album?.cover_small || '',
                    // Use artist picture for artist_image
                    artist_image: track.contributors?.[0]?.picture_xl || '',
                    backdrop_path: track.album?.cover_xl || '',
                    original_title: track.title,
                    name: track.title,
                    title: track.title,
                    overview: `${track.artist?.name} • ${track.album?.title}`,
                    artist: track.artist?.name,
                    artist_id: String(track.artist?.id),
                    album: track.album?.title,
                    duration: track.duration ? track.duration * 1000 : 0,
                    preview_url: track.preview,
                    external_urls: { spotify: track.link },
                    popularity: track.rank ? Math.min(100, Math.round(track.rank / 10000)) : 50,
                    genre: 'Pop',
                    year: 0
                } as ITrack));
                return { results };
            }
        }),
        getArtistAlbums: builder.query<{ results: ITrack[] }, { id: string, limit?: number }>({
            query: ({ id, limit = 50 }) => ({
                url: USE_BACKEND_PROXY ? `/deezer/artist/${id}/albums` : `/artist/${id}/albums`,
                params: { limit: limit }
            }),
            transformResponse: (response: any) => {
                const albums = response.data || [];
                const results = albums.map((album: any) => ({
                    id: String(album.id),
                    spotify_id: String(album.id),
                    poster_path: album.cover_xl || album.cover_medium || album.cover_small || '',
                    artist_image: '',
                    backdrop_path: album.cover_xl || '',
                    original_title: album.title,
                    name: album.title,
                    title: album.title,
                    overview: `Album • ${album.release_date?.split('-')[0] || ''}`,
                    artist: '', // Deezer album list item doesn't always have artist object inside, but we know context
                    album: album.title,
                    duration: 0,
                    preview_url: null,
                    external_urls: { spotify: album.link },
                    popularity: 50,
                    genre: 'Album',
                    year: album.release_date ? parseInt(album.release_date.split('-')[0]) : 0,
                    type: 'album' as const,
                    release_date: album.release_date
                } as ITrack));
                return { results };
            }
        }),
        getAlbumDetails: builder.query<{ album: ITrack, tracks: ITrack[] }, { id: string }>({
            query: ({ id }) => ({
                url: USE_BACKEND_PROXY ? `/deezer/album/${id}` : `/album/${id}`
            }),
            transformResponse: (response: any) => {
                const data = response || {};

                const album: ITrack = {
                    id: String(data.id),
                    spotify_id: String(data.id),
                    poster_path: data.cover_xl || data.cover_medium || data.cover_small || '',
                    artist_image: data.artist?.picture_xl || '',
                    backdrop_path: data.cover_xl || '',
                    original_title: data.title,
                    name: data.title,
                    title: data.title,
                    overview: `Album • ${data.artist?.name} • ${data.release_date?.split('-')[0] || ''}`,
                    artist: data.artist?.name,
                    artist_id: String(data.artist?.id),
                    album: data.title,
                    duration: data.duration ? data.duration * 1000 : 0,
                    preview_url: null,
                    external_urls: { spotify: data.link },
                    popularity: data.rank ? Math.min(100, Math.round(data.rank / 10000)) : 50,
                    genre: data.genres?.data?.[0]?.name || 'Album',
                    year: data.release_date ? parseInt(data.release_date.split('-')[0]) : 0,
                    type: 'album' as const,
                    total_tracks: data.nb_tracks,
                    release_date: data.release_date
                } as ITrack;

                const tracks = (data.tracks?.data || []).map((track: any) => ({
                    id: String(track.id),
                    spotify_id: String(track.id),
                    poster_path: album.poster_path, // Tracks in album list often don't have cover, use album's
                    artist_image: album.artist_image,
                    backdrop_path: album.backdrop_path,
                    original_title: track.title,
                    name: track.title,
                    title: track.title,
                    overview: `${track.artist?.name} • ${album.name}`,
                    artist: track.artist?.name,
                    artist_id: String(track.artist?.id),
                    album: album.name,
                    duration: track.duration ? track.duration * 1000 : 0,
                    preview_url: track.preview,
                    external_urls: { spotify: track.link },
                    popularity: track.rank ? Math.min(100, Math.round(track.rank / 10000)) : 50,
                    genre: album.genre,
                    year: album.year
                } as ITrack));

                return { album, tracks };
            }
        })
    })
});

export const { useSearchArtistsQuery, useSearchTracksQuery, useGetArtistsByGenreQuery, useGetArtistDetailsQuery, useGetArtistTopTracksQuery, useGetArtistAlbumsQuery, useGetAlbumDetailsQuery } = deezerApi;
