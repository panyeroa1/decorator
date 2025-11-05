/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Modality, Type } from '@google/genai';
import { LocationState } from '../types';

// Fix: Initialize the GoogleGenAI client.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * The result of a design concept generation.
 */
export interface DesignResult {
    designTitle: string;
    designDescription: string;
    redesignedImageUrl: string;
}

/**
 * Converts a File object to a GoogleGenAI.Part object.
 * @param file The file to convert.
 * @returns A promise that resolves to a Part object.
 */
const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

/**
 * Converts a data URL string to a GoogleGenAI.Part object.
 * @param dataUrl The data URL to convert.
 * @returns A Part object.
 */
const dataUrlToGenerativePart = (dataUrl: string) => {
    const [header, data] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    return {
        inlineData: { data, mimeType },
    };
};

/**
 * Generates two design concepts for a given room image, including descriptions,
 * redesigned images, and local store suggestions.
 * @param imageFile The user's uploaded room image.
 * @param location The user's location for grounding.
 * @returns An object containing the design results and grounding metadata.
 */
export const generateDesignConcept = async (imageFile: File, location: LocationState) => {
    // Step 1: Generate design descriptions and find local stores using a text model.
    const textModel = 'gemini-2.5-pro';
    const imagePart = await fileToGenerativePart(imageFile);

    const systemInstruction = `You are an expert interior designer. Your goal is to provide two distinct, creative, and appealing redesign concepts for a given room image. The two design styles to generate are 'Modern Minimalist' and 'Cozy Bohemian'. You MUST format your response using the following specific markdown headers and nothing else:

##T1##
[Title for Design 1]

##D1##
[Description for Design 1]

##T2##
[Title for Design 2]

##D2##
[Description for Design 2]`;

    const contentParts = [
        imagePart,
        { text: "Analyze this room and provide two redesign concepts as instructed." },
    ];
    if (location && location.type === 'query') {
        contentParts.push({ text: `User location query: "${location.value}"` });
    }

    const textGenerationConfig: any = {
        tools: [{ googleMaps: {} }],
    };

    if (location && location.type === 'coords') {
        textGenerationConfig.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: location.value.latitude,
                    longitude: location.value.longitude,
                }
            }
        };
    }
    
    // Fix: `systemInstruction` must be passed within the `config` object.
    const textResponse = await ai.models.generateContent({
        model: textModel,
        contents: { parts: contentParts },
        config: { ...textGenerationConfig, systemInstruction },
    });

    const groundingMetadata = textResponse.candidates?.[0]?.groundingMetadata;
    
    const parseResponse = (text: string): { designTitle: string, designDescription: string }[] => {
        const title1Match = text.match(/##T1##\s*([\s\S]*?)\s*##D1##/);
        const desc1Match = text.match(/##D1##\s*([\s\S]*?)\s*##T2##/);
        const title2Match = text.match(/##T2##\s*([\s\S]*?)\s*##D2##/);
        const desc2Match = text.match(/##D2##\s*([\s\S]*)/);

        const title1 = title1Match ? title1Match[1].trim() : '';
        const desc1 = desc1Match ? desc1Match[1].trim() : '';
        const title2 = title2Match ? title2Match[1].trim() : '';
        const desc2 = desc2Match ? desc2Match[1].trim() : '';

        if (!title1 || !desc1 || !title2 || !desc2) {
            console.error("Failed to parse response:", text);
            throw new Error("Could not parse the design concepts from the model's response. The format was unexpected.");
        }

        return [
            { designTitle: title1, designDescription: desc1 },
            { designTitle: title2, designDescription: desc2 },
        ];
    };
    
    const textDesigns = parseResponse(textResponse.text);


    // Step 2: Generate images for each design concept using an image model.
    const imageModel = 'gemini-2.5-flash-image';
    const designs: DesignResult[] = [];

    for (const textDesign of textDesigns) {
        const imagePrompt = `Generate a photorealistic image of the provided room, but redesigned in a '${textDesign.designTitle}' style. The new design should incorporate these elements: ${textDesign.designDescription}`;
        
        const imageResponse = await ai.models.generateContent({
            model: imageModel,
            contents: {
                parts: [
                    imagePart,
                    { text: imagePrompt }
                ]
            },
            config: {
                responseModalities: [Modality.IMAGE],
            }
        });

        let redesignedImageUrl = '';
        const part = imageResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part?.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            redesignedImageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
        
        if (redesignedImageUrl) {
            designs.push({
                ...textDesign,
                redesignedImageUrl,
            });
        } else {
            console.warn(`Image generation failed for design: ${textDesign.designTitle}`);
        }
    }
    
    return { designs, groundingMetadata };
};

/**
 * Edits an image based on a text prompt.
 * @param baseImageUrl The data URL of the image to edit.
 * @param prompt The editing instruction.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const editImageWithPrompt = async (baseImageUrl: string, prompt: string): Promise<string> => {
    const imageModel = 'gemini-2.5-flash-image';
    const imagePart = dataUrlToGenerativePart(baseImageUrl);
    
    const response = await ai.models.generateContent({
        model: imageModel,
        contents: {
            parts: [
                imagePart,
                { text: prompt },
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE],
        }
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
    }

    throw new Error("Failed to generate edited image.");
};