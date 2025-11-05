/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ResultsView from './components/ResultsView';
import Spinner from './components/Spinner';
import { generateDesign } from './services/geminiService';
import { LocationState, GenerationResult } from './types';
import WahiOrb from './components/WahiOrb';

const App: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<GenerationResult | null>(null);

    const handleImageUpload = (file: File) => {
        setImageFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleGenerate = useCallback(async (location: LocationState) => {
        if (!imageFile) {
            setError('Please upload an image first.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const designResult = await generateDesign(imageFile, location);
            setResult(designResult);
        } catch (err) {
            console.error(err);
            setError('An error occurred while generating the design. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [imageFile]);

    const handleReset = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setImageFile(null);
        setPreviewUrl(null);
        setIsLoading(false);
        setError(null);
        setResult(null);
    };

    return (
        <div className="bg-brand-dark text-brand-text min-h-screen font-body flex flex-col relative overflow-x-hidden">
            <WahiOrb />
            <Header />
            <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center">
                {!result && !isLoading && (
                    <ImageUploader 
                        onImageUpload={handleImageUpload} 
                        onGenerate={handleGenerate}
                        previewUrl={previewUrl}
                        onReset={handleReset}
                    />
                )}
                
                {isLoading && (
                    <div className="text-center">
                        <Spinner />
                        <p className="mt-4 text-lg">Generating your new room design...</p>
                        <p className="text-sm text-brand-text-secondary">This may take a moment.</p>
                    </div>
                )}
                
                {error && <p className="text-red-500 mt-4">{error}</p>}
                
                {result && (
                    <ResultsView 
                        result={result}
                        originalImageUrl={previewUrl!}
                        onReset={handleReset}
                    />
                )}
            </main>
        </div>
    );
};

export default App;
