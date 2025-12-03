
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, LogOut, Coffee, FileText, BarChart, Settings, RefreshCw, Power, Clock, MapPin, AlertCircle, Check, ShieldAlert, Bell, Award } from 'lucide-react';
import Header from '../components/Header';
import SmartAssistant from '../components/SmartAssistant';
import BfaLoadingSpinner from '../components/BfaLoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';
import JustificationModal from '../components/JustificationModal';
import { getDeviceConfig, getPunches, syncDataFromCloud, saveNote, getBadges } from '../services/storage';
import { Punch, PunchType, Badge } from '../types';
import { requestNotificationPermission, checkNotificationPermission } from '../services/notifications';

// Helper for ripple effect
const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
  const button = event.currentTarget;
  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
  circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
  circle.classList.add("ripple-effect");

  const ripple = button.getElementsByClassName("ripple-effect")[0];
  if (ripple) {
    ripple.remove();
  }

  button.appendChild(circle);
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const config = getDeviceConfig();
  const [recentPunches, setRecentPunches] = useState<Punch[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  const loadLocalData = () => {
     if (getDeviceConfig()) {
        const all = getPunches().filter(p => p.employeeCode === getDeviceConfig()?.employeeCode);
        setRecentPunches(all.reverse().slice(0, 5));
        setBadges(getBadges());
     }
  };

  useEffect(() => {
    const init = async () => {
        if (!getDeviceConfig()) {
            navigate('/config');
            return;
        }
        setNotifPermission(checkNotificationPermission());
        loadLocalData();

        if (location.state?.success) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            window.history.replaceState({}, document.title);
        }

        setTimeout(async () => {
            setIsSyncing(true);
            const newItemsCount = await syncDataFromCloud();
            loadLocalData(); // Reload badged & punches
            if (newItemsCount > 0) {
                setShowSyncSuccess(true);
                setTimeout(() => setShowSyncSuccess(false), 3000);
            }
            setIsSyncing(false);
            setLoading(false);
        }, 500);
    };
    init();
  }, [navigate, location]);

  const handleManualSync = async () => {
      setIsSyncing(true);
      await syncDataFromCloud();
      loadLocalData();
      setIsSyncing(false);
  };

  const handleLogout = () => {
      localStorage.clear();
      navigate('/config');
  };
  
  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotifPermission('granted');
      alert('¡Notificaciones activadas!');
    }
  };

  const handleJustificationSubmit = (text: string, hasPhoto: boolean, hasAudio: boolean) => {
    if (!config) return;
    let contentString = text;
    if (hasPhoto) contentString += " [Adjunto: Foto]";
    if (hasAudio) contentString += " [Adjunto: Audio]";
    saveNote({
        id: crypto.randomUUID(),
        employeeCode: config.employeeCode,
        category: 'Justificación',
        content: contentString,
        timestamp: new Date().toISOString()
    });
    setShowJustificationModal(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const getLastPunchToday = () => {
      if (recentPunches.length === 0) return null;
      const last = recentPunches[0];
      const today = new Date().toISOString().split('T')[0];
      if (last.timestamp.startsWith(today)) return last;
      return null;
  };

  const lastPunch = getLastPunchToday();
  const todaysPunches = recentPunches.filter(p => p.timestamp.startsWith(new Date().toISOString().split('T')[0]));

  const MenuItem = ({ icon: Icon, label, onClick, colorClass = "bg-white text-bfa-blue" }: any) => {
    return (
        <button onClick={(e) => { createRipple(e); onClick(); }} className={`ripple-btn ripple-btn-light ${colorClass} p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 hover:shadow-md transition-all active:bg-gray-50`}>
            <Icon size={28} />
            <span className="text-sm font-medium text-center">{label}</span>
        </button>
    );
  };

  if (loading) return <BfaLoadingSpinner fullScreen text="Iniciando BFA Asistencia..." />;

  return (
    <div className="min-h-screen bg-bfa-gray pb-20">
      <Header title="Inicio" userName={config?.employeeName} />

      <ConfirmationModal isOpen={showLogoutModal} title="¿Cerrar Sesión?" message="Se eliminará la configuración de este dispositivo." confirmText="Salir" onConfirm={handleLogout} onCancel={() => setShowLogoutModal(false)} isDestructive={true} />
      <JustificationModal isOpen={showJustificationModal} onClose={() => setShowJustificationModal(false)} onConfirm={handleJustificationSubmit} />

      {showSuccess && <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center animate-bounce"><span className="mr-2">✓</span> Operación exitosa</div>}
      {showSyncSuccess && <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-bfa-blue text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center animate-bounce"><Check size={18} className="mr-2" /> <span className="text-sm font-medium">Sincronización completada.</span></div>}

      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-500 font-medium">{new Date().toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            {isSyncing && <div className="flex items-center text-xs text-bfa-blue animate-pulse"><RefreshCw size={12} className="mr-1 animate-spin"/> Sync...</div>}
        </div>
        
        <SmartAssistant />

        {/* --- GAMIFICATION SECTION --- */}
        {badges.length > 0 && (
            <div className="mb-6 animate-fade-in-up">
                <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2 ml-1 flex items-center">
                    <Award size={14} className="mr-1 text-bfa-gold"/> Mis Logros
                </h3>
                <div className="flex space-x-2 overflow-x-auto pb-2">
                    {badges.map(b => (
                        <div key={b.id} className={`${b.color} flex-shrink-0 px-3 py-2 rounded-lg shadow-sm flex items-center space-x-2 border border-black/5`}>
                            <span className="text-xl">{b.icon}</span>
                            <div>
                                <p className="text-xs font-bold leading-tight">{b.name}</p>
                                <p className="text-[9px] opacity-80">{new Date(b.earnedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="mb-6 animate-fade-in-up">
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2 ml-1 flex justify-between items-center">
                <span>Actividad de Hoy</span>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{todaysPunches.length} Registros</span>
            </h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {todaysPunches.length === 0 ? (
                    <div className="p-4 flex items-center justify-center text-gray-400 text-sm italic bg-gray-50"><Clock size={16} className="mr-2 opacity-50"/>Sin actividad registrada hoy</div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {todaysPunches.map(p => (
                            <div key={p.id} className="p-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${p.type === PunchType.ENTRY ? 'bg-blue-50 text-bfa-blue' : p.type === PunchType.EXIT ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                                        {p.type === PunchType.ENTRY ? <LogIn size={14}/> : p.type === PunchType.EXIT ? <LogOut size={14}/> : <Coffee size={14}/>}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-700">{p.type === PunchType.OCCASIONAL_EXIT ? 'Salida Ocasional' : p.type}</p>
                                        <div className="flex items-center text-[10px] text-gray-400">
                                            <span>{p.synced ? 'Sincronizado' : 'Pendiente'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-800 font-mono">{new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    {p.isLate && <span className="text-[9px] text-red-500 font-bold block">TARDE</span>}
                                    {p.isEarly && <span className="text-[9px] text-orange-500 font-bold block">SALIDA ANT.</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
        
        {notifPermission === 'default' && (
           <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-bfa-lightBlue flex justify-between items-center">
             <div className="flex items-center"><Bell size={20} className="text-bfa-blue mr-3" /><div className="text-xs text-gray-600"><p className="font-bold text-bfa-blue">Activar Notificaciones</p>Reciba alertas de autorizaciones.</div></div>
             <button onClick={handleEnableNotifications} className="bg-bfa-blue text-white text-xs px-3 py-1.5 rounded-lg font-bold">Activar</button>
           </div>
        )}

        <h2 className="text-bfa-blue font-bold text-lg mb-4">Acciones</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
            <MenuItem icon={LogIn} label="Entrada" onClick={() => navigate('/punch/entry')} colorClass="bg-white text-bfa-blue border-l-4 border-bfa-blue"/>
            <MenuItem icon={LogOut} label="Salida" onClick={() => navigate('/punch/exit')} colorClass="bg-white text-red-600 border-l-4 border-red-500"/>
            <MenuItem icon={Coffee} label="Salida Ocasional" onClick={() => navigate('/punch/occasional')} />
            <MenuItem icon={FileText} label="Notas / Quejas" onClick={() => navigate('/notes')} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
             <button onClick={() => navigate('/reports')} className="bg-bfa-blue/10 text-bfa-blue p-3 rounded-lg flex items-center justify-center font-medium text-sm hover:bg-bfa-blue/20 transition-colors"><BarChart size={18} className="mr-2"/> Reportes</button>
             <button onClick={() => setShowJustificationModal(true)} className="bg-orange-100 text-orange-700 p-3 rounded-lg flex items-center justify-center font-medium text-sm hover:bg-orange-200 transition-colors"><ShieldAlert size={18} className="mr-2"/> Justificar Tarde</button>
        </div>

        <div className="grid grid-cols-1 mb-8">
             <button onClick={() => navigate('/config')} className="bg-gray-200 text-gray-700 p-3 rounded-lg flex items-center justify-center font-medium text-sm hover:bg-gray-300 transition-colors"><Settings size={18} className="mr-2"/> Configuración</button>
        </div>

        {/* Detailed Last Punch Card */}
        {lastPunch && (
            <div className="animate-fade-in-up mb-8">
                <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2 ml-1">Estado Actual</h3>
                <div className={`bg-white rounded-xl shadow-md border-l-4 p-5 flex justify-between items-center ${lastPunch.type === PunchType.ENTRY ? 'border-bfa-blue' : 'border-bfa-gold'}`}>
                    <div>
                        <div className="flex items-center space-x-2 mb-1">
                            {lastPunch.type === PunchType.ENTRY ? <LogIn size={18} className="text-bfa-blue"/> : lastPunch.type === PunchType.EXIT ? <LogOut size={18} className="text-yellow-600"/> : <Coffee size={18} className="text-green-600"/>}
                            <span className="font-bold text-gray-700 text-sm uppercase">{lastPunch.type}</span>
                        </div>
                        <div className="flex items-end items-baseline">
                            <Clock size={14} className="text-gray-400 mr-1.5" />
                            <span className="text-3xl font-bold text-gray-800 leading-none">{new Date(lastPunch.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <span className="text-xs text-gray-400 ml-1 font-medium">{new Date(lastPunch.timestamp).toLocaleTimeString([], {hour12: true}).slice(-2)}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                        {lastPunch.isLate && <span className="flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded"><AlertCircle size={12} className="mr-1"/> TARDE</span>}
                        {lastPunch.isEarly && <span className="flex items-center px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded"><AlertCircle size={12} className="mr-1"/> SALIDA ANT.</span>}
                        {!lastPunch.isLate && !lastPunch.isEarly && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">A TIEMPO</span>}
                    </div>
                </div>
            </div>
        )}

        <div className="flex justify-between items-center mb-4">
            <h2 className="text-bfa-blue font-bold text-lg">Historial General</h2>
            <div className="flex space-x-2">
                <button onClick={handleManualSync} className="text-bfa-gold hover:text-bfa-blue p-1" title="Sincronizar ahora"><RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} /></button>
                <button onClick={() => setShowLogoutModal(true)} className="text-red-400 hover:text-red-600 p-1" title="Cerrar Sesión"><Power size={18} /></button>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            {recentPunches.length === 0 ? <div className="p-6 text-center text-gray-400 text-sm">No hay registros aún.</div> : 
                <ul>
                    {recentPunches.map(p => (
                        <li key={p.id} className="border-b last:border-0 border-gray-50 p-4 flex justify-between items-center">
                            <div><p className="font-semibold text-gray-800 text-sm">{p.type}</p><p className="text-xs text-gray-500">{new Date(p.timestamp).toLocaleDateString()} - {new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></div>
                            <div className="text-right"><span className={`text-xs px-2 py-1 rounded-full ${p.synced ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>{p.synced ? 'Nube' : 'Pendiente'}</span></div>
                        </li>
                    ))}
                </ul>
            }
        </div>
      </main>
    </div>
  );
};

export default Home;
