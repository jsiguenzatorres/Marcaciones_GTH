import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, MessageSquare } from 'lucide-react';
import Header from '../components/Header';
import { saveNote, getDeviceConfig } from '../services/storage';

const NotesPage: React.FC = () => {
  const navigate = useNavigate();
  const config = getDeviceConfig();
  const [category, setCategory] = useState<any>('Nota');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    saveNote({
        id: crypto.randomUUID(),
        employeeCode: config.employeeCode,
        category,
        content,
        timestamp: new Date().toISOString()
    });
    
    alert('Nota registrada correctamente.');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-bfa-gray">
      <Header title="Buzón de Empleado" />
      <main className="container mx-auto px-4 py-6 max-w-md">
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center mb-6 text-bfa-blue">
                <MessageSquare className="mr-2" />
                <h2 className="text-lg font-bold">Registrar Comentario</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select 
                        className="w-full border p-2 rounded-md"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option>Nota</option>
                        <option>Comentario</option>
                        <option>Sugerencia</option>
                        <option>Queja</option>
                        <option>Varios</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
                    <textarea 
                        required
                        className="w-full border p-2 rounded-md h-32"
                        placeholder="Escriba aquí..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    ></textarea>
                </div>
                <button type="submit" className="w-full bg-bfa-blue text-white py-3 rounded-lg font-bold flex justify-center items-center hover:bg-opacity-90">
                    <Send size={18} className="mr-2"/> Enviar
                </button>
            </form>
        </div>
      </main>
    </div>
  );
};

export default NotesPage;
