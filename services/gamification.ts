
import { Punch, PunchType, Badge } from '../types';
import { getPunches, saveBadge, generateUUID, getBadges } from './storage';

// Definición de medallas disponibles
const BADGE_DEFINITIONS = {
    'early_bird': {
        name: 'Madrugador',
        description: 'Llegar antes de las 8:00 AM en 3 ocasiones consecutivas.',
        icon: '🌅',
        color: 'bg-yellow-100 text-yellow-700'
    },
    'perfect_week': {
        name: 'Semana Perfecta',
        description: 'Asistencia completa sin tardanzas en los últimos 5 días.',
        icon: '🏆',
        color: 'bg-bfa-gold text-white'
    },
    'night_owl': {
        name: 'Noctámbulo',
        description: 'Registrar salida después de las 7:00 PM.',
        icon: '🦉',
        color: 'bg-indigo-100 text-indigo-700'
    }
};

export const checkAndAwardBadges = async () => {
    const punches = getPunches().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Newest first
    const existingBadges = getBadges().map(b => b.badgeId);
    
    const earned: Badge[] = [];

    // 1. Check "Madrugador" (Early Bird) - 3 consecutive entries before 8AM
    if (!existingBadges.includes('early_bird')) {
        const entries = punches.filter(p => p.type === PunchType.ENTRY);
        let consecutiveEarly = 0;
        for (const entry of entries) {
            const hour = new Date(entry.timestamp).getHours();
            if (hour < 8) {
                consecutiveEarly++;
            } else {
                break; // Streak broken
            }
        }
        if (consecutiveEarly >= 3) {
            await award('early_bird');
        }
    }

    // 2. Check "Noctambulo" (Night Owl) - Exit after 19:00 (7 PM)
    if (!existingBadges.includes('night_owl')) {
        const lastExit = punches.find(p => p.type === PunchType.EXIT);
        if (lastExit) {
            const hour = new Date(lastExit.timestamp).getHours();
            if (hour >= 19) {
                await award('night_owl');
            }
        }
    }

    // Helper to award
    async function award(badgeId: keyof typeof BADGE_DEFINITIONS) {
        const def = BADGE_DEFINITIONS[badgeId];
        const newBadge: Badge = {
            id: generateUUID(),
            badgeId,
            name: def.name,
            description: def.description,
            icon: def.icon,
            color: def.color,
            earnedAt: new Date().toISOString()
        };
        await saveBadge(newBadge);
        earned.push(newBadge);
    }

    return earned;
};
