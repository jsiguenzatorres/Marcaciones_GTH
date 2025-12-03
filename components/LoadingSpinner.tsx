
import React from 'react';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ fullScreen = true, text = 'Cargando...' }) => {
  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity"
    : "flex flex-col items-center justify-center p-4";

  return (
    <div className={containerClasses}>
      <div className="relative flex items-center justify-center">
        {/* Outer Ring - BFA Blue */}
        <div className="absolute animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-bfa-blue border-l-transparent border-r-transparent opacity-90"></div>
        
        {/* Inner Ring - BFA Gold */}
        <div className="absolute animate-spin rounded-full h-10 w-10 border-r-4 border-l-4 border-bfa-gold border-t-transparent border-b-transparent animation-delay-150 direction-reverse"></div>
        
        {/* Central Logo/Dot */}
        <div className="h-4 w-4 bg-bfa-blue rounded-full animate-pulse"></div>
      </div>
      
      {/* Loading Text */}
      <div className="mt-6 text-center">
        <h3 className="text-bfa-blue font-bold text-lg tracking-wide animate-pulse">{text}</h3>
        <p className="text-gray-500 text-xs mt-1">Por favor espere</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
