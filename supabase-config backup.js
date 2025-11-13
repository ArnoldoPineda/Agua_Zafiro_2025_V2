// 🔑 CONFIGURACIÓN DE SUPABASE - AGUA ZAFIRO
// Conecta el frontend con la base de datos Supabase

const SUPABASE_URL = 'https://hjrplwxvyukevcljodyg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcnBsd3h2eXVrZXZjbGpvZHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzUzMzQsImV4cCI6MjA3MzYxMTMzNH0.uJ-krjLrFVo7cHuIQQb1-x2wQzXwyZfcvg4XvnppkqE';

// 📡 INICIALIZAR CLIENTE SUPABASE
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 🔐 FUNCIONES DE AUTENTICACIÓN
const SupabaseAuth = {
    // Verificar usuario
    async login(username, password) {
        try {
            // Buscar usuario en BD
            const { data: users, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('username', username)
                .eq('password_hash', `$2a$10$example_${username}_hash`)
                .single();

            if (error || !users) {
                return { success: false, error: 'Usuario o contraseña incorrectos' };
            }

            if (!users.is_active) {
                return { success: false, error: 'Usuario inactivo' };
            }

            // Guardar en localStorage (temporal)
            localStorage.setItem('currentUser', JSON.stringify({
                id: users.id,
                username: users.username,
                role: users.role,
                full_name: users.full_name
            }));

            return { 
                success: true, 
                user: {
                    id: users.id,
                    username: users.username,
                    role: users.role,
                    full_name: users.full_name
                }
            };
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, error: 'Error de conexión' };
        }
    },

    // Obtener usuario actual
    getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },

    // Cerrar sesión
    logout() {
        localStorage.removeItem('currentUser');
        return { success: true };
    },

    // Verificar si está logueado
    isLoggedIn() {
        return localStorage.getItem('currentUser') !== null;
    }
};

// 📊 FUNCIONES DE DATOS
const SupabaseData = {
    // Obtener catálogos
    async getCatalogs(tipo) {
        try {
            const { data, error } = await supabaseClient
                .from('catalogs')
                .select('*')
                .eq('tipo', tipo)
                .eq('is_active', true)
                .order('orden');

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error(`Error obteniendo catálogo ${tipo}:`, error);
            return { success: false, error: error.message };
        }
    },

    // Guardar registro diario completo
    async saveRegistroDiario(fecha, data) {
        try {
            const currentUser = SupabaseAuth.getCurrentUser();
            if (!currentUser) throw new Error('Usuario no autenticado');

            // 1. Crear o actualizar registro diario
            const { data: dailyRecord, error: dailyError } = await supabaseClient
                .from('daily_records')
                .upsert({
                    fecha: fecha,
                    caja_inicial: parseFloat(data.cajaInicial || 0),
                    observaciones: data.observaciones || '',
                    created_by: currentUser.id,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (dailyError) throw dailyError;

            // 2. Limpiar datos existentes del día
            await supabaseClient.from('sales').delete().eq('daily_record_id', dailyRecord.id);
            await supabaseClient.from('expenses').delete().eq('daily_record_id', dailyRecord.id);
            await supabaseClient.from('credits').delete().eq('daily_record_id', dailyRecord.id);

            // 3. Insertar ventas
            if (data.ventas && data.ventas.length > 0) {
                const ventasToInsert = data.ventas.map((venta, index) => ({
                    daily_record_id: dailyRecord.id,
                    vendedor: venta.vendedor,
                    ciudad: venta.ciudad,
                    producto: venta.producto,
                    cantidad: parseInt(venta.cantidad),
                    precio: parseFloat(venta.precio),
                    total: parseFloat(venta.total),
                    orden: index + 1
                }));

                const { error: ventasError } = await supabaseClient
                    .from('sales')
                    .insert(ventasToInsert);

                if (ventasError) throw ventasError;
            }

            // 4. Insertar gastos
            if (data.gastos && data.gastos.length > 0) {
                const gastosToInsert = data.gastos.map((gasto, index) => ({
                    daily_record_id: dailyRecord.id,
                    categoria: gasto.categoria,
                    descripcion: gasto.descripcion || '',
                    monto: parseFloat(gasto.monto),
                    orden: index + 1
                }));

                const { error: gastosError } = await supabaseClient
                    .from('expenses')
                    .insert(gastosToInsert);

                if (gastosError) throw gastosError;
            }

            // 5. Insertar créditos
            if (data.creditos && data.creditos.length > 0) {
                const creditosToInsert = data.creditos.map((credito, index) => ({
                    daily_record_id: dailyRecord.id,
                    categoria: credito.categoria,
                    detalle: credito.detalle || '',
                    monto: parseFloat(credito.monto),
                    orden: index + 1
                }));

                const { error: creditosError } = await supabaseClient
                    .from('credits')
                    .insert(creditosToInsert);

                if (creditosError) throw creditosError;
            }

            return { success: true, data: dailyRecord };
        } catch (error) {
            console.error('Error guardando registro:', error);
            return { success: false, error: error.message };
        }
    },

    // Obtener datos de un día específico
    async getRegistroDiario(fecha) {
        try {
            // Obtener registro principal
            const { data: dailyRecord, error: dailyError } = await supabaseClient
                .from('daily_records')
                .select('*')
                .eq('fecha', fecha)
                .single();

            if (dailyError && dailyError.code !== 'PGRST116') throw dailyError;

            if (!dailyRecord) {
                return { success: true, data: null };
            }

            // Obtener ventas
            const { data: ventas } = await supabaseClient
                .from('sales')
                .select('*')
                .eq('daily_record_id', dailyRecord.id)
                .order('orden');

            // Obtener gastos
            const { data: gastos } = await supabaseClient
                .from('expenses')
                .select('*')
                .eq('daily_record_id', dailyRecord.id)
                .order('orden');

            // Obtener créditos
            const { data: creditos } = await supabaseClient
                .from('credits')
                .select('*')
                .eq('daily_record_id', dailyRecord.id)
                .order('orden');

            return {
                success: true,
                data: {
                    id: dailyRecord.id,
                    fecha: dailyRecord.fecha,
                    cajaInicial: dailyRecord.caja_inicial,
                    observaciones: dailyRecord.observaciones,
                    ventas: ventas || [],
                    gastos: gastos || [],
                    creditos: creditos || []
                }
            };
        } catch (error) {
            console.error('Error obteniendo registro:', error);
            return { success: false, error: error.message };
        }
    },

    // Obtener datos para dashboard (últimos 30 días)
    async getDashboardData() {
        try {
            const fechaInicio = new Date();
            fechaInicio.setDate(fechaInicio.getDate() - 30);
            const fechaInicioStr = fechaInicio.toISOString().split('T')[0];

            // Obtener registros con sus relaciones
            const { data: records, error } = await supabaseClient
                .from('daily_records')
                .select(`
                    fecha,
                    caja_inicial,
                    sales(vendedor, ciudad, producto, cantidad, precio, total),
                    expenses(categoria, monto),
                    credits(categoria, monto)
                `)
                .gte('fecha', fechaInicioStr)
                .order('fecha', { ascending: false });

            if (error) throw error;

            return { success: true, data: records || [] };
        } catch (error) {
            console.error('Error obteniendo datos dashboard:', error);
            return { success: false, error: error.message };
        }
    }
};

// 🌐 HACER DISPONIBLE GLOBALMENTE
window.SupabaseAuth = SupabaseAuth;
window.SupabaseData = SupabaseData;
window.supabase = supabaseClient;

console.log('✅ Supabase configurado correctamente para Agua Zafiro');