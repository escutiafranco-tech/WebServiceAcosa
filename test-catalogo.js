const https = require('https');

function reqOptions(path, method='GET', data=null) {
  const opts = {
    hostname: 'localhost',
    port: 3001,
    path,
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    rejectUnauthorized: false
  };
  return { opts, data };
}

function doRequest(path, method='GET', body=null) {
  return new Promise((resolve, reject) => {
    const { opts } = reqOptions(path, method, body);
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', (e) => reject(e));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async ()=>{
  try {
    console.log('1) GET /api/catalogo/servicios');
    const cat = await doRequest('/api/catalogo/servicios');
    console.log(cat.status, cat.body);
    const first = Array.isArray(cat.body) && cat.body[0] ? cat.body[0] : null;
    if (!first) return console.log('No hay catálogo disponible.');

    console.log('\n2) Crear proveedor de prueba via API');
    const prov = { id: 'prov-test-1', codigo: 'PT1', nombre: 'Proveedor Test 1', rfc: 'RFCTEST1', direccion: 'Dir Test', activo: true, fecha_registro: '2026-01-14' };
    const createProv = await doRequest('/api/proveedores', 'POST', prov);
    console.log('CREAR PROV =>', createProv.status, createProv.body);

    console.log('\n3) Añadir servicio al proveedor con catalogo_id =', first.id);
    const svc = { servicio: first.submodulo || ('SERV:' + first.id), descripcion: 'Servicio para ' + first.submodulo, catalogo_id: first.id };
    const addSvc = await doRequest(`/api/proveedores/${prov.id}/servicios`, 'POST', svc);
    console.log('ADD SVC =>', addSvc.status, addSvc.body);

    console.log('\n4) GET /api/proveedores/por-servicio/:catalogoId');
    const list = await doRequest(`/api/proveedores/por-servicio/${first.id}`);
    console.log('LIST =>', list.status, list.body);

  } catch (e) { console.error('Error test:', e.message); }
})();
