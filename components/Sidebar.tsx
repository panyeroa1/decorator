/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { DesignResult } from '../services/geminiService';
import Spinner from './Spinner';

interface SidebarProps {
    designs: DesignResult[];
    activeDesignIndex: number;
    onSelectDesign: (index: number) => void;
    groundingMetadata: any;
    onEditPrompt: (prompt: string) => void;
    isEditing: boolean;
    onReset: () => void;
    onClearEdit: () => void;
    editedImageUrl: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    designs, 
    activeDesignIndex, 
    onSelectDesign, 
    groundingMetadata, 
    onEditPrompt, 
    isEditing,
    onReset,
    onClearEdit,
    editedImageUrl
}) => {
    const [editPrompt, setEditPrompt] = useState('');
    const activeDesign = designs[activeDesignIndex];

    const handleSubmitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editPrompt.trim() || isEditing) return;
        onEditPrompt(editPrompt);
        setEditPrompt('');
    };

    return (
        <aside className="w-full md:w-96 bg-brand-surface border-l border-white/10 flex flex-col shrink-0">
            <div className="p-4 border-b border-white/10">
                <h2 className="text-xl font-heading text-brand-accent">Design Concepts</h2>
            </div>

            {/* Design Selector Tabs */}
            <div className="flex border-b border-white/10">
                {designs.map((design, index) => (
                    <button 
                        key={design.designTitle}
                        onClick={() => onSelectDesign(index)}
                        className={`flex-1 p-3 text-sm font-semibold transition-colors ${
                            activeDesignIndex === index 
                            ? 'bg-brand-accent/20 text-brand-accent border-b-2 border-brand-accent'
                            : 'text-brand-text-secondary hover:bg-white/5'
                        }`}
                    >
                        {design.designTitle}
                    </button>
                ))}
            </div>

            <div className="flex-grow p-6 overflow-y-auto space-y-6">
                {/* Design Description */}
                <div>
                    <h3 className="font-semibold text-lg mb-2 text-white">Description</h3>
                    <p className="text-brand-text-secondary text-sm leading-relaxed">{activeDesign.designDescription}</p>
                </div>

                {/* Image Editor */}
                <div>
                    <h3 className="font-semibold text-lg mb-2 text-white">Refine This Design</h3>
                    <p className="text-brand-text-secondary text-xs mb-3">Make small changes. Try "add a plant on the table" or "change the wall color to light blue".</p>
                    <form onSubmit={handleSubmitEdit} className="space-y-3">
                        <textarea
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            placeholder="e.g., make the rug fluffier"
                            rows={2}
                            className="w-full px-3 py-2 bg-brand-dark border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm"
                            disabled={isEditing}
                        />
                        <div className="flex gap-2">
                             <button type="submit" disabled={!editPrompt.trim() || isEditing} className="flex-grow bg-brand-accent hover:bg-opacity-80 text-brand-dark font-bold py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center disabled:bg-brand-surface/50 disabled:cursor-not-allowed">
                                {isEditing ? <><Spinner /> <span className="ml-2">Applying...</span></> : 'Apply Edit'}
                            </button>
                            {editedImageUrl && (
                                <button type="button" onClick={onClearEdit} className="w-auto bg-transparent hover:bg-white/10 text-white/80 font-semibold py-2 px-3 rounded-md transition-colors text-xs border border-white/20">
                                    Clear
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Local Stores */}
                {groundingMetadata?.groundingChunks && groundingMetadata.groundingChunks.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-lg mb-2 text-white">Shop The Look Nearby</h3>
                        <ul className="space-y-2">
                            {groundingMetadata.groundingChunks
                                .filter((chunk: any) => chunk.maps?.uri && chunk.maps?.title)
                                .map((chunk: any, index: number) => (
                                    <li key={index} className="text-sm">
                                        <a 
                                            href={chunk.maps.uri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 rounded-md bg-brand-dark hover:bg-white/5 transition-colors group"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-brand-text-secondary group-hover:text-brand-accent">{chunk.maps.title}</span>
                                        </a>
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-white/10">
                    <button onClick={onReset} className="w-full bg-transparent hover:bg-brand-accent hover:text-brand-dark border border-brand-accent text-brand-accent font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                        Start Over
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
