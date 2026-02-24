const fs = require('fs');
const path = require('path');

const root = process.cwd();
const mapping = {
  '01 Backend': [
    'server.js',
    'routes',
    'controllers',
    '01 controllers',
    '04 controllers',
    '05 routes',
    'backend'
  ],
  '02 Frontend': [
    'public',
    'frontend',
    'modules',
    'public/js',
    'public/css'
  ],
  '03 DataBase': [
    'DataBase',
    'data_base',
    '03 data',
    'data'
  ],
  '04 Scripts': [
    'scripts',
    'Scripts de mantenimiento',
    'create-db.js',
    'create-db-odbc.js',
    'get-proveedores.js'
  ],
  '05 Config': [
    '.env',
    '.env.example',
    'certs',
    '02 certs',
    'Configuración'
  ]
};

const plan = [];
for (const [target, items] of Object.entries(mapping)) {
  for (const it of items) {
    const src = path.join(root, it);
    if (fs.existsSync(src)) {
      plan.push({ src, destDir: path.join(root, target) });
    }
  }
}

console.log('Plan de reorganización (dry-run). No se han movido archivos.');
for (const p of plan) console.log('-', p.src, '->', p.destDir);

console.log('\nPara ejecutar el movimiento real, vuelve a ejecutar con:');
console.log('  node restructure.js --apply');

if (process.argv.includes('--apply')) {
  console.log('\nAplicando cambios...');
  for (const p of plan) {
    const baseName = path.basename(p.src);
    const dest = path.join(p.destDir, baseName);
    try {
      if (!fs.existsSync(p.destDir)) fs.mkdirSync(p.destDir, { recursive: true });
      // mover (rename) si no existe el destino
      if (!fs.existsSync(dest)) {
        fs.renameSync(p.src, dest);
        console.log('Movido:', p.src, '->', dest);
      } else {
        console.log('Omitido (destino existe):', dest);
      }
    } catch (e) {
      console.error('Error moviendo', p.src, e.message);
    }
  }
  console.log('Reorganización completada. Revisa y actualiza rutas/require si es necesario.');
}
