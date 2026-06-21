// PM2 ecosystem config. Use .cjs extension because package.json has "type": "module".
// Usage: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'troubadour',
    script: 'server/index.js',
    interpreter: 'node',
    watch: false,
    autorestart: true,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
    },
  }],
}
