
import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
import { AspectRatio } from '../types';
import { MODELS } from '../constants';

const getGeminiAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTextStream = async (
  chatInstance: Chat,
  prompt: string,
  useSearch: boolean,
  useMaps: boolean,
  location?: { latitude: number; longitude: number },
) => {
  const tools: any[] = [];
  if (useSearch) tools.push({ googleSearch: {} });
  if (useMaps) tools.push({ googleMaps: {} });
  
  const toolConfig: any = {};
  if (useMaps && location) {
    toolConfig.retrievalConfig = { latLng: location };
  }

  const requestPayload: any = { message: prompt };

  if (tools.length > 0) {
    requestPayload.tools = tools;
  }
  if (Object.keys(toolConfig).length > 0) {
      requestPayload.toolConfig = toolConfig;
  }

  // FIX: The sendMessageStream method expects tools and toolConfig as top-level properties,
  // not nested within a 'config' object.
  return chatInstance.sendMessageStream(requestPayload);
};

export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
  const ai = getGeminiAI();
  const imagePart = {
    inlineData: {
      mimeType,
      data: imageBase64,
    },
  };
  const textPart = { text: prompt };

  const response = await ai.models.generateContent({
    model: MODELS.flash,
    contents: { parts: [imagePart, textPart] },
  });

  return response.text;
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  const ai = getGeminiAI();
  const response = await ai.models.generateImages({
    model: MODELS.imagen,
    prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/png',
      aspectRatio,
    },
  });

  if (response.generatedImages && response.generatedImages.length > 0) {
    return response.generatedImages[0].image.imageBytes;
  }
  throw new Error("Image generation failed.");
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const ai = getGeminiAI();
    const response = await ai.models.generateContent({
      model: MODELS.flashImage,
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error("Image editing failed.");
};

export const enhancePrompt = async (prompt: string): Promise<string> => {
    const ai = getGeminiAI();
    const fullPrompt = `You are an expert prompt engineer for a text-to-image model. Rewrite the following simple user idea into a rich, detailed, and visually descriptive prompt. Focus on adding sensory details, composition, lighting, and style.

    User Idea: "${prompt}"
    
    Enhanced Prompt:`;

    const response = await ai.models.generateContent({
      model: MODELS.flashLite,
      contents: fullPrompt
    });
    
    return response.text;
};

export const analyzeQueryForTools = async (query: string): Promise<{ useSearch: boolean; useMaps: boolean }> => {
    if (query.trim().length < 5) return { useSearch: false, useMaps: false };
    const ai = getGeminiAI();
    const prompt = `Analyze the user's query. Your goal is to determine if external tools are *necessary*.
    - Suggest Google Search (useSearch: true) ONLY for queries about very recent events (today/yesterday), real-time data (stock prices, weather), or specific, obscure facts that a large language model might not know. Do NOT suggest it for general knowledge, creative tasks, or summarization.
    - Suggest Google Maps (useMaps: true) ONLY for queries that explicitly ask for directions, locations, or "near me" information.
    
    Query: "${query}"

    Respond with ONLY a JSON object with two boolean keys: "useSearch" and "useMaps".`;

    const response = await ai.models.generateContent({
        model: MODELS.flashLite,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    useSearch: { type: Type.BOOLEAN },
                    useMaps: { type: Type.BOOLEAN },
                },
            },
        },
    });

    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse tool analysis response:", e);
        return { useSearch: false, useMaps: false };
    }
};
