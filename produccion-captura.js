// ============================================
// PRODUCCION-CAPTURA.JS
// JavaScript para interfaz de captura diaria
// ============================================

console.log('📦 Iniciando sistema de captura de producción...');

// Verificar que Supabase esté disponible
if (!window.supabaseProduccionDiaria) {
  console.error('❌ SupabaseProduccionDiaria no está disponible');
  alert('Error: No se pudo conectar con el sistema. Recarga la página.');
}

// ===== VARIABLES GLOBALES =====
const produccion = window.supabaseProduccionDiaria;
const hoy = new Date().toISOString().split('T')[0];

// ===== FUNCIONES DE ALERTAS =====
function mostrarAlerta(tipo, mensaje) {
  const alertSuccess = document.getElementById('alertSuccess');
  const alertError = document.getElementById('alertError');
  
  if (tipo === 'success') {
    document.getElementById('alertSuccessText').textContent = mensaje;
    alertSuccess.classList.add('show');
    alertError.classList.remove('show');
    
    setTimeout(() => {
      alertSuccess.classList.remove('show');
    }, 5000);
  } else {
    document.getElementById('alertErrorText').textContent = mensaje;
    alertError.classList.add('show');
    alertSuccess.classList.remove('show');
    
    setTimeout(() => {
      alertError.classList.remove('show');
    }, 5000);
  }
  
  // Scroll al top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== MANEJO DE TABS =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.getAttribute('data-tab');
    
    // Actualizar botones
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Actualizar contenido
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    
    // Cargar datos del tab
    cargarDatosTab(tab);
  });
});

function cargarDatosTab(tab) {
  switch(tab) {
    case 'bobinas':
      cargarBobinasHoy();
      break;
    case 'contador':
      cargarEstadoContador();
      break;
    case 'botellones':
      cargarBotellonesHoy();
      break;
    case 'calidad':
      cargarCalidadHoy();
      break;
  }
}

// ===== TAB: BOBINAS =====

// Calcular packs automáticamente
document.getElementById('bolsitasProducidas')?.addEventListener('input', (e) => {
  const bolsitas = parseInt(e.target.value) || 0;
  const packs = Math.floor(bolsitas / 35);
  
  const packsDiv = document.getElementById('packsCalculados');
  const valorPacks = document.getElementById('valorPacks');
  
  if (bolsitas > 0) {
    valorPacks.textContent = packs;
    packsDiv.style.display = 'block';
  } else {
    packsDiv.style.display = 'none';
  }
});

// Form: Registrar bobina
document.getElementById('formBobina')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  
  try {
    const datos = {
      peso_bobina: document.getElementById('pesoBobina').value,
      bolsitas_producidas: document.getElementById('bolsitasProducidas').value,
      bolsitas_rechazadas: document.getElementById('bolsitasRechazadas').value || 0,
      motivo_rechazo: document.getElementById('motivoRechazoBobina').value,
      observaciones: document.getElementById('observacionesBobina').value,
      operador: document.getElementById('operadorBobina').value
    };
    
    const result = await produccion.registrarBobina(datos);
    
    if (result.success) {
      mostrarAlerta('success', '✅ Bobina registrada exitosamente');
      e.target.reset();
      document.getElementById('packsCalculados').style.display = 'none';
      cargarBobinasHoy();
    } else {
      mostrarAlerta('error', 'Error: ' + result.error);
    }
    
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error inesperado al guardar');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Guardar Bobina';
  }
});

