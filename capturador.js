// ===== CAPTURADOR.JS - AGUA ZAFIRO =====
let ventasCount = 0;
let gastosCount = 0;
let creditosCount = 0;

// ✅ VARIABLE GLOBAL PARA EVITAR GUARDADOS DUPLICADOS - AL INICIO
let guardandoRegistro = false;

const vendedores = ['Brayan', 'Ariel', 'Bodega'];
const ciudades = ['Comayagua', 'Siguatepeque', 'Ajuterique', 'El Rosario', 'Flores', 'Zambrano', 'El Pantanal', 'Bodega'];
const productos = ['Botellones', 'Bolsas'];
const categoriasGastos = [
  'Combustible', 'Planilla Omar', 'Planilla Tomas', 'Planilla Brayan', 'Sales', 'Bobinas',
  'Edgardo', 'Arreglo Vehículo', 'Arreglo Bodega', 'Electricidad', 'Cuota del Camión',
  'Transferencia', 'Chapeada', 'Flete', 'Alquiler Vehículo', 'Préstamos Personales',
  'Abonos a Deudas', 'Otros'
];
const categoriasCreditos = ['CORRAL LA VILLA', 'CORRAL TAMPISQUE', 'TRANSFERENCIAS POR VENTAS', 'OTROS'];

// Inicialización cuando carga la página
document.addEventListener('DOMContentLoaded', function() {
  console.log('Iniciando capturador...');
  
  // Establecer fecha actual
  const fechaInput = document.getElementById('fecha');
  if (fechaInput) {
    fechaInput.value = new Date().toISOString().split('T')[0];
  }
  
  // Crear primer registro de cada sección
  addVentaRegistro();
  addGastoRegistro();
  addCreditoRegistro();
  
  // Configurar eventos
  setupEventListeners();
  
  console.log('Capturador inicializado correctamente');
});

function addVentaRegistro() {
  ventasCount++;
  const container = document.getElementById('ventas-container');
  if (!container) {
    console.error('Container ventas-container no encontrado');
    return;
  }
  
  const registro = document.createElement('div');
  registro.className = 'registro-card active';
  registro.setAttribute('data-id', `venta-${ventasCount}`);
  
  registro.innerHTML = `
    <div class="status-indicator"></div>
    <div class="registro-header">
      <div class="registro-numero">Venta #${ventasCount}</div>
      <div class="registro-actions">
        ${ventasCount > 1 ? '<button type="button" class="remove-registro-btn" onclick="removeRegistro(this)">🗑️ Eliminar</button>' : ''}
      </div>
    </div>
    
    <div class="registro-fields">
      <div class="field-group">
        <label class="field-label">Vendedor</label>
        <select class="field-input vendedor" onchange="checkRegistroCompletion(this)" oninput="checkRegistroCompletion(this)" required>
          <option value="">Seleccionar vendedor...</option>
          ${vendedores.map(v => `<option value="${v}">${v}</option>`).join('')}
        </select>
      </div>
      
      <div class="field-group">
        <label class="field-label">Ciudad</label>
        <select class="field-input ciudad" onchange="checkRegistroCompletion(this)" oninput="checkRegistroCompletion(this)" required>
          <option value="">Seleccionar ciudad...</option>
          ${ciudades.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      
      <div class="field-group">
        <label class="field-label">Producto</label>
        <select class="field-input producto" onchange="checkRegistroCompletion(this); autoSetPrice(this)" oninput="checkRegistroCompletion(this)" required>
          <option value="">Seleccionar producto...</option>
          ${productos.map(p => `<option value="${p}">${p}</option>`).join('')}
        </select>
      </div>
      
      <div class="field-group">
        <label class="field-label">Cantidad</label>
        <input type="number" class="field-input cantidad" placeholder="0" min="1" onchange="calculateTotal(this)" oninput="calculateTotal(this)" required>
      </div>
      
      <div class="field-group">
        <label class="field-label">Precio Unitario</label>
        <input type="number" class="field-input precio" placeholder="0.00" step="0.01" min="0.01" onchange="calculateTotal(this)" oninput="calculateTotal(this)" required>
      </div>
      
      <div class="field-group">
        <label class="field-label">Total</label>
        <input type="number" class="field-input total readonly" placeholder="L. 0.00" readonly>
      </div>
    </div>
    
    <div class="validation-message" style="display: none;">Complete todos los campos para continuar</div>
  `;
  
  container.appendChild(registro);
  updateCounter('ventas');
  
  if (ventasCount === 1) {
    setTimeout(() => {
      const vendedorSelect = registro.querySelector('.vendedor');
      if (vendedorSelect) vendedorSelect.focus();
    }, 100);
  }
  
  return registro;
}

