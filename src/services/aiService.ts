import { GoogleGenAI, Type } from "@google/genai";

export interface DetectionSegment {
  text: string;
  isAI: boolean;
  confidence: number; // 0 to 1
  reasoning?: string;
}

export interface DetectionResult {
  overallScore: number; // 0 to 100
  segments: DetectionSegment[];
  summary: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function detectAIText(text: string): Promise<DetectionResult> {
  if (!text.trim()) {
    throw new Error("Text cannot be empty");
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following text and identify segments that are likely AI-generated. 
    Break the text down into its original segments (sentences or short phrases) and for each segment, determine if it's AI-generated, the confidence level (0.0 to 1.0), and a brief reason.
    Also provide an overall AI-generated score from 0 to 100.
    
    CRITICAL SCORING ADJUSTMENTS (MANDATORY):
    1. TEMPLATE PENALTY REDUCTION: If the document follows a standard university or academic template structure (e.g., Title, Introduction, Methodology, etc.), REDUCE the AI score by 15-20%. Academic structure does NOT equal AI generation.
    2. SPECIFIC DETAIL BOOST: Identify local details like specific place names, organization names, or dates. For each unique specific detail found, REDUCE the AI score by 2. These are strong human authorship indicators.
    3. ERROR PRESENCE WEIGHTING: Look for natural human grammatical errors or incomplete constructions (e.g., "will awareness"). If such errors are present, REDUCE the overall AI score by 20%. AI rarely makes these specific types of errors.
    4. FIRST-PERSON LANGUAGE BOOST: If there is high usage of first-person language ("I", "my", "we", "our"), REDUCE the AI score by 10%. AI tends to favor a third-person formal tone.
    5. TEMPLATE RECOGNITION: Do not flag standard organizational sections as "too organized". Recognize them as standard formatting.

    TEXT:
    ${text}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: {
            type: Type.NUMBER,
            description: "Overall probability that the text is AI-generated (0-100)",
          },
          summary: {
            type: Type.STRING,
            description: "A brief summary of the analysis findings.",
          },
          segments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "The exact text segment from the input." },
                isAI: { type: Type.BOOLEAN, description: "Whether this segment is likely AI-generated." },
                confidence: { type: Type.NUMBER, description: "Confidence score from 0.0 to 1.0." },
                reasoning: { type: Type.STRING, description: "Brief explanation for the classification." },
              },
              required: ["text", "isAI", "confidence"],
            },
          },
        },
        required: ["overallScore", "segments", "summary"],
      },
    },
  });

  try {
    const result = JSON.parse(response.text || "{}");
    return result as DetectionResult;
  } catch (error) {
    console.error("Failed to parse AI detection result:", error);
    throw new Error("Failed to analyze text. Please try again.");
  }
}