// Cargar bobinas de hoy
async function cargarBobinasHoy() {
  const lista = document.getElementById('listaBobinasHoy');
  if (!lista) return;
  
  lista.innerHTML = '<div style="text-align: center; padding: 20px; color: #6b7280;">Cargando...</div>';
  
  try {
    const result = await produccion.obtenerBobinasDelDia(hoy);
    
    if (result.success && result.data.length > 0) {
      lista.innerHTML = result.data.map(bobina => `
        <div class="registro-item">
          <div class="registro-info">
            <strong>Bobina ${bobina.peso_bobina} kg - ${bobina.packs_completos} packs</strong>
            <span>
              ${bobina.bolsitas_producidas} producidas | 
              ${bobina.bolsitas_rechazadas} rechazadas | 
              ${bobina.operador || 'Sin operador'}
            </span>
          </div>
          <div style="color: #8b5cf6; font-weight: 600;">
            ${new Date(bobina.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      `).join('');
      
      // Mostrar total
      const totalBolsitas = result.data.reduce((sum, b) => sum + b.bolsitas_producidas, 0);
      const totalPacks = result.data.reduce((sum, b) => sum + b.packs_completos, 0);
      
      lista.innerHTML += `
        <div style="background: #f0f9ff; padding: 15px; border-radius: 10px; margin-top: 10px; border: 2px solid #3b82f6;">
          <strong style="color: #1f2937;">Total del día:</strong>
          <div style="margin-top: 5px;">
            ${result.data.length} bobinas | ${totalBolsitas} bolsitas | ${totalPacks} packs completos
          </div>
        </div>
      `;
    } else {
      lista.innerHTML = '<div style="text-align: center; padding: 20px; color: #6b7280;">No hay bobinas registradas hoy</div>';
    }
    
  } catch (error) {
    console.error('Error cargando bobinas:', error);
    lista.innerHTML = '<div style="text-align: center; padding: 20px; color: #ef4444;">Error al cargar datos</div>';
  }
}

// ===== TAB: CONTADOR =====

async function cargarEstadoContador() {
  const estadoDiv = document.getElementById('estadoContador');
  const formInicio = document.getElementById('formContadorInicio');
  const formCierre = document.getElementById('formContadorCierre');
  
  if (!estadoDiv) return;
  
  try {
    const result = await produccion.obtenerContadorDia(hoy);
    
    if (result.success && result.data) {
      const contador = result.data;
      
      if (contador.contador_cierre) {
        // Ya está cerrado
        estadoDiv.innerHTML = `
          <div class="info-box success">
            <h4 style="margin: 0 0 10px 0;">✅ Contador del día completado</h4>
            <div><strong>Contador inicio:</strong> ${contador.contador_inicio.toLocaleString()}</div>
            <div><strong>Contador cierre:</strong> ${contador.contador_cierre.toLocaleString()}</div>
            <div><strong>Diferencia:</strong> ${(contador.contador_cierre - contador.contador_inicio).toLocaleString()} bolsitas</div>
            <div><strong>Bolsitas reales:</strong> ${contador.bolsitas_reales_registradas?.toLocaleString() || '0'}</div>
            ${contador.factor_ajuste ? `<div><strong>Factor de ajuste:</strong> ${contador.factor_ajuste.toFixed(4)}</div>` : ''}
          </div>
        `;
        formInicio.style.display = 'none';
        formCierre.style.display = 'none';
        
      } else {
        // Iniciado pero no cerrado
        estadoDiv.innerHTML = `
          <div class="info-box warning">
            <h4 style="margin: 0 0 10px 0;">⏳ Contador del día iniciado</h4>
            <div><strong>Contador inicio:</strong> ${contador.contador_inicio.toLocaleString()}</div>
            <div><strong>Operador:</strong> ${contador.operador || 'No especificado'}</div>
          </div>
        `;
        formInicio.style.display = 'none';
        formCierre.style.display = 'block';
        
        // Pre-llenar el resumen
        document.getElementById('resumenInicio').textContent = contador.contador_inicio.toLocaleString();
      }
      
    } else {
      // No iniciado
      estadoDiv.innerHTML = `
        <div class="info-box warning">
          <h4 style="margin: 0 0 10px 0;">⚠️ Contador no iniciado</h4>
          <p style="margin: 0;">Por favor, registra la lectura del contador al inicio del día.</p>
        </div>
      `;
      formInicio.style.display = 'block';
      formCierre.style.display = 'none';
    }
    
  } catch (error) {
    console.error('Error cargando contador:', error);
    estadoDiv.innerHTML = '<div class="alert alert-error">Error al cargar estado del contador</div>';
  }
}

