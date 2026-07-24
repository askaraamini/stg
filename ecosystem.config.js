module.exports = {
  apps: [
    {
      name: "aksaraa",
      cwd: "/home/askaraa/app",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "whatsapp",
      cwd: "/home/askaraa/app/whatsapp-service",
      script: "index.js",
      interpreter: "node",
    },
    {
      name: "whatsapp-cron",
      cwd: "/home/askaraa/app/whatsapp-service",
      script: "cron.js",
      interpreter: "node",
    },
  ],
};
