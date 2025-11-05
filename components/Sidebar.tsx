/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useMemo } from 'react';
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

// Heuristic to categorize stores based on their name
const getStoreCategory = (title: string): string => {
    const lower = title.toLowerCase();
    if (lower.includes('furniture')) return 'Furniture';
    if (lower.includes('decor') || lower.includes('home goods') || lower.includes('pottery') || lower.includes('crate') || lower.includes('barn') || lower.includes('world market')) return 'Home Decor';
    if (lower.includes('department') || lower.includes('target') || lower.includes('walmart') || lower.includes('kohls')) return 'Department Store';
    return 'General';
};

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
    const [mapQuery, setMapQuery] = useState('');
    const [selectedStore, setSelectedStore] = useState<any>(null);
    const [activeFilter, setActiveFilter] = useState('All');
    
    const activeDesign = designs[activeDesignIndex];
    const storeChunks = useMemo(() => groundingMetadata?.groundingChunks?.filter((chunk: any) => chunk.maps?.uri && chunk.maps?.title) || [], [groundingMetadata]);

    const availableCategories = useMemo(() => {
        const categories = new Set<string>(['All']);
        storeChunks.forEach((store: any) => {
            categories.add(getStoreCategory(store.maps.title));
        });
        return Array.from(categories);
    }, [storeChunks]);

    const filteredStores = useMemo(() => {
        if (activeFilter === 'All') {
            return storeChunks;
        }
        return storeChunks.filter((store: any) => getStoreCategory(store.maps.title) === activeFilter);
    }, [storeChunks, activeFilter]);

    const handleStoreClick = (store: any) => {
        setSelectedStore(store);
        const query = encodeURIComponent(`${store.maps.title}, ${store.maps.subtitle || ''}`);
        setMapQuery(`https://www.google.com/maps/embed/v1/place?key=${process.env.API_KEY}&q=${query}`);
    };

    useEffect(() => {
        // When filtered stores change (due to new metadata or filter change), update the map
        if (filteredStores.length > 0) {
            handleStoreClick(filteredStores[0]);
        } else {
            // No stores in this category, clear map and selection
            setMapQuery('');
            setSelectedStore(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredStores]); // depends on filteredStores which re-computes from filter/metadata

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
                {storeChunks.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-lg mb-2 text-white">Shop The Look Nearby</h3>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                            {availableCategories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setActiveFilter(category)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                                        activeFilter === category
                                            ? 'bg-brand-accent text-brand-dark'
                                            : 'bg-brand-dark hover:bg-white/10 text-brand-text-secondary'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                        
                        {mapQuery && (
                            <div className="aspect-w-16 aspect-h-9 w-full rounded-md overflow-hidden border border-white/10 mb-4">
                                <iframe
                                    key={mapQuery}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={mapQuery}>
                                </iframe>
                            </div>
                        )}
                        
                        <ul className="space-y-2">
                            {filteredStores.map((chunk: any, index: number) => (
                                <li key={index}>
                                    <button
                                        onClick={() => handleStoreClick(chunk)}
                                        className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors group text-left ${
                                            selectedStore?.maps?.uri === chunk.maps?.uri
                                                ? 'bg-brand-accent/20'
                                                : 'bg-brand-dark hover:bg-white/5'
                                        }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className={`text-sm ${
                                            selectedStore?.maps?.uri === chunk.maps?.uri
                                                ? 'text-brand-accent font-semibold'
                                                : 'text-brand-text-secondary group-hover:text-brand-accent'
                                        }`}>
                                            {chunk.maps.title}
                                        </span>
                                    </button>
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