
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle, AlertTriangle, Mic, Clock, RotateCcw, RefreshCw, List, X, ShieldAlert, Smile, Meh, Frown } from 'lucide-react';
import Header from '../components/Header';
import BfaLoadingSpinner from '../components/BfaLoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';
import { getDeviceConfig, savePunch, getPunches, fetchEmployeeFromMaster, generateUUID } from '../services/storage';
import { checkAndAwardBadges } from '../services/gamification';
import { getCurrentLocation, calculateDistanceMeters } from '../services/geo';
import { PunchType, OccasionalReason, OFFICE_GEOFENCE_RADIUS_METERS, Punch, MoodType } from '../types';
import { isSupabaseConfigured } from '../services/supabase';
import { sendLocalNotification, requestNotificationPermission } from '../services/notifications';

const PunchPage: React.FC = () => {
  const { type } = useParams<{ type: string }>(); // 'entry', 'exit', 'occasional'
  const navigate = useNavigate();
  const config = getDeviceConfig();
  
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Procesando...'); // Dynamic loading text
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<boolean>(false); // Specific flag for GPS issues
  const [comment, setComment] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [dailyHistory, setDailyHistory] = useState<Punch[]>([]);
  
  // Mood Tracker State
  const [mood, setMood] = useState<MoodType | undefined>(undefined);
  
  // Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Time validations
  const [isLate, setIsLate] = useState(false);
  const [isEarly, setIsEarly] = useState(false);

  // Occasional specific
  const [reason, setReason] = useState<string>(OccasionalReason.PERSONAL);
  const [authorizedBy, setAuthorizedBy] = useState('');

  const getPunchTitle = (): PunchType => {
    switch(type) {
      case 'entry': return PunchType.ENTRY;
      case 'exit': return PunchType.EXIT;
      case 'occasional': return PunchType.OCCASIONAL_EXIT;
      default: return PunchType.ENTRY;
    }
  };

  const punchType = getPunchTitle();

  // Function to fetch location with specific error handling
  const fetchLocation = useCallback(() => {
    if (!config) return;

    setLoading(true);
    setLoadingText('Localizando dispositivo...');
    setError(null);
    setGpsError(false);
    setLocation(null); // Clear previous location

    getCurrentLocation()
      .then(pos => {
        setLocation(pos);
        if (config.officeLat && config.officeLng) {
            const d = calculateDistanceMeters(pos.coords.latitude, pos.coords.longitude, config.officeLat, config.officeLng);
            setDistance(d);
            
            // --- GEOFENCING VALIDATION ---
            // Only strictly enforce 500m limit for ENTRY punches
            if (type === 'entry' && d > OFFICE_GEOFENCE_RADIUS_METERS) {
                setError(`📍 FUERA DE RANGO: Está a ${Math.round(d)}m de la oficina. El radio permitido para marcar entrada es de ${OFFICE_GEOFENCE_RADIUS_METERS}m.`);
            }
        }
      })
      .catch((err: any) => {
        setGpsError(true);
        console.error("GPS Error:", err);
        
        let errorMessage = 'No se pudo obtener la ubicación GPS.';

        // Handle specific Geolocation API error codes
        if (err.code === 1) { // PERMISSION_DENIED
             errorMessage = '⚠️ Permiso de ubicación denegado. Habilite el GPS en la configuración del navegador y recargue.';
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
             errorMessage = '📡 Señal GPS débil o no disponible. Asegúrese de estar en un espacio abierto con vista al cielo.';
        } else if (err.code === 3) { // TIMEOUT
             errorMessage = '⏱️ El GPS tardó demasiado en responder. Intente presionar "Actualizar Ubicación".';
        } else {
             errorMessage = err.message || 'Error técnico al acceder al GPS.';
        }
        
        setError(errorMessage);
      })
      .finally(() => setLoading(false));
  }, [config, type]);

  // 1. Validate Config & Type & Business Rules
  useEffect(() => {
    // Reset validations on effect run to avoid stale state
    setIsLate(false);
    setIsEarly(false);

    if (!config) {
      navigate('/config');
      return;
    }
    
    // Request notification permission silently on mount if possible
    requestNotificationPermission();

    // Business Rules Check
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todaysPunches = getPunches().filter(p => p.timestamp.startsWith(todayStr) && p.employeeCode === config.employeeCode);
    
    // Sort descending to get the very last state
    todaysPunches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Set history state for display
    setDailyHistory(todaysPunches.slice(0, 5));

    const lastPunch = todaysPunches[0];

    const hasEntry = todaysPunches.some(p => p.type === PunchType.ENTRY);
    const hasExit = todaysPunches.some(p => p.type === PunchType.EXIT);

    if (type === 'entry' && hasEntry) {
        // Validation: Only allow re-entry if the user is returning from an occasional exit
        // If the last punch was NOT an occasional exit, it means they are trying to double enter or enter after finishing day.
        if (!lastPunch || lastPunch.type !== PunchType.OCCASIONAL_EXIT) {
            setError('Ya ha registrado su Entrada Principal. Solo se permite un nuevo ingreso si está retornando de una Salida Ocasional.');
            return;
        }
    }
    
    if (type === 'exit' && !hasEntry) {
        setError('No puede registrar Salida sin una Entrada previa.');
        return;
    }
    if (type === 'exit' && hasExit) {
        setError('Ya existe un registro de Salida para hoy.');
        return;
    }
    if (type === 'occasional') {
        if (!hasEntry) {
            setError('Debe registrar Entrada antes de una Salida Ocasional.');
            return;
        } else if (lastPunch && lastPunch.type === PunchType.OCCASIONAL_EXIT) {
            setError('Ya se encuentra en una Salida Ocasional. Debe registrar Entrada (Regreso) primero.');
            return;
        } else if (lastPunch && lastPunch.type === PunchType.EXIT) {
            setError('Ya ha registrado su Salida Principal del día.');
            return;
        }
    }

    // Time Check
    // 08:30 AM limit for entry
    if (type === 'entry') {
        const limit = new Date(now);
        limit.setHours(8, 30, 0, 0); // Set strict limit to 08:30:00
        
        // Mark as late if time is greater than limit AND it is the first entry (not returning from occasional)
        // If hasEntry is true here, it means we passed the validation above (so it is a re-entry), so we don't mark re-entry as late.
        if (!hasEntry && now > limit) {
          setIsLate(true);
        }
    }

    // 16:30 PM limit for exit
    if (type === 'exit') {
        const limit = new Date(now);
        limit.setHours(16, 30, 0, 0);
        if (now < limit) {
          setIsEarly(true);
        }
    }

    // Attempt to get location initially
    fetchLocation();

  }, [config, type, navigate, punchType, fetchLocation]);

  const handleVoiceInput = () => {
     alert('Escuchando... (Simulación)');
     setComment('Llegada registrada por voz.');
  };

  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple-effect");
    
    // Always use white ripple for BFA blue gradient background
    circle.classList.add('bg-white/40'); 

    const ripple = button.getElementsByClassName("ripple-effect")[0];
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);
  };

  const handleRegister = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Add ripple effect
    createRipple(e);

    // Double check location existence and config
    if (!location || !config || error) return;
    
    setLoading(true);

    // ---------------------------------------------------------
    // DOUBLE GEOFENCE CHECK
    // ---------------------------------------------------------
    if (type === 'entry' && distance !== null && distance > OFFICE_GEOFENCE_RADIUS_METERS) {
        setError(`📍 FUERA DE RANGO: Distancia ${Math.round(distance)}m excede el límite de ${OFFICE_GEOFENCE_RADIUS_METERS}m.`);
        setLoading(false);
        return;
    }

    // ---------------------------------------------------------
    // SECURITY CHECK: Verify Employee Master in Supabase
    // ---------------------------------------------------------
    if (isSupabaseConfigured()) {
        setLoadingText('Verificando credenciales...');
        try {
            const validEmployee = await fetchEmployeeFromMaster(config.employeeCode);
            
            if (!validEmployee) {
                setLoading(false);
                setError('⛔ ACCESO DENEGADO: Su código de empleado no se encuentra activo en el maestro de personal. Contacte a RRHH.');
                return;
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
            setError('Error de conexión al verificar credenciales. Intente nuevamente.');
            return;
        }
    }
    
    setLoadingText('Guardando registro...');
    
    const newPunch: Punch = {
      id: generateUUID(),
      employeeCode: config.employeeCode,
      timestamp: new Date().toISOString(),
      type: punchType,
      gpsLat: location.coords.latitude,
      gpsLng: location.coords.longitude,
      geoAccuracy: location.coords.accuracy,
      deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
      reason: type === 'occasional' ? reason : undefined,
      authorizedBy: type === 'occasional' ? authorizedBy : undefined,
      comments: comment,
      synced: false,
      isLate,
      isEarly,
      mood: mood // Mood Tracker
    };

    await savePunch(newPunch);
    
    // GAMIFICATION CHECK
    await checkAndAwardBadges();

    // SIMULACIÓN DE NOTIFICACIÓN
    if (type === 'occasional') {
      setTimeout(() => {
        sendLocalNotification('Solicitud Autorizada', {
          body: `Su salida ocasional por "${reason}" ha sido autorizada correctamente por el sistema.`,
          requireInteraction: true
        });
      }, 4000);
    }

    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    navigate('/', { state: { success: true } });
  };

  const handleCancelClick = () => {
      setShowCancelModal(true);
  };

  const confirmCancel = () => {
      setShowCancelModal(false);
      navigate('/');
  };

  const isEntry = type === 'entry';
  const isOccasional = type === 'occasional';
  const isExit = type === 'exit';

  // Determine button label
  const getButtonLabel = () => {
    if (loading) return 'Procesando...';
    if (gpsError) return 'GPS No Disponible';
    if (!location) return 'Esperando señal GPS...';
    if (error) return 'Resolver Alertas';
    return `Confirmar ${punchType}`;
  };

  const MoodSelector = () => (
      <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2 text-center">¿Cómo te sientes hoy?</label>
          <div className="flex justify-center space-x-4">
              {[
                  { val: 'happy', icon: '😄', label: 'Bien' },
                  { val: 'neutral', icon: '😐', label: 'Normal' },
                  { val: 'tired', icon: '😫', label: 'Cansado' },
                  { val: 'stressed', icon: '🤯', label: 'Estresado' }
              ].map((m) => (
                  <button
                    key={m.val}
                    onClick={() => setMood(m.val as MoodType)}
                    className={`flex flex-col items-center p-2 rounded-lg transition-all ${mood === m.val ? 'bg-bfa-gold transform scale-110 shadow-md' : 'hover:bg-gray-100'}`}
                  >
                      <span className="text-2xl">{m.icon}</span>
                      <span className={`text-[10px] mt-1 ${mood === m.val ? 'text-bfa-blue font-bold' : 'text-gray-500'}`}>{m.label}</span>
                  </button>
              ))}
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-bfa-gray">
      <Header title={punchType} userName={config?.employeeName} />

      {loading && <BfaLoadingSpinner fullScreen text={loadingText} />}

      <ConfirmationModal 
        isOpen={showCancelModal}
        title="¿Cancelar Marcación?"
        message="Si sale ahora, no se guardará el registro de asistencia. ¿Está seguro?"
        confirmText="Sí, Cancelar"
        cancelText="Continuar marcando"
        onConfirm={confirmCancel}
        onCancel={() => setShowCancelModal(false)}
        isDestructive={true}
      />
      
      <main className="container mx-auto px-4 py-6 max-w-md">
        
        {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded shadow-sm" role="alert">
                <div className="flex items-start">
                    <div className="mr-2 flex-shrink-0 mt-0.5">
                        {error.includes('ACCESO DENEGADO') ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <div>
                        <p className="font-bold">Atención Requerida</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                </div>
                {gpsError && (
                    <button onClick={fetchLocation} className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold py-2 px-3 rounded inline-flex items-center transition-colors">
                        <RotateCcw size={14} className="mr-1" /> Reintentar GPS
                    </button>
                )}
                {!gpsError && (
                    <button onClick={() => navigate('/')} className="mt-2 text-sm underline font-medium block">Volver al inicio</button>
                )}
            </div>
        )}

        {!error && isLate && (
             <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 p-3 mb-4 rounded flex items-center shadow-sm">
                <Clock className="mr-2 flex-shrink-0" size={18}/>
                <div><span className="text-sm font-bold">Llegada Tardía</span><p className="text-xs mt-0.5">Son pasadas las 08:30 AM.</p></div>
             </div>
        )}
        {!error && isEarly && (
             <div className="bg-orange-50 border-l-4 border-orange-500 text-orange-800 p-3 mb-4 rounded flex items-center shadow-sm">
                <Clock className="mr-2 flex-shrink-0" size={18}/>
                <div><span className="text-sm font-semibold">Salida Temprana detectada</span><p className="text-xs mt-0.5">Se retira antes de las 04:30 PM.</p></div>
             </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 relative overflow-hidden">
           <div className={`absolute top-0 left-0 w-full h-2 ${isEntry ? 'bg-bfa-blue' : 'bg-bfa-gold'}`}></div>

           <div className="text-center mb-6 mt-2 relative">
             <div className={`inline-block p-4 rounded-full mb-3 ${error ? 'bg-red-50' : 'bg-gray-50'}`}>
               <MapPin size={32} className={error ? 'text-red-500' : (isEntry ? 'text-bfa-blue' : 'text-bfa-gold')} />
             </div>
             <div className="bg-gray-50 rounded-lg p-2 mb-2 inline-block max-w-full">
                 <p className="text-sm text-gray-500 font-mono truncate px-2">
                   {location ? `${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}` : 'Obteniendo coordenadas...'}
                 </p>
                 {distance !== null && (
                     <p className={`text-xs font-bold mt-1 ${distance > OFFICE_GEOFENCE_RADIUS_METERS ? 'text-red-500' : 'text-green-600'}`}>
                         Distancia: {Math.round(distance)}m
                     </p>
                 )}
             </div>
             <div className="flex justify-center mt-1">
                 <button onClick={fetchLocation} className="text-xs text-bfa-blue flex items-center hover:underline">
                     <RefreshCw size={12} className="mr-1"/> Actualizar Ubicación
                 </button>
             </div>
           </div>

           {/* Mood Tracker (Only on Exit) */}
           {isExit && <MoodSelector />}

           {isOccasional && (
               <div className="mb-4 space-y-3">
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motivo de Salida</label>
                       <select className="w-full border rounded p-2 text-sm bg-gray-50" value={reason} onChange={(e) => setReason(e.target.value)}>
                           {Object.values(OccasionalReason).map(r => (<option key={r} value={r}>{r}</option>))}
                       </select>
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Autorizado Por</label>
                       <input type="text" placeholder="Jefe Inmediato" className="w-full border rounded p-2 text-sm bg-gray-50" value={authorizedBy} onChange={(e) => setAuthorizedBy(e.target.value)} />
                   </div>
               </div>
           )}

           <div className="mb-6">
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Comentario (Opcional)</label>
             <div className="relative">
                <textarea className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-bfa-blue focus:border-transparent outline-none resize-none bg-gray-50" rows={2} placeholder="Añadir nota..." value={comment} onChange={(e) => setComment(e.target.value)}></textarea>
                <button onClick={handleVoiceInput} className="absolute right-2 bottom-2 text-gray-400 hover:text-bfa-blue p-1"><Mic size={18} /></button>
             </div>
           </div>

           <button onClick={handleRegister} disabled={loading || !!error || !location} className={`w-full py-4 rounded-xl shadow-md text-white font-bold text-lg transition-all transform active:scale-95 flex justify-center items-center ripple-btn mb-3 ${(!!error || !location) ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-bfa-blue to-bfa-lightBlue hover:shadow-lg'}`}>
             {(!error && location) && <CheckCircle className="mr-2" size={24} />}
             {getButtonLabel()}
           </button>

           <button onClick={handleCancelClick} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 font-medium flex justify-center items-center transition-colors">
             <X size={16} className="mr-1" /> Cancelar y Volver
           </button>
        </div>

        <div className="mt-8">
            <h3 className="text-bfa-blue font-bold text-sm mb-3 flex items-center"><List size={16} className="mr-2"/> Historial de Hoy</h3>
            {dailyHistory.length === 0 ? (
                <div className="text-center py-6 bg-white rounded-xl shadow-sm border border-gray-100"><p className="text-gray-400 text-sm italic">No hay registros hoy</p></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {dailyHistory.map((p, idx) => (
                        <div key={p.id} className={`p-3 flex justify-between items-center ${idx !== dailyHistory.length - 1 ? 'border-b border-gray-100' : ''}`}>
                             <div className="flex items-center">
                                 <div className={`w-2 h-2 rounded-full mr-3 ${p.type === PunchType.ENTRY ? 'bg-bfa-blue' : p.type === PunchType.EXIT ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                 <div>
                                     <p className="text-xs font-bold text-gray-700">{p.type}</p>
                                     <p className="text-[10px] text-gray-500">{new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                 </div>
                             </div>
                             <div className="text-right">
                                 {p.mood && <span className="mr-2 text-xs" title={`Ánimo: ${p.mood}`}>😊</span>}
                                 {p.isLate && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Tarde</span>}
                                 {p.isEarly && <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">Salida Temp.</span>}
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default PunchPage;
