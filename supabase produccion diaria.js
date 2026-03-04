// ============================================
// MÓDULO DE PRODUCCIÓN DIARIA - AGUA ZAFIRO
// ============================================

class SupabaseProduccionDiaria {
  constructor(supabaseClient) {
    this.client = supabaseClient;
    console.log('📦 SupabaseProduccionDiaria inicializado');
  }

  async registrarBobina(datos) {
    try {
      console.log('📦 Registrando bobina:', datos);

      const { data, error } = await this.client
        .from('control_bobinas')
        .insert([{
          fecha: datos.fecha || new Date().toISOString().split('T')[0],
          peso_bobina: parseFloat(datos.peso_bobina),
          bolsitas_producidas: parseInt(datos.bolsitas_producidas),
          bolsitas_rechazadas: parseInt(datos.bolsitas_rechazadas) || 0,
          motivo_rechazo: datos.motivo_rechazo || null,
          observaciones: datos.observaciones || null,
          operador: datos.operador || null
        }])
        .select();

      if (error) throw error;

      console.log('✅ Bobina registrada:', data);
      return { success: true, data: data[0] };

    } catch (error) {
      console.error('❌ Error registrando bobina:', error);
      return { success: false, error: error.message };
    }
  }

  async obtenerBobinasDelDia(fecha) {
    try {
      const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

      const { data, error } = await this.client
        .from('control_bobinas')
        .select('*')
        .eq('fecha', fechaConsulta)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };

    } catch (error) {
      console.error('❌ Error obteniendo bobinas:', error);
      return { success: false, error: error.message };
    }
  }

  async obtenerResumenBobinas(fechaInicio, fechaFin) {
    try {
      const { data, error } = await this.client
        .from('v_resumen_diario_bolsas')
        .select('*')
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .order('fecha', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };

    } catch (error) {
      console.error('❌ Error obteniendo resumen bobinas:', error);
      return { success: false, error: error.message };
    }
  }

  async iniciarContadorDia(datos) {
    try {
      console.log('🔢 Iniciando contador del día:', datos);

      const { data, error } = await this.client
        .from('control_contador_diario')
        .insert([{
          fecha: datos.fecha || new Date().toISOString().split('T')[0],
          contador_inicio: parseInt(datos.contador_inicio),
          operador: datos.operador || null
        }])
        .select();

      if (error) throw error;

      console.log('✅ Contador iniciado:', data);
      return { success: true, data: data[0] };

    } catch (error) {
      console.error('❌ Error iniciando contador:', error);
      return { success: false, error: error.message };
    }
  }

  async cerrarContadorDia(datos) {
    try {
      console.log('🔢 Cerrando contador del día:', datos);

      const fecha = datos.fecha || new Date().toISOString().split('T')[0];

      const { data: bobinas } = await this.client
        .from('control_bobinas')
        .select('bolsitas_producidas')
        .eq('fecha', fecha);

      const bolsitasReales = bobinas?.reduce((sum, b) => sum + b.bolsitas_producidas, 0) || 0;

      const { data: contadorDia } = await this.client
        .from('control_contador_diario')
        .select('contador_inicio')
        .eq('fecha', fecha)
        .single();

      if (!contadorDia) {
        throw new Error('No se encontró registro de inicio de contador para este día');
      }

      const diferenciaContador = parseInt(datos.contador_cierre) - contadorDia.contador_inicio;
      const factorAjuste = diferenciaContador > 0 ? (bolsitasReales / diferenciaContador) : null;

      const { data, error } = await this.client
        .from('control_contador_diario')
        .update({
          contador_cierre: parseInt(datos.contador_cierre),
          bolsitas_reales_registradas: bolsitasReales,
          factor_ajuste: factorAjuste,
          observaciones: datos.observaciones || null
        })
        .eq('fecha', fecha)
        .select();

      if (error) throw error;

      console.log('✅ Contador cerrado:', data);
      return { success: true, data: data[0] };

    } catch (error) {
      console.error('❌ Error cerrando contador:', error);
      return { success: false, error: error.message };
    }
  }

  async obtenerContadorDia(fecha) {
    try {
      const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

      const { data, error } = await this.client
        .from('control_contador_diario')
        .select('*')
        .eq('fecha', fechaConsulta)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: true, data: null };
        }
        throw error;
      }

      return { success: true, data };

    } catch (error) {
      console.error('❌ Error obteniendo contador:', error);
      return { success: false, error: error.message };
    }
  }

  async registrarBotellones(datos) {
    try {
      console.log('🍶 Registrando botellones:', datos);

      const { data, error } = await this.client
        .from('control_botellones')
        .insert([{
          fecha: datos.fecha || new Date().toISOString().split('T')[0],
          hora_inicio: datos.hora_inicio,
          hora_cierre: datos.hora_cierre,
          botellones_producidos: parseInt(datos.botellones_producidos),
          botellones_rechazados: parseInt(datos.botellones_rechazados) || 0,
          motivo_rechazo: datos.motivo_rechazo || null,
          observaciones: datos.observaciones || null,
          operador: datos.operador || null
        }])
        .select();

      if (error) throw error;

      console.log('✅ Botellones registrados:', data);
      return { success: true, data: data[0] };

    } catch (error) {
      console.error('❌ Error registrando botellones:', error);
      return { success: false, error: error.message };
    }
  }

  async obtenerBotellonesDelDia(fecha) {
    try {
      const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

      const { data, error } = await this.client
        .from('control_botellones')
        .select('*')
        .eq('fecha', fechaConsulta)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };

    } catch (error) {
      console.error('❌ Error obteniendo botellones:', error);
      return { success: false, error: error.message };
    }
  }

  async obtenerResumenBotellones(fechaInicio, fechaFin) {
    try {
      const { data, error } = await this.client
        .from('v_resumen_botellones')
        .select('*')
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .order('fecha', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };

    } catch (error) {
      console.error('❌ Error obteniendo resumen botellones:', error);
      return { success: false, error: error.message };
    }
  }

  async registrarCalidadAgua(datos) {
    try {
      console.log('💧 Registrando calidad del agua:', datos);

      const { data, error } = await this.client
        .from('control_calidad_agua')
        .insert([{
          fecha: datos.fecha || new Date().toISOString().split('T')[0],
          tds: parseFloat(datos.tds),
          usm: parseFloat(datos.usm),
          temperatura: parseFloat(datos.temperatura),
          ph: parseFloat(datos.ph),
          cumple_estandares: datos.cumple_estandares !== false,
          observaciones: datos.observaciones || null,
          analista: datos.analista || null
        }])
        .select();

      if (error) throw error;

      console.log('✅ Calidad registrada:', data);
      return { success: true, data: data[0] };

    } catch (error) {
      console.error('❌ Error registrando calidad:', error);
      return { success: false, error: error.message };
    }
  }

  async obtenerCalidadDelDia(fecha) {
    try {
      const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

      const { data, error } = await this.client
        .from('control_calidad_agua')
        .select('*')
        .eq('fecha', fechaConsulta)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };

    } catch (error) {
      console.error('❌ Error obteniendo calidad:', error);
      return { success: false, error: error.message };
    }
  }

  async obtenerCalidadReciente() {
    try {
      const { data, error } = await this.client
        .from('v_calidad_agua_reciente')
        .select('*');

      if (error) throw error;

      return { success: true, data: data || [] };

    } catch (error) {
      console.error('❌ Error obteniendo calidad reciente:', error);
      return { success: false, error: error.message };
    }
  }

  async obtenerResumenDia(fecha) {
    try {
      const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

      const [bobinas, contador, botellones, calidad] = await Promise.all([
        this.obtenerBobinasDelDia(fechaConsulta),
        this.obtenerContadorDia(fechaConsulta),
        this.obtenerBotellonesDelDia(fechaConsulta),
        this.obtenerCalidadDelDia(fechaConsulta)
      ]);

      const totalBolsitas = bobinas.data?.reduce((sum, b) => sum + b.bolsitas_producidas, 0) || 0;
      const totalRechazadas = bobinas.data?.reduce((sum, b) => sum + b.bolsitas_rechazadas, 0) || 0;
      const totalPacks = bobinas.data?.reduce((sum, b) => sum + b.packs_completos, 0) || 0;

      const totalBotellones = botellones.data?.reduce((sum, b) => sum + b.botellones_producidos, 0) || 0;
      const totalBotellonesRechazados = botellones.data?.reduce((sum, b) => sum + b.botellones_rechazados, 0) || 0;

      return {
        success: true,
        data: {
          fecha: fechaConsulta,
          bobinas: {
            registros: bobinas.data || [],
            total_bolsitas: totalBolsitas,
            total_rechazadas: totalRechazadas,
            total_packs: totalPacks,
            cantidad_bobinas: bobinas.data?.length || 0
          },
          contador: contador.data || null,
          botellones: {
            registros: botellones.data || [],
            total_producidos: totalBotellones,
            total_rechazados: totalBotellonesRechazados,
            cantidad_registros: botellones.data?.length || 0
          },
          calidad: calidad.data || []
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo resumen del día:', error);
      return { success: false, error: error.message };
    }
  }
}

// Inicializar y exportar globalmente
if (typeof supabaseClient !== 'undefined') {
  window.supabaseProduccionDiaria = new SupabaseProduccionDiaria(supabaseClient);
  console.log('✅ SupabaseProduccionDiaria disponible globalmente');
}