function addGastoRegistro() {
  gastosCount++;
  const container = document.getElementById('gastos-container');
  if (!container) {
    console.error('Container gastos-container no encontrado');
    return;
  }
  
  const registro = document.createElement('div');
  registro.className = 'registro-card active';
  registro.setAttribute('data-id', `gasto-${gastosCount}`);
  
  registro.innerHTML = `
    <div class="status-indicator"></div>
    <div class="registro-header">
      <div class="registro-numero">Gasto #${gastosCount}</div>
      <div class="registro-actions">
        ${gastosCount > 1 ? '<button type="button" class="remove-registro-btn" onclick="removeRegistro(this)">🗑️ Eliminar</button>' : ''}
      </div>
    </div>
    
    <div class="registro-fields">
      <div class="field-group">
        <label class="field-label">Categoría</label>
        <select class="field-input categoria" onchange="checkRegistroCompletion(this)" oninput="checkRegistroCompletion(this)" required>
          <option value="">Seleccionar categoría...</option>
          ${categoriasGastos.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      
      <div class="field-group">
        <label class="field-label">Descripción</label>
        <input type="text" class="field-input descripcion" placeholder="Descripción del gasto..." onchange="checkRegistroCompletion(this)" oninput="checkRegistroCompletion(this)" required>
      </div>
      
      <div class="field-group">
        <label class="field-label">Monto</label>
        <input type="number" class="field-input monto" placeholder="0.00" step="0.01" min="0.01" onchange="checkRegistroCompletion(this); updateResumen()" oninput="checkRegistroCompletion(this); updateResumen()" required>
      </div>
    </div>
    
    <div class="validation-message" style="display: none;">Complete todos los campos para continuar</div>
  `;
  
  container.appendChild(registro);
  updateCounter('gastos');
  
  return registro;
}

function addCreditoRegistro() {
  creditosCount++;
  const container = document.getElementById('creditos-container');
  if (!container) {
    console.error('Container creditos-container no encontrado');
    return;
  }
  
  const registro = document.createElement('div');
  registro.className = 'registro-card active';
  registro.setAttribute('data-id', `credito-${creditosCount}`);
  
  registro.innerHTML = `
    <div class="status-indicator"></div>
    <div class="registro-header">
      <div class="registro-numero">Crédito #${creditosCount}</div>
      <div class="registro-actions">
        ${creditosCount > 1 ? '<button type="button" class="remove-registro-btn" onclick="removeRegistro(this)">🗑️ Eliminar</button>' : ''}
      </div>
    </div>
    
    <div class="registro-fields">
      <div class="field-group">
        <label class="field-label">Categoría</label>
        <select class="field-input categoria" onchange="updateResumen()" oninput="updateResumen()">
          <option value="">Seleccionar categoría...</option>
          ${categoriasCreditos.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      
      <div class="field-group">
        <label class="field-label">Detalle</label>
        <input type="text" class="field-input detalle" placeholder="Detalle del crédito..." onchange="updateResumen()" oninput="updateResumen()">
      </div>
      
      <div class="field-group">
        <label class="field-label">Monto</label>
        <input type="number" class="field-input monto" placeholder="0.00" step="0.01" min="0.01" onchange="updateResumen()" oninput="updateResumen()">
      </div>
    </div>
  `;
  
  container.appendChild(registro);
  updateCounter('creditos');
  
  return registro;
}

function checkRegistroCompletion(element) {
  const registro = element.closest('.registro-card');
  if (!registro) return;
  
  const inputs = registro.querySelectorAll('input[required], select[required]');
  let completed = true;
  
  inputs.forEach(input => {
    if (!input.value.trim()) {
      completed = false;
    }
  });
  
  if (completed) {
    registro.classList.add('completed');
    registro.classList.remove('active');
    const validationMsg = registro.querySelector('.validation-message');
    if (validationMsg) validationMsg.style.display = 'none';
    
    // Auto-crear siguiente registro para ventas y gastos solamente
    const container = registro.parentElement;
    const allRegistros = container.querySelectorAll('.registro-card');
    const isLastRegistro = registro === allRegistros[allRegistros.length - 1];
    
    if (isLastRegistro) {
      setTimeout(() => {
        if (container.id === 'ventas-container') {
          addVentaRegistro();
          const btn = document.getElementById('addVentaBtn');
          if (btn && allRegistros.length >= 1) {
            btn.style.display = 'block';
          }
        } else if (container.id === 'gastos-container') {
          addGastoRegistro();
          const btn = document.getElementById('addGastoBtn');
          if (btn && allRegistros.length >= 1) {
            btn.style.display = 'block';
          }
        }
        // NO auto-crear para créditos
      }, 300);
    }
  } else {
    registro.classList.remove('completed');
    registro.classList.add('active');
  }
  
  updateResumen();
  updateProgress();
}

