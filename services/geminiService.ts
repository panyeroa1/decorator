/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { LocationState } from '../types';


export interface DesignResult {
    designTitle: string;
    redesignedImageUrl: string;
    designDescription: string;
}

// Helper to get intrinsic image dimensions from a File object
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("Failed to read file."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                resolve({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.onerror = (err) => reject(new Error(`Image load error: ${err}`));
        };
        reader.onerror = (err) => reject(new Error(`File reader error: ${err}`));
    });
};

// Helper to crop a square image back to an original aspect ratio, removing padding.
const cropToOriginalAspectRatio = (
    imageDataUrl: string,
    originalWidth: number,
    originalHeight: number,
    targetDimension: number
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = imageDataUrl;
        img.onload = () => {
            const aspectRatio = originalWidth / originalHeight;
            let contentWidth, contentHeight;
            if (aspectRatio > 1) { // Landscape
                contentWidth = targetDimension;
                contentHeight = targetDimension / aspectRatio;
            } else { // Portrait or square
                contentHeight = targetDimension;
                contentWidth = targetDimension * aspectRatio;
            }
            const x = (targetDimension - contentWidth) / 2;
            const y = (targetDimension - contentHeight) / 2;
            const canvas = document.createElement('canvas');
            canvas.width = contentWidth;
            canvas.height = contentHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context for cropping.'));
            ctx.drawImage(img, x, y, contentWidth, contentHeight, 0, 0, contentWidth, contentHeight);
            resolve(canvas.toDataURL('image/jpeg', 0.95));
        };
        img.onerror = (err) => reject(new Error(`Image load error during cropping: ${err}`));
    });
};

// Resizes the image to fit within a square and adds padding.
const resizeImage = (file: File, targetDimension: number): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) return reject(new Error("Failed to read file."));
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = targetDimension;
                canvas.height = targetDimension;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Could not get canvas context.'));
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, targetDimension, targetDimension);
                const aspectRatio = img.width / img.height;
                let newWidth, newHeight;
                if (aspectRatio > 1) {
                    newWidth = targetDimension;
                    newHeight = targetDimension / aspectRatio;
                } else {
                    newHeight = targetDimension;
                    newWidth = targetDimension * aspectRatio;
                }
                const x = (targetDimension - newWidth) / 2;
                const y = (targetDimension - newHeight) / 2;
                ctx.drawImage(img, x, y, newWidth, newHeight);
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                    } else {
                        reject(new Error('Canvas to Blob conversion failed.'));
                    }
                }, 'image/jpeg', 0.95);
            };
            img.onerror = (err) => reject(new Error(`Image load error: ${err}`));
        };
        reader.onerror = (err) => reject(new Error(`File reader error: ${err}`));
    });
};

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

// Helper function to convert a data URL string to a Gemini API Part
const dataUrlToPart = (dataUrl: string): { inlineData: { mimeType: string; data: string; } } => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

export const editImageWithPrompt = async (
    imageUrl: string,
    prompt: string
): Promise<string> => {
    console.log(`Editing image with prompt: "${prompt}"`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const imagePart = dataUrlToPart(imageUrl);
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE] },
    });

    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (!imagePartFromResponse?.inlineData) {
        console.error("Model response for image edit did not contain an image part.", response);
        throw new Error("The AI model did not return an edited image. Please try a different prompt.");
    }

    const { mimeType, data } = imagePartFromResponse.inlineData;
    const newImageUrl = `data:${mimeType};base64,${data}`;
    console.log("Image editing successful.");
    return newImageUrl;
};


