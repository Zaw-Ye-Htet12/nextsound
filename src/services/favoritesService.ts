import { supabase } from './supabase';
import { ITrack } from '@/types';

export interface FavoriteRecord {
    id: string;
    user_id: string;
    track_id: string;
    track_data: ITrack;
    created_at: string;
}

export const favoritesService = {
    // Fetch all favorites for the current user
    async getFavorites(): Promise<ITrack[]> {
        const { data, error } = await supabase
            .from('favorites')
            .select('track_data')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data?.map(record => record.track_data) || [];
    },

    // Add a track to favorites
    async addFavorite(track: ITrack): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('favorites')
            .insert({
                user_id: user.id,
                track_id: track.id,
                track_data: track
            });

        if (error) {
            // Handle duplicate error gracefully
            if (error.code === '23505') {
                throw new Error('Track already in favorites');
            }
            throw error;
        }
    },

    // Remove a track from favorites
    async removeFavorite(trackId: string): Promise<void> {
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('track_id', trackId);

        if (error) throw error;
    },

    // Check if a track is favorited
    async isFavorite(trackId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('favorites')
            .select('id')
            .eq('track_id', trackId)
            .maybeSingle();

        if (error) throw error;
        return !!data;
    },

    // Migrate localStorage favorites to database
    async migrateLocalStorageFavorites(): Promise<number> {
        const localFavorites = JSON.parse(localStorage.getItem('nextsound_favorites') || '[]');
        if (localFavorites.length === 0) return 0;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0;

        const records = localFavorites.map((track: ITrack) => ({
            user_id: user.id,
            track_id: track.id,
            track_data: track
        }));

        const { error } = await supabase
            .from('favorites')
            .upsert(records, { onConflict: 'user_id,track_id' });

        if (error) throw error;

        // Clear localStorage after successful migration
        localStorage.removeItem('nextsound_favorites');
        return localFavorites.length;
    }
};
