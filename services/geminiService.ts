/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality } from "@google/genai";
import { LocationState, GenerationResult, IdentifiedObject } from '../types';

// Fix: Initialize GoogleGenAI with a named apiKey object
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type,
        },
    };
};

const parseProductResponse = (responseText: string): IdentifiedObject[] => {
    try {
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
            const parsed = JSON.parse(jsonMatch[1]);
            if (Array.isArray(parsed) && parsed.every(item => 'objectName' in item && 'products' in item)) {
                return parsed as IdentifiedObject[];
            }
        }
    } catch (e) {
        console.error("Failed to parse JSON from response:", e);
    }
    
    console.warn("Could not parse structured JSON from response.");
    return [];
};

export const generateDesign = async (imageFile: File, location: LocationState): Promise<GenerationResult> => {
    // Step 1: Generate the new staged image.
    // Fix: Use a recommended model for image generation tasks
    const imageGenerationModel = 'gemini-2.5-flash-image';
    const imagePart = await fileToGenerativePart(imageFile);
    
    // Fix: Use ai.models.generateContent for API calls
    const imageGenResponse = await ai.models.generateContent({
        model: imageGenerationModel,
        contents: {
            parts: [
                imagePart,
                { text: 'Virtually stage this room with a cohesive, modern, and stylish design. Make the space look bright, inviting, and fully furnished.' },
            ],
        },
        config: {
            // Fix: Use correct config for image generation modality
            responseModalities: [Modality.IMAGE],
        },
    });

    const generatedImagePart = imageGenResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!generatedImagePart?.inlineData) {
        throw new Error('Could not generate a new image.');
    }
    
    const newImageDataBase64 = generatedImagePart.inlineData.data;
    const newImageMimeType = generatedImagePart.inlineData.mimeType;

    // Step 2: Identify products in the new image and find them in local stores.
    // Fix: Use a recommended model for complex text tasks
    const productFinderModel = 'gemini-2.5-flash';
    const locationString = location?.type === 'query' ? location.value : 'the user\'s current location';

    const productPrompt = `
        Analyze the provided image of a staged room. Identify the main, distinct furniture and decor items. 
        For each item you identify:
        1.  Provide a descriptive name (e.g., "Blue Velvet Sofa", "Oak Coffee Table").
        2.  Provide a bounding box for the item's location in the image. The coordinates should be percentages from the top-left corner: { "top": float, "left": float, "width": float, "height": float }.
        3.  Find 1-2 similar, real products available for purchase from stores near ${locationString}. For each product suggestion, provide the product name, store name, and a URL to view or purchase it.
        
        Return your response as a single JSON object inside a markdown code block. The structure should be an array of objects, like this:
        \`\`\`json
        [
          {
            "objectName": "Example Sofa",
            "boundingBox": { "top": 0.5, "left": 0.2, "width": 0.4, "height": 0.3 },
            "products": [
              {
                "productName": "Mid-Century Modern Sofa",
                "storeName": "West Elm",
                "productUrl": "https://www.westelm.com/products/example-sofa"
              }
            ]
          }
        ]
        \`\`\`
    `;

    const productResponse = await ai.models.generateContent({
        model: productFinderModel,
        contents: {
            parts: [
                { inlineData: { data: newImageDataBase64, mimeType: newImageMimeType } },
                { text: productPrompt },
            ]
        },
        config: {
            // Fix: Use googleMaps for grounding
            tools: [{ googleMaps: {} }],
            toolConfig: location?.type === 'coords' ? {
                retrievalConfig: { latLng: location.value }
            } : undefined
        }
    });

    // Fix: Extract text correctly from the response
    const identifiedObjects = parseProductResponse(productResponse.text);

    return {
        imageUrl: `data:${newImageMimeType};base64,${newImageDataBase64}`,
        identifiedObjects,
    };
};
