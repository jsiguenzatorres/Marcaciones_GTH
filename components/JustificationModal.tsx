import React, { useState, useRef } from 'react';
import { Camera, Mic, X, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

interface JustificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (text: string, hasPhoto: boolean, hasAudio: boolean) => void;
}

const JustificationModal: React.FC<JustificationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [text, setText] = useState('');
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioSaved, setAudioSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoName(e.target.files[0].name);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setAudioSaved(true);
    } else {
      setIsRecording(true);
      // Simulate recording limits or interaction
    }
  };

  const handleSubmit = () => {
    if (!text.trim() && !photoName && !audioSaved) {
        alert("Debe ingresar un motivo, foto o audio.");
        return;
    }
    onConfirm(text, !!photoName, audioSaved);
    resetForm();
  };

  const resetForm = () => {
      setText('');
      setPhotoName(null);
      setAudioSaved(false);
      setIsRecording(false);
  };

  const handleClose = () => {
      resetForm();
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="bg-bfa-blue p-4 flex justify-between items-center text-white">
            <h3 className="font-bold text-lg flex items-center">
                <AlertCircle className="mr-2 text-bfa-gold" size={20} />
                Justificar Tardanza
            </h3>
            <button onClick={handleClose} className="text-white/80 hover:text-white">
                <X size={20} />
            </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600 mb-2">
                Explique el motivo de su llegada tardía. Puede adjuntar evidencia.
            </p>

            <textarea 
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-bfa-blue outline-none resize-none bg-gray-50"
                rows={3}
                placeholder="Escriba el motivo aquí..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            ></textarea>

            <div className="grid grid-cols-2 gap-4">
                {/* Photo Button */}
                <div className={`border-2 border-dashed rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer transition-colors
                    ${photoName ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-bfa-blue hover:bg-blue-50'}`}
                >
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                    
                    {photoName ? (
                        <div className="text-center relative w-full">
                            <CheckCircle size={24} className="text-green-600 mx-auto mb-1"/>
                            <p className="text-xs text-green-700 truncate px-2 font-medium">{photoName}</p>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setPhotoName(null); }}
                                className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ) : (
                        <div onClick={handleFileClick} className="text-center w-full">
                            <Camera size={24} className="text-gray-400 mx-auto mb-1"/>
                            <p className="text-xs text-gray-500">Tomar Foto</p>
                        </div>
                    )}
                </div>

                {/* Audio Button */}
                <button 
                    onClick={toggleRecording}
                    className={`border-2 border-dashed rounded-lg p-3 flex flex-col items-center justify-center transition-colors
                    ${isRecording ? 'border-red-500 bg-red-50 animate-pulse' : audioSaved ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-bfa-blue hover:bg-blue-50'}`}
                >
                    {isRecording ? (
                        <>
                            <div className="w-6 h-6 bg-red-500 rounded-full mb-1 animate-ping absolute opacity-20"></div>
                            <Mic size={24} className="text-red-600 mx-auto mb-1 relative z-10"/>
                            <p className="text-xs text-red-600 font-bold">Grabando...</p>
                        </>
                    ) : audioSaved ? (
                        <div className="text-center relative w-full">
                            <CheckCircle size={24} className="text-green-600 mx-auto mb-1"/>
                            <p className="text-xs text-green-700 font-medium">Audio Guardado</p>
                            <div 
                                onClick={(e) => { e.stopPropagation(); setAudioSaved(false); }}
                                className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1 cursor-pointer"
                            >
                                <Trash2 size={12} />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <Mic size={24} className="text-gray-400 mx-auto mb-1"/>
                            <p className="text-xs text-gray-500">Grabar Nota</p>
                        </div>
                    )}
                </button>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex space-x-3">
            <button 
                onClick={handleClose}
                className="flex-1 py-3 text-gray-600 font-medium text-sm hover:text-gray-800"
            >
                Cancelar
            </button>
            <button 
                onClick={handleSubmit}
                className="flex-1 py-3 bg-bfa-gold text-bfa-blue font-bold rounded-lg shadow-md hover:shadow-lg transform active:scale-95 transition-all text-sm"
            >
                Enviar Justificación
            </button>
        </div>
      </div>
    </div>
  );
};

export default JustificationModal;