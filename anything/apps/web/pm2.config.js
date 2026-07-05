/**
 * PM2 Configuration — Production Process Manager
 *
 * React Router app with Hono server backend
 *
 * Run with:
 *   npm run build
 *   pm2 start pm2.config.js
 *   pm2 save
 *   pm2 startup   ← follow the printed command to enable auto-start on reboot
 *
 * Fork mode (NOT cluster) because Node.js app already handles internal
 * request routing. Cluster mode would duplicate routes and cause conflicts.
 *
 * Instance count:
 *   - 1 instance per 1-2 vCPU (recommended for IO-heavy API services)
 *   - Set INSTANCES env var to override (e.g. INSTANCES=2 pm2 start pm2.config.js)
 */

const instances = parseInt(process.env.INSTANCES ?? "1", 10);

module.exports = {
  apps: [
    {
      name: "platformhq-web",
      script: "node_modules/.bin/react-router",
      args: "serve",
      cwd: "./apps/web",
      instances,
      exec_mode: "fork",
      watch: false, // Never watch in production — use CI/CD deploy
      max_memory_restart: "512M", // Restart if process exceeds 512MB (memory leak guard)

      // Environment — override via .env.production or pm2 ecosystem
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      // Logging
      out_file: "./logs/pm2-out.log",
      error_file: "./logs/pm2-err.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Crash recovery
      exp_backoff_restart_delay: 100, // Exponential back-off on crash (100ms → 1.6s max)
      min_uptime: "5s", // If it crashes within 5s, count as abnormal exit
      max_restarts: 10, // Stop restarting after 10 consecutive crashes

      // Graceful shutdown — allow in-flight requests to complete
      kill_timeout: 5000, // ms to wait for SIGINT handling before SIGKILL
      listen_timeout: 10000, // ms to wait for app to start listening
    },
  ],
};
