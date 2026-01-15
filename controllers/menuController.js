const menusData = require('../data/system/menus.json');

/**
 * getMenusByRole
 * - Filtra la estructura de menús por el rol del usuario (`req.user.role`).
 * - Devuelve solo los módulos que contienen al menos un menú visible para el rol.
 *
 * Nota: hay `console.log` de depuración incluidos para facilitar pruebas.
 * Cuando termines de depurar, puedes quitar los `console.log` para dejar el archivo limpio.
 */
const getMenusByRole = (req, res) => {
  try {
    // Registrar información del usuario (útil para depuración)
    console.log('🔍 Usuario:', req.user);

    // Obtener el rol del usuario desde el middleware de autenticación
    const userRole = req.user.role;
    console.log('🎯 Rol del usuario:', userRole);

    // Recorremos cada módulo del JSON de menús
    const filteredModules = menusData.map(module => {
      console.log('📦 Procesando módulo:', module.module);

      // Filtrar los menús del módulo para quedarnos solo con los que contienen el rol
      const filteredMenus = module.menus.filter(menu => {
        // Mostrar información del menú y sus roles (debug)
        console.log('   🪟 Menú:', menu.name || menu.title || menu.label, '- Roles:', menu.roles);
        // Devolver true solo si `roles` existe y contiene el rol del usuario
        return menu.roles && menu.roles.includes(userRole);
      });

      // Si el módulo tiene al menos un menú visible para el rol, lo retornamos
      if (filteredMenus.length > 0) {
        return {
          module: module.module, // Nombre del módulo
          menus: filteredMenus    // Menús filtrados por rol
        };
      }
      // Si no hay menús visibles, devolvemos null para filtrar luego
      return null;
    })
    // Eliminar entradas nulas (módulos sin menús para el rol)
    .filter(module => module !== null);

    console.log('✅ Módulos filtrados:', filteredModules);
    // Enviar la respuesta con los módulos filtrados
    res.json(filteredModules);
  } catch (error) {
    // En caso de error, registrar y devolver error 500 con mensaje
    console.error('❌ Error al obtener menús:', error);
    res.status(500).json({ error: 'Error interno del servidor: ' + (error && error.message ? error.message : '') });
  }
};

module.exports = { getMenusByRole };