function calculateTotal(element) {
  const registro = element.closest('.registro-card');
  if (!registro) return;
  
  const cantidad = registro.querySelector('.cantidad').value;
  const precio = registro.querySelector('.precio').value;
  const totalField = registro.querySelector('.total');
  
  if (cantidad && precio && totalField) {
    const total = cantidad * precio;
    totalField.value = total.toFixed(2);
    updateResumen();
    checkRegistroCompletion(element);
  }
}

function autoSetPrice(selectElement) {
  const producto = selectElement.value;
  const registro = selectElement.closest('.registro-card');
  if (!registro) return;
  
  const precioInput = registro.querySelector('.precio');
  if (!precioInput) return;
  
  if (producto === 'Botellones') {
    precioInput.value = '30.00';
  } else if (producto === 'Bolsas') {
    precioInput.value = '18.00';
  }
  
  const cantidadInput = registro.querySelector('.cantidad');
  if (cantidadInput && cantidadInput.value) {
    calculateTotal(cantidadInput);
  }
}

function removeRegistro(button) {
  const registro = button.closest('.registro-card');
  const container = registro.parentElement;
  
  if (container.children.length > 1) {
    registro.remove();
    
    if (container.id === 'ventas-container') {
      ventasCount--;
      updateCounter('ventas');
      if (container.children.length <= 1) {
        const btn = document.getElementById('addVentaBtn');
        if (btn) btn.style.display = 'none';
      }
    } else if (container.id === 'gastos-container') {
      gastosCount--;
      updateCounter('gastos');
      if (container.children.length <= 1) {
        const btn = document.getElementById('addGastoBtn');
        if (btn) btn.style.display = 'none';
      }
    } else if (container.id === 'creditos-container') {
      creditosCount--;
      updateCounter('creditos');
    }
    
    updateResumen();
    updateProgress();
  } else {
    // Limpiar el último registro en lugar de eliminarlo
    const inputs = registro.querySelectorAll('input, select');
    inputs.forEach(input => {
      if (!input.readOnly) {
        input.value = '';
      }
    });
    registro.classList.remove('completed', 'active');
    registro.classList.add('active');
    updateResumen();
    updateProgress();
  }
}

function updateCounter(type) {
  let count = 0;
  let container;
  let total = 0;
  
  if (type === 'ventas') {
    container = document.getElementById('ventas-container');
    if (container) {
      count = container.children.length;
      container.querySelectorAll('.total').forEach(input => {
        total += parseFloat(input.value) || 0;
      });
      
      const counterEl = document.getElementById('ventasCounter');
      const totalEl = document.getElementById('ventasTotal');
      if (counterEl) counterEl.textContent = `${count} registro${count !== 1 ? 's' : ''}`;
      if (totalEl) totalEl.textContent = `L. ${total.toFixed(2)}`;
    }
  } else if (type === 'gastos') {
    container = document.getElementById('gastos-container');
    if (container) {
      count = container.children.length;
      container.querySelectorAll('.monto').forEach(input => {
        total += parseFloat(input.value) || 0;
      });
      
      const counterEl = document.getElementById('gastosCounter');
      const totalEl = document.getElementById('gastosTotal');
      if (counterEl) counterEl.textContent = `${count} registro${count !== 1 ? 's' : ''}`;
      if (totalEl) totalEl.textContent = `L. ${total.toFixed(2)}`;
    }
  } else if (type === 'creditos') {
    container = document.getElementById('creditos-container');
    if (container) {
      count = container.children.length;
      container.querySelectorAll('.monto').forEach(input => {
        total += parseFloat(input.value) || 0;
      });
      
      const counterEl = document.getElementById('creditosCounter');
      const totalEl = document.getElementById('creditosTotal');
      if (counterEl) counterEl.textContent = `${count} registro${count !== 1 ? 's' : ''}`;
      if (totalEl) totalEl.textContent = `L. ${total.toFixed(2)}`;
    }
  }
}

