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
  async login(username, password) {
    try {
      console.log(`🔐 Intentando login para: ${username}`);

      const { data: users, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', password)
        .single();

      if (error || !users) {
        console.error('❌ Usuario o contraseña incorrectos');
        return { success: false, error: 'Usuario o contraseña incorrectos' };
      }

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
      return { success: false, error: 'Error al iniciar sesión. Intente nuevamente.' };
    }
  },

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

  isLoggedIn() {
    const isLogged = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = this.getCurrentUser();
    return isLogged && currentUser !== null;
  },

  getSessionDuration() {
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) return null;

    const now = new Date();
    const login = new Date(loginTime);
    const duration = Math.floor((now - login) / 1000);

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

  async obtenerResumenDiario(fecha) {
    try {
      const { data: ventas } = await supabaseClient
        .from('sales')
        .select('monto_total')
        .eq('fecha', fecha);

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

  async saveRegistroDiario(fecha, datos) {
    try {
      const currentUser = SupabaseAuth.getCurrentUser();
      if (!currentUser) throw new Error('Usuario no autenticado');

      console.log('💾 Guardando registro diario completo:', fecha);

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

      await supabaseClient.from('sales').delete().eq('daily_record_id', recordId);
      await supabaseClient.from('expenses').delete().eq('daily_record_id', recordId);
      await supabaseClient.from('credits').delete().eq('daily_record_id', recordId);

      console.log('✅ Datos antiguos eliminados');

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
  },

  // 📋 FUNCIÓN PARA OBTENER CATÁLOGOS
  async getCatalogs() {
    try {
      console.log('📋 Obteniendo catálogos...');
      
      const catalogs = {
        vendedores: ['Brayan', 'Ariel', 'Bodega'],
        ciudades: ['Comayagua', 'Siguatepeque', 'Ajuterique', 'El Rosario', 'Flores', 'Zambrano', 'El Pantanal', 'Bodega'],
        productos: ['Botellones', 'Bolsas'],
        gastos: ['Combustible', 'Planilla Omar', 'Planilla Tomas', 'Planilla Brayan', 'Sales', 'Bobinas', 'Edgardo', 'Arreglo Vehículo', 'Arreglo Bodega', 'Electricidad', 'Cuota del Camión', 'Transferencia', 'Chapeada', 'Flete', 'Alquiler Vehículo', 'Préstamos Personales', 'Abonos a Deudas', 'Otros'],
        creditos: ['CORRAL LA VILLA', 'CORRAL TAMPISQUE', 'TRANSFERENCIAS POR VENTAS', 'OTROS']
      };
      
      return { success: true, data: catalogs };
    } catch (error) {
      console.error('❌ Error:', error);
      return { success: false, error: error.message };
    }
  }
};

// ============================================
// MÓDULO DE PRODUCCIÓN
// ============================================

const SupabaseProduccion = {
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

  async registrarMovimientoInventario(data) {
    try {
      const currentUser = SupabaseAuth.getCurrentUser();
      if (!currentUser) throw new Error('Usuario no autenticado');

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