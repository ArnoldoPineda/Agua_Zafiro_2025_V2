// 🔐 SISTEMA DE AUTENTICACIÓN CON SUPABASE - AGUA ZAFIRO
// Versión 2.0 - Con soporte para rol PRODUCCION

// 🎯 MANEJO DEL LOGIN
function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('error-message');
    const loginButton = document.querySelector('.login-button');

    if (!username || !password) {
        showError('Por favor, complete todos los campos');
        return;
    }

    // Mostrar loading
    loginButton.disabled = true;
    loginButton.textContent = 'Verificando...';
    errorDiv.style.display = 'none';

    // Autenticar con Supabase
    SupabaseAuth.login(username, password)
        .then(result => {
            if (result.success) {
                console.log('Login exitoso:', result.user);
                showSuccess(`¡Bienvenido, ${result.user.full_name || result.user.username}!`);

                // Redirección según rol
                setTimeout(() => {
                    redirectUserByRole(result.user.role);
                }, 1000);
            } else {
                showError(result.error);
                resetLoginButton();
            }
        })
        .catch(error => {
            console.error('Error inesperado:', error);
            showError('Error de conexión. Intente nuevamente.');
            resetLoginButton();
        });
}

// 📍 REDIRECCIÓN POR ROL (ACTUALIZADO CON PRODUCCIÓN)
function redirectUserByRole(role) {
    const redirects = {
        'admin': 'capturador.html',        // Admin ve todo
        'produccion': 'produccion.html',   // NUEVO: Módulo de producción
        'vendedor': 'capturador.html'
    };

    const destination = redirects[role] || 'capturador.html';
    console.log(`🔀 Redirigiendo ${role} → ${destination}`);
    window.location.href = destination;
}

// ❌ MOSTRAR ERROR
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '12px';
    errorDiv.style.borderRadius = '8px';
    errorDiv.style.marginBottom = '15px';
    errorDiv.style.textAlign = 'center';
}

// ✅ MOSTRAR ÉXITO
function showSuccess(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.style.background = 'linear-gradient(135deg, #059669, #047857)';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '12px';
    errorDiv.style.borderRadius = '8px';
    errorDiv.style.marginBottom = '15px';
    errorDiv.style.textAlign = 'center';
}

// 🔄 RESETEAR BOTÓN
function resetLoginButton() {
    const loginButton = document.querySelector('.login-button');
    loginButton.disabled = false;
    loginButton.textContent = 'Iniciar Sesión';
}

// 🛡️ VERIFICAR AUTENTICACIÓN
function checkAuthentication() {
    const currentUser = SupabaseAuth.getCurrentUser();
    if (!currentUser) {
        console.log('Usuario no autenticado, redirigiendo al login...');
        window.location.href = 'login.html';
        return null;
    }
    return currentUser;
}

// 🔒 VERIFICAR PERMISOS POR PÁGINA (ACTUALIZADO)
function checkPagePermissions() {
    const currentUser = checkAuthentication();
    if (!currentUser) return;

    const currentPage = window.location.pathname.split('/').pop();
    const userRole = currentUser.role;

    // PERMISOS ACTUALIZADOS CON PRODUCCIÓN
    const pagePermissions = {
        'dashboard.html': ['admin'],                              // Solo admin
        'capturador.html': ['admin', 'vendedor'],                // Admin y vendedores
        'calendario-ventas.html': ['admin', 'vendedor'],                // Admin y vendedores
        'produccion.html': ['admin', 'produccion']               // NUEVO: Admin y producción
    };

    const allowedRoles = pagePermissions[currentPage];
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        alert(`❌ Acceso denegado. Su rol (${userRole}) no tiene permisos para esta página.`);

        // REDIRECCIONES ACTUALIZADAS
        const redirects = {
            'admin': 'capturador.html',
            'produccion': 'produccion.html',   // NUEVO
            'vendedor': 'capturador.html'
        };
        window.location.href = redirects[userRole];
        return;
    }

    return currentUser;
}

// 🚪 CERRAR SESIÓN
function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        const result = SupabaseAuth.logout();
        if (result.success) {
            console.log('Sesión cerrada correctamente');
            window.location.href = 'login.html';
        }
    }
}

// 👤 MOSTRAR INFORMACIÓN DEL USUARIO (ACTUALIZADO)
function displayUserInfo() {
    const currentUser = SupabaseAuth.getCurrentUser();
    if (!currentUser) return;

    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
        userNameElement.textContent = currentUser.full_name || currentUser.username;
    }

    const userRoleElement = document.querySelector('.user-role');
    if (userRoleElement) {
        // NOMBRES DE ROLES ACTUALIZADOS
        const roleNames = {
            'admin': 'Administrador',
            'produccion': 'Encargado de Producción',  // NUEVO
            'vendedor': 'Vendedor'
        };
        userRoleElement.textContent = roleNames[currentUser.role] || currentUser.role;
    }

    // CREAR BOTÓN DE LOGOUT SI NO EXISTE
    let logoutButton = document.querySelector('.logout-button');
    if (!logoutButton) {
        const navActions = document.querySelector('.nav-actions');
        if (navActions) {
            logoutButton = document.createElement('button');
            logoutButton.className = 'btn logout-button';
            logoutButton.style.background = '#ef4444';
            logoutButton.style.color = 'white';
            logoutButton.style.border = 'none';
            logoutButton.style.padding = '10px 20px';
            logoutButton.style.borderRadius = '10px';
            logoutButton.style.cursor = 'pointer';
            logoutButton.style.fontWeight = '600';
            logoutButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> Salir';
            logoutButton.onclick = logout;
            navActions.appendChild(logoutButton);
        }
    }

    return currentUser;
}

// 🔄 EVENTOS DEL DOM
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('login.html')) {
        if (SupabaseAuth.isLoggedIn()) {
            const currentUser = SupabaseAuth.getCurrentUser();
            redirectUserByRole(currentUser.role);
            return;
        }

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }

        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    handleLogin(event);
                }
            });
        }
    } else {
        const currentUser = checkPagePermissions();
        if (currentUser) {
            displayUserInfo();
            setupRoleBasedUI(currentUser.role); // viene de roles.js
        }
    }
});

// 🌐 HACER FUNCIONES DISPONIBLES GLOBALMENTE
window.handleLogin = handleLogin;
window.logout = logout;
window.checkAuthentication = checkAuthentication;
window.checkPagePermissions = checkPagePermissions;
window.displayUserInfo = displayUserInfo;

console.log('✅ Sistema de autenticación v2.0 cargado (con soporte Producción)');