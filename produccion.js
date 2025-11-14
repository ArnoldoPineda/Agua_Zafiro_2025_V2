// ============================================
// MÓDULO DE PRODUCCIÓN - AGUA ZAFIRO
// Versión 2.5 (CORREGIDA - Peso Bobina VERDADERAMENTE OPCIONAL)
// ============================================

// Variables globales
let registrosBobinas = [];
let registrosProduccion = [];
let registrosBotellones = [];
let registrosCalidad = [];
let diaIniciado = false;
let contadorInicial = 0;
let numeroBobinaCounter = 0;
let currentUser = null;
let fechaDiaActual = '';

// ============================================
// 1. INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🏭 Iniciando módulo de producción v2.5...');
  
  // Verificar autenticación
  currentUser = checkPagePermissions();
  if (!currentUser) {
    console.error('❌ Usuario no autenticado');
    window.location.href = '/';
    return;
  }

  // Verificar rol
  if (!['admin', 'produccion'].includes(currentUser.role)) {
    console.error('❌ Acceso denegado');
    mostrarAlertaPrincipal('❌ No tienes permiso para acceder a Producción', 'error');
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
    return;
  }

  console.log('✅ Usuario autenticado:', currentUser.username, '- Rol:', currentUser.role);

  if (!window.supabaseClient) {
    console.error('❌ Supabase no está configurado');
    mostrarAlertaPrincipal('❌ Error: Supabase no configurado', 'error');
    return;
  }

  configurarEventos();
  console.log('✅ Módulo de producción v2.5 iniciado correctamente');
});

// ============================================
// 2. CONFIGURACIÓN DE EVENTOS
// ============================================

function configurarEventos() {
  // BOLSAS - Guardar todo (ÚNICO BOTÓN)
  const btnRegistrarTodo = document.getElementById('btn_registrar_todo');
  if (btnRegistrarTodo) {
    btnRegistrarTodo.addEventListener('click', guardarTodo);
  }

  // BOTELLONES - Registrar lote
  const btnRegistrarBotellones = document.getElementById('btn_registrar_botellones');
  if (btnRegistrarBotellones) {
    btnRegistrarBotellones.addEventListener('click', registrarBotellones);
  }

  // CALIDAD - Registrar prueba
  const btnRegistrarCalidad = document.getElementById('btn_registrar_calidad');
  if (btnRegistrarCalidad) {
    btnRegistrarCalidad.addEventListener('click', registrarCalidad);
  }

  // Listeners para cálculos automáticos - BOLSAS
  const bolsitasProducidas = document.getElementById('bolsitas_producidas');
  const bolsitasRechazadas = document.getElementById('bolsitas_rechazadas_prod');
  
  if (bolsitasProducidas) {
    bolsitasProducidas.addEventListener('change', calcularPacksProduccion);
  }
  if (bolsitasRechazadas) {
    bolsitasRechazadas.addEventListener('change', () => {
      calcularPacksProduccion();
      validarMotivoRechazo_Bolsa();
    });
  }

  // ============ LISTENER PARA AUTO-GENERAR NÚMERO DE BOBINA ============
  const pesoBobinaInput = document.getElementById('peso_bobina');
  if (pesoBobinaInput) {
    pesoBobinaInput.addEventListener('change', generarNumeroBobina);
  }

  // Listeners para contador en BOLSAS
  const contadorCierre = document.getElementById('contador_cierre');
  if (contadorCierre) {
    contadorCierre.addEventListener('input', calcularFactorAjuste);
    contadorCierre.addEventListener('change', calcularFactorAjuste);
  }

  // AGREGAR TAMBIÉN listener para contador inicial
  const contadorInicio = document.getElementById('contador_inicio');
  if (contadorInicio) {
    contadorInicio.addEventListener('input', calcularFactorAjuste);
    contadorInicio.addEventListener('change', calcularFactorAjuste);
  }

  // Listener para botellones rechazados - validar motivo
  const botellonesRechazados = document.getElementById('botellones_rechazados');
  if (botellonesRechazados) {
    botellonesRechazados.addEventListener('change', validarMotivoRechazo_Botellones);
  }

  console.log('✅ Eventos configurados');
}

// ============================================
// 3. VALIDACIONES CONDICIONALES
// ============================================

// BOLSAS: Motivo obligatorio SOLO si hay rechazadas
function validarMotivoRechazo_Bolsa() {
  const rechazadas = parseInt(document.getElementById('bolsitas_rechazadas_prod').value) || 0;
  const labelMotivo = document.getElementById('label_motivo_bolsa');
  const selectMotivo = document.getElementById('motivo_rechazo_bolsa');

  if (rechazadas > 0) {
    labelMotivo.classList.add('required');
    selectMotivo.required = true;
  } else {
    labelMotivo.classList.remove('required');
    selectMotivo.required = false;
  }
}

// BOTELLONES: Motivo obligatorio SOLO si hay rechazados
function validarMotivoRechazo_Botellones() {
  const rechazados = parseInt(document.getElementById('botellones_rechazados').value) || 0;
  const labelMotivo = document.getElementById('label_motivo_bot');
  const selectMotivo = document.getElementById('motivo_rechazo_bot');

  if (rechazados > 0) {
    labelMotivo.classList.add('required');
    selectMotivo.required = true;
  } else {
    labelMotivo.classList.remove('required');
    selectMotivo.required = false;
  }
}

