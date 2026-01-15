const https = require('https');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/proveedores',
  method: 'GET',
  rejectUnauthorized: false
};

const req = https.request(options, (res) => {
  let data = '';
  console.log('STATUS:', res.statusCode);
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('BODY:', data);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();
