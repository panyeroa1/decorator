/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useCallback } from 'react';
import { LocationState } from '../types';

interface ImageUploaderProps {
    onImageUpload: (file: File) => void;
    onGenerate: (location: LocationState) => void;
    previewUrl: string | null;
    onReset: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, onGenerate, previewUrl, onReset }) => {
    const [locationQuery, setLocationQuery] = useState('');
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImageUpload(file);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            onImageUpload(file);
        }
    };
    
    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleUseCurrentLocation = useCallback(() => {
        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                onGenerate({ type: 'coords', value: { latitude, longitude } });
                setIsGettingLocation(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("Could not get your location. Please enter an address manually or check your browser permissions.");
                setIsGettingLocation(false);
            }
        );
    }, [onGenerate]);
    
    const handleGenerateWithQuery = () => {
        if (!locationQuery.trim()) {
            alert('Please enter a location (e.g., "Paris, France" or a full address).');
            return;
        }
        onGenerate({ type: 'query', value: locationQuery });
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-8 bg-brand-surface rounded-lg shadow-2xl text-center border border-white/10">
            {!previewUrl ? (
                <>
                    <h2 className="text-3xl font-heading mb-4 text-brand-accent">1. Upload Your Room Photo</h2>
                    <p className="text-brand-text-secondary mb-6">Drag & drop an image or click to select a file.</p>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileInputRef}
                    />
                    <label
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={triggerFileSelect}
                        className="w-full h-64 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-accent hover:bg-brand-dark transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="text-brand-text-secondary">Click to upload or drag and drop</span>
                    </label>
                </>
            ) : (
                <>
                    <h2 className="text-3xl font-heading mb-4 text-brand-accent">1. Image Uploaded</h2>
                    <div className="mb-6 relative">
                        <img src={previewUrl} alt="Room preview" className="max-h-80 mx-auto rounded-lg shadow-md" />
                         <button 
                            onClick={onReset}
                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5"
                            aria-label="Remove image"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <h2 className="text-3xl font-heading my-4 text-brand-accent">2. Provide Location</h2>
                    <p className="text-brand-text-secondary mb-4">This helps us find local stores for your design items.</p>
                    
                    <div className="flex flex-col gap-4">
                       <button onClick={handleUseCurrentLocation} disabled={isGettingLocation} className="w-full bg-transparent hover:bg-brand-accent hover:text-brand-dark border border-brand-accent text-brand-accent font-semibold py-3 px-4 rounded-md transition-colors disabled:bg-brand-surface/50 disabled:cursor-not-allowed disabled:text-brand-text-secondary disabled:border-brand-text-secondary">
                           {isGettingLocation ? 'Getting Location...' : 'Use My Current Location'}
                       </button>

                       <div className="flex items-center">
                           <hr className="flex-grow border-white/20"/>
                           <span className="px-4 text-brand-text-secondary text-sm">OR</span>
                           <hr className="flex-grow border-white/20"/>
                       </div>

                       <input 
                           type="text"
                           value={locationQuery}
                           onChange={(e) => setLocationQuery(e.target.value)}
                           placeholder="Enter an address or city"
                           className="w-full px-4 py-3 bg-brand-dark border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                       />
                       <button onClick={handleGenerateWithQuery} className="w-full bg-brand-accent hover:bg-opacity-80 text-brand-dark font-bold py-3 px-4 rounded-md transition-colors">
                           Generate Design Concepts
                       </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ImageUploader;