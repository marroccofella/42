
import { GoogleGenAI } from '@google/genai';
import type { ScriptCue } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Please set it in your environment.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CUE_CATEGORIES = ['dialogue', 'audio', 'visual', 'effect'];
const CATEGORY_COLORS: Record<string, string> = {
    dialogue: '#34d399', // green
    audio: '#60a5fa',    // blue
    visual: '#f87171',   // red
    effect: '#facc15',   // yellow
};


function parseAndValidateCues(jsonStr: string, duration: number): ScriptCue[] {
    let parsedData: any;
    try {
        parsedData = JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse JSON:", jsonStr);
        throw new Error("AI returned invalid JSON format.");
    }
    
    if (!Array.isArray(parsedData)) {
        throw new Error("AI response is not a JSON array.");
    }

    const validatedCues: ScriptCue[] = [];
    parsedData.forEach((item: any, index: number) => {
        if (typeof item === 'object' && item !== null && typeof item.time === 'number' && typeof item.text === 'string') {
            const category = typeof item.category === 'string' && CUE_CATEGORIES.includes(item.category) ? item.category : 'visual';
            
            // Ensure time is within video duration
            const time = Math.max(0, Math.min(item.time, duration));

            validatedCues.push({
                id: `cue-${Date.now()}-${index}`,
                time: time,
                text: item.text,
                category: category,
                speaker: item.speaker,
                color: item.color || CATEGORY_COLORS[category] || '#ffffff',
            });
        }
    });
    
    // Sort cues by time
    return validatedCues.sort((a, b) => a.time - b.time);
}


export async function generateScriptCues(prompt: string, duration: number): Promise<ScriptCue[]> {
  const model = "gemini-2.5-flash-preview-04-17";
  const fullPrompt = `
    You are an expert film editor and scriptwriter. Your task is to generate a list of script cues for a video based on a user's idea.

    **Video Details:**
    - **Idea:** "${prompt}"
    - **Total Duration:** ${duration.toFixed(2)} seconds

    **Instructions:**
    1.  Create a JSON array of script cue objects.
    2.  Each cue object must have the following properties:
        - \`time\`: A number representing the time in seconds where the cue should appear. This must be between 0 and ${duration.toFixed(2)}.
        - \`text\`: A string describing the cue (e.g., a line of dialogue, a sound effect description, a visual action).
        - \`category\`: A string representing the type of cue. Must be one of: "dialogue", "audio", "visual", "effect".
        - \`color\`: A hex color code string for the cue. Use these colors based on category: dialogue: '#34d399', audio: '#60a5fa', visual: '#f87171', effect: '#facc15'.
    3.  Distribute the cues logically and evenly throughout the video's duration.
    4.  Ensure the output is ONLY the raw JSON array, without any surrounding text, explanations, or markdown fences.

    **Example Output:**
    [
      { "time": 5.5, "text": "Dramatic music swells.", "category": "audio", "color": "#60a5fa" },
      { "time": 12.0, "text": "Quick cut to a wide shot of the city.", "category": "visual", "color": "#f87171" },
      { "time": 25.2, "text": "SPEAKER 1: 'We don't have much time.'", "category": "dialogue", "color": "#34d399" }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            temperature: 0.7,
        },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(?:\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
        jsonStr = match[1].trim();
    }

    return parseAndValidateCues(jsonStr, duration);

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the AI.");
  }
}
