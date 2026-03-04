// ===== IMPORTADOR-NUEVO.JS - ARCHIVO INDEPENDIENTE =====
// Versión completamente separada para evitar conflictos

console.log('🔄 Cargando importador INDEPENDIENTE...');

// UUID Generator
function crearUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// FUNCIÓN PRINCIPAL INDEPENDIENTE
async function ejecutarImportacionIndependiente() {
    console.log('🚀 === INICIANDO IMPORTACIÓN INDEPENDIENTE ===');
    
    try {
        // Verificar usuario
        const usuario = SupabaseAuth?.getCurrentUser();
        if (!usuario || usuario.role !== 'admin') {
            alert('❌ Solo administradores pueden importar');
            return;
        }
        
        // Verificar archivo
        const input = document.getElementById('archivoExcelNuevo');
        if (!input || !input.files[0]) {
            alert('❌ Selecciona un archivo Excel primero');
            return;
        }
        
        const archivo = input.files[0];
        console.log(`📁 Archivo: ${archivo.name} (${Math.round(archivo.size/1024)}KB)`);
        
        // Confirmar importación
        const confirmacion = confirm(
            `¿IMPORTAR DATOS HISTÓRICOS?\n\n` +
            `Archivo: ${archivo.name}\n` +
            `¿Eliminar datos existentes primero?\n\n` +
            `SÍ = Eliminar y reemplazar\n` +
            `NO = Solo agregar nuevos`
        );
        
        if (confirmacion === null) return;
        
        // Crear progreso
        mostrarProgresoIndependiente();
        
        // PASO 1: Leer Excel
        actualizarProgresoIndependiente(10, 'Leyendo Excel...');
        const datosExcel = await leerArchivoExcel(archivo);
        console.log(`📊 Excel leído: ${datosExcel.length} filas`);
        
        // PASO 2: Procesar datos
        actualizarProgresoIndependiente(30, 'Procesando datos...');
        const registrosProcesados = procesarDatosIndependiente(datosExcel);
        console.log(`✅ Procesados: ${registrosProcesados.length} registros válidos`);
        
        // PASO 3: Limpiar si es necesario
        if (confirmacion) {
            actualizarProgresoIndependiente(50, 'Eliminando datos existentes...');
            await eliminarDatosIndependiente();
        }
        
        // PASO 4: Subir datos
        actualizarProgresoIndependiente(70, 'Subiendo a Supabase...');
        const resultado = await subirDatosIndependiente(registrosProcesados, usuario.id);
        
        // COMPLETADO
        actualizarProgresoIndependiente(100, '¡Completado!');
        
        setTimeout(() => {
            ocultarProgresoIndependiente();
            alert(
                `🎉 IMPORTACIÓN COMPLETADA\n\n` +
                `✅ ${resultado.exitosos} registros importados\n` +
                `❌ ${resultado.errores} errores\n` +
                `📊 Total: ${registrosProcesados.length} registros procesados`
            );
            
            if (resultado.exitosos > 0) {
                if (confirm('¿Recargar la página para ver los nuevos datos?')) {
                    window.location.reload();
                }
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ ERROR INDEPENDIENTE:', error);
        ocultarProgresoIndependiente();
        alert(`❌ ERROR: ${error.message}\n\nRevisa la consola para más detalles.`);
    }
}

// Leer archivo Excel
async function leerArchivoExcel(archivo) {
    const buffer = await archivo.arrayBuffer();
    const workbook = XLSX.read(buffer, { cellDates: true });
    const hoja = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(hoja, { header: 1 });
}

// Procesar datos del Excel
function procesarDatosIndependiente(filas) {
    const registros = [];
    let filasConDatos = 0;
    let filasVacias = 0;
    
    console.log('📊 Analizando filas del Excel...');
    
    for (let i = 1; i < filas.length; i++) {
        const fila = filas[i];
        
        if (!fila || fila.length < 3) {
            filasVacias++;
            continue;
        }
        
        // Verificar fecha
        const fechaRaw = fila[1];
        if (!fechaRaw) {
            filasVacias++;
            console.warn(`Fila ${i}: Sin fecha`);
            continue;
        }
        
        const fecha = convertirFechaIndependiente(fechaRaw);
        if (!fecha) {
            console.warn(`Fila ${i}: Fecha inválida - ${fechaRaw}`);
            continue;
        }
        
        // Extraer datos básicos
        const cajaInicial = parseFloat(fila[2]) || 0;
        const observaciones = String(fila[75] || '').trim();
        
        // Extraer ventas (columnas 3-38)
        const ventas = extraerVentasIndependiente(fila);
        
        // Extraer gastos (columnas 39-56)
        const gastos = extraerGastosIndependiente(fila);
        
        // Extraer créditos (columnas 57-74)
        const creditos = extraerCreditosIndependiente(fila);
        
        // Solo agregar si tiene datos útiles
        if (ventas.length > 0 || gastos.length > 0 || creditos.length > 0) {
            registros.push({
                id: crearUUID(),
                fecha,
                cajaInicial,
                observaciones,
                ventas,
                gastos,
                creditos
            });
            filasConDatos++;
        } else {
            console.warn(`Fila ${i}: Datos insuficientes para ${fecha}`);
        }
    }
    
    console.log(`📋 Resumen procesamiento:`);
    console.log(`  - Filas analizadas: ${filas.length - 1}`);
    console.log(`  - Filas con datos: ${filasConDatos}`);
    console.log(`  - Filas vacías: ${filasVacias}`);
    console.log(`  - Registros válidos: ${registros.length}`);
    
    return registros;
}

function convertirFechaIndependiente(fechaExcel) {
    try {
        if (fechaExcel instanceof Date) {
            return fechaExcel.toISOString().split('T')[0];
        }
        
        if (typeof fechaExcel === 'string') {
            const fecha = new Date(fechaExcel);
            if (!isNaN(fecha.getTime())) {
                return fecha.toISOString().split('T')[0];
            }
        }
        
        if (typeof fechaExcel === 'number') {
            const fecha = new Date((fechaExcel - 25569) * 86400 * 1000);
            if (!isNaN(fecha.getTime())) {
                return fecha.toISOString().split('T')[0];
            }
        }
    } catch (error) {
        console.error('Error convirtiendo fecha:', fechaExcel, error);
    }
    
    return null;
}

function extraerVentasIndependiente(fila) {
    const ventas = [];
    for (let v = 0; v < 6; v++) {
        const base = 3 + (v * 6);
        const vendedor = String(fila[base] || '').trim();
        const ciudad = String(fila[base + 1] || '').trim();
        const producto = String(fila[base + 2] || '').trim();
        const cantidad = parseInt(fila[base + 3]) || 0;
        const precio = parseFloat(fila[base + 4]) || 0;
        const total = parseFloat(fila[base + 5]) || (cantidad * precio);
        
        if (vendedor && ciudad && producto && cantidad > 0 && precio > 0) {
            ventas.push({ vendedor, ciudad, producto, cantidad, precio, total });
        }
    }
    return ventas;
}

function extraerGastosIndependiente(fila) {
    const gastos = [];
    for (let g = 0; g < 6; g++) {
        const base = 39 + (g * 3);
        const categoria = String(fila[base] || '').trim();
        const descripcion = String(fila[base + 1] || '').trim();
        const monto = parseFloat(fila[base + 2]) || 0;
        
        if (categoria && monto > 0) {
            gastos.push({ categoria, descripcion, monto });
        }
    }
    return gastos;
}

function extraerCreditosIndependiente(fila) {
    const creditos = [];
    for (let c = 0; c < 6; c++) {
        const base = 57 + (c * 3);
        const categoria = String(fila[base] || '').trim();
        const detalle = String(fila[base + 1] || '').trim();
        const monto = parseFloat(fila[base + 2]) || 0;
        
        if (categoria && monto > 0) {
            creditos.push({ categoria, detalle, monto });
        }
    }
    return creditos;
}

// Eliminar datos existentes
async function eliminarDatosIndependiente() {
    console.log('🗑️ ELIMINANDO datos existentes...');
    
    const client = supabaseClient;
    
    // Obtener registros existentes
    const { data: records } = await client
        .from('daily_records')
        .select('id');
    
    if (!records || records.length === 0) {
        console.log('✅ No hay datos para eliminar');
        return;
    }
    
    const ids = records.map(r => r.id);
    console.log(`🗑️ Eliminando ${ids.length} registros...`);
    
    // Eliminar datos relacionados primero
    await client.from('sales').delete().in('daily_record_id', ids);
    await client.from('expenses').delete().in('daily_record_id', ids);
    await client.from('credits').delete().in('daily_record_id', ids);
    
    // Eliminar registros principales
    await client.from('daily_records').delete().in('id', ids);
    
    console.log('✅ Datos eliminados correctamente');
}

// Subir datos a Supabase
async function subirDatosIndependiente(registros, userId) {
    console.log(`🚀 SUBIENDO ${registros.length} registros...`);
    
    const client = supabaseClient;
    let exitosos = 0;
    let errores = 0;
    const erroresDetalle = [];
    
    for (let i = 0; i < registros.length; i++) {
        const registro = registros[i];
        
        try {
            console.log(`📝 [${i+1}/${registros.length}] Procesando: ${registro.fecha}`);
            
            // 1. Crear daily_record
            const { data: dailyRecord, error: errorDaily } = await client
                .from('daily_records')
                .insert({
                    id: registro.id,
                    fecha: registro.fecha,
                    caja_inicial: registro.cajaInicial,
                    observaciones: registro.observaciones || '',
                    created_by: userId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (errorDaily) throw errorDaily;
            
            const recordId = dailyRecord.id;
            
            // 2. Insertar sales
            if (registro.ventas.length > 0) {
                const salesData = registro.ventas.map((venta, idx) => ({
                    id: crearUUID(),
                    daily_record_id: recordId,
                    vendedor: venta.vendedor,
                    ciudad: venta.ciudad,
                    producto: venta.producto,
                    cantidad: venta.cantidad,
                    precio: venta.precio,
                    total: venta.total,
                    orden: idx + 1,
                    created_at: new Date().toISOString()
                }));
                
                const { error: errorSales } = await client
                    .from('sales')
                    .insert(salesData);
                
                if (errorSales) throw errorSales;
            }
            
            // 3. Insertar expenses
            if (registro.gastos.length > 0) {
                const expensesData = registro.gastos.map((gasto, idx) => ({
                    id: crearUUID(),
                    daily_record_id: recordId,
                    categoria: gasto.categoria,
                    descripcion: gasto.descripcion || '',
                    monto: gasto.monto,
                    orden: idx + 1,
                    created_at: new Date().toISOString()
                }));
                
                const { error: errorExpenses } = await client
                    .from('expenses')
                    .insert(expensesData);
                
                if (errorExpenses) throw errorExpenses;
            }
            
            // 4. Insertar credits
            if (registro.creditos.length > 0) {
                const creditsData = registro.creditos.map((credito, idx) => ({
                    id: crearUUID(),
                    daily_record_id: recordId,
                    categoria: credito.categoria,
                    detalle: credito.detalle || '',
                    monto: credito.monto,
                    orden: idx + 1,
                    created_at: new Date().toISOString()
                }));
                
                const { error: errorCredits } = await client
                    .from('credits')
                    .insert(creditsData);
                
                if (errorCredits) throw errorCredits;
            }
            
            exitosos++;
            console.log(`✅ ${registro.fecha}: ${registro.ventas.length}V ${registro.gastos.length}G ${registro.creditos.length}C`);
            
            // Actualizar progreso
            const progreso = 70 + ((exitosos / registros.length) * 25);
            actualizarProgresoIndependiente(progreso, `${exitosos}/${registros.length} registros`);
            
            // Pausa para no saturar Supabase
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            errores++;
            const errorMsg = `${registro.fecha}: ${error.message}`;
            erroresDetalle.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
        }
    }
    
    console.log(`📊 RESULTADO: ${exitosos} exitosos, ${errores} errores`);
    if (erroresDetalle.length > 0) {
        console.group('❌ Errores detallados:');
        erroresDetalle.forEach(error => console.error(error));
        console.groupEnd();
    }
    
    return { exitosos, errores };
}

// ===== INTERFAZ DE PROGRESO =====
function mostrarProgresoIndependiente() {
    const div = document.createElement('div');
    div.id = 'progresoIndependiente';
    div.innerHTML = `
        <div style="
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: white; padding: 30px; border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 20000;
            min-width: 400px; border: 3px solid #059669;
        ">
            <h3 style="margin: 0 0 20px 0; text-align: center; color: #059669;">
                🚀 Importación Independiente
            </h3>
            <div style="background: #f0f0f0; height: 25px; border-radius: 12px; overflow: hidden; margin-bottom: 15px; position: relative;">
                <div id="barraIndependiente" style="height: 100%; background: linear-gradient(90deg, #059669, #10b981); width: 0%; transition: width 0.5s;"></div>
                <div id="porcentajeIndependiente" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #374151; font-weight: bold;">0%</div>
            </div>
            <p id="textoIndependiente" style="margin: 0; text-align: center; color: #374151;">Iniciando...</p>
        </div>
    `;
    document.body.appendChild(div);
}

function actualizarProgresoIndependiente(porcentaje, mensaje) {
    const barra = document.getElementById('barraIndependiente');
    const texto = document.getElementById('textoIndependiente');
    const porciento = document.getElementById('porcentajeIndependiente');
    
    if (barra) barra.style.width = `${porcentaje}%`;
    if (texto) texto.textContent = mensaje;
    if (porciento) porciento.textContent = `${Math.round(porcentaje)}%`;
}

function ocultarProgresoIndependiente() {
    const div = document.getElementById('progresoIndependiente');
    if (div) div.remove();
}

// ===== INTERFAZ PRINCIPAL =====
function crearInterfazIndependiente() {
    const container = document.getElementById('importContainer') || document.body;
    
    const existente = container.querySelector('.interfaz-independiente');
    if (existente) existente.remove();
    
    const interfaz = document.createElement('div');
    interfaz.className = 'interfaz-independiente';
    interfaz.innerHTML = `
        <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 25px; border-radius: 15px; margin: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
            <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">🔥 Importador Independiente</h2>
                <p style="color: rgba(255,255,255,0.8); margin: 0;">Archivo completamente separado - Sin conflictos</p>
            </div>
            
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 12px; font-weight: 600; color: white; font-size: 16px;">
                    📁 Seleccionar archivo Excel:
                </label>
                <input type="file" id="archivoExcelNuevo" accept=".xlsx,.xls" 
                       style="padding: 12px; border: none; border-radius: 8px; width: 100%; background: white; color: #374151; font-size: 14px;">
            </div>
            
            <div style="background: rgba(34, 197, 94, 0.2); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px solid rgba(34, 197, 94, 0.3);">
                <h4 style="color: #22c55e; margin: 0 0 10px 0;">✅ Ventajas del Importador Independiente:</h4>
                <ul style="margin: 0; padding-left: 20px; color: rgba(255,255,255,0.9); font-size: 14px;">
                    <li>Archivo JavaScript completamente separado</li>
                    <li>Sin conflictos con código existente</li>
                    <li>Logging detallado en cada paso</li>
                    <li>Manejo robusto de errores</li>
                    <li>Solo nombres en inglés: daily_records, sales, expenses, credits</li>
                </ul>
            </div>
            
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button onclick="ejecutarImportacionIndependiente()" 
                        style="background: #059669; color: white; border: none; padding: 15px 30px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);">
                    🚀 Ejecutar Importación
                </button>
                
                <button onclick="this.closest('.interfaz-independiente').remove()" 
                        style="background: #6b7280; color: white; border: none; padding: 15px 30px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    ❌ Cerrar
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(interfaz);
}

// Función para reemplazar el botón original
function abrirImportadorIndependiente() {
    const usuario = SupabaseAuth.getCurrentUser();
    if (!usuario || usuario.role !== 'admin') {
        alert('❌ Solo administradores pueden importar datos');
        return;
    }
    crearInterfazIndependiente();
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.ejecutarImportacionIndependiente = ejecutarImportacionIndependiente;
    window.crearInterfazIndependiente = crearInterfazIndependiente;
    window.abrirImportadorIndependiente = abrirImportadorIndependiente;
    
    // Reemplazar función del botón original
    window.iniciarImportacionDirecta = abrirImportadorIndependiente;
    
    console.log('✅ IMPORTADOR INDEPENDIENTE cargado correctamente');
    console.log('🔧 Funciones disponibles:');
    console.log('  - ejecutarImportacionIndependiente()');
    console.log('  - abrirImportadorIndependiente()');
}