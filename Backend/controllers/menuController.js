/* ================================ */
/* 1. DEPENDENCIAS Y CARGA DE MENÚ */
/* ================================ */

const fs = require('fs');              // Módulo nativo para trabajar con el sistema de archivos
const path = require('path');          // Módulo nativo para trabajar con rutas

let menusData; // Variable donde se almacenará el arreglo de módulos/menús leídos desde el JSON
const menusPath = path.join(__dirname, '..', 'system', 'menus.json'); // Ruta absoluta a menus.json dentro de Backend/system

try {
  // Verificamos que el archivo exista físicamente
  if (fs.existsSync(menusPath)) {
    menusData = require(menusPath);    // Cargamos el JSON a memoria (se cachea en require)
  } else {
    console.error('menus.json no encontrado en', menusPath); // Log de error si no existe
    menusData = [];                                          // Dejamos un arreglo vacío para evitar fallos
  }
} catch (e) {
  // Si ocurre un error al leer o parsear el archivo, lo registramos y seguimos con []
  console.error('Error cargando menus.json desde', menusPath, e.message);
  menusData = [];
}

/* ================================ */
/* 2. CONTROLADOR: MENÚS POR ROL   */
/* ================================ */

// getMenusByRole
// - Usa el rol almacenado en req.user (inyectado por el middleware de autenticación)
// - Filtra la estructura de menús para regresar sólo lo que aplica a ese rol
const getMenusByRole = (req, res) => {
  try {
    
    console.log('🔍 Usuario:', req.user); // Información del usuario para depuración
    const userRole = req.user.role; // Rol del usuario autenticado (por ejemplo: 'Administrador', 'Operador', etc.)
    console.log('🎯 Rol del usuario:', userRole);
    const filteredModules = menusData // Recorremos cada módulo del JSON de menús
      .map((module) => {
        console.log('📦 Procesando módulo:', module.module);

        // Filtrar los menús de cada módulo según los roles permitidos
        const filteredMenus = module.menus.filter((menu) => {
          console.log(
            '   🪟 Menú:',
            menu.name || menu.title || menu.label,
            '- Roles:',
            menu.roles
          );

          // Aceptamos sólo menús que tengan propiedad "roles" y contengan el rol del usuario
          return menu.roles && menu.roles.includes(userRole);
        });

        // Si el módulo tiene al menos un menú permitido para el rol, lo mantenemos
        if (filteredMenus.length > 0) {
          return {
            module: module.module, // Nombre del módulo
            menus: filteredMenus   // Menús filtrados por rol
          };
        }

        // Si no hay menús visibles, devolvemos null para descartarlo más adelante
        return null;
      })
      // Eliminamos los módulos nulos (sin menús visibles para ese rol)
      .filter((module) => module !== null);

    console.log('✅ Módulos filtrados:', filteredModules);

    // Enviar respuesta al frontend con la estructura ya filtrada
    res.json(filteredModules);
  } catch (error) {
    // Manejo genérico de errores: log + respuesta 500
    console.error('❌ Error al obtener menús:', error);
    res.status(500).json({
      error:
        'Error interno del servidor: ' +
        (error && error.message ? error.message : '')
    });
  }
};

module.exports = { getMenusByRole }; // Exportamos el controlador para usarlo en la ruta /menus