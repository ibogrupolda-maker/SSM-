
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ProtocolSuggestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Analyzes medical emergency scenarios and returns protocol suggestions
export const getProtocolAdvice = async (scenario: string): Promise<ProtocolSuggestion> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analise o seguinte cenário de emergência médica e classifique-o de acordo com os protocolos padrão (A: Crítico/Emergência, B: Elevado/Urgente, C: Moderado/Semi-urgente, D: Baixo/Não urgente). 
    Cenário: "${scenario}"
    Forneça a resposta em formato JSON seguindo estritamente o esquema definido. Importante: Use Português de Portugal (PT-PT) em todos os textos explicativos.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          classification: { type: Type.STRING, enum: ['A', 'B', 'C', 'D'] },
          actionRequired: { type: Type.STRING },
          reasoning: { type: Type.STRING },
          suggestedResources: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["classification", "actionRequired", "reasoning", "suggestedResources"]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Resposta vazia do modelo de IA");
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Falha ao analisar resposta do Gemini", error);
    throw new Error("A análise do protocolo falhou.");
  }
};

// Generates text content with Google Search grounding for real-time information
export const generateTextWithSearch = async (prompt: string): Promise<GenerateContentResponse> => {
  return await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
};

// Generates an image using the Gemini 2.5 Flash Image model based on a text prompt
export const generateImage = async (prompt: string): Promise<string | null> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: prompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  // Find the generated image part in the response
  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (part?.inlineData) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  return null;
};

// Edits an existing image using a text prompt and the Gemini 2.5 Flash Image model
export const editImageWithPrompt = async (base64Image: string, prompt: string): Promise<string | null> => {
  // Extract pure base64 data and mimeType from data URL
  const match = base64Image.match(/^data:([^;]+);base64,(.+)$/);
  const mimeType = match ? match[1] : 'image/png';
  const data = match ? match[2] : base64Image;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: data,
            mimeType: mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    },
  });

  // Iterate through parts to find the edited image output
  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (part?.inlineData) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  return null;
};
