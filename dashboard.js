// ===== DASHBOARD AVANZADO AGUA ZAFIRO =====
// Datos centralizados y realistas
const datosEmpresa = {
  vendedores: {
    nombres: ['Brayan', 'Ariel', 'Bodega'],
    botellones: [456, 389, 334],
    bolsas: [340, 398, 256],
    ventasLempiras: [24580, 22300, 18700],
    tendencias: ['+12%', '+8%', '-3%']
  },
  
  productos: {
    botellones: {
      cantidad: 1179,
      precioUnitario: 30,
      totalVentas: 35370
    },
    bolsas: {
      cantidad: 994,
      precioUnitario: 18,
      totalVentas: 17892
    }
  },
  
  gastos: {
    categorias: ['Combustible', 'Planillas', 'Mantenimiento', 'Otros'],
    montos: [5500, 6800, 2200, 740],
    porcentajes: [36, 45, 14, 5]
  },
  
  ciudades: [
    { nombre: 'Tegucigalpa', ventas: 28400, porcentaje: 42 },
    { nombre: 'San Pedro Sula', ventas: 15600, porcentaje: 23 },
    { nombre: 'La Ceiba', ventas: 9800, porcentaje: 14 },
    { nombre: 'Comayagua', ventas: 8200, porcentaje: 12 },
    { nombre: 'Otras', ventas: 6580, porcentaje: 9 }
  ],
  
  evolucionMensual: {
    meses: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
    ventas: [58400, 61200, 65800, 63400, 66200, 68580],
    gastos: [12400, 13800, 16500, 14200, 14800, 15240],
    utilidad: [46000, 47400, 49300, 49200, 51400, 53340]
  },
  
  creditos: {
    totalCreditos: 3445,
    creditosPendientes: 2100,
    creditosCobrados: 1345
  }
};

// Configuración de colores consistente
const colores = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  teal: '#14b8a6',
  orange: '#f97316',
  indigo: '#6366f1'
};

// Variables globales para las gráficas
let chartVendedores, chartProductos, chartGastos, chartCiudades, chartEvolucion;

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", function() {
  inicializarDashboard();
  crearGraficas();
  configurarFiltros();
  actualizarKPIs();
  crearTablaPerformance();
});

// ===== FUNCIONES PRINCIPALES =====

function inicializarDashboard() {
  console.log('🚀 Inicializando Dashboard Agua Zafiro...');
  
  // Verificar que todos los elementos existan
  const elementosRequeridos = [
    'ventasProductoChart',
    'ventasChart', 
    'gastosChart',
    'ciudadesChart',
    'evolucionChart'
  ];
  
  elementosRequeridos.forEach(id => {
    const elemento = document.getElementById(id);
    if (!elemento) {
      console.warn(`⚠️ Elemento ${id} no encontrado`);
    }
  });
}

