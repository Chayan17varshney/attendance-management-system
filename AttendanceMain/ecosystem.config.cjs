module.exports = {
  apps: [
    {
      name: "Attendance",
      script: "index.js",
      instances: "4",
      exec_mode: "cluster",
      env_file: ".env",
      autorestart: true,
      watch: true, // Enables watch mode
      ignore_watch: ["logs.txt", "node_modules", "logs","CleanLogs.txt","public","cleanedlogs"], 
    },
  ],
};
