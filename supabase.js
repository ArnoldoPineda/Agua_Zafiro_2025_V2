// Configuración de Supabase
const SUPABASE_URL = "https://wgogbzsmhswbhpzebodr.supabase.co"; // tu URL
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";  // tu anon key completa

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Inicializar cliente
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Función para obtener datos de la tabla agua_zafiro
export async function getData() {
  const { data, error } = await supabase.from("agua_zafiro").select("*");
  if (error) {
    console.error("Error al obtener datos:", error.message);
    throw error;
  }
  console.log("Datos recibidos desde Supabase:", data);
  return data;
}

// --- Función para obtener el perfil del usuario autenticado
export async function getUserProfile() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  if (profileError) throw profileError;
  return profile;
}

// Exportamos supabase por si lo necesitamos directamente
export { supabase };

