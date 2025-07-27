
import { GoogleGenAI } from '@google/genai';
import type { ScriptCue } from '../types';

// Default API key from environment
const defaultApiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Get the API key to use (user provided or default)
function getApiKey(): string {
    // Check for user-provided key in localStorage
    const userApiKey = localStorage.getItem('gemini_api_key');
    if (userApiKey && userApiKey.trim()) {
        return userApiKey.trim();
    }
    
    // Use environment variable
    if (!defaultApiKey) {
        throw new Error("No Gemini API key available. Please set VITE_GEMINI_API_KEY or provide your own key.");
    }
    
    return defaultApiKey;
}

// Validate API key format
function validateApiKey(key: string): boolean {
    // Basic validation: should start with AIzaSy and be reasonable length
    return key.startsWith('AIzaSy') && key.length >= 35 && key.length <= 45;
}

// Test API key by making a simple request
export async function testApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
        if (!validateApiKey(apiKey)) {
            return { valid: false, error: 'Invalid API key format. Should start with "AIzaSy"' };
        }
        
        const testAi = new GoogleGenAI({ apiKey });
        const model = "gemini-2.5-flash-preview-04-17";
        
        // Make a minimal test request
        const response = await testAi.models.generateContent({
            model: model,
            contents: "Say 'test' in JSON format: {\"response\": \"test\"}",
            config: {
                responseMimeType: "application/json",
                temperature: 0.1,
            },
        });
        
        if (response.text) {
            console.log('✅ API key validation successful');
            return { valid: true };
        } else {
            return { valid: false, error: 'No response from API' };
        }
    } catch (error) {
        console.error('❌ API key validation failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { valid: false, error: errorMessage };
    }
}

// Set user's custom API key
export function setUserApiKey(apiKey: string): void {
    if (apiKey && apiKey.trim()) {
        localStorage.setItem('gemini_api_key', apiKey.trim());
        console.log('🔑 User API key saved');
    } else {
        localStorage.removeItem('gemini_api_key');
        console.log('🔑 User API key removed, using default');
    }
}

// Get current API key info
export function getApiKeyInfo(): { source: 'user' | 'env'; key: string } {
    const userKey = localStorage.getItem('gemini_api_key');
    if (userKey && userKey.trim()) {
        return { source: 'user', key: userKey.trim() };
    }
    
    if (defaultApiKey) {
        return { source: 'env', key: defaultApiKey };
    }
    
    throw new Error('No API key available');
}

// Initialize AI with current API key
function getAI(): GoogleGenAI {
    const apiKey = getApiKey();
    return new GoogleGenAI({ apiKey });
}

const CUE_CATEGORIES = ['dialogue', 'audio', 'visual', 'effect'];
const CATEGORY_COLORS: Record<string, string> = {
    dialogue: '#34d399', // green
    audio: '#60a5fa',    // blue
    visual: '#f87171',   // red
    effect: '#facc15',   // yellow
};


// Enhanced JSON preprocessing to handle malformed AI responses
function preprocessJson(rawResponse: string): string {
    console.log(' Raw AI response:', rawResponse);
    
    let cleaned = rawResponse
        // Remove "Handler }" patterns
        .replace(/Handler\s*}/g, '}')
        // Remove standalone "Handler" on lines
        .replace(/^\s*Handler\s*$/gm, '')
        // Remove "Handler" between commas and at boundaries
        .replace(/,\s*Handler\s*,/g, ',')
        .replace(/,\s*Handler\s*]/g, ']')
        .replace(/\[\s*Handler\s*,/g, '[')
        // Clean up double commas and malformed brackets
        .replace(/,,+/g, ',')
        .replace(/,\s*]/g, ']')
        .replace(/\[\s*,/g, '[')
        .trim();
    
    // Extract JSON boundaries
    const startIndex = cleaned.indexOf('[');
    const endIndex = cleaned.lastIndexOf(']');
    
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        cleaned = cleaned.substring(startIndex, endIndex + 1);
    }
    
    console.log(' Cleaned JSON:', cleaned);
    return cleaned;
}

function parseAndValidateCues(jsonStr: string, duration: number): ScriptCue[] {
    const cleanedJson = preprocessJson(jsonStr);
    
    let parsedData: any;
    try {
        parsedData = JSON.parse(cleanedJson);
        console.log(' Successfully parsed JSON:', parsedData);
    } catch (e) {
        console.error(' Failed to parse JSON after cleaning:', cleanedJson);
        console.error('Parse error:', e);
        throw new Error(`AI returned invalid JSON format. Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
    
    if (!Array.isArray(parsedData)) {
        console.error(' AI response is not an array:', typeof parsedData);
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
        } else {
            console.warn(` Skipping invalid cue at index ${index}:`, item);
        }
    });

    console.log(` Validated ${validatedCues.length} cues from ${parsedData.length} items`);
    return validatedCues;
}

// Sort cues by time
function sortCues(cues: ScriptCue[]): ScriptCue[] {
    return cues.sort((a, b) => a.time - b.time);
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
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: model,
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            temperature: 0.7,
        },
    });

    let jsonStr = (response.text?.trim() ?? "");
    const fenceRegex = /^```(?:\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
        jsonStr = match[1].trim();
    }

    const cues = parseAndValidateCues(jsonStr, duration);
    return sortCues(cues);

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the AI.");
  }
}

// Retry wrapper for generateScriptCues with exponential backoff
export async function generateScriptCuesWithRetry(
  prompt: string, 
  duration: number, 
  maxRetries: number = 3
): Promise<ScriptCue[]> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 AI generation attempt ${attempt}/${maxRetries}`);
      return await generateScriptCues(prompt, duration);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`⚠️ Attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to generate script cues after ${maxRetries} attempts. Last error: ${lastError!.message}`);
}
