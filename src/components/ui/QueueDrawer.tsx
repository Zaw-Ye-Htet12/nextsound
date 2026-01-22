
import React from 'react';
import { useAudioPlayerContext } from '@/context/audioPlayerContext';
import { Button } from './button';
import { FiX, FiTrash2, FiMusic } from 'react-icons/fi';
import { getImageUrl, cn } from '@/utils';
import { ITrack } from '@/types';

export const QueueDrawer: React.FC = () => {
    const {
        isQueueOpen,
        toggleQueue,
        queue,
        currentTrack,
        removeFromQueue,
        playTrack
    } = useAudioPlayerContext();

    if (!isQueueOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 transition-opacity"
                onClick={toggleQueue}
            />

            {/* Drawer */}
            <div className={cn(
                "fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out",
                isQueueOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Play Queue</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleQueue}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                    >
                        <FiX className="w-6 h-6" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Now Playing */}
                    {currentTrack && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Now Playing</h3>
                            <div className="flex items-center space-x-4 bg-gray-100 dark:bg-gray-800 p-3 rounded-xl">
                                <img
                                    src={getImageUrl(currentTrack.poster_path)}
                                    alt={currentTrack.title}
                                    className="w-16 h-16 rounded-lg object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                        {currentTrack.title || currentTrack.name}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                        {currentTrack.artist || 'Unknown Artist'}
                                    </p>
                                </div>
                                <div className="text-green-500">
                                    <FiMusic className="w-5 h-5 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Up Next */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                            Up Next {queue.length > 0 && `(${queue.length})`}
                        </h3>

                        {queue.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 dark:text-gray-600">
                                <p>Your queue is empty</p>
                                <p className="text-sm mt-1">Add songs to play them next</p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {queue.map((track: ITrack, index: number) => (
                                    <li
                                        key={`${track.id}-${index}`}
                                        className="group flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                        onClick={() => playTrack(track)} // Optional: play from queue on click? Or just let it be.
                                    >
                                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                                            <span className="text-gray-400 text-sm w-4">{index + 1}</span>
                                            <img
                                                src={getImageUrl(track.poster_path)}
                                                alt={track.title}
                                                className="w-10 h-10 rounded object-cover"
                                            />
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                                                    {track.title || track.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {track.artist || 'Unknown Artist'}
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFromQueue(index);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
