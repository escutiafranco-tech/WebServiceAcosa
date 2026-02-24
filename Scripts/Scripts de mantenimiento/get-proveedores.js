// Script unificado para obtener proveedores via HTTP/HTTPS
// Uso: node get-proveedores.js [--https] [--host HOST] [--port PORT] [--path PATH] [--insecure]
const http = require('http');
const https = require('https');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { protocol: process.env.PROTO || 'http', host: 'localhost', port: 3001, path: '/api/proveedores', insecure: false };
  args.forEach((a, i) => {
    if (a === '--https') opts.protocol = 'https';
    if (a === '--http') opts.protocol = 'http';
    if (a === '--insecure') opts.insecure = true;
    if (a === '--host' && args[i+1]) opts.host = args[i+1];
    if (a === '--port' && args[i+1]) opts.port = Number(args[i+1]);
    if (a === '--path' && args[i+1]) opts.path = args[i+1];
    if (a === '--help' || a === '-h') {
      console.log('Uso: node get-proveedores.js [--https] [--host HOST] [--port PORT] [--path PATH] [--insecure]');
      process.exit(0);
    }
  });
  // normalize PROTO env var
  if (process.env.PROTO && process.env.PROTO.toLowerCase() === 'https') opts.protocol = 'https';
  return opts;
}

async function run() {
  const opts = parseArgs();
  const module = opts.protocol === 'https' ? https : http;

  const requestOptions = {
    hostname: opts.host,
    port: opts.port,
    path: opts.path,
    method: 'GET'
  };

  if (opts.protocol === 'https' && opts.insecure) {
    requestOptions.rejectUnauthorized = false;
  }

  const req = module.request(requestOptions, (res) => {
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
}

run();
