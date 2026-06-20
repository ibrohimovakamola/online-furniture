/**
 * PM2 — auto-restart API on crash + boot persistence.
 *
 *   npm install -g pm2
 *   mkdir -p logs
 *   pm2 start pm2.config.cjs --env production
 *   pm2 save
 *   pm2 startup          # run the printed sudo command once
 *   pm2 logs mebel-api
 *   pm2 monit
 */
module.exports = {
  apps: [
    {
      name: 'mebel-api',
      cwd: './server',
      script: 'src/server.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        HOST: '127.0.0.1',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        HOST: '127.0.0.1',
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
    },
  ],
}
