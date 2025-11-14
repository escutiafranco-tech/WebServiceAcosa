const menusData = require('../data/system/menus.json');

const getMenusByRole = (req, res) => {
  try {
    const userRole = req.user.role;
    
    // FILTRO PARA LA NUEVA ESTRUCTURA
    const filteredModules = menusData.map(module => {
      const filteredMenus = module.menus.filter(menu => 
        menu.roles && menu.roles.includes(userRole)  // ← Agregué verificación
      );
      
      if (filteredMenus.length > 0) {
        return {
          module: module.module,  // ← Nueva estructura
          menus: filteredMenus
        };
      }
      return null;
    }).filter(module => module !== null);

    res.json(filteredModules);
  } catch (error) {
    console.error('Error al obtener menús:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getMenusByRole };