function updateResumen() {
  const cajaInicial = parseFloat(document.getElementById('cajaInicial')?.value) || 0;
  
  let totalVentas = 0;
  document.querySelectorAll('#ventas-container .total').forEach(input => {
    totalVentas += parseFloat(input.value) || 0;
  });
  
  let totalGastos = 0;
  document.querySelectorAll('#gastos-container .monto').forEach(input => {
    totalGastos += parseFloat(input.value) || 0;
  });
  
  let totalCreditos = 0;
  document.querySelectorAll('#creditos-container .monto').forEach(input => {
    totalCreditos += parseFloat(input.value) || 0;
  });
  
  const resultadoFinal = cajaInicial + totalVentas - totalGastos + totalCreditos;
  
  // Actualizar elementos del DOM
  const elementos = {
    cajaResumen: document.getElementById('cajaResumen'),
    totalVentasResumen: document.getElementById('totalVentasResumen'),
    totalGastosResumen: document.getElementById('totalGastosResumen'),
    totalCreditosResumen: document.getElementById('totalCreditosResumen'),
    resultadoFinal: document.getElementById('resultadoFinal')
  };
  
  if (elementos.cajaResumen) elementos.cajaResumen.textContent = `L.${cajaInicial.toFixed(2)}`;
  if (elementos.totalVentasResumen) elementos.totalVentasResumen.textContent = `L.${totalVentas.toFixed(2)}`;
  if (elementos.totalGastosResumen) elementos.totalGastosResumen.textContent = `L.${totalGastos.toFixed(2)}`;
  if (elementos.totalCreditosResumen) elementos.totalCreditosResumen.textContent = `L.${totalCreditos.toFixed(2)}`;
  if (elementos.resultadoFinal) elementos.resultadoFinal.textContent = `L.${resultadoFinal.toFixed(2)}`;
  
  updateCounter('ventas');
  updateCounter('gastos');
  updateCounter('creditos');
}

function updateProgress() {
  const totalFields = document.querySelectorAll('input[required], select[required]').length;
  let completedFields = 0;
  
  document.querySelectorAll('input[required], select[required]').forEach(field => {
    if (field.value.trim()) completedFields++;
  });
  
  const percentage = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
  const progressFill = document.getElementById('progressFill');
  if (progressFill) {
    progressFill.style.width = `${percentage}%`;
  }
}

function autoFillVentas() {
  const ejemplos = [
    { vendedor: 'Brayan', ciudad: 'Comayagua', producto: 'Botellones', cantidad: 25, precio: 30 },
    { vendedor: 'Ariel', ciudad: 'Siguatepeque', producto: 'Bolsas', cantidad: 50, precio: 18 }
  ];
  
  ejemplos.forEach((ejemplo, index) => {
    const registros = document.querySelectorAll('#ventas-container .registro-card');
    if (!registros[index] && index === registros.length) {
      addVentaRegistro();
    }
    
    const registro = document.querySelectorAll('#ventas-container .registro-card')[index];
    if (registro) {
      registro.querySelector('.vendedor').value = ejemplo.vendedor;
      registro.querySelector('.ciudad').value = ejemplo.ciudad;
      registro.querySelector('.producto').value = ejemplo.producto;
      registro.querySelector('.cantidad').value = ejemplo.cantidad;
      registro.querySelector('.precio').value = ejemplo.precio;
      calculateTotal(registro.querySelector('.cantidad'));
    }
  });
}

function autoFillGastos() {
  const ejemplos = [
    { categoria: 'Combustible', descripcion: 'Gasolina del día', monto: 500 },
    { categoria: 'Planilla Brayan', descripcion: 'Pago diario', monto: 350 }
  ];
  
  ejemplos.forEach((ejemplo, index) => {
    const registros = document.querySelectorAll('#gastos-container .registro-card');
    if (!registros[index] && index === registros.length) {
      addGastoRegistro();
    }
    
    const registro = document.querySelectorAll('#gastos-container .registro-card')[index];
    if (registro) {
      registro.querySelector('.categoria').value = ejemplo.categoria;
      registro.querySelector('.descripcion').value = ejemplo.descripcion;
      registro.querySelector('.monto').value = ejemplo.monto;
      checkRegistroCompletion(registro.querySelector('.categoria'));
    }
  });
}

