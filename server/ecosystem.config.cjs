module.exports = {
  apps: [
    {
      name: 'dsl-blog-api',
      cwd: __dirname,
      script: 'dist/src/index.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