// ============================================
// 4. AUXILIARES - BOBINAS
// ============================================

function generarNumeroBobina() {
  const pesoBobina = parseFloat(document.getElementById('peso_bobina').value);
  const numeroBobinaInput = document.getElementById('numero_bobina');
  
  if (pesoBobina && pesoBobina > 0) {
    // Solo contar bobinas REALES (no temporales)
    const bobinasReales = registrosBobinas.filter(b => !b.id.startsWith('temp_'));
    const proximoNumero = bobinasReales.length + 1;
    
    numeroBobinaInput.value = `Bobina #${proximoNumero}`;
    console.log(`✅ Bobina configurada: #${proximoNumero} - ${pesoBobina}kg`);
    
  } else {
    numeroBobinaInput.value = '';
  }
}

function agregarFilaBobina(registro) {
  const tabla = document.getElementById('tabla_bobinas');
  
  if (tabla.querySelector('tbody tr td[colspan]')) {
    tabla.querySelector('tbody').innerHTML = '';
  }

  const fila = document.createElement('tr');
  const esAdmin = currentUser.role === 'admin';
  
  fila.innerHTML = `
    <td><span class="badge badge-info" style="background-color: #dbeafe; color: #1e40af;">#${registro.numeroBobina}</span></td>
    <td>${registro.pesoBobina.toFixed(1)}</td>
    <td>
      ${esAdmin ? `
        <button class="btn btn-sm btn-outline-warning" onclick="editarBobina('${registro.id}')">
          <i class="bi bi-pencil"></i> Editar
        </button>
      ` : ''}
      <button class="btn btn-sm btn-outline-danger" onclick="eliminarBobina('${registro.id}')" ${esAdmin ? '' : 'disabled'}>
        <i class="bi bi-trash"></i>
      </button>
    </td>
  `;
  tabla.querySelector('tbody').appendChild(fila);
}

function limpiarFormularioBobina() {
  document.getElementById('peso_bobina').value = '';
  document.getElementById('numero_bobina').value = '';
}

function actualizarSelectBobinas() {
  const select = document.getElementById('bobina_produccion');
  select.innerHTML = '<option value="">-- Selecciona una bobina --</option>';
  
  registrosBobinas.forEach(bobina => {
    const option = document.createElement('option');
    option.value = bobina.id;
    option.textContent = `Bobina #${bobina.numeroBobina} - ${bobina.pesoBobina.toFixed(1)}kg`;
    select.appendChild(option);
  });
}

// ✅ EDITAR BOBINA
async function editarBobina(id) {
  const bobina = registrosBobinas.find(b => b.id === id);
  if (!bobina) {
    mostrarAlerta('Bobina no encontrada', 'error');
    return;
  }

  const nuevoPeso = prompt(`Editar peso de Bobina #${bobina.numeroBobina}\n\nPeso actual: ${bobina.pesoBobina}kg\n\nNuevo peso:`, bobina.pesoBobina);
  
  if (nuevoPeso === null) return;
  
  const peso = parseFloat(nuevoPeso);
  if (isNaN(peso) || peso <= 0) {
    mostrarAlerta('El peso debe ser un número válido > 0', 'error');
    return;
  }

  try {
    const { error } = await window.supabaseClient
      .from('control_bobinas')
      .update({ peso_bobina: peso })
      .eq('id', id);

    if (error) throw error;

    bobina.pesoBobina = peso;
    
    const tabla = document.getElementById('tabla_bobinas');
    tabla.querySelector('tbody').innerHTML = '';
    registrosBobinas.forEach(r => agregarFilaBobina(r));
    
    actualizarSelectBobinas();
    mostrarAlerta('✅ Bobina actualizada correctamente', 'success');
  } catch (error) {
    console.error('❌ Error al editar bobina:', error);
    mostrarAlerta('Error al editar: ' + error.message, 'error');
  }
}

async function eliminarBobina(id) {
  if (!confirm('⚠️ ¿Estás seguro de eliminar esta bobina?')) return;

  try {
    const { error } = await window.supabaseClient
      .from('control_bobinas')
      .delete()
      .eq('id', id);

    if (error) throw error;

    registrosBobinas = registrosBobinas.filter(r => r.id !== id);
    const tabla = document.getElementById('tabla_bobinas');
    
    if (registrosBobinas.length === 0) {
      tabla.querySelector('tbody').innerHTML = `
        <tr>
          <td colspan="3" class="text-center text-muted" style="padding: 2rem;">
            <i class="bi bi-inbox"></i> No hay bobinas registradas aún
          </td>
        </tr>
      `;
    } else {
      tabla.querySelector('tbody').innerHTML = '';
      registrosBobinas.forEach(r => agregarFilaBobina(r));
    }
    
    actualizarSelectBobinas();
    mostrarAlerta('✅ Bobina eliminada', 'success');
  } catch (error) {
    console.error('❌ Error al eliminar bobina:', error);
    mostrarAlerta('Error al eliminar la bobina', 'error');
  }
}

// ============================================
// 5. GUARDAR BOBINA EN BD
// ============================================