function autoFillCreditos() {
  const ejemplos = [
    { categoria: 'CORRAL LA VILLA', detalle: 'Pago de servicios', monto: 150 },
    { categoria: 'TRANSFERENCIAS POR VENTAS', detalle: 'Transferencia bancaria', monto: 90 }
  ];
  
  ejemplos.forEach((ejemplo, index) => {
    const registros = document.querySelectorAll('#creditos-container .registro-card');
    if (!registros[index] && index === registros.length) {
      addCreditoRegistro();
    }
    
    const registro = document.querySelectorAll('#creditos-container .registro-card')[index];
    if (registro) {
      registro.querySelector('.categoria').value = ejemplo.categoria;
      registro.querySelector('.detalle').value = ejemplo.detalle;
      registro.querySelector('.monto').value = ejemplo.monto;
      updateResumen();
    }
  });
}

// ✅ ÚNICA FUNCIÓN GUARDAR - CON PROTECCIÓN CONTRA CLICKS MÚLTIPLES
async function guardarRegistro() {
  // 🔒 BLOQUEAR SI YA ESTÁ GUARDANDO
  if (guardandoRegistro) {
    console.warn('⚠️ Ya hay un guardado en progreso, ignorando nuevo click');
    return;
  }

  if (!validarDatos(true)) {
    return;
  }

  const btnGuardar = document.getElementById('btnGuardar');
  const originalText = btnGuardar.innerHTML;
  
  try {
    // 🔒 MARCAR COMO GUARDANDO INMEDIATAMENTE
    guardandoRegistro = true;
    btnGuardar.innerHTML = '⏳ Guardando en Supabase...';
    btnGuardar.disabled = true;
    
    const datos = recopilarDatos();
    console.log('💾 Guardando registro en Supabase:', datos);
    
    const result = await SupabaseData.saveRegistroDiario(datos.fecha, datos);
    
    if (result.success) {
      alert('✅ ¡Registro guardado correctamente en la base de datos Supabase!');
      console.log('✅ Registro guardado exitosamente:', result.data);
      
      // ✅ RECARGAR DE FORMA SEGURA SIN LOOP INFINITO
      setTimeout(() => {
        window.location.href = window.location.pathname + '?reload=' + Date.now();
      }, 800);
    } else {
      throw new Error(result.error || 'Error desconocido al guardar');
    }
    
  } catch (error) {
    console.error('❌ Error al guardar en Supabase:', error);
    alert('❌ Error al guardar: ' + error.message);
    
    // 🔓 PERMITIR REINTENTAR
    guardandoRegistro = false;
    btnGuardar.innerHTML = originalText;
    btnGuardar.disabled = false;
  }
}

function setupEventListeners() {
  const cajaInicialInput = document.getElementById('cajaInicial');
  if (cajaInicialInput) {
    cajaInicialInput.addEventListener('change', updateResumen);
    cajaInicialInput.addEventListener('input', updateResumen);
  }
  
  const btnGuardar = document.getElementById('btnGuardar');
  if (btnGuardar) {
    btnGuardar.addEventListener('click', guardarRegistro);
  }
  
  const btnLimpiar = document.getElementById('btnLimpiar');
  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', limpiarTodo);
  }
  
  const btnValidar = document.getElementById('btnValidar');
  if (btnValidar) {
    btnValidar.addEventListener('click', () => validarDatos(true));
  }
}

function limpiarTodo() {
  if (confirm('¿Está seguro de limpiar todos los datos?')) {
    window.location.href = window.location.pathname;
  }
}

function validarDatos(showAlert = false) {
  const errors = [];
  
  if (!document.getElementById('fecha')?.value) {
    errors.push('Fecha es requerida');
  }
  
  const ventasCompletas = document.querySelectorAll('#ventas-container .registro-card.completed').length;
  if (ventasCompletas === 0) {
    errors.push('Debe registrar al menos una venta');
  }
  
  if (errors.length > 0 && showAlert) {
    alert('Errores encontrados:\n' + errors.join('\n'));
    return false;
  }
  
  return errors.length === 0;
}

