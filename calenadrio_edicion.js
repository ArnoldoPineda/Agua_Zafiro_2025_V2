// ===== CALENDARIO CON EDICIÓN - AGUA ZAFIRO =====

// Variables globales
let mesActual = new Date().getMonth();
let anoActual = new Date().getFullYear();
let diaHoy = new Date().getDate();
let fechaEditando = null;
let modoEdicion = false;
let esAdmin = false;

// Datos del capturador (sincronizados)
const vendedores = ['Brayan', 'Ariel', 'Bodega'];
const ciudades = ['Comayagua', 'Siguatepeque', 'Ajuterique', 'El Rosario', 'Flores', 'Zambrano', 'El Pantanal'];
const productos = ['Botellones', 'Bolsas'];
const categoriasGastos = [
  'Combustible', 'Planilla Omar', 'Planilla Tomas', 'Planilla Brayan', 'Sales', 'Bobinas',
  'Edgardo', 'Arreglo Vehículo', 'Arreglo Bodega', 'Electricidad', 'Cuota del Camión',
  'Transferencia', 'Chapeada', 'Flete', 'Alquiler Vehículo', 'Préstamos Personales',
  'Abonos a Deudas', 'Otros'
];
const categoriasCreditos = ['CORRAL LA VILLA', 'CORRAL TAMPISQUE', 'TRANSFERENCIAS POR VENTAS', 'OTROS'];

// Datos simulados extendidos con estructura completa
const registrosEjemplo = {
  '2025-09-01': { 
    cajaInicial: 500,
    ventas: [
      { vendedor: 'Brayan', ciudad: 'Comayagua', producto: 'Botellones', cantidad: 20, precio: 30, total: 600 },
      { vendedor: 'Ariel', ciudad: 'Siguatepeque', producto: 'Bolsas', cantidad: 35, precio: 18, total: 630 }
    ],
    gastos: [
      { categoria: 'Combustible', descripcion: 'Gasolina del día', monto: 200 },
      { categoria: 'Planilla Brayan', descripcion: 'Pago diario', monto: 140 }
    ],
    creditos: [
      { categoria: 'CORRAL LA VILLA', detalle: 'Pago servicios', monto: 150 }
    ],
    observaciones: 'Día normal de trabajo, sin incidentes'
  },
  '2025-09-02': { 
    cajaInicial: 400,
    ventas: [
      { vendedor: 'Bodega', ciudad: 'El Rosario', producto: 'Botellones', cantidad: 15, precio: 30, total: 450 }
    ],
    gastos: [
      { categoria: 'Electricidad', descripcion: 'Pago mensual', monto: 280 }
    ],
    creditos: [],
    observaciones: ''
  },
  '2025-09-03': { 
    cajaInicial: 600,
    ventas: [
      { vendedor: 'Brayan', ciudad: 'Flores', producto: 'Bolsas', cantidad: 40, precio: 18, total: 720 },
      { vendedor: 'Ariel', ciudad: 'Zambrano', producto: 'Botellones', cantidad: 25, precio: 30, total: 750 }
    ],
    gastos: [
      { categoria: 'Combustible', descripcion: 'Gasolina', monto: 220 },
      { categoria: 'Sales', descripcion: 'Compra sales', monto: 100 }
    ],
    creditos: [
      { categoria: 'TRANSFERENCIAS POR VENTAS', detalle: 'Transferencia diaria', monto: 200 }
    ],
    observaciones: 'Buen día de ventas'
  }
};

const nombresMeses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  verificarPermisos();
  generarCalendario();
  actualizarEstadisticas();
});

function verificarPermisos() {
  // Verificar si el usuario es administrador
  const userData = window.AuthSistema ? window.AuthSistema.obtenerDatosUsuarioActual() : null;
  esAdmin = userData && userData.rol === 'admin';
  
  console.log('Permisos verificados - Es admin:', esAdmin);
}

