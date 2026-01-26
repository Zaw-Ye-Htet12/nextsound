
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ITrack } from "@/types";

// iTunes API Configuration
// We use the proxy server to avoid CORS issues if possible, or fallback to direct
// Actually, using the proxy we just set up is the most reliable method.
const USE_PROXY = true;
const BASE_URL = USE_PROXY ? 'http://localhost:3001/api' : 'https://itunes.apple.com';

// Interface for iTunes response
interface ItunesResponse {
    resultCount: number;
    results: ItunesTrack[];
}

interface ItunesTrack {
    trackId: number;
    trackName: string;
    artistName: string;
    collectionName: string;
    artworkUrl100: string; // The high-res album art
    artworkUrl60: string;
    previewUrl: string;    // The .m4a 30s preview
    trackTimeMillis: number;
    primaryGenreName: string;
    releaseDate: string;
    trackViewUrl: string;
}

// Transform iTunes track to our internal ITrack interface
const transformItunesTrack = (track: ItunesTrack): ITrack => {
    // Get a higher res image by hacking the URL (iTunes returns 100x100, we can ask for 600x600)
    const highResImage = track.artworkUrl100.replace('100x100bb', '600x600bb');

    return {
        id: String(track.trackId),
        spotify_id: String(track.trackId), // reusing this field for ID compatibility
        poster_path: highResImage,
        backdrop_path: highResImage, // iTunes doesn't have backdrops, use the cover
        original_title: track.trackName,
        name: track.trackName,
        title: track.trackName,
        overview: `Song by ${track.artistName} • ${track.collectionName}`,
        artist: track.artistName,
        album: track.collectionName,
        duration: track.trackTimeMillis,
        preview_url: track.previewUrl, // Direct audio URL!
        external_urls: {
            spotify: track.trackViewUrl // Link to Apple Music instead
        },
        popularity: 75, // Fake popularity since iTunes doesn't give it
        genre: track.primaryGenreName,
        year: new Date(track.releaseDate).getFullYear()
    };
};

export const itunesApi = createApi({
    reducerPath: "itunesApi",
    baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
    endpoints: (builder) => ({
        searchMusic: builder.query<{ results: ITrack[] }, { query: string, limit?: number, entity?: string }>({
            query: ({ query, limit = 25, entity = 'song' }) => ({
                url: USE_PROXY ? '/itunes' : '/search', // If using proxy, path is /itunes
                params: {
                    term: query,
                    limit: limit,
                    entity: entity,
                    media: 'music'
                }
            }),
            transformResponse: (response: ItunesResponse) => {
                // Determine if we are handling tracks or artists based on result structure
                // But ItunesResponse interface assumes proper track struct. 
                // We'll map optimistically.
                const results = response.results.map(item => {
                    // Check if wrapperType is 'artist'
                    if ((item as any).wrapperType === 'artist') {
                        // Map artist to ITrack structure for now
                        return {
                            id: String((item as any).artistId),
                            spotify_id: String((item as any).artistId),
                            poster_path: '', // Artists often don't have images in search results!
                            // Wait, check_artist_api.cjs output showed NO artist image in search result.
                            // "artistLinkUrl": "...", "primaryGenreName": "Pop"
                            // We need a fallback or another way to get image. 
                            // But for now, let's map what we have.
                            backdrop_path: '',
                            original_title: (item as any).artistName,
                            name: (item as any).artistName,
                            title: (item as any).artistName, // For compatibility
                            overview: `Artist • ${(item as any).primaryGenreName}`,
                            artist: (item as any).artistName,
                            album: '',
                            duration: 0,
                            preview_url: null,
                            external_urls: {
                                spotify: (item as any).artistLinkUrl
                            },
                            popularity: 50,
                            genre: (item as any).primaryGenreName,
                            year: 0
                        } as ITrack;
                    }
                    return transformItunesTrack(item);
                });

                // Shuffle
                for (let i = results.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [results[i], results[j]] = [results[j], results[i]];
                }
                return { results };
            }
        })
    })
});

export const { useSearchMusicQuery } = itunesApi;