// ✅ GUARDAR BOBINA EN BD Y RETORNAR ID
async function guardarBobina(pesoBobina, fechaActual) {
  numeroBobinaCounter++;

  const { data, error } = await window.supabaseClient
    .from('control_bobinas')
    .insert([{
      fecha: fechaActual,
      numero_bobina: numeroBobinaCounter,
      peso_bobina: pesoBobina,
      operador: currentUser.username,
      created_by: currentUser.id  // Puede ser NULL si el usuario no existe
    }])
    .select();

  if (error) throw error;
  
  console.log('✅ Bobina guardada en BD:', data[0]);
  
  return { 
    id: data[0].id, 
    numeroBobina: numeroBobinaCounter,
    pesoBobina: pesoBobina
  };
}

// ============================================
// 6. GUARDAR TODO (BOBINA + PRODUCCIÓN) ✅ CORREGIDO v2.5
// ============================================

async function guardarTodo() {
  // ✅ LIMPIAR BOBINAS TEMPORALES
  const bobinaExistenteId = document.getElementById('bobina_produccion').value;
  if (bobinaExistenteId && bobinaExistenteId.startsWith('temp_')) {
    console.log('⚠️ Bobina temporal, limpiando...');
    document.getElementById('bobina_produccion').value = '';
  }

  // ============ VALIDAR CONTROL DIARIO ============
  const fecha = document.getElementById('fecha_bolsas').value;
  const contadorIni = parseInt(document.getElementById('contador_inicio').value);
  const contadorCierr = parseInt(document.getElementById('contador_cierre').value);

  if (!fecha || (!contadorIni && contadorIni !== 0) || (!contadorCierr && contadorCierr !== 0)) {
    mostrarAlerta('Por favor completa: Fecha, Contador Inicial y Contador Cierre', 'error');
    return;
  }

  // ============ VALIDAR PRODUCCIÓN ============
  const bolsitasProducidas = parseInt(document.getElementById('bolsitas_producidas').value);
  const bolsitasRechazadas = parseInt(document.getElementById('bolsitas_rechazadas_prod').value) || 0;
  const motivoRechazo = document.getElementById('motivo_rechazo_bolsa').value;
  const packsCalculados = parseInt(document.getElementById('packs_calculados').value) || 0;
  const packsOperador = parseInt(document.getElementById('packs_operador').value);

  if (!bolsitasProducidas) {
    mostrarAlerta('Por favor completa Bolsitas Producidas', 'error');
    return;
  }

  if (bolsitasRechazadas > 0 && !motivoRechazo) {
    mostrarAlerta('Debes seleccionar un motivo de rechazo', 'error');
    return;
  }

  if ((!packsOperador && packsOperador !== 0) || packsOperador === '') {
    mostrarAlerta('Por favor ingresa los Packs que empacó el operador', 'error');
    return;
  }

  try {
    // ========== DETERMINAR BOBINA (✅ VERDADERAMENTE OPCIONAL v2.5) ==========
    const pesoBobina = parseFloat(document.getElementById('peso_bobina').value) || null;
    
    let bobinaId = null;              // ✅ INICIALIZA EN NULL
    let numeroBobina = null;

    // Caso 1: Crear bobina NUEVA (si hay peso)
if (pesoBobina && pesoBobina > 0) {
  try {
    const bobinaNueva = await guardarBobina(pesoBobina, fecha);
    bobinaId = bobinaNueva.id;
    numeroBobina = bobinaNueva.numeroBobina;
    
    const registroBobina = {
      id: bobinaId,
      numeroBobina: numeroBobina,
      pesoBobina: bobinaNueva.pesoBobina
    };
    registrosBobinas.push(registroBobina);
    agregarFilaBobina(registroBobina);
    actualizarSelectBobinas();
    
    // ✅ SELECCIONAR AUTOMÁTICAMENTE LA BOBINA RECIÉN CREADA
    setTimeout(() => {
      const selectBobina = document.getElementById('bobina_produccion');
      selectBobina.value = bobinaId;
      console.log(`✅ Bobina #${numeroBobina} seleccionada automáticamente en el select`);
    }, 100);
    
  } catch (error) {
    mostrarAlerta('Error al guardar bobina: ' + error.message, 'error');
    return;
  }
}
    // Caso 2: Usar bobina EXISTENTE (si está seleccionada)
    else if (bobinaExistenteId) {
      const bobinaExistente = registrosBobinas.find(b => b.id === bobinaExistenteId);
      if (!bobinaExistente) {
        mostrarAlerta('Por favor selecciona una bobina válida', 'error');
        return;
      }
      bobinaId = bobinaExistenteId;
      numeroBobina = bobinaExistente.numeroBobina;
    }
    // Caso 3: SIN BOBINA - ✅ PERMITE GRABAR (bobinaId = NULL)
    // Simplemente continúa sin hacer nada más
    
    console.log('ℹ️ Bobina:', bobinaId ? `#${numeroBobina}` : 'SIN BOBINA (NULL)');

    // ========== 2️⃣ GUARDAR/ACTUALIZAR CONTROL DE CONTADOR CON UPSERT ==========
    const diferencia = contadorCierr - contadorIni;
    const factorAjuste = diferencia > 0 ? (bolsitasProducidas / diferencia).toFixed(3) : 0;

    const { error: errorContador } = await window.supabaseClient
      .from('control_contador_diario')
      .upsert([{
        fecha: fecha,
        contador_inicio: contadorIni,
        contador_cierre: contadorCierr,
        bolsitas_reales_registradas: bolsitasProducidas,
        factor_ajuste: factorAjuste,
        operador: currentUser.username
      }], { 
        onConflict: 'fecha'
      });

    if (errorContador) {
      console.error('⚠️ Error al guardar contador:', errorContador);
      throw errorContador;
    }
    
    console.log('✅ Contador guardado/actualizado para:', fecha);

    // 3️⃣ GUARDAR PRODUCCIÓN DE BOLSAS
const { data: dataProduccion, error: errorProduccion } = await window.supabaseClient
  .from('control_produccion_bolsas')
  .insert([{
    fecha: fecha,
    bobina_id: bobinaId,  // ✅ Puede ser NULL
    bolsitas_producidas: bolsitasProducidas,
    bolsitas_rechazadas: bolsitasRechazadas,
    motivo_rechazo: motivoRechazo || null,  // ✅ Puede ser NULL
    packs_calculados: packsCalculados,
    packs_operador: packsOperador,
    operador: currentUser.username,
    created_by: null  // ✅ CAMBIAR A NULL (para evitar foreign key error)
  }])
  .select();

    if (errorProduccion) throw errorProduccion;

    // ========== ACTUALIZAR INTERFAZ ==========
    const registroProduccion = {
      id: dataProduccion[0].id,
      bobinaId: bobinaId,
      numeroBobina: numeroBobina || '--',
      bolsitasProducidas,
      bolsitasRechazadas,
      motivoRechazo,
      packsCalculados,
      packsOperador
    };

    registrosProduccion.push(registroProduccion);
    agregarFilaProduccion(registroProduccion);
    
    limpiarFormularioBobina();
    limpiarFormularioProduccion();
    actualizarEstadisticasFinales();

    const tipoGuardado = pesoBobina && pesoBobina > 0 ? 'Bobina Nueva + Producción' : 
                         bobinaExistenteId ? 'Producción (bobina existente)' : 
                         'Producción (sin bobina)';  // ✅ NUEVO
    mostrarAlerta(`✅ ¡GUARDADO! ${tipoGuardado}`, 'success');

  } catch (error) {
    console.error('❌ Error al guardar TODO:', error);
    mostrarAlerta('Error al guardar: ' + error.message, 'error');
  }
}

