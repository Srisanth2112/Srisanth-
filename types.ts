
import { GroundingChunk } from "@google/genai";

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imagePreview?: string;
  groundingChunks?: GroundingChunk[];
}

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    timestamp: number;
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
