/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type LocationState = { type: 'coords', value: { latitude: number; longitude: number; } } | { type: 'query', value: string } | null;

export interface IdentifiedObject {
    objectName: string;
    // Bounding box coordinates are percentages of the image dimensions (0 to 1)
    boundingBox: { 
        top: number; 
        left: number; 
        width: number; 
        height: number; 
    };
    products: Array<{
        productName: string;
        storeName: string;
        productUrl: string;
    }>;
}

export interface GenerationResult {
    imageUrl: string; // Base64 data URL
    identifiedObjects: IdentifiedObject[];
}
