/**
 * MCPAudioService - Enhanced iTunes integration for preview URL fetching
 *
 * This service provides MCP-style functionality for fetching iTunes track preview URLs
 * while leveraging our existing backend proxy and API infrastructure.
 */

import { ITrack } from '@/types';

export interface PreviewTrack extends ITrack {
  preview_url?: string | null;
  spotify_id?: string;
}

export class MCPAudioService {
  private baseUrl: string;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor() {
    // Use existing backend proxy for CORS handling, pointing to iTunes
    this.baseUrl = import.meta.env.VITE_USE_BACKEND_PROXY
      ? 'http://localhost:3001/api/itunes'
      : 'https://itunes.apple.com/search';
  }

  /**
   * Search for tracks with preview URLs using iTunes
   */
  async searchTracksWithPreviews(query: string, limit: number = 10): Promise<PreviewTrack[]> {
    try {
      console.log(`🔍 MCPAudioService: Searching tracks with previews for "${query}"`);

      // iTunes uses query param 'term', 'limit', 'media=music', 'entity=song'
      // If we are using the proxy, it expects standard query params.
      // If direct, same.
      // Note: The proxy endpoint is /api/itunes, which accepts query params directly.

      const endpoint = `?term=${encodeURIComponent(query)}&limit=${limit}&media=music&entity=song&country=US`;
      const response = await this.makeRequest(endpoint);

      if (!response.ok) {
        console.error(`Search failed:`, response.status);
        return [];
      }

      const data = await response.json();
      const tracks = data.results || [];

      // Transform and filter tracks with preview URLs
      const tracksWithPreviews: PreviewTrack[] = tracks
        .map((track: any) => {
          const highResImage = track.artworkUrl100?.replace('100x100bb', '600x600bb') || '';
          return {
            id: String(track.trackId),
            spotify_id: String(track.trackId),
            original_title: track.trackName,
            name: track.trackName,
            poster_path: highResImage,
            backdrop_path: highResImage,
            overview: `${track.artistName} - ${track.collectionName}`,
            artist: track.artistName,
            album: track.collectionName,
            duration: track.trackTimeMillis,
            popularity: 75,
            preview_url: track.previewUrl,
            title: track.trackName,
            external_urls: { spotify: track.trackViewUrl }
          };
        })
        .filter((track: PreviewTrack) => track.preview_url); // Only tracks with previews

      console.log(`✅ MCPAudioService: Found ${tracksWithPreviews.length} tracks with preview URLs out of ${tracks.length} total tracks`);

      return tracksWithPreviews;

    } catch (error) {
      console.error(`❌ MCPAudioService: Search error:`, error);
      return [];
    }
  }

  /**
   * Enhance an existing track with preview URL data
   */
  async enhanceTrackWithPreview(track: ITrack): Promise<PreviewTrack> {
    // If track already has preview URL, return as-is
    if ('preview_url' in track && track.preview_url) {
      return track as PreviewTrack;
    }

    // Try to find the track on iTunes by searching for it
    const searchQuery = `${track.name || track.original_title} ${track.artist || ''}`;
    const searchResults = await this.searchTracksWithPreviews(searchQuery, 1);

    if (searchResults.length > 0) {
      console.log(`🔄 MCPAudioService: Enhanced track "${track.name}" with preview URL`);

      // Merge the original track data with the preview URL
      return {
        ...track,
        preview_url: searchResults[0].preview_url,
        // We might want to keep the original ID if it's important, or update it
        // But for playback, the preview_url is what matters.
        // spotify_id: searchResults[0].spotify_id 
      };
    }

    console.log(`⚠️ MCPAudioService: No preview URL found for track "${track.name}"`);

    // Return track without preview URL
    return {
      ...track,
      preview_url: null
    };
  }

  // fetchTrackWithPreview by ID is tricky with iTunes if we only have a Spotify ID.
  // if we have an iTunes ID, we can use lookup. But for now, let's just use search.
  async fetchTrackWithPreview(trackId: string): Promise<PreviewTrack | null> {
    // Just try to search by ID as a fallback, though it likely won't work well for random IDs
    // A better approach is to search by metadata if we have it, but here we only have ID.
    // If the ID is numeric, it might be an iTunes ID.

    const isNumeric = /^\d+$/.test(trackId);
    if (isNumeric) {
      // It might be an iTunes ID
      const endpoint = `?term=${trackId}&limit=1&media=music&entity=song&country=US`; // Term search acts as lookup sometimes
      // Or use https://itunes.apple.com/lookup?id=...
      // Let's implement lookup correctly via our proxy if possible.
      // Our proxy forwards everything query params.
      // However, our proxy endpoint is /api/itunes -> calls https://itunes.apple.com/search
      // It does NOT call /lookup.
      // We might need to stick to search or update proxy.
      // Since we can't update proxy easily to differentiate, let's just search.
      // Searching for ID in iTunes usually doesn't work.
      return null;
    }
    return null;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(endpoint: string, attempt: number = 1): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url);

      if (!response.ok && attempt < this.retryAttempts) {
        console.log(`🔄 MCPAudioService: Retrying request (attempt ${attempt + 1}/${this.retryAttempts})`);
        await this.delay(this.retryDelay * attempt);
        return this.makeRequest(endpoint, attempt + 1);
      }

      return response;
    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.log(`🔄 MCPAudioService: Retrying after network error (attempt ${attempt + 1}/${this.retryAttempts})`);
        await this.delay(this.retryDelay * attempt);
        return this.makeRequest(endpoint, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if the service is available (backend proxy is running)
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      // Simple search check
      const response = await fetch(`${this.baseUrl}?term=test&limit=1`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const mcpAudioService = new MCPAudioService();