export const generateDesignConcept = async (
    roomImage: File,
    location: LocationState
): Promise<{ designs: DesignResult[]; groundingMetadata: any; }> => {
    console.log('Starting two-step design generation process...');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const { width: originalWidth, height: originalHeight } = await getImageDimensions(roomImage);
    const MAX_DIMENSION = 1024;
    
    console.log('Resizing room image...');
    const resizedRoomImage = await resizeImage(roomImage, MAX_DIMENSION);
    const roomImagePart = await fileToPart(resizedRoomImage);

    console.log('Generating two design plans with gemini-2.5-pro...');
    
    let designPlannerPrompt = `
You are an expert interior designer specializing in practical, budget-friendly transformations that require no structural work.
A user has uploaded an image of their room.
Your goal is to generate TWO distinct design concepts.

**Constraints for ALL designs:**
- All suggestions must be achievable without a carpenter or major renovations. Focus on paint, furniture arrangement, new decor, and textiles.
- Prioritize reusing and repurposing the user's existing furniture.
- New items suggested should be common, affordable types of products.
- Use the Google Maps tool to find 3-5 local stores (like home goods, department, or furniture stores) near the user's location where these types of items could be purchased.
`;

    const config: any = { tools: [{googleMaps: {}}] };
    let toolConfig: any = {};

    if (location?.type === 'coords') {
        toolConfig = { retrievalConfig: { latLng: location.value } };
    } else if (location?.type === 'query') {
        designPlannerPrompt += `\nThe user's location is specified as: "${location.value}". Ground your search for local stores based on this address.`;
    }

    designPlannerPrompt += `
**Design Concept 1: "Elegant Refresh"**
- This design should HEAVILY rely on the existing furniture.
- Suggest simple modifications like repainting a table, changing handles, adding a slipcover, or rearranging the layout.
- Introduce 1-2 key new decor items (e.g., a new rug, art, modern lighting) to elevate the space.

**Design Concept 2: "Cozy Minimalist"**
- This design can propose replacing one major furniture piece if it significantly improves the room, but only if necessary.
- The aesthetic should be clean, uncluttered, warm, and inviting.
- Focus on textures (knit blankets, linen curtains), natural materials, and a calming color palette.

**Your Task:**
Your response MUST be a single valid JSON object. The root object should have one key: "designs".
The value of "designs" should be an array of exactly TWO objects. Each object must have these keys:
- "designTitle": A string (e.g., "Elegant Refresh").
- "designDescription": A detailed description for this concept.
- "imagePrompt": A specific prompt for the image model for this concept.

Example JSON structure:
{
  "designs": [
    {
      "designTitle": "Elegant Refresh",
      "designDescription": "We'll start by rearranging your current sofa...",
      "imagePrompt": "A photo of a living room with the sofa facing the window. The existing coffee table is painted matte black..."
    },
    {
      "designTitle": "Cozy Minimalist",
      "designDescription": "To create a more serene space, we'll declutter...",
      "imagePrompt": "A photorealistic image of a minimalist living room with light oak floors. A chunky knit throw blanket is on the armchair."
    }
  ]
}
`;

    const plannerResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: designPlannerPrompt }, roomImagePart] },
        config,
        toolConfig: Object.keys(toolConfig).length > 0 ? toolConfig : undefined,
    });

    const groundingMetadata = plannerResponse.candidates?.[0]?.groundingMetadata;
    console.log('Received design plan:', plannerResponse.text);
    console.log('Grounding metadata:', groundingMetadata);

    let parsedResponse;
    try {
        const textResponse = plannerResponse.text.trim();
        const startIndex = textResponse.indexOf('{');
        const endIndex = textResponse.lastIndexOf('}');
        if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
            throw new Error("No valid JSON object found in the response.");
        }
        const jsonString = textResponse.substring(startIndex, endIndex + 1);
        parsedResponse = JSON.parse(jsonString);
    } catch(e) {
        console.error("Failed to parse JSON from planner model. Raw response:", plannerResponse.text, "Error:", e);
        throw new Error("The AI failed to return a valid design plan. Please try again.");
    }
    
    if (!parsedResponse.designs || parsedResponse.designs.length !== 2) {
        throw new Error("The AI's design plan was incomplete or malformed.");
    }

    console.log('Generating two redesigned images in parallel...');
    const imageGenerationPromises = parsedResponse.designs.map((design: any) => {
        return ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [roomImagePart, { text: `Based on the original room image, generate a new, photorealistic image following this design prompt: ${design.imagePrompt}` }] },
            config: { responseModalities: [Modality.IMAGE] },
        });
    });

    const imageGenResponses = await Promise.all(imageGenerationPromises);
    console.log('Received all image generation responses.');

    const finalDesigns = await Promise.all(parsedResponse.designs.map(async (design: any, index: number) => {
        const imageGenResponse = imageGenResponses[index];
        const imagePartFromResponse = imageGenResponse.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

        if (!imagePartFromResponse?.inlineData) {
            console.error(`Model response for design ${index + 1} did not contain an image part.`, imageGenResponse);
            throw new Error(`The AI model did not return a redesigned image for "${design.designTitle}". Please try again.`);
        }
        
        const { mimeType, data } = imagePartFromResponse.inlineData;
        const generatedSquareImageUrl = `data:${mimeType};base64,${data}`;

        const finalImageUrl = await cropToOriginalAspectRatio(generatedSquareImageUrl, originalWidth, originalHeight, MAX_DIMENSION);

        return {
            designTitle: design.designTitle,
            redesignedImageUrl: finalImageUrl,
            designDescription: design.designDescription,
        };
    }));

    return {
        designs: finalDesigns,
        groundingMetadata,
    };
};