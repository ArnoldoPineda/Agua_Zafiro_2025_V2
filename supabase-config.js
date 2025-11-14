// ============================================
  // CONFIGURACIÓN DE SUPABASE - AGUA ZAFIRO
  // ============================================

  // Configuración de conexión
  const SUPABASE_URL = 'https://hjrplwxvyukevcljodyg.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcnBsd3h2eXVrZXZjbGpvZHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzUzMzQsImV4cCI6MjA3MzYxMTMzNH0.uJ-krjLrFVo7cHuIQQb1-x2wQzXwyZfcvg4XvnppkqE';

  // Crear cliente de Supabase
  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log('🔗 Cliente de Supabase inicializado correctamente');

  // ============================================
  // MÓDULO DE AUTENTICACIÓN
  // ============================================

  const SupabaseAuth = {
    /**
     * Iniciar sesión
     */
    async login(username, password) {
      try {
        console.log(`🔐 Intentando login para: ${username}`);

        // Buscar usuario en la tabla 'users'
        const { data: users, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password_hash', password)  // ✅ NOMBRE CORRECTO
    .single();

        if (error || !users) {
          console.error('❌ Usuario o contraseña incorrectos');
          return { 
            success: false, 
            error: 'Usuario o contraseña incorrectos' 
          };
        }

        // Guardar usuario en localStorage
        const userData = {
          id: users.id,
          username: users.username,
          full_name: users.full_name,
          email: users.email,
          role: users.role,
          is_active: users.is_active,
          created_at: users.created_at
        };

        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loginTime', new Date().toISOString());

        console.log('✅ Login exitoso:', userData.username);
        return { success: true, user: userData };

      } catch (error) {
        console.error('❌ Error en login:', error);
        return { 
          success: false, 
          error: 'Error al iniciar sesión. Intente nuevamente.' 
        };
      }
    },

    /**
     * Cerrar sesión
     */
    logout() {
      try {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('loginTime');
        console.log('🚪 Sesión cerrada correctamente');
        return { success: true };
      } catch (error) {
        console.error('❌ Error al cerrar sesión:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Obtener usuario actual
     */
    getCurrentUser() {
      try {
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) {
          console.log('ℹ️ No hay usuario en sesión');
          return null;
        }

        const user = JSON.parse(userStr);
        return user;
      } catch (error) {
        console.error('❌ Error al obtener usuario actual:', error);
        return null;
      }
    },

    /**
     * Verificar si hay sesión activa
     */
    isLoggedIn() {
      const isLogged = localStorage.getItem('isLoggedIn') === 'true';
      const currentUser = this.getCurrentUser();
      return isLogged && currentUser !== null;
    },

    /**
     * Obtener tiempo de sesión
     */
    getSessionDuration() {
      const loginTime = localStorage.getItem('loginTime');
      if (!loginTime) return null;

      const now = new Date();
      const login = new Date(loginTime);
      const duration = Math.floor((now - login) / 1000); // en segundos

      return {
        seconds: duration,
        minutes: Math.floor(duration / 60),
        hours: Math.floor(duration / 3600)
      };
    }
  };

  // ============================================
  // MÓDULO DE DATOS (VENTAS Y GASTOS)
  // ============================================

  const SupabaseData = {
    /**
     * Guardar venta
     */
    async guardarVenta(ventaData) {
      try {
        const currentUser = SupabaseAuth.getCurrentUser();
        if (!currentUser) throw new Error('Usuario no autenticado');

        const { data, error } = await supabaseClient
          .from('sales')
          .insert({
            ...ventaData,
            created_by: currentUser.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        console.log('✅ Venta guardada:', data.id);
        return { success: true, data };
      } catch (error) {
        console.error('❌ Error guardando venta:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Obtener ventas
     */
    async obtenerVentas(filtros = {}) {
      try {
        let query = supabaseClient
          .from('sales')
          .select('*')
          .order('fecha', { ascending: false });

        if (filtros.fecha_desde) {
          query = query.gte('fecha', filtros.fecha_desde);
        }

        if (filtros.fecha_hasta) {
          query = query.lte('fecha', filtros.fecha_hasta);
        }

        if (filtros.vendedor) {
          query = query.eq('vendedor', filtros.vendedor);
        }

        const { data, error } = await query;
        if (error) throw error;

        return { success: true, data };
      } catch (error) {
        console.error('❌ Error obteniendo ventas:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Guardar gasto
     */
    async guardarGasto(gastoData) {
      try {
        const currentUser = SupabaseAuth.getCurrentUser();
        if (!currentUser) throw new Error('Usuario no autenticado');

        const { data, error } = await supabaseClient
          .from('expenses')
          .insert({
            ...gastoData,
            created_by: currentUser.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        console.log('✅ Gasto guardado:', data.id);
        return { success: true, data };
      } catch (error) {
        console.error('❌ Error guardando gasto:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Obtener gastos
     */
    async obtenerGastos(filtros = {}) {
      try {
        let query = supabaseClient
          .from('expenses')
          .select('*')
          .order('fecha', { ascending: false });

        if (filtros.fecha_desde) {
          query = query.gte('fecha', filtros.fecha_desde);
        }

        if (filtros.fecha_hasta) {
          query = query.lte('fecha', filtros.fecha_hasta);
        }

        const { data, error } = await query;
        if (error) throw error;

        return { success: true, data };
      } catch (error) {
        console.error('❌ Error obteniendo gastos:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Obtener resumen diario
     */
    async obtenerResumenDiario(fecha) {
      try {
        // Obtener ventas del día
        const { data: ventas } = await supabaseClient
          .from('sales')
          .select('monto_total')
          .eq('fecha', fecha);

        // Obtener gastos del día
        const { data: gastos } = await supabaseClient
          .from('expenses')
          .select('monto')
          .eq('fecha', fecha);

        const totalVentas = ventas?.reduce((sum, v) => sum + parseFloat(v.monto_total || 0), 0) || 0;
        const totalGastos = gastos?.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0) || 0;

        return {
          success: true,
          data: {
            fecha,
            totalVentas,
            totalGastos,
            utilidad: totalVentas - totalGastos,
            cantidadVentas: ventas?.length || 0,
            cantidadGastos: gastos?.length || 0
          }
        };
      } catch (error) {
        console.error('❌ Error obteniendo resumen diario:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Guardar registro diario completo (daily_records + ventas + gastos + créditos)
     * VERSIÓN MEJORADA CON UPSERT
     */
    async saveRegistroDiario(fecha, datos) {
      try {
        const currentUser = SupabaseAuth.getCurrentUser();
        if (!currentUser) throw new Error('Usuario no autenticado');

        console.log('💾 Guardando registro diario completo:', fecha);

        // PASO 1: UPSERT daily_record (crear si no existe, actualizar si existe)
        const { data: dailyRecord, error: upsertError } = await supabaseClient
          .from('daily_records')
          .upsert({
            fecha: fecha,
            caja_inicial: parseFloat(datos.cajaInicial) || 0,
            observaciones: datos.observaciones || '',
            created_by: currentUser.id,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'fecha'
          })
          .select()
          .single();

        if (upsertError) throw upsertError;

        const recordId = dailyRecord.id;
        console.log('✅ Registro guardado/actualizado:', recordId);

        // PASO 2: Eliminar datos antiguos de este día (ventas, gastos, créditos)
        await Promise.all([
          supabaseClient.from('sales').delete().eq('daily_record_id', recordId),
          supabaseClient.from('expenses').delete().eq('daily_record_id', recordId),
          supabaseClient.from('credits').delete().eq('daily_record_id', recordId)
        ]);

        console.log('✅ Datos antiguos eliminados');

        // PASO 3: Insertar ventas
        if (datos.ventas && datos.ventas.length > 0) {
          const ventasData = datos.ventas
            .filter(v => v.vendedor && v.ciudad && v.producto)
            .map((venta, idx) => ({
              daily_record_id: recordId,
              vendedor: venta.vendedor,
              ciudad: venta.ciudad,
              producto: venta.producto,
              cantidad: parseInt(venta.cantidad) || 0,
              precio: parseFloat(venta.precio) || 0,
              total: parseFloat(venta.total) || 0,
              orden: idx + 1,
              created_at: new Date().toISOString()
            }));

          if (ventasData.length > 0) {
            const { error: ventasError } = await supabaseClient
              .from('sales')
              .insert(ventasData);

            if (ventasError) throw ventasError;
            console.log(`✅ ${ventasData.length} ventas guardadas`);
          }
        }

        // PASO 4: Insertar gastos
        if (datos.gastos && datos.gastos.length > 0) {
          const gastosData = datos.gastos
            .filter(g => g.categoria && g.monto)
            .map((gasto, idx) => ({
              daily_record_id: recordId,
              categoria: gasto.categoria,
              descripcion: gasto.descripcion || '',
              monto: parseFloat(gasto.monto) || 0,
              orden: idx + 1,
              created_at: new Date().toISOString()
            }));

          if (gastosData.length > 0) {
            const { error: gastosError } = await supabaseClient
              .from('expenses')
              .insert(gastosData);

            if (gastosError) throw gastosError;
            console.log(`✅ ${gastosData.length} gastos guardados`);
          }
        }

        // PASO 5: Insertar créditos
        if (datos.creditos && datos.creditos.length > 0) {
          const creditosData = datos.creditos
            .filter(c => c.categoria && c.monto)
            .map((credito, idx) => ({
              daily_record_id: recordId,
              categoria: credito.categoria,
              detalle: credito.detalle || '',
              monto: parseFloat(credito.monto) || 0,
              orden: idx + 1,
              created_at: new Date().toISOString()
            }));

          if (creditosData.length > 0) {
            const { error: creditosError } = await supabaseClient
              .from('credits')
              .insert(creditosData);

            if (creditosError) throw creditosError;
            console.log(`✅ ${creditosData.length} créditos guardados`);
          }
        }

        return { 
          success: true, 
          data: { 
            recordId, 
            fecha,
            ventasCount: datos.ventas?.length || 0,
            gastosCount: datos.gastos?.length || 0,
            creditosCount: datos.creditos?.length || 0
          } 
        };

      } catch (error) {
        console.error('❌ Error guardando registro diario:', error);
        return { success: false, error: error.message };
      }
    }
  };

  // ============================================
  // MÓDULO DE PRODUCCIÓN
  // ============================================

  const SupabaseProduccion = {
    /**
     * Crear orden de producción
     */
    async crearOrdenProduccion(data) {
      try {
        const currentUser = SupabaseAuth.getCurrentUser();
        if (!currentUser) throw new Error('Usuario no autenticado');

        const { data: orden, error } = await supabaseClient
          .from('ordenes_produccion')
          .insert({
            producto: data.producto,
            cantidad_planificada: parseFloat(data.cantidad_planificada),
            operador: data.operador || currentUser.username,
            observaciones: data.observaciones || '',
            created_by: currentUser.id
          })
          .select()
          .single();

        if (error) throw error;
        console.log('✅ Orden de producción creada:', orden.id);
        return { success: true, data: orden };
      } catch (error) {
        console.error('❌ Error creando orden:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Obtener órdenes de producción
     */
    async obtenerOrdenesProduccion(filtros = {}) {
      try {
        let query = supabaseClient
          .from('ordenes_produccion')
          .select('*')
          .order('fecha_orden', { ascending: false });

        if (filtros.estado) {
          query = query.eq('estado', filtros.estado);
        }

        if (filtros.fecha_desde) {
          query = query.gte('fecha_orden', filtros.fecha_desde);
        }

        const { data, error } = await query;
        if (error) throw error;

        return { success: true, data };
      } catch (error) {
        console.error('❌ Error obteniendo órdenes:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Obtener inventario
     */
    async obtenerInventario() {
      try {
        const { data, error } = await supabaseClient
          .from('inventario_materia_prima')
          .select('*')
          .eq('is_active', true)
          .order('material');

        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        console.error('❌ Error obteniendo inventario:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Registrar movimiento de inventario
     */
    async registrarMovimientoInventario(data) {
      try {
        const currentUser = SupabaseAuth.getCurrentUser();
        if (!currentUser) throw new Error('Usuario no autenticado');

        // Registrar el movimiento
        const { data: movimiento, error } = await supabaseClient
          .from('movimientos_inventario')
          .insert({
            tipo: data.tipo,
            material_id: data.material_id,
            cantidad: parseFloat(data.cantidad),
            motivo: data.motivo || '',
            usuario: currentUser.username
          })
          .select()
          .single();

        if (error) throw error;

        // Actualizar el inventario
        const { data: inventarioActual } = await supabaseClient
          .from('inventario_materia_prima')
          .select('cantidad')
          .eq('id', data.material_id)
          .single();

        if (inventarioActual) {
          const cantidadCambio = data.tipo === 'entrada' 
            ? parseFloat(data.cantidad) 
            : -parseFloat(data.cantidad);
          
          const nuevaCantidad = parseFloat(inventarioActual.cantidad) + cantidadCambio;

          const { error: updateError } = await supabaseClient
            .from('inventario_materia_prima')
            .update({
              cantidad: nuevaCantidad,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.material_id);

          if (updateError) {
            console.warn('⚠️ Error actualizando inventario:', updateError);
          }
        }

        return { success: true, data: movimiento };
      } catch (error) {
        console.error('❌ Error registrando movimiento:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Crear lote de producción
     */
    async crearLote(data) {
      try {
        const { data: lote, error } = await supabaseClient
          .from('lotes_produccion')
          .insert({
            orden_produccion_id: data.orden_produccion_id,
            numero_lote: data.numero_lote,
            fecha_produccion: data.fecha_produccion,
            fecha_vencimiento: data.fecha_vencimiento,
            producto: data.producto,
            cantidad: parseFloat(data.cantidad)
          })
          .select()
          .single();

        if (error) throw error;
        console.log('✅ Lote creado:', lote.numero_lote);
        return { success: true, data: lote };
      } catch (error) {
        console.error('❌ Error creando lote:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Registrar control de calidad
     */
    async registrarControlCalidad(data) {
      try {
        const { data: registro, error } = await supabaseClient
          .from('registros_calidad')
          .insert({
            lote_id: data.lote_id,
            ph: data.ph ? parseFloat(data.ph) : null,
            cloro_residual: data.cloro_residual ? parseFloat(data.cloro_residual) : null,
            turbidez: data.turbidez ? parseFloat(data.turbidez) : null,
            coliformes: data.coliformes || false,
            cumple: data.cumple || false,
            observaciones: data.observaciones || '',
            analista: data.analista
          })
          .select()
          .single();

        if (error) throw error;
        console.log('✅ Control de calidad registrado');
        return { success: true, data: registro };
      } catch (error) {
        console.error('❌ Error registrando calidad:', error);
        return { success: false, error: error.message };
      }
    }
  };

  // ============================================
  // EXPORTAR MÓDULOS GLOBALMENTE
  // ============================================

  window.SupabaseAuth = SupabaseAuth;
  window.SupabaseData = SupabaseData;
  window.SupabaseProduccion = SupabaseProduccion;
  window.supabaseClient = supabaseClient;

  console.log('✅ SupabaseAuth exportado globalmente');
  console.log('✅ SupabaseData exportado globalmente');
  console.log('✅ SupabaseProduccion exportado globalmente');
  console.log('🔒 Supabase configurado correctamente para Agua Zafiro');
  // ============================================
  // EXTENSIÓN PARA MÓDULO DE PRODUCCIÓN DIARIA
  // Agregar al final de supabase-config.js
  // ============================================

  // ===== CLASE PARA PRODUCCIÓN DIARIA =====
  class SupabaseProduccionDiaria {
    constructor(supabaseClient) {
      this.client = supabaseClient;
      console.log('📦 SupabaseProduccionDiaria inicializado');
    }

    // ========== CONTROL DE BOBINAS ==========
    
    /**
     * Registrar una bobina procesada
     */
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

    /**
     * Obtener bobinas del día
     */
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

    /**
     * Obtener resumen de bobinas por período
     */
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

    // ========== CONTROL DE CONTADOR DIARIO ==========
    
    /**
     * Iniciar contador del día
     */
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

    /**
     * Cerrar contador del día
     */
    async cerrarContadorDia(datos) {
      try {
        console.log('🔢 Cerrando contador del día:', datos);
        
        const fecha = datos.fecha || new Date().toISOString().split('T')[0];
        
        // Primero, obtener la suma de bolsitas del día
        const { data: bobinas } = await this.client
          .from('control_bobinas')
          .select('bolsitas_producidas')
          .eq('fecha', fecha);
        
        const bolsitasReales = bobinas?.reduce((sum, b) => sum + b.bolsitas_producidas, 0) || 0;
        
        // Obtener contador inicio
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
        
        // Actualizar registro
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

    /**
     * Obtener contador del día
     */
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
            return { success: true, data: null }; // No existe registro
          }
          throw error;
        }
        
        return { success: true, data };
        
      } catch (error) {
        console.error('❌ Error obteniendo contador:', error);
        return { success: false, error: error.message };
      }
    }

    // ========== CONTROL DE BOTELLONES ==========
    
    /**
     * Registrar producción de botellones
     */
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

    /**
     * Obtener botellones del día
     */
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

    /**
     * Obtener resumen de botellones por período
     */
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

    // ========== CONTROL DE CALIDAD DEL AGUA ==========
    
    /**
     * Registrar análisis de calidad del agua
     */
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

    /**
     * Obtener calidad del agua del día
     */
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

    /**
     * Obtener calidad reciente (últimos 30 días)
     */
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

    // ========== FUNCIONES DE RESUMEN ==========
    
    /**
     * Obtener resumen completo del día
     */
    async obtenerResumenDia(fecha) {
      try {
        const fechaConsulta = fecha || new Date().toISOString().split('T')[0];
        
        const [bobinas, contador, botellones, calidad] = await Promise.all([
          this.obtenerBobinasDelDia(fechaConsulta),
          this.obtenerContadorDia(fechaConsulta),
          this.obtenerBotellonesDelDia(fechaConsulta),
          this.obtenerCalidadDelDia(fechaConsulta)
        ]);
        
        // Calcular totales de bobinas
        const totalBolsitas = bobinas.data?.reduce((sum, b) => sum + b.bolsitas_producidas, 0) || 0;
        const totalRechazadas = bobinas.data?.reduce((sum, b) => sum + b.bolsitas_rechazadas, 0) || 0;
        const totalPacks = bobinas.data?.reduce((sum, b) => sum + b.packs_completos, 0) || 0;
        
        // Calcular totales de botellones
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

  // ===== AGREGAR A LA EXPORTACIÓN GLOBAL =====
  window.supabaseProduccionDiaria = new SupabaseProduccionDiaria(supabaseClient);
  console.log('✅ SupabaseProduccionDiaria disponible globalmente');
  console.log('✅ Módulo de Producción Diaria cargado');