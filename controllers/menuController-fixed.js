system/const menusData = require('../data/system/menus.json');

const getMenusByRole = (req, res) => {
  try {
    console.log('🔍 Usuario:', req.user);
    const userRole = req.user.role;
    console.log('🎯 Rol del usuario:', userRole);
    
    const filteredModules = menusData.map(module => {
      console.log('📦 Procesando módulo:', module.module);
      
      const filteredMenus = module.menus.filter(menu => {
        console.log('   🪟 Menú:', menu.name, '- Roles:', menu.roles);
        return menu.roles && menu.roles.includes(userRole);
      });
      
      if (filteredMenus.length > 0) {
        return {
          module: module.module,
          menus: filteredMenus
        };
      }
      return null;
    }).filter(module => module !== null);

    console.log('✅ Módulos filtrados:', filteredModules);
    res.json(filteredModules);
    
  } catch (error) {
    console.error('❌ Error en menuController:', error);
    res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
};

module.exports = { getMenusByRole };