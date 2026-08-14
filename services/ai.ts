
import { GoogleGenAI, Type } from "@google/genai";

export interface AuditResult {
  foundUtrs: string[];
  matches: string[]; 
  summary: string;
}

export interface MarketingContent {
  tiktokScript: string;
  visualPrompt: string;
}

export const AIService = {
  auditTransactions: async (rawLogs: string, pendingUtrs: {utr: string, orderId: string}[]): Promise<AuditResult> => {
    // Robust API key retrieval across Vite browser runtime and Node environments
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.API_KEY || (typeof process !== 'undefined' ? process.env?.API_KEY : '') || '';
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      You are a specialized Transaction Auditor for Krishna Valo Store. 
      Analyze the provided bank history/SMS logs.
      
      PENDING LIST: ${JSON.stringify(pendingUtrs)}
      RAW LOGS: ${rawLogs}

      TASK:
      1. Find all 12-digit UTR numbers in logs.
      2. Match them against the pending list.
      3. Return JSON with foundUtrs, matchedOrderIds, and summary.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              foundUtrs: { type: Type.ARRAY, items: { type: Type.STRING } },
              matchedOrderIds: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING }
            },
            required: ["foundUtrs", "matchedOrderIds", "summary"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      return {
        foundUtrs: result.foundUtrs || [],
        matches: result.matchedOrderIds || [],
        summary: result.summary || "Audit complete."
      };
    } catch (error) {
      console.error("AI Audit Error:", error);
      throw new Error("AI Processing failed.");
    }
  },

  generateMarketingContent: async (productName: string, details: string): Promise<MarketingContent> => {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.API_KEY || (typeof process !== 'undefined' ? process.env?.API_KEY : '') || '';
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Product Name: ${productName}\nKey Details: ${details}`;
    const systemInstruction = "You are an expert social media marketer. When given a product name, write a 15-second TikTok script and a specific visual prompt for a video generator.";

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tiktokScript: { type: Type.STRING },
              visualPrompt: { type: Type.STRING }
            },
            required: ["tiktokScript", "visualPrompt"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      return {
        tiktokScript: result.tiktokScript || "Failed to generate script.",
        visualPrompt: result.visualPrompt || "Failed to generate visual prompt."
      };
    } catch (error) {
      console.error("AI Marketing Error:", error);
      throw new Error("AI Processing failed.");
    }
  }
};