function calcularPacksProduccion() {
  const bolsitasProducidas = parseInt(document.getElementById('bolsitas_producidas').value) || 0;
  const bolsitasRechazadas = parseInt(document.getElementById('bolsitas_rechazadas_prod').value) || 0;
  
  const bolsitasValidas = bolsitasProducidas - bolsitasRechazadas;
  const packsCalculados = Math.floor(bolsitasValidas / 35);
  const residuo = bolsitasValidas % 35;

  document.getElementById('packs_calculados').value = packsCalculados;

  const alertaDiv = document.getElementById('alerta_packs');
  const alertaText = document.getElementById('alerta_packs_text');

  if (residuo > 0) {
    alertaText.innerHTML = `Deberían ser <strong>${packsCalculados}</strong> packs. Hay ${residuo} bolsita(s) incompleta(s).`;
    alertaDiv.style.display = 'block';
  } else if (bolsitasRechazadas > 0) {
    alertaText.innerHTML = `Bolsitas válidas: ${bolsitasValidas} (${bolsitasProducidas} - ${bolsitasRechazadas} rechazadas)`;
    alertaDiv.style.display = 'block';
  } else {
    alertaDiv.style.display = 'none';
  }
}

function agregarFilaProduccion(registro) {
  const tabla = document.getElementById('tabla_produccion');
  
  if (tabla.querySelector('tbody tr td[colspan]')) {
    tabla.querySelector('tbody').innerHTML = '';
  }

  const fila = document.createElement('tr');
  const colorPacks = registro.packsCalculados === registro.packsOperador ? 'badge-success' : 'badge-warning';
  const esAdmin = currentUser.role === 'admin';
  
  fila.innerHTML = `
    <td><span class="badge badge-info" style="background-color: #dbeafe; color: #1e40af;">${registro.numeroBobina}</span></td>
    <td><span class="badge badge-success">${registro.bolsitasProducidas}</span></td>
    <td><span class="badge badge-danger">${registro.bolsitasRechazadas}</span></td>
    <td>${registro.packsCalculados}</td>
    <td><span class="badge ${colorPacks}">${registro.packsOperador}</span></td>
    <td>${registro.motivoRechazo || '--'}</td>
    <td>
      ${esAdmin ? `
        <button class="btn btn-sm btn-outline-warning" onclick="editarProduccion('${registro.id}')">
          <i class="bi bi-pencil"></i> Editar
        </button>
      ` : ''}
      <button class="btn btn-sm btn-outline-danger" onclick="eliminarProduccion('${registro.id}')" ${esAdmin ? '' : 'disabled'}>
        <i class="bi bi-trash"></i>
      </button>
    </td>
  `;
  tabla.querySelector('tbody').appendChild(fila);
}

