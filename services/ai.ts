
import { GoogleGenAI, Type } from "@google/genai";

// Initialize with the standard GenAI constructor using only process.env.API_KEY as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AuditResult {
  foundUtrs: string[];
  matches: string[]; // Order IDs that matched
  summary: string;
}

export const AIService = {
  /**
   * Scans raw text (like Bank SMS logs or App History) to find UTR matches
   */
  auditTransactions: async (rawLogs: string, pendingUtrs: {utr: string, orderId: string}[]): Promise<AuditResult> => {
    const prompt = `
      You are a specialized Transaction Auditor for Krishna Valo Store. 
      I will provide you with a raw text dump from a bank's transaction history or SMS logs. 
      I will also provide a list of pending UTR numbers we are looking for.

      TASK:
      1. Extract all 12-digit UTR numbers or transaction references from the logs.
      2. Compare them against the "Pending List".
      3. Return a JSON object identifying which ones matched.

      PENDING LIST:
      ${JSON.stringify(pendingUtrs)}

      RAW BANK LOGS:
      ${rawLogs}

      Return exactly this JSON structure:
      {
        "foundUtrs": ["list of all 12-digit numbers found"],
        "matchedOrderIds": ["list of orderIds where the UTR was found in logs"],
        "summary": "A brief 1-sentence summary of what you found"
      }
    `;

    try {
      // Use the correct model name and directly call generateContent.
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

      // Extract text from the property .text (not a method).
      const result = JSON.parse(response.text || '{}');
      return {
        foundUtrs: result.foundUtrs || [],
        matches: result.matchedOrderIds || [],
        summary: result.summary || "Scan complete."
      };
    } catch (error) {
      console.error("AI Audit Error:", error);
      throw new Error("Failed to process logs with AI.");
    }
  }
};
