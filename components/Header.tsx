/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-brand-surface p-4 border-b border-white/10 shrink-0">
      <h1 className="text-2xl font-heading text-center text-brand-accent">Virtual Staging AI</h1>
      <p className="text-center text-brand-text-secondary text-sm font-body">Upload a photo of your room and get instant redesign concepts</p>
    </header>
  );
};

export default Header;