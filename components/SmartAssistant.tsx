import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPunches, getDeviceConfig } from '../services/storage';
import { PunchType } from '../types';
import { ArrowRight, CheckCircle, Clock, AlertCircle, LogOut, Coffee } from 'lucide-react';

const SmartAssistant: React.FC = () => {
  const navigate = useNavigate();
  const config = getDeviceConfig();

  const suggestion = useMemo(() => {
    if (!config) {
      return {
        text: 'Configuración pendiente',
        subtext: 'Configure su dispositivo para iniciar.',
        action: () => navigate('/config'),
        icon: <AlertCircle className="text-white" size={24} />,
        color: 'bg-orange-500'
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const punches = getPunches().filter(p => p.timestamp.startsWith(today) && p.employeeCode === config.employeeCode);
    
    // Sort by time descending
    punches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const lastPunch = punches[0];
    const now = new Date();
    const currentHour = now.getHours();

    // 1. No punch today
    if (!lastPunch) {
      return {
        text: 'Registrar Entrada',
        subtext: 'Inicie su jornada laboral.',
        action: () => navigate('/punch/entry'),
        icon: <Clock className="text-white" size={24} />,
        color: 'bg-bfa-blue'
      };
    }

    // 2. Last punch was Entry -> Suggest Exit or Occasional based on time
    if (lastPunch.type === PunchType.ENTRY) {
      // If it's the end of the day (e.g. > 15:30), suggest Exit
      if (currentHour >= 16 || (currentHour === 15 && now.getMinutes() >= 30)) {
        return {
          text: 'Finalizar Jornada',
          subtext: 'Registrar salida principal.',
          action: () => navigate('/punch/exit'),
          icon: <LogOut className="text-white" size={24} />,
          color: 'bg-bfa-gold text-bfa-blue' // Gold background for importance
        };
      }
      
      // Mid-day: Suggest Occasional Exit (e.g. Lunch or Errands)
      return {
        text: 'En Jornada',
        subtext: '¿Necesita salir? Registre permiso.',
        action: () => navigate('/punch/occasional'),
        icon: <Coffee className="text-white" size={24} />,
        color: 'bg-green-600'
      };
    }

    // 3. Last punch was Occasional Exit
    if (lastPunch.type === PunchType.OCCASIONAL_EXIT) {
         // Logic: If it's late (> 16:00), maybe they want to close the day (Exit).
         // Otherwise, they are likely returning (Entry).
         
         if (currentHour >= 16) {
            return {
                text: 'Finalizar Jornada',
                subtext: 'Cierre su turno (Salida Principal).',
                action: () => navigate('/punch/exit'),
                icon: <LogOut className="text-white" size={24} />,
                color: 'bg-orange-600'
            };
         }

         return {
            text: '¿Regresó?',
            subtext: 'Marque su reingreso a la oficina.',
            action: () => navigate('/punch/entry'),
            icon: <ArrowRight className="text-white" size={24} />,
            color: 'bg-bfa-lightBlue'
         };
    }

    // 4. Last punch was Exit -> Done
    if (lastPunch.type === PunchType.EXIT) {
      return {
        text: 'Jornada Finalizada',
        subtext: 'Buen descanso.',
        action: () => {}, // No action
        icon: <CheckCircle className="text-white" size={24} />,
        color: 'bg-gray-500'
      };
    }

    return null;
  }, [config, navigate]);

  if (!suggestion) return null;

  return (
    <div 
      onClick={suggestion.action}
      className={`${suggestion.color} rounded-lg shadow-lg p-4 mb-6 text-white flex items-center justify-between cursor-pointer transform transition-all hover:scale-[1.02] active:scale-95`}
    >
      <div>
        <h3 className="font-bold text-lg">{suggestion.text}</h3>
        <p className="text-sm opacity-90">{suggestion.subtext}</p>
      </div>
      <div className="bg-white/20 p-2 rounded-full">
        {suggestion.icon}
      </div>
    </div>
  );
};

export default SmartAssistant;