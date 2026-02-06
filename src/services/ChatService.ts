import { geminiService, ChatMessage } from "./GeminiAI";
import { store } from "@/store";
import { deezerApi } from "./DeezerAPI";
import { SYSTEM_PROMPT_TEMPLATE } from "@/data/appKnowledge";
import { supabase } from "./supabase";

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    isLoading?: boolean;
}

interface DbMessage {
    id: string;
    user_id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export class ChatService {
    private cache: Record<string, Message[]> = {};
    private readonly CACHE_KEY = 'nextsound_chat_cache';
    private syncInProgress = false;

    constructor() {
        this.loadCache();
    }

    // ============================================
    // LOCAL CACHE (localStorage)
    // ============================================

    private loadCache() {
        try {
            const data = localStorage.getItem(this.CACHE_KEY);
            if (data) {
                this.cache = JSON.parse(data);
            }
        } catch (e) {
            console.error("Failed to load chat cache", e);
        }
    }

    private saveCache() {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
        } catch (e) {
            console.error("Failed to save chat cache", e);
        }
    }

    // ============================================
    // SUPABASE SYNC
    // ============================================

    private readonly MAX_MESSAGES = 50; // Limit messages per user

    /**
     * Load messages from Supabase with pagination
     * @param userId - The user ID
     * @param page - Page number (0-indexed), defaults to 0 (most recent)
     * @param pageSize - Number of messages per page, defaults to MAX_MESSAGES
     */
    async syncFromSupabase(userId: string, page: number = 0, pageSize: number = this.MAX_MESSAGES): Promise<Message[]> {
        try {
            const offset = page * pageSize;

            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false }) // Most recent first
                .range(offset, offset + pageSize - 1);     // Pagination

            if (error) {
                console.error("Failed to fetch from Supabase:", error);
                return this.cache[userId] || [];
            }

