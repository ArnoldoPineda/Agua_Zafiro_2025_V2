// ===== IMPORTADOR DE EXCEL - VERSIÓN COMPLETAMENTE LIMPIA =====
// SOLO nombres en inglés según tu estructura de Supabase

// Generar UUID v4
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Función principal COMPLETAMENTE REESCRITA
async function importarExcelLimpio() {
  console.log('🔄 Iniciando importación LIMPIA - Solo nombres en inglés...');
  
  try {
    // Verificar autenticación
    const currentUser = SupabaseAuth?.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      alert('❌ Solo los administradores pueden importar datos históricos');
      return;
    }
    
    // Verificar archivo
    const fileInput = document.getElementById('excelFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
      alert('❌ Por favor selecciona un archivo Excel');
      return;
    }
    
    console.log(`📁 Procesando: ${file.name}`);
    
    // Preguntar sobre limpiar datos existentes
    const limpiarExistentes = confirm(
      '⚠️ IMPORTACIÓN DE DATOS HISTÓRICOS ⚠️\n\n' +
      '¿Desea ELIMINAR datos existentes primero?\n\n' +
      'SÍ = Eliminar todo y importar\n' +
      'NO = Solo agregar datos nuevos'
    );
    
    // Crear progreso
    crearBarraProgreso();
    
    // Procesar Excel
    actualizarBarra(10, 'Leyendo Excel...');
    const excelData = await procesarArchivoExcel(file);
    
    actualizarBarra(30, `${excelData.length} filas detectadas`);
    
    // Limpiar si es necesario
    if (limpiarExistentes) {
      actualizarBarra(40, 'Limpiando datos existentes...');
      await eliminarDatosExistentes();
    }
    
    // Procesar datos
    actualizarBarra(50, 'Procesando registros...');
    const registrosLimpios = procesarRegistrosExcel(excelData);
    
    actualizarBarra(70, `${registrosLimpios.length} registros procesados`);
    
    // Subir a Supabase
    actualizarBarra(80, 'Subiendo a Supabase...');
    const resultado = await subirRegistrosLimpios(registrosLimpios, currentUser.id);
    
    // Completado
    actualizarBarra(100, 'Completado!');
    
    alert(
      `🎉 IMPORTACIÓN COMPLETADA\n\n` +
      `✅ ${resultado.exitosos} registros importados\n` +
      `${resultado.errores > 0 ? `❌ ${resultado.errores} errores\n` : ''}` +
      `📊 Total procesado: ${registrosLimpios.length}`
    );
    
    setTimeout(() => {
      eliminarBarraProgreso();
      if (resultado.exitosos > 0) {
        window.location.reload();
      }
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error general:', error);
    alert('❌ ERROR: ' + error.message);
    eliminarBarraProgreso();
  }
}

// Procesar archivo Excel
async function procesarArchivoExcel(file) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { cellDates: true });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  return data;
}

// Procesar registros del Excel
function procesarRegistrosExcel(rawData) {
  const registros = [];
  
  console.log('📊 Procesando datos...');
  
  // Saltar header (fila 0)
  for (let i = 1; i < rawData.length; i++) {
    const fila = rawData[i];
    
    if (!fila || !fila[1]) continue; // Sin fecha
    
    try {
      const fecha = convertirFecha(fila[1]);
      if (!fecha) continue;
      
      const registro = {
        id: generateUUID(),
        fecha: fecha,
        caja_inicial: parseFloat(fila[2]) || 0,
        observaciones: String(fila[75] || '').trim(),
        ventas: extraerVentas(fila),
        gastos: extraerGastos(fila),
        creditos: extraerCreditos(fila)
      };
      
      // Solo agregar si tiene datos útiles
      if (registro.ventas.length > 0 || registro.gastos.length > 0 || registro.creditos.length > 0) {
        registros.push(registro);
      }
      
    } catch (error) {
      console.warn(`Fila ${i} error:`, error.message);
    }
  }
  
  console.log(`✅ ${registros.length} registros válidos procesados`);
  return registros;
}

// Convertir fecha desde Excel
function convertirFecha(fechaExcel) {
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
    return fecha.toISOString().split('T')[0];
  }
  
  return null;
}

