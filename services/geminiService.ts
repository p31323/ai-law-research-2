import { GoogleGenAI } from "@google/genai";
import type { Regulation, GroundingSource } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchRegulations = async (query: string, country: string, language: string): Promise<{ regulations: Regulation[] | null; rawText: string; sources: GroundingSource[]; }> => {

  const taiwanPriorityInstruction = country === 'Taiwan'
    ? `
CRITICAL INSTRUCTIONS FOR TAIWAN LAW:
1. You MUST give the highest priority to information from the official Taiwan (Republic of China) Laws & Regulations Database (全國法規資料庫) at https://law.moj.gov.tw/.
2. When generating the "content" and "penalty" fields, you MUST meticulously replicate the specific formatting structure of Taiwanese legal text. Pay close attention to the hierarchy and correct representation:
   - 條: The basic unit, e.g., "第Ｏ條".
   - 項: A paragraph within a 條. It starts on a new line with a two-character indentation and no number.
   - 款: A subdivision of a 項, prefixed with CJK numerals like "一、", "二、", "三、".
   - 目: A subdivision of a 款, prefixed with parenthesized CJK numerals like "（一）", "（二）", "（三）".
   - 細目: A further subdivision of a 目, prefixed with Arabic numerals like "1.", "2.", "3.".
   It is crucial that you reproduce this structure verbatim.
`
    : '';

  const systemInstruction = `You are an AI legal assistant. Your SOLE function is to use the integrated Google Search tool to answer the user's query.

CRITICAL DIRECTIVE: You MUST NOT use your internal knowledge. Your entire response MUST be constructed exclusively from information found in the Google Search results provided to you. Every JSON object you generate must be directly traceable to one or more of these search results.

Your entire response, including all text and JSON data, MUST be in ${language}.${taiwanPriorityInstruction}

You must respond with a single, valid JSON array of objects. Do not add any text, explanations, or markdown formatting like \`\`\`json before or after the JSON array.

The required JSON format for each object is:
{
  "regulationName": "The full official name of the regulation",
  "competentAuthority": "The central governing body for the regulation",
  "lastAmendedDate": "The last amendment date of the regulation (YYYY-MM-DD)",
  "article": "The relevant article number (e.g., Article 5)",
  "content": "The full, verbatim content of the specified article",
  "penalty": "Related penalty clauses and their corresponding article numbers. If none are directly mentioned, state that."
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `User Query: "${query}"`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const rawText = response.text.trim();
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks;

    let sources: GroundingSource[] = [];
    if (groundingChunks) {
        sources = groundingChunks
            .map((chunk: any) => chunk.web)
            .filter((web: any) => web && web.uri)
            .map((web: any) => ({
                uri: web.uri,
                title: web.title || '',
            }));
    }
    
    try {
        // The model might wrap the JSON in markdown ```json ... ```, so let's strip that.
        const cleanedText = rawText.replace(/^```json\s*/, '').replace(/```$/, '');
        const jsonStartIndex = cleanedText.indexOf('[');
        const jsonEndIndex = cleanedText.lastIndexOf(']');
        
        if (jsonStartIndex === -1 || jsonEndIndex === -1) {
             console.warn("Could not find JSON array in the response.");
             return { regulations: null, rawText, sources };
        }
        
        const jsonString = cleanedText.substring(jsonStartIndex, jsonEndIndex + 1);
        const regulations: Regulation[] = JSON.parse(jsonString);
        return { regulations, rawText, sources };
    } catch (e) {
        console.warn("Failed to parse Gemini response as JSON.", e);
        return { regulations: null, rawText, sources };
    }

  } catch (error) {
    console.error("Error fetching from Gemini API:", error);
    throw new Error("與 AI 服務通訊時發生錯誤。");
  }
};

/**
 * Translates text to a target language using the Gemini API.
 * @param textToTranslate The text to be translated.
 * @param targetLanguage The language to translate the text into.
 * @returns The translated text.
 */
export const translateText = async (textToTranslate: string, targetLanguage: string): Promise<string> => {
    if (!textToTranslate) {
        return "";
    }
    const prompt = `Translate the following text to ${targetLanguage}. 
Do not add any extra explanations, introductory phrases, or markdown formatting. 
Only return the translated text directly.

Text to translate: "${textToTranslate}"`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error translating text with Gemini API:", error);
        throw new Error("翻譯時發生錯誤。");
    }
};