            // Convert DB format to Message format and reverse for chronological order
            const messages: Message[] = (data || [])
                .map((m: DbMessage) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    timestamp: new Date(m.created_at).getTime()
                }))
                .reverse(); // Reverse to show oldest first in UI

            // Update cache (only for page 0)
            if (page === 0) {
                // Merge strategy: Keep existing messages that are NOT in the fetched list (to preserve unsaved local messages)
                // Since we fetched the LATEST 50 messages, any message in cache simpler than that should probably be kept if it has a newer timestamp?
                // Actually, simplest is to deduplicate by ID.
                const currentCache = this.cache[userId] || [];

                // Create map of ID -> Message from fetched data
                const fetchedMap = new Map(messages.map(m => [m.id, m]));

                // Keep local messages that are NOT in the fetched set (e.g. pending ones)
                // A pending message has an ID usually, but if it has same ID as remote, remote wins (synced)
                // If it's a temp ID or a new UUID not yet synced, we keep it.
                // However, we normally generate UUIDs locally.

                // Let's just blindly merge uniqueness by ID
                const mergedMap = new Map();
                // Add fetched first
                messages.forEach(m => mergedMap.set(m.id, m));
                // Add current cache if not present (preserve unsaved)
                currentCache.forEach(m => {
                    if (!mergedMap.has(m.id)) {
                        mergedMap.set(m.id, m);
                    }
                });

                // Convert back to array and sort by timestamp
                const mergedArray = Array.from(mergedMap.values()) as Message[];
                mergedArray.sort((a, b) => a.timestamp - b.timestamp);

                this.cache[userId] = mergedArray;
                this.saveCache();

                return mergedArray;
            }

            return messages;
        } catch (e) {
            console.error("Supabase sync error:", e);
            return this.cache[userId] || [];
        }
    }

    /**
     * Load older messages for pagination (infinite scroll)
     */
    async loadOlderMessages(userId: string, beforeTimestamp: number): Promise<Message[]> {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('user_id', userId)
                .lt('created_at', new Date(beforeTimestamp).toISOString())
                .order('created_at', { ascending: false })
                .limit(this.MAX_MESSAGES);

            if (error) {
                console.error("Failed to load older messages:", error);
                return [];
            }

            return (data || [])
                .map((m: DbMessage) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    timestamp: new Date(m.created_at).getTime()
                }))
                .reverse();
        } catch (e) {
            console.error("Load older messages error:", e);
            return [];
        }
    }

    /**
     * Check if there are more messages to load
     */
    async hasMoreMessages(userId: string, beforeTimestamp: number): Promise<boolean> {
        try {
            const { count, error } = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .lt('created_at', new Date(beforeTimestamp).toISOString());

            return !error && (count || 0) > 0;
        } catch {
            return false;
        }
    }

    /**
     * Save a message to Supabase (async, doesn't block UI)
     */
    private async saveToSupabase(userId: string, message: Message): Promise<void> {
        try {
            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    user_id: userId,
                    role: message.role,
                    content: message.content
                });

            if (error) {
                console.error("Failed to save to Supabase:", error);
            }
        } catch (e) {
            console.error("Supabase save error:", e);
        }
    }

    // ============================================
    // PUBLIC API
    // ============================================

    /**
     * Get chat history - returns cache immediately, syncs in background
     */
    getHistory(userId: string): Message[] {
        // Return cache immediately for fast UI
        return this.cache[userId] || [];
    }

    /**
     * Load history with Supabase sync
     */
    async loadHistory(userId: string): Promise<Message[]> {
        // First return cache
        const cached = this.cache[userId] || [];

        // Then sync from Supabase in background
        if (!this.syncInProgress) {
            this.syncInProgress = true;
            this.syncFromSupabase(userId).finally(() => {
                this.syncInProgress = false;
            });
        }

        return cached;
    }

    /**
     * Clear all chat history for a user
     */
    async clearHistory(userId: string): Promise<void> {
        // Clear cache
        this.cache[userId] = [];
        this.saveCache();

        // Clear from Supabase
        try {
            const { error } = await supabase
                .from('chat_messages')
                .delete()
                .eq('user_id', userId);

            if (error) {
                console.error("Failed to clear Supabase history:", error);
            }
        } catch (e) {
            console.error("Supabase clear error:", e);
        }
    }

    /**
     * Step 1: Add user message to local cache and start background sync
     */
    addUserMessage(userId: string, text: string): Message {
        if (!this.cache[userId]) {
            this.cache[userId] = [];
        }

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: text,
            timestamp: Date.now()
        };

        this.cache[userId].push(userMsg);
        this.saveCache();

        // Background save
        this.saveToSupabase(userId, userMsg);

        return userMsg;
    }

    /**
     * Step 2: Generate AI response based on current history
     */
    async generateAIResponse(userId: string, userInput: string, userName?: string): Promise<Message> {
        // Prepare context
        const history = this.cache[userId] || [];

        // Inject user name into system prompt if available
        const systemPrompt = userName
            ? `${SYSTEM_PROMPT_TEMPLATE}\n\nUSER INFORMATION:\nThe user's name is "${userName}". Address them by name occasionally.`
            : SYSTEM_PROMPT_TEMPLATE;

        // Build context messages for Gemini (excluding the last one if it's the duplicate of userInput? No, history includes it)
        // Wait, history HAS the user input we just added.
        // We need to pass that to Gemini logic properly.
        // Actually, geminiService.chat takes (history, newMessage).
        // If we treat the history as "everything up to now", then 'newMessage' arg is redundant or we should pass empty string?
        // Let's refactor how we build context.

        // We want to send the FULL history including the latest user message as context, 
        // OR send history-1 as context and latest as prompt.

        // Filter out system messages if any (our implementation doesn't store them in cache usually)
        const validHistory = history.filter(m => m.role !== 'system');

        // The last message in history SHOULD be the user's input we just added.
        // Let's verify.
        const lastMsg = validHistory[validHistory.length - 1];
        const isLastMsgUser = lastMsg && lastMsg.role === 'user' && lastMsg.content === userInput;

        // If the cache sync failed or race condition, maybe it's not there? 
        // But we called addUserMessage synchronously.

        // Construct the array expected by Gemini
        const contextMessages: ChatMessage[] = [
            {
                role: 'user',
                parts: [{ text: `SYSTEM INSTRUCTIONS:\n${systemPrompt}` }]
            },
            {
                role: 'model',
                parts: [{ text: "Understood. I am NextSound AI, ready to help with music discovery and app questions." }]
            },
            ...validHistory.slice(0, isLastMsgUser ? -1 : undefined).map(m => ({
                role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
                parts: [{ text: m.content }]
            }))
        ];

        // Call Gemini
        let aiResponseText = await geminiService.chat(contextMessages, userInput);

        // Tool execution logic...
        if (aiResponseText.includes("`search_music") ||
            aiResponseText.includes("`get_artist_details") ||
            aiResponseText.includes("`get_top_tracks")) {

            const toolResult = await this.executeToolIfFound(aiResponseText);
            if (toolResult) {
                contextMessages.push({
                    role: 'model',
                    parts: [{ text: aiResponseText }]
                });

                contextMessages.push({
                    role: 'user',
                    parts: [{ text: `TOOL_OUTPUT: ${JSON.stringify(toolResult)}` }]
                });

                aiResponseText = await geminiService.chat(contextMessages, "Now provide the final answer to the user based on the tool output. Do not mention the tool or show JSON.");
            }
        }

        // Save AI Response
        const aiMsg: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: aiResponseText,
            timestamp: Date.now()
        };

        this.cache[userId].push(aiMsg);
        this.saveCache();
        this.saveToSupabase(userId, aiMsg);

        return aiMsg;
    }

    /**
     * @deprecated Use addUserMessage and generateAIResponse instead
     */
    async sendMessage(userId: string, text: string, userName?: string): Promise<Message> {
        this.addUserMessage(userId, text);
        return this.generateAIResponse(userId, text, userName);
    }

    private async executeToolIfFound(text: string): Promise<any | null> {
        try {
            // 1. search_music
            const searchMatch = text.match(/`search_music\((.*?)\)`/);
            if (searchMatch) {
                // Better argument parsing to handle commas in quotes
                const argsStr = searchMatch[1];
                // Simple parser that splits by comma but respects common quote patterns if needed
                // For now, simple split is consistent with valid tool usage examples
                const args = argsStr.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));

                const query = args[0];
                const type = args[1] || 'track'; // Default to track

                console.log(`Executing Tool: search_music with query="${query}" type="${type}"`);

                if (type === 'artist') {
                    const result = await store.dispatch(deezerApi.endpoints.searchArtists.initiate({ query, limit: 5 })).unwrap();
                    return result.results.map((a: any) => ({
                        name: a.name,
                        fans: a.overview,
                        link: a.external_urls.spotify
                    }));
                } else {
                    const result = await store.dispatch(deezerApi.endpoints.searchTracks.initiate({ query, limit: 5 })).unwrap();
                    return result.results.map((t: any) => ({
                        title: t.title,
                        artist: t.artist,
                        album: t.album,
                        link: t.external_urls.spotify
                    }));
                }
            }

            // 2. get_artist_details
            const artistMatch = text.match(/`get_artist_details\((.*?)\)`/);
            if (artistMatch) {
                const id = artistMatch[1].trim().replace(/['"]/g, '');
                console.log(`Executing Tool: get_artist_details with id="${id}"`);
                const result = await store.dispatch(deezerApi.endpoints.getArtistDetails.initiate(id)).unwrap();
                return { name: result.name, fans: result.overview };
            }

            // 3. get_top_tracks
            const topTracksMatch = text.match(/`get_top_tracks\((.*?)\)`/);
            if (topTracksMatch) {
                const id = topTracksMatch[1].trim().replace(/['"]/g, '');
                console.log(`Executing Tool: get_top_tracks with id="${id}"`);
                const result = await store.dispatch(deezerApi.endpoints.getArtistTopTracks.initiate({ id, limit: 5 })).unwrap();
                return result.results.map((t: any) => t.title);
            }

        } catch (e) {
            console.error("Tool Execution Failed", e);
            return { error: "Failed to fetch data." };
        }
        return null;
    }
}

export const chatService = new ChatService();
