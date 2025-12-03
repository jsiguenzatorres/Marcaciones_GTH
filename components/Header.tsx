import React from 'react';
import { Menu, Wifi, WifiOff } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase';

interface HeaderProps {
  title?: string;
  userName?: string;
}

const Header: React.FC<HeaderProps> = ({ title, userName }) => {
  const online = isSupabaseConfigured();

  return (
    <header className="bg-gradient-to-r from-bfa-blue to-bfa-lightBlue text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-bfa-gold rounded-full flex items-center justify-center font-bold text-bfa-blue text-sm">
            BFA
          </div>
          <div>
             <h1 className="font-bold text-lg leading-tight">{title || 'Asistencia'}</h1>
             {userName && <p className="text-xs text-gray-200 opacity-90">{userName}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {online ? <Wifi size={16} className="text-green-400" /> : <WifiOff size={16} className="text-orange-300" />}
        </div>
      </div>
      <div className="h-1 bg-bfa-gold w-full"></div>
    </header>
  );
};

export default Header;
