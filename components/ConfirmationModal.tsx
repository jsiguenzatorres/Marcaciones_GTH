
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isDestructive = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100">
        <div className="p-6">
          <div className="flex items-center mb-4 text-bfa-blue">
            <div className="bg-blue-50 p-2 rounded-full mr-3">
               <AlertTriangle size={24} className="text-bfa-gold" />
            </div>
            <h3 className="text-lg font-bold leading-tight">{title}</h3>
          </div>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            {message}
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 font-bold rounded-lg text-sm text-white shadow-md transition-all transform active:scale-95
                ${isDestructive 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-bfa-blue hover:bg-bfa-lightBlue'}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-bfa-blue via-bfa-gold to-bfa-blue w-full"></div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
