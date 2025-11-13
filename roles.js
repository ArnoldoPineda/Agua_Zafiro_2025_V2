// 🎭 CONTROL DE INTERFAZ SEGÚN ROL
// Versión 2.0 - Con soporte para PRODUCCION

function setupRoleBasedUI(userRole) {
  // Esperar a que el DOM esté completamente cargado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setupRoleBasedUI(userRole));
    return;
  }
  
  console.log('🎨 Configurando UI para rol:', userRole);
  
  // ==========================================
  // ROL: PRODUCCION
  // ==========================================
  if (userRole === 'produccion') {
    console.log('🏭 Configurando interfaz para PRODUCCIÓN');
    
    // Ocultar elementos que NO son de producción
    const ventasElements = document.querySelectorAll('.ventas-only, .dashboard-only');
    ventasElements.forEach(el => {
      el.style.display = 'none';
      console.log('Ocultado elemento no-producción:', el.className);
    });
    
    // Ocultar links del navbar que no corresponden
    const navLinks = document.querySelectorAll('a[href="dashboard.html"], a[href="capturador.html"], a[href="calendario.html"]');
    navLinks.forEach(link => {
      link.style.display = 'none';
    });
    
    // Mensaje informativo
    const infoMessage = document.createElement('div');
    infoMessage.innerHTML = `
      <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                  color: white; padding: 12px; text-align: center;
                  border-radius: 8px; margin: 10px 0; box-shadow: 0 4px 12px rgba(139,92,246,0.3);">
        <i class="fas fa-industry"></i> <strong>Módulo de Producción</strong> - Gestión de órdenes, lotes e inventario
      </div>
    `;
    const container = document.querySelector('.container') || document.querySelector('.dashboard') || document.body;
    if (container) {
      container.insertBefore(infoMessage, container.firstChild);
    }
  }
  
  // ==========================================
  // ROL: VENDEDOR
  // ==========================================
  if (userRole === 'vendedor') {
    console.log('🛒 Configurando interfaz para VENDEDOR');
    
    // Ocultar elementos que no son capturador o calendario
    const dashboardLinks = document.querySelectorAll('.dashboard-only');
    dashboardLinks.forEach(el => el.style.display = 'none');
    
    // Ocultar específicamente enlaces y botones del dashboard
    const dashboardNavButtons = document.querySelectorAll('a[href="dashboard.html"], .nav-btn[href="dashboard.html"]');
    dashboardNavButtons.forEach(button => {
      button.style.display = 'none';
    });
    
    // Ocultar botones que contienen texto "Dashboard" o "Producción"
    const allButtons = document.querySelectorAll('button, a');
    allButtons.forEach(button => {
      if (button.textContent.includes('Dashboard') || 
          button.textContent.includes('Ver Dashboard') ||
          button.textContent.includes('Producción')) {
        button.style.display = 'none';
      }
    });
    
    console.log('✅ Elementos de dashboard y producción ocultados para vendedor');
  }

   // Si NO es admin → ocultar elementos marcados como admin-only
  if (userRole !== 'admin') {
    const adminElements = document.querySelectorAll('.admin-only');
    console.log('🔒 Ocultando elementos admin-only:', adminElements.length);
    adminElements.forEach(el => { 
      el.style.display = 'none'; 
    });
  }
  
  console.log('✅ Configuración de UI completada para rol:', userRole);
}

// 🛡️ VERIFICAR PERMISO ESPECÍFICO
function hasPermission(action, module = 'general') {
  const currentUser = SupabaseAuth.getCurrentUser();
  if (!currentUser) return false;

  const permissions = {
    'admin': {
      'ventas': true,
      'produccion': true,
      'dashboard': true,
      'reportes': true,
      'usuarios': true
    },
    'produccion': {
      'ventas': false,
      'produccion': true,
      'dashboard': false,
      'reportes': false,
      'usuarios': false
    },
    'vendedor': {
      'ventas': true,
      'produccion': false,
      'dashboard': false,
      'reportes': false,
      'usuarios': false
    }
  };

  return permissions[currentUser.role]?.[module] || false;
}

// 🌐 HACER FUNCIONES DISPONIBLES GLOBALMENTE
window.setupRoleBasedUI = setupRoleBasedUI;
window.hasPermission = hasPermission;

console.log('✅ Sistema de roles v2.0 cargado (con soporte Producción)');