// ✅ EDITAR PRODUCCIÓN
async function editarProduccion(id) {
  const registro = registrosProduccion.find(r => r.id === id);
  if (!registro) {
    mostrarAlerta('Registro no encontrado', 'error');
    return;
  }

  const nuevosPacks = prompt(`Editar Packs para Bobina #${registro.numeroBobina}\n\nPacks Operador actual: ${registro.packsOperador}\n\nNuevo valor:`, registro.packsOperador);
  
  if (nuevosPacks === null) return;
  
  const packs = parseInt(nuevosPacks);
  if (isNaN(packs) || packs < 0) {
    mostrarAlerta('Los packs deben ser un número válido ≥ 0', 'error');
    return;
  }

  try {
    const { error } = await window.supabaseClient
      .from('control_produccion_bolsas')
      .update({ packs_operador: packs })
      .eq('id', id);

    if (error) throw error;

    registro.packsOperador = packs;
    
    const tabla = document.getElementById('tabla_produccion');
    tabla.querySelector('tbody').innerHTML = '';
    registrosProduccion.forEach(r => agregarFilaProduccion(r));
    
    actualizarEstadisticasFinales();
    mostrarAlerta('✅ Producción actualizada correctamente', 'success');
  } catch (error) {
    console.error('❌ Error al editar producción:', error);
    mostrarAlerta('Error al editar: ' + error.message, 'error');
  }
}

function limpiarFormularioProduccion() {
  document.getElementById('bobina_produccion').value = '';
  document.getElementById('bolsitas_producidas').value = '';
  document.getElementById('bolsitas_rechazadas_prod').value = '0';
  document.getElementById('motivo_rechazo_bolsa').value = '';
  document.getElementById('packs_calculados').value = '';
  document.getElementById('packs_operador').value = '';
  document.getElementById('alerta_packs').style.display = 'none';
  validarMotivoRechazo_Bolsa();
}

