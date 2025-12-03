
import { DeviceConfig, Punch, Note, Badge } from '../types';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';

const KEYS = {
  CONFIG: 'bfa_device_config',
  PUNCHES: 'bfa_punches',
  NOTES: 'bfa_notes',
  BADGES: 'bfa_badges', // Local cache for badges
};

// --- Helper UUID Seguro ---
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// --- Device Configuration ---

export const getDeviceConfig = (): DeviceConfig | null => {
  const data = localStorage.getItem(KEYS.CONFIG);
  return data ? JSON.parse(data) : null;
};

export const saveDeviceConfig = (config: DeviceConfig) => {
  localStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
};

// --- Master Data Fetching ---

export const fetchEmployeeFromMaster = async (code: string) => {
    if (!supabase) return null;
    
    try {
        const cleanCode = code.trim();
        console.log(`Buscando empleado: "${cleanCode}" en Supabase...`);

        // Diagnóstico: Petición HTTP directa si falla la librería (Fallback para Sandboxes)
        // Intentamos usar la librería primero
        try {
            const { data, error } = await supabase
                .from('employee_master')
                .select('*')
                .eq('employee_code', cleanCode)
                .maybeSingle();

            if (!error && data) {
                if (data.active === false) return null;
                return mapEmployeeData(data);
            }
            if (error) throw error; // Forzar catch si hay error de librería
        } catch (libError: any) {
            console.warn("⚠️ Librería Supabase falló, intentando Fallback HTTP...", libError);
            
            // FALLBACK: Fetch directo a la API REST (Bypasses library limitations)
            // Usamos las credenciales importadas desde services/supabase.ts
            
            if (SUPABASE_URL && SUPABASE_ANON_KEY) {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/employee_master?employee_code=eq.${encodeURIComponent(cleanCode)}&select=*`, {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                });
                
                if (response.ok) {
                    const rows = await response.json();
                    if (rows.length > 0) {
                        const data = rows[0];
                        if (data.active === false) return null;
                        return mapEmployeeData(data);
                    }
                }
            }
        }
        return null;
    } catch (e) {
        console.error("Error buscando empleado:", e);
        return null;
    }
};

const mapEmployeeData = (data: any) => ({
    employeeCode: data.employee_code,
    employeeName: data.full_name,
    position: data.position,
    assignedPhone: data.assigned_phone,
    immediateManager: data.immediate_manager,
    officeLat: data.office_lat,
    officeLng: data.office_lng
});

// --- Punches (Marcaciones) ---

export const getPunches = (): Punch[] => {
  const data = localStorage.getItem(KEYS.PUNCHES);
  return data ? JSON.parse(data) : [];
};

export const savePunch = async (punch: Punch): Promise<void> => {
  const punches = getPunches();
  const existingIndex = punches.findIndex(p => p.id === punch.id);
  if (existingIndex >= 0) {
      punches[existingIndex] = punch;
  } else {
      punches.push(punch);
  }
  localStorage.setItem(KEYS.PUNCHES, JSON.stringify(punches));

  if (supabase) {
    try {
      const { error } = await supabase.from('punches').upsert({
        id: punch.id,
        employee_code: punch.employeeCode,
        timestamp: punch.timestamp,
        type: punch.type,
        gps_lat: punch.gpsLat,
        gps_lng: punch.gpsLng,
        geo_accuracy: punch.geoAccuracy,
        reason: punch.reason,
        authorized_by: punch.authorizedBy,
        comments: punch.comments,
        device_id: getDeviceConfig()?.deviceId,
        device_type: punch.deviceType, 
        is_late: punch.isLate,
        is_early: punch.isEarly,
        mood: punch.mood // Save Mood
      });

      if (!error) {
        const updatedPunches = getPunches().map(p => 
          p.id === punch.id ? { ...p, synced: true } : p
        );
        localStorage.setItem(KEYS.PUNCHES, JSON.stringify(updatedPunches));
      }
    } catch (e) {
      console.error("Sync error:", e);
    }
  }
};

// --- Badges (Gamification) ---

export const getBadges = (): Badge[] => {
    const data = localStorage.getItem(KEYS.BADGES);
    return data ? JSON.parse(data) : [];
};

export const saveBadge = async (badge: Badge): Promise<void> => {
    const badges = getBadges();
    // Avoid duplicates
    if (badges.some(b => b.badgeId === badge.badgeId)) return;
    
    badges.push(badge);
    localStorage.setItem(KEYS.BADGES, JSON.stringify(badges));

    if (supabase) {
        try {
            const config = getDeviceConfig();
            await supabase.from('earned_badges').insert({
                employee_code: config?.employeeCode,
                badge_id: badge.badgeId,
                earned_at: badge.earnedAt
            });
        } catch (e) {
            console.error("Error saving badge:", e);
        }
    }
};

export const syncBadgesFromCloud = async () => {
    if (!supabase) return;
    const config = getDeviceConfig();
    if (!config) return;

    try {
        const { data } = await supabase
            .from('earned_badges')
            .select('*')
            .eq('employee_code', config.employeeCode);
        
        if (data) {
            const localBadges = getBadges();
            let changed = false;
            
            // Simple mapping from ID to Metadata (In a real app, this would be a constant lookup)
            const badgeMeta: Record<string, any> = {
                'early_bird': { name: 'Madrugador', description: '5 entradas consecutivas antes de las 8:00 AM', icon: '🌅', color: 'bg-yellow-100 text-yellow-700' },
                'perfect_week': { name: 'Semana Perfecta', description: 'Asistencia completa sin tardanzas en la semana', icon: '🏆', color: 'bg-bfa-gold text-white' },
                'night_owl': { name: 'Noctámbulo', description: 'Salida después de las 7:00 PM', icon: '🦉', color: 'bg-indigo-100 text-indigo-700' }
            };

            data.forEach((row: any) => {
                if (!localBadges.some(b => b.badgeId === row.badge_id)) {
                    const meta = badgeMeta[row.badge_id];
                    if (meta) {
                        localBadges.push({
                            id: row.id,
                            badgeId: row.badge_id,
                            earnedAt: row.earned_at,
                            ...meta
                        });
                        changed = true;
                    }
                }
            });

            if (changed) {
                localStorage.setItem(KEYS.BADGES, JSON.stringify(localBadges));
            }
        }
    } catch (e) {
        console.error("Badge sync error:", e);
    }
};

// --- Notes ---

export const saveNote = async (note: Note): Promise<void> => {
  const notes = localStorage.getItem(KEYS.NOTES);
  const parsedNotes: Note[] = notes ? JSON.parse(notes) : [];
  parsedNotes.push(note);
  localStorage.setItem(KEYS.NOTES, JSON.stringify(parsedNotes));

  if (supabase) {
    const { error } = await supabase.from('notes').insert({
      id: note.id,
      employee_code: note.employeeCode,
      category: note.category,
      content: note.content,
      timestamp: note.timestamp
    });
  }
};

// --- Synchronization (Cloud -> Local) ---

export const syncDataFromCloud = async (): Promise<number> => {
    if (!supabase) return 0;

    const config = getDeviceConfig();
    if (!config || !config.employeeCode) return 0;

    try {
        // Sync Badges first
        await syncBadgesFromCloud();

        const { data: serverPunches, error: punchError } = await supabase
            .from('punches')
            .select('*')
            .eq('employee_code', config.employeeCode)
            .order('timestamp', { ascending: false })
            .limit(100);

        let newItemsCount = 0;

        if (!punchError && serverPunches) {
            const localPunches = getPunches();
            const localIds = new Set(localPunches.map(p => p.id));
            
            serverPunches.forEach((sp: any) => {
                if (!localIds.has(sp.id)) {
                    localPunches.push({
                        id: sp.id,
                        employeeCode: sp.employee_code,
                        timestamp: sp.timestamp,
                        type: sp.type,
                        gpsLat: sp.gps_lat,
                        gpsLng: sp.gps_lng,
                        geoAccuracy: sp.geo_accuracy,
                        reason: sp.reason,
                        authorizedBy: sp.authorized_by,
                        comments: sp.comments,
                        synced: true,
                        isLate: sp.is_late,
                        isEarly: sp.is_early,
                        deviceType: sp.device_type || 'Mobile',
                        mood: sp.mood
                    });
                    newItemsCount++;
                } else {
                    const idx = localPunches.findIndex(p => p.id === sp.id);
                    if (idx >= 0 && !localPunches[idx].synced) {
                        localPunches[idx].synced = true;
                    }
                }
            });

            if (newItemsCount > 0) {
                localPunches.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                localStorage.setItem(KEYS.PUNCHES, JSON.stringify(localPunches));
            }
        }

        return newItemsCount;
    } catch (err) {
        console.error("Cloud Sync Error:", err);
        return 0;
    }
};

export { generateUUID };