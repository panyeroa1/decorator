/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import Spinner from './components/Spinner';
import ResultsView from './components/ResultsView';
import Sidebar from './components/Sidebar';
import Modal from './components/Modal';
import { DesignResult, generateDesignConcept, editImageWithPrompt } from './services/geminiService';
import { LocationState } from './types';

type AppStage = 'upload' | 'generating' | 'results' | 'error';

const App: React.FC = () => {
    const [stage, setStage] = useState<AppStage>('upload');
    const [error, setError] = useState<string | null>(null);
    const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [designResults, setDesignResults] = useState<DesignResult[]>([]);
    const [groundingMetadata, setGroundingMetadata] = useState<any | null>(null);
    const [activeDesignIndex, setActiveDesignIndex] = useState(0);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImageUrl, setModalImageUrl] = useState<string>('');

    const handleReset = useCallback(() => {
        setStage('upload');
        setError(null);
        setOriginalImageFile(null);
        setOriginalImageUrl(null);
        setDesignResults([]);
        setGroundingMetadata(null);
        setActiveDesignIndex(0);
        setEditedImageUrl(null);
        setIsEditing(false);
        setIsModalOpen(false);
        setModalImageUrl('');
    }, []);

    const handleImageUpload = useCallback((file: File) => {
        setOriginalImageFile(file);
        setOriginalImageUrl(URL.createObjectURL(file));
    }, []);

    const handleGenerate = useCallback(async (location: LocationState) => {
        if (!originalImageFile) {
            setError('Please upload an image first.');
            setStage('error');
            return;
        }

        setStage('generating');
        setError(null);
        setEditedImageUrl(null); // Clear previous edits
        setActiveDesignIndex(0); // Reset to first design

        try {
            const { designs, groundingMetadata: newGroundingMetadata } = await generateDesignConcept(originalImageFile, location);
            setDesignResults(designs);
            setGroundingMetadata(newGroundingMetadata);
            setStage('results');
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate design concepts. ${errorMessage}`);
            setStage('error');
        }
    }, [originalImageFile]);

    const handleEditPrompt = useCallback(async (prompt: string) => {
        if (!designResults[activeDesignIndex]) return;

        setIsEditing(true);
        setError(null);
        const baseImageUrl = editedImageUrl ?? designResults[activeDesignIndex].redesignedImageUrl;

        try {
            const newImageUrl = await editImageWithPrompt(baseImageUrl, prompt);
            setEditedImageUrl(newImageUrl);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            alert(`Image editing failed: ${errorMessage}`); // Using alert for in-context error
        } finally {
            setIsEditing(false);
        }
    }, [activeDesignIndex, designResults, editedImageUrl]);

    const handleSelectDesign = useCallback((index: number) => {
        setActiveDesignIndex(index);
        setEditedImageUrl(null); // Clear edits when switching designs
    }, []);
    
    const handleImageClick = (url: string) => {
        setModalImageUrl(url);
        setIsModalOpen(true);
    };

    const handleClearEdit = useCallback(() => {
        setEditedImageUrl(null);
    }, []);

    const renderContent = () => {
        switch (stage) {
            case 'upload':
                return <ImageUploader onImageUpload={handleImageUpload} onGenerate={handleGenerate} previewUrl={originalImageUrl} onReset={handleReset} />;
            case 'generating':
                return (
                    <div className="text-center p-8">
                        <h2 className="text-3xl font-heading mb-4 text-brand-accent">Generating Your Designs...</h2>
                        <p className="text-brand-text-secondary mb-8">Our AI is re-imagining your space. This may take a minute.</p>
                        <Spinner />
                    </div>
                );
            case 'results':
                if (originalImageUrl && designResults.length > 0) {
                    return (
                        <div className="flex-grow flex flex-col md:flex-row overflow-hidden w-full">
                           <ResultsView 
                                originalImageUrl={originalImageUrl}
                                designs={designResults}
                                editedImageUrl={editedImageUrl}
                                activeDesignIndex={activeDesignIndex}
                                onImageClick={handleImageClick}
                           />
                           <Sidebar 
                                designs={designResults}
                                activeDesignIndex={activeDesignIndex}
                                onSelectDesign={handleSelectDesign}
                                groundingMetadata={groundingMetadata}
                                onEditPrompt={handleEditPrompt}
                                isEditing={isEditing}
                                onReset={handleReset}
                                onClearEdit={handleClearEdit}
                                editedImageUrl={editedImageUrl}
                           />
                        </div>
                    );
                }
                // Fallback if results are not ready for some reason
                handleReset();
                return null;
            case 'error':
                return (
                    <div className="text-center p-8 bg-red-900/20 border border-red-500 rounded-lg max-w-2xl mx-auto">
                        <h2 className="text-3xl font-heading mb-4 text-red-400">An Error Occurred</h2>
                        <p className="text-brand-text-secondary mb-6">{error}</p>
                        <button onClick={handleReset} className="bg-brand-accent hover:bg-opacity-80 text-brand-dark font-bold py-2 px-6 rounded-md transition-colors">
                            Try Again
                        </button>
                    </div>
                );
        }
    };
    
    return (
        <div className="flex flex-col h-screen bg-brand-dark text-brand-text font-body antialiased">
            <Header />
            <main className="flex-grow flex flex-col items-center justify-center overflow-y-auto w-full">
                {renderContent()}
            </main>
            {isModalOpen && <Modal imageUrl={modalImageUrl} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default App;
