// Fix: Remove deprecated 'Schema' import
import { GoogleGenAI, Type } from "@google/genai";
import { Concept } from "../types";

// Initialize the client
// API Key is strictly from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CONCEPT_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      description: { type: Type.STRING },
      colorScheme: { type: Type.STRING },
      size: { type: Type.STRING },
      yarn: { type: Type.STRING },
      hook: { type: Type.STRING },
    },
    required: ["name", "description", "colorScheme", "size", "yarn", "hook"],
  },
};

/**
 * Helper function to retry an async operation with exponential backoff.
 */
async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000 // initial delay in ms
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && error?.error?.code === 429 || error?.error?.status === "RESOURCE_EXHAUSTED") {
      console.warn(`Rate limit hit, retrying in ${delay / 1000}s... (retries left: ${retries})`, error);
      await new Promise(res => setTimeout(res, delay));
      return retryWithExponentialBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Generates 10 text-based amigurumi concepts based on multiple input images and constraints.
 */
export const generateConcepts = async (
  base64Images: string[],
  colorCount: number,
  style: string,
  mode: 'diverse' | 'specific' = 'diverse',
  specificCharacter: string = ''
): Promise<Concept[]> => {
  try {
    let prompt = '';

    // The core similarity constraint shared across modes, updated for MULTIPLE references
    const similarityRule = `
      **STRICT DESIGN RULE: 60% COLLECTIVE SIMILARITY**
      Analyze ALL attached SAMPLE IMAGES. Identify the shared stylistic patterns across all of them (their collective "Design Language"):
      1. Stitch style and density: Look for commonality in how the stitches look (tight, fluffy, chunky).
      2. Aesthetic "Soul": Extract the shared way eyes are placed, face proportions, and general vibe (minimalist, detailed, chibi, etc.).
      3. Proportions: Determine the signature body-to-head ratios used across the samples.
      4. Color Harmony: Notice the types of palettes usually preferred in these samples.

      Your goal is to create designs that are 60% identical to this synthesized design DNA. 
      The remaining 40% should be the unique character features or accessories of the new concepts. 
      The resulting collection must look like it belongs to the exact same brand or artist portfolio as the samples.
    `;

    if (mode === 'diverse') {
      prompt = `
        You are a Master Amigurumi Artist and Brand Manager. 
        Create a collection of 10 distinct characters that belong to the SAME PRODUCT LINE defined by the sample images.
        
        ${similarityRule}

        **THEME:** "${style}"
        
        **INSTRUCTION:** 
        - All 10 concepts MUST strictly follow the theme: "${style}". 
        - Even if the character changes, the "Crochet Language" must be a perfect synthesis of the provided samples.
        - Ensure all 10 items look like they come from the same workshop.

        Parameters:
        - COLOR_COUNT: ${colorCount}
        
        Return a JSON array of 10 items.
      `;
    } else {
      prompt = `
        You are a Master Amigurumi Artist.
        Create 10 unique variations of a specific character: **${specificCharacter}**.
        
        ${similarityRule}
        
        **THEME:** "${style}"

        **INSTRUCTION:** 
        - The character must be a ${specificCharacter}, but it must inherit the "genetic code" synthesized from ALL provided sample images.
        - Apply the theme "${style}" to these variations while keeping the ${specificCharacter} recognizable and stylisticly consistent.

        Parameters:
        - TARGET CHARACTER: ${specificCharacter}
        - COLOR_COUNT: ${colorCount}
        
        Return a JSON array of 10 items.
      `;
    }

    const imageParts = base64Images.map(img => {
      const cleanBase64 = img.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
      const mimeTypeMatch = img.match(/^data:(.*?);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
      return {
        inlineData: {
          mimeType: mimeType,
          data: cleanBase64,
        },
      };
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...imageParts,
        { text: prompt },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: CONCEPT_SCHEMA,
        systemInstruction: "You are an expert amigurumi designer. You specialize in synthesizing styles from multiple references to create perfectly cohesive new collections.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text response from Gemini");

    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating concepts:", error);
    throw error;
  }
};

/**
 * Generates an image for a specific concept using the description.
 */
export const generateConceptImage = async (concept: Concept): Promise<string> => {
  const imageGenerationCall = async () => {
    const prompt = `
      High quality amigurumi crochet toy photography. 
      Professional studio lighting.
      Character: ${concept.name}.
      Details: ${concept.description}.
      Colors: ${concept.colorScheme}.
      
      Style Requirements:
      - Visual consistency with a professional, handcrafted amigurumi style.
      - CLEAR crochet stitch texture (avoid smooth/plastic looks).
      - Soft matte yarn texture.
      - Neutral light background.
      - Full body shot.
      
      No text, no watermarks, no hands.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ text: prompt }],
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No content parts in image response");

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  };

  try {
    return await retryWithExponentialBackoff(imageGenerationCall);
  } catch (error) {
    console.error("Error generating image for concept:", concept.name, error);
    throw error;
  }
};