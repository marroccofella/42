import { GoogleGenAI } from '@google/genai';

if (!process.env.API_KEY) {
  throw new Error('API_KEY not set');
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface CaptionResult {
  platform: 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin';
  title?: string;
  description?: string;
  hashtags?: string[];
  caption?: string;
}

/**
 * Wrapper helper to ask Gemini for platform-specific copy.
 */
export async function generatePlatformCaptions(prompt: string, transcript: string, platform: CaptionResult['platform']): Promise<CaptionResult> {
  const fullPrompt = `You are an expert social-media growth hacker. Create ${platform} text for a video based on the provided prompt and transcript. Respond ONLY with a JSON object containing appropriate keys (title, description, caption, hashtags array).\n\nPROMPT: ${prompt}\n\nTRANSCRIPT:\n${transcript}`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-04-17',
    contents: fullPrompt,
    config: { responseMimeType: 'application/json', temperature: 0.7 }
  });
  const jsonStr = response.text?.trim() ?? '{}';
  try {
    return JSON.parse(jsonStr) as CaptionResult;
  } catch {
    console.error('CaptionService: Failed to parse AI JSON', jsonStr);
    return { platform } as CaptionResult;
  }
}