function generarCalendario() {
  const grid = document.getElementById('calendarGrid');
  const title = document.getElementById('calendarTitle');
  
  title.textContent = `${nombresMeses[mesActual]} ${anoActual}`;
  grid.innerHTML = '';
  
  // Agregar headers de días
  nombresDias.forEach(dia => {
    const header = document.createElement('div');
    header.className = 'calendar-day-header';
    header.textContent = dia;
    grid.appendChild(header);
  });
  
  // Obtener primer día del mes y días totales
  const primerDia = new Date(anoActual, mesActual, 1).getDay();
  const diasEnMes = new Date(anoActual, mesActual + 1, 0).getDate();
  const diasMesAnterior = new Date(anoActual, mesActual, 0).getDate();
  
  // Días del mes anterior
  for (let i = primerDia - 1; i >= 0; i--) {
    const dia = diasMesAnterior - i;
    const celda = crearCeldaDia(dia, 'other-month');
    grid.appendChild(celda);
  }
  
  // Días del mes actual
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fecha = `${anoActual}-${String(mesActual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const tieneRegistro = registrosEjemplo[fecha];
    const esHoy = (dia === diaHoy && mesActual === new Date().getMonth() && anoActual === new Date().getFullYear());
    
    let clase = 'sin-info';
    if (esHoy) clase = 'hoy';
    else if (tieneRegistro) clase = 'con-info';
    
    const celda = crearCeldaDia(dia, clase, fecha, tieneRegistro);
    grid.appendChild(celda);
  }
  
  // Completar semana con días del siguiente mes
  const celdasCreadas = grid.children.length - 7; // -7 por los headers
  const celdasFaltantes = Math.ceil(celdasCreadas / 7) * 7 - celdasCreadas;
  
  for (let dia = 1; dia <= celdasFaltantes; dia++) {
    const celda = crearCeldaDia(dia, 'other-month');
    grid.appendChild(celda);
  }
}

function crearCeldaDia(numero, clase, fecha = null, registro = null) {
  const celda = document.createElement('div');
  celda.className = `calendar-day ${clase}`;
  
  if (fecha) {
    celda.setAttribute('data-fecha', fecha);
    celda.onclick = () => mostrarDetallesDia(fecha, registro);
  }
  
  const numeroDiv = document.createElement('div');
  numeroDiv.className = 'day-number';
  numeroDiv.textContent = numero;
  celda.appendChild(numeroDiv);
  
  if (registro && clase === 'con-info') {
    const indicador = document.createElement('div');
    indicador.className = 'day-indicator';
    indicador.innerHTML = '<span class="info-dot"></span>';
    celda.appendChild(indicador);
    
    const resumen = document.createElement('div');
    resumen.className = 'day-summary';
    const totalVentas = registro.ventas ? registro.ventas.reduce((sum, v) => sum + v.total, 0) : 0;
    const totalGastos = registro.gastos ? registro.gastos.reduce((sum, g) => sum + g.monto, 0) : 0;
    const totalCreditos = registro.creditos ? registro.creditos.reduce((sum, c) => sum + c.monto, 0) : 0;
    const total = registro.cajaInicial + totalVentas - totalGastos + totalCreditos;
    resumen.textContent = `L. ${total.toLocaleString()}`;
    celda.appendChild(resumen);
  }
  
  return celda;
}

function cambiarMes(direccion) {
  mesActual += direccion;
  
  if (mesActual > 11) {
    mesActual = 0;
    anoActual++;
  } else if (mesActual < 0) {
    mesActual = 11;
    anoActual--;
  }
  
  generarCalendario();
  actualizarEstadisticas();
}

function mostrarDetallesDia(fecha, registro) {
  fechaEditando = fecha;
  modoEdicion = false;
  
  const modal = document.getElementById('dayModal');
  const modalContent = document.getElementById('modalContent');
  const title = document.getElementById('modalTitle');
  const readOnlyContent = document.getElementById('readOnlyContent');
  const editForm = document.getElementById('editForm');
  const actions = document.getElementById('modalActions');
  
  // Resetear clases del modal
  modalContent.className = 'modal-content';
  
  const fechaObj = new Date(fecha + 'T00:00:00');
  const fechaTexto = fechaObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  title.textContent = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);
  
  // Mostrar vista de solo lectura
  readOnlyContent.style.display = 'block';
  editForm.classList.remove('active');
  
  if (registro) {
    const totalVentas = registro.ventas ? registro.ventas.reduce((sum, v) => sum + v.total, 0) : 0;
    const totalGastos = registro.gastos ? registro.gastos.reduce((sum, g) => sum + g.monto, 0) : 0;
    const totalCreditos = registro.creditos ? registro.creditos.reduce((sum, c) => sum + c.monto, 0) : 0;
    const utilidad = registro.cajaInicial + totalVentas - totalGastos + totalCreditos;
    
    readOnlyContent.innerHTML = `
      <div class="resumen">
        <div class="card">Caja Inicial: L. ${registro.cajaInicial ? registro.cajaInicial.toLocaleString() : '0'}</div>
        <div class="card venta">Ventas: L. ${totalVentas.toLocaleString()}</div>
        <div class="card gasto">Gastos: L. ${totalGastos.toLocaleString()}</div>
        <div class="card credito">Créditos: L. ${totalCreditos.toLocaleString()}</div>
        <div class="card resultado">Utilidad: L. ${utilidad.toLocaleString()}</div>
      </div>
      <div style="margin-top: 15px;">
        <h4>📦 Ventas (${registro.ventas ? registro.ventas.length : 0})</h4>
        ${registro.ventas && registro.ventas.length > 0 ? 
          registro.ventas.map(v => `<p>• ${v.vendedor} - ${v.ciudad} - ${v.cantidad} ${v.producto} - L.${v.total}</p>`).join('') 
          : '<p>Sin ventas registradas</p>'}
        
        <h4>💸 Gastos (${registro.gastos ? registro.gastos.length : 0})</h4>
        ${registro.gastos && registro.gastos.length > 0 ? 
          registro.gastos.map(g => `<p>• ${g.categoria}: ${g.descripcion} - L.${g.monto}</p>`).join('') 
          : '<p>Sin gastos registrados</p>'}
        
        <h4>📑 Créditos (${registro.creditos ? registro.creditos.length : 0})</h4>
        ${registro.creditos && registro.creditos.length > 0 ? 
          registro.creditos.map(c => `<p>• ${c.categoria}: ${c.detalle} - L.${c.monto}</p>`).join('') 
          : '<p>Sin créditos registrados</p>'}
        
        ${registro.observaciones ? `<h4>📝 Observaciones</h4><p>${registro.observaciones}</p>` : ''}
      </div>
    `;
  } else {
    readOnlyContent.innerHTML = `
      <p style="text-align: center; color: #6b7280; margin: 20px 0;">
        No hay información registrada para este día.
      </p>
      <div style="text-align: center;">
        <button class="quick-action-btn success" onclick="crearRegistro('${fecha}')">
          📝 Crear Registro
        </button>
      </div>
    `;
  }
  
  // Configurar botones según permisos
  if (esAdmin && registro) {
    actions.innerHTML = `
      <button class="quick-action-btn success" onclick="activarModoEdicion()">✏️ Editar día</button>
      <button class="quick-action-btn danger" onclick="eliminarDia()">🗑️ Eliminar día</button>
      <button class="quick-action-btn" onclick="cerrarModal()">✖️ Cerrar</button>
    `;
  } else if (registro) {
    actions.innerHTML = `
      <button class="quick-action-btn" onclick="cerrarModal()">✖️ Cerrar</button>
    `;
  } else {
    actions.innerHTML = `
      <button class="quick-action-btn success" onclick="crearRegistro('${fecha}')">📝 Crear Registro</button>
      <button class="quick-action-btn" onclick="cerrarModal()">✖️ Cerrar</button>
    `;
  }
  
  modal.style.display = 'block';
}

function activarModoEdicion() {
  if (!esAdmin) {
    alert('Solo los administradores pueden editar registros.');
    return;
  }
  
  modoEdicion = true;
  const modalContent = document.getElementById('modalContent');
  const readOnlyContent = document.getElementById('readOnlyContent');
  const editForm = document.getElementById('editForm');
  const actions = document.getElementById('modalActions');
  
  // Cambiar a modo edición
  modalContent.className = 'modal-content edit-mode';
  readOnlyContent.style.display = 'none';
  editForm.classList.add('active');
  
  // Cargar datos en el formulario
  cargarDatosEnFormulario(fechaEditando);
  
  // Cambiar botones
  actions.innerHTML = `
    <button class="quick-action-btn success" onclick="guardarCambios()">💾 Guardar Cambios</button>
    <button class="quick-action-btn" onclick="cancelarEdicion()">❌ Cancelar</button>
  `;
}

function cargarDatosEnFormulario(fecha) {
  const registro = registrosEjemplo[fecha] || {};
  
  // Información básica
  document.getElementById('editFecha').value = fecha;
  document.getElementById('editCajaInicial').value = registro.cajaInicial || 0;
  document.getElementById('editObservaciones').value = registro.observaciones || '';
  
  // Cargar ventas
  const ventasContainer = document.getElementById('editVentas');
  ventasContainer.innerHTML = '';
  if (registro.ventas && registro.ventas.length > 0) {
    registro.ventas.forEach(venta => {
      agregarVentaEdit(venta);
    });
  } else {
    agregarVentaEdit();
  }
  
  // Cargar gastos
  const gastosContainer = document.getElementById('editGastos');
  gastosContainer.innerHTML = '';
  if (registro.gastos && registro.gastos.length > 0) {
    registro.gastos.forEach(gasto => {
      agregarGastoEdit(gasto);
    });
  } else {
    agregarGastoEdit();
  }
  
  // Cargar créditos
  const creditosContainer = document.getElementById('editCreditos');
  creditosContainer.innerHTML = '';
  if (registro.creditos && registro.creditos.length > 0) {
    registro.creditos.forEach(credito => {
      agregarCreditoEdit(credito);
    });
  } else {
    agregarCreditoEdit();
  }
}

function agregarVentaEdit(datos = {}) {
  const container = document.getElementById('editVentas');
  const ventaDiv = document.createElement('div');
  ventaDiv.className = 'mini-registro';
  
  ventaDiv.innerHTML = `
    <select class="vendedor" onchange="calcularTotalEdit(this)">
      <option value="">Vendedor...</option>
      ${vendedores.map(v => `<option value="${v}" ${datos.vendedor === v ? 'selected' : ''}>${v}</option>`).join('')}
    </select>
    <select class="ciudad" onchange="calcularTotalEdit(this)">
      <option value="">Ciudad...</option>
      ${ciudades.map(c => `<option value="${c}" ${datos.ciudad === c ? 'selected' : ''}>${c}</option>`).join('')}
    </select>
    <select class="producto" onchange="autoSetPriceEdit(this)">
      <option value="">Producto...</option>
      ${productos.map(p => `<option value="${p}" ${datos.producto === p ? 'selected' : ''}>${p}</option>`).join('')}
    </select>
    <input type="number" placeholder="Cant." class="cantidad" value="${datos.cantidad || ''}" min="1" onchange="calcularTotalEdit(this)">
    <input type="number" placeholder="Precio" class="precio" value="${datos.precio || ''}" step="0.01" min="0.01" onchange="calcularTotalEdit(this)">
    <input type="number" placeholder="Total" class="total" value="${datos.total || ''}" readonly>
    <button type="button" class="remove-btn" onclick="eliminarRegistroEdit(this)">🗑️</button>
  `;
  
  container.appendChild(ventaDiv);
}

function agregarGastoEdit(datos = {}) {
  const container = document.getElementById('editGastos');
  const gastoDiv = document.createElement('div');
  gastoDiv.className = 'mini-registro';
  
  gastoDiv.innerHTML = `
    <select class="categoria">
      <option value="">Categoría...</option>
      ${categoriasGastos.map(c => `<option value="${c}" ${datos.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
    </select>
    <input type="text" placeholder="Descripción" class="descripcion" value="${datos.descripcion || ''}">
    <input type="number" placeholder="Monto" class="monto" value="${datos.monto || ''}" step="0.01" min="0.01">
    <button type="button" class="remove-btn" onclick="eliminarRegistroEdit(this)">🗑️</button>
  `;
  
  container.appendChild(gastoDiv);
}

function agregarCreditoEdit(datos = {}) {
  const container = document.getElementById('editCreditos');
  const creditoDiv = document.createElement('div');
  creditoDiv.className = 'mini-registro';
  
  creditoDiv.innerHTML = `
    <select class="categoria">
      <option value="">Categoría...</option>
      ${categoriasCreditos.map(c => `<option value="${c}" ${datos.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
    </select>
    <input type="text" placeholder="Detalle" class="detalle" value="${datos.detalle || ''}">
    <input type="number" placeholder="Monto" class="monto" value="${datos.monto || ''}" step="0.01" min="0.01">
    <button type="button" class="remove-btn" onclick="eliminarRegistroEdit(this)">🗑️</button>
  `;
  
  container.appendChild(creditoDiv);
}

function autoSetPriceEdit(selectElement) {
  const producto = selectElement.value;
  const registro = selectElement.closest('.mini-registro');
  const precioInput = registro.querySelector('.precio');
  
  if (producto === 'Botellones') {
    precioInput.value = '30.00';
  } else if (producto === 'Bolsas') {
    precioInput.value = '18.00';
  }
  
  calcularTotalEdit(selectElement);
}

function calcularTotalEdit(element) {
  const registro = element.closest('.mini-registro');
  const cantidad = registro.querySelector('.cantidad').value;
  const precio = registro.querySelector('.precio').value;
  const totalField = registro.querySelector('.total');
  
  if (cantidad && precio && totalField) {
    const total = cantidad * precio;
    totalField.value = total.toFixed(2);
  }
}

function eliminarRegistroEdit(button) {
  button.closest('.mini-registro').remove();
}

function guardarCambios() {
  if (!esAdmin) {
    alert('No tienes permisos para guardar cambios.');
    return;
  }
  
  const fecha = document.getElementById('editFecha').value;
  const cajaInicial = parseFloat(document.getElementById('editCajaInicial').value) || 0;
  const observaciones = document.getElementById('editObservaciones').value;
  
  // Recopilar ventas
  const ventas = [];
  document.querySelectorAll('#editVentas .mini-registro').forEach(registro => {
    const vendedor = registro.querySelector('.vendedor').value;
    const ciudad = registro.querySelector('.ciudad').value;
    const producto = registro.querySelector('.producto').value;
    const cantidad = parseInt(registro.querySelector('.cantidad').value);
    const precio = parseFloat(registro.querySelector('.precio').value);
    const total = parseFloat(registro.querySelector('.total').value);
    
    if (vendedor && ciudad && producto && cantidad && precio) {
      ventas.push({ vendedor, ciudad, producto, cantidad, precio, total });
    }
  });
  
  // Recopilar gastos
  const gastos = [];
  document.querySelectorAll('#editGastos .mini-registro').forEach(registro => {
    const categoria = registro.querySelector('.categoria').value;
    const descripcion = registro.querySelector('.descripcion').value;
    const monto = parseFloat(registro.querySelector('.monto').value);
    
    if (categoria && descripcion && monto) {
      gastos.push({ categoria, descripcion, monto });
    }
  });
  
  // Recopilar créditos
  const creditos = [];
  document.querySelectorAll('#editCreditos .mini-registro').forEach(registro => {
    const categoria = registro.querySelector('.categoria').value;
    const detalle = registro.querySelector('.detalle').value;
    const monto = parseFloat(registro.querySelector('.monto').value);
    
    if (categoria && detalle && monto) {
      creditos.push({ categoria, detalle, monto });
    }
  });
  
  // Guardar en datos simulados (en producción sería Supabase)
  registrosEjemplo[fecha] = {
    cajaInicial,
    ventas,
    gastos,
    creditos,
    observaciones
  };
  
  console.log('Registro actualizado:', registrosEjemplo[fecha]);
  
  // Regenerar calendario y mostrar confirmación
  generarCalendario();
  actualizarEstadisticas();
  alert('¡Cambios guardados exitosamente!');
  
  // Volver a vista de solo lectura
  mostrarDetallesDia(fecha, registrosEjemplo[fecha]);
}

function cancelarEdicion() {
  // Volver a vista de solo lectura sin guardar
  mostrarDetallesDia(fechaEditando, registrosEjemplo[fechaEditando]);
}

function eliminarDia() {
  if (!esAdmin) {
    alert('Solo los administradores pueden eliminar registros.');
    return;
  }
  
  if (!fechaEditando) return;
  
  const fechaObj = new Date(fechaEditando + 'T00:00:00');
  const fechaTexto = fechaObj.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  if (confirm(`¿Está seguro de eliminar completamente el registro del ${fechaTexto}?\n\nEsta acción no se puede deshacer.`)) {
    // Eliminar de datos simulados (en producción sería Supabase)
    delete registrosEjemplo[fechaEditando];
    
    console.log('Registro eliminado:', fechaEditando);
    
    // Regenerar calendario y cerrar modal
    generarCalendario();
    actualizarEstadisticas();
    cerrarModal();
    
    alert('Registro eliminado exitosamente.');
  }
}

function cerrarModal() {
  document.getElementById('dayModal').style.display = 'none';
  modoEdicion = false;
  fechaEditando = null;
}

function actualizarEstadisticas() {
  const registros = Object.values(registrosEjemplo);
  const diasTrabajados = registros.length;
  const diasDelMes = new Date(anoActual, mesActual + 1, 0).getDate();
  const diasPendientes = diasDelMes - diasTrabajados;
  const porcentaje = Math.round((diasTrabajados / diasDelMes) * 100);
  
  const ventasTotales = registros.reduce((sum, r) => {
    if (r.ventas && r.ventas.length > 0) {
      return sum + r.ventas.reduce((vSum, v) => vSum + v.total, 0);
    }
    return sum;
  }, 0);
  
  document.getElementById('diasTrabajados').textContent = diasTrabajados;
  document.getElementById('diasPendientes').textContent = diasPendientes;
  document.getElementById('porcentajeCompleto').textContent = `${porcentaje}%`;
  document.getElementById('ventasTotales').textContent = `L. ${ventasTotales.toLocaleString()}`;
}

// Funciones de acción existentes
function irACapturador() {
  if (window.AuthSistema && !window.AuthSistema.verificarPermiso('crear')) {
    window.AuthSistema.mostrarNotificacion('No tienes permisos para crear registros', 'warning');
    return;
  }
  window.location.href = 'capturador.html';
}

function verDashboard() {
  const userData = window.AuthSistema ? window.AuthSistema.obtenerDatosUsuarioActual() : null;
  if (userData && userData.rol === 'vendedor') {
    if (window.AuthSistema) {
      window.AuthSistema.mostrarNotificacion('Los vendedores no tienen acceso al dashboard', 'warning');
    } else {
      alert('Los vendedores no tienen acceso al dashboard');
    }
    return;
  }
  window.location.href = 'dashboard.html';
}

function exportarMes() {
  if (window.AuthSistema && !window.AuthSistema.verificarPermiso('exportar')) {
    window.AuthSistema.mostrarNotificacion('No tienes permisos para exportar', 'warning');
    return;
  }
  alert('Función de exportación - Se implementará con Supabase');
}

function crearRegistro(fecha) {
  if (window.AuthSistema && !window.AuthSistema.verificarPermiso('crear')) {
    window.AuthSistema.mostrarNotificacion('No tienes permisos para crear registros', 'warning');
    return;
  }
  window.location.href = `capturador.html?fecha=${fecha}`;
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
  const modal = document.getElementById('dayModal');
  if (event.target === modal) {
    cerrarModal();
  }
}

console.log('✅ Calendario con edición para administradores cargado correctamente');