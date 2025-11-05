/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { DesignResult } from '../services/geminiService';

interface ResultsViewProps {
    originalImageUrl: string;
    designs: DesignResult[];
    editedImageUrl: string | null;
    activeDesignIndex: number;
    onImageClick: (url: string) => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ originalImageUrl, designs, editedImageUrl, activeDesignIndex, onImageClick }) => {

    const getImageForDesign = (index: number) => {
        if (index === activeDesignIndex && editedImageUrl) {
            return editedImageUrl;
        }
        return designs[index].redesignedImageUrl;
    };

    return (
        <div className="flex-grow flex flex-col p-4 md:p-6 bg-brand-dark overflow-y-auto">
            <div className="w-full max-w-5xl mx-auto space-y-6">
                {/* Original Image */}
                <div className="relative group">
                     <div className="aspect-w-16 aspect-h-9 w-full bg-black rounded-lg overflow-hidden shadow-lg border border-transparent group-hover:border-brand-accent/50 transition-all">
                        <img
                            src={originalImageUrl}
                            alt="Original Room"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wider">
                        ORIGINAL
                    </div>
                </div>

                {/* Generated Images */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {designs.map((design, index) => (
                        <div key={design.designTitle} className="relative group cursor-pointer" onClick={() => onImageClick(getImageForDesign(index))}>
                           <div className="aspect-w-16 aspect-h-9 w-full bg-black rounded-lg overflow-hidden shadow-lg transition-all border border-transparent group-hover:border-brand-accent duration-300">
                                <img
                                    src={getImageForDesign(index)}
                                    alt={design.designTitle}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wider">
                                {design.designTitle.toUpperCase()}
                            </div>
                             {index === activeDesignIndex && editedImageUrl && (
                                <div className="absolute top-2 right-2 bg-brand-accent text-brand-dark px-2 py-0.5 rounded-full text-xs font-bold">
                                    EDITED
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ResultsView;