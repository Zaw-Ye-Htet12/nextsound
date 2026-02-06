const PROXY_URL = `${import.meta.env.VITE_PROXY_SERVER_URL || 'http://localhost:3001'}/api/chat`;

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export class GeminiService {

    constructor() { }

    /**
     * Sends a chat message to Gemini via the backend proxy.
     */
    async chat(history: ChatMessage[], newMessage: string): Promise<string> {
        try {
            // Construct the payload including history and the new message
            const contents = [
                ...history,
                {
                    role: 'user',
                    parts: [{ text: newMessage }]
                }
            ];

            const response = await fetch(PROXY_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: contents,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Gemini Proxy Error:", errorData);

                // Handle rate limiting specifically
                if (response.status === 429) {
                    const retrySeconds = errorData.retryAfterSeconds;
                    return `⏳ Whoa, slow down! You're chatting too fast. Please wait **${retrySeconds} seconds** before sending another message. 🎵`;
                }

                throw new Error(`Gemini Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                console.warn("Gemini API returned no text:", data);
                return "I'm not sure what to say.";
            }

            return text;

        } catch (error) {
            console.error("Failed to call Gemini Proxy:", error);
            return "😔 I'm having trouble connecting to the musicverse right now. Please try again in a moment!";
        }
    }
}

export const geminiService = new GeminiService();
