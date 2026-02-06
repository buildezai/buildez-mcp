module.exports = {
  apps: [
    {
      name: 'buildez-mcp',
      script: 'dist/index.js',
      cwd: '/var/www/html/mcp-server',
      env: {
        NODE_ENV: 'production',
        BUILDEZ_API_URL: 'http://localhost:3000',
        MCP_MODE: 'http',
        MCP_PORT: '3001'
      },
      autorestart: true,
      watch: false,
    }
  ]
};
