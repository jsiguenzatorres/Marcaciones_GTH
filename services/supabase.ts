import { createClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN DE CONEXIÓN ---
// URL del Proyecto
export const SUPABASE_URL = 'https://hsjtutlxrrohkjxbwfgd.supabase.co';
// Llave JWT Anon Key (Pública)
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzanR1dGx4cnJvaGtqeGJ3ZmdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTQ4NjksImV4cCI6MjA4MDE5MDg2OX0.fU6EfZ6GjXICWXFqkUzWKlUbo0Y021qPYlN9Zrpzjl4';

// CORRECCIÓN: Usar directamente las constantes manuales. 
// Eliminar process.env totalmente.
const supabaseUrl = SUPABASE_URL.trim();
const supabaseAnonKey = SUPABASE_ANON_KEY.trim();

let client = null;

if (supabaseUrl && supabaseAnonKey) {
    try {
        // En entornos Sandbox/Iframe (como Google AI Studio), el acceso a localStorage puede fallar
        // o estar bloqueado, lo que causa que el cliente de Supabase falle antes de hacer fetch.
        // Desactivamos la persistencia de sesión para evitar este bloqueo.
        client = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: false, // CRÍTICO: Desactivar para evitar errores de almacenamiento en sandbox
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });
    } catch (error) {
        console.error("Error inicializando Supabase Client:", error);
    }
} else {
  console.warn(
    'BFA Asistencia: Faltan credenciales de Supabase. La app funcionará en modo Offline (localStorage).'
  );
}

export const supabase = client;

export const isSupabaseConfigured = () => !!supabase;