async function eliminarProduccion(id) {
  if (!confirm('⚠️ ¿Estás seguro de eliminar este registro de producción?')) return;

  try {
    const { error } = await window.supabaseClient
      .from('control_produccion_bolsas')
      .delete()
      .eq('id', id);

    if (error) throw error;

    registrosProduccion = registrosProduccion.filter(r => r.id !== id);
    const tabla = document.getElementById('tabla_produccion');
    
    if (registrosProduccion.length === 0) {
      tabla.querySelector('tbody').innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted" style="padding: 2rem;">
            <i class="bi bi-inbox"></i> No hay registros aún
          </td>
        </tr>
      `;
    } else {
      tabla.querySelector('tbody').innerHTML = '';
      registrosProduccion.forEach(r => agregarFilaProduccion(r));
    }
    
    actualizarEstadisticasFinales();
    mostrarAlerta('✅ Registro eliminado', 'success');
  } catch (error) {
    console.error('❌ Error al eliminar:', error);
    mostrarAlerta('Error al eliminar el registro', 'error');
  }
}

function actualizarEstadisticasFinales() {
  const totalBobinas = registrosBobinas.length;
  const totalBolsitas = registrosProduccion.reduce((sum, r) => sum + r.bolsitasProducidas, 0);
  const totalPacksOperador = registrosProduccion.reduce((sum, r) => sum + r.packsOperador, 0);

  document.getElementById('stat_bobinas_totales').textContent = totalBobinas;
  document.getElementById('stat_bolsitas_producidas').textContent = totalBolsitas;
  document.getElementById('stat_packs_operador_total').textContent = totalPacksOperador;
}

function calcularFactorAjuste() {
  console.log('✅ calcularFactorAjuste() ejecutada');
  
  const contadorInicioElem = document.getElementById('contador_inicio');
  const contadorCierreElem = document.getElementById('contador_cierre');
  const diferenciElem = document.getElementById('diferencia_contador');
  
  if (!contadorInicioElem || !contadorCierreElem || !diferenciElem) {
    console.error('❌ No se encontraron los elementos');
    return;
  }

  const inicio = parseInt(contadorInicioElem.value) || 0;
  const cierre = parseInt(contadorCierreElem.value) || 0;
  const diferencia = cierre - inicio;

  console.log(`🔢 Inicio: ${inicio}, Cierre: ${cierre}, Diferencia: ${diferencia}`);

  diferenciElem.value = diferencia;
  
  console.log(`✅ Diferencia mostrada: ${diferenciElem.value}`);
}

// ============================================
// 7. SECCIÓN: BOTELLONES - REGISTRAR LOTE
// ============================================

async function registrarBotellones() {
  const fecha = document.getElementById('fecha_botellones').value;
  const horaInicio = document.getElementById('hora_inicio_bot').value;
  const horaCierre = document.getElementById('hora_cierre_bot').value;
  const botellonesProducidos = parseInt(document.getElementById('botellones_producidos').value);
  const botellonesRechazados = parseInt(document.getElementById('botellones_rechazados').value) || 0;
  const motivoRechazo = document.getElementById('motivo_rechazo_bot').value;
  const observaciones = document.getElementById('observaciones_bot').value;

  if (!fecha || !horaInicio || !horaCierre || !botellonesProducidos) {
    mostrarAlerta('Por favor completa todos los campos requeridos', 'error');
    return;
  }

  if (botellonesRechazados > 0 && !motivoRechazo) {
    mostrarAlerta('Debes seleccionar un motivo de rechazo', 'error');
    return;
  }

  try {
    const { data, error } = await window.supabaseClient
      .from('control_botellones')
      .insert([{
        fecha: fecha,
        hora_inicio: horaInicio,
        hora_cierre: horaCierre,
        botellones_producidos: botellonesProducidos,
        botellones_rechazados: botellonesRechazados,
        motivo_rechazo: motivoRechazo || null,
        observaciones: observaciones || null,
        operador: currentUser.username,
        created_by: currentUser.id
      }])
      .select();

    if (error) throw error;

    const registro = {
      id: data[0].id,
      fecha,
      horaInicio,
      horaCierre,
      botellonesProducidos,
      botellonesRechazados,
      motivoRechazo,
      observaciones
    };

    registrosBotellones.push(registro);
    agregarFilaTablaBot(registro);
    limpiarFormularioBotellones();
    actualizarEstadisticasBotellones();

    mostrarAlerta('✅ Lote de botellones registrado correctamente', 'success');

  } catch (error) {
    console.error('❌ Error al registrar botellones:', error);
    mostrarAlerta('Error al registrar el lote: ' + error.message, 'error');
  }
}

function agregarFilaTablaBot(registro) {
  const tabla = document.getElementById('tabla_botellones');
  
  if (tabla.querySelector('tbody tr td[colspan]')) {
    tabla.querySelector('tbody').innerHTML = '';
  }

  const fila = document.createElement('tr');
  const esAdmin = currentUser.role === 'admin';
  
  fila.innerHTML = `
    <td>${registro.fecha}</td>
    <td>${registro.horaInicio}</td>
    <td>${registro.horaCierre}</td>
    <td><span class="badge badge-success">${registro.botellonesProducidos}</span></td>
    <td><span class="badge badge-danger">${registro.botellonesRechazados}</span></td>
    <td>${registro.motivoRechazo || '--'}</td>
    <td>${registro.observaciones || '--'}</td>
    <td>
      ${esAdmin ? `
        <button class="btn btn-sm btn-outline-warning" onclick="editarBotellones('${registro.id}')">
          <i class="bi bi-pencil"></i> Editar
        </button>
      ` : ''}
      <button class="btn btn-sm btn-outline-danger" onclick="eliminarRegistroBot('${registro.id}')" ${esAdmin ? '' : 'disabled'}>
        <i class="bi bi-trash"></i>
      </button>
    </td>
  `;
  tabla.querySelector('tbody').appendChild(fila);
}

// ✅ EDITAR BOTELLONES
async function editarBotellones(id) {
  const registro = registrosBotellones.find(r => r.id === id);
  if (!registro) {
    mostrarAlerta('Registro no encontrado', 'error');
    return;
  }

  const nuevosBotellones = prompt(`Editar Botellones Producidos - ${registro.fecha}\n\nValor actual: ${registro.botellonesProducidos}\n\nNuevo valor:`, registro.botellonesProducidos);
  
  if (nuevosBotellones === null) return;
  
  const botellones = parseInt(nuevosBotellones);
  if (isNaN(botellones) || botellones < 0) {
    mostrarAlerta('Los botellones deben ser un número válido ≥ 0', 'error');
    return;
  }

  try {
    const { error } = await window.supabaseClient
      .from('control_botellones')
      .update({ botellones_producidos: botellones })
      .eq('id', id);

    if (error) throw error;

    registro.botellonesProducidos = botellones;
    
    const tabla = document.getElementById('tabla_botellones');
    tabla.querySelector('tbody').innerHTML = '';
    registrosBotellones.forEach(r => agregarFilaTablaBot(r));
    
    actualizarEstadisticasBotellones();
    mostrarAlerta('✅ Botellones actualizados correctamente', 'success');
  } catch (error) {
    console.error('❌ Error al editar botellones:', error);
    mostrarAlerta('Error al editar: ' + error.message, 'error');
  }
}

function limpiarFormularioBotellones() {
  document.getElementById('fecha_botellones').value = new Date().toISOString().split('T')[0];
  document.getElementById('hora_inicio_bot').value = '';
  document.getElementById('hora_cierre_bot').value = '';
  document.getElementById('botellones_producidos').value = '';
  document.getElementById('botellones_rechazados').value = '0';
  document.getElementById('motivo_rechazo_bot').value = '';
  document.getElementById('observaciones_bot').value = '';
  validarMotivoRechazo_Botellones();
}

function actualizarEstadisticasBotellones() {
  const totalProducidos = registrosBotellones.reduce((sum, r) => sum + r.botellonesProducidos, 0);
  const totalRechazados = registrosBotellones.reduce((sum, r) => sum + r.botellonesRechazados, 0);
  const eficiencia = totalProducidos > 0 ? (((totalProducidos - totalRechazados) / totalProducidos) * 100).toFixed(1) : 100;

  document.getElementById('stat_botellones_producidos').textContent = totalProducidos;
  document.getElementById('stat_botellones_rechazados_total').textContent = totalRechazados;
  document.getElementById('stat_eficiencia_botellones').textContent = eficiencia + '%';
}

async function eliminarRegistroBot(id) {
  if (!confirm('⚠️ ¿Estás seguro de eliminar este lote?')) return;

  try {
    const { error } = await window.supabaseClient
      .from('control_botellones')
      .delete()
      .eq('id', id);

    if (error) throw error;

    registrosBotellones = registrosBotellones.filter(r => r.id !== id);
    const tabla = document.getElementById('tabla_botellones');
    
    if (registrosBotellones.length === 0) {
      tabla.querySelector('tbody').innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted" style="padding: 2rem;">
            <i class="bi bi-inbox"></i> No hay registros aún
          </td>
        </tr>
      `;
    } else {
      tabla.querySelector('tbody').innerHTML = '';
      registrosBotellones.forEach(r => agregarFilaTablaBot(r));
    }
    
    actualizarEstadisticasBotellones();
    mostrarAlerta('✅ Lote eliminado', 'success');
  } catch (error) {
    console.error('❌ Error al eliminar:', error);
    mostrarAlerta('Error al eliminar el lote: ' + error.message, 'error');
  }
}