function crearGraficas() {
  // 1. GRÁFICA DE PRODUCTOS (Doughnut mejorado)
  const ctxProductos = document.getElementById('ventasProductoChart');
  if (ctxProductos) {
    chartProductos = new Chart(ctxProductos, {
      type: 'doughnut',
      data: {
        labels: ['Botellones 20L', 'Bolsas 500ml'],
        datasets: [{
          data: [
            datosEmpresa.productos.botellones.cantidad,
            datosEmpresa.productos.bolsas.cantidad
          ],
          backgroundColor: [colores.primary, colores.success],
          borderWidth: 3,
          borderColor: '#fff',
          cutout: '65%',
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              font: { size: 13, weight: '600' },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const producto = context.label;
                const cantidad = context.parsed;
                const esBotellon = producto.includes('Botellones');
                const ingresos = esBotellon ? 
                  datosEmpresa.productos.botellones.totalVentas : 
                  datosEmpresa.productos.bolsas.totalVentas;
                const precio = esBotellon ? 
                  datosEmpresa.productos.botellones.precioUnitario : 
                  datosEmpresa.productos.bolsas.precioUnitario;
                
                return [
                  `${producto}`,
                  `Cantidad: ${cantidad.toLocaleString()} unidades`,
                  `Precio: L. ${precio}`,
                  `Total: L. ${ingresos.toLocaleString()}`
                ];
              }
            }
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true
        }
      }
    });
  }

  // 2. GRÁFICA DE VENDEDORES (Bar chart dinámico)
  const ctxVendedores = document.getElementById('ventasChart');
  if (ctxVendedores) {
    chartVendedores = new Chart(ctxVendedores, {
      type: 'bar',
      data: {
        labels: datosEmpresa.vendedores.nombres,
        datasets: [
          {
            label: 'Botellones',
            data: datosEmpresa.vendedores.botellones,
            backgroundColor: colores.primary,
            borderRadius: 6,
            borderSkipped: false
          },
          {
            label: 'Bolsas',
            data: datosEmpresa.vendedores.bolsas,
            backgroundColor: colores.success,
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { weight: '600' } }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.1)' },
            ticks: {
              callback: function(value) {
                return value.toLocaleString();
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
  }

  // 3. GRÁFICA DE GASTOS (Pie mejorado)
  const ctxGastos = document.getElementById('gastosChart');
  if (ctxGastos) {
    chartGastos = new Chart(ctxGastos, {
      type: 'pie',
      data: {
        labels: datosEmpresa.gastos.categorias,
        datasets: [{
          data: datosEmpresa.gastos.montos,
          backgroundColor: [
            colores.danger,
            colores.warning,
            colores.primary,
            colores.purple
          ],
          borderWidth: 3,
          borderColor: '#fff',
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 12, weight: '600' },
              padding: 15,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const categoria = context.label;
                const monto = context.parsed;
                const porcentaje = datosEmpresa.gastos.porcentajes[context.dataIndex];
                return [
                  `${categoria}`,
                  `L. ${monto.toLocaleString()}`,
                  `${porcentaje}% del total`
                ];
              }
            }
          }
        }
      }
    });
  }

  // 4. GRÁFICA DE CIUDADES (Polar Area)
  const ctxCiudades = document.getElementById('ciudadesChart');
  if (ctxCiudades) {
    chartCiudades = new Chart(ctxCiudades, {
      type: 'polarArea',
      data: {
        labels: datosEmpresa.ciudades.map(c => c.nombre),
        datasets: [{
          data: datosEmpresa.ciudades.map(c => c.ventas),
          backgroundColor: [
            colores.primary,
            colores.success,
            colores.warning,
            colores.purple,
            colores.teal
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { 
              font: { size: 11, weight: '600' },
              padding: 10
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const ciudad = context.label;
                const ventas = context.parsed;
                const porcentaje = datosEmpresa.ciudades[context.dataIndex].porcentaje;
                return [
                  `${ciudad}`,
                  `L. ${ventas.toLocaleString()}`,
                  `${porcentaje}% del total`
                ];
              }
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'L. ' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }

  // 5. GRÁFICA DE EVOLUCIÓN (Line chart avanzado)
  const ctxEvolucion = document.getElementById('evolucionChart');
  if (ctxEvolucion) {
    chartEvolucion = new Chart(ctxEvolucion, {
      type: 'line',
      data: {
        labels: datosEmpresa.evolucionMensual.meses,
        datasets: [
          {
            label: 'Ventas',
            data: datosEmpresa.evolucionMensual.ventas,
            borderColor: colores.success,
            backgroundColor: colores.success + '20',
            fill: '+1',
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: colores.success,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
          },
          {
            label: 'Gastos',
            data: datosEmpresa.evolucionMensual.gastos,
            borderColor: colores.danger,
            backgroundColor: colores.danger + '20',
            fill: 'origin',
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: colores.danger,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
          },
          {
            label: 'Utilidad',
            data: datosEmpresa.evolucionMensual.utilidad,
            borderColor: colores.purple,
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: colores.purple,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { weight: '600' } }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              title: function(tooltipItems) {
                return tooltipItems[0].label;
              },
              label: function(context) {
                return `${context.dataset.label}: L. ${context.parsed.y.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.1)' },
            ticks: {
              callback: function(value) {
                return 'L. ' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }
}

// ===== FUNCIONES DE FILTROS =====
function configurarFiltros() {
  // Filtro de tipo de venta para vendedores
  const filtroTipoVenta = document.getElementById('tipoVenta');
  if (filtroTipoVenta) {
    filtroTipoVenta.addEventListener('change', function() {
      actualizarGraficaVendedores(this.value);
    });
  }

  // Filtro de período para productos
  const filtroPeriodoProducto = document.getElementById('periodoProducto');
  if (filtroPeriodoProducto) {
    filtroPeriodoProducto.addEventListener('change', function() {
      console.log('Cambiando período de productos a:', this.value);
      // Aquí se conectaría con Supabase para filtrar datos
    });
  }

  // Filtro de evolución temporal
  const filtroPeriodoEvolucion = document.getElementById('periodoEvolucion');
  if (filtroPeriodoEvolucion) {
    filtroPeriodoEvolucion.addEventListener('change', function() {
      console.log('Cambiando período de evolución a:', this.value);
      // Aquí se conectaría con Supabase para datos históricos
    });
  }
}

function actualizarGraficaVendedores(tipo) {
  if (!chartVendedores) return;

  if (tipo === 'dinero') {
    chartVendedores.data.datasets = [{
      label: 'Ventas Totales (L.)',
      data: datosEmpresa.vendedores.ventasLempiras,
      backgroundColor: colores.purple,
      borderRadius: 6,
      borderSkipped: false
    }];
  } else {
    chartVendedores.data.datasets = [
      {
        label: 'Botellones',
        data: datosEmpresa.vendedores.botellones,
        backgroundColor: colores.primary,
        borderRadius: 6,
        borderSkipped: false
      },
      {
        label: 'Bolsas',
        data: datosEmpresa.vendedores.bolsas,
        backgroundColor: colores.success,
        borderRadius: 6,
        borderSkipped: false
      }
    ];
  }
  
  chartVendedores.update('active');
}

// ===== ACTUALIZACIÓN DE KPIs =====
function actualizarKPIs() {
  const totalVentas = datosEmpresa.productos.botellones.totalVentas + 
                     datosEmpresa.productos.bolsas.totalVentas;
  const totalGastos = datosEmpresa.gastos.montos.reduce((a, b) => a + b, 0);
  const totalCreditos = datosEmpresa.creditos.totalCreditos;
  const resultadoFinal = totalVentas - totalGastos + totalCreditos;

  // Actualizar elementos del DOM
  const elementos = {
    totalVentas: document.getElementById('totalVentas'),
    totalGastos: document.getElementById('totalGastos'),
    totalCreditos: document.getElementById('totalCreditos'),
    resultadoFinal: document.getElementById('resultadoFinal')
  };

  if (elementos.totalVentas) {
    elementos.totalVentas.textContent = `L. ${totalVentas.toLocaleString()}`;
  }
  if (elementos.totalGastos) {
    elementos.totalGastos.textContent = `L. ${totalGastos.toLocaleString()}`;
  }
  if (elementos.totalCreditos) {
    elementos.totalCreditos.textContent = `L. ${totalCreditos.toLocaleString()}`;
  }
  if (elementos.resultadoFinal) {
    elementos.resultadoFinal.textContent = `L. ${resultadoFinal.toLocaleString()}`;
  }

  console.log('📊 KPIs actualizados:', {
    ventas: totalVentas,
    gastos: totalGastos,
    creditos: totalCreditos,
    resultado: resultadoFinal
  });
}

// ===== TABLA DE PERFORMANCE =====
function crearTablaPerformance() {
  const tbody = document.getElementById('performanceTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  datosEmpresa.vendedores.nombres.forEach((nombre, index) => {
    const fila = document.createElement('tr');
    const botellones = datosEmpresa.vendedores.botellones[index];
    const bolsas = datosEmpresa.vendedores.bolsas[index];
    const ventas = datosEmpresa.vendedores.ventasLempiras[index];
    const tendencia = datosEmpresa.vendedores.tendencias[index];
    
    const esPositiva = tendencia.includes('+');
    const clasesTendencia = esPositiva ? 'trend-up' : 'trend-down';
    const iconoTendencia = esPositiva ? '↗' : '↘';

    fila.innerHTML = `
      <td><strong>${nombre}</strong></td>
      <td>${botellones} unidades</td>
      <td>${bolsas} unidades</td>
      <td><strong>L. ${ventas.toLocaleString()}</strong></td>
      <td class="${clasesTendencia}">${iconoTendencia} ${tendencia}</td>
    `;

    tbody.appendChild(fila);
  });
}

// ===== FUNCIONES DE UTILIDAD =====
function formatearMoneda(cantidad) {
  return `L. ${cantidad.toLocaleString()}`;
}

function formatearPorcentaje(valor) {
  return `${valor}%`;
}

// ===== EXPORTACIÓN DE FUNCIONES (para uso externo) =====
window.DashboardAguaZafiro = {
  actualizarDatos: function(nuevosDatos) {
    // Función para actualizar datos desde Supabase
    Object.assign(datosEmpresa, nuevosDatos);
    actualizarKPIs();
    crearTablaPerformance();
    
    // Re-crear gráficas con nuevos datos
    if (chartProductos) chartProductos.destroy();
    if (chartVendedores) chartVendedores.destroy();
    if (chartGastos) chartGastos.destroy();
    if (chartCiudades) chartCiudades.destroy();
    if (chartEvolucion) chartEvolucion.destroy();
    
    crearGraficas();
  },
  
  exportarDatos: function() {
    return datosEmpresa;
  },
  
  obtenerResumen: function() {
    const totalVentas = datosEmpresa.productos.botellones.totalVentas + 
                       datosEmpresa.productos.bolsas.totalVentas;
    const totalGastos = datosEmpresa.gastos.montos.reduce((a, b) => a + b, 0);
    
    return {
      ventas: totalVentas,
      gastos: totalGastos,
      utilidad: totalVentas - totalGastos,
      unidadesVendidas: datosEmpresa.productos.botellones.cantidad + 
                        datosEmpresa.productos.bolsas.cantidad
    };
  }
};

console.log('✅ Dashboard.js cargado correctamente - Agua Zafiro v2.0');