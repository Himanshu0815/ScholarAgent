
import { GoogleGenAI } from "@google/genai";
import { GroundingChunk, GroundingSupport, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Maps grounding supports to text to inject inline citations (e.g., <sup>[1]</sup>)
 * and returns a deduplicated list of sources that matches those numbers.
 */
const processCitations = (
  text: string,
  chunks: GroundingChunk[],
  supports: GroundingSupport[]
): { text: string; sources: GroundingChunk[] } => {
  if (!supports || supports.length === 0) {
    return { text, sources: chunks.filter(c => c.web?.uri) };
  }

  // 1. Identify unique sources and assign them a canonical number (1, 2, 3...)
  // based on their order of appearance in the grounding supports.
  const uniqueSources: GroundingChunk[] = [];
  const chunkIndexToSourceIndex = new Map<number, number>(); // original chunk idx -> new unique source idx
  const uriToSourceIndex = new Map<string, number>();

  // Sort supports by start index to determine "first appearance"
  const sortedSupportsByStart = [...supports].sort((a, b) => 
    (a.segment.startIndex || 0) - (b.segment.startIndex || 0)
  );

  sortedSupportsByStart.forEach(support => {
    support.groundingChunkIndices.forEach(chunkIdx => {
      if (chunkIndexToSourceIndex.has(chunkIdx)) return; // Already mapped

      const chunk = chunks[chunkIdx];
      if (!chunk || !chunk.web?.uri) return;

      const uri = chunk.web.uri;
      if (uriToSourceIndex.has(uri)) {
        // URI was already seen from a different chunk index, reuse the source index
        const existingSourceIdx = uriToSourceIndex.get(uri)!;
        chunkIndexToSourceIndex.set(chunkIdx, existingSourceIdx);
      } else {
        // New unique source
        const newSourceIdx = uniqueSources.length;
        uniqueSources.push(chunk);
        uriToSourceIndex.set(uri, newSourceIdx);
        chunkIndexToSourceIndex.set(chunkIdx, newSourceIdx);
      }
    });
  });

  // 2. Inject citation markers into the text.
  // We iterate backwards (by endIndex) so we don't disrupt indices for earlier insertions.
  const sortedSupportsByEnd = [...supports].sort((a, b) => 
    (b.segment.endIndex || 0) - (a.segment.endIndex || 0)
  );

  let modifiedText = text;

  sortedSupportsByEnd.forEach(support => {
    const sourceIndices = support.groundingChunkIndices
      .map(i => chunkIndexToSourceIndex.get(i))
      .filter(i => i !== undefined) as number[];

    if (sourceIndices.length === 0) return;

    // Deduplicate and sort numbers for this specific citation: e.g. [1, 3]
    const uniqueCitationNumbers = Array.from(new Set(sourceIndices))
      .sort((a, b) => a - b)
      .map(i => i + 1); // Convert to 1-based for display

    if (uniqueCitationNumbers.length > 0) {
      const marker = `<sup class="text-academic-400 font-bold ml-0.5">[${uniqueCitationNumbers.join(', ')}]</sup>`;
      const insertPos = support.segment.endIndex;
      
      // Safety check
      if (insertPos <= modifiedText.length) {
        modifiedText = 
          modifiedText.slice(0, insertPos) + 
          marker + 
          modifiedText.slice(insertPos);
      }
    }
  });

  return { text: modifiedText, sources: uniqueSources };
};

export const generateResearch = async (
  topic: string,
  detailLevel: 'concise' | 'detailed' = 'detailed'
): Promise<{ text: string; sources: GroundingChunk[] }> => {
  
  const model = 'gemini-2.5-flash';

  const detailInstruction = detailLevel === 'concise' 
    ? `Provide a HIGH-LEVEL SUMMARY. Focus on brevity, bullet points, and key takeaways. Limit deep technical exposition.`
    : `Provide an IN-DEPTH COMPREHENSIVE ANALYSIS. Include extensive background, methodology analysis, and thorough synthesis.`;

  const systemInstruction = `
    You are ScholarAgent, a world-class academic research assistant. 
    Your goal is to conduct rigorous research on the provided topic, synthesized from real-world data found via Google Search.
    
    Structure your response strictly as an Academic Report with the following Markdown sections:
    # Title of Research
    ## Executive Summary
    ## Key Developments & Findings
    ## Methodologies & Approaches (if relevant)
    ## Cross-Disciplinary Synthesis
    ## Conclusion & Future Outlook

    Instruction on Detail Level: ${detailInstruction}

    Tone: Professional, objective, and academic.
    Formatting: Use clear bullet points, bold text for emphasis, and professional phrasing.
    
    CRITICAL: You MUST use the googleSearch tool to find recent papers, articles, and reputable academic sources.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: topic,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.3, 
      },
    });

    const rawText = response.text || "No content generated.";
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const chunks = (groundingMetadata?.groundingChunks as GroundingChunk[]) || [];
    const supports = (groundingMetadata?.groundingSupports as GroundingSupport[]) || [];

    return processCitations(rawText, chunks, supports);

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate research report. Please check your API key and try again.");
  }
};

export const generateResearchFeed = async (
  topics: string[]
): Promise<{ text: string; sources: GroundingChunk[] }> => {
  const model = 'gemini-2.5-flash';
  const topicsStr = topics.join(", ");
  
  const systemInstruction = `
    You are an intelligent academic feed curator. 
    The user follows these research topics: ${topicsStr}.
    
    Your task:
    1. Use Google Search to find the latest (past 1-3 months) significant papers, articles, and breakthroughs for these topics.
    2. Prioritize peer-reviewed journals, preprints (arXiv, bioRxiv), and reputable academic news.
    3. Create a "Research Digest" organized by topic.
    4. For each item, provide a bold title and a concise summary of the findings.
    
    Format as Markdown.
    CRITICAL: You MUST use the googleSearch tool.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Fetch the latest research updates for: ${topicsStr}`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.3, 
      },
    });

    const rawText = response.text || "No updates found.";
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const chunks = (groundingMetadata?.groundingChunks as GroundingChunk[]) || [];
    const supports = (groundingMetadata?.groundingSupports as GroundingSupport[]) || [];

    return processCitations(rawText, chunks, supports);

  } catch (error) {
    console.error("Gemini Feed Error:", error);
    throw new Error("Failed to refresh feed.");
  }
};

export const generateChatResponse = async (
  history: ChatMessage[],
  reportContext: string,
  lastUserMessage: string
): Promise<{ text: string; sources: GroundingChunk[] }> => {
  const model = 'gemini-2.5-flash';

  // We perform RAG (Retrieval Augmented Generation) by injecting the current report content into the system prompt.
  // We also enable the Google Search tool so the model can find external citations if needed, 
  // or verify information from the report with live data.
  
  const systemInstruction = `
    You are a helpful academic assistant. 
    The user is reading a research report. Your job is to answer their questions based on the content of the report provided below.
    
    --- BEGIN REPORT CONTEXT ---
    ${reportContext.substring(0, 20000)} 
    --- END REPORT CONTEXT ---

    Instructions:
    1. Answer the user's question primarily using the information in the Report Context.
    2. If the answer is not in the report, or if you need to verify facts, use the 'googleSearch' tool to find authoritative academic sources.
    3. Keep answers concise and conversational but professional.
    4. If you use external information, the system will automatically cite it.
  `;

  // Convert app chat history to Gemini content format
  // We take the last few messages to maintain context without overflowing token limits too quickly
  const previousTurns = history.slice(-6).map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  // Add current message
  const contents = [
    ...previousTurns,
    { role: 'user', parts: [{ text: lastUserMessage }] }
  ];

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }], // Enable search for citations
        temperature: 0.5,
      },
    });

    const rawText = response.text || "I couldn't generate a response.";
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const chunks = (groundingMetadata?.groundingChunks as GroundingChunk[]) || [];
    const supports = (groundingMetadata?.groundingSupports as GroundingSupport[]) || [];

    return processCitations(rawText, chunks, supports);

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw new Error("Failed to generate chat response.");
  }
};
