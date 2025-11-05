/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const WahiOrb: React.FC = () => {
  return (
    <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 -z-10">
      <div className="relative w-[50vw] h-[50vw] max-w-2xl max-h-2xl">
        <div className="absolute inset-0 bg-brand-accent/30 rounded-full blur-3xl" />
        <div className="absolute inset-1/4 bg-brand-accent/20 rounded-full blur-3xl animate-pulse" />
      </div>
    </div>
  );
};

export default WahiOrb;
