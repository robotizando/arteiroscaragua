// Os caminhos partem deste arquivo, para cada processo rodar na pasta real da release.
const path = require('path');

const root = path.resolve(__dirname, '..');
const next = 'node_modules/next/dist/bin/next';

const base = {
  exec_mode: 'fork',
  instances: 1,
  autorestart: true,
  max_restarts: 10,
  min_uptime: '10s',
  kill_timeout: 5000,
  time: true,
};

module.exports = {
  apps: [
    {
      ...base,
      name: 'arteiros-api',
      cwd: path.join(root, 'apps/backend'),
      script: 'dist/index.js',
      // Uploads ficam em memória (até ~24 MB por requisição).
      max_memory_restart: '600M',
      env: { NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '4001' },
    },
    {
      ...base,
      name: 'arteiros-admin',
      cwd: path.join(root, 'apps/admin'),
      script: next,
      args: 'start -H 127.0.0.1 -p 4002',
      max_memory_restart: '400M',
      env: { NODE_ENV: 'production' },
    },
    {
      ...base,
      name: 'arteiros-site',
      cwd: path.join(root, 'apps/frontend'),
      script: next,
      args: 'start -H 127.0.0.1 -p 4003',
      max_memory_restart: '400M',
      env: { NODE_ENV: 'production', API_URL: 'http://127.0.0.1:4001' },
    },
  ],
};
