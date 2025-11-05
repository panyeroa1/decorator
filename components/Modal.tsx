/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface ModalProps {
    imageUrl: string;
    onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ imageUrl, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" 
            onClick={onClose}
            style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
            <div className="relative w-full h-full max-w-6xl max-h-[90vh] p-4">
                <img 
                    src={imageUrl} 
                    alt="Enlarged design" 
                    className="w-full h-full object-contain"
                    onClick={(e) => e.stopPropagation()} // Prevent image click from closing modal
                />
            </div>
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-white text-4xl hover:text-brand-accent transition-colors"
                aria-label="Close"
            >
                &times;
            </button>
        </div>
    );
};

export default Modal;