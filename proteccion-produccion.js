// 🛡️ PROTECCIÓN DE PRODUCCIÓN - REDIRIGIR A INDEX SI NO HAY USUARIO
(function() {
  setTimeout(() => {
    const currentUser = SupabaseAuth?.getCurrentUser();
    
    if (!currentUser) {
      console.log('🚫 Acceso no autenticado a produccion.html - Redirigiendo a index.html');
      window.location.href = 'index.html';
      return;
    }
    
    if (!['admin', 'produccion'].includes(currentUser.role)) {
      console.log(`🚫 Rol ${currentUser.role} no tiene acceso a producción`);
      window.location.href = 'index.html';
      return;
    }
    
    console.log(`✅ Usuario ${currentUser.username} autorizado en producción`);
  }, 300);
})();