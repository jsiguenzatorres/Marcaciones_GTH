export enum PunchType {
  ENTRY = 'Entrada Principal',
  EXIT = 'Salida Principal',
  OCCASIONAL_EXIT = 'Salida Ocasional'
}

export enum OccasionalReason {
  PERSONAL = 'Trámite Personal',
  EMERGENCY = 'Emergencia Familiar',
  MEDICAL = 'Cita Médica',
  OFFICIAL = 'Misión Oficial',
  TRAINING = 'Capacitación',
  OTHER = 'Otros'
}

export type MoodType = 'happy' | 'neutral' | 'tired' | 'stressed' | 'excited';

export interface DeviceConfig {
  deviceId: string;
  employeeCode: string;
  employeeName: string;
  position: string;
  assignedPhone: string;
  immediateManager: string;
  officeLat: number;
  officeLng: number;
  configuredAt: string;
}

export interface Punch {
  id: string;
  employeeCode: string;
  timestamp: string;
  type: PunchType;
  gpsLat: number;
  gpsLng: number;
  geoAccuracy: number;
  reason?: string;
  authorizedBy?: string;
  comments?: string;
  synced: boolean;
  // New Business Logic Fields
  isLate?: boolean;
  isEarly?: boolean;
  deviceType?: 'Mobile' | 'Desktop';
  mood?: MoodType; // Mood Tracker
}

export interface Badge {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name or emoji
  color: string;
  earnedAt: string;
}

export interface Note {
  id: string;
  employeeCode: string;
  category: 'Nota' | 'Comentario' | 'Sugerencia' | 'Queja' | 'Varios' | 'Justificación';
  content: string;
  timestamp: string;
}

export const OFFICE_GEOFENCE_RADIUS_METERS = 500;