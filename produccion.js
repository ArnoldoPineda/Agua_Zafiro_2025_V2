// ============================================
// MÓDULO DE PRODUCCIÓN - AGUA ZAFIRO
// Versión 2.0 - Completamente refactorizado
// Compatible con arquitectura existente
// ============================================

// Variables globales
let registrosBobinas = [];
let registrosProduccion = [];
let registrosBotellones = [];
let registrosCalidad = [];
let diaIniciado = false;
let contadorInicial = 0;
let numeroBobinaCounter = 0;
let supabaseClient = null;
let currentUser = null;

// ============================================
// 1. INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🏭 Iniciando módulo de producción v2.0...');
  
  // Verificar autenticación
  currentUser = checkPagePermissions();
  if (!currentUser) {
    console.error('❌ Usuario no autenticado');
    window.location.href = '/';
    return;
  }

  // Verificar rol - Solo admin y produccion
  if (!['admin', 'produccion'].includes(currentUser.role)) {
    console.error('❌ Acceso denegado - Rol insuficiente');
    mostrarAlertaPrincipal('❌ No tienes permiso para acceder a Producción', 'error');
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
    return;
  }

  console.log('✅ Usuario autenticado:', currentUser.username, '- Rol:', currentUser.role);

  // Inicializar Supabase
  supabaseClient = window.supabaseClient || window.SupabaseProduccion?.supabase;
  if (!supabaseClient) {
    console.error('❌ Supabase no está configurado');
    mostrarAlertaPrincipal('❌ Error: Supabase no configurado', 'error');
    return;
  }

  // Configurar eventos
  configurarEventos();

  console.log('✅ Módulo de producción iniciado correctamente');
});

// ============================================
// 2. CONFIGURACIÓN DE EVENTOS
// ============================================