// ============================================
// 8. SECCIÓN: CALIDAD - REGISTRAR PRUEBA
// ============================================

async function registrarCalidad() {
  const fecha = document.getElementById('fecha_calidad').value;
  const tds = parseFloat(document.getElementById('tds_calidad').value);
  const usm = parseFloat(document.getElementById('usm_calidad').value);
  const temperatura = parseFloat(document.getElementById('temperatura_calidad').value);
  const phInput = document.getElementById('ph_calidad').value;
  const ph = phInput ? parseFloat(phInput) : null; // ✅ PH opcional
  const observaciones = document.getElementById('observaciones_calidad').value;

  // ✅ PH ahora es OPCIONAL
  if (!fecha || isNaN(tds) || isNaN(usm) || isNaN(temperatura)) {
    mostrarAlerta('Por favor completa todos los campos requeridos (TDS, USM, Temperatura)', 'error');
    return;
  }

  // ✅ Solo validar PH si tiene valor
  if (ph !== null && (ph < 0 || ph > 14)) {
    mostrarAlerta('El PH debe estar entre 0 y 14', 'error');
    return;
  }

  if (ph < 0 || ph > 14) {
    mostrarAlerta('El PH debe estar entre 0 y 14', 'error');
    return;
  }

  if (temperatura < -10 || temperatura > 50) {
    mostrarAlerta('La temperatura debe estar entre -10°C y 50°C', 'error');
    return;
  }

  try {
    const { data, error } = await window.supabaseClient
      .from('control_calidad_agua')
      .insert([{
        fecha: fecha,
        tds: tds,
        usm: usm,
        temperatura: temperatura,
        ph: ph,
        observaciones: observaciones || null,
        cumple_estandares: tds <= 150 && ph >= 6.5 && ph <= 8.5,
        analista: currentUser.username,
        created_by: currentUser.id
      }])
      .select();

    if (error) throw error;

    const registro = {
      id: data[0].id,
      fecha,
      tds,
      usm,
      temperatura,
      ph,
      observaciones
    };

    registrosCalidad.push(registro);
    agregarFilaTablaCalidad(registro);
    limpiarFormularioCalidad();
    actualizarEstadisticasCalidad();

    mostrarAlerta('✅ Prueba de calidad registrada correctamente', 'success');

  } catch (error) {
    console.error('❌ Error al registrar calidad:', error);
    mostrarAlerta('Error al registrar la prueba: ' + error.message, 'error');
  }
}

function agregarFilaTablaCalidad(registro) {
  const tabla = document.getElementById('tabla_calidad');
  
  if (tabla.querySelector('tbody tr td[colspan]')) {
    tabla.querySelector('tbody').innerHTML = '';
  }

  const fila = document.createElement('tr');
  const esAdmin = currentUser.role === 'admin';
  
  fila.innerHTML = `
    <td>${registro.fecha}</td>
    <td><span class="badge badge-info" style="background-color: #dbeafe; color: #1e40af;">${registro.tds.toFixed(2)}</span></td>
    <td><span class="badge badge-info" style="background-color: #dbeafe; color: #1e40af;">${registro.usm.toFixed(2)}</span></td>
    <td><span class="badge badge-info" style="background-color: #dbeafe; color: #1e40af;">${registro.temperatura.toFixed(1)}</span></td>
    <td><span class="badge badge-info" style="background-color: #dbeafe; color: #1e40af;">${registro.ph !== null ? registro.ph.toFixed(2) : '--'}</span></td>
    <td>${registro.observaciones || '--'}</td>
    <td>
      ${esAdmin ? `
        <button class="btn btn-sm btn-outline-warning" onclick="editarCalidad('${registro.id}')">
          <i class="bi bi-pencil"></i> Editar
        </button>
      ` : ''}
      <button class="btn btn-sm btn-outline-danger" onclick="eliminarRegistroCalidad('${registro.id}')" ${esAdmin ? '' : 'disabled'}>
        <i class="bi bi-trash"></i>
      </button>
    </td>
  `;
  tabla.querySelector('tbody').appendChild(fila);
}

// ✅ EDITAR CALIDAD
async function editarCalidad(id) {
  const registro = registrosCalidad.find(r => r.id === id);
  if (!registro) {
    mostrarAlerta('Registro no encontrado', 'error');
    return;
  }

  const nuevoTDS = prompt(`Editar TDS - ${registro.fecha}\n\nValor actual: ${registro.tds}\n\nNuevo valor:`, registro.tds);
  
  if (nuevoTDS === null) return;
  
  const tds = parseFloat(nuevoTDS);
  if (isNaN(tds) || tds < 0) {
    mostrarAlerta('El TDS debe ser un número válido ≥ 0', 'error');
    return;
  }

  try {
    const { error } = await window.supabaseClient
      .from('control_calidad_agua')
      .update({ tds: tds })
      .eq('id', id);

    if (error) throw error;

    registro.tds = tds;
    
    const tabla = document.getElementById('tabla_calidad');
    tabla.querySelector('tbody').innerHTML = '';
    registrosCalidad.forEach(r => agregarFilaTablaCalidad(r));
    
    actualizarEstadisticasCalidad();
    mostrarAlerta('✅ Calidad actualizada correctamente', 'success');
  } catch (error) {
    console.error('❌ Error al editar calidad:', error);
    mostrarAlerta('Error al editar: ' + error.message, 'error');
  }
}

