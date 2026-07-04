import { GoogleGenAI, Type } from '@google/genai';

// GoogleGenAI's constructor throws synchronously if apiKey is missing
// ("An API Key must be set when running in a browser") — instantiating it
// at module scope would crash every import of this file, not just AI calls,
// whenever VITE_GEMINI_API_KEY isn't configured. Build it lazily instead so
// a missing key only degrades the AI features, not the whole app.
let aiClient = null;
function getClient() {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

export async function generateCoverImage(openingName, aspectRatio = '1:1') {
  const ai = getClient();
  if (!ai) {
    console.warn('generateCoverImage: VITE_GEMINI_API_KEY not configured');
    return null;
  }
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: `A beautiful, dramatic, high-quality chess-themed illustration representing the chess opening: ${openingName}. Cinematic lighting, elegant, professional.`,
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio },
    });
    if (response.generatedImages?.length > 0) {
      return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
    }
    throw new Error('No image generated');
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

export async function getAICoachTip(openingName, currentMoves) {
  const ai = getClient();
  if (!ai) return 'Focus on controlling the center and developing your pieces.';
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `You are an expert chess coach. The user is practicing the ${openingName} opening. The moves played so far are: ${currentMoves.join(', ')}. Give a single, short, punchy 1-sentence tip about the current position or the next move.`,
    });
    return response.text || 'Keep up the good work!';
  } catch (error) {
    console.error('Error getting AI coach tip:', error);
    return 'Focus on controlling the center and developing your pieces.';
  }
}

export async function sendMessageToCaruana(chatHistory, message, fenToAnalyze, openingName) {
  const ai = getClient();
  if (!ai) return '*Sigh* I seem to be having connection issues. Let me look at the board again in a moment.';
  try {
    const contents = [
      ...chatHistory,
      { role: 'user', parts: [{ text: `[System Context: The user is currently playing the ${openingName}. The current board FEN is ${fenToAnalyze}.]\n\nUser Message: ${message}` }] }
    ];
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        systemInstruction: "You are Grandmaster Fabiano Caruana. You are analyzing the user's chess position. Keep your answers concise, analytical, objective, and somewhat dry but encouraging. Always stay in character as Fabiano. Format your response cleanly in Markdown. Focus on concrete variations and positional understanding.",
      },
    });
    return response.text || '';
  } catch (error) {
    console.error('Error in Fabiano AI Chat:', error);
    return '*Sigh* I seem to be having connection issues. Let me look at the board again in a moment.';
  }
}

export async function getDeepAnalysis(openingName, moves) {
  const ai = getClient();
  if (!ai) return 'Analysis unavailable — VITE_GEMINI_API_KEY not configured.';
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `You are a Grandmaster chess theoretician. Provide a deep, insightful analysis of the ${openingName} opening, specifically the line: ${moves.join(', ')}. Explain the core ideas, typical plans for both sides, and common pitfalls. Format the response in clean Markdown.`,
    });
    return response.text || 'Analysis unavailable.';
  } catch (error) {
    console.error('Error getting deep analysis:', error);
    return 'Analysis failed to generate.';
  }
}

export async function analyzePgnAndExpandRepertoire(pgn) {
  const ai = getClient();
  if (!ai) {
    console.warn('analyzePgnAndExpandRepertoire: VITE_GEMINI_API_KEY not configured');
    return null;
  }
  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `You are a Grandmaster chess coach. Analyze this game PGN and find where the opponent deviated from standard repertoire lines within the first 12 moves. Determine the best continuation against this deviation. Return JSON only with: name (string), description (string), moves (array of SAN strings, exactly 12 moves / 24 plies from move 1).\n\nPGN:\n${pgn}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              moves: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["name", "description", "moves"]
          }
        }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 20000))
    ]);
    if (response?.text) {
      let text = response.text.trim().replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
      return JSON.parse(text);
    }
    return null;
  } catch (error) {
    console.error('Error analyzing PGN:', error);
    return null;
  }
}