// Extraer ventas (columnas 3-38, grupos de 6)
function extraerVentas(fila) {
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
      ventas.push({
        vendedor, ciudad, producto, cantidad, precio, total
      });
    }
  }
  
  return ventas;
}

// Extraer gastos (columnas 39-56, grupos de 3)
function extraerGastos(fila) {
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

// Extraer créditos (columnas 57-74, grupos de 3)  
function extraerCreditos(fila) {
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

// Eliminar datos existentes - SOLO NOMBRES EN INGLÉS
async function eliminarDatosExistentes() {
  console.log('🗑️ Eliminando datos existentes...');
  
  const client = supabaseClient;
  
  // Obtener IDs de daily_records
  const { data: records } = await client
    .from('daily_records')  // ✅ INGLÉS
    .select('id');
  
  if (!records || records.length === 0) {
    console.log('No hay datos para eliminar');
    return;
  }
  
  const ids = records.map(r => r.id);
  console.log(`Eliminando ${ids.length} registros...`);
  
  // Eliminar tablas relacionadas
  await client.from('sales').delete().in('daily_record_id', ids);      // ✅ INGLÉS
  await client.from('expenses').delete().in('daily_record_id', ids);   // ✅ INGLÉS  
  await client.from('credits').delete().in('daily_record_id', ids);    // ✅ INGLÉS
  
  // Eliminar daily_records
  await client.from('daily_records').delete().in('id', ids);           // ✅ INGLÉS
  
  console.log('✅ Datos eliminados');
}

// Subir registros - SOLO NOMBRES EN INGLÉS
async function subirRegistrosLimpios(registros, userId) {
  console.log(`🚀 Subiendo ${registros.length} registros...`);
  
  const client = supabaseClient;
  let exitosos = 0;
  let errores = 0;
  
  // Procesar uno por uno para debugging
  for (const registro of registros) {
    try {
      console.log(`🔄 Procesando: ${registro.fecha}`);
      
      // 1. Crear daily_record
      const dailyData = {
        id: registro.id,
        fecha: registro.fecha,
        caja_inicial: registro.caja_inicial,         // ✅ INGLÉS
        observaciones: registro.observaciones,
        created_by: userId,                          // ✅ INGLÉS
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: dailyRecord, error: dailyError } = await client
        .from('daily_records')  // ✅ INGLÉS
        .insert(dailyData)
        .select()
        .single();
      
      if (dailyError) throw dailyError;
      
      const recordId = dailyRecord.id;
      
      // 2. Insertar sales
      if (registro.ventas.length > 0) {
        const salesData = registro.ventas.map((venta, idx) => ({
          id: generateUUID(),
          daily_record_id: recordId,    // ✅ INGLÉS
          vendedor: venta.vendedor,
          ciudad: venta.ciudad,
          producto: venta.producto,
          cantidad: venta.cantidad,
          precio: venta.precio,
          total: venta.total,
          orden: idx + 1,
          created_at: new Date().toISOString()
        }));
        
        const { error: salesError } = await client
          .from('sales')  // ✅ INGLÉS
          .insert(salesData);
        
        if (salesError) throw salesError;
      }
      
      // 3. Insertar expenses
      if (registro.gastos.length > 0) {
        const expensesData = registro.gastos.map((gasto, idx) => ({
          id: generateUUID(),
          daily_record_id: recordId,    // ✅ INGLÉS
          categoria: gasto.categoria,
          descripcion: gasto.descripcion,
          monto: gasto.monto,
          orden: idx + 1,
          created_at: new Date().toISOString()
        }));
        
        const { error: expensesError } = await client
          .from('expenses')  // ✅ INGLÉS
          .insert(expensesData);
        
        if (expensesError) throw expensesError;
      }
      
      // 4. Insertar credits
      if (registro.creditos.length > 0) {
        const creditsData = registro.creditos.map((credito, idx) => ({
          id: generateUUID(),
          daily_record_id: recordId,    // ✅ INGLÉS
          categoria: credito.categoria,
          detalle: credito.detalle,
          monto: credito.monto,
          orden: idx + 1,
          created_at: new Date().toISOString()
        }));
        
        const { error: creditsError } = await client
          .from('credits')  // ✅ INGLÉS
          .insert(creditsData);
        
        if (creditsError) throw creditsError;
      }
      
      exitosos++;
      console.log(`✅ ${registro.fecha}: ${registro.ventas.length}V ${registro.gastos.length}G ${registro.creditos.length}C`);
      
      // Actualizar progreso
      const progreso = 80 + ((exitosos / registros.length) * 15);
      actualizarBarra(progreso, `${exitosos}/${registros.length} registros`);
      
      // Pausa para no saturar
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      errores++;
      console.error(`❌ Error ${registro.fecha}:`, error.message);
    }
  }
  
  console.log(`📊 Resultado: ${exitosos} exitosos, ${errores} errores`);
  return { exitosos, errores };
}

// ===== INTERFAZ DE PROGRESO =====
function crearBarraProgreso() {
  const div = document.createElement('div');
  div.id = 'progressBarLimpia';
  div.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      min-width: 350px;
      border: 2px solid #059669;
    ">
      <h4 style="margin: 0 0 15px 0; color: #059669;">📊 Importación Excel</h4>
      <div style="background: #f0f0f0; height: 20px; border-radius: 10px; overflow: hidden; margin-bottom: 10px;">
        <div id="barraInternaLimpia" style="height: 100%; background: linear-gradient(90deg, #059669, #10b981); width: 0%; transition: width 0.5s;"></div>
      </div>
      <p id="textoProgresoLimpio" style="margin: 0; text-align: center; color: #374151;">Iniciando...</p>
    </div>
  `;
  document.body.appendChild(div);
}

function actualizarBarra(porcentaje, mensaje) {
  const barra = document.getElementById('barraInternaLimpia');
  const texto = document.getElementById('textoProgresoLimpio');
  
  if (barra) barra.style.width = `${porcentaje}%`;
  if (texto) texto.textContent = mensaje;
}

function eliminarBarraProgreso() {
  const div = document.getElementById('progressBarLimpia');
  if (div) div.remove();
}

// ===== INTERFAZ PRINCIPAL =====
function crearInterfazLimpia() {
  const container = document.getElementById('importContainer') || document.body;
  
  const existing = container.querySelector('.import-limpia');
  if (existing) existing.remove();
  
  const interfaz = document.createElement('div');
  interfaz.className = 'import-limpia';
  interfaz.innerHTML = `
    <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: white; margin: 0 0 10px 0;">📊 Importador Excel LIMPIO</h2>
        <p style="color: rgba(255,255,255,0.9); margin: 0;">Versión sin nombres en español - Solo inglés</p>
      </div>
      
      <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 10px; font-weight: 600; color: white;">
          📁 Archivo Excel:
        </label>
        <input type="file" id="excelFileInput" accept=".xlsx,.xls" 
               style="padding: 10px; border: none; border-radius: 6px; width: 100%; background: white; color: #374151;">
      </div>
      
      <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="color: white; margin: 0 0 10px 0;">✅ Correcciones:</h4>
        <ul style="margin: 0; padding-left: 20px; color: rgba(255,255,255,0.9); font-size: 14px;">
          <li>Código completamente reescrito ✅</li>
          <li>Solo nombres en inglés: daily_records, sales, expenses, credits ✅</li>
          <li>Sin referencias a español ✅</li>
          <li>Debugging mejorado ✅</li>
        </ul>
      </div>
      
      <div style="text-align: center;">
        <button onclick="importarExcelLimpio()" 
                style="background: #1f2937; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; margin-right: 10px;">
          🚀 Importar LIMPIO
        </button>
        
        <button onclick="this.closest('.import-limpia').style.display='none'" 
                style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">
          ❌ Cancelar
        </button>
      </div>
    </div>
  `;
  
  container.appendChild(interfaz);
}

// Reemplazar función original
function iniciarImportacionDirecta() {
  const currentUser = SupabaseAuth.getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    alert('❌ Solo administradores pueden importar');
    return;
  }
  crearInterfazLimpia();
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
  window.importarExcelLimpio = importarExcelLimpio;
  window.crearInterfazLimpia = crearInterfazLimpia;
  window.iniciarImportacionDirecta = iniciarImportacionDirecta;
  
  console.log('✅ Importador LIMPIO cargado');
  console.log('🔧 Solo nombres en inglés - Sin español');
}