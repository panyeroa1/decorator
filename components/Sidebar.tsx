/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { IdentifiedObject } from '../types';

interface SidebarProps {
    objects: IdentifiedObject[];
    selectedObject: IdentifiedObject | null;
    onSelectObject: (object: IdentifiedObject | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ objects, selectedObject, onSelectObject }) => {
    return (
        <aside className="lg:w-1/3 xl:w-1/4 bg-brand-surface rounded-lg shadow-2xl p-6 border border-white/10 shrink-0 self-start lg:sticky top-8">
            <h3 className="text-2xl font-heading mb-4 text-brand-accent border-b border-white/10 pb-2">Identified Products</h3>
            {objects.length > 0 ? (
                <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                    {objects.map((obj, index) => (
                        <div
                            key={index}
                            onMouseEnter={() => onSelectObject(obj)}
                            onMouseLeave={() => onSelectObject(null)}
                            className={`p-4 border rounded-md transition-all duration-300 ${selectedObject === obj ? 'bg-brand-dark border-brand-accent' : 'border-white/10 bg-brand-surface'}`}
                        >
                            <h4 className="font-semibold text-lg text-brand-text">{obj.objectName}</h4>
                            <div className="mt-2 space-y-3">
                                {obj.products.length > 0 ? obj.products.map((product, pIndex) => (
                                    <div key={pIndex} className="bg-brand-dark p-3 rounded">
                                        <p className="font-medium text-brand-text-secondary">{product.productName}</p>
                                        <p className="text-sm text-brand-text-secondary/80">from {product.storeName}</p>
                                        <a
                                            href={product.productUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-brand-accent hover:underline mt-1 inline-block"
                                        >
                                            View Product
                                        </a>
                                    </div>
                                )) : (
                                    <p className="text-sm text-brand-text-secondary">No specific products found.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-brand-text-secondary">No products could be identified in the generated image.</p>
            )}
        </aside>
    );
};

export default Sidebar;
