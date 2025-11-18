// Menu.js - Sistema de Gestión para ACOSA (VERSIÓN COMPLETA CON PERSISTENCIA CORREGIDA)
document.addEventListener('DOMContentLoaded', function() {
    // ================================
    // 01. CONFIGURACIÓN Y VARIABLES GLOBALES
    // ================================
    
    // Elementos del DOM - Referencias a los componentes principales
    const menuContainer = document.getElementById('menuContainer');
    const contenedorPestañas = document.getElementById('contenedorPestañas');
    const barraHerramientas = document.getElementById('barraHerramientas');
    const welcomeMessage = document.querySelector('.welcome-message');
    const contentArea = document.querySelector('.content-area');
    const btnToggleMenu = document.getElementById('btnToggleMenu');
    const sidebar = document.getElementById('sidebar');

    // Estado de la aplicación - Control de pestañas y navegación
    let pestañasAbiertas = [];           // Array para almacenar pestañas abiertas
    let pestañaActiva = null;            // ID de la pestaña actualmente activa
    const MAX_PESTAÑAS = 6;              // Límite máximo de pestañas permitidas

    // ================================
    // 02. INICIALIZACIÓN PRINCIPAL DEL SISTEMA
    // ================================
    async function inicializar() {
        try {
            // Configurar elementos del DOM con estados iniciales
            configurarElementosDOM();
            
            // Cargar información del usuario desde sesión o token
            await cargarInformacionUsuario();
            
            // Cargar estructura de menús desde archivo JSON
            const modules = await cargarMenusDesdeJSON();
            
            // Renderizar menú principal con los módulos cargados
            if (modules && modules.length > 0) {
                renderMenuPrincipal(modules, 'Administrador');
                console.log('✅ Menús cargados desde JSON correctamente');
                
                // ✅ INICIALIZAR PERSISTENCIA - ESTA LÍNEA ES CLAVE
                inicializarPersistenciaCompleta();
            } else {
                throw new Error('No se pudieron cargar los menús');
            }
            
        } catch (error) {
            console.error('❌ Error inicializando sistema:', error);
            alert('Error cargando el sistema. Por favor recarga la página.');
        }
    }

    // ================================
    // 03. CARGA DE DATOS DESDE ARCHIVOS EXTERNOS
    // ================================
    async function cargarMenusDesdeJSON() {
        try {
            // Realizar petición fetch al archivo JSON de menús
            const res = await fetch('data/system/menus.json', {
                headers: { 
                    'Content-Type': 'application/json',
                }
            });
            
            if (res.ok) {
                const modules = await res.json();
                console.log('📁 Menús cargados desde JSON:', modules);
                return modules;
            } else {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }
        } catch (error) {
            console.error('❌ Error cargando menus.json:', error);
            return null;
        }
    }

    // ================================
    // 04. CONFIGURACIÓN INICIAL DE ELEMENTOS DEL DOM
    // ================================
    function configurarElementosDOM() {
        // Asegurar que el content-area tenga la clase inicial correcta
        if (contentArea) {
            contentArea.classList.add('contenido-inicial');
        }
        
        // Configurar botones de acceso rápido con eventos click
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const titulo = this.getAttribute('title');
                
                // Si es el botón de Salir, ejecutar función salir
                if (titulo === 'Salir') {
                    salir();
                } else {
                    // Para los otros botones, mostrar alerta temporal
                    alert(`🔧 Accediendo a: ${titulo}`);
                }
            });
        });
    }

    // ================================
    // FUNCIÓN DE SALIR - MOVER AFUERA PARA QUE SEA GLOBAL
    // ================================
    function salir() {
        // Limpiar datos de sesión
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        sessionStorage.clear();
        
        // Redirigir al login
        window.location.href = 'Login.html';
    }

    // Hacerla global
    window.salir = salir;

    // ================================
    // 05. GESTIÓN DE INFORMACIÓN DE USUARIO
    // ================================
    function cargarInformacionUsuario() {
        // Simular información de usuario (en producción vendría del token de autenticación)
        const usuario = {
            username: 'admin',
            role: 'Administrador'
        };
        
        // Actualizar footer con información del usuario
        const usuarioLogeado = document.getElementById('usuarioLogeado');
        if (usuarioLogeado) {
            usuarioLogeado.innerText = `Usuario: ${usuario.username} | Rol: ${usuario.role}`;
        }
        
        return Promise.resolve(usuario);
    }

    // ================================
    // 06. SISTEMA DE MENÚS - RENDERIZADO PRINCIPAL CORREGIDO CON TOOLTIPS
    // ================================
    function renderMenuPrincipal(modules, role) {
        if (!menuContainer) return;
        
        // Limpiar contenedor antes de renderizar
        menuContainer.innerHTML = '';

        // Iterar sobre cada módulo para crear su estructura
        modules.forEach((moduleData, index) => {
            const moduleGroup = document.createElement('div');
            moduleGroup.className = 'module-group';
            moduleGroup.setAttribute('data-module', `module-${index}`);
            
            // CREAR HEADER DEL MÓDULO CON TOOLTIP
            const moduleHeader = document.createElement('button');
            moduleHeader.className = 'module-header tooltip-container';
            
            // Icono del módulo - creado como elemento separado para mejor control
            const moduleIcon = document.createElement('span');
            moduleIcon.className = 'module-icon';
            moduleIcon.innerHTML = obtenerIconoModulo(moduleData.module, moduleData);
            
            // Texto del módulo - con clase específica para estilos
            const moduleText = document.createElement('span');
            moduleText.className = 'module-text';
            moduleText.textContent = moduleData.module;
            
            // Flecha indicadora de expansión/colapso
            const moduleArrow = document.createElement('span');
            moduleArrow.className = 'module-arrow';
            moduleArrow.textContent = '▶';
            
            // TOOLTIP para el módulo
            const moduleTooltip = document.createElement('span');
            moduleTooltip.className = 'tooltip';
            moduleTooltip.textContent = moduleData.module;
            
            // ENSAMBLAR CORRECTAMENTE LA ESTRUCTURA DEL HEADER CON TOOLTIP
            moduleHeader.appendChild(moduleIcon);
            moduleHeader.appendChild(moduleText);
            moduleHeader.appendChild(moduleArrow);
            moduleHeader.appendChild(moduleTooltip);
            
            // CREAR CONTENEDOR DE SUBMENÚ (inicialmente colapsado)
            const submenu = document.createElement('div');
            submenu.className = 'submenu';
            
            // Agregar submenús si existen en la estructura de datos
            if (moduleData.menus && moduleData.menus.length > 0) {
                moduleData.menus.forEach(menu => {
                    // Verificar si el usuario tiene acceso al menú principal según su rol
                    if (!menu.roles || menu.roles.includes(role)) {
                        
                        // Si el menú tiene submenús anidados
                        if (menu.submenus && menu.submenus.length > 0) {
                            // Crear item principal para el submenú (NO clickeable, solo título)
                            const menuItem = document.createElement('div');
                            menuItem.className = 'submenu-item';
                            menuItem.innerHTML = `<span>${menu.name}</span>`;
                            menuItem.style.fontWeight = 'var(--peso-seminegrita)';
                            menuItem.style.background = 'rgba(47, 49, 88, 0.05)';
                            menuItem.style.cursor = 'default';
                            menuItem.style.paddingLeft = '15px';
                            submenu.appendChild(menuItem);
                            
                            // Agregar submenús anidados (SÍ clickeables) CON TOOLTIPS
                            menu.submenus.forEach(submenuItemData => {
                                // Verificar si el usuario tiene acceso al submenú según su rol
                                if (!submenuItemData.roles || submenuItemData.roles.includes(role)) {
                                    crearItemSubmenu(submenu, submenuItemData, moduleData.module, '15px');
                                }
                            });
                        } else {
                            // Menú simple sin submenús (SÍ clickeable) CON TOOLTIP
                            crearItemSubmenu(submenu, menu, moduleData.module, '15px');
                        }
                    }
                });
            }
            
            // CONFIGURAR EVENTO PARA TOGGLE DEL ACORDEÓN (expandir/colapsar)
            moduleHeader.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevenir propagación del evento
                
                const isOpen = submenu.classList.contains('open'); // ✅ CORRECTO: usa 'open'
                
                // Cerrar todos los acordeones abiertos (comportamiento de acordeón)
                document.querySelectorAll('.submenu').forEach(sm => {
                    if (sm !== submenu) sm.classList.remove('open'); // ✅ CORRECTO: usa 'open'
                });
                document.querySelectorAll('.module-arrow').forEach(arrow => {
                    if (arrow !== this.querySelector('.module-arrow')) {
                        arrow.classList.remove('rotated');
                    }
                });
                document.querySelectorAll('.module-header').forEach(header => {
                    if (header !== this) header.classList.remove('active');
                });
                
                // Abrir/cerrar este acordeón específico
                if (!isOpen) {
                    submenu.classList.add('open'); // ✅ CORRECTO: usa 'open'
                    this.querySelector('.module-arrow').classList.add('rotated');
                    this.classList.add('active');
                } else {
                    submenu.classList.remove('open'); // ✅ CORRECTO: usa 'open'
                    this.querySelector('.module-arrow').classList.remove('rotated');
                    this.classList.remove('active');
                }
            });
            
            // ENSAMBLAR GRUPO COMPLETO Y AGREGAR AL CONTENEDOR
            moduleGroup.appendChild(moduleHeader);
            moduleGroup.appendChild(submenu);
            menuContainer.appendChild(moduleGroup);
        });

        // Inicializar funcionalidad de toggle del sidebar CON TOOLTIP
        inicializarSidebarToggle();
    }

    // ================================
    // 07. CREACIÓN DE ITEMS DE SUBMENÚ - FUNCIÓN AUXILIAR CON TOOLTIPS Y NOMENCLATURA AUTOMÁTICA CON FALLBACK
    // ================================
    function crearItemSubmenu(submenu, itemData, modulo, paddingLeft) {
        const submenuItem = document.createElement('button');
        submenuItem.className = 'submenu-item tooltip-container';
    
        // Generar nombre de archivo automáticamente según el nivel
        let nombreArchivo, rutaImagen;
    
        if (itemData.name.includes('Expedientes') || itemData.name.includes('Pagos')) {
            // Para menús principales: Men_NombreMenu
            nombreArchivo = `Men_${itemData.name.replace(/\s+/g, '')}`;
        } else {
            // Para submenús: Ico_NombreSubmenu  
            nombreArchivo = `Ico_${itemData.name.replace(/\s+/g, '')}`;
        }
    
        rutaImagen = `Imagenes/${nombreArchivo}.png`;
    
        // TOOLTIP para el submenú item
        const itemTooltip = document.createElement('span');
        itemTooltip.className = 'tooltip';
        itemTooltip.textContent = itemData.name;
    
        // FALLBACK UNIFICADO - TODOS USAN Img_Incognito
        const rutaImagenDefault = 'Imagenes/Img_Incognito.png';

        // Estructura HTML del item de submenú CON TOOLTIP
        submenuItem.innerHTML = `
        <img src="${rutaImagen}" alt="${itemData.name}" class="submenu-icon-img" onerror="this.src='${rutaImagenDefault}'; this.style.display='inline-block'">
        <span>${itemData.name}</span>
        `;

        submenuItem.appendChild(itemTooltip);
        submenuItem.style.paddingLeft = paddingLeft;
    
        // Configurar evento click para el item del submenú
        submenuItem.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevenir propagación
            
            // Remover estado activo de todos los items
            document.querySelectorAll('.submenu-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Activar item clickeado
            this.classList.add('active');
            
            // Abrir el módulo correspondiente en una pestaña
            abrirModulo(itemData.action, itemData.name);
        });
    
        // Agregar item al submenú
        submenu.appendChild(submenuItem);
    }

    // ================================
    // 08. OBTENCIÓN DE ICONOS PARA MÓDULOS - NOMENCLATURA AUTOMÁTICA
    // ================================
    function obtenerIconoModulo(nombreModulo, moduleData) {
        // Generar nombre de archivo automáticamente: Mod_NombreModulo
        const nombreArchivo = `Mod_${nombreModulo.replace(/\s+/g, '')}`;
        const rutaImagen = `Imagenes/${nombreArchivo}.png`;
        const rutaImagenDefault = 'Imagenes/Mod_Default.png'; // Imagen por defecto
        
        return `<img src="${rutaImagen}" alt="${nombreModulo}" class="module-icon-img" onerror="this.src='${rutaImagenDefault}'; this.style.display='inline-block'">`;
    }

    // ================================
    // 09. TOGGLE DEL SIDEBAR - EXPANDIR/COLAPSAR CON TOOLTIP
    // ================================
    function inicializarSidebarToggle() {
        if (!btnToggleMenu || !sidebar) return;
        
        // Agregar clase tooltip-container al botón toggle
        btnToggleMenu.classList.add('tooltip-container');
        
        // Crear tooltip para el botón toggle
        const toggleTooltip = document.createElement('span');
        toggleTooltip.className = 'tooltip';
        toggleTooltip.textContent = 'Contraer Menú';
        btnToggleMenu.appendChild(toggleTooltip);
        
        // Configurar evento click para el botón de toggle
        btnToggleMenu.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            
            // Actualizar texto del tooltip según el estado
            if (sidebar.classList.contains('collapsed')) {
                toggleTooltip.textContent = 'Expandir Menú';
            } else {
                toggleTooltip.textContent = 'Contraer Menú';
            }
            
            // Cerrar todos los submenús al colapsar el sidebar
            if (sidebar.classList.contains('collapsed')) {
                document.querySelectorAll('.submenu').forEach(sm => {
                    sm.classList.remove('open');
                });
                document.querySelectorAll('.module-arrow').forEach(arrow => {
                    arrow.classList.remove('rotated');
                });
                document.querySelectorAll('.module-header').forEach(header => {
                    header.classList.remove('active');
                });
            }
        });
        
        // Configuración responsive para dispositivos móviles
        if (window.innerWidth <= 768) {
            const overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
            
            // En móviles, mostrar/ocultar overlay al toggle
            btnToggleMenu.addEventListener('click', function() {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('active');
            });
            
            // Cerrar sidebar al hacer click en el overlay
            overlay.addEventListener('click', function() {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            });
        }
    }

    // ================================
    // 10. SISTEMA DE PESTAÑAS Y VISIBILIDAD
    // ================================
    function abrirModulo(action, moduleName) {
        console.log('🔗 Abriendo módulo:', moduleName, action);
        
        // Si es una URL externa, abrir en nueva pestaña del navegador
        if (action && action.startsWith('http')) {
            window.open(action, '_blank');
            return;
        }
        
        // Crear o activar pestaña interna en el sistema
        abrirPestañaInterna(moduleName, action);
    }

    // ================================
    // 11. GESTIÓN DE PESTAÑAS INTERNAS
    // ================================
    function abrirPestañaInterna(nombreModulo, archivoHTML) {
        // Verificar si ya existe la pestaña para evitar duplicados
        const pestañaExistente = pestañasAbiertas.find(p => p.nombre === nombreModulo);
        
        if (pestañaExistente) {
            // Si existe, simplemente activarla
            activarPestaña(pestañaExistente.id);
        } else {
            // Verificar límite antes de crear nueva pestaña
            if (!verificarLimitePestañas()) return;
            
            // Crear nueva pestaña con datos necesarios
            const nuevaPestaña = {
                id: 'pestana-' + Date.now(), // ID único basado en timestamp
                nombre: nombreModulo,
                archivo: archivoHTML,
                contenido: generarContenidoPestaña(nombreModulo, archivoHTML)
            };
            
            // Agregar a array de pestañas abiertas
            pestañasAbiertas.push(nuevaPestaña);
            
            // Actualizar interfaz de usuario
            agregarPestañaUI(nuevaPestaña);
            activarPestaña(nuevaPestaña.id);
            
            // ACTUALIZAR VISIBILIDAD - Ocultar bienvenida, mostrar pestañas
            actualizarVisibilidadContenido();
        }
    }

    // ================================
    // 12. CONTROL DE LÍMITES DE PESTAÑAS
    // ================================
    function verificarLimitePestañas() {
        if (pestañasAbiertas.length >= MAX_PESTAÑAS) {
            mostrarAlertaLimitePestañas();
            return false;
        }
        return true;
    }

    // ================================
    // 13. ALERTA DE LÍMITE DE PESTAÑAS
    // ================================
    function mostrarAlertaLimitePestañas() {
        const alerta = document.createElement('div');
        alerta.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px 20px;
            border-radius: 3px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: var(--fuente-principal);
            font-size: 14px;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        alerta.innerHTML = `
            <strong>Límite de pestañas alcanzado</strong><br>
            Máximo ${MAX_PESTAÑAS} pestañas permitidas.<br>
            Cierre alguna pestaña antes de abrir una nueva.
        `;
        
        document.body.appendChild(alerta);
        
        // Auto-eliminar la alerta después de 5 segundos
        setTimeout(() => {
            if (alerta.parentNode) {
                alerta.parentNode.removeChild(alerta);
            }
        }, 5000);
    }

    // ================================
    // 14. GENERACIÓN DE CONTENIDO PARA PESTAÑAS
    // ================================
    function generarContenidoPestaña(nombreModulo, archivoHTML) {
        // Si hay archivo HTML específico, cargarlo en iframe
        if (archivoHTML) {
            return `
                <div class="contenido-pestana">
                    <iframe src="${archivoHTML}" frameborder="0" style="width: 100%; height: 100%;"></iframe>
                </div>
            `;
        } else {
            // Contenido placeholder para módulos en desarrollo
            return `
                <div class="contenido-pestana modulo-desarrollo">
                    <div class="icono-desarrollo">🚧</div>
                    <h3>${nombreModulo}</h3>
                    <p>Este módulo está en desarrollo y estará disponible pronto.</p>
                    <div class="acciones-desarrollo">
                        <button class="btn btn-primary" onclick="simularFuncionalidad('${nombreModulo}')">
                            Simular Función
                        </button>
                        <button class="btn btn-outline" onclick="cerrarPestañaDesdeJS('${pestañaActiva}')">
                            Cerrar Pestaña
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // ================================
    // 15. INTERFAZ DE USUARIO PARA PESTAÑAS
    // ================================
    function agregarPestañaUI(pestaña) {
        // Asegurar que el contenedor de pestañas existe
        let contenedorPestañas = document.getElementById('contenedorPestañas');
        if (!contenedorPestañas) {
            contenedorPestañas = document.createElement('div');
            contenedorPestañas.id = 'contenedorPestañas';
            contenedorPestañas.className = 'sistema-pestañas';
            
            // Insertar después del content-area
            const contentArea = document.querySelector('.content-area');
            if (contentArea) {
                contentArea.parentNode.insertBefore(contenedorPestañas, contentArea.nextSibling);
            }
        }
        
        // Crear barra de pestañas si no existe
        const barraPestañas = document.querySelector('.barra-pestañas') || crearBarraPestañas(contenedorPestañas);
        
        // Crear elemento de pestaña en la barra
        const elementoPestaña = document.createElement('div');
        elementoPestaña.className = 'pestana';
        elementoPestaña.dataset.pestanaId = pestaña.id;
        elementoPestaña.innerHTML = `
            <span class="nombre-pestana">${pestaña.nombre}</span>
            <button class="btn-cerrar-pestana" onclick="cerrarPestañaDesdeJS('${pestaña.id}')">×</button>
        `;
        
        // Configurar evento click para activar pestaña (excepto en botón cerrar)
        elementoPestaña.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn-cerrar-pestana')) {
                activarPestaña(pestaña.id);
            }
        });
        
        barraPestañas.appendChild(elementoPestaña);
        
        // Crear área de contenido si no existe
        const areaContenido = document.querySelector('.area-contenido-pestañas') || crearAreaContenido(contenedorPestañas);
        
        // Crear contenido de pestaña
        const contenidoPestaña = document.createElement('div');
        contenidoPestaña.className = 'contenido-pestana-container';
        contenidoPestaña.id = `contenido-${pestaña.id}`;
        contenidoPestaña.style.display = 'none'; // Oculto inicialmente
        contenidoPestaña.innerHTML = pestaña.contenido;
        
        areaContenido.appendChild(contenidoPestaña);
    }

    // ================================
    // 16. FUNCIONES AUXILIARES PARA CREACIÓN DE UI
    // ================================
    function crearBarraPestañas(contenedor) {
        const barraPestañas = document.createElement('div');
        barraPestañas.className = 'barra-pestañas';
        contenedor.appendChild(barraPestañas);
        return barraPestañas;
    }

    function crearAreaContenido(contenedor) {
        const areaContenido = document.createElement('div');
        areaContenido.className = 'area-contenido-pestañas';
        contenedor.appendChild(areaContenido);
        return areaContenido;
    }

    // ================================
    // 17. ACTIVACIÓN DE PESTAÑAS
    // ================================
    function activarPestaña(pestañaId) {
        // Desactivar pestaña actual
        document.querySelectorAll('.pestana.activa').forEach(p => p.classList.remove('activa'));
        document.querySelectorAll('.contenido-pestana-container').forEach(c => c.style.display = 'none');
        
        // Activar nueva pestaña
        const pestañaElemento = document.querySelector(`[data-pestana-id="${pestañaId}"]`);
        const contenidoElemento = document.getElementById(`contenido-${pestañaId}`);
        
        if (pestañaElemento && contenidoElemento) {
            pestañaElemento.classList.add('activa');
            contenidoElemento.style.display = 'block';
            pestañaActiva = pestañaId;
        }
    }

    // ================================
    // 18. CONTROL DE VISIBILIDAD DEL CONTENIDO
    // ================================
    function actualizarVisibilidadContenido() {
        const tienePestañas = pestañasAbiertas.length > 0;
        
        // Controlar mensaje de bienvenida
        if (welcomeMessage) {
            if (tienePestañas) {
                welcomeMessage.classList.add('oculto');
            } else {
                welcomeMessage.classList.remove('oculto');
            }
        }
        
        // Controlar sistema de pestañas
        if (contenedorPestañas) {
            if (tienePestañas) {
                contenedorPestañas.classList.add('visible');
            } else {
                contenedorPestañas.classList.remove('visible');
            }
        }
        
        // Controlar barra de herramientas
        if (barraHerramientas) {
            if (tienePestañas) {
                barraHerramientas.classList.add('visible');
            } else {
                barraHerramientas.classList.remove('visible');
            }
        }
        
        // Controlar content-area
        if (contentArea) {
            if (tienePestañas) {
                contentArea.style.height = '0';
                contentArea.style.overflow = 'hidden';
            } else {
                contentArea.style.height = '';
                contentArea.style.overflow = '';
            }
        }
        
        console.log('👀 Estado visibilidad - Pestañas:', pestañasAbiertas.length);
    }

    // ================================
    // 19. FUNCIONES GLOBALES ACCESIBLES DESDE HTML
    // ================================
    window.cerrarPestañaDesdeJS = function(pestañaId) {
        cerrarPestaña(pestañaId);
    };

    window.simularFuncionalidad = function(modulo) {
        alert(`🎯 Función simulada para: ${modulo}\n\nEn una implementación real, aquí estaría la funcionalidad completa del módulo.`);
    };

    // ================================
    // 20.5 FUNCIÓN GUARDAR ESTADO COMPLETO - FALTANTE (AGREGAR)
    // ================================
    function guardarEstadoCompleto() {
        const estadoCompleto = {
            pestañasAbiertas: pestañasAbiertas,
            pestañaActiva: pestañaActiva,
            menusExpandidos: obtenerEstadoMenus()
        };
        
        sessionStorage.setItem('estadoSistemaCompleto', JSON.stringify(estadoCompleto));
        console.log('💾 Estado guardado:', estadoCompleto);
    }

    // ================================
    // 20. CERRADO DE PESTAÑAS
    // ================================
    function cerrarPestaña(pestañaId) {
        const pestañaACerrar = pestañasAbiertas.find(p => p.id === pestañaId);
        if (!pestañaACerrar) return;
        
        console.log('🗑️ Cerrando pestaña:', pestañaACerrar.nombre);
        
        // Remover del array de pestañas abiertas
        pestañasAbiertas = pestañasAbiertas.filter(p => p.id !== pestañaId);
        
        // Remover elementos del DOM
        const pestañaElemento = document.querySelector(`[data-pestana-id="${pestañaId}"]`);
        const contenidoElemento = document.getElementById(`contenido-${pestañaId}`);
        
        if (pestañaElemento) pestañaElemento.remove();
        if (contenidoElemento) contenidoElemento.remove();
        
        // Si era la pestaña activa, activar otra o limpiar
        if (pestañaActiva === pestañaId) {
            if (pestañasAbiertas.length > 0) {
                // Activar la última pestaña
                activarPestaña(pestañasAbiertas[pestañasAbiertas.length - 1].id);
            } else {
                pestañaActiva = null;
            }
        }
        
        // ACTUALIZAR VISIBILIDAD - Mostrar bienvenida si no hay pestañas
        actualizarVisibilidadContenido();
        
        // GUARDAR ESTADO INMEDIATAMENTE AL CERRAR
        guardarEstadoCompleto(); // ✅ ESTA LLAMADA AHORA FUNCIONARÁ
    }

    // ================================
    // 21.5 FUNCIÓN OBTENER ESTADO MENUS - FALTANTE (AGREGAR)
    // ================================
    function obtenerEstadoMenus() {
        const estado = {};
        document.querySelectorAll('.module-header').forEach(header => {
            const submenu = header.nextElementSibling;
            if (submenu && submenu.classList.contains('submenu')) {
                const moduloId = header.closest('.module-group').dataset.module;
                estado[moduloId] = submenu.classList.contains('open'); // ✅ CORRECTO: usa 'open'
            }
        });
        return estado;
    }

    // ================================
    // 21. PERSISTENCIA COMPLETA DEL SISTEMA - SIN PARPADEO
    // ================================
    function inicializarPersistenciaCompleta() {
        const pantallaCarga = document.getElementById('pantallaCarga');
        
        // Mostrar pantalla de carga inmediatamente
        if (pantallaCarga) {
            pantallaCarga.classList.remove('oculto');
        }

        // Función para cargar TODO el estado SIN PARPADEO
        function cargarEstadoCompleto() {
            return new Promise((resolve) => {
                try {
                    const guardado = sessionStorage.getItem('estadoSistemaCompleto');
                    
                    if (guardado) {
                        const estado = JSON.parse(guardado);
                        
                        // 1. CARGAR PESTAÑAS PRIMERO
                        if (estado.pestañasAbiertas && estado.pestañasAbiertas.length > 0) {
                            pestañasAbiertas = estado.pestañasAbiertas;
                            pestañaActiva = estado.pestañaActiva;
                            
                            // Recrear TODAS las pestañas
                            estado.pestañasAbiertas.forEach(pestaña => {
                                recrearPestañaCompleta(pestaña);
                            });
                        }
                        
                        // 2. CARGAR MENÚS EXPANDIDOS DESPUÉS
                        if (estado.menusExpandidos) {
                            aplicarEstadoMenus(estado.menusExpandidos);
                        }
                        
                        // 3. ACTUALIZAR VISIBILIDAD INMEDIATAMENTE
                        actualizarVisibilidadContenido();
                        
                        console.log('✅ Sistema restaurado sin parpadeo');
                    }
                    
                    resolve();
                } catch (error) {
                    console.error('❌ Error cargando estado:', error);
                    sessionStorage.removeItem('estadoSistemaCompleto');
                    resolve();
                }
            });
        }

        // Función para recrear una pestaña completamente
        function recrearPestañaCompleta(pestaña) {
            let contenedorPestañas = document.getElementById('contenedorPestañas');
            if (!contenedorPestañas) {
                contenedorPestañas = document.createElement('div');
                contenedorPestañas.id = 'contenedorPestañas';
                contenedorPestañas.className = 'sistema-pestañas';
                
                const contentArea = document.querySelector('.content-area');
                if (contentArea) {
                    contentArea.parentNode.insertBefore(contenedorPestañas, contentArea.nextSibling);
                }
            }
            
            const barraPestañas = document.querySelector('.barra-pestañas') || crearBarraPestañas(contenedorPestañas);
            
            const elementoPestaña = document.createElement('div');
            elementoPestaña.className = 'pestana';
            elementoPestaña.dataset.pestanaId = pestaña.id;
            elementoPestaña.innerHTML = `
                <span class="nombre-pestana">${pestaña.nombre}</span>
                <button class="btn-cerrar-pestana" onclick="cerrarPestañaDesdeJS('${pestaña.id}')">×</button>
            `;
            
            elementoPestaña.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-cerrar-pestana')) {
                    activarPestaña(pestaña.id);
                }
            });
            
            barraPestañas.appendChild(elementoPestaña);
            
            const areaContenido = document.querySelector('.area-contenido-pestañas') || crearAreaContenido(contenedorPestañas);
            
            const contenidoPestaña = document.createElement('div');
            contenidoPestaña.className = 'contenido-pestana-container';
            contenidoPestaña.id = `contenido-${pestaña.id}`;
            contenidoPestaña.style.display = 'none';
            contenidoPestaña.innerHTML = pestaña.contenido || generarContenidoPestaña(pestaña.nombre, pestaña.archivo);
            
            areaContenido.appendChild(contenidoPestaña);
        }

        // Función para aplicar estado de menús
        function aplicarEstadoMenus(estadoMenus) {
            Object.keys(estadoMenus).forEach(moduloId => {
                if (estadoMenus[moduloId]) {
                    const moduleGroup = document.querySelector(`[data-module="${moduloId}"]`);
                    if (moduleGroup) {
                        const header = moduleGroup.querySelector('.module-header');
                        const submenu = moduleGroup.querySelector('.submenu');
                        const arrow = header.querySelector('.module-arrow');
                        
                        if (submenu) {
                            submenu.classList.add('open'); // ✅ CORRECTO: usa 'open'
                            header.classList.add('active');
                            if (arrow) arrow.classList.add('rotated');
                        }
                    }
                }
            });
        }

        // Configurar eventos de guardado automático
        function configurarAutoGuardado() {
            window.addEventListener('beforeunload', guardarEstadoCompleto);
            
            const originalAbrirPestaña = abrirPestañaInterna;
            abrirPestañaInterna = function(...args) {
                const resultado = originalAbrirPestaña.apply(this, args);
                setTimeout(guardarEstadoCompleto, 100);
                return resultado;
            };
            
            document.addEventListener('click', function(e) {
                if (e.target.closest('.module-header')) {
                    setTimeout(guardarEstadoCompleto, 100);
                }
            });
        }

        // Inicializar persistencia SIN PARPADEO
        setTimeout(async () => {
            await cargarEstadoCompleto();
            configurarAutoGuardado();
            
            // OCULTAR PANTALLA DE CARGA SUAVEMENTE
            if (pantallaCarga) {
                setTimeout(() => {
                    pantallaCarga.classList.add('oculto');
                    // Remover del DOM después de la animación
                    setTimeout(() => {
                        if (pantallaCarga.parentNode) {
                            pantallaCarga.parentNode.removeChild(pantallaCarga);
                        }
                    }, 500);
                }, 500);
            }
            
            // ACTIVAR PESTAÑA DESPUÉS DE TODO ESTÉ LISTO
            if (pestañaActiva) {
                setTimeout(() => {
                    activarPestaña(pestañaActiva);
                }, 300);
            }
        }, 300);
    }

    // ================================
    // 22. INICIALIZACIÓN FINAL DEL SISTEMA
    // ================================
    
    // Agregar estilos CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .module-header.active { 
            background-color: var(--color-primario-oscuro) !important; 
        }
        
        .module-arrow.rotated { 
            transform: rotate(90deg) !important; 
        }
        
        .submenu.open { 
            display: block !important; 
        }
        
        /* Asegurar que el sistema de pestañas sea visible cuando hay pestañas */
        .sistema-pestañas.visible {
            display: block !important;
        }
        
        .barra-herramientas.visible {
            display: flex !important;
        }
    `;
    document.head.appendChild(style);
    
    // Inicializar la aplicación cuando el DOM esté listo
    inicializar();
});