// Calcular diferencia al escribir contador cierre
document.getElementById('contadorCierre')?.addEventListener('input', async (e) => {
  const cierre = parseInt(e.target.value) || 0;
  
  if (cierre > 0) {
    const result = await produccion.obtenerContadorDia(hoy);
    if (result.success && result.data) {
      const inicio = result.data.contador_inicio;
      const diferencia = cierre - inicio;
      
      document.getElementById('resumenCierre').textContent = cierre.toLocaleString();
      document.getElementById('resumenDiferencia').textContent = diferencia.toLocaleString();
      document.getElementById('resumenContador').style.display = 'block';
    }
  }
});

// Form: Iniciar contador
document.getElementById('formContadorInicio')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  
  try {
    const datos = {
      contador_inicio: document.getElementById('contadorInicio').value,
      operador: document.getElementById('operadorContadorInicio').value
    };
    
    const result = await produccion.iniciarContadorDia(datos);
    
    if (result.success) {
      mostrarAlerta('success', '✅ Contador iniciado exitosamente');
      e.target.reset();
      cargarEstadoContador();
    } else {
      mostrarAlerta('error', 'Error: ' + result.error);
    }
    
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error inesperado al guardar');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-play"></i> Iniciar Contador del Día';
  }
});

// Form: Cerrar contador
document.getElementById('formContadorCierre')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  
  try {
    const datos = {
      contador_cierre: document.getElementById('contadorCierre').value,
      observaciones: document.getElementById('observacionesContador').value
    };
    
    const result = await produccion.cerrarContadorDia(datos);
    
    if (result.success) {
      mostrarAlerta('success', '✅ Contador cerrado exitosamente');
      e.target.reset();
      document.getElementById('resumenContador').style.display = 'none';
      cargarEstadoContador();
    } else {
      mostrarAlerta('error', 'Error: ' + result.error);
    }
    
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error inesperado al guardar');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-stop"></i> Cerrar Contador del Día';
  }
});

// ===== TAB: BOTELLONES =====

// Form: Registrar botellones
document.getElementById('formBotellones')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  
  try {
    const datos = {
      hora_inicio: document.getElementById('horaInicioBotellones').value,
      hora_cierre: document.getElementById('horaCierreBotellones').value,
      botellones_producidos: document.getElementById('botellonesProducidos').value,
      botellones_rechazados: document.getElementById('botellonesRechazados').value || 0,
      motivo_rechazo: document.getElementById('motivoRechazoBotellones').value,
      observaciones: document.getElementById('observacionesBotellones').value,
      operador: document.getElementById('operadorBotellones').value
    };
    
    const result = await produccion.registrarBotellones(datos);
    
    if (result.success) {
      mostrarAlerta('success', '✅ Botellones registrados exitosamente');
      e.target.reset();
      cargarBotellonesHoy();
    } else {
      mostrarAlerta('error', 'Error: ' + result.error);
    }
    
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error inesperado al guardar');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Guardar Producción';
  }
});

