import { GoogleGenAI } from "@google/genai";
import type { Regulation, GroundingSource, Policy } from '../types';
import type { SearchFilters, PolicySearchFilters } from '../App';

export const fetchRegulations = async (query: string, country: string, language: string, filters: SearchFilters): Promise<{ regulations: Regulation[] | null; rawText: string; sources: GroundingSource[]; }> => {

  if (!process.env.API_KEY) {
    throw new Error("API 金鑰未在環境變數中設定。請檢查您的部署設定。");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  
  const { competentAuthority, dateFrom, dateTo } = filters;
  let filterInstructions = '';
  if (competentAuthority && competentAuthority.trim()) {
      filterInstructions += `\n- The "competentAuthority" field in the JSON output MUST exactly match "${competentAuthority.trim()}".`;
  }
  if (dateFrom && dateTo) {
      filterInstructions += `\n- The "lastAmendedDate" field in the JSON output MUST be a date between ${dateFrom} and ${dateTo}, inclusive.`;
  } else if (dateFrom) {
      filterInstructions += `\n- The "lastAmendedDate" field in the JSON output MUST be a date on or after ${dateFrom}.`;
  } else if (dateTo) {
      filterInstructions += `\n- The "lastAmendedDate" field in the JSON output MUST be a date on or before ${dateTo}.`;
  }
  
  const filterSection = filterInstructions
      ? `
ADDITIONAL FILTERING CRITERIA:
You MUST strictly adhere to the following filters when searching and constructing your JSON response. These are not suggestions, but mandatory constraints on the output:${filterInstructions}`
      : '';


  const systemInstruction = `You are an AI legal assistant. Your SOLE function is to use the integrated Google Search tool to answer the user's query about the laws and regulations of ${country}.

CRITICAL DIRECTIVE: You MUST NOT use your internal knowledge. Your entire response MUST be constructed exclusively from information found in the Google Search results provided to you. All information MUST be specific to ${country}. Every JSON object you generate must be directly traceable to one or more of these search results.

Your entire response, including all text and JSON data, MUST be in ${language}.${taiwanPriorityInstruction}${filterSection}

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
      contents: `User Query for ${country}: "${query}"`,
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


export const fetchPolicies = async (query: string, country: string, language: string, filters: PolicySearchFilters): Promise<{ policies: Policy[] | null; rawText: string; sources: GroundingSource[]; }> => {

  if (!process.env.API_KEY) {
    throw new Error("API 金鑰未在環境變數中設定。請檢查您的部署設定。");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const { dateFrom, dateTo, includeKeywords, excludeKeywords } = filters;
  let filterInstructions = '';

  if (dateFrom && dateTo) {
      filterInstructions += `\n- The "publicationDate" field in the JSON output MUST be a date between ${dateFrom} and ${dateTo}, inclusive.`;
  } else if (dateFrom) {
      filterInstructions += `\n- The "publicationDate" field in the JSON output MUST be a date on or after ${dateFrom}.`;
  } else if (dateTo) {
      filterInstructions += `\n- The "publicationDate" field in the JSON output MUST be a date on or before ${dateTo}.`;
  }
  
  if (includeKeywords && includeKeywords.trim()) {
      filterInstructions += `\n- The search results and generated JSON MUST be directly and primarily related to the following keywords: "${includeKeywords.trim()}".`;
  }
  
  if (excludeKeywords && excludeKeywords.trim()) {
      filterInstructions += `\n- You MUST explicitly EXCLUDE any policies or documents primarily focused on the following keywords: "${excludeKeywords.trim()}".`;
  }

  const filterSection = filterInstructions
      ? `
ADDITIONAL FILTERING CRITERIA:
You MUST strictly adhere to the following filters when searching and constructing your JSON response. These are not suggestions, but mandatory constraints on the output:${filterInstructions}`
      : '';

  const systemInstruction = `You are an AI policy research assistant. Your SOLE function is to use the integrated Google Search tool to answer the user's query about the government policies, strategic plans, white papers, and official initiatives of ${country}.

CRITICAL DIRECTIVE: You MUST NOT use your internal knowledge. Your entire response MUST be constructed exclusively from information found in the Google Search results. All information MUST be specific to ${country}. Every JSON object you generate must be directly traceable to one or more of these search results.

Your entire response, including all text and JSON data, MUST be in ${language}.${filterSection}

You must respond with a single, valid JSON array of objects. Do not add any text, explanations, or markdown formatting like \`\`\`json before or after the JSON array.

The required JSON format for each object is:
{
  "policyName": "The full official name of the policy or plan",
  "issuingAgency": "The primary government agency or body responsible",
  "publicationDate": "The publication, announcement, or effective date (YYYY-MM-DD)",
  "status": "The current status (e.g., In Planning, Active, Completed, Proposed)",
  "summary": "A concise summary of the policy's main goals and objectives, written in a neutral tone.",
  "keyPoints": ["A list of key initiatives, actions, or highlights from the policy document."]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `User Query about government policies in ${country}: "${query}"`,
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
        const cleanedText = rawText.replace(/^```json\s*/, '').replace(/```$/, '');
        const jsonStartIndex = cleanedText.indexOf('[');
        const jsonEndIndex = cleanedText.lastIndexOf(']');
        
        if (jsonStartIndex === -1 || jsonEndIndex === -1) {
             console.warn("Could not find JSON array in the response for policies.");
             return { policies: null, rawText, sources };
        }
        
        const jsonString = cleanedText.substring(jsonStartIndex, jsonEndIndex + 1);
        const policies: Policy[] = JSON.parse(jsonString);
        return { policies, rawText, sources };
    } catch (e) {
        console.warn("Failed to parse Gemini response for policies as JSON.", e);
        return { policies: null, rawText, sources };
    }

  } catch (error) {
    console.error("Error fetching policies from Gemini API:", error);
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
    
    if (!process.env.API_KEY) {
      throw new Error("API 金鑰未在環境變數中設定。請檢查您的部署設定。");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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