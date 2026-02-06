import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { chatService, Message } from '@/services/ChatService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Loader2, Bot, ChevronUp } from 'lucide-react';
import { cn } from '@/utils';

export function ChatWidget() {
    const { user } = useAuth();

    const QUICK_ACTIONS = [
        { label: "Trending 📈", text: "Who are the trending artists right now?" },
        { label: "Surprise Me 🎲", text: "Recommend me a random song" },
        { label: "New Pop 🎵", text: "What are the new pop releases?" },
        { label: "Top Charts 🏆", text: "Show me the top charts" }
    ];

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Load history when widget opens or user changes
    useEffect(() => {
        if (user && isOpen) {
            // Load cache first for instant display
            const cached = chatService.getHistory(user.id);
            setMessages(cached);
            scrollToBottom();

            // Then sync from Supabase for fresh data
            chatService.syncFromSupabase(user.id).then(async (synced) => {
                setMessages(synced);
                scrollToBottom();

                // Check if there are older messages
                if (synced.length > 0) {
                    const hasOlder = await chatService.hasMoreMessages(user.id, synced[0].timestamp);
                    setHasMore(hasOlder);
                }
            });
        }
    }, [user, isOpen]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const loadOlderMessages = async () => {
        if (!user || loadingMore || messages.length === 0) return;

        setLoadingMore(true);
        const oldestMessage = messages[0];

        try {
            const older = await chatService.loadOlderMessages(user.id, oldestMessage.timestamp);
            if (older.length > 0) {
                setMessages(prev => [...older, ...prev]);

                // Check if there are even more
                const hasOlder = await chatService.hasMoreMessages(user.id, older[0].timestamp);
                setHasMore(hasOlder);
            } else {
                setHasMore(false);
            }
        } finally {
            setLoadingMore(false);
        }
    };

    const onSendMessage = async (text: string) => {
        if (!user || !text.trim() || isLoading) return;

        setIsLoading(true);

        try {
            // 1. Add User Message (Synchronous update to cache)
            chatService.addUserMessage(user.id, text);
            // Verify and update UI immediately
            const history = chatService.getHistory(user.id);
            setMessages(history);
            scrollToBottom();

            // Extract user name
            const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0];

            // 2. Generate AI Response (Async)
            await chatService.generateAIResponse(user.id, text, userName);

            // 3. Final Update
            setMessages(chatService.getHistory(user.id));
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setIsLoading(false);
            scrollToBottom();
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSendMessage(inputValue);
        setInputValue("");
    };

    // Auth Guard: If no user, do not render anything
    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-[380px] h-[600px] flex flex-col overflow-hidden rounded-2xl border border-white/20 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 bg-black/40 backdrop-blur-xl">

                    {/* Header */}
                    <div className="p-4 flex items-center justify-between bg-red-600 border-b border-white/10 text-white shadow-lg shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm leading-tight">NextSound AI</h3>
                                <p className="text-[10px] text-white/80 font-medium">Always here to help</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-white/20 text-white rounded-full transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Messages Area */}
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="flex justify-center py-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={loadOlderMessages}
                                    disabled={loadingMore}
                                    className="text-xs text-white/50 hover:text-white hover:bg-white/5 rounded-full px-4 h-7"
                                >
                                    {loadingMore ? (
                                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                    ) : (
                                        <ChevronUp className="w-3 h-3 mr-1.5" />
                                    )}
                                    Load older messages
                                </Button>
                            </div>
                        )}

                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/60 space-y-4">
                                <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/5">
                                    <Bot className="w-8 h-8 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-white">Hello, {user.user_metadata?.first_name || 'Music Lover'}! 👋</p>
                                    <p className="text-sm text-white/50">I can help you find songs, artists, and more.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 w-full mt-2">
                                    {QUICK_ACTIONS.map((action) => (
                                        <button
                                            key={action.label}
                                            onClick={() => onSendMessage(action.text)}
                                            className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 py-2 px-3 rounded-lg transition-colors text-left truncate"
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-full animate-in slide-in-from-bottom-2 fade-in duration-300 fill-mode-backwards",
                                    msg.role === 'user' ? "justify-end" : "justify-start"
                                )}
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className={cn(
                                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm backdrop-blur-sm border",
                                    msg.role === 'user'
                                        ? "bg-red-600 text-white border-white/10 rounded-tr-sm"
                                        : "bg-zinc-800 text-zinc-100 border-white/5 rounded-tl-sm"
                                )}>
                                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start animate-in fade-in duration-300">
                                <div className="bg-zinc-800 border border-white/5 text-zinc-400 rounded-2xl rounded-tl-sm px-4 py-4 flex items-center gap-1 backdrop-blur-sm">
                                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-gradient-to-t from-black/60 to-transparent shrink-0">
                        <form onSubmit={handleFormSubmit} className="relative flex items-center gap-2">
                            <div className="relative flex-1 group">
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value.slice(0, 500))}
                                    placeholder="Ask about music..."
                                    disabled={isLoading}
                                    className="pr-12 pl-4 py-6 rounded-full bg-white/10 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-red-500/50 focus-visible:ring-offset-0 focus-visible:border-red-400/50 backdrop-blur-xl transition-all shadow-inner"
                                    maxLength={500}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={isLoading || inputValue.trim().length < 2}
                                        className={cn(
                                            "h-9 w-9 rounded-full transition-all duration-300",
                                            inputValue.trim().length >= 2
                                                ? "bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20"
                                                : "bg-transparent text-white/20 hover:bg-white/5"
                                        )}
                                    >
                                        <Send className="w-4 h-4 ml-0.5" />
                                    </Button>
                                </div>
                            </div>
                        </form>
                        <div className="px-4 mt-2 flex justify-between text-[10px] text-white/30 font-medium">
                            <span>AI can make mistakes.</span>
                            <span className={inputValue.length > 450 ? "text-red-400" : ""}>
                                {inputValue.length}/500
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Toggle Button */}
            <Button
                size="lg"
                className={cn(
                    "rounded-full h-16 w-16 shadow-2xl transition-all duration-500 ease-out hover:scale-110 active:scale-95",
                    "bg-red-600 border border-white/20 hover:bg-red-700",
                    isOpen ? "rotate-90 opacity-0 pointer-events-none scale-50" : "opacity-100 scale-100"
                )}
                onClick={() => setIsOpen(true)}
            >
                <div className="relative">
                    <MessageCircle className="w-8 h-8 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white blur-xl opacity-30 animate-pulse"></div>
                </div>

                {/* Notification Badge (Optional - can be hooked up to state later) */}
                {/* <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-background rounded-full"></span> */}
            </Button>
        </div>
    );
}
