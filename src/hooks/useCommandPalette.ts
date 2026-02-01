import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { itunesApi } from '@/services/ItunesAPI';
import { deezerApi } from '@/services/DeezerAPI';
import { ITrack } from '@/types';
import { useTheme } from '@/context/themeContext';
import { useGlobalContext } from '@/context/globalContext';
import { toast } from 'sonner';

export interface SearchResult {
  id: string;
  type: 'track' | 'album' | 'artist' | 'playlist' | 'command';
  title: string;
  subtitle: string;
  image?: string;
  data: any;
  action?: () => void;
  isExactMatch?: boolean;
  keepOpen?: boolean;
}

export interface Command {
  id: string;
  title: string;
  subtitle: string;
  category: 'navigation' | 'player' | 'search' | 'settings' | 'help';
  action: () => void;
  keywords: string[];
  shortcut?: string;
  icon?: string;
}

interface UseCommandPaletteProps {
  onItemSelect?: (item: SearchResult) => void;
  onClose?: () => void;
}

export const useCommandPalette = ({
  onItemSelect,
  onClose
}: UseCommandPaletteProps) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { showSidebar, setShowSidebar } = useGlobalContext();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);




  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nextsound_search_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentSearches(parsed.queries || []);
        setSearchHistory(parsed.items || []);
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }
  }, []);



  // Search for music when query changes using iTunes API
  const {
    data: musicSearchData,
    isLoading: isMusicSearchLoading,
    error: musicSearchError
  } = itunesApi.useSearchMusicQuery(
    {
      query: query.trim(),
      limit: 5,
      entity: 'song',
      attribute: 'songTerm'
    },
    {
      skip: !query.trim()
    }
  );

  // Search for Artists using Deezer (better images)
  const {
    data: artistSearchData,
    isLoading: isArtistSearchLoading
  } = deezerApi.useSearchArtistsQuery(
    {
      query: query.trim(),
      limit: 3
    },
    {
      skip: !query.trim()
    }
  );

  // Define app commands
  const commands: Command[] = useMemo(() => [
    // Navigation Commands
    {
      id: 'nav-home',
      title: 'Go to Home',
      subtitle: 'Navigate to the homepage',
      category: 'navigation',
      action: () => navigate('/'),
      keywords: ['home', 'homepage', 'main', 'start'],
      icon: '🏠'
    },


    // Settings Commands
    {
      id: 'settings-theme',
      title: 'Toggle Dark Mode',
      subtitle: `Switch to ${theme === 'Dark' ? 'light' : 'dark'} theme`,
      category: 'settings',
      action: () => setTheme(theme === 'Dark' ? 'Light' : 'Dark'),
      keywords: ['theme', 'dark', 'light', 'mode', 'appearance'],
      shortcut: '⌘+D',
      icon: theme === 'Dark' ? '☀️' : '🌙'
    },
    {
      id: 'settings-sidebar',
      title: showSidebar ? 'Hide Sidebar' : 'Show Sidebar',
      subtitle: 'Toggle navigation sidebar',
      category: 'settings',
      action: () => setShowSidebar(!showSidebar),
      keywords: ['sidebar', 'navigation', 'menu', 'toggle'],
      icon: showSidebar ? '◀️' : '▶️'
    },

    // Help Commands
    {
      id: 'help-shortcuts',
      title: 'Keyboard Shortcuts',
      subtitle: 'View all available keyboard shortcuts',
      category: 'help',
      action: () => {
        // TODO: Implement shortcuts modal
      },
      keywords: ['help', 'shortcuts', 'keys', 'commands'],
      shortcut: '⌘+?',
      icon: '⌨️'
    }
  ], [navigate, theme, showSidebar, setTheme, setShowSidebar]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase();

    return commands
      .filter(command =>
        command.title.toLowerCase().includes(searchTerm) ||
        command.subtitle.toLowerCase().includes(searchTerm) ||
        command.keywords.some(keyword => keyword.includes(searchTerm))
      )
      .map(command => {
        // Check if it's an exact match for commands
        const isExactMatch = command.title.toLowerCase() === searchTerm ||
          command.keywords.some(keyword => keyword === searchTerm);

        return {
          id: command.id,
          type: 'command' as const,
          title: command.title,
          subtitle: command.subtitle,
          image: undefined,
          data: command,
          action: command.action,
          isExactMatch
        };
      });
  }, [query, commands]);

  // Transform music search results
  const musicResults: SearchResult[] = useMemo(() => {
    const results: SearchResult[] = [];

    // Process Artist Results first
    if (artistSearchData?.results) {
      results.push(...artistSearchData.results
        .map((artist: ITrack) => {
          // Check if it's an exact match
          const isExact = artist.name.toLowerCase() === query.trim().toLowerCase();
          return {
            id: `artist-${artist.id}`,
            type: 'artist' as const,
            title: artist.name,
            subtitle: 'Artist',
            image: artist.poster_path,
            data: artist,
            isExactMatch: isExact,
            action: () => navigate(`/artist/${encodeURIComponent(artist.name)}`)
          };
        }));
    }

    if (musicSearchData?.results) {
      // Use iTunes API results
      results.push(...musicSearchData.results.map((track: ITrack) => ({
        id: `track-${track.id}`,
        type: 'track' as const,
        title: track.title || track.name || 'Unknown Track',
        subtitle: `${track.artist || 'Unknown Artist'} • ${track.album || 'Unknown Album'}`,
        image: track.poster_path,
        data: track,
        isExactMatch: false
      })));
    }

    return results;
  }, [musicSearchData, artistSearchData, query, navigate]);



  // Separate exact matches from recommendations
  const { exactMatches, recommendations } = useMemo(() => {
    // Combine all results - showing Artists and Songs
    const allCombined = [...musicResults];

    // Filter "bullshit" results: Ensure the item title or artist matches at least one word from the query
    // This prevents iTunes from returning "Crazy" when you search "Slow down like crazy" just because of one word.
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    // Only apply strict filtering if we have enough words (avoid filtering short queries like "Ad")
    const filteredResults = allCombined.filter(item => {
      // If query is short, trust the API
      if (query.length < 3) return true;

      const title = item.title.toLowerCase();
      const artist = (item.data?.artist || '').toLowerCase();
      const fullQuery = query.toLowerCase();

      // Check if full query appears in title or artist (best match)
      if (title.includes(fullQuery) || artist.includes(fullQuery)) return true;

      // Check if at least one significant word appears in title or artist
      if (queryWords.length > 0) {
        return queryWords.some(word => title.includes(word) || artist.includes(word));
      }

      return true;
    });

    // Deduplicate by ID
    const uniqueResults = filteredResults.filter((item, index, self) =>
      index === self.findIndex((t) => (
        t.id === item.id
      ))
    );

    // Sort: Artists -> Tracks
    uniqueResults.sort((a, b) => {
      const typeScore = (type: string) => {
        if (type === 'artist') return 1;
        if (type === 'track') return 2;
        return 3;
      };
      return typeScore(a.type) - typeScore(b.type);
    });

    const exact = uniqueResults.filter(item => item.isExactMatch);
    const recs = uniqueResults.filter(item => !item.isExactMatch);

    return { exactMatches: exact, recommendations: recs };
  }, [musicResults, query]);

  // Combine all results (maintaining separation for UI)
  const allResults = useMemo(() => {
    if (!query.trim()) return [];

    // Show exact matches first, then recommendations
    const results = [...exactMatches, ...recommendations];

    // Add "View all results" option at the end if there are results
    if (results.length > 0) {
      results.push({
        id: 'view-all-results',
        type: 'command',
        title: `See all results for "${query}"`,
        subtitle: 'View comprehensive search results',
        data: { category: 'search' },
        action: () => navigate(`/search/${encodeURIComponent(query)}`),
        keepOpen: false
      });
    }

    return results;
  }, [query, exactMatches, recommendations, navigate]);

  // Handle item selection
  const handleItemSelect = (item: SearchResult) => {
    // Add to search history
    if (query.trim()) {
      const newSearches = [query.trim(), ...recentSearches.filter(s => s !== query.trim())].slice(0, 10);
      setRecentSearches(newSearches);

      const newHistory = [item, ...searchHistory.filter(h => h.id !== item.id)].slice(0, 20);
      setSearchHistory(newHistory);

      // Save to localStorage
      localStorage.setItem('nextsound_search_history', JSON.stringify({
        queries: newSearches,
        items: newHistory
      }));
    }

    // Execute action based on item type
    if (item.action) {
      item.action();
    }
    // Note: Detail page navigation removed - tracks/albums/artists only display on home page

    // Call optional callback
    onItemSelect?.(item);

    // Close palette and reset
    if (!item.keepOpen) {
      onClose?.();
      setQuery('');
      setSelectedIndex(0);
    }
  };

  // Get recent items for empty state
  const recentItems = useMemo(() => {
    if (query.trim()) return [];
    return searchHistory.slice(0, 5);
  }, [query, searchHistory]);

  // Loading state
  const isLoading = (isMusicSearchLoading || isArtistSearchLoading) && query.trim();

  // Error state
  const searchError = musicSearchError;

  return {
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    allResults,
    exactMatches,
    recommendations,
    recentItems,
    recentSearches,
    isLoading,
    error: searchError,
    handleItemSelect,
    clearHistory: () => {
      setRecentSearches([]);
      setSearchHistory([]);
      setRecentSearches([]);
      setSearchHistory([]);
      localStorage.removeItem('nextsound_search_history');
    }
  };
};