function configurarEventos() {
  // BOLSAS - Iniciar día
  const btnIniciarDia = document.getElementById('btn_iniciar_dia');
  if (btnIniciarDia) {
    btnIniciarDia.addEventListener('click', iniciarDia);
  }

  // BOLSAS - Registrar bobina
  const btnRegistrarBobina = document.getElementById('btn_registrar_bobina');
  if (btnRegistrarBobina) {
    btnRegistrarBobina.addEventListener('click', registrarBobina);
  }

  // BOLSAS - Registrar producción
  const btnRegistrarProduccion = document.getElementById('btn_registrar_produccion');
  if (btnRegistrarProduccion) {
    btnRegistrarProduccion.addEventListener('click', registrarProduccion);
  }

  // BOLSAS - Cerrar día
  const btnCerrarDia = document.getElementById('btn_cerrar_dia');
  if (btnCerrarDia) {
    btnCerrarDia.addEventListener('click', cerrarDia);
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

  // Listeners para cálculos automáticos
  const bolsitasProducidas = document.getElementById('bolsitas_producidas');
  const bolsitasRechazadas = document.getElementById('bolsitas_rechazadas_prod');
  
  if (bolsitasProducidas) {
    bolsitasProducidas.addEventListener('change', calcularPacksProduccion);
  }
  if (bolsitasRechazadas) {
    bolsitasRechazadas.addEventListener('change', calcularPacksProduccion);
  }

  const contadorCierre = document.getElementById('contador_cierre');
  if (contadorCierre) {
    contadorCierre.addEventListener('change', calcularFactorAjuste);
  }

  console.log('✅ Eventos configurados');
}

// ============================================
// 3. SECCIÓN: BOLSAS - INICIAR DÍA
// ============================================

async function iniciarDia() {
  const contador = parseInt(document.getElementById('contador_inicio').value);
  
  if (!contador && contador !== 0) {
    mostrarAlerta('Por favor ingresa el contador inicial', 'error');
    return;
  }

  try {
    diaIniciado = true;
    contadorInicial = contador;
    numeroBobinaCounter = 0;
    
    const estadoDiv = document.getElementById('estado_dia');
    const estadoText = document.getElementById('estado_dia_text');
    estadoText.textContent = `Contador inicial: ${contador}`;
    estadoDiv.style.display = 'block';

    document.getElementById('btn_iniciar_dia').disabled = true;
    
    mostrarAlerta('✅ Día iniciado correctamente', 'success');
    
  } catch (error) {
    console.error('❌ Error al iniciar día:', error);
    mostrarAlerta('Error al iniciar el día', 'error');
  }
}

// ============================================
// 4. SECCIÓN: BOLSAS - REGISTRAR BOBINA
// ============================================

async function registrarBobina() {
  if (!diaIniciado) {
    mostrarAlerta('⚠️ Debes iniciar el día primero', 'error');
    return;
  }

  const fecha = document.getElementById('fecha_bobina').value;
  const pesoBobina = parseFloat(document.getElementById('peso_bobina').value);

  if (!fecha || !pesoBobina || pesoBobina <= 0) {
    mostrarAlerta('Por favor completa los campos requeridos (peso > 0)', 'error');
    return;
  }

  try {
    numeroBobinaCounter++;

    // Guardar en Supabase
    const { data, error } = await supabaseClient
      .from('control_bobinas')
      .insert([{
        fecha: fecha,
        numero_bobina: numeroBobinaCounter,
        peso_bobina: pesoBobina,
        operador: currentUser.username,
        created_by: currentUser.id
      }])
      .select();

    if (error) throw error;

    const registro = {
      id: data[0].id,
      numeroBobina: numeroBobinaCounter,
      fecha,
      pesoBobina
    };

    registrosBobinas.push(registro);
    agregarFilaBobina(registro);
    actualizarSelectBobinas();
    limpiarFormularioBobina();

    mostrarAlerta(`✅ Bobina #${numeroBobinaCounter} registrada correctamente`, 'success');

  } catch (error) {
    console.error('❌ Error al registrar bobina:', error);
    mostrarAlerta('Error al registrar la bobina', 'error');
  }
}

function agregarFilaBobina(registro) {
  const tabla = document.getElementById('tabla_bobinas');
  
  if (tabla.querySelector('tbody tr td[colspan]')) {
    tabla.querySelector('tbody').innerHTML = '';
  }

  const fila = document.createElement('tr');
  fila.innerHTML = `
    <td>${registro.fecha}</td>
    <td><span class="badge badge-info" style="background-color: #dbeafe; color: #1e40af;">#${registro.numeroBobina}</span></td>
    <td>${registro.pesoBobina.toFixed(1)}</td>
    <td>
      <button class="btn btn-sm btn-outline-danger" onclick="eliminarBobina('${registro.id}')">
        <i class="bi bi-trash"></i>
      </button>
    </td>
  `;
  tabla.querySelector('tbody').appendChild(fila);
}

function limpiarFormularioBobina() {
  document.getElementById('fecha_bobina').value = new Date().toISOString().split('T')[0];
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

async function eliminarBobina(id) {
  if (!confirm('⚠️ ¿Estás seguro de eliminar esta bobina?')) return;

  try {
    const { error } = await supabaseClient
      .from('control_bobinas')
      .delete()
      .eq('id', id);

    if (error) throw error;

    registrosBobinas = registrosBobinas.filter(r => r.id !== id);
    const tabla = document.getElementById('tabla_bobinas');
    
    if (registrosBobinas.length === 0) {
      tabla.querySelector('tbody').innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-muted" style="padding: 2rem;">
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
// 5. SECCIÓN: BOLSAS - REGISTRAR PRODUCCIÓN
// ============================================

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
  } else if (bolsitasValidas !== bolsitasProducidas) {
    alertaText.innerHTML = `Bolsitas válidas: ${bolsitasValidas} (${bolsitasProducidas} - ${bolsitasRechazadas} rechazadas)`;
    alertaDiv.style.display = 'block';
  } else {
    alertaDiv.style.display = 'none';
  }
}

async function registrarProduccion() {
  const fecha = document.getElementById('fecha_produccion').value;
  const bobinaId = document.getElementById('bobina_produccion').value;
  const bolsitasProducidas = parseInt(document.getElementById('bolsitas_producidas').value);
  const bolsitasRechazadas = parseInt(document.getElementById('bolsitas_rechazadas_prod').value) || 0;
  const motivoRechazo = document.getElementById('motivo_rechazo_bolsa').value;
  const packsCalculados = parseInt(document.getElementById('packs_calculados').value) || 0;
  const packsOperador = parseInt(document.getElementById('packs_operador').value);

  if (!fecha || !bobinaId || !bolsitasProducidas || !motivoRechazo || !packsOperador) {
    mostrarAlerta('Por favor completa todos los campos requeridos', 'error');
    return;
  }

  try {
    const bobina = registrosBobinas.find(b => b.id === bobinaId);

    // Guardar en Supabase
    const { data, error } = await supabaseClient
      .from('control_produccion_bolsas')
      .insert([{
        fecha: fecha,
        bobina_id: bobinaId,
        bolsitas_producidas: bolsitasProducidas,
        bolsitas_rechazadas: bolsitasRechazadas,
        motivo_rechazo: motivoRechazo,
        packs_calculados: packsCalculados,
        packs_operador: packsOperador,
        operador: currentUser.username,
        created_by: currentUser.id
      }])
      .select();

    if (error) throw error;

    const registro = {
      id: data[0].id,
      fecha,
      bobinaId,
      numeroBobina: bobina.numeroBobina,
      bolsitasProducidas,
      bolsitasRechazadas,
      motivoRechazo,
      packsCalculados,
      packsOperador
    };

    registrosProduccion.push(registro);
    agregarFilaProduccion(registro);
    limpiarFormularioProduccion();
    actualizarEstadisticasFinales();

    mostrarAlerta('✅ Producción registrada correctamente', 'success');

  } catch (error) {
    console.error('❌ Error al registrar producción:', error);
    mostrarAlerta('Error al registrar la producción', 'error');
  }
}

function agregarFilaProduccion(registro) {
  const tabla = document.getElementById('tabla_produccion');
  
  if (tabla.querySelector('tbody tr td[colspan]')) {
    tabla.querySelector('tbody').innerHTML = '';
  }

  const fila = document.createElement('tr');
  const colorPacks = registro.packsCalculados === registro.packsOperador ? 'badge-success' : 'badge-warning';
  fila.innerHTML = `
    <td>${registro.fecha}</td>
    <td><span class="badge badge-info" style="background-color: #dbeafe; color: #1e40af;">#${registro.numeroBobina}</span></td>
    <td><span class="badge badge-success">${registro.bolsitasProducidas}</span></td>
    <td><span class="badge badge-danger">${registro.bolsitasRechazadas}</span></td>
    <td>${registro.packsCalculados}</td>
    <td><span class="badge ${colorPacks}">${registro.packsOperador}</span></td>
    <td>${registro.motivoRechazo}</td>
    <td>
      <button class="btn btn-sm btn-outline-danger" onclick="eliminarProduccion('${registro.id}')">
        <i class="bi bi-trash"></i>
      </button>
    </td>
  `;
  tabla.querySelector('tbody').appendChild(fila);
}

function limpiarFormularioProduccion() {
  document.getElementById('fecha_produccion').value = new Date().toISOString().split('T')[0];
  document.getElementById('bobina_produccion').value = '';
  document.getElementById('bolsitas_producidas').value = '';
  document.getElementById('bolsitas_rechazadas_prod').value = '0';
  document.getElementById('motivo_rechazo_bolsa').value = '';
  document.getElementById('packs_calculados').value = '';
  document.getElementById('packs_operador').value = '';
  document.getElementById('alerta_packs').style.display = 'none';
}

async function eliminarProduccion(id) {
  if (!confirm('⚠️ ¿Estás seguro de eliminar este registro de producción?')) return;

  try {
    const { error } = await supabaseClient
      .from('control_produccion_bolsas')
      .delete()
      .eq('id', id);

    if (error) throw error;

    registrosProduccion = registrosProduccion.filter(r => r.id !== id);
    const tabla = document.getElementById('tabla_produccion');
    
    if (registrosProduccion.length === 0) {
      tabla.querySelector('tbody').innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted" style="padding: 2rem;">
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
  const cierre = parseInt(document.getElementById('contador_cierre').value);
  const diferencia = cierre - contadorInicial;
  document.getElementById('diferencia_contador').value = diferencia;

  const totalBolsitas = registrosProduccion.reduce((sum, r) => sum + r.bolsitasProducidas, 0);
  if (diferencia > 0) {
    const factor = (totalBolsitas / diferencia).toFixed(3);
    document.getElementById('stat_factor_ajuste').textContent = factor;
  }
}

async function cerrarDia() {
  if (!document.getElementById('contador_cierre').value) {
    mostrarAlerta('Ingresa el contador de cierre', 'error');
    return;
  }

  try {
    const cierre = parseInt(document.getElementById('contador_cierre').value);
    const diferencia = cierre - contadorInicial;
    const totalBolsitas = registrosProduccion.reduce((sum, r) => sum + r.bolsitasProducidas, 0);

    // Guardar contador diario en Supabase
    const { error } = await supabaseClient
      .from('control_contador_diario')
      .insert([{
        fecha: new Date().toISOString().split('T')[0],
        contador_inicio: contadorInicial,
        contador_cierre: cierre,
        diferencia_contador: diferencia,
        bolsitas_reales_registradas: totalBolsitas,
        factor_ajuste: totalBolsitas / diferencia,
        operador: currentUser.username,
        created_by: currentUser.id
      }]);

    if (error) throw error;

    mostrarAlerta('✅ Día cerrado correctamente', 'success');
    
    setTimeout(() => {
      location.reload();
    }, 2000);

  } catch (error) {
    console.error('❌ Error al cerrar día:', error);
    mostrarAlerta('Error al cerrar el día', 'error');
  }
}

// ============================================
// 6. SECCIÓN: BOTELLONES - REGISTRAR LOTE
// ============================================

async function registrarBotellones() {
  const fecha = document.getElementById('fecha_botellones').value;
  const horaInicio = document.getElementById('hora_inicio_bot').value;
  const horaCierre = document.getElementById('hora_cierre_bot').value;
  const botellonesProducidos = parseInt(document.getElementById('botellones_producidos').value);
  const botellonesRechazados = parseInt(document.getElementById('botellones_rechazados').value) || 0;
  const motivoRechazo = document.getElementById('motivo_rechazo_bot').value;
  const observaciones = document.getElementById('observaciones_bot').value;

  if (!fecha || !horaInicio || !horaCierre || !botellonesProducidos || !motivoRechazo) {
    mostrarAlerta('Por favor completa todos los campos requeridos', 'error');
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('control_botellones')
      .insert([{
        fecha: fecha,
        hora_inicio: horaInicio,
        hora_cierre: horaCierre,
        botellones_producidos: botellonesProducidos,
        botellones_rechazados: botellonesRechazados,
        motivo_rechazo: motivoRechazo,
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
    mostrarAlerta('Error al registrar el lote', 'error');
  }
}

function agregarFilaTablaBot(registro) {
  const tabla = document.getElementById('tabla_botellones');
  
  if (tabla.querySelector('tbody tr td[colspan]')) {
    tabla.querySelector('tbody').innerHTML = '';
  }

  const fila = document.createElement('tr');
  fila.innerHTML = `
    <td>${registro.fecha}</td>
    <td>${registro.horaInicio}</td>
    <td>${registro.horaCierre}</td>
    <td><span class="badge badge-success">${registro.botellonesProducidos}</span></td>
    <td><span class="badge badge-danger">${registro.botellonesRechazados}</span></td>
    <td>${registro.motivoRechazo}</td>
    <td>${registro.observaciones || '--'}</td>
    <td>
      <button class="btn btn-sm btn-outline-danger" onclick="eliminarRegistroBot('${registro.id}')">
        <i class="bi bi-trash"></i>
      </button>
    </td>
  `;
  tabla.querySelector('tbody').appendChild(fila);
}

function limpiarFormularioBotellones() {
  document.getElementById('fecha_botellones').value = new Date().toISOString().split('T')[0];
  document.getElementById('hora_inicio_bot').value = '';
  document.getElementById('hora_cierre_bot').value = '';
  document.getElementById('botellones_producidos').value = '';
  document.getElementById('botellones_rechazados').value = '0';
  document.getElementById('motivo_rechazo_bot').value = '';
  document.getElementById('observaciones_bot').value = '';
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
    const { error } = await supabaseClient
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
    mostrarAlerta('Error al eliminar el lote', 'error');
  }
}

// ============================================
// 7. SECCIÓN: CALIDAD - REGISTRAR PRUEBA
// ============================================

async function registrarCalidad() {
  const fecha = document.getElementById('fecha_calidad').value;
  const tds = parseFloat(document.getElementById('tds_calidad').value);
  const usm = parseFloat(document.getElementById('usm_calidad').value);
  const temperatura = parseFloat(document.getElementById('temperatura_calidad').value);
  const ph = parseFloat(document.getElementById('ph_calidad').value);
  const observaciones = document.getElementById('observaciones_calidad').value;

  if (!fecha || tds === '' || usm === '' || temperatura === '' || ph === '') {
    mostrarAlerta('Por favor completa todos los campos requeridos', 'error');
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
    const { data, error } = await supabaseClient
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
    mostrarAlerta('Error al registrar la prueba', 'error');
  }
}

function agregarFilaTablaCalidad(registro) {
  const tabla = document.getElementById('tabla_calidad');
  
  if (tabla.querySelector('tbody tr td[colspan]')) {
    tabla.querySelector('tbody').innerHTML = '';
  }

  const fila = document.createElement('tr');
  fila.innerHTML = `
    <td>${registro.fecha}</td>
    <td><span class="badge badge-info" style="background-color: #dbeafe; color: #1e40af;">${registro.tds.toFixed(2)}</span></td>
    <td><span class="badge badge-info" style="background-color: #dbeafe; color: #1e40af;">${registro.usm.toFixed(2)}</span></td>
    <td><span class="badge badge-info" style="background-color: #dbeafe; color: #1e40af;">${registro.temperatura.toFixed(1)}</span></td>
    <td><span class="badge badge-info" style="background-color: #dbeafe; color: #1e40af;">${registro.ph.toFixed(2)}</span></td>
    <td>${registro.observaciones || '--'}</td>
    <td>
      <button class="btn btn-sm btn-outline-danger" onclick="eliminarRegistroCalidad('${registro.id}')">
        <i class="bi bi-trash"></i>
      </button>
    </td>
  `;
  tabla.querySelector('tbody').appendChild(fila);
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
    const { error } = await supabaseClient
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
    mostrarAlerta('Error al eliminar la prueba', 'error');
  }
}

// ============================================
// 8. FUNCIONES AUXILIARES
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
// 9. HACER FUNCIONES GLOBALES
// ============================================

window.registrarBobina = registrarBobina;
window.eliminarBobina = eliminarBobina;
window.registrarProduccion = registrarProduccion;
window.eliminarProduccion = eliminarProduccion;
window.cerrarDia = cerrarDia;
window.registrarBotellones = registrarBotellones;
window.eliminarRegistroBot = eliminarRegistroBot;
window.registrarCalidad = registrarCalidad;
window.eliminarRegistroCalidad = eliminarRegistroCalidad;

console.log('✅ Módulo de Producción v2.0 cargado completamente');