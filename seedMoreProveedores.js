/**
 * Script para insertar 20 proveedores adicionales de prueba en la BD
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'Database', 'acosa_local.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar BD:', err.message);
    process.exit(1);
  }
  console.log('✓ Conectado a acosa_local.db');
});

const proveedores = [
  { codigo: 'PROV007', nombre: 'Acero y Metales SA', rfc: 'RFC111111111', direccion: 'Carretera Central km 20, Monterrey' },
  { codigo: 'PROV008', nombre: 'Químicos Industriales ABC', rfc: 'RFC222222222', direccion: 'Parque Industrial Sur, Guadalajara' },
  { codigo: 'PROV009', nombre: 'Electrónica Profesional Ltd', rfc: 'RFC333333333', direccion: 'Zona Franca, Puerto de Veracruz' },
  { codigo: 'PROV010', nombre: 'Textiles Premium Import', rfc: 'RFC444444444', direccion: 'Parque Tecnológico, Querétaro' },
  { codigo: 'PROV011', nombre: 'Distribuidora Global Express', rfc: 'RFC555555555', direccion: 'Terminal de Carga, Leon' },
  { codigo: 'PROV012', nombre: 'Equipos Pesados y Maquinaria', rfc: 'RFC666666666', direccion: 'Corredor Industrial, Toluca' },
  { codigo: 'PROV013', nombre: 'Plásticos y Polímeros SA', rfc: 'RFC777777777', direccion: 'Parque Eco Industrial, Bajío' },
  { codigo: 'PROV014', nombre: 'Servicios Logísticos Integrados', rfc: 'RFC888888888', direccion: 'Centro Logístico, Irapuato' },
  { codigo: 'PROV015', nombre: 'Insumos Farmacéuticos Importados', rfc: 'RFC999999999', direccion: 'Bodega Central, Monterrey' },
  { codigo: 'PROV016', nombre: 'Empaque y Embalajes Premium', rfc: 'RFC101010101', direccion: 'Polígono Industrial, Aguascalientes' },
  { codigo: 'PROV017', nombre: 'Distribuidora de Alimentos Export', rfc: 'RFC111111112', direccion: 'Centro de Distribución, Torreón' },
  { codigo: 'PROV018', nombre: 'Tecnología y Software Solutions', rfc: 'RFC121212121', direccion: 'Edificio Tech Park, Nuevo Leon' },
  { codigo: 'PROV019', nombre: 'Materia Prima Industrial General', rfc: 'RFC131313131', direccion: 'Zona Industrial 2, Saltillo' },
  { codigo: 'PROV020', nombre: 'Componentes Automotrices Premium', rfc: 'RFC141414141', direccion: 'Parque Automotriz, Puebla' },
  { codigo: 'PROV021', nombre: 'Servicios Especializados SA', rfc: 'RFC151515151', direccion: 'Blvd Corporativo, Hermosillo' },
  { codigo: 'PROV022', nombre: 'Importación y Exportación Global', rfc: 'RFC161616161', direccion: 'Aduana Industrial, Juárez' },
  { codigo: 'PROV023', nombre: 'Construcción y Materiales para Obra', rfc: 'RFC171717171', direccion: 'Centro de Abastos, Morelia' },
  { codigo: 'PROV024', nombre: 'Sistemas de Energía Renovable', rfc: 'RFC181818181', direccion: 'Parque Sustentable, Mérida' },
  { codigo: 'PROV025', nombre: 'Consultoría Empresarial Integral', rfc: 'RFC191919191', direccion: 'Torre Corporativa, CDMX' },
  { codigo: 'PROV026', nombre: 'Distribuidora Regional Zona Noreste', rfc: 'RFC202020202', direccion: 'Almacén Central, Monterrey' }
];

const sql = `
  INSERT INTO TBL_PROV_DFISCALES (CODIGO, NOMBRE, RFC, DIRECCION, ACTIVO, FECHA_REGISTRO)
  VALUES (?, ?, ?, ?, ?, datetime('now'))
`;

let count = 0;
db.serialize(() => {
  proveedores.forEach((prov, index) => {
    const activo = index % 2 === 0 ? 1 : 0; // Alternancia activos/inactivos
    db.run(sql, [prov.codigo, prov.nombre, prov.rfc, prov.direccion, activo], (err) => {
      if (err) {
        console.error(`✗ Error insertando ${prov.codigo}:`, err.message);
      } else {
        console.log(`✓ Insertado: ${prov.codigo}`);
        count++;
      }
    });
  });

  // Cerrar BD después de las inserciones
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error('Error al cerrar BD:', err.message);
      } else {
        console.log(`\n✅ Completado: ${count} de ${proveedores.length} proveedores insertados`);
      }
    });
  }, 1000);
});
