/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { GenerationResult, IdentifiedObject } from '../types';
import Sidebar from './Sidebar';
import Modal from './Modal';

interface ResultsViewProps {
    result: GenerationResult;
    originalImageUrl: string;
    onReset: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ result, originalImageUrl, onReset }) => {
    const [selectedObject, setSelectedObject] = useState<IdentifiedObject | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imageToShow, setImageToShow] = useState<'generated' | 'original'>('generated');

    const displayedImageUrl = imageToShow === 'generated' ? result.imageUrl : originalImageUrl;

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 animate-fadeIn">
            <div className="flex-grow lg:w-2/3 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-3xl font-heading text-brand-accent">Your Design Concepts</h2>
                    <button onClick={onReset} className="bg-brand-accent hover:bg-opacity-80 text-brand-dark font-bold py-2 px-4 rounded-md transition-colors">
                        Start Over
                    </button>
                </div>

                <div className="relative bg-brand-dark rounded-lg shadow-2xl border border-white/10 p-2">
                    <div className="relative">
                        <img 
                            src={displayedImageUrl} 
                            alt={imageToShow === 'generated' ? "Generated room design" : "Original room"} 
                            className="w-full h-auto object-contain rounded-md"
                        />
                        {imageToShow === 'generated' && result.identifiedObjects.map((obj, index) => (
                            <div
                                key={index}
                                className={`absolute border-2 rounded-sm cursor-pointer transition-all duration-300 ${selectedObject === obj ? 'border-brand-accent bg-brand-accent/30' : 'border-transparent hover:border-brand-accent/50'}`}
                                style={{
                                    top: `${obj.boundingBox.top * 100}%`,
                                    left: `${obj.boundingBox.left * 100}%`,
                                    width: `${obj.boundingBox.width * 100}%`,
                                    height: `${obj.boundingBox.height * 100}%`,
                                }}
                                onMouseEnter={() => setSelectedObject(obj)}
                                onMouseLeave={() => setSelectedObject(null)}
                                onClick={() => setSelectedObject(obj)}
                            />
                        ))}
                    </div>

                    <div className="absolute top-4 left-4 flex gap-2">
                         <button 
                            onClick={() => setImageToShow(imageToShow === 'generated' ? 'original' : 'generated')}
                            className="bg-black/50 hover:bg-black/70 text-white text-xs font-bold py-1 px-3 rounded-full transition-colors backdrop-blur-sm"
                         >
                           {imageToShow === 'generated' ? 'Show Original' : 'Show Generated'}
                        </button>
                         <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-black/50 hover:bg-black/70 text-white text-xs font-bold py-1 px-3 rounded-full transition-colors backdrop-blur-sm"
                         >
                           Enlarge
                        </button>
                    </div>
                </div>
            </div>

            <Sidebar 
                objects={result.identifiedObjects}
                selectedObject={selectedObject}
                onSelectObject={setSelectedObject}
            />
            
            {isModalOpen && <Modal imageUrl={displayedImageUrl} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default ResultsView;
