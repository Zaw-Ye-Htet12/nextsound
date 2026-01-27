
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from './dialog';
import { ITrack } from '@/types';
import { getImageUrl } from '@/utils';
import { Button } from './button';
import { FiExternalLink, FiCalendar, FiMusic, FiDisc, FiClock } from 'react-icons/fi';

interface TrackDetailsDialogProps {
    track: ITrack | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const TrackDetailsDialog: React.FC<TrackDetailsDialogProps> = ({
    track,
    open,
    onOpenChange,
}) => {
    const navigate = useNavigate();

    if (!track) return null;

    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
    };

    const goToArtist = () => {
        if (track?.artist) {
            onOpenChange(false);
            navigate(`/artist/${encodeURIComponent(track.artist)}`);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold dark:text-white">Track Details</DialogTitle>
                    <DialogDescription className="hidden">Details about the song</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center space-y-6 pt-4">
                    {/* Large Artwork */}
                    <div className="relative w-48 h-48 rounded-xl overflow-hidden shadow-2xl ring-1 ring-gray-900/5 dark:ring-white/10 group">
                        <img
                            src={getImageUrl(track.poster_path)}
                            alt={track.title || track.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    </div>

                    {/* Main Info */}
                    <div className="text-center space-y-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                            {track.title || track.name}
                        </h2>
                        <p
                            className="text-lg text-brand dark:text-red-400 font-medium cursor-pointer hover:underline"
                            onClick={goToArtist}
                            title="View Artist"
                        >
                            {track.artist}
                        </p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="w-full grid grid-cols-2 gap-4 text-sm">
                        <div className="flex flex-col space-y-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold">
                                <FiDisc className="w-3 h-3" /> Album
                            </span>
                            <span className="text-gray-900 dark:text-gray-200 font-medium truncate" title={track.album}>
                                {track.album || 'Single'}
                            </span>
                        </div>

                        <div className="flex flex-col space-y-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold">
                                <FiMusic className="w-3 h-3" /> Genre
                            </span>
                            <span className="text-gray-900 dark:text-gray-200 font-medium">
                                {track.genre || 'Pop'}
                            </span>
                        </div>

                        <div className="flex flex-col space-y-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold">
                                <FiCalendar className="w-3 h-3" /> Released
                            </span>
                            <span className="text-gray-900 dark:text-gray-200 font-medium">
                                {track.year || 'Unknown'}
                            </span>
                        </div>

                        <div className="flex flex-col space-y-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold">
                                <FiClock className="w-3 h-3" /> Duration
                            </span>
                            <span className="text-gray-900 dark:text-gray-200 font-medium">
                                {track.duration ? formatTime(track.duration) : '--:--'}
                            </span>
                        </div>
                    </div>

                    {/* External Action */}
                    {track.external_urls?.spotify && (
                        <Button
                            className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold h-11"
                            onClick={() => window.open(track.external_urls?.spotify, '_blank')}
                        >
                            <FiExternalLink className="mr-2 h-4 w-4" />
                            Open in {track.id.length > 15 ? 'Spotify' : 'Apple Music'}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
