
import { GoogleGenAI, Type } from "@google/genai";

export interface AuditResult {
  foundUtrs: string[];
  matches: string[]; 
  summary: string;
}

export const AIService = {
  auditTransactions: async (rawLogs: string, pendingUtrs: {utr: string, orderId: string}[]): Promise<AuditResult> => {
    // Guidelines: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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

      // Guidelines: Extracting text from response.text property
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
  }
};
