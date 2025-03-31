
import React from 'react';

const InitializingLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-buffett-blue border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status"></div>
        <p className="mt-4 text-lg">API-Schlüssel werden überprüft...</p>
        <p className="mt-2 text-sm text-gray-500">Dies kann einen Moment dauern.</p>
      </div>
    </div>
  );
};

export default InitializingLoader;
