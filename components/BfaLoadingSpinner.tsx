import React from 'react';

interface BfaLoadingSpinnerProps {
  fullScreen?: boolean;
  text?: string;
}

const BfaLoadingSpinner: React.FC<BfaLoadingSpinnerProps> = ({ fullScreen = true, text = 'Cargando...' }) => {
  const containerClasses = fullScreen
    ? "fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm transition-all duration-300"
    : "flex flex-col items-center justify-center p-6 w-full h-full min-h-[200px]";

  return (
    <div className={containerClasses}>
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Outer Ring - BFA Blue - Spinning Clockwise */}
        <div className="absolute w-full h-full border-4 border-gray-200 border-t-bfa-blue rounded-full animate-spin"></div>
        
        {/* Middle Ring - BFA Gold - Spinning Counter-Clockwise */}
        <div className="absolute w-16 h-16 border-4 border-transparent border-b-bfa-gold rounded-full animate-spin direction-reverse" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
        
        {/* Center BFA Logo / Dot */}
        <div className="absolute w-10 h-10 bg-gradient-to-br from-bfa-blue to-bfa-lightBlue rounded-full shadow-lg flex items-center justify-center animate-pulse">
           <span className="text-[10px] font-black text-white tracking-tighter">BFA</span>
        </div>
      </div>
      
      {/* Text Indicator */}
      <div className="mt-6 flex flex-col items-center space-y-2">
        <h3 className="text-bfa-blue font-bold text-lg tracking-wide animate-pulse">{text}</h3>
        <div className="flex space-x-1">
            <div className="w-2 h-2 bg-bfa-gold rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-bfa-gold rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-bfa-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default BfaLoadingSpinner;