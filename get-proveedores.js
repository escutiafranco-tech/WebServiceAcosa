const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/proveedores',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  console.log('STATUS:', res.statusCode);
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      console.log('BODY:', data);
    } catch (e) {
      console.error('Error parsing response:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();