// Cargar botellones de hoy
async function cargarBotellonesHoy() {
  const lista = document.getElementById('listaBotellonesHoy');
  if (!lista) return;
  
  lista.innerHTML = '<div style="text-align: center; padding: 20px; color: #6b7280;">Cargando...</div>';
  
  try {
    const result = await produccion.obtenerBotellonesDelDia(hoy);
    
    if (result.success && result.data.length > 0) {
      lista.innerHTML = result.data.map(registro => `
        <div class="registro-item">
          <div class="registro-info">
            <strong>${registro.botellones_producidos} botellones producidos</strong>
            <span>
              ${registro.hora_inicio} - ${registro.hora_cierre} | 
              ${registro.botellones_rechazados} rechazados | 
              ${registro.operador || 'Sin operador'}
            </span>
          </div>
          <div style="color: #10b981; font-weight: 600;">
            ${new Date(registro.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      `).join('');
      
      // Mostrar total
      const totalProducidos = result.data.reduce((sum, b) => sum + b.botellones_producidos, 0);
      const totalRechazados = result.data.reduce((sum, b) => sum + b.botellones_rechazados, 0);
      
      lista.innerHTML += `
        <div style="background: #ecfdf5; padding: 15px; border-radius: 10px; margin-top: 10px; border: 2px solid #10b981;">
          <strong style="color: #1f2937;">Total del día:</strong>
          <div style="margin-top: 5px;">
            ${totalProducidos} producidos | ${totalRechazados} rechazados
          </div>
        </div>
      `;
    } else {
      lista.innerHTML = '<div style="text-align: center; padding: 20px; color: #6b7280;">No hay botellones registrados hoy</div>';
    }
    
  } catch (error) {
    console.error('Error cargando botellones:', error);
    lista.innerHTML = '<div style="text-align: center; padding: 20px; color: #ef4444;">Error al cargar datos</div>';
  }
}

// ===== TAB: CALIDAD =====

// Form: Registrar calidad
document.getElementById('formCalidad')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  
  try {
    const datos = {
      tds: document.getElementById('tds').value,
      usm: document.getElementById('usm').value,
      temperatura: document.getElementById('temperatura').value,
      ph: document.getElementById('ph').value,
      cumple_estandares: document.getElementById('cumpleEstandares').checked,
      observaciones: document.getElementById('observacionesCalidad').value,
      analista: document.getElementById('analista').value
    };
    
    const result = await produccion.registrarCalidadAgua(datos);
    
    if (result.success) {
      mostrarAlerta('success', '✅ Análisis de calidad registrado exitosamente');
      e.target.reset();
      document.getElementById('cumpleEstandares').checked = true;
      cargarCalidadHoy();
    } else {
      mostrarAlerta('error', 'Error: ' + result.error);
    }
    
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error inesperado al guardar');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Guardar Análisis';
  }
});

// Cargar calidad de hoy
async function cargarCalidadHoy() {
  const lista = document.getElementById('listaCalidadHoy');
  if (!lista) return;
  
  lista.innerHTML = '<div style="text-align: center; padding: 20px; color: #6b7280;">Cargando...</div>';
  
  try {
    const result = await produccion.obtenerCalidadDelDia(hoy);
    
    if (result.success && result.data.length > 0) {
      lista.innerHTML = result.data.map(registro => {
        const cumple = registro.cumple_estandares;
        const iconoCumple = cumple ? '✅' : '❌';
        const colorCumple = cumple ? '#10b981' : '#ef4444';
        
        return `
          <div class="registro-item">
            <div class="registro-info">
              <strong>TDS: ${registro.tds} | USM: ${registro.usm} | Temp: ${registro.temperatura}°C | pH: ${registro.ph}</strong>
              <span>
                ${registro.analista || 'Sin analista'} | 
                <span style="color: ${colorCumple}; font-weight: 600;">${iconoCumple} ${cumple ? 'Cumple' : 'No cumple'}</span>
              </span>
            </div>
            <div style="color: #06b6d4; font-weight: 600;">
              ${new Date(registro.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        `;
      }).join('');
    } else {
      lista.innerHTML = '<div style="text-align: center; padding: 20px; color: #6b7280;">No hay análisis registrados hoy</div>';
    }
    
  } catch (error) {
    console.error('Error cargando calidad:', error);
    lista.innerHTML = '<div style="text-align: center; padding: 20px; color: #ef4444;">Error al cargar datos</div>';
  }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('📦 Sistema de captura inicializado');
  
  // Cargar datos del primer tab
  cargarBobinasHoy();
  
  // Establecer fecha de hoy en título
  const titulo = document.querySelector('nav h1');
  if (titulo) {
    titulo.textContent = `💧 Agua Zafiro - Captura de Producción (${new Date().toLocaleDateString('es-ES')})`;
  }
});

console.log('✅ produccion-captura.js cargado correctamente');