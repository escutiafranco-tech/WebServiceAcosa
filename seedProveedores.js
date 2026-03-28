const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'Database', 'acosa_local.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
  
  console.log('✓ Conectado a SQLite');
  
  // Insertar proveedores de prueba
  const proveedores = [
    ['PROV-00001', 'PROV001', 'Distribuidora TLV', 'RFC001234567', 'Calle Principal 123, México', 1, new Date().toISOString()],
    ['PROV-00002', 'PROV002', 'Suministros Industriales XYZ', 'RFC987654321', 'Avenida Reforma 456, CDMX', 1, new Date().toISOString()],
    ['PROV-00003', 'PROV003', 'Transporte y Logística Plus', 'RFC555666777', 'Boulevard López Portillo 789, Monterrey', 1, new Date().toISOString()],
    ['PROV-00004', 'PROV004', 'Empaque Especializado SA', 'RFC888999000', 'Carretera Federal 200, Guadalajara', 0, new Date().toISOString()],
    ['PROV-00005', 'PROV005', 'Servicios Aduanales América', 'RFC111222333', 'Puerto de Veracruz, Veracruz', 1, new Date().toISOString()],
    ['PROV-00006', 'PROV006', 'Control de Calidad Express', 'RFC444555666', 'Zona Industrial Sur, Querétaro', 0, new Date().toISOString()]
  ];
  
  const sql = 'INSERT INTO TBL_PROV_DFISCALES (id, codigo, nombre, rfc, direccion, activo, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?)';
  
  db.serialize(() => {
    let count = 0;
    proveedores.forEach(prov => {
      db.run(sql, prov, (err) => {
        if (err) {
          console.error('Error insertando proveedor:', err.message);
        } else {
          count++;
          console.log(`  ✓ ${prov[2]}`);
        }
        
        if (count === proveedores.length) {
          console.log(`\n✓ Total: ${count} proveedores cargados en la BD\n`);
          db.close();
        }
      });
    });
  });
});