function recopilarDatos() {
  return {
    fecha: document.getElementById('fecha')?.value,
    cajaInicial: parseFloat(document.getElementById('cajaInicial')?.value) || 0,
    ventas: Array.from(document.querySelectorAll('#ventas-container .registro-card.completed')).map(row => ({
      vendedor: row.querySelector('.vendedor')?.value,
      ciudad: row.querySelector('.ciudad')?.value,
      producto: row.querySelector('.producto')?.value,
      cantidad: parseInt(row.querySelector('.cantidad')?.value),
      precio: parseFloat(row.querySelector('.precio')?.value),
      total: parseFloat(row.querySelector('.total')?.value)
    })),
    gastos: Array.from(document.querySelectorAll('#gastos-container .registro-card')).filter(row => 
      (row.querySelector('.monto')?.value || 0) > 0
    ).map(row => ({
      categoria: row.querySelector('.categoria')?.value,
      descripcion: row.querySelector('.descripcion')?.value,
      monto: parseFloat(row.querySelector('.monto')?.value)
    })),
    creditos: Array.from(document.querySelectorAll('#creditos-container .registro-card')).filter(row =>
      (row.querySelector('.monto')?.value || 0) > 0
    ).map(row => ({
      categoria: row.querySelector('.categoria')?.value,
      detalle: row.querySelector('.detalle')?.value,
      monto: parseFloat(row.querySelector('.monto')?.value)
    })),
    observaciones: document.getElementById('observaciones')?.value || ''
  };
}

console.log('✅ Capturador.js cargado correctamente - SIN DUPLICACIÓN');

// ===== FUNCIONES MEJORADAS PARA FOTOS =====
function seleccionarOpcionFoto(numero) {
  // No hacer nada, las opciones se manejan individualmente
}

function abrirArchivos(numero) {
  document.getElementById('file' + numero).click();
}

function abrirCamara(numero) {
  document.getElementById('camera' + numero).click();
}

function previsualizarFoto(numero, input) {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const fotoUpload = input.closest('.foto-upload');
      
      // Crear previsualización compacta
      fotoUpload.innerHTML = `
        <div class="upload-content">
          <img src="${e.target.result}" style="max-width: 100%; max-height: 80px; border-radius: 6px; object-fit: cover; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div class="upload-text" style="color: #10b981; font-weight: 600; font-size: 12px;">
            <i class="fas fa-check-circle"></i> Foto ${numero}
          </div>
          <div class="upload-options">
            <div class="option-btn" onclick="cambiarFoto(${numero})">
              <i class="fas fa-edit"></i> Cambiar
            </div>
            <div class="option-btn" onclick="eliminarFoto(${numero})">
              <i class="fas fa-trash"></i> Quitar
            </div>
          </div>
        </div>
      `;
      
      // Cambiar estilo para estado cargado
      fotoUpload.style.background = 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)';
      fotoUpload.style.borderColor = '#38bdf8';
      fotoUpload.classList.add('loaded');
    };
    reader.readAsDataURL(file);
    
    // Guardar archivo en variable global para uso posterior
    window['foto' + numero] = file;
  }
}

function cambiarFoto(numero) {
  // Resetear el upload
  const allUploads = document.querySelectorAll('.foto-upload');
  const fotoUpload = allUploads[numero - 1];
  if (fotoUpload) {
    resetearUpload(numero, fotoUpload);
  }
}

function eliminarFoto(numero) {
  if (confirm('¿Estás seguro de que quieres eliminar esta foto?')) {
    const allUploads = document.querySelectorAll('.foto-upload');
    const fotoUpload = allUploads[numero - 1];
    if (fotoUpload) {
      resetearUpload(numero, fotoUpload);
      delete window['foto' + numero];
    }
  }
}

function resetearUpload(numero, elemento) {
  elemento.innerHTML = `
    <div class="upload-content">
      <div class="upload-icon">
        <i class="fas fa-camera"></i>
      </div>
      <div class="upload-text">Subir Foto ${numero}</div>
      <div class="upload-options">
        <div class="option-btn" onclick="event.stopPropagation(); abrirArchivos(${numero})">
          <i class="fas fa-folder"></i> Archivo
        </div>
        <div class="option-btn" onclick="event.stopPropagation(); abrirCamara(${numero})">
          <i class="fas fa-camera"></i> Cámara
        </div>
      </div>
    </div>
    <input type="file" class="file-input" id="file${numero}" accept="image/*" onchange="previsualizarFoto(${numero}, this)">
    <input type="file" class="file-input" id="camera${numero}" accept="image/*" capture="camera" onchange="previsualizarFoto(${numero}, this)">
  `;
  
  elemento.style.background = '#f8f9ff';
  elemento.style.borderColor = '#cbd5e1';
  elemento.classList.remove('loaded');
}

console.log('✅ Sistema de fotos mejorado cargado correctamente');