function limpiarFormularioCalidad() {
  document.getElementById('fecha_calidad').value = new Date().toISOString().split('T')[0];
  document.getElementById('tds_calidad').value = '';
  document.getElementById('usm_calidad').value = '';
  document.getElementById('temperatura_calidad').value = '';
  document.getElementById('ph_calidad').value = '';
  document.getElementById('observaciones_calidad').value = '';
}

function actualizarEstadisticasCalidad() {
  if (registrosCalidad.length === 0) {
    document.getElementById('stat_tds_promedio').textContent = '--';
    document.getElementById('stat_usm_promedio').textContent = '--';
    document.getElementById('stat_temp_promedio').textContent = '--';
    document.getElementById('stat_ph_promedio').textContent = '--';
    document.getElementById('stat_total_pruebas').textContent = '0';
    return;
  }

  const tdsPromedio = (registrosCalidad.reduce((sum, r) => sum + r.tds, 0) / registrosCalidad.length).toFixed(2);
  const usmPromedio = (registrosCalidad.reduce((sum, r) => sum + r.usm, 0) / registrosCalidad.length).toFixed(2);
  const tempPromedio = (registrosCalidad.reduce((sum, r) => sum + r.temperatura, 0) / registrosCalidad.length).toFixed(1);
  const phPromedio = (registrosCalidad.reduce((sum, r) => sum + r.ph, 0) / registrosCalidad.length).toFixed(2);

  document.getElementById('stat_tds_promedio').textContent = tdsPromedio + ' ppm';
  document.getElementById('stat_usm_promedio').textContent = usmPromedio + ' µS/cm';
  document.getElementById('stat_temp_promedio').textContent = tempPromedio + ' °C';
  document.getElementById('stat_ph_promedio').textContent = phPromedio;
  document.getElementById('stat_total_pruebas').textContent = registrosCalidad.length;
}

async function eliminarRegistroCalidad(id) {
  if (!confirm('⚠️ ¿Estás seguro de eliminar esta prueba?')) return;

  try {
    const { error } = await window.supabaseClient
      .from('control_calidad_agua')
      .delete()
      .eq('id', id);

    if (error) throw error;

    registrosCalidad = registrosCalidad.filter(r => r.id !== id);
    const tabla = document.getElementById('tabla_calidad');
    
    if (registrosCalidad.length === 0) {
      tabla.querySelector('tbody').innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted" style="padding: 2rem;">
            <i class="bi bi-inbox"></i> No hay registros aún
          </td>
        </tr>
      `;
    } else {
      tabla.querySelector('tbody').innerHTML = '';
      registrosCalidad.forEach(r => agregarFilaTablaCalidad(r));
    }
    
    actualizarEstadisticasCalidad();
    mostrarAlerta('✅ Prueba eliminada', 'success');
  } catch (error) {
    console.error('❌ Error al eliminar:', error);
    mostrarAlerta('Error al eliminar la prueba: ' + error.message, 'error');
  }
}

// ============================================
// 9. FUNCIONES AUXILIARES
// ============================================

function mostrarAlerta(mensaje, tipo = 'success') {
  const alertClass = tipo === 'success' ? 'alert-success' : 
                     tipo === 'error' ? 'alert-error' : 'alert-warning';
  const icon = tipo === 'success' ? 'bi-check-circle' : 
               tipo === 'error' ? 'bi-exclamation-circle' : 'bi-exclamation-triangle';
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert ${alertClass}`;
  alertDiv.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    z-index: 10000;
    min-width: 300px;
    padding: 1rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  alertDiv.innerHTML = `
    <i class="bi ${icon}"></i>
    <span>${mensaje}</span>
  `;
  
  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.style.opacity = '0';
    alertDiv.style.transform = 'translateX(400px)';
    alertDiv.style.transition = 'all 0.3s ease';
    setTimeout(() => alertDiv.remove(), 300);
  }, 5000);
}

function mostrarAlertaPrincipal(mensaje, tipo = 'error') {
  const container = document.querySelector('.container') || document.body;
  const alertClass = tipo === 'success' ? 'alert-success' : 'alert-error';
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert ${alertClass}`;
  alertDiv.innerHTML = `<i class="bi ${tipo === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle'}"></i> ${mensaje}`;
  
  container.insertBefore(alertDiv, container.firstChild);
}

// ============================================
// 10. HACER FUNCIONES GLOBALES
// ============================================

window.editarBobina = editarBobina;
window.eliminarBobina = eliminarBobina;
window.editarProduccion = editarProduccion;
window.eliminarProduccion = eliminarProduccion;
window.editarBotellones = editarBotellones;
window.eliminarRegistroBot = eliminarRegistroBot;
window.editarCalidad = editarCalidad;
window.eliminarRegistroCalidad = eliminarRegistroCalidad;
window.guardarTodo = guardarTodo;
window.registrarBotellones = registrarBotellones;
window.registrarCalidad = registrarCalidad;

console.log('✅ Módulo de Producción v2.5 (CORREGIDA - Peso Bobina Opcional) cargado');