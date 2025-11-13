// ===== PROCESADOR EXCEL-TO-JSON MEJORADO =====
// Convierte Excel a JSON limpio y maneja celdas vacías correctamente

console.log('📊 Cargando procesador Excel-to-JSON mejorado...');

// Función principal mejorada
async function importarConProcesadorJSON() {
    console.log('🔄 === INICIANDO IMPORTACIÓN CON PROCESADOR JSON ===');
    
    try {
        const usuario = SupabaseAuth?.getCurrentUser();
        if (!usuario || usuario.role !== 'admin') {
            alert('Solo administradores pueden importar datos');
            return;
        }
        
        const input = document.getElementById('archivoExcelJSON');
        if (!input || !input.files[0]) {
            alert('Selecciona un archivo Excel primero');
            return;
        }
        
        const archivo = input.files[0];
        console.log(`📁 Procesando: ${archivo.name} (${Math.round(archivo.size/1024)}KB)`);
        
        const eliminarExistentes = confirm(
            `PROCESADOR EXCEL-TO-JSON MEJORADO\n\n` +
            `Archivo: ${archivo.name}\n` +
            `Este método procesa el Excel de manera más robusta.\n\n` +
            `¿Eliminar datos existentes primero?\n` +
            `SÍ = Reemplazar todo\n` +
            `NO = Solo agregar`
        );
        
        if (eliminarExistentes === null) return;
        
        mostrarProgresoJSON();
        
        // PASO 1: Convertir Excel a JSON limpio
        actualizarProgresoJSON(10, 'Convirtiendo Excel a JSON...');
        const datosJSON = await convertirExcelAJSON(archivo);
        console.log(`📊 Conversión completada: ${datosJSON.registros.length} registros, ${datosJSON.filas.vacias} filas vacías`);
        
        // PASO 2: Procesar JSON
        actualizarProgresoJSON(40, 'Procesando datos JSON...');
        const registrosLimpios = procesarDatosJSON(datosJSON.registros);
        
        // PASO 3: Limpiar datos existentes si necesario
        if (eliminarExistentes) {
            actualizarProgresoJSON(60, 'Eliminando datos existentes...');
            await eliminarDatosSupabase();
        }
        
        // PASO 4: Subir a Supabase
        actualizarProgresoJSON(70, 'Subiendo a Supabase...');
        const resultado = await subirDatosJSON(registrosLimpios, usuario.id);
        
        // Completado
        actualizarProgresoJSON(100, 'Completado!');
        
        setTimeout(() => {
            ocultarProgresoJSON();
            alert(
                `IMPORTACIÓN CON JSON COMPLETADA\n\n` +
                `✅ ${resultado.exitosos} registros importados\n` +
                `❌ ${resultado.errores} errores\n` +
                `📊 Total JSON: ${datosJSON.registros.length} registros\n` +
                `🧹 Registros válidos: ${registrosLimpios.length}`
            );
            
            if (resultado.exitosos > 0 && confirm('¿Recargar página?')) {
                window.location.reload();
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ ERROR JSON:', error);
        ocultarProgresoJSON();
        alert(`ERROR: ${error.message}`);
    }
}

// Convertir Excel a JSON de manera robusta
async function convertirExcelAJSON(archivo) {
    console.log('📊 Iniciando conversión Excel-to-JSON...');
    
    const buffer = await archivo.arrayBuffer();
    
    // Leer con configuración específica para manejar celdas vacías
    const workbook = XLSX.read(buffer, {
        cellDates: true,        // Convertir fechas automáticamente
        cellNF: false,          // No usar formato de número
        cellText: false,        // No forzar texto
        raw: false,             // Procesar valores
        defval: '',             // Valor por defecto para celdas vacías
        sheetStubs: true        // Incluir celdas vacías como stubs
    });
    
    const nombreHoja = workbook.SheetNames[0];
    const hoja = workbook.Sheets[nombreHoja];
    
    console.log(`📋 Procesando hoja: ${nombreHoja}`);
    
    // Obtener rango de la hoja
    const rango = XLSX.utils.decode_range(hoja['!ref'] || 'A1:BA1000');
    console.log(`📐 Rango detectado: ${XLSX.utils.encode_range(rango)}`);
    
    const registros = [];
    let filasVacias = 0;
    let filasConDatos = 0;
    
    // Procesar fila por fila (saltando header)
    for (let fila = rango.s.r + 1; fila <= rango.e.r; fila++) {
        const registro = {};
        let tieneDatos = false;
        
        // Procesar cada columna
        for (let col = rango.s.c; col <= rango.e.c; col++) {
            const direccion = XLSX.utils.encode_cell({ r: fila, c: col });
            const celda = hoja[direccion];
            
            // Obtener valor de la celda
            let valor = '';
            if (celda) {
                // Manejar diferentes tipos de celdas
                if (celda.t === 'd') {
                    // Fecha
                    valor = celda.v;
                } else if (celda.t === 'n') {
                    // Número
                    valor = celda.v;
                } else if (celda.t === 's' || celda.t === 'str') {
                    // String
                    valor = String(celda.v || '').trim();
                } else if (celda.t === 'b') {
                    // Boolean
                    valor = celda.v;
                } else {
                    valor = String(celda.v || '').trim();
                }
                
                if (valor !== '' && valor !== null && valor !== undefined) {
                    tieneDatos = true;
                }
            }
            
            registro[`col${col}`] = valor;
        }
        
        if (tieneDatos) {
            registro.filaOriginal = fila + 1; // +1 porque Excel empieza en 1
            registros.push(registro);
            filasConDatos++;
        } else {
            filasVacias++;
        }
    }
    
    console.log(`✅ Conversión JSON completada:`);
    console.log(`  - Filas procesadas: ${rango.e.r - rango.s.r}`);
    console.log(`  - Filas con datos: ${filasConDatos}`);
    console.log(`  - Filas vacías: ${filasVacias}`);
    console.log(`  - Registros JSON: ${registros.length}`);
    
    return {
        registros,
        filas: { total: rango.e.r - rango.s.r, conDatos: filasConDatos, vacias: filasVacias },
        rango: { inicio: rango.s, fin: rango.e }
    };
}

// Procesar datos JSON a registros válidos
function procesarDatosJSON(datosJSON) {
    console.log('🔄 Procesando datos JSON a registros...');
    
    const registros = [];
    let registrosValidos = 0;
    let registrosInvalidos = 0;
    
    for (const dato of datosJSON) {
        try {
            // Extraer fecha (columna B = col1)
            const fechaRaw = dato.col1;
            const fecha = procesarFechaJSON(fechaRaw);
            
            if (!fecha) {
                console.warn(`Fila ${dato.filaOriginal}: Fecha inválida - ${fechaRaw}`);
                registrosInvalidos++;
                continue;
            }
            
            // Extraer datos básicos
            const cajaInicial = procesarNumeroJSON(dato.col2) || 0;
            const observaciones = procesarTextoJSON(dato.col75) || '';
            
            // Extraer ventas (columnas 3-38)
            const ventas = extraerVentasJSON(dato);
            
            // Extraer gastos (columnas 39-56)
            const gastos = extraerGastosJSON(dato);
            
            // Extraer créditos (columnas 57-74)
            const creditos = extraerCreditosJSON(dato);
            
            // Solo agregar si tiene datos útiles
            if (fecha && (ventas.length > 0 || gastos.length > 0 || creditos.length > 0 || cajaInicial > 0)) {
                registros.push({
                    id: generarUUID(),
                    fecha,
                    cajaInicial,
                    observaciones,
                    ventas,
                    gastos,
                    creditos,
                    filaOriginal: dato.filaOriginal
                });
                registrosValidos++;
            } else {
                console.warn(`Fila ${dato.filaOriginal}: Sin datos suficientes (${fecha}, V:${ventas.length}, G:${gastos.length}, C:${creditos.length})`);
                registrosInvalidos++;
            }
            
        } catch (error) {
            console.error(`Error procesando fila ${dato.filaOriginal}:`, error);
            registrosInvalidos++;
        }
    }
    
    console.log(`📊 Procesamiento JSON completado:`);
    console.log(`  - Registros válidos: ${registrosValidos}`);
    console.log(`  - Registros inválidos: ${registrosInvalidos}`);
    console.log(`  - Total final: ${registros.length}`);
    
    return registros;
}

// Procesar fecha desde JSON
function procesarFechaJSON(valor) {
    if (!valor) return null;
    
    try {
        // Si ya es una fecha
        if (valor instanceof Date) {
            return valor.toISOString().split('T')[0];
        }
        
        // Si es un string
        if (typeof valor === 'string') {
            const fecha = new Date(valor.trim());
            if (!isNaN(fecha.getTime())) {
                return fecha.toISOString().split('T')[0];
            }
        }
        
        // Si es un número de Excel (días desde 1900)
        if (typeof valor === 'number' && valor > 0) {
            const fecha = new Date((valor - 25569) * 86400 * 1000);
            if (!isNaN(fecha.getTime())) {
                return fecha.toISOString().split('T')[0];
            }
        }
    } catch (error) {
        console.warn('Error procesando fecha:', valor, error);
    }
    
    return null;
}

// Procesar número desde JSON
function procesarNumeroJSON(valor) {
    if (valor === '' || valor === null || valor === undefined) return 0;
    
    const numero = parseFloat(valor);
    return isNaN(numero) ? 0 : numero;
}

// Procesar texto desde JSON
function procesarTextoJSON(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor).trim();
}

// Extraer ventas desde JSON (columnas 3-38, grupos de 6)
function extraerVentasJSON(dato) {
    const ventas = [];
    
    for (let v = 0; v < 6; v++) {
        const baseCol = 3 + (v * 6);
        
        const vendedor = procesarTextoJSON(dato[`col${baseCol}`]);
        const ciudad = procesarTextoJSON(dato[`col${baseCol + 1}`]);
        const producto = procesarTextoJSON(dato[`col${baseCol + 2}`]);
        const cantidad = procesarNumeroJSON(dato[`col${baseCol + 3}`]);
        const precio = procesarNumeroJSON(dato[`col${baseCol + 4}`]);
        const total = procesarNumeroJSON(dato[`col${baseCol + 5}`]) || (cantidad * precio);
        
        if (vendedor && ciudad && producto && cantidad > 0 && precio > 0) {
            ventas.push({ vendedor, ciudad, producto, cantidad, precio, total });
        }
    }
    
    return ventas;
}

// Extraer gastos desde JSON (columnas 39-56, grupos de 3)
function extraerGastosJSON(dato) {
    const gastos = [];
    
    for (let g = 0; g < 6; g++) {
        const baseCol = 39 + (g * 3);
        
        const categoria = procesarTextoJSON(dato[`col${baseCol}`]);
        const descripcion = procesarTextoJSON(dato[`col${baseCol + 1}`]);
        const monto = procesarNumeroJSON(dato[`col${baseCol + 2}`]);
        
        if (categoria && monto > 0) {
            gastos.push({ categoria, descripcion, monto });
        }
    }
    
    return gastos;
}

// Extraer créditos desde JSON (columnas 57-74, grupos de 3)
function extraerCreditosJSON(dato) {
    const creditos = [];
    
    for (let c = 0; c < 6; c++) {
        const baseCol = 57 + (c * 3);
        
        const categoria = procesarTextoJSON(dato[`col${baseCol}`]);
        const detalle = procesarTextoJSON(dato[`col${baseCol + 1}`]);
        const monto = procesarNumeroJSON(dato[`col${baseCol + 2}`]);
        
        if (categoria && monto > 0) {
            creditos.push({ categoria, detalle, monto });
        }
    }
    
    return creditos;
}

// Generar UUID
function generarUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Eliminar datos existentes de Supabase
async function eliminarDatosSupabase() {
    console.log('🗑️ Eliminando datos existentes de Supabase...');
    
    const client = supabaseClient;
    const { data: records } = await client.from('daily_records').select('id');
    
    if (!records || records.length === 0) {
        console.log('No hay datos para eliminar');
        return;
    }
    
    const ids = records.map(r => r.id);
    console.log(`Eliminando ${ids.length} registros...`);
    
    await client.from('sales').delete().in('daily_record_id', ids);
    await client.from('expenses').delete().in('daily_record_id', ids);
    await client.from('credits').delete().in('daily_record_id', ids);
    await client.from('daily_records').delete().in('id', ids);
    
    console.log('✅ Datos eliminados');
}

// Subir datos JSON a Supabase
async function subirDatosJSON(registros, userId) {
    console.log(`🚀 Subiendo ${registros.length} registros desde JSON...`);
    
    const client = supabaseClient;
    let exitosos = 0;
    let errores = 0;
    const erroresDetalle = [];
    
    for (let i = 0; i < registros.length; i++) {
        const registro = registros[i];
        
        try {
            console.log(`📝 [${i+1}/${registros.length}] JSON->DB: ${registro.fecha} (Fila ${registro.filaOriginal})`);
            
            // Crear daily_record
            const { data: dailyRecord, error: errorDaily } = await client
                .from('daily_records')
                .insert({
                    id: registro.id,
                    fecha: registro.fecha,
                    caja_inicial: registro.cajaInicial,
                    observaciones: registro.observaciones,
                    created_by: userId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (errorDaily) throw errorDaily;
            
            const recordId = dailyRecord.id;
            
            // Insertar sales, expenses, credits (mismo código que antes)
            if (registro.ventas.length > 0) {
                const salesData = registro.ventas.map((venta, idx) => ({
                    id: generarUUID(),
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
                
                const { error: errorSales } = await client.from('sales').insert(salesData);
                if (errorSales) throw errorSales;
            }
            
            if (registro.gastos.length > 0) {
                const expensesData = registro.gastos.map((gasto, idx) => ({
                    id: generarUUID(),
                    daily_record_id: recordId,
                    categoria: gasto.categoria,
                    descripcion: gasto.descripcion,
                    monto: gasto.monto,
                    orden: idx + 1,
                    created_at: new Date().toISOString()
                }));
                
                const { error: errorExpenses } = await client.from('expenses').insert(expensesData);
                if (errorExpenses) throw errorExpenses;
            }
            
            if (registro.creditos.length > 0) {
                const creditsData = registro.creditos.map((credito, idx) => ({
                    id: generarUUID(),
                    daily_record_id: recordId,
                    categoria: credito.categoria,
                    detalle: credito.detalle,
                    monto: credito.monto,
                    orden: idx + 1,
                    created_at: new Date().toISOString()
                }));
                
                const { error: errorCredits } = await client.from('credits').insert(creditsData);
                if (errorCredits) throw errorCredits;
            }
            
            exitosos++;
            console.log(`✅ ${registro.fecha}: ${registro.ventas.length}V ${registro.gastos.length}G ${registro.creditos.length}C`);
            
            const progreso = 70 + ((exitosos / registros.length) * 25);
            actualizarProgresoJSON(progreso, `${exitosos}/${registros.length} registros`);
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
        } catch (error) {
            errores++;
            const errorMsg = `Fila ${registro.filaOriginal} (${registro.fecha}): ${error.message}`;
            erroresDetalle.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
        }
    }
    
    console.log(`📊 RESULTADO JSON: ${exitosos} exitosos, ${errores} errores`);
    return { exitosos, errores };
}

// ===== INTERFAZ DE PROGRESO =====
function mostrarProgresoJSON() {
    const div = document.createElement('div');
    div.id = 'progresoJSON';
    div.innerHTML = `
        <div style="
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: white; padding: 30px; border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 20000;
            min-width: 450px; border: 3px solid #0ea5e9;
        ">
            <h3 style="margin: 0 0 20px 0; text-align: center; color: #0ea5e9;">
                📊 Procesador Excel-to-JSON
            </h3>
            <div style="background: #f0f0f0; height: 25px; border-radius: 12px; overflow: hidden; margin-bottom: 15px; position: relative;">
                <div id="barraJSON" style="height: 100%; background: linear-gradient(90deg, #0ea5e9, #0284c7); width: 0%; transition: width 0.5s;"></div>
                <div id="porcentajeJSON" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #374151; font-weight: bold;">0%</div>
            </div>
            <p id="textoJSON" style="margin: 0; text-align: center; color: #374151; font-size: 14px;">Iniciando conversión Excel-to-JSON...</p>
        </div>
    `;
    document.body.appendChild(div);
}

function actualizarProgresoJSON(porcentaje, mensaje) {
    const barra = document.getElementById('barraJSON');
    const texto = document.getElementById('textoJSON');
    const porciento = document.getElementById('porcentajeJSON');
    
    if (barra) barra.style.width = `${porcentaje}%`;
    if (texto) texto.textContent = mensaje;
    if (porciento) porciento.textContent = `${Math.round(porcentaje)}%`;
}

function ocultarProgresoJSON() {
    const div = document.getElementById('progresoJSON');
    if (div) div.remove();
}

// ===== INTERFAZ PRINCIPAL =====
function crearInterfazJSON() {
    const container = document.getElementById('importContainer') || document.body;
    
    const existente = container.querySelector('.interfaz-json');
    if (existente) existente.remove();
    
    const interfaz = document.createElement('div');
    interfaz.className = 'interfaz-json';
    interfaz.innerHTML = `
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 25px; border-radius: 15px; margin: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
            <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">📊 Procesador Excel-to-JSON</h2>
                <p style="color: rgba(255,255,255,0.9); margin: 0;">Convierte Excel a JSON y maneja celdas vacías correctamente</p>
            </div>
            
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 12px; font-weight: 600; color: white; font-size: 16px;">
                    📁 Archivo Excel para procesamiento JSON:
                </label>
                <input type="file" id="archivoExcelJSON" accept=".xlsx,.xls" 
                       style="padding: 12px; border: none; border-radius: 8px; width: 100%; background: white; color: #374151; font-size: 14px;">
            </div>
            
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <h4 style="color: white; margin: 0 0 10px 0;">🔧 Mejoras del Procesador JSON:</h4>
                <ul style="margin: 0; padding-left: 20px; color: rgba(255,255,255,0.9); font-size: 14px;">
                    <li><strong>Manejo robusto de celdas vacías</strong> - No más undefined</li>
                    <li><strong>Conversión Excel-to-JSON limpia</strong> - Datos consistentes</li>
                    <li><strong>Procesamiento de fechas mejorado</strong> - Múltiples formatos</li>
                    <li><strong>Validación de datos por tipo</strong> - Números, textos, fechas</li>
                    <li><strong>Logging detallado por fila</strong> - Identifica problemas exactos</li>
                </ul>
            </div>
            
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button onclick="importarConProcesadorJSON()" 
                        style="background: #1f2937; color: white; border: none; padding: 15px 30px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(31, 41, 55, 0.3);">
                    🚀 Procesar con JSON
                </button>
                
                <button onclick="this.closest('.interfaz-json').remove()" 
                        style="background: #6b7280; color: white; border: none; padding: 15px 30px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    ❌ Cerrar
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(interfaz);
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.importarConProcesadorJSON = importarConProcesadorJSON;
    window.crearInterfazJSON = crearInterfazJSON;
    
    console.log('✅ PROCESADOR EXCEL-TO-JSON cargado');
    console.log('📊 Maneja celdas vacías y convierte a JSON limpio');
}