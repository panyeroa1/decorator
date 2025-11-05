/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ResultsView from './components/ResultsView';
import Sidebar from './components/Sidebar';
import Spinner from './components/Spinner';
import Modal from './components/Modal';
import { generateDesignConcept, editImageWithPrompt, DesignResult } from './services/geminiService';
import { LocationState } from './types';

type AppStage = 'upload' | 'generating' | 'results' | 'error';

const App: React.FC = () => {
    const [stage, setStage] = useState<AppStage>('upload');
    const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [designs, setDesigns] = useState<DesignResult[]>([]);
    const [groundingMetadata, setGroundingMetadata] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeDesignIndex, setActiveDesignIndex] = useState(0);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

    const handleImageUpload = (file: File) => {
        setOriginalImageFile(file);
        setOriginalImageUrl(URL.createObjectURL(file));
    };

    const handleGenerate = useCallback(async (location: LocationState) => {
        if (!originalImageFile) {
            setError('Please upload an image first.');
            setStage('error');
            return;
        }
        setStage('generating');
        setError(null);
        try {
            const result = await generateDesignConcept(originalImageFile, location);
            setDesigns(result.designs);
            setGroundingMetadata(result.groundingMetadata);
            setStage('results');
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate design concepts. ${errorMessage}`);
            setStage('error');
        }
    }, [originalImageFile]);

    const handleReset = () => {
        setStage('upload');
        setOriginalImageFile(null);
        if (originalImageUrl) {
            URL.revokeObjectURL(originalImageUrl);
        }
        setOriginalImageUrl(null);
        setDesigns([]);
        setGroundingMetadata(null);
        setError(null);
        setActiveDesignIndex(0);
        setEditedImageUrl(null);
        setIsEditing(false);
        setModalImageUrl(null);
    };

    const handleSelectDesign = (index: number) => {
        if (index !== activeDesignIndex) {
            setActiveDesignIndex(index);
            setEditedImageUrl(null); // Clear edits when switching designs
        }
    };
    
    const handleEditPrompt = async (prompt: string) => {
        if (!designs[activeDesignIndex]) return;
        setIsEditing(true);
        setError(null);
        try {
            const baseImageUrl = editedImageUrl || designs[activeDesignIndex].redesignedImageUrl;
            const newImageUrl = await editImageWithPrompt(baseImageUrl, prompt);
            setEditedImageUrl(newImageUrl);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            alert(`Failed to apply edit: ${errorMessage}`);
        } finally {
            setIsEditing(false);
        }
    };

    const handleClearEdit = () => {
        setEditedImageUrl(null);
    };
    
    const handleImageClick = (url: string) => {
        setModalImageUrl(url);
    };

    const handleCloseModal = () => {
        setModalImageUrl(null);
    };

    const renderContent = () => {
        switch (stage) {
            case 'generating':
                return (
                    <div className="flex flex-col items-center justify-center flex-grow text-center p-8">
                        <Spinner />
                        <h2 className="text-2xl font-heading mt-6 text-brand-accent">Generating Your Designs...</h2>
                        <p className="text-brand-text-secondary mt-2 max-w-md">Our AI is re-imagining your space. This can take up to a minute, so please be patient!</p>
                    </div>
                );
            case 'results':
                return (
                    <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                        <ResultsView 
                            originalImageUrl={originalImageUrl!}
                            designs={designs}
                            editedImageUrl={editedImageUrl}
                            activeDesignIndex={activeDesignIndex}
                            onImageClick={handleImageClick}
                        />
                        <Sidebar 
                            designs={designs}
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
            case 'error':
                 return (
                    <div className="flex flex-col items-center justify-center flex-grow text-center p-8">
                        <h2 className="text-2xl font-heading text-red-500">An Error Occurred</h2>
                        <p className="text-brand-text-secondary mt-2 mb-6 max-w-md">{error}</p>
                        <button onClick={handleReset} className="bg-brand-accent hover:bg-opacity-80 text-brand-dark font-bold py-2 px-6 rounded-md transition-colors">
                            Try Again
                        </button>
                    </div>
                );
            case 'upload':
            default:
                return (
                    <div className="flex-grow flex items-center justify-center p-4 md:p-8">
                        <ImageUploader 
                            onImageUpload={handleImageUpload}
                            onGenerate={handleGenerate}
                            previewUrl={originalImageUrl}
                            onReset={handleReset}
                        />
                    </div>
                );
        }
    };

    return (
        <div className="bg-brand-dark text-brand-text-primary font-body flex flex-col h-screen overflow-hidden">
            <Header />
            <main className="flex-grow flex flex-col overflow-hidden">
                {renderContent()}
            </main>
            {modalImageUrl && <Modal imageUrl={modalImageUrl} onClose={handleCloseModal} />}
        </div>
    );
};

export default App;
