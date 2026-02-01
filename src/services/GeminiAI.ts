import { GEMINI_API_KEY } from "@/utils/config";

interface RecommendedSong {
    title: string;
    artist: string;
    reason?: string;
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export class GeminiService {
    private apiKey: string;

    constructor() {
        this.apiKey = GEMINI_API_KEY || "";
    }

    async getRecommendations(userQuery: string): Promise<RecommendedSong[]> {
        console.log("GeminiService: Starting recommendation search", { query: userQuery, hasKey: !!this.apiKey });

        if (!this.apiKey) {
            console.error("GeminiService: API key is missing. Please check .env file and VITE_GEMINI_API_KEY");
            return [];
        }

        try {
            const prompt = `
        You are a music recommendation engine. 
        User Request: "${userQuery}"
        
        Task: Recommend 5 songs that match this request. 
        Output ONLY valid JSON array with objects containing 'title', 'artist' and a short 'reason' (max 5 words).
        Example: [{"title": "Song", "artist": "Artist", "reason": "Matches mood"}]
        Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
      `;

            const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Gemini API request failed");
            }

            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!textResponse) {
                return [];
            }

            // Clean up potentially messy response
            // Models sometimes add markdown or text before/after the JSON
            const jsonMatch = textResponse.match(/\[[\s\S]*\]/);

            if (!jsonMatch) {
                console.warn("GeminiService: No JSON array found in response:", textResponse);
                return [];
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error("Error fetching AI recommendations:", error);
            return [];
        }
    }
}

export const geminiService = new GeminiService();
