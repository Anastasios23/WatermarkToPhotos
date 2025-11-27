import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize the client only if the key is available to avoid runtime crashes on init
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateAiLogo = async (prompt: string): Promise<string> => {
  if (!ai) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  try {
    // Using gemini-2.5-flash-image for fast logo generation as per guidelines for general image tasks
    // Or upgrade to gemini-3-pro-image-preview if high quality is strictly required.
    // The prompt persona suggests using the best model for the task.
    // Let's use gemini-3-pro-image-preview for higher quality logos.
    const model = 'gemini-3-pro-image-preview';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            text: `Design a simple, clean, professional logo or watermark icon based on this description: "${prompt}". 
            The output should be suitable for use as an overlay. 
            White background or transparent if possible (though models usually output rectangular images).
            High contrast.`
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    // Extract image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in the response.");
  } catch (error) {
    console.error("Error generating logo:", error);
    